/**
 * Lotus Phase Research Analytics Engine
 *
 * Computes research-grade metrics from user cycle + lifestyle data:
 *   - Cycle Health Score (CHS): composite 0-100 wellness index
 *   - Cycle Regularity Index (CRI): coefficient-of-variation-based regularity
 *   - Prediction Mean Absolute Error (MAE): rolling-forecast accuracy
 *   - Symptom-Phase Correlation Matrix: symptom frequency by cycle phase
 *   - Mood-Phase Analysis: mean mood score per phase
 *
 * All computations are deterministic, client-side, and privacy-preserving.
 */

import type { Cycle, LogEntry, PCOSProfile } from "../store";
import type { Profile } from "../store";
import { predict, currentPhase } from "./prediction";
import { calculatePCOSRisk } from "./pcos";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HealthScoreBreakdown {
  total: number;           // 0-100
  regularity: number;      // 0-25
  lifestyle: number;       // 0-25
  dataCompleteness: number;// 0-25
  symptomBurden: number;   // 0-25
  label: "Excellent" | "Good" | "Fair" | "Needs Attention";
  color: string;
}

export interface CycleRegularityMetrics {
  mean: number;         // avg cycle length in days
  std: number;          // standard deviation
  cv: number;           // coefficient of variation (%)
  min: number;
  max: number;
  label: "Very Regular" | "Regular" | "Somewhat Irregular" | "Irregular";
  labelColor: string;
  streak: number;       // consecutive cycles within ±2 days of mean
}

export interface PredictionAccuracyResult {
  mae: number;          // mean absolute error (days)
  median: number;       // median absolute error (days)
  best: number;         // best prediction (days off)
  worst: number;        // worst prediction (days off)
  n: number;            // number of evaluated predictions
  accuracyPct: number;  // % of predictions within ±3 days
  grade: "A" | "B" | "C" | "D";
}

export interface SymptomPhaseData {
  symptom: string;
  menstrual: number;   // occurrences per logged day in phase
  follicular: number;
  ovulatory: number;
  luteal: number;
  total: number;
}

export interface MoodPhaseData {
  phase: string;
  avgScore: number;    // 1-5
  count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MOOD_SCORE: Record<string, number> = {
  happy: 5, energetic: 5, calm: 4, sad: 2, anxious: 2, irritable: 1,
};

function getCycleLengths(cycles: Cycle[]): number[] {
  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const lengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = Math.round(
      (new Date(sorted[i].startDate).getTime() - new Date(sorted[i - 1].startDate).getTime()) / 86_400_000,
    );
    if (gap > 10 && gap < 90) lengths.push(gap); // sanity filter
  }
  return lengths;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function getPhaseForDate(
  date: Date,
  cycles: Cycle[],
  profile: Profile,
): "menstrual" | "follicular" | "ovulatory" | "luteal" | null {
  const pred = predict(cycles, profile.avgCycleLength, profile.avgPeriodLength);
  const { phase } = currentPhase(date, pred, cycles);
  return phase;
}

// ─── 1. Cycle Health Score ────────────────────────────────────────────────────

export function calculateHealthScore(
  cycles: Cycle[],
  logs: Record<string, LogEntry>,
  profile: Profile,
  pcosProfile: PCOSProfile,
): HealthScoreBreakdown {
  const logArr = Object.values(logs);
  const lengths = getCycleLengths(cycles);

  // Component 1: Cycle Regularity (0-25)
  let regularity = 12; // default when not enough data
  if (lengths.length >= 2) {
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const cv = (stdDev(lengths) / mean) * 100;
    if (cv <= 3) regularity = 25;
    else if (cv <= 7) regularity = 20;
    else if (cv <= 12) regularity = 14;
    else if (cv <= 18) regularity = 8;
    else regularity = 3;
  }

  // Component 2: Lifestyle Adherence (0-25)
  const sleepLogs = logArr.filter((l) => l.sleepHrs != null && l.sleepHrs > 0);
  const waterLogs = logArr.filter((l) => l.waterCups != null && l.waterCups > 0);

  let sleepPts = 6; // default
  if (sleepLogs.length > 0) {
    const avg = sleepLogs.reduce((s, l) => s + (l.sleepHrs ?? 0), 0) / sleepLogs.length;
    sleepPts = avg >= 8 ? 12 : avg >= 7 ? 10 : avg >= 6 ? 6 : 2;
  }
  let waterPts = 6; // default
  if (waterLogs.length > 0) {
    const avg = waterLogs.reduce((s, l) => s + (l.waterCups ?? 0), 0) / waterLogs.length;
    waterPts = avg >= 8 ? 13 : avg >= 6 ? 10 : avg >= 4 ? 6 : 2;
  }
  const lifestyle = Math.min(25, sleepPts + waterPts);

  // Component 3: Data Completeness (0-25)
  const daysSinceFirst =
    cycles.length > 0
      ? Math.max(1, Math.floor((Date.now() - new Date(cycles[0].startDate).getTime()) / 86_400_000))
      : 1;
  const consistency = Math.min(1, logArr.length / Math.max(1, daysSinceFirst));
  const historyPts = cycles.length >= 6 ? 10 : cycles.length >= 4 ? 7 : cycles.length >= 2 ? 4 : 1;
  const dataCompleteness = Math.min(25, Math.round(consistency * 15) + historyPts);

  // Component 4: Symptom Burden (0-25)
  let symptomBurden = 12; // default
  if (logArr.length > 0) {
    const avgSymptoms = logArr.reduce((s, l) => s + (l.symptoms?.length ?? 0), 0) / logArr.length;
    symptomBurden = avgSymptoms <= 0.5 ? 25 : avgSymptoms <= 1.5 ? 20 : avgSymptoms <= 2.5 ? 15 : avgSymptoms <= 3.5 ? 10 : 5;
  }

  // PCOS penalty applied to regularity component
  if (Object.keys(pcosProfile.answers).length > 0) {
    const risk = calculatePCOSRisk(pcosProfile.answers);
    if (risk.risk === "high") regularity = Math.max(0, regularity - 4);
    else if (risk.risk === "moderate") regularity = Math.max(0, regularity - 2);
  }

  const total = Math.min(100, regularity + lifestyle + dataCompleteness + symptomBurden);

  const label =
    total >= 80 ? "Excellent" : total >= 60 ? "Good" : total >= 40 ? "Fair" : "Needs Attention";
  const color =
    total >= 80 ? "#4ade80" : total >= 60 ? "#a78bfa" : total >= 40 ? "#fbbf24" : "#f87171";

  return { total, regularity, lifestyle, dataCompleteness, symptomBurden, label, color };
}

// ─── 2. Cycle Regularity Index ────────────────────────────────────────────────

export function getCycleRegularityMetrics(cycles: Cycle[]): CycleRegularityMetrics | null {
  const lengths = getCycleLengths(cycles);
  if (lengths.length < 2) return null;

  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const std = stdDev(lengths);
  const cv = (std / mean) * 100;
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);

  let label: CycleRegularityMetrics["label"];
  let labelColor: string;
  if (cv <= 5) { label = "Very Regular"; labelColor = "#4ade80"; }
  else if (cv <= 10) { label = "Regular"; labelColor = "#a78bfa"; }
  else if (cv <= 18) { label = "Somewhat Irregular"; labelColor = "#fbbf24"; }
  else { label = "Irregular"; labelColor = "#f87171"; }

  // Streak: consecutive cycles within ±2 days of mean
  let streak = 0;
  for (let i = lengths.length - 1; i >= 0; i--) {
    if (Math.abs(lengths[i] - mean) <= 2) streak++;
    else break;
  }

  return {
    mean: Math.round(mean * 10) / 10,
    std: Math.round(std * 10) / 10,
    cv: Math.round(cv * 10) / 10,
    min,
    max,
    label,
    labelColor,
    streak,
  };
}

// ─── 3. Prediction Accuracy (Rolling Leave-One-Out) ───────────────────────────

export function getPredictionAccuracy(
  cycles: Cycle[],
  profile: Profile,
): PredictionAccuracyResult | null {
  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (sorted.length < 3) return null;

  const errors: number[] = [];
  for (let i = 2; i < sorted.length; i++) {
    const history = sorted.slice(0, i);
    const pred = predict(history, profile.avgCycleLength, profile.avgPeriodLength);
    if (!pred) continue;
    const actual = new Date(sorted[i].startDate);
    const error = Math.abs(
      Math.round((pred.nextPeriodStart.getTime() - actual.getTime()) / 86_400_000),
    );
    errors.push(error);
  }

  if (errors.length === 0) return null;

  const mae = errors.reduce((s, e) => s + e, 0) / errors.length;
  const sortedErr = [...errors].sort((a, b) => a - b);
  const median = sortedErr[Math.floor(sortedErr.length / 2)];
  const best = sortedErr[0];
  const worst = sortedErr[sortedErr.length - 1];
  const accuracyPct = Math.round((errors.filter((e) => e <= 3).length / errors.length) * 100);

  const grade: PredictionAccuracyResult["grade"] =
    mae <= 1.5 ? "A" : mae <= 3 ? "B" : mae <= 5 ? "C" : "D";

  return {
    mae: Math.round(mae * 10) / 10,
    median,
    best,
    worst,
    n: errors.length,
    accuracyPct,
    grade,
  };
}

// ─── 4. Symptom-Phase Correlation ─────────────────────────────────────────────

export function getSymptomPhaseCorrelation(
  cycles: Cycle[],
  logs: Record<string, LogEntry>,
  profile: Profile,
): SymptomPhaseData[] {
  if (cycles.length === 0) return [];

  // Count days logged per phase for normalization
  const phaseDays: Record<string, number> = {
    menstrual: 0, follicular: 0, ovulatory: 0, luteal: 0,
  };
  const symptomByPhase: Record<string, Record<string, number>> = {};

  for (const log of Object.values(logs)) {
    const date = new Date(log.date);
    const phase = getPhaseForDate(date, cycles, profile);
    if (!phase) continue;

    phaseDays[phase] = (phaseDays[phase] || 0) + 1;

    for (const symptom of log.symptoms ?? []) {
      if (!symptomByPhase[symptom]) {
        symptomByPhase[symptom] = { menstrual: 0, follicular: 0, ovulatory: 0, luteal: 0 };
      }
      symptomByPhase[symptom][phase] = (symptomByPhase[symptom][phase] || 0) + 1;
    }
  }

  return Object.entries(symptomByPhase)
    .map(([symptom, counts]) => {
      const norm = (phase: string) =>
        phaseDays[phase] > 0 ? Math.round((counts[phase] / phaseDays[phase]) * 100) : 0;
      return {
        symptom,
        menstrual: norm("menstrual"),
        follicular: norm("follicular"),
        ovulatory: norm("ovulatory"),
        luteal: norm("luteal"),
        total: Object.values(counts).reduce((a, b) => a + b, 0),
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
}

// ─── 5. Lifestyle ↔ Cycle-Length Correlation (Pearson r) ──────────────────────

export interface LifestyleCorrelation {
  sleepR: number;       // Pearson r: avg sleep during cycle i → length of cycle i+1
  waterR: number;       // Pearson r: avg water during cycle i → length of cycle i+1
  stressR: number;      // Pearson r: stress events during cycle i → length of cycle i+1
  symptomR: number;     // Pearson r: symptom burden during cycle i → length of cycle i+1
  n: number;            // number of cycle-pairs used
  strongestFactor: string;
  strongestR: number;
  interpretation: string;
}

function pearsonR(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  const num = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0);
  const dx = Math.sqrt(x.reduce((s, xi) => s + (xi - mx) ** 2, 0));
  const dy = Math.sqrt(y.reduce((s, yi) => s + (yi - my) ** 2, 0));
  return dx > 0 && dy > 0 ? num / (dx * dy) : 0;
}

export function getLifestyleCorrelations(
  cycles: Cycle[],
  logs: Record<string, LogEntry>,
): LifestyleCorrelation | null {
  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (sorted.length < 4) return null;

  // For each consecutive pair (i, i+1), extract lifestyle during cycle i → predict length of cycle i+1
  const sleepArr: number[] = [];
  const waterArr: number[] = [];
  const stressArr: number[] = [];
  const symptomArr: number[] = [];
  const nextLenArr: number[] = [];

  for (let i = 0; i < sorted.length - 2; i++) {
    const cycleStart = new Date(sorted[i].startDate);
    const cycleEnd = new Date(sorted[i + 1].startDate);
    const nextEnd = new Date(sorted[i + 2].startDate);

    const nextLen = Math.round((nextEnd.getTime() - cycleEnd.getTime()) / 86_400_000);
    if (nextLen < 10 || nextLen > 90) continue;

    const cycleLogs = Object.values(logs).filter((l) => {
      const d = new Date(l.date);
      return d >= cycleStart && d < cycleEnd;
    });

    const sleepLogs = cycleLogs.filter((l) => l.sleepHrs != null);
    const waterLogs = cycleLogs.filter((l) => l.waterCups != null);

    const avgS = sleepLogs.length > 0 ? sleepLogs.reduce((a, b) => a + b.sleepHrs!, 0) / sleepLogs.length : 7;
    const avgW = waterLogs.length > 0 ? waterLogs.reduce((a, b) => a + b.waterCups!, 0) / waterLogs.length : 6;
    const stress = cycleLogs.filter((l) => l.mood === "anxious" || l.mood === "irritable").length;
    const symptoms =
      cycleLogs.length > 0
        ? cycleLogs.reduce((s, l) => s + (l.symptoms?.length ?? 0), 0) / cycleLogs.length
        : 0;

    sleepArr.push(avgS);
    waterArr.push(avgW);
    stressArr.push(stress);
    symptomArr.push(symptoms);
    nextLenArr.push(nextLen);
  }

  if (nextLenArr.length < 3) return null;

  const sleepR = Math.round(pearsonR(sleepArr, nextLenArr) * 100) / 100;
  const waterR = Math.round(pearsonR(waterArr, nextLenArr) * 100) / 100;
  const stressR = Math.round(pearsonR(stressArr, nextLenArr) * 100) / 100;
  const symptomR = Math.round(pearsonR(symptomArr, nextLenArr) * 100) / 100;

  const candidates: [string, number][] = [
    ["Sleep quality", sleepR],
    ["Hydration", waterR],
    ["Stress / mood", stressR],
    ["Symptom burden", symptomR],
  ];
  const [strongestFactor, strongestR] = candidates.reduce(
    (best, cur) => (Math.abs(cur[1]) > Math.abs(best[1]) ? cur : best),
    ["", 0],
  );

  const absR = Math.abs(strongestR);
  const direction = strongestR > 0 ? "longer" : "shorter";
  const strength = absR >= 0.6 ? "strong" : absR >= 0.35 ? "moderate" : "weak";
  const interpretation =
    absR < 0.2
      ? "No clear lifestyle predictor of cycle length was identified yet — log more cycles for personalised insights."
      : `${strongestFactor} shows a ${strength} association with your cycle length (r = ${strongestR.toFixed(2)}): higher ${strongestFactor.toLowerCase()} during a cycle predicts ${direction} next cycles for you personally.`;

  return { sleepR, waterR, stressR, symptomR, n: nextLenArr.length, strongestFactor, strongestR, interpretation };
}

// ─── 6. Mood-Phase Analysis ───────────────────────────────────────────────────

export function getMoodPhaseAnalysis(
  cycles: Cycle[],
  logs: Record<string, LogEntry>,
  profile: Profile,
): MoodPhaseData[] {
  if (cycles.length === 0) return [];

  const phaseMoods: Record<string, number[]> = {
    menstrual: [], follicular: [], ovulatory: [], luteal: [],
  };

  for (const log of Object.values(logs)) {
    if (!log.mood) continue;
    const date = new Date(log.date);
    const phase = getPhaseForDate(date, cycles, profile);
    if (!phase) continue;
    phaseMoods[phase].push(MOOD_SCORE[log.mood] ?? 3);
  }

  const labels: Record<string, string> = {
    menstrual: "Menstrual", follicular: "Follicular", ovulatory: "Ovulatory", luteal: "Luteal",
  };

  return Object.entries(phaseMoods)
    .filter(([, scores]) => scores.length > 0)
    .map(([phase, scores]) => ({
      phase: labels[phase],
      avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      count: scores.length,
    }));
}

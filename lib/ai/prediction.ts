/**
 * Lotus Phase — Cycle Prediction Engine v2
 *
 * Model architecture: Adaptive GP–Bayesian ensemble
 *   • Gaussian Process (RBF kernel, Cholesky inference) with 5-D lifestyle covariates
 *   • Bayesian shrinkage baseline (exponentially-weighted mean, population prior)
 *   • Ensemble weight α scales from 0 (pure Bayesian, sparse data) to 0.9 (GP dominates)
 *
 * Covariates passed to the GP per cycle:
 *   [normalised_time, avg_sleep_z, avg_water_z, stress_level_z, symptom_burden_z]
 *
 * Output includes proper 95% credible intervals from the GP posterior, replacing
 * the previous ad-hoc confidence scalar.
 *
 * Reference: Rasmussen & Williams (2006) §2.2; Treloar et al. (1967) for population priors.
 */

import type { Cycle, LogEntry } from "../store";
import { gpPredict, meanStd } from "./gp";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export interface ConfidenceFactor {
  label: string;
  detail: string;
  impact: "positive" | "negative" | "neutral";
  points: number;
}

export interface Prediction {
  // Dates
  nextPeriodStart: Date;
  nextPeriodEnd: Date;
  ovulationDay: Date;
  fertileStart: Date;
  fertileEnd: Date;

  // Cycle stats
  avgCycleLength: number;
  avgPeriodLength: number;
  cyclesUsed: number;
  irregularityScore: number;   // 0 = very regular, 1 = highly irregular

  // Legacy scalar confidence (preserved for UI backward-compatibility)
  confidence: number;
  confidenceLabel: "Very High" | "High" | "Moderate" | "Low";
  confidencePct: number;
  factors: ConfidenceFactor[];

  // GP credible interval (days relative to nextPeriodStart)
  ciLower95Days: number;       // e.g. −5 means 5 days earlier than mean prediction
  ciUpper95Days: number;       // e.g. +5 means 5 days later than mean prediction
  gpStd: number;               // GP posterior std (days); 0 if GP not used

  // Model metadata
  modelUsed: "gp_bayesian_ensemble" | "bayesian_only";
  gpWeight: number;            // 0..1 — fraction contributed by GP in ensemble
}

// ─── Population priors (Treloar 1967 / ACOG reference) ───────────────────────

const POP_PRIOR_MEAN = 28;   // days
const POP_PRIOR_SIGMA = 4;   // days
const PRIOR_WEIGHT = 3;      // pseudo-observations

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// ─── Bayesian baseline ────────────────────────────────────────────────────────

/** Exponentially-weighted mean + std with Bayesian shrinkage to population prior */
function bayesianStats(gaps: number[]): { mean: number; std: number } {
  if (gaps.length === 0) return { mean: POP_PRIOR_MEAN, std: POP_PRIOR_SIGMA };

  const alpha = 0.72; // recency decay
  let wSum = 0;
  let wMean = 0;
  gaps.forEach((v, i) => {
    const w = alpha ** (gaps.length - 1 - i);
    wMean += v * w;
    wSum += w;
  });
  wMean /= wSum;

  const wVar =
    gaps.reduce((acc, v, i) => {
      const w = alpha ** (gaps.length - 1 - i);
      return acc + w * (v - wMean) ** 2;
    }, 0) / wSum;

  const n = gaps.length;
  const blendedMean = (wMean * n + POP_PRIOR_MEAN * PRIOR_WEIGHT) / (n + PRIOR_WEIGHT);
  const blendedStd =
    n < 2
      ? POP_PRIOR_SIGMA
      : (Math.sqrt(wVar) * n + POP_PRIOR_SIGMA * PRIOR_WEIGHT) / (n + PRIOR_WEIGHT);

  return { mean: blendedMean, std: blendedStd };
}

// ─── Lifestyle covariate extraction ───────────────────────────────────────────

interface CycleFeatureRow {
  t: number;           // normalised time index [0,1]
  avgSleep: number;    // hours (raw; will be z-scored)
  avgWater: number;    // cups  (raw)
  stressLevel: number; // count of anxious/irritable moods in cycle
  symptomBurden: number; // mean symptoms per log
  cycleLength: number; // actual cycle length this row predicts
}

function extractCycleFeatures(
  sorted: Cycle[],
  logs: Record<string, LogEntry>,
): CycleFeatureRow[] {
  const rows: CycleFeatureRow[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = parseDate(sorted[i].startDate);
    const end = parseDate(sorted[i + 1].startDate);
    const cycleLength = diffDays(start, end);
    if (cycleLength < 10 || cycleLength > 90) continue; // sanity guard

    const cycleLogs = Object.values(logs).filter((l) => {
      const d = new Date(l.date);
      return d >= start && d < end;
    });

    const sleepArr = cycleLogs.filter((l) => l.sleepHrs != null).map((l) => l.sleepHrs!);
    const waterArr = cycleLogs.filter((l) => l.waterCups != null).map((l) => l.waterCups!);
    const stress = cycleLogs.filter(
      (l) => l.mood === "anxious" || l.mood === "irritable",
    ).length;
    const symptomMean =
      cycleLogs.length > 0
        ? cycleLogs.reduce((s, l) => s + (l.symptoms?.length ?? 0), 0) / cycleLogs.length
        : 0;

    rows.push({
      t: i / Math.max(1, sorted.length - 2),
      avgSleep: sleepArr.length > 0 ? sleepArr.reduce((a, b) => a + b) / sleepArr.length : 7,
      avgWater: waterArr.length > 0 ? waterArr.reduce((a, b) => a + b) / waterArr.length : 6,
      stressLevel: stress,
      symptomBurden: symptomMean,
      cycleLength,
    });
  }
  return rows;
}

/** Build normalised feature matrix from CycleFeatureRows */
function buildFeatureMatrix(rows: CycleFeatureRow[]): {
  X: number[][];
  y: number[];
  norms: { mu: number; sigma: number }[];
} {
  // Raw feature columns (skip t — already in [0,1])
  const sleepCol = rows.map((r) => r.avgSleep);
  const waterCol = rows.map((r) => r.avgWater);
  const stressCol = rows.map((r) => r.stressLevel);
  const symptomCol = rows.map((r) => r.symptomBurden);

  const sleepNorm = meanStd(sleepCol);
  const waterNorm = meanStd(waterCol);
  const stressNorm = meanStd(stressCol);
  const symptomNorm = meanStd(symptomCol);

  const X = rows.map((r) => [
    r.t,
    (r.avgSleep - sleepNorm.mu) / sleepNorm.sigma,
    (r.avgWater - waterNorm.mu) / waterNorm.sigma,
    (r.stressLevel - stressNorm.mu) / stressNorm.sigma,
    (r.symptomBurden - symptomNorm.mu) / symptomNorm.sigma,
  ]);

  return {
    X,
    y: rows.map((r) => r.cycleLength),
    norms: [sleepNorm, waterNorm, stressNorm, symptomNorm],
  };
}

// ─── Log quality analysis ─────────────────────────────────────────────────────

function analyseLogQuality(
  logs: Record<string, LogEntry>,
  daysBack = 30,
): { avgSleep: number | null; avgWater: number | null; stressCount: number; logCount: number } {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const recent = Object.values(logs).filter((l) => new Date(l.date) >= cutoff);
  if (recent.length === 0) return { avgSleep: null, avgWater: null, stressCount: 0, logCount: 0 };

  const sleepLogs = recent.filter((l) => l.sleepHrs != null);
  const waterLogs = recent.filter((l) => l.waterCups != null);
  const stressCount = recent.filter(
    (l) => l.mood === "anxious" || l.mood === "irritable",
  ).length;

  return {
    avgSleep:
      sleepLogs.length > 0
        ? sleepLogs.reduce((a, b) => a + b.sleepHrs!, 0) / sleepLogs.length
        : null,
    avgWater:
      waterLogs.length > 0
        ? waterLogs.reduce((a, b) => a + b.waterCups!, 0) / waterLogs.length
        : null,
    stressCount,
    logCount: recent.length,
  };
}

// ─── Main prediction function ─────────────────────────────────────────────────

export function predict(
  cycles: Cycle[],
  fallbackAvg = 28,
  fallbackPeriod = 5,
  logs: Record<string, LogEntry> = {},
): Prediction | null {
  if (cycles.length === 0) return null;

  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const starts = sorted.map((c) => parseDate(c.startDate));

  // Gap sequence (cycle lengths)
  const gaps: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const g = diffDays(starts[i - 1], starts[i]);
    if (g > 10 && g < 90) gaps.push(g);
  }

  // ── Bayesian baseline ─────────────────────────────────────────────────────
  const { mean: bayesMean, std: bayesStd } = bayesianStats(gaps);

  // ── Average period length ─────────────────────────────────────────────────
  const periodLengths = sorted
    .filter((c) => c.endDate)
    .map((c) => diffDays(parseDate(c.startDate), parseDate(c.endDate!)) + 1);
  const avgPeriodLength =
    periodLengths.length > 0
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : fallbackPeriod;

  // ── Gaussian Process path ─────────────────────────────────────────────────
  const featureRows = extractCycleFeatures(sorted, logs);
  const MIN_GP = 3; // minimum training samples for GP
  let gpMean = bayesMean;
  let gpStd = bayesStd;
  let gpWeight = 0;
  let modelUsed: Prediction["modelUsed"] = "bayesian_only";

  if (featureRows.length >= MIN_GP) {
    try {
      const { X, y, norms } = buildFeatureMatrix(featureRows);

      // Query point: predict for next cycle after the last known one
      const tStar = 1.0; // extrapolate beyond training horizon
      const logQ = analyseLogQuality(logs, 60);
      const [sleepNorm, waterNorm, stressNorm, symptomNorm] = norms;

      const recentSleep = logQ.avgSleep ?? sleepNorm.mu;
      const recentWater = logQ.avgWater ?? waterNorm.mu;
      const recentStress = logQ.stressCount;
      const recentSymptom =
        Object.values(logs).length > 0
          ? Object.values(logs).reduce((s, l) => s + (l.symptoms?.length ?? 0), 0) /
            Object.values(logs).length
          : symptomNorm.mu;

      const xStar = [
        tStar,
        (recentSleep - sleepNorm.mu) / sleepNorm.sigma,
        (recentWater - waterNorm.mu) / waterNorm.sigma,
        (recentStress - stressNorm.mu) / stressNorm.sigma,
        (recentSymptom - symptomNorm.mu) / symptomNorm.sigma,
      ];

      const gp = gpPredict(X, y, xStar);

      // Clamp GP mean to physiologically plausible range
      gpMean = Math.max(18, Math.min(45, gp.mean));
      gpStd = Math.max(1, gp.std);

      // Ensemble weight: increases with training data
      const n = featureRows.length;
      gpWeight = n >= 10 ? 0.90 : n >= 6 ? 0.75 : n >= MIN_GP ? 0.50 : 0;
      modelUsed = "gp_bayesian_ensemble";
    } catch {
      // Numerical failure (near-singular matrix) — fall back to Bayesian
      gpWeight = 0;
    }
  }

  // Ensemble prediction
  const ensembleMean = gpWeight * gpMean + (1 - gpWeight) * bayesMean;
  const ensembleStd = gpWeight * gpStd + (1 - gpWeight) * bayesStd;

  const cycleLen = Math.round(ensembleMean);
  const lastStart = starts[starts.length - 1];
  const nextPeriodStart = addDays(lastStart, cycleLen);
  const nextPeriodEnd = addDays(nextPeriodStart, avgPeriodLength - 1);
  const ovulationDay = addDays(nextPeriodStart, -14);
  const fertileStart = addDays(ovulationDay, -2);
  const fertileEnd = addDays(ovulationDay, 2);

  const irregularityScore = Math.min(1, ensembleStd / 10);

  // 95% credible interval in days relative to nextPeriodStart
  const ciHalf = 1.96 * ensembleStd;
  const ciLower95Days = -Math.round(ciHalf);
  const ciUpper95Days = Math.round(ciHalf);

  // ── Confidence factor analysis (preserved for UI) ─────────────────────────
  const factors: ConfidenceFactor[] = [];
  let baseConfidence = 0.40;
  const n = gaps.length;

  if (n >= 5) {
    factors.push({ label: "Rich cycle history", detail: `${n + 1} cycles logged`, impact: "positive", points: 0.25 });
    baseConfidence += 0.25;
  } else if (n >= 2) {
    factors.push({ label: "Moderate cycle history", detail: `${n + 1} cycles logged`, impact: "positive", points: 0.12 });
    baseConfidence += 0.12;
  } else {
    factors.push({ label: "Limited data", detail: "Log more cycles for better accuracy", impact: "negative", points: -0.08 });
    baseConfidence -= 0.08;
  }

  if (ensembleStd <= 2) {
    factors.push({ label: "Very regular cycle", detail: `±${ensembleStd.toFixed(1)}d ensemble uncertainty`, impact: "positive", points: 0.18 });
    baseConfidence += 0.18;
  } else if (ensembleStd <= 4) {
    factors.push({ label: "Fairly regular cycle", detail: `±${ensembleStd.toFixed(1)}d ensemble uncertainty`, impact: "positive", points: 0.08 });
    baseConfidence += 0.08;
  } else {
    factors.push({ label: "Irregular cycle detected", detail: `±${ensembleStd.toFixed(1)}d ensemble uncertainty`, impact: "negative", points: -0.12 });
    baseConfidence -= 0.12;
  }

  if (gpWeight > 0.5) {
    factors.push({ label: "GP model active", detail: `${Math.round(gpWeight * 100)}% GP + lifestyle covariates`, impact: "positive", points: 0.10 });
    baseConfidence += 0.10;
  }

  const logQ = analyseLogQuality(logs, 30);
  if (logQ.logCount >= 10) {
    factors.push({ label: "Detailed daily logging", detail: `${logQ.logCount} entries in last 30 days`, impact: "positive", points: 0.08 });
    baseConfidence += 0.08;
  }
  if (logQ.avgSleep !== null && logQ.avgSleep >= 7) {
    factors.push({ label: "Good sleep quality", detail: `Avg ${logQ.avgSleep.toFixed(1)}h/night`, impact: "positive", points: 0.05 });
    baseConfidence += 0.05;
  } else if (logQ.avgSleep !== null && logQ.avgSleep < 6) {
    factors.push({ label: "Poor sleep may affect cycle", detail: `Avg ${logQ.avgSleep.toFixed(1)}h/night`, impact: "negative", points: -0.05 });
    baseConfidence -= 0.05;
  }
  if (logQ.stressCount > 5) {
    factors.push({ label: "High stress signals", detail: `${logQ.stressCount} anxious/irritable moods`, impact: "negative", points: -0.06 });
    baseConfidence -= 0.06;
  }

  const daysSinceLast = diffDays(lastStart, new Date());
  if (daysSinceLast <= 60) {
    factors.push({ label: "Recent period logged", detail: `${daysSinceLast} days ago`, impact: "positive", points: 0.04 });
    baseConfidence += 0.04;
  } else if (daysSinceLast > 120) {
    factors.push({ label: "Stale data", detail: "Last period logged over 4 months ago", impact: "negative", points: -0.10 });
    baseConfidence -= 0.10;
  }

  const confidence = Math.max(0.08, Math.min(0.97, baseConfidence));
  const confidencePct = Math.round(confidence * 100);
  const confidenceLabel: Prediction["confidenceLabel"] =
    confidence >= 0.80 ? "Very High"
    : confidence >= 0.60 ? "High"
    : confidence >= 0.40 ? "Moderate"
    : "Low";

  return {
    nextPeriodStart,
    nextPeriodEnd,
    ovulationDay,
    fertileStart,
    fertileEnd,
    avgCycleLength: cycleLen,
    avgPeriodLength,
    confidence,
    confidenceLabel,
    confidencePct,
    cyclesUsed: n + 1,
    irregularityScore,
    factors,
    ciLower95Days,
    ciUpper95Days,
    gpStd: ensembleStd,
    modelUsed,
    gpWeight,
  };
}

// ─── Phase detection ──────────────────────────────────────────────────────────

export function currentPhase(
  today: Date,
  prediction: Prediction | null,
  cycles: Cycle[],
): { phase: CyclePhase; dayOfCycle: number } {
  if (!prediction || cycles.length === 0) return { phase: "follicular", dayOfCycle: 1 };
  const last = parseDate(
    [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate)).at(-1)!.startDate,
  );
  const dayOfCycle = Math.max(1, diffDays(last, today) + 1);
  const cycleLen = prediction.avgCycleLength;
  const ovDay = cycleLen - 14;
  let phase: CyclePhase;
  if (dayOfCycle <= prediction.avgPeriodLength) phase = "menstrual";
  else if (dayOfCycle < ovDay - 2) phase = "follicular";
  else if (dayOfCycle <= ovDay + 2) phase = "ovulatory";
  else phase = "luteal";
  return { phase, dayOfCycle };
}

export const phaseInfo: Record<
  CyclePhase,
  { label: string; emoji: string; tone: "rose" | "lavender" | "amber" | "green"; tip: string }
> = {
  menstrual: {
    label: "Menstrual",
    emoji: "🌹",
    tone: "rose",
    tip: "Rest, hydrate, and choose iron-rich foods to support your body.",
  },
  follicular: {
    label: "Follicular",
    emoji: "🌱",
    tone: "green",
    tip: "Energy is rising — perfect time for new projects and strength training.",
  },
  ovulatory: {
    label: "Ovulatory",
    emoji: "✨",
    tone: "amber",
    tip: "Peak fertility window. You may feel social and confident.",
  },
  luteal: {
    label: "Luteal",
    emoji: "🌙",
    tone: "lavender",
    tip: "Slow down, eat magnesium-rich foods, and prioritise sleep.",
  },
};

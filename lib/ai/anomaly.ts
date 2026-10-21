/**
 * Lotus Phase — Cycle & Lifestyle Anomaly Detection Engine
 *
 * Method: Tukey IQR fences for outlier detection (robust to non-Gaussian
 * distributions and more appropriate than Z-score for n < 30).
 * Secondary: rolling variance comparison for regularity shift detection.
 *
 * Reference: Tukey (1977) "Exploratory Data Analysis";
 *            Briden & Prior (1985) on cycle length variability norms.
 */

import type { Cycle, LogEntry } from "../store";
import type { Profile } from "../store";
import { predict } from "./prediction";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnomalySeverity = "info" | "warning" | "alert";
export type AnomalyType =
  | "cycle_length_outlier"
  | "regularity_shift"
  | "new_recurring_symptom"
  | "sleep_degradation"
  | "overdue_period"
  | "consecutive_short_cycles";

export interface CycleAnomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  detail: string;
  zScore?: number;
  recommendation: string;
}

// ─── Statistical helpers ──────────────────────────────────────────────────────

function iqrFences(values: number[]): { q1: number; q3: number; iqr: number; low: number; high: number } {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  const q1 = s[Math.floor(n * 0.25)];
  const q3 = s[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  return { q1, q3, iqr, low: q1 - 1.5 * iqr, high: q3 + 1.5 * iqr };
}

function sampleStats(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
  return { mean, std };
}

function zScore(value: number, mean: number, std: number): number {
  return std > 0 ? (value - mean) / std : 0;
}

// ─── Cycle-length gap extractor ───────────────────────────────────────────────

function cycleLengths(cycles: Cycle[]): number[] {
  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const lengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const g = Math.round(
      (new Date(sorted[i].startDate).getTime() - new Date(sorted[i - 1].startDate).getTime()) / 86_400_000,
    );
    if (g > 10 && g < 90) lengths.push(g);
  }
  return lengths;
}

// ─── Main detector ────────────────────────────────────────────────────────────

export function detectAnomalies(
  cycles: Cycle[],
  logs: Record<string, LogEntry>,
  profile: Profile,
): CycleAnomaly[] {
  const anomalies: CycleAnomaly[] = [];
  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const lengths = cycleLengths(cycles);

  // ── 1. Most-recent cycle length outlier ────────────────────────────────────
  if (lengths.length >= 4) {
    const lastLen = lengths[lengths.length - 1];
    const history = lengths.slice(0, -1);
    const fences = iqrFences(history);
    const { mean, std } = sampleStats(history);
    const z = zScore(lastLen, mean, std);

    if (lastLen < fences.low || lastLen > fences.high) {
      const dir = lastLen < fences.low ? "short" : "long";
      anomalies.push({
        id: "cycle_len_outlier",
        type: "cycle_length_outlier",
        severity: Math.abs(z) > 2.5 ? "alert" : "warning",
        title: `Unusually ${dir} last cycle`,
        detail: `Your last cycle was ${lastLen} days (personal mean ${mean.toFixed(1)}d, |z| = ${Math.abs(z).toFixed(2)}σ). This lies outside your normal IQR range [${fences.q1}–${fences.q3} days].`,
        zScore: z,
        recommendation:
          dir === "long"
            ? "A longer cycle can result from stress, illness, weight changes, thyroid changes, or early perimenopause. If it recurs, book a GP visit."
            : "Shorter cycles may indicate elevated stress, significant weight loss, or hormonal fluctuation. Track the next cycle; if it persists, consult your doctor.",
      });
    }
  }

  // ── 2. Regularity shift (recent SD vs. historical SD) ─────────────────────
  if (lengths.length >= 8) {
    const half = Math.floor(lengths.length / 2);
    const older = lengths.slice(0, half);
    const newer = lengths.slice(half);
    const sdOld = sampleStats(older).std;
    const sdNew = sampleStats(newer).std;

    if (sdNew > sdOld * 2.0 && sdNew > 4.5) {
      anomalies.push({
        id: "regularity_shift",
        type: "regularity_shift",
        severity: "warning",
        title: "Cycle becoming more irregular",
        detail: `Recent cycle variability (SD ${sdNew.toFixed(1)}d) is ${(sdNew / Math.max(sdOld, 0.1)).toFixed(1)}× higher than your earlier pattern (SD ${sdOld.toFixed(1)}d). This shift is statistically significant.`,
        recommendation:
          "Increasing irregularity can reflect hormonal changes, significant life stress, thyroid dysfunction, or perimenopausal transition. Discuss with a gynaecologist if it continues.",
      });
    }
  }

  // ── 3. Three or more consecutive short cycles (<21d) ─────────────────────
  if (lengths.length >= 3) {
    const lastThree = lengths.slice(-3);
    if (lastThree.every((l) => l < 22)) {
      anomalies.push({
        id: "consecutive_short",
        type: "consecutive_short_cycles",
        severity: "alert",
        title: "Three consecutive short cycles (<22 days)",
        detail: `Your last 3 cycles were ${lastThree.join(", ")} days — all below 22 days. Polymenorrhoea (frequent periods) warrants medical evaluation.`,
        recommendation:
          "Short cycles can indicate thyroid issues, early luteal phase defect, or perimenopause. Please see a gynaecologist or endocrinologist for blood tests (TSH, FSH, LH, progesterone).",
      });
    }
  }

  // ── 4. New recurring symptoms (absent in earlier history) ─────────────────
  const logArr = Object.values(logs).sort((a, b) => a.date.localeCompare(b.date));
  if (logArr.length >= 14) {
    const splitIdx = Math.floor(logArr.length / 2);
    const earlierSet = new Set(logArr.slice(0, splitIdx).flatMap((l) => l.symptoms ?? []));
    const recentCounts: Record<string, number> = {};
    for (const log of logArr.slice(splitIdx)) {
      for (const s of log.symptoms ?? []) {
        if (!earlierSet.has(s)) recentCounts[s] = (recentCounts[s] ?? 0) + 1;
      }
    }
    const newSymptoms = Object.entries(recentCounts)
      .filter(([, c]) => c >= 4)
      .map(([s]) => s);
    if (newSymptoms.length > 0) {
      anomalies.push({
        id: "new_symptoms",
        type: "new_recurring_symptom",
        severity: "info",
        title: "New recurring symptoms detected",
        detail: `Recently appeared (4+ times): ${newSymptoms.join(", ")}. These were absent in your earlier logs.`,
        recommendation:
          "New recurring symptoms are worth noting. If they are painful, unusual, or affecting quality of life, mention them to your doctor at your next visit.",
      });
    }
  }

  // ── 5. Sleep degradation (recent 30d vs. prior 30–90d) ───────────────────
  if (logArr.length >= 10) {
    const now = Date.now();
    const recent = logArr.filter((l) => now - new Date(l.date).getTime() <= 30 * 86_400_000);
    const prior = logArr.filter((l) => {
      const age = now - new Date(l.date).getTime();
      return age > 30 * 86_400_000 && age <= 90 * 86_400_000;
    });

    const avgSleep = (arr: typeof logArr) => {
      const s = arr.filter((l) => l.sleepHrs != null);
      return s.length >= 4 ? s.reduce((a, b) => a + b.sleepHrs!, 0) / s.length : null;
    };

    const s1 = avgSleep(prior);
    const s2 = avgSleep(recent);

    if (s1 !== null && s2 !== null && s1 - s2 >= 1.0) {
      anomalies.push({
        id: "sleep_drop",
        type: "sleep_degradation",
        severity: "warning",
        title: "Sleep quality declining",
        detail: `Average sleep dropped from ${s1.toFixed(1)}h (30–90 days ago) to ${s2.toFixed(1)}h (last 30 days) — a ${(s1 - s2).toFixed(1)}h reduction.`,
        recommendation:
          "Chronic sleep reduction raises cortisol and worsens insulin resistance, which can delay ovulation and increase PMS symptoms. Investigate and prioritise sleep restoration.",
      });
    }
  }

  // ── 6. Overdue period detection ───────────────────────────────────────────
  if (sorted.length >= 2) {
    const pred = predict(cycles, profile.avgCycleLength, profile.avgPeriodLength, logs);
    if (pred) {
      const today = new Date();
      const daysOverdue = Math.floor(
        (today.getTime() - pred.nextPeriodStart.getTime()) / 86_400_000,
      );
      if (daysOverdue >= 7) {
        const ciBuffer = Math.abs(pred.ciLower95Days); // 95% CI half-width
        if (daysOverdue > ciBuffer * 0.75) {
          anomalies.push({
            id: "overdue",
            type: "overdue_period",
            severity: daysOverdue >= 14 ? "alert" : "warning",
            title: `Period ${daysOverdue} days past prediction`,
            detail: `Expected around ${pred.nextPeriodStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} (GP 95% CI: ${pred.ciLower95Days} to +${pred.ciUpper95Days} days). Today is day ${daysOverdue} past that prediction.`,
            recommendation:
              daysOverdue >= 14
                ? "If sexually active, take a pregnancy test. Otherwise, cycles delayed >14 days past prediction warrant a GP visit to check TSH, prolactin, and FSH."
                : "A few days' delay is within normal variability. Stress, travel, illness, or medication can delay ovulation. Log your next period when it arrives.",
          });
        }
      }
    }
  }

  return anomalies;
}

// ─── Severity aggregator ──────────────────────────────────────────────────────

export function getHighestSeverity(anomalies: CycleAnomaly[]): AnomalySeverity | null {
  if (anomalies.some((a) => a.severity === "alert")) return "alert";
  if (anomalies.some((a) => a.severity === "warning")) return "warning";
  if (anomalies.some((a) => a.severity === "info")) return "info";
  return null;
}

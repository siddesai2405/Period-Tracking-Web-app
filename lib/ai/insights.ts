import type { LogEntry } from "../store";
import { type CyclePhase, phaseInfo, type Prediction } from "./prediction";

export interface Insight {
  id: string;
  title: string;
  body: string;
  tone: "rose" | "lavender" | "green" | "amber";
  emoji: string;
}

export function generateInsights(args: {
  phase: CyclePhase;
  dayOfCycle: number;
  prediction: Prediction | null;
  logs: LogEntry[];
}): Insight[] {
  const { phase, dayOfCycle, prediction, logs } = args;
  const out: Insight[] = [];

  out.push({
    id: "phase",
    title: `You're in your ${phaseInfo[phase].label} phase`,
    body: `Day ${dayOfCycle} of your cycle. ${phaseInfo[phase].tip}`,
    tone: phaseInfo[phase].tone,
    emoji: phaseInfo[phase].emoji,
  });

  if (prediction) {
    const days = Math.ceil((prediction.nextPeriodStart.getTime() - Date.now()) / 86_400_000);
    out.push({
      id: "next",
      title:
        days <= 0
          ? "Your period may start any day"
          : `Next period in ${days} day${days === 1 ? "" : "s"}`,
      body: `Average cycle length: ${prediction.avgCycleLength} days · Confidence ${Math.round(
        prediction.confidence * 100,
      )}%`,
      tone: "rose",
      emoji: "🩸",
    });
  }

  // Symptom pattern detection
  const counts: Record<string, number> = {};
  logs.forEach((l) => l.symptoms.forEach((s) => (counts[s] = (counts[s] ?? 0) + 1)));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 2) {
    out.push({
      id: "symptom",
      title: `${top[0]} appears often`,
      body: `Logged ${top[1]} times recently. Try gentle stretches, warm tea and 8h sleep tonight.`,
      tone: "lavender",
      emoji: "💜",
    });
  }

  // Hydration nudge
  const lastLog = logs.at(-1);
  if (lastLog?.waterCups !== undefined && lastLog.waterCups < 6) {
    out.push({
      id: "hydration",
      title: "A little more water today",
      body: "Aim for 8 cups. Hydration eases cramps and lifts mood.",
      tone: "green",
      emoji: "💧",
    });
  }

  // Sleep
  const sleepAvg =
    logs.filter((l) => l.sleepHrs).reduce((a, l) => a + (l.sleepHrs ?? 0), 0) /
    Math.max(1, logs.filter((l) => l.sleepHrs).length);
  if (sleepAvg && sleepAvg < 6.5) {
    out.push({
      id: "sleep",
      title: "Sleep has been short",
      body: `Average ${sleepAvg.toFixed(1)}h. Restorative sleep balances hormones — try a wind-down routine.`,
      tone: "amber",
      emoji: "😴",
    });
  }

  return out;
}

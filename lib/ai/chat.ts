"use client";
import { bestAnswer } from "./kb";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

export interface CycleContext {
  name?: string;
  phase?: string;
  dayOfCycle?: number;
  avgCycleLength?: number;
  avgPeriodLength?: number;
  nextPeriodStart?: string;
  ovulationDay?: string;
  confidence?: number;
  recentSymptoms?: string[];
  recentMood?: string | null;
  avgSleepHrs?: number | null;
  avgWaterCups?: number | null;
  pcosRisk?: string | null;
  healthScore?: number | null;
  cycleRegularity?: string | null;
  predictionMae?: number | null;
  topPhaseSymptom?: string | null;
  cyclesLogged?: number;
  loggingStreakDays?: number;
  // GP model output
  gpCiLower?: number | null;
  gpCiUpper?: number | null;
  gpStd?: number | null;
  modelUsed?: string | null;
  gpWeight?: number | null;
  // Anomaly alerts
  activeAnomalies?: { severity: string; title: string; detail: string }[];
  // Lifestyle correlations
  sleepCycleR?: number | null;
  stressCycleR?: number | null;
  strongestLifestyleFactor?: string | null;
  strongestLifestyleR?: number | null;
  // PCOS phenotype
  rotterdamPhenotype?: string | null;
}

export interface StreamHandlers {
  onToken: (token: string) => void;
  onDone: (full: string, providerLabel: string) => void;
  onError: (err: Error) => void;
  signal?: AbortSignal;
}

/** Streams a reply from /api/chat. Uses Llama 3.3 70B Versatile via Groq when configured, gracefully falls back to the offline KB otherwise. */
export async function streamReply(
  messages: ChatMessage[],
  context: CycleContext,
  h: StreamHandlers,
) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        context,
      }),
      signal: h.signal,
    });

    const providerLabel = res.headers.get("x-luna-provider") || "luna";

    if (!res.ok || !res.body) {
      const fallback = bestAnswer(messages.at(-1)?.content ?? "");
      h.onToken(fallback);
      h.onDone(fallback, `offline-fallback (${res.status})`);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      full += chunk;
      h.onToken(chunk);
    }
    h.onDone(full, providerLabel);
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    const fallback = bestAnswer(messages.at(-1)?.content ?? "");
    h.onToken(fallback);
    h.onDone(fallback, "offline-fallback");
    h.onError(err as Error);
  }
}

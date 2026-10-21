/**
 * Lotus Phase — AI Chat API Route
 *
 * Provider priority:
 *   1. Groq (Llama 3.3 70B) — streaming, primary path
 *   2. HuggingFace semantic KB search — when HF_TOKEN set, no Groq key
 *   3. Keyword-based offline KB — always-available fallback
 *
 * System prompt enriched with:
 *   - GP posterior credible intervals
 *   - Active anomaly alerts
 *   - Lifestyle-cycle Pearson correlations
 *   - Rotterdam PCOS phenotype (if assessed)
 */

import { NextRequest } from "next/server";

export const runtime = "nodejs";

interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface CycleContext {
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
  // Research analytics
  healthScore?: number | null;
  cycleRegularity?: string | null;
  predictionMae?: number | null;
  topPhaseSymptom?: string | null;
  cyclesLogged?: number;
  loggingStreakDays?: number;
  // New: GP model output
  gpCiLower?: number | null;   // 95% CI lower bound (days, negative = earlier)
  gpCiUpper?: number | null;   // 95% CI upper bound (days, positive = later)
  gpStd?: number | null;       // GP posterior std (days)
  modelUsed?: string | null;
  gpWeight?: number | null;
  // New: anomaly alerts
  activeAnomalies?: { severity: string; title: string; detail: string }[];
  // New: lifestyle correlations
  sleepCycleR?: number | null;
  stressCycleR?: number | null;
  strongestLifestyleFactor?: string | null;
  strongestLifestyleR?: number | null;
  // New: PCOS phenotype
  rotterdamPhenotype?: string | null;
}

// ─── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = (ctx: CycleContext): string => {
  const anomalyBlock =
    ctx.activeAnomalies && ctx.activeAnomalies.length > 0
      ? `\n## Active health alerts (mention gently if relevant)\n${ctx.activeAnomalies
          .map((a) => `- [${a.severity.toUpperCase()}] ${a.title}: ${a.detail}`)
          .join("\n")}`
      : "";

  const gpBlock =
    ctx.gpStd != null
      ? `- Prediction model: ${ctx.modelUsed ?? "GP ensemble"} (95% CI: ${ctx.gpCiLower ?? "?"} to +${ctx.gpCiUpper ?? "?"} days, σ = ${ctx.gpStd.toFixed(1)} days)`
      : "- Prediction model: baseline Bayesian (not enough cycles for GP)";

  const corrBlock =
    ctx.strongestLifestyleFactor && ctx.strongestLifestyleR != null
      ? `- Strongest personal lifestyle predictor: ${ctx.strongestLifestyleFactor} (r = ${ctx.strongestLifestyleR.toFixed(2)}) — sleep r = ${ctx.sleepCycleR?.toFixed(2) ?? "n/a"}, stress r = ${ctx.stressCycleR?.toFixed(2) ?? "n/a"}`
      : "- Lifestyle correlations: not yet computed (need 4+ cycles)";

  return `You are Luna, a warm, evidence-informed AI wellness companion inside the Lotus Phase period & cycle tracking app.

## Your persona
Speak like a calm, knowledgeable older sister — caring, never clinical or condescending.
Use short paragraphs, **bold** for key ideas, light bullet lists when helpful, and an occasional emoji for warmth (never spam).
Always validate feelings first, then give a concrete, actionable suggestion.
Keep replies 120–200 words unless the user asks for more depth.

## Safety guardrails
You are NOT a doctor. For severe pain, very heavy bleeding (soaking a pad/hour), missed periods >3 months, fainting, or pregnancy concerns, gently recommend seeing a clinician.
Never diagnose. Never recommend prescription medication doses.
For emergency contraception, abuse, self-harm, or eating disorders, respond with empathy and point to professional resources.

## Live personal snapshot (weave in naturally — never recite verbatim)
- Name: ${ctx.name ?? "friend"}
- Current phase: ${ctx.phase ?? "unknown"} · Day ${ctx.dayOfCycle ?? "?"} of cycle
- Average cycle: ${ctx.avgCycleLength ?? "?"} days · Period length: ${ctx.avgPeriodLength ?? "?"} days
- Next period: ${ctx.nextPeriodStart ?? "not enough data yet"}
- Predicted ovulation: ${ctx.ovulationDay ?? "n/a"}
- Prediction confidence: ${ctx.confidence != null ? Math.round(ctx.confidence * 100) + "%" : "n/a"}
- Cycles tracked: ${ctx.cyclesLogged ?? "unknown"}
- Recent symptoms: ${ctx.recentSymptoms?.length ? ctx.recentSymptoms.join(", ") : "none logged"}
- Recent mood: ${ctx.recentMood ?? "not logged"}
- Avg sleep: ${ctx.avgSleepHrs ?? "n/a"} hrs · Avg water: ${ctx.avgWaterCups ?? "n/a"} cups/day
- PCOS risk: ${ctx.pcosRisk ?? "assessment not taken yet"}
- PCOS phenotype (Rotterdam): ${ctx.rotterdamPhenotype ?? "not assessed"}

## ML model & research analytics
- Cycle Health Score: ${ctx.healthScore != null ? ctx.healthScore + "/100" : "not yet computed"}
- Cycle regularity: ${ctx.cycleRegularity ?? "unknown"}
- Prediction accuracy (MAE): ${ctx.predictionMae != null ? ctx.predictionMae + " days" : "not enough cycles yet"}
- Most common phase symptom: ${ctx.topPhaseSymptom ?? "none identified yet"}
- Consecutive days logged: ${ctx.loggingStreakDays ?? "unknown"}
${gpBlock}
${corrBlock}${anomalyBlock}

## Lotus Phase features to guide users toward
- **Calendar**: log period start/end, view cycle predictions and fertile window
- **Insights**: Cycle Health Score, symptom-phase correlations, prediction accuracy, lifestyle correlations
- **Stats**: full cycle history, mood trends, timeline
- **Diet Guide**: phase-synced nutrition plans (4 cycle phases)
- **PCOS Check**: hormonal health assessment, Rotterdam phenotype classification, lifestyle guide
- **Relax & Sleep**: breathing exercises, ambient sounds, meditation timer
- **Log**: daily flow, mood, symptoms, sleep and water tracking
- **Wellness**: phase-aware yoga, self-care rituals, energy/focus metrics

If a question is unrelated to health, gently redirect to cycle care, mood, nutrition, sleep, or hydration.`;
};

// ─── Semantic KB fallback (HuggingFace) ──────────────────────────────────────

async function semanticKBAnswer(query: string, origin: string): Promise<string | null> {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) return null;

  try {
    const { KB } = await import("@/lib/ai/kb");
    const texts = [query, ...KB.map((e) => e.keywords.join(" ") + " " + e.answer.slice(0, 120))];

    const res = await fetch(`${origin}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    });

    if (!res.ok) return null;
    const { embeddings }: { embeddings?: number[][] } = await res.json();
    if (!embeddings || embeddings.length < 2) return null;

    const [qEmb, ...kbEmbs] = embeddings;

    // Cosine similarity
    let bestIdx = 0, bestScore = -Infinity;
    for (let i = 0; i < kbEmbs.length; i++) {
      let dot = 0, na = 0, nb = 0;
      for (let j = 0; j < qEmb.length; j++) {
        dot += qEmb[j] * kbEmbs[i][j];
        na += qEmb[j] ** 2;
        nb += kbEmbs[i][j] ** 2;
      }
      const s = na > 0 && nb > 0 ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
      if (s > bestScore) { bestScore = s; bestIdx = i; }
    }

    // Only use semantic match if confidence is above threshold
    if (bestScore < 0.30) return null;

    return (
      KB[bestIdx].answer +
      "\n\n_Reminder: I'm an AI assistant — please see a qualified clinician for personal medical advice._"
    );
  } catch {
    return null;
  }
}

// ─── Streaming helpers ────────────────────────────────────────────────────────

function textStream(text: string): Response {
  const encoder = new TextEncoder();
  const chunks = text.split(/(\s+)/);
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, 18));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "x-luna-provider": "offline-kb" },
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

function lowSignalReply(query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;

  return [
    `I saw "${trimmed}", but I need a little more context before giving health guidance.`,
    "",
    "Try asking:",
    `- Is a ${trimmed}-day cycle normal?`,
    `- I am ${trimmed} days late, what should I do?`,
    "- Explain period tracking basics 101",
    "",
    "If you have severe pain, very heavy bleeding, fainting, or pregnancy concerns, please contact a clinician.",
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  let body: { messages: IncomingMessage[]; context?: CycleContext };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const userMessages = (body.messages || []).slice(-12).map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const lastUserMessage = [...userMessages].reverse().find((m) => m.role === "user");
  const lowSignal = lowSignalReply(lastUserMessage?.content ?? "");
  if (lowSignal) return textStream(lowSignal);

  // ── Offline fallback path ──────────────────────────────────────────────────
  if (!apiKey) {
    const query = lastUserMessage?.content ?? "";

    // Try HuggingFace semantic search first
    const origin = req.nextUrl.origin;
    const semanticAnswer = await semanticKBAnswer(query, origin);
    if (semanticAnswer) {
      return new Response(
        new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            for (const chunk of semanticAnswer.split(/(\s+)/)) {
              controller.enqueue(encoder.encode(chunk));
              await new Promise((r) => setTimeout(r, 18));
            }
            controller.close();
          },
        }),
        {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "x-luna-provider": "hf-semantic-kb",
          },
        },
      );
    }

    // Fall back to keyword KB
    const { bestAnswer } = await import("@/lib/ai/kb");
    return textStream(bestAnswer(query));
  }

  // ── Groq streaming path ────────────────────────────────────────────────────
  const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.5,
      max_tokens: 800,
      messages: [
        { role: "system", content: SYSTEM_PROMPT(body.context || {}) },
        ...userMessages,
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const err = await upstream.text().catch(() => "");
    return new Response(`Luna upstream error: ${upstream.status} ${err}`, { status: 502 });
  }

  // Parse SSE → plain text token stream
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) { controller.close(); return; }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") { controller.close(); return; }
        try {
          const json = JSON.parse(data);
          const token = json.choices?.[0]?.delta?.content;
          if (token) controller.enqueue(encoder.encode(token));
        } catch { /* ignore malformed SSE line */ }
      }
    },
    cancel() { reader.cancel(); },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "x-luna-provider": `groq:${model}`,
    },
  });
}

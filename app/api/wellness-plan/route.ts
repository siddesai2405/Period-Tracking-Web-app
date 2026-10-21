import { NextRequest } from "next/server";

export const runtime = "nodejs";

interface WellnessContext {
  name?: string;
  phase?: string;
  dayOfCycle?: number;
  healthGoal?: string;
  activityLevel?: string;
  medicalConditions?: string[];
  recentSymptoms?: string[];
  recentMood?: string | null;
  avgSleepHrs?: number | null;
  stressLevel?: number;
  pcosRisk?: string | null;
  healthScore?: number | null;
}

function buildPrompt(ctx: WellnessContext): string {
  const conditions = ctx.medicalConditions?.length ? ctx.medicalConditions.join(", ") : "none";
  const symptoms = ctx.recentSymptoms?.length ? ctx.recentSymptoms.join(", ") : "none";
  const energyNote = ctx.avgSleepHrs != null && ctx.avgSleepHrs < 6 ? "low energy (sleep-deprived)" : ctx.stressLevel != null && ctx.stressLevel >= 4 ? "high stress" : "moderate energy";

  return `You are Luna, a holistic wellness coach for Lotus Phase. Create a personalized wellness routine for today.

USER PROFILE:
- Cycle phase: ${ctx.phase || "unknown"} (day ${ctx.dayOfCycle || "?"})
- Health goal: ${ctx.healthGoal || "maintain"}
- Activity level: ${ctx.activityLevel || "moderate"}
- Medical conditions: ${conditions}
- Current symptoms: ${symptoms}
- Mood today: ${ctx.recentMood || "not tracked"}
- Avg sleep: ${ctx.avgSleepHrs != null ? `${ctx.avgSleepHrs}h` : "unknown"} | Energy state: ${energyNote}
- Stress level: ${ctx.stressLevel != null ? `${ctx.stressLevel}/5` : "not tracked"}
- PCOS risk: ${ctx.pcosRisk || "not assessed"}
- Cycle health score: ${ctx.healthScore != null ? `${ctx.healthScore}/100` : "not computed"}

Generate a deeply personalized wellness plan for today. Adjust everything based on their current energy, symptoms, and phase.

## 🧘 Movement & Yoga Sequence
3-4 specific poses/exercises perfectly matched to the ${ctx.phase} phase and current energy (${energyNote}). For each:
- Name the pose/exercise
- Duration (minutes)
- Exact benefit for this phase
- Modification if they have symptoms: ${symptoms}

## 🌿 Mind-Body Practice
One specific breathwork or meditation technique ideal for their stress level (${ctx.stressLevel != null ? `${ctx.stressLevel}/5` : "unknown"}) and mood (${ctx.recentMood || "unknown"}). Include step-by-step instructions (3-5 steps).

## 💆 Self-Care Rituals
4 specific self-care actions tailored to the ${ctx.phase} phase. Make them ultra-specific (not "take a bath" but "warm bath with 2 drops lavender + epsom salts for 20 min before bed"). Reference their symptoms if relevant.

## 😴 Sleep Optimization
Specific sleep guidance based on their ${ctx.avgSleepHrs != null ? `${ctx.avgSleepHrs}h average` : "unknown sleep pattern"}. Include: ideal bedtime, bedroom environment tip, and one ${ctx.phase}-specific practice that improves sleep quality.

## ⚡ Energy Management
How to pace energy through the day given the ${ctx.phase} phase characteristics and their current energy state (${energyNote}). Include one specific tip for their goal: ${ctx.healthGoal}.

## 🌸 Luna's Wellness Whisper
One deeply personalized insight combining their phase + symptoms + conditions + stress. Something they wouldn't find in a generic wellness app.

Be specific, warm, and actionable. Every recommendation should feel like it was written just for them.`;
}

function groqStream(apiKey: string, model: string, prompt: string): Promise<Response> {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.72,
      max_tokens: 1400,
      messages: [
        { role: "system", content: "You are Luna, a holistic wellness coach for Lotus Phase. Generate warm, specific, phase-aware wellness routines." },
        { role: "user", content: prompt },
      ],
    }),
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  let body: { context: WellnessContext };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const ctx = body.context || {};
  const encoder = new TextEncoder();

  if (!apiKey) {
    const fallback = `## Personalized Wellness Plan\n\nAdd a Groq API key to get a fully personalized wellness routine for your ${ctx.phase || "current"} phase, including custom yoga sequences, breathwork, and self-care rituals.\n\nFor now, scroll down to see your phase-specific wellness plan.`;
    return new Response(
      new ReadableStream({
        async start(controller) {
          for (const chunk of fallback.split(/(\s+)/)) {
            controller.enqueue(encoder.encode(chunk));
            await new Promise((r) => setTimeout(r, 12));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8", "x-provider": "offline" } },
    );
  }

  const upstream = await groqStream(apiKey, model, buildPrompt(ctx));

  if (!upstream.ok || !upstream.body) {
    return new Response("AI service unavailable", { status: 502 });
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
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
        } catch { /* skip */ }
      }
    },
    cancel() { reader.cancel(); },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "x-provider": `groq:${model}` },
  });
}

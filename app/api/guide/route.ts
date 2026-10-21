import { NextRequest } from "next/server";

export const runtime = "nodejs";

interface GuideContext {
  name?: string;
  phase?: string;
  dayOfCycle?: number;
  dietPreference?: string;
  healthGoal?: string;
  recentSymptoms?: string[];
  recentMood?: string | null;
  avgSleepHrs?: number | null;
  avgWaterCups?: number | null;
  pcosRisk?: string | null;
  healthScore?: number | null;
  height?: number;
  weight?: number;
  activityLevel?: string;
  medicalConditions?: string[];
  foodAllergies?: string[];
  stressLevel?: number;
  nextPeriodStart?: string;
}

function buildPrompt(ctx: GuideContext): string {
  const conditions = ctx.medicalConditions?.length ? ctx.medicalConditions.join(", ") : "none mentioned";
  const allergies = ctx.foodAllergies?.length ? ctx.foodAllergies.join(", ") : "none";
  const bmi = ctx.height && ctx.weight ? (ctx.weight / ((ctx.height / 100) ** 2)).toFixed(1) : null;

  return `You are Luna, a warm AI wellness companion. Generate a highly personalized daily guide for TODAY.

USER PROFILE:
- Name: ${ctx.name || "friend"}
- Cycle phase: ${ctx.phase || "unknown"} (day ${ctx.dayOfCycle || "?"} of cycle)
- Diet: ${ctx.dietPreference || "nonveg"} | Allergies/avoid: ${allergies}
- Health goal: ${ctx.healthGoal || "maintain"}
- Medical conditions: ${conditions}
- Activity level: ${ctx.activityLevel || "moderate"}
- Height: ${ctx.height ? `${ctx.height}cm` : "not set"} | Weight: ${ctx.weight ? `${ctx.weight}kg` : "not set"}${bmi ? ` | BMI: ${bmi}` : ""}
- Recent symptoms: ${ctx.recentSymptoms?.join(", ") || "none logged"}
- Recent mood: ${ctx.recentMood || "not tracked"}
- Avg sleep: ${ctx.avgSleepHrs != null ? `${ctx.avgSleepHrs}h` : "unknown"}
- Avg water: ${ctx.avgWaterCups != null ? `${ctx.avgWaterCups} cups/day` : "unknown"}
- PCOS risk: ${ctx.pcosRisk || "not assessed"}
- Stress level: ${ctx.stressLevel != null ? `${ctx.stressLevel}/5` : "not tracked"}
- Cycle health score: ${ctx.healthScore != null ? `${ctx.healthScore}/100` : "not computed"}
- Next period: ${ctx.nextPeriodStart || "not enough data"}

Generate a PERSONALIZED daily guide. Make it specific to their phase, symptoms, and conditions — NOT generic. Structure your response with these exact sections:

## 🌅 Morning Routine
List 4-5 specific tasks tailored to their phase and current symptoms. If they have PCOS, emphasize low-GI breakfast. If sleep-deprived, add a gentle wake-up ritual. Be concrete (timing, quantities).

## 🍽️ Today's Meal Plan
Breakfast, lunch, dinner, and 2 snacks. All meals must be ${ctx.dietPreference || "nonveg"} and avoid: ${allergies}. Tailor to the ${ctx.phase || "current"} phase needs. Include specific foods, not vague categories.

## 💪 Movement & Energy
2-3 specific exercises or yoga poses ideal for the ${ctx.phase || "current"} phase. Include duration. Adjust intensity based on their energy level and any symptoms (e.g., cramps = gentle yin yoga, high energy = HIIT).

## 🌙 Evening Wind-Down
3-4 tasks personalized to their stress level (${ctx.stressLevel != null ? `${ctx.stressLevel}/5` : "unknown"}) and sleep average (${ctx.avgSleepHrs != null ? `${ctx.avgSleepHrs}h` : "unknown"}). Include screen time guidance and one relaxation technique.

## ✨ Luna's Insight for Today
One powerful, specific insight that combines their phase + symptoms + goal + conditions. This should feel like advice from someone who truly knows their health data.

Keep the tone warm, practical, and encouraging. No disclaimers. No filler. Every word should add value.`;
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
        { role: "system", content: "You are Luna, a warm AI wellness companion for Lotus Phase. Generate personalized, evidence-based, phase-specific daily wellness guidance." },
        { role: "user", content: prompt },
      ],
    }),
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  let body: { context: GuideContext };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const ctx = body.context || {};
  const encoder = new TextEncoder();

  if (!apiKey) {
    const fallback = `## Today's ${ctx.phase || "Phase"} Guide\n\nConnect a Groq API key for fully personalized AI-generated daily plans.\n\nMeanwhile, your phase-based guide below has recommendations for the ${ctx.phase || "current"} phase. Visit **Profile** → set up API key for AI personalization.`;
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
        } catch { /* skip malformed line */ }
      }
    },
    cancel() { reader.cancel(); },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "x-provider": `groq:${model}` },
  });
}

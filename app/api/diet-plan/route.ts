import { NextRequest } from "next/server";

export const runtime = "nodejs";

interface DietContext {
  name?: string;
  phase?: string;
  dayOfCycle?: number;
  dietPreference?: string;
  healthGoal?: string;
  foodAllergies?: string[];
  medicalConditions?: string[];
  weight?: number;
  height?: number;
  activityLevel?: string;
  recentSymptoms?: string[];
  avgSleepHrs?: number | null;
  stressLevel?: number;
}

function buildPrompt(ctx: DietContext): string {
  const allergies = ctx.foodAllergies?.length ? ctx.foodAllergies.join(", ") : "none";
  const conditions = ctx.medicalConditions?.length ? ctx.medicalConditions.join(", ") : "none";
  const bmi = ctx.height && ctx.weight ? (ctx.weight / ((ctx.height / 100) ** 2)).toFixed(1) : null;

  return `You are Luna, a nutritionist AI for Lotus Phase. Create a personalized 3-day meal plan.

USER PROFILE:
- Cycle phase: ${ctx.phase || "unknown"} (day ${ctx.dayOfCycle || "?"})
- Diet type: ${ctx.dietPreference || "nonveg"}
- Health goal: ${ctx.healthGoal || "maintain"}
- Allergies/avoid: ${allergies}
- Medical conditions: ${conditions}
- Activity level: ${ctx.activityLevel || "moderate"}
- Weight: ${ctx.weight ? `${ctx.weight}kg` : "not set"} | BMI: ${bmi || "not computed"}
- Symptoms today: ${ctx.recentSymptoms?.join(", ") || "none"}
- Sleep quality: ${ctx.avgSleepHrs != null ? `${ctx.avgSleepHrs}h avg` : "unknown"}
- Stress level: ${ctx.stressLevel != null ? `${ctx.stressLevel}/5` : "not tracked"}

Generate a personalized 3-day meal plan optimized for the ${ctx.phase || "current"} phase. Every meal must be ${ctx.dietPreference || "nonveg"} compatible and avoid ${allergies}.

## 📋 Day 1 — ${ctx.phase || "Phase"} Focus
**Breakfast:** [specific meal with portions]
**Mid-morning snack:** [specific]
**Lunch:** [specific meal with portions]
**Afternoon snack:** [specific]
**Dinner:** [specific meal with portions]
*Phase benefit: [1-line note on why this day's plan helps in this phase]*

## 📋 Day 2 — Energy & Recovery
**Breakfast:** [different from Day 1]
**Mid-morning snack:** [specific]
**Lunch:** [specific]
**Afternoon snack:** [specific]
**Dinner:** [specific]
*Phase benefit: [1-line note]*

## 📋 Day 3 — Hormone Support
**Breakfast:** [different from Days 1-2]
**Mid-morning snack:** [specific]
**Lunch:** [specific]
**Afternoon snack:** [specific]
**Dinner:** [specific]
*Phase benefit: [1-line note]*

## 🔬 Key Nutrients This Phase
List the 4 most important nutrients for the ${ctx.phase} phase and their best ${ctx.dietPreference} sources.

## 💧 Hydration Plan
Specific hydration targets and 2-3 drinks/infusions ideal for this phase.

## ⚠️ Avoid This Week
3-5 specific foods that are especially counter-productive in the ${ctx.phase} phase for someone with goal: ${ctx.healthGoal}.

Be specific with portions where helpful. Make it feel custom, not copy-pasted from a generic guide.`;
}

function groqStream(apiKey: string, model: string, prompt: string): Promise<Response> {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.7,
      max_tokens: 1600,
      messages: [
        { role: "system", content: "You are Luna, a certified nutritionist AI for Lotus Phase. Generate evidence-based, cycle-synced, personalized meal plans." },
        { role: "user", content: prompt },
      ],
    }),
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  let body: { context: DietContext };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const ctx = body.context || {};
  const encoder = new TextEncoder();

  if (!apiKey) {
    const fallback = `## AI Meal Plan\n\nAdd a Groq API key to get a fully personalized 3-day meal plan tailored to your ${ctx.phase || "current"} phase, dietary preferences, and health goals.\n\nIn the meantime, explore the **Diet Guide** tab below for phase-specific food recommendations.`;
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

/**
 * HuggingFace Inference API proxy — semantic embedding endpoint
 *
 * Model: sentence-transformers/all-MiniLM-L6-v2
 *   • 384-dimensional sentence embeddings
 *   • Free tier via HuggingFace Inference API (no GPU required)
 *   • Used for semantic KB search in the offline chat fallback
 *
 * Keeps HF_TOKEN server-side; never exposed to the client.
 *
 * Usage: POST /api/embed  { "texts": ["query", "kb entry 1", "kb entry 2", ...] }
 * Returns: { "embeddings": [[...], [...], ...] }
 */

import { NextRequest } from "next/server";

export const runtime = "nodejs";

const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const HF_ENDPOINT = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA > 0 && normB > 0 ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

export async function POST(req: NextRequest) {
  const hfToken = process.env.HF_TOKEN;

  if (!hfToken) {
    return Response.json({ error: "HF_TOKEN not configured" }, { status: 503 });
  }

  let body: { texts?: string[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const texts = body.texts;
  if (!Array.isArray(texts) || texts.length === 0) {
    return Response.json({ error: "texts array required" }, { status: 400 });
  }

  // HuggingFace expects { inputs: string[] } for batch embedding
  const hfRes = await fetch(HF_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${hfToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
  });

  if (!hfRes.ok) {
    const err = await hfRes.text().catch(() => "");
    // Model may be loading (503); surface this so client can fall back
    return Response.json({ error: `HF API ${hfRes.status}: ${err}` }, { status: hfRes.status });
  }

  const embeddings: number[][] = await hfRes.json();

  return Response.json({ embeddings });
}

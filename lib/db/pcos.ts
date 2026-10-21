import { supabase } from "@/lib/supabase";
import type { PCOSProfile } from "@/lib/store";

export async function getPCOS(userId: string): Promise<PCOSProfile> {
  const { data, error } = await supabase
    .from("pcos_assessments")
    .select("answers, completed_at")
    .eq("user_id", userId)
    .single();

  if (error || !data) return { answers: {} };
  return {
    answers: (data.answers as Record<string, number>) || {},
    completedAt: data.completed_at ?? undefined,
  };
}

export async function savePCOS(userId: string, answers: Record<string, number>): Promise<void> {
  await supabase.from("pcos_assessments").upsert(
    { user_id: userId, answers, completed_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
}

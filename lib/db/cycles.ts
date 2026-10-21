import { supabase } from "@/lib/supabase";
import type { Cycle } from "@/lib/store";

export async function getCycles(userId: string): Promise<Cycle[]> {
  const { data, error } = await supabase
    .from("cycles")
    .select("start_date, end_date")
    .eq("user_id", userId)
    .order("start_date", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => ({
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
  }));
}

export async function addCycle(userId: string, cycle: Cycle): Promise<void> {
  await supabase.from("cycles").upsert(
    { user_id: userId, start_date: cycle.startDate, end_date: cycle.endDate ?? null },
    { onConflict: "user_id,start_date" },
  );
}

export async function removeCycle(userId: string, startDate: string): Promise<void> {
  await supabase
    .from("cycles")
    .delete()
    .eq("user_id", userId)
    .eq("start_date", startDate);
}

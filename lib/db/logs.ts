import { supabase } from "@/lib/supabase";
import type { LogEntry } from "@/lib/store";

export async function getLogs(userId: string): Promise<Record<string, LogEntry>> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId);

  if (error || !data) return {};
  const map: Record<string, LogEntry> = {};
  for (const row of data) {
    map[row.date] = {
      date: row.date,
      flow: (row.flow as LogEntry["flow"]) ?? null,
      mood: (row.mood as LogEntry["mood"]) ?? null,
      symptoms: (row.symptoms as string[]) || [],
      sleepHrs: row.sleep_hrs ?? undefined,
      waterCups: row.water_cups ?? undefined,
      notes: row.notes ?? undefined,
    };
  }
  return map;
}

export async function upsertLog(userId: string, entry: LogEntry): Promise<void> {
  await supabase.from("daily_logs").upsert(
    {
      user_id: userId,
      date: entry.date,
      flow: entry.flow ?? null,
      mood: entry.mood ?? null,
      symptoms: entry.symptoms,
      sleep_hrs: entry.sleepHrs ?? null,
      water_cups: entry.waterCups ?? null,
      notes: entry.notes ?? null,
    },
    { onConflict: "user_id,date" },
  );
}

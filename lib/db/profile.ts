import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/store";

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    name: (row.name as string) || "Friend",
    email: "",
    avatarSeed: (row.avatar_seed as string) || "luna",
    avgCycleLength: (row.avg_cycle_length as number) || 28,
    avgPeriodLength: (row.avg_period_length as number) || 5,
    birthYear: (row.birth_year as number) || undefined,
    accentTheme: ((row.accent_theme as string) || "rose") as Profile["accentTheme"],
    dietPreference: ((row.diet_preference as string) || "nonveg") as Profile["dietPreference"],
    healthGoal: ((row.health_goal as string) || "maintain") as Profile["healthGoal"],
    activityLevel: (row.activity_level as Profile["activityLevel"]) || undefined,
    height: (row.height as number) || undefined,
    weight: (row.weight as number) || undefined,
    medicalConditions: (row.medical_conditions as string[]) || [],
    foodAllergies: (row.food_allergies as string[]) || [],
    stressLevel: (row.stress_level as number) || undefined,
    isAdmin: (row.is_admin as boolean) || false,
    reminders: { period: true, ovulation: false, daysBefore: 2 },
    adminPin: "1234",
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return rowToProfile(data as Record<string, unknown>);
}

export async function updateProfile(userId: string, patch: Partial<Profile>): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.avatarSeed !== undefined) dbPatch.avatar_seed = patch.avatarSeed;
  if (patch.avgCycleLength !== undefined) dbPatch.avg_cycle_length = patch.avgCycleLength;
  if (patch.avgPeriodLength !== undefined) dbPatch.avg_period_length = patch.avgPeriodLength;
  if (patch.birthYear !== undefined) dbPatch.birth_year = patch.birthYear;
  if (patch.accentTheme !== undefined) dbPatch.accent_theme = patch.accentTheme;
  if (patch.dietPreference !== undefined) dbPatch.diet_preference = patch.dietPreference;
  if (patch.healthGoal !== undefined) dbPatch.health_goal = patch.healthGoal;
  if (patch.activityLevel !== undefined) dbPatch.activity_level = patch.activityLevel;
  if (patch.height !== undefined) dbPatch.height = patch.height;
  if (patch.weight !== undefined) dbPatch.weight = patch.weight;
  if (patch.medicalConditions !== undefined) dbPatch.medical_conditions = patch.medicalConditions;
  if (patch.foodAllergies !== undefined) dbPatch.food_allergies = patch.foodAllergies;
  if (patch.stressLevel !== undefined) dbPatch.stress_level = patch.stressLevel;
  dbPatch.updated_at = new Date().toISOString();

  await supabase.from("profiles").update(dbPatch).eq("id", userId);
}

export async function getOnboardedStatus(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", userId)
    .single();
  return (data as { onboarded?: boolean } | null)?.onboarded ?? false;
}

export async function setOnboarded(userId: string, value: boolean): Promise<void> {
  await supabase.from("profiles").update({ onboarded: value }).eq("id", userId);
}

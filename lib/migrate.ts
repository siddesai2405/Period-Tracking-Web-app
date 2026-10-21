"use client";
import { supabase } from "@/lib/supabase";
import { addCycle } from "@/lib/db/cycles";
import { upsertLog } from "@/lib/db/logs";
import { savePCOS } from "@/lib/db/pcos";
import { updateProfile, setOnboarded } from "@/lib/db/profile";
import type { Profile, Cycle, LogEntry, PCOSProfile } from "@/lib/store";

const LEGACY_KEY = "lunacare-store";
const MIGRATED_KEY = "lunacare-migrated-v1";

export async function migrateLocalDataIfNeeded(userId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(MIGRATED_KEY) === userId) return false;

  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) return false;

  let state: { state?: { profile?: Profile; cycles?: Cycle[]; logs?: Record<string, LogEntry>; pcosProfile?: PCOSProfile; onboarded?: boolean } } | null = null;
  try { state = JSON.parse(raw); } catch { return false; }
  if (!state?.state) return false;

  const { profile, cycles, logs, pcosProfile, onboarded } = state.state;

  const promises: Promise<unknown>[] = [];

  if (profile) {
    promises.push(updateProfile(userId, {
      name: profile.name,
      avatarSeed: profile.avatarSeed,
      avgCycleLength: profile.avgCycleLength,
      avgPeriodLength: profile.avgPeriodLength,
      birthYear: profile.birthYear,
      accentTheme: profile.accentTheme,
      dietPreference: profile.dietPreference,
      healthGoal: profile.healthGoal,
      activityLevel: profile.activityLevel,
      height: profile.height,
      weight: profile.weight,
      medicalConditions: profile.medicalConditions,
      foodAllergies: profile.foodAllergies,
      stressLevel: profile.stressLevel,
    }));
  }

  if (onboarded) promises.push(setOnboarded(userId, true));

  for (const cycle of cycles ?? []) {
    promises.push(addCycle(userId, cycle));
  }

  for (const entry of Object.values(logs ?? {}) as LogEntry[]) {
    promises.push(upsertLog(userId, entry));
  }

  if (pcosProfile?.answers && Object.keys(pcosProfile.answers).length > 0) {
    promises.push(savePCOS(userId, pcosProfile.answers));
  }

  await Promise.allSettled(promises);

  // Mark migration done — keep old data in case of rollback
  localStorage.setItem(MIGRATED_KEY, userId);
  return true;
}

"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Flow = "spotting" | "light" | "medium" | "heavy" | null;
export type Mood = "happy" | "calm" | "sad" | "anxious" | "irritable" | "energetic" | null;
export type AccentTheme = "rose" | "purple" | "ocean" | "forest" | "sunset";
export type DietPreference = "nonveg" | "veg" | "vegan" | "glutenfree";
export type HealthGoal = "maintain" | "weightloss" | "weightgain" | "pcos" | "fertility";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "veryActive";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  isActive: boolean;
  note?: string;
}

export interface StoredChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

export interface LogEntry {
  date: string; // YYYY-MM-DD
  flow: Flow;
  symptoms: string[];
  mood: Mood;
  sleepHrs?: number;
  waterCups?: number;
  notes?: string;
}

export interface Cycle {
  startDate: string; // YYYY-MM-DD
  endDate?: string;
}

export interface Profile {
  name: string;
  email: string;
  avatarSeed: string;
  avgCycleLength: number;
  avgPeriodLength: number;
  birthYear?: number;
  reminders: { period: boolean; ovulation: boolean; daysBefore: number };
  accentTheme: AccentTheme;
  dietPreference: DietPreference;
  healthGoal: HealthGoal;
  adminPin: string;
  isAdmin: boolean;
  // Extended health profile
  height?: number;
  weight?: number;
  activityLevel?: ActivityLevel;
  medicalConditions?: string[];
  foodAllergies?: string[];
  stressLevel?: number;
}

export interface PCOSProfile {
  answers: Record<string, number>;
  completedAt?: string;
}

interface AppState {
  onboarded: boolean;
  profile: Profile;
  cycles: Cycle[];
  logs: Record<string, LogEntry>;
  pcosProfile: PCOSProfile;
  chatHistory: StoredChatMessage[];
  managedUsers: ManagedUser[];
  setProfile: (p: Partial<Profile>) => void;
  setOnboarded: (v: boolean) => void;
  addCycle: (c: Cycle) => void;
  removeCycle: (startDate: string) => void;
  upsertLog: (entry: LogEntry) => void;
  setPCOSAnswers: (answers: Record<string, number>) => void;
  setChatHistory: (msgs: StoredChatMessage[]) => void;
  clearChatHistory: () => void;
  setManagedUsers: (users: ManagedUser[]) => void;
  reset: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

const defaultProfile: Profile = {
  name: "Friend",
  email: "",
  avatarSeed: "luna",
  avgCycleLength: 28,
  avgPeriodLength: 5,
  reminders: { period: true, ovulation: false, daysBefore: 2 },
  accentTheme: "rose",
  dietPreference: "nonveg",
  healthGoal: "maintain",
  adminPin: "1234",
  isAdmin: false,
};

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      onboarded: false,
      profile: defaultProfile,
      cycles: [],
      logs: {},
      pcosProfile: { answers: {} },
      chatHistory: [],
      managedUsers: [],
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setOnboarded: (v) => set({ onboarded: v }),
      addCycle: (c) =>
        set((s) => {
          const next = [...s.cycles.filter((x) => x.startDate !== c.startDate), c].sort((a, b) =>
            a.startDate.localeCompare(b.startDate),
          );
          return { cycles: next };
        }),
      removeCycle: (startDate) =>
        set((s) => ({ cycles: s.cycles.filter((c) => c.startDate !== startDate) })),
      upsertLog: (entry) => set((s) => ({ logs: { ...s.logs, [entry.date]: entry } })),
      setPCOSAnswers: (answers) =>
        set({ pcosProfile: { answers, completedAt: new Date().toISOString().slice(0, 10) } }),
      setChatHistory: (msgs) => set({ chatHistory: msgs.slice(-60) }),
      clearChatHistory: () => set({ chatHistory: [] }),
      setManagedUsers: (users) => set({ managedUsers: users }),
      reset: () =>
        set({ onboarded: false, profile: defaultProfile, cycles: [], logs: {}, pcosProfile: { answers: {} }, chatHistory: [] }),
    }),
    { name: "lunacare-store" },
  ),
);

export { today };

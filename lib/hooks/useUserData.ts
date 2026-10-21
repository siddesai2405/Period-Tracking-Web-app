"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getProfile, updateProfile as dbUpdateProfile, getOnboardedStatus, setOnboarded as dbSetOnboarded } from "@/lib/db/profile";
import { getCycles, addCycle as dbAddCycle, removeCycle as dbRemoveCycle } from "@/lib/db/cycles";
import { getLogs, upsertLog as dbUpsertLog } from "@/lib/db/logs";
import { getPCOS, savePCOS as dbSavePCOS } from "@/lib/db/pcos";
import { getChatHistory, appendMessage as dbAppendMessage, clearChat as dbClearChat } from "@/lib/db/chat";
import type { Profile, Cycle, LogEntry, PCOSProfile, StoredChatMessage } from "@/lib/store";

export interface UserData {
  userId: string | null;
  isAdmin: boolean;
  profile: Profile;
  cycles: Cycle[];
  logs: Record<string, LogEntry>;
  pcosProfile: PCOSProfile;
  chatHistory: StoredChatMessage[];
  onboarded: boolean;
  loading: boolean;

  // Mutations
  setProfile: (patch: Partial<Profile>) => Promise<void>;
  setOnboarded: (v: boolean) => Promise<void>;
  addCycle: (cycle: Cycle) => Promise<void>;
  removeCycle: (startDate: string) => Promise<void>;
  upsertLog: (entry: LogEntry) => Promise<void>;
  setPCOSAnswers: (answers: Record<string, number>) => Promise<void>;
  setChatHistory: (msgs: StoredChatMessage[]) => void;
  clearChatHistory: () => Promise<void>;
}

const DEFAULT_PROFILE: Profile = {
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

export function useUserData(): UserData {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [logs, setLogs] = useState<Record<string, LogEntry>>({});
  const [pcosProfile, setPcosProfile] = useState<PCOSProfile>({ answers: {} });
  const [chatHistory, setChatHistoryState] = useState<StoredChatMessage[]>([]);
  const [onboarded, setOnboardedState] = useState(false);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const loadUserData = useCallback(async (uid: string) => {
    setLoading(true);
    const [prof, cycs, logMap, pcos, chat, ob] = await Promise.all([
      getProfile(uid),
      getCycles(uid),
      getLogs(uid),
      getPCOS(uid),
      getChatHistory(uid),
      getOnboardedStatus(uid),
    ]);

    if (prof) {
      // Fetch email from supabase session
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email ?? "";
      setProfileState({ ...prof, email });
      setIsAdmin(prof.isAdmin);
    }
    setCycles(cycs);
    setLogs(logMap);
    setPcosProfile(pcos);
    setChatHistoryState(chat);
    setOnboardedState(ob);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      if (uid && !initialized.current) {
        initialized.current = true;
        loadUserData(uid);
      } else if (!uid) {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid && !initialized.current) {
        initialized.current = true;
        loadUserData(uid);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadUserData]);

  const setProfile = useCallback(async (patch: Partial<Profile>) => {
    if (!userId) return;
    setProfileState((prev) => ({ ...prev, ...patch }));
    await dbUpdateProfile(userId, patch);
  }, [userId]);

  const setOnboarded = useCallback(async (v: boolean) => {
    if (!userId) return;
    setOnboardedState(v);
    await dbSetOnboarded(userId, v);
  }, [userId]);

  const addCycle = useCallback(async (cycle: Cycle) => {
    if (!userId) return;
    setCycles((prev) => {
      const without = prev.filter((c) => c.startDate !== cycle.startDate);
      return [...without, cycle].sort((a, b) => a.startDate.localeCompare(b.startDate));
    });
    await dbAddCycle(userId, cycle);
  }, [userId]);

  const removeCycle = useCallback(async (startDate: string) => {
    if (!userId) return;
    setCycles((prev) => prev.filter((c) => c.startDate !== startDate));
    await dbRemoveCycle(userId, startDate);
  }, [userId]);

  const upsertLog = useCallback(async (entry: LogEntry) => {
    if (!userId) return;
    setLogs((prev) => ({ ...prev, [entry.date]: entry }));
    await dbUpsertLog(userId, entry);
  }, [userId]);

  const setPCOSAnswers = useCallback(async (answers: Record<string, number>) => {
    if (!userId) return;
    const updated: PCOSProfile = { answers, completedAt: new Date().toISOString() };
    setPcosProfile(updated);
    await dbSavePCOS(userId, answers);
  }, [userId]);

  const setChatHistory = useCallback((msgs: StoredChatMessage[]) => {
    setChatHistoryState(msgs.slice(-60));
    // Persist is handled per-message via appendMessage; bulk set is for local sync
  }, []);

  const clearChatHistory = useCallback(async () => {
    if (!userId) return;
    setChatHistoryState([]);
    await dbClearChat(userId);
  }, [userId]);

  return {
    userId,
    isAdmin,
    profile,
    cycles,
    logs,
    pcosProfile,
    chatHistory,
    onboarded,
    loading,
    setProfile,
    setOnboarded,
    addCycle,
    removeCycle,
    upsertLog,
    setPCOSAnswers,
    setChatHistory,
    clearChatHistory,
  };
}

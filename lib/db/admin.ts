import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { User } from "@supabase/supabase-js";
import type { Cycle, LogEntry, PCOSProfile } from "@/lib/store";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  onboarded: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  cycle_count: number;
  log_count: number;
  chat_count: number;
  last_log_date: string | null;
  avg_cycle_length: number;
  avg_period_length: number;
}

export interface PlatformStats {
  total_users: number;
  active_this_week: number;
  total_cycles: number;
  total_logs: number;
  new_this_month: number;
  signups_by_month: { month: string; count: number }[];
  activity_tiers: { label: string; count: number }[];
}

export interface UserDetail {
  profile: AdminUserRow;
  fullProfile: {
    birth_year: number | null;
    accent_theme: string;
    diet_preference: string;
    health_goal: string;
    activity_level: string | null;
    height: number | null;
    weight: number | null;
    medical_conditions: string[];
    food_allergies: string[];
    stress_level: number | null;
    updated_at: string | null;
  };
  cycles: Cycle[];
  logs: LogEntry[];
  pcosProfile: PCOSProfile;
  chatMessages: { role: "user" | "assistant"; content: string; createdAt: string }[];
}

async function listAllAuthUsers() {
  const users: User[] = [];
  let page = 1;

  while (page <= 10) {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    const next = data?.users ?? [];
    users.push(...next);
    if (next.length < 1000) break;
    page += 1;
  }

  return users;
}

export async function getAllUsers(): Promise<AdminUserRow[]> {
  // Get profiles
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, name, is_admin, is_active, onboarded, avg_cycle_length, avg_period_length, created_at")
    .order("created_at", { ascending: false });

  if (!profiles) return [];

  // Get auth users for email + last_sign_in_at
  const authUsers = await listAllAuthUsers();
  const authMap = new Map(authUsers.map((u) => [u.id, u]) ?? []);

  // Get cycle counts per user
  const { data: cycleCounts } = await supabaseAdmin
    .from("cycles")
    .select("user_id");
  const cycleMap = new Map<string, number>();
  for (const row of cycleCounts ?? []) {
    cycleMap.set(row.user_id, (cycleMap.get(row.user_id) ?? 0) + 1);
  }

  // Get log counts per user
  const { data: logCounts } = await supabaseAdmin
    .from("daily_logs")
    .select("user_id, date");
  const logMap = new Map<string, number>();
  const lastLogMap = new Map<string, string>();
  for (const row of logCounts ?? []) {
    logMap.set(row.user_id, (logMap.get(row.user_id) ?? 0) + 1);
    const current = lastLogMap.get(row.user_id);
    if (!current || row.date > current) lastLogMap.set(row.user_id, row.date);
  }

  // Get chat counts per user
  const { data: chatCounts } = await supabaseAdmin
    .from("chat_messages")
    .select("user_id");
  const chatMap = new Map<string, number>();
  for (const row of chatCounts ?? []) {
    chatMap.set(row.user_id, (chatMap.get(row.user_id) ?? 0) + 1);
  }

  return profiles.map((p) => {
    const auth = authMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      email: auth?.email ?? "",
      is_admin: p.is_admin,
      is_active: p.is_active ?? true,
      onboarded: p.onboarded,
      created_at: p.created_at,
      last_sign_in_at: auth?.last_sign_in_at ?? null,
      cycle_count: cycleMap.get(p.id) ?? 0,
      log_count: logMap.get(p.id) ?? 0,
      chat_count: chatMap.get(p.id) ?? 0,
      last_log_date: lastLogMap.get(p.id) ?? null,
      avg_cycle_length: p.avg_cycle_length,
      avg_period_length: p.avg_period_length,
    };
  });
}

export async function getUserDetail(userId: string): Promise<UserDetail | null> {
  const [profileRes, cyclesRes, logsRes, pcosRes, chatRes, authRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("*").eq("id", userId).single(),
    supabaseAdmin.from("cycles").select("start_date, end_date").eq("user_id", userId).order("start_date", { ascending: false }),
    supabaseAdmin.from("daily_logs").select("*").eq("user_id", userId).order("date", { ascending: false }),
    supabaseAdmin.from("pcos_assessments").select("answers, completed_at").eq("user_id", userId).single(),
    supabaseAdmin.from("chat_messages").select("role, content, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabaseAdmin.auth.admin.getUserById(userId),
  ]);

  if (profileRes.error) return null;
  const p = profileRes.data as Record<string, unknown>;
  const auth = authRes.data?.user;

  const profile: AdminUserRow = {
    id: userId,
    name: (p.name as string) || "",
    email: auth?.email ?? "",
    is_admin: (p.is_admin as boolean) || false,
    is_active: (p.is_active as boolean) ?? true,
    onboarded: (p.onboarded as boolean) || false,
    created_at: (p.created_at as string) || "",
    last_sign_in_at: auth?.last_sign_in_at ?? null,
    cycle_count: cyclesRes.data?.length ?? 0,
    log_count: logsRes.data?.length ?? 0,
    chat_count: chatRes.data?.length ?? 0,
    last_log_date: logsRes.data?.[0]?.date ?? null,
    avg_cycle_length: (p.avg_cycle_length as number) || 28,
    avg_period_length: (p.avg_period_length as number) || 5,
  };

  const fullProfile = {
    birth_year: (p.birth_year as number | null) ?? null,
    accent_theme: (p.accent_theme as string) || "rose",
    diet_preference: (p.diet_preference as string) || "nonveg",
    health_goal: (p.health_goal as string) || "maintain",
    activity_level: (p.activity_level as string | null) ?? null,
    height: (p.height as number | null) ?? null,
    weight: (p.weight as number | null) ?? null,
    medical_conditions: (p.medical_conditions as string[]) || [],
    food_allergies: (p.food_allergies as string[]) || [],
    stress_level: (p.stress_level as number | null) ?? null,
    updated_at: (p.updated_at as string | null) ?? null,
  };

  const cycles: Cycle[] = (cyclesRes.data ?? []).map((r) => ({
    startDate: r.start_date,
    endDate: r.end_date ?? undefined,
  }));

  const logsMap: Record<string, LogEntry> = {};
  for (const row of logsRes.data ?? []) {
    const r = row as Record<string, unknown>;
    logsMap[r.date as string] = {
      date: r.date as string,
      flow: (r.flow as LogEntry["flow"]) ?? null,
      mood: (r.mood as LogEntry["mood"]) ?? null,
      symptoms: (r.symptoms as string[]) || [],
      sleepHrs: (r.sleep_hrs as number) ?? undefined,
      waterCups: (r.water_cups as number) ?? undefined,
      notes: (r.notes as string) ?? undefined,
    };
  }

  const pcosProfile: PCOSProfile = pcosRes.data
    ? { answers: (pcosRes.data.answers as Record<string, number>) || {}, completedAt: pcosRes.data.completed_at ?? undefined }
    : { answers: {} };

  const chatMessages = (chatRes.data ?? []).map((row) => ({
    role: row.role as "user" | "assistant",
    content: row.content,
    createdAt: row.created_at,
  }));

  return { profile, fullProfile, cycles, logs: Object.values(logsMap), pcosProfile, chatMessages };
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [profilesRes, cyclesRes, logsRes, authRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, created_at"),
    supabaseAdmin.from("cycles").select("user_id"),
    supabaseAdmin.from("daily_logs").select("user_id, date"),
    listAllAuthUsers(),
  ]);

  const profiles = profilesRes.data ?? [];
  const total_users = profiles.length;
  const total_cycles = cyclesRes.data?.length ?? 0;
  const total_logs = logsRes.data?.length ?? 0;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const active_this_week = (authRes ?? []).filter(
    (u) => u.last_sign_in_at && new Date(u.last_sign_in_at) > weekAgo,
  ).length;
  const new_this_month = profiles.filter(
    (p) => new Date(p.created_at) >= monthStart,
  ).length;

  // Signups by month (last 12)
  const monthMap = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const p of profiles) {
    const key = p.created_at.slice(0, 7);
    if (monthMap.has(key)) monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }
  const signups_by_month = Array.from(monthMap.entries()).map(([month, count]) => ({
    month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    count,
  }));

  // Activity tiers by log count
  const logCountMap = new Map<string, number>();
  for (const row of logsRes.data ?? []) {
    logCountMap.set(row.user_id, (logCountMap.get(row.user_id) ?? 0) + 1);
  }
  const tiers = [0, 0, 0, 0];
  for (const count of logCountMap.values()) {
    if (count <= 5) tiers[0]++;
    else if (count <= 20) tiers[1]++;
    else if (count <= 50) tiers[2]++;
    else tiers[3]++;
  }
  const noLogs = total_users - logCountMap.size;
  const activity_tiers = [
    { label: "No logs", count: noLogs },
    { label: "1-5 logs", count: tiers[0] },
    { label: "6-20 logs", count: tiers[1] },
    { label: "21-50 logs", count: tiers[2] },
    { label: "50+ logs", count: tiers[3] },
  ];

  return { total_users, active_this_week, total_cycles, total_logs, new_this_month, signups_by_month, activity_tiers };
}

export async function deleteUser(userId: string): Promise<void> {
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

export async function setUserActive(userId: string, isActive: boolean): Promise<void> {
  await supabaseAdmin.from("profiles").update({ is_active: isActive }).eq("id", userId);
}

export async function setUserAdmin(userId: string, isAdmin: boolean): Promise<void> {
  await supabaseAdmin.from("profiles").update({ is_admin: isAdmin }).eq("id", userId);
}

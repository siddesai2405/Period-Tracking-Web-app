"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, BarChart3, Settings2, ArrowLeft,
  UserPlus, Trash2, Search, ChevronRight, CheckCircle2,
  Download, Shield, TrendingUp, Activity, CalendarDays, RefreshCcw,
  Eye, UserCheck, UserX, LogOut, Mail, User, Lock, Eye as EyeIcon, EyeOff,
  Crown,
} from "lucide-react";
import { signOut } from "@/lib/auth";
import type { AdminUserRow, PlatformStats, UserDetail } from "@/lib/db/admin";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { predict } from "@/lib/ai/prediction";
import type { Cycle, LogEntry } from "@/lib/store";

const CHART_COLORS = ["#ff97ba", "#a386ff", "#67e8f9", "#86efac", "#fde68a"];
const TT = { background: "rgb(var(--card))", border: "1px solid rgb(var(--border))", borderRadius: 12, color: "rgb(var(--fg))", fontSize: 12 };

interface AdminOverviewResponse {
  users: AdminUserRow[];
  stats: PlatformStats;
  currentAdminId: string;
}

async function fetchAdminJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? "Admin request failed");
  }
  return json as T;
}

function fmt(d: string | null) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

function timeAgo(d: string | null) {
  if (!d) return "Never";
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return fmt(d);
}

/* ── Avatar ── */
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-xl flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, background: "linear-gradient(135deg, rgb(var(--gstart)), rgb(var(--gend)))" }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ── KPI Card ── */
function KPICard({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="bento-stat rounded-2xl p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs opacity-50 truncate">{label}</p>
        <p className="font-display font-bold text-xl leading-tight" style={{ color }}>{value}</p>
        {sub && <p className="text-[10px] opacity-40 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function TagList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border)/0.55)] bg-[rgb(var(--surface)/0.45)] px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">None recorded</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span key={item} className="rounded-full bg-[rgb(var(--acc-500)/0.12)] px-2.5 py-1 text-[11px] font-bold text-[rgb(var(--acc-500))]">
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */
export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "analytics" | "system">("dashboard");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState("");
  const [currentAdminId, setCurrentAdminId] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setDataError("");
    try {
      const data = await fetchAdminJson<AdminOverviewResponse>("/api/admin/overview", { cache: "no-store" });
      setUsers(data.users);
      setStats(data.stats);
      setCurrentAdminId(data.currentAdminId);
      return data.users;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load admin data";
      setDataError(message);
      if (message === "Unauthorized") router.replace("/login");
      if (message === "Admin access required") router.replace("/dashboard");
      return [];
    } finally {
      setLoadingData(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const openUserDetail = useCallback(async (user: AdminUserRow) => {
    setSelectedUser(user);
    setDetailLoading(true);
    setDataError("");
    try {
      const data = await fetchAdminJson<{ detail: UserDetail }>(`/api/admin/user/${user.id}`, { cache: "no-store" });
      setUserDetail(data.detail);
      setSelectedUser(data.detail.profile);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Could not load user detail");
      setUserDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  const patchSelectedUser = async (patch: Record<string, unknown>) => {
    if (!selectedUser) return;
    setDetailLoading(true);
    setDataError("");
    try {
      const data = await fetchAdminJson<{ detail: UserDetail }>(`/api/admin/user/${selectedUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setSelectedUser(data.detail.profile);
      setUserDetail(data.detail);
      await loadData();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Could not update user");
    } finally {
      setDetailLoading(false);
    }
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users",     label: "Users",     icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "system",    label: "System",    icon: Settings2 },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: "rgb(var(--bg))", color: "rgb(var(--fg))" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl border-b border-[rgb(var(--border))] px-4 py-3 flex items-center gap-3" style={{ background: "rgb(var(--card)/0.9)" }}>
        <button onClick={() => router.back()} className="opacity-50 hover:opacity-100 transition-opacity">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgb(var(--gstart)), rgb(var(--gend)))" }}>
            <Shield size={14} className="text-white" />
          </div>
          <span className="font-display font-bold">Admin Panel</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgb(var(--acc-500)/0.1)] text-[rgb(var(--acc-500))]">SUPER ADMIN</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs opacity-50 hover:opacity-100 transition-opacity">
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-4 pb-2">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgb(var(--surface))" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all",
                activeTab === t.id ? "text-white shadow-sm" : "opacity-50 hover:opacity-80",
              )}
              style={activeTab === t.id ? { background: "linear-gradient(135deg, rgb(var(--gstart)), rgb(var(--gend)))" } : {}}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <button onClick={loadData} className="opacity-40 hover:opacity-80 transition-opacity p-2">
            <RefreshCcw size={14} className={loadingData ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="p-4 pb-16">
        {dataError && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm font-medium text-red-400">
            {dataError}
          </div>
        )}
        {loadingData && !stats && (
          <div className="bento-card rounded-3xl p-8 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-[rgb(var(--acc-500)/0.3)] border-t-[rgb(var(--acc-500))] animate-spin" />
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

            {/* ── DASHBOARD ── */}
            {activeTab === "dashboard" && stats && (
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <KPICard icon={Users}        label="Total Users"       value={stats.total_users}    color="#ff97ba" />
                  <KPICard icon={Activity}     label="Active This Week"  value={stats.active_this_week} color="#86efac" sub={`of ${stats.total_users} users`} />
                  <KPICard icon={CalendarDays} label="Total Cycles"      value={stats.total_cycles}   color="#a386ff" />
                  <KPICard icon={TrendingUp}   label="Total Logs"        value={stats.total_logs}     color="#67e8f9" />
                </div>

                {/* Signup trend */}
                <div className="bento-card rounded-3xl p-5">
                  <p className="font-display font-semibold text-sm mb-1">New signups</p>
                  <p className="text-xs opacity-40 mb-4">Last 12 months · {stats.new_this_month} this month</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={stats.signups_by_month}>
                      <XAxis dataKey="month" tick={{ fill: "rgb(var(--muted))", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgb(var(--muted))", fontSize: 10 }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
                      <Tooltip contentStyle={TT} />
                      <Line type="monotone" dataKey="count" stroke="rgb(var(--acc-500))" strokeWidth={2} dot={{ fill: "rgb(var(--acc-500))", r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Activity tiers */}
                <div className="bento-card rounded-3xl p-5">
                  <p className="font-display font-semibold text-sm mb-4">User engagement</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={stats.activity_tiers} layout="vertical">
                      <XAxis type="number" tick={{ fill: "rgb(var(--muted))", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis dataKey="label" type="category" tick={{ fill: "rgb(var(--fg))", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                      <Tooltip contentStyle={TT} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {stats.activity_tiers.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Recent users */}
                <div className="bento-card rounded-3xl p-5">
                  <p className="font-display font-semibold text-sm mb-4">Recent users</p>
                  <div className="space-y-2">
                    {users.slice(0, 5).map((u) => (
                      <div key={u.id} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-xl px-2 py-1.5 transition-colors" onClick={() => { setActiveTab("users"); openUserDetail(u); }}>
                        <Avatar name={u.name} size={32} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-xs opacity-40 truncate">{u.email}</p>
                        </div>
                        <span className="text-[10px] opacity-40">{timeAgo(u.created_at)}</span>
                        <ChevronRight size={14} className="opacity-30" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {activeTab === "users" && (
              <div className="space-y-4 mt-2">
                {selectedUser ? (
                  <UserDetailPanel
                    user={selectedUser}
                    detail={userDetail}
                    loading={detailLoading}
                    onBack={() => { setSelectedUser(null); setUserDetail(null); }}
                    onDelete={async () => {
                      try {
                        await fetchAdminJson<{ success: boolean }>(`/api/admin/user/${selectedUser.id}`, { method: "DELETE" });
                        setSelectedUser(null);
                        setUserDetail(null);
                        loadData();
                      } catch (error) {
                        setDataError(error instanceof Error ? error.message : "Could not delete user");
                      }
                    }}
                    onToggleActive={async () => {
                      await patchSelectedUser({ is_active: !selectedUser.is_active });
                    }}
                    onToggleAdmin={async () => {
                      await patchSelectedUser({ is_admin: !selectedUser.is_admin });
                    }}
                    currentAdminId={currentAdminId}
                  />
                ) : (
                  <UsersTable users={users} search={search} setSearch={setSearch} onView={openUserDetail} onRefresh={loadData} currentAdminId={currentAdminId} />
                )}
              </div>
            )}

            {/* ── ANALYTICS ── */}
            {activeTab === "analytics" && (
              <AnalyticsTab users={users} />
            )}

            {/* ── SYSTEM ── */}
            {activeTab === "system" && (
              <SystemTab onLogout={handleLogout} />
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── USERS TABLE ── */
function UsersTable({ users, search, setSearch, onView, onRefresh, currentAdminId }: {
  users: AdminUserRow[];
  search: string;
  setSearch: (s: string) => void;
  onView: (u: AdminUserRow) => void;
  onRefresh: () => void;
  currentAdminId: string;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newAdmin, setNewAdmin] = useState(false);
  const [newOnboarded, setNewOnboarded] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "admin" | "active" | "inactive">("all");

  const filtered = useMemo(() =>
    users.filter((u) => {
      const query = search.toLowerCase();
      const matchesSearch = u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "admin" && u.is_admin) ||
        (statusFilter === "active" && u.is_active) ||
        (statusFilter === "inactive" && !u.is_active);
      return matchesSearch && matchesStatus;
    }), [users, search, statusFilter]);

  const handleCreate = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPwd) { setCreateError("All fields required"); return; }
    setCreating(true);
    setCreateError("");
    try {
      await fetchAdminJson("/api/admin/create-user", {
        method: "POST",
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPwd,
          is_admin: newAdmin,
          onboarded: newOnboarded,
        }),
      });
      setNewName(""); setNewEmail(""); setNewPwd(""); setNewAdmin(false); setNewOnboarded(true); setShowCreate(false);
      onRefresh();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Could not create user");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetchAdminJson<{ success: boolean }>(`/api/admin/user/${id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      onRefresh();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Could not delete user");
    }
  };

  const handleToggleActive = async (u: AdminUserRow) => {
    try {
      await fetchAdminJson(`/api/admin/user/${u.id}`, { method: "PATCH", body: JSON.stringify({ is_active: !u.is_active }) });
      onRefresh();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Could not update user");
    }
  };

  const handleToggleAdmin = async (u: AdminUserRow) => {
    try {
      await fetchAdminJson(`/api/admin/user/${u.id}`, { method: "PATCH", body: JSON.stringify({ is_admin: !u.is_admin }) });
      onRefresh();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Could not update admin role");
    }
  };

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bento-stat rounded-2xl p-4 text-center">
          <p className="font-display font-bold text-2xl" style={{ color: "rgb(var(--acc-500))" }}>{users.length}</p>
          <p className="text-xs opacity-40 mt-0.5">Total</p>
        </div>
        <div className="bento-stat rounded-2xl p-4 text-center">
          <p className="font-display font-bold text-2xl text-amber-400">{users.filter(u => u.is_admin).length}</p>
          <p className="text-xs opacity-40 mt-0.5">Admins</p>
        </div>
        <div className="bento-stat rounded-2xl p-4 text-center">
          <p className="font-display font-bold text-2xl text-emerald-400">{users.filter(u => u.is_active).length}</p>
          <p className="text-xs opacity-40 mt-0.5">Active</p>
        </div>
        <div className="bento-stat rounded-2xl p-4 text-center">
          <p className="font-display font-bold text-2xl text-amber-400">{users.filter(u => !u.is_active).length}</p>
          <p className="text-xs opacity-40 mt-0.5">Inactive</p>
        </div>
      </div>

      {/* Search + create */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full h-10 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] pl-9 pr-4 text-sm focus:outline-none focus:border-[rgb(var(--acc-500)/0.5)]"
          />
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white whitespace-nowrap"
          style={{ background: "linear-gradient(135deg, rgb(var(--gstart)), rgb(var(--gend)))" }}
        >
          <UserPlus size={13} /> New User
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          ["all", "All users"],
          ["admin", "Admins"],
          ["active", "Active"],
          ["inactive", "Inactive"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setStatusFilter(id as typeof statusFilter)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-bold transition",
              statusFilter === id
                ? "border-transparent bg-brand-gradient text-white"
                : "border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.58)] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bento-card rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold opacity-50 uppercase tracking-wider">Create New User</p>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input value={newName} onChange={(e) => { setNewName(e.target.value); setCreateError(""); }} placeholder="Full name" className="w-full h-10 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] pl-9 pr-4 text-sm focus:outline-none" />
              </div>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setCreateError(""); }} placeholder="Email address" type="email" className="w-full h-10 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] pl-9 pr-4 text-sm focus:outline-none" />
              </div>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input value={newPwd} onChange={(e) => { setNewPwd(e.target.value); setCreateError(""); }} placeholder="Password (min 8 chars)" type={showPwd ? "text" : "password"} className="w-full h-10 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] pl-9 pr-9 text-sm focus:outline-none" />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70">
                  {showPwd ? <EyeOff size={13} /> : <EyeIcon size={13} />}
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface)/0.55)] px-3 py-2 text-xs font-semibold">
                  <input type="checkbox" checked={newAdmin} onChange={(e) => setNewAdmin(e.target.checked)} className="accent-[rgb(var(--acc-500))]" />
                  Make admin
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface)/0.55)] px-3 py-2 text-xs font-semibold">
                  <input type="checkbox" checked={newOnboarded} onChange={(e) => setNewOnboarded(e.target.checked)} className="accent-[rgb(var(--acc-500))]" />
                  Skip onboarding
                </label>
              </div>
              {createError && <p className="text-xs text-red-400">{createError}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setShowCreate(false); setCreateError(""); }} className="flex-1 rounded-xl border border-[rgb(var(--border))] py-2 text-xs font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleCreate} disabled={creating} className="flex-1 rounded-xl py-2 text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50" style={{ background: "linear-gradient(135deg, rgb(var(--gstart)), rgb(var(--gend)))" }}>
                  {creating ? "Creating…" : "Create User"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User list */}
      <div className="bento-card rounded-3xl p-5">
        <p className="font-display font-semibold text-sm mb-4">All Users ({filtered.length})</p>
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <Users size={32} className="mx-auto opacity-20 mb-3" />
            <p className="text-sm opacity-40">{search ? "No users match your search" : "No users yet"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border)/0.5)] px-4 py-3 hover:border-[rgb(var(--border))] transition-colors">
                <Avatar name={u.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{u.name}</p>
                    {u.is_admin && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">ADMIN</span>}
                    <span className={cn("text-[10px] font-semibold rounded-full px-2 py-0.5", u.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-white/8 opacity-40")}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs opacity-40 truncate">{u.email}</p>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-[10px] opacity-30">{u.cycle_count} cycles</span>
                    <span className="text-[10px] opacity-30">{u.log_count} logs</span>
                    <span className="text-[10px] opacity-30">{u.chat_count} chats</span>
                    <span className="text-[10px] opacity-30">Last log: {u.last_log_date ?? "none"}</span>
                    <span className="text-[10px] opacity-30">Last: {timeAgo(u.last_sign_in_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => onView(u)} title="View detail" className="h-8 w-8 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                    <Eye size={13} className="opacity-60" />
                  </button>
                  <button onClick={() => handleToggleActive(u)} title={u.is_active ? "Deactivate" : "Activate"} className={cn("h-8 w-8 rounded-xl flex items-center justify-center transition-colors", u.is_active ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400" : "bg-white/5 hover:bg-white/10 opacity-40")}>
                    {u.is_active ? <UserCheck size={13} /> : <UserX size={13} />}
                  </button>
                  <button
                    onClick={() => handleToggleAdmin(u)}
                    disabled={u.id === currentAdminId && u.is_admin}
                    title={u.is_admin ? "Demote from admin" : "Promote to admin"}
                    className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-30",
                      u.is_admin ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25" : "bg-white/5 hover:bg-white/10 opacity-60",
                    )}
                  >
                    <Crown size={13} />
                  </button>
                  <button disabled={u.id === currentAdminId} onClick={() => setDeleteConfirm(u.id)} title="Delete" className="h-8 w-8 rounded-xl flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:cursor-not-allowed disabled:opacity-30">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} className="w-full max-w-xs rounded-3xl p-6 border border-[rgb(var(--border))]" style={{ background: "rgb(var(--card))" }}>
              {(() => { const u = users.find(x => x.id === deleteConfirm); return (
                <>
                  <p className="font-display font-bold text-base mb-1">Delete user?</p>
                  <p className="text-sm opacity-60 mb-5"><span className="opacity-100 font-medium">{u?.name}</span> and all their data will be permanently deleted.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-2xl border border-[rgb(var(--border))] py-2.5 text-sm font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                    <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 rounded-2xl bg-red-500 hover:bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors">Delete</button>
                  </div>
                </>
              ); })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── USER DETAIL PANEL ── */
function UserDetailPanel({ user, detail, loading, onBack, onDelete, onToggleActive, onToggleAdmin, currentAdminId }: {
  user: AdminUserRow;
  detail: UserDetail | null;
  loading: boolean;
  onBack: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onToggleAdmin: () => void;
  currentAdminId: string;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const prediction = useMemo(() => {
    if (!detail) return null;
    const logMap: Record<string, LogEntry> = {};
    for (const l of detail.logs) logMap[l.date] = l;
    return predict(detail.cycles as Cycle[], user.avg_cycle_length, user.avg_period_length, logMap);
  }, [detail, user]);

  const logEntries = useMemo(() => detail?.logs ?? [], [detail]);
  const avgSleep = useMemo(() => {
    const s = logEntries.filter(l => l.sleepHrs != null);
    return s.length > 0 ? (s.reduce((a, l) => a + l.sleepHrs!, 0) / s.length).toFixed(1) : "—";
  }, [logEntries]);
  const avgWater = useMemo(() => {
    const w = logEntries.filter(l => l.waterCups != null);
    return w.length > 0 ? (w.reduce((a, l) => a + l.waterCups!, 0) / w.length).toFixed(1) : "—";
  }, [logEntries]);

  return (
    <div className="space-y-4">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm opacity-50 hover:opacity-100 transition-opacity">
        <ArrowLeft size={15} /> Back to users
      </button>

      {/* Profile header */}
      <div className="bento-card rounded-3xl p-5 flex items-center gap-4">
        <Avatar name={user.name} size={52} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-bold text-lg">{user.name}</p>
            {user.is_admin && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">ADMIN</span>}
            <span className={cn("text-[10px] font-semibold rounded-full px-2 py-0.5", user.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-white/8 opacity-40")}>
              {user.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-xs opacity-40">{user.email}</p>
          <p className="text-xs opacity-30 mt-0.5">Joined {fmt(user.created_at)} · Last seen {timeAgo(user.last_sign_in_at)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onToggleActive} title={user.is_active ? "Deactivate user" : "Activate user"} className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors", user.is_active ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-white/5 opacity-40 hover:bg-white/10")}>
            {user.is_active ? <UserCheck size={16} /> : <UserX size={16} />}
          </button>
          <button
            onClick={onToggleAdmin}
            disabled={user.id === currentAdminId && user.is_admin}
            title={user.is_admin ? "Demote from admin" : "Promote to admin"}
            className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors disabled:cursor-not-allowed disabled:opacity-30", user.is_admin ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25" : "bg-white/5 opacity-60 hover:bg-white/10")}
          >
            <Crown size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bento-card rounded-3xl p-8 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-[rgb(var(--acc-500)/0.3)] border-t-[rgb(var(--acc-500))] animate-spin" />
        </div>
      ) : detail ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <KPICard icon={CalendarDays} label="Total Cycles"     value={user.cycle_count}     color="#ff97ba" />
            <KPICard icon={Activity}     label="Daily Logs"       value={user.log_count}       color="#86efac" />
            <KPICard icon={TrendingUp}   label="Avg Cycle"        value={`${user.avg_cycle_length}d`} color="#a386ff" />
            <KPICard icon={BarChart3}    label="AI Confidence"    value={prediction ? `${prediction.confidencePct}%` : "N/A"} color="#67e8f9" />
          </div>

          {/* Sleep / Water */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bento-stat rounded-2xl p-4 text-center">
              <p className="font-display font-bold text-xl text-sky-400">{avgSleep}h</p>
              <p className="text-xs opacity-40 mt-0.5">Avg Sleep</p>
            </div>
            <div className="bento-stat rounded-2xl p-4 text-center">
              <p className="font-display font-bold text-xl text-cyan-400">{avgWater}</p>
              <p className="text-xs opacity-40 mt-0.5">Avg Water (cups)</p>
            </div>
          </div>

          {/* Profile detail */}
          <div className="bento-card rounded-3xl p-5">
            <p className="font-display font-semibold text-sm mb-4">User profile details</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Birth year", detail.fullProfile.birth_year ?? "Not set"],
                ["Health goal", detail.fullProfile.health_goal],
                ["Diet", detail.fullProfile.diet_preference],
                ["Activity", detail.fullProfile.activity_level ?? "Not set"],
                ["Height", detail.fullProfile.height ? `${detail.fullProfile.height} cm` : "Not set"],
                ["Weight", detail.fullProfile.weight ? `${detail.fullProfile.weight} kg` : "Not set"],
                ["Stress", detail.fullProfile.stress_level ?? "Not set"],
                ["Theme", detail.fullProfile.accent_theme],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[rgb(var(--border)/0.55)] bg-[rgb(var(--surface)/0.45)] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{label}</p>
                  <p className="mt-1 text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <TagList title="Medical conditions" items={detail.fullProfile.medical_conditions} />
              <TagList title="Food allergies" items={detail.fullProfile.food_allergies} />
            </div>
          </div>

          {/* Cycles */}
          <div className="bento-card rounded-3xl p-5">
            <p className="font-display font-semibold text-sm mb-4">Cycle history ({detail.cycles.length})</p>
            {detail.cycles.length === 0 ? (
              <p className="text-sm opacity-40">No cycle records yet.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {detail.cycles.map((cycle) => (
                  <div key={cycle.startDate} className="rounded-xl border border-[rgb(var(--border)/0.5)] px-3 py-2">
                    <p className="text-xs font-bold">Started {cycle.startDate}</p>
                    <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">Ended {cycle.endDate ?? "not recorded"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All logs */}
          <div className="bento-card rounded-3xl p-5">
            <p className="font-display font-semibold text-sm mb-4">All daily logs ({logEntries.length})</p>
            {logEntries.length === 0 ? (
              <p className="text-sm opacity-40">No logs yet.</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {[...logEntries].sort((a, b) => b.date.localeCompare(a.date)).map((l) => (
                  <div key={l.date} className="rounded-xl border border-[rgb(var(--border)/0.5)] px-3 py-2">
                    <p className="text-xs font-medium">{l.date}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {l.flow && <span className="text-[10px] bg-[rgb(var(--acc-500)/0.15)] text-[rgb(var(--acc-400))] rounded-lg px-2 py-0.5">{l.flow}</span>}
                      {l.mood && <span className="text-[10px] bg-purple-500/15 text-purple-400 rounded-lg px-2 py-0.5">{l.mood}</span>}
                      {l.sleepHrs && <span className="text-[10px] bg-sky-500/15 text-sky-400 rounded-lg px-2 py-0.5">💤 {l.sleepHrs}h</span>}
                      {l.waterCups && <span className="text-[10px] bg-cyan-500/15 text-cyan-400 rounded-lg px-2 py-0.5">{l.waterCups} cups</span>}
                      {l.symptoms.map(s => <span key={s} className="text-[10px] bg-white/8 rounded-lg px-2 py-0.5 opacity-60">{s}</span>)}
                    </div>
                    {l.notes && <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{l.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PCOS + chat */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="bento-card rounded-3xl p-5">
              <p className="font-display font-semibold text-sm mb-4">PCOS assessment</p>
              {detail.pcosProfile.completedAt ? (
                <div>
                  <p className="text-xs opacity-50">Completed {detail.pcosProfile.completedAt}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(detail.pcosProfile.answers).map(([key, value]) => (
                      <span key={key} className="rounded-full bg-[rgb(var(--acc-500)/0.12)] px-3 py-1 text-[11px] font-bold text-[rgb(var(--acc-500))]">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm opacity-40">No PCOS assessment submitted.</p>
              )}
            </div>
            <div className="bento-card rounded-3xl p-5">
              <p className="font-display font-semibold text-sm mb-4">Recent Luna AI messages</p>
              {detail.chatMessages.length === 0 ? (
                <p className="text-sm opacity-40">No chat history stored.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {detail.chatMessages.map((msg, index) => (
                    <div key={`${msg.createdAt}-${index}`} className="rounded-xl border border-[rgb(var(--border)/0.5)] px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{msg.role}</p>
                        <p className="text-[10px] opacity-40">{fmt(msg.createdAt)}</p>
                      </div>
                      <p className="mt-1 line-clamp-3 text-xs leading-5 text-[rgb(var(--muted))]">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export */}
          <div className="bento-card rounded-3xl p-5 space-y-2">
            <p className="font-display font-semibold text-sm mb-2">Export data</p>
            <a href={`/api/admin/export/${user.id}?format=json`} download className="w-full rounded-2xl border border-[rgb(var(--border))] bg-white/5 hover:bg-white/8 px-4 py-3 flex items-center gap-3 text-sm font-medium transition-colors">
              <Download size={15} className="text-emerald-400 shrink-0" />
              <div><p className="text-sm font-medium">Full data (JSON)</p><p className="text-xs opacity-40">Profile, cycles, all logs</p></div>
            </a>
            <a href={`/api/admin/export/${user.id}?format=csv`} download className="w-full rounded-2xl border border-[rgb(var(--border))] bg-white/5 hover:bg-white/8 px-4 py-3 flex items-center gap-3 text-sm font-medium transition-colors">
              <Download size={15} className="text-sky-400 shrink-0" />
              <div><p className="text-sm font-medium">Logs only (CSV)</p><p className="text-xs opacity-40">Spreadsheet-friendly format</p></div>
            </a>
          </div>

          {/* Danger */}
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
            <p className="font-display font-semibold text-sm text-red-400 mb-2">Danger zone</p>
            <p className="text-xs opacity-60 mb-4">Permanently deletes this user and all their data. Cannot be undone.</p>
            <button disabled={user.id === currentAdminId} onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 px-4 py-2.5 text-red-400 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40">
              <Trash2 size={14} /> Delete user account
            </button>
          </div>
        </>
      ) : (
        <div className="bento-card rounded-3xl p-8 text-center opacity-40 text-sm">Could not load user data.</div>
      )}

      {/* Delete confirm modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} className="w-full max-w-xs rounded-3xl p-6 border border-[rgb(var(--border))]" style={{ background: "rgb(var(--card))" }}>
              <p className="font-display font-bold text-base mb-1">Delete {user.name}?</p>
              <p className="text-sm opacity-60 mb-5">All cycles, logs, and account data will be permanently removed.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-2xl border border-[rgb(var(--border))] py-2.5 text-sm font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={onDelete} className="flex-1 rounded-2xl bg-red-500 hover:bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── ANALYTICS TAB ── */
function AnalyticsTab({ users }: { users: AdminUserRow[] }) {
  const totalCycles = users.reduce((a, u) => a + u.cycle_count, 0);
  const totalLogs = users.reduce((a, u) => a + u.log_count, 0);
  const avgCycle = users.length > 0 ? (users.reduce((a, u) => a + u.avg_cycle_length, 0) / users.length).toFixed(1) : "—";
  const onboarded = users.filter(u => u.onboarded).length;

  const engagementData = [
    { label: "No logs", count: users.filter(u => u.log_count === 0).length },
    { label: "1-10 logs", count: users.filter(u => u.log_count > 0 && u.log_count <= 10).length },
    { label: "11-30 logs", count: users.filter(u => u.log_count > 10 && u.log_count <= 30).length },
    { label: "30+ logs", count: users.filter(u => u.log_count > 30).length },
  ];

  const onboardingData = [
    { name: "Onboarded", value: onboarded },
    { name: "Not onboarded", value: users.length - onboarded },
  ];

  return (
    <div className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <KPICard icon={CalendarDays} label="Total Cycles"  value={totalCycles}      color="#ff97ba" />
        <KPICard icon={Activity}     label="Total Logs"    value={totalLogs}        color="#86efac" />
        <KPICard icon={TrendingUp}   label="Avg Cycle"     value={`${avgCycle}d`}   color="#a386ff" />
        <KPICard icon={CheckCircle2} label="Onboarded"     value={`${onboarded}/${users.length}`} color="#67e8f9" />
      </div>

      <div className="bento-card rounded-3xl p-5">
        <p className="font-display font-semibold text-sm mb-4">Engagement distribution</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={engagementData}>
            <XAxis dataKey="label" tick={{ fill: "rgb(var(--muted))", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgb(var(--muted))", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
            <Tooltip contentStyle={TT} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {engagementData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bento-card rounded-3xl p-5">
        <p className="font-display font-semibold text-sm mb-4">Onboarding completion</p>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={onboardingData} dataKey="value" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
              <Cell fill="#86efac" /><Cell fill="rgb(var(--border))" />
            </Pie>
            <Tooltip contentStyle={TT} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── SYSTEM TAB ── */
function SystemTab({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="space-y-4 mt-2">
      <div className="bento-card rounded-3xl p-5 space-y-3">
        <p className="font-display font-semibold text-sm mb-2">Platform info</p>
        {[
          ["Backend", "Supabase (PostgreSQL)"],
          ["Auth", "Supabase Auth (email + OAuth)"],
          ["AI Model", "Groq · Llama 3.3 70B"],
          ["Deployment", "Vercel / Next.js 14"],
        ].map(([label, val]) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-[rgb(var(--border)/0.5)] last:border-0">
            <span className="text-sm opacity-50">{label}</span>
            <span className="text-sm font-medium">{val}</span>
          </div>
        ))}
      </div>

      <div className="bento-card rounded-3xl p-5">
        <p className="font-display font-semibold text-sm mb-4">Quick links</p>
        <div className="space-y-2">
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="w-full rounded-2xl border border-[rgb(var(--border))] bg-white/5 hover:bg-white/8 px-4 py-3 flex items-center gap-3 text-sm transition-colors">
            <Settings2 size={15} className="opacity-60" /> Supabase Dashboard
          </a>
        </div>
      </div>

      <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
        <p className="font-display font-semibold text-sm text-red-400 mb-2">Session</p>
        <button onClick={onLogout} className="flex items-center gap-2 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 px-4 py-2.5 text-red-400 text-sm font-semibold transition-colors">
          <LogOut size={14} /> Sign out of admin
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Droplets,
  HeartPulse,
  Moon,
  PenLine,
  Plus,
  Sparkles,
  TrendingUp,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/topbar";
import { useUserData } from "@/lib/hooks/useUserData";
import { predict } from "@/lib/ai/prediction";
import { formatDate } from "@/lib/utils";
import type { Cycle, LogEntry } from "@/lib/store";
import { cn } from "@/lib/utils";

type Tab = "overview" | "cycles" | "logs";

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "cycles", label: "Cycles", icon: CalendarDays },
  { id: "logs", label: "Logs", icon: PenLine },
];

const tooltipStyle = {
  background: "rgb(var(--card))",
  border: "1px solid rgb(var(--border))",
  borderRadius: 16,
  color: "rgb(var(--fg))",
  fontSize: 12,
  boxShadow: "0 18px 50px -28px rgba(64,35,62,0.5)",
};

export default function StatsPage() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  useEffect(() => setMounted(true), []);

  const { cycles, profile, logs } = useUserData();
  const prediction = useMemo(
    () => predict(cycles, profile.avgCycleLength, profile.avgPeriodLength, logs),
    [cycles, profile.avgCycleLength, profile.avgPeriodLength, logs],
  );

  const sortedCycles = useMemo(
    () => [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [cycles],
  );
  const logArr = useMemo(
    () => (Object.values(logs) as LogEntry[]).sort((a, b) => a.date.localeCompare(b.date)),
    [logs],
  );

  if (!mounted) return null;

  const cycleLengths = getCycleLengths(sortedCycles);
  const periodLengths = getPeriodLengths(sortedCycles);
  const avgCycle = prediction?.avgCycleLength ?? profile.avgCycleLength;
  const avgPeriod = prediction?.avgPeriodLength ?? profile.avgPeriodLength;
  const avgSleep = average(logArr.map((log) => log.sleepHrs).filter((value): value is number => typeof value === "number"));
  const avgWater = average(logArr.map((log) => log.waterCups).filter((value): value is number => typeof value === "number"));

  return (
    <div>
      <Topbar title="Statistics" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-6"
      >
        <section className="section-panel overflow-hidden p-0">
          <div className="hero-clean-surface relative overflow-hidden p-5 sm:p-6">
            <div className="hero-clean-glow pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl" />
            <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <Badge tone="lavender">
                  <BarChart3 size={13} />
                  Health analytics
                </Badge>
                <h1 className="mt-3 font-display text-3xl font-semibold tracking-normal text-[rgb(var(--fg))] sm:text-5xl">
                  Your cycle patterns, cleaner.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">
                  Track how cycle length, symptoms, sleep, and hydration are changing over time.
                </p>
              </div>
              <Link href="/log" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-bold text-white shadow-[0_18px_42px_-24px_var(--acc-glow)] transition hover:-translate-y-0.5">
                <Plus size={16} />
                Add log
              </Link>
            </div>

            <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={HeartPulse} label="Average cycle" value={avgCycle} unit="days" tone="rose" />
              <StatCard icon={Waves} label="Period length" value={avgPeriod} unit="days" tone="violet" />
              <StatCard icon={Moon} label="Sleep average" value={avgSleep ? avgSleep.toFixed(1) : "--"} unit="hrs" tone="blue" />
              <StatCard icon={Droplets} label="Water average" value={avgWater ? avgWater.toFixed(1) : "--"} unit="cups" tone="green" />
            </div>
          </div>
        </section>

        <div className="section-panel p-1.5">
          <div className="grid grid-cols-3 gap-1">
            {tabs.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "inline-flex h-11 items-center justify-center gap-2 rounded-[18px] text-sm font-bold transition-all",
                    active
                      ? "bg-brand-gradient text-white shadow-[0_14px_32px_-22px_var(--acc-glow)]"
                      : "text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface)/0.7)] hover:text-[rgb(var(--fg))]",
                  )}
                >
                  <Icon size={15} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {tab === "overview" && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <ChartPanel title="Cycle length trend" description="Recent cycle-to-cycle length" icon={TrendingUp}>
              {cycleLengths.length > 0 ? (
                <BarTrend data={cycleLengths} color="rgb(var(--acc-500))" unit=" days" domain={[18, 45]} />
              ) : (
                <EmptyState icon={CalendarDays} title="Need more cycles" detail="Log at least two period starts to unlock this trend." href="/calendar" action="Open calendar" />
              )}
            </ChartPanel>

            <section className="section-panel p-5 sm:p-6">
              <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Cycle composition</h2>
              <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">Average breakdown based on your prediction model.</p>
              <div className="mt-5 flex items-center gap-5">
                <div className="h-36 w-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Period", value: avgPeriod, color: "rgb(var(--acc-500))" },
                          { name: "Fertile", value: 6, color: "#10b981" },
                          { name: "Other", value: Math.max(1, avgCycle - avgPeriod - 6), color: "rgb(var(--border))" },
                        ]}
                        dataKey="value"
                        innerRadius="62%"
                        outerRadius="92%"
                        paddingAngle={4}
                      >
                        {[
                          "rgb(var(--acc-500))",
                          "#10b981",
                          "rgb(var(--border))",
                        ].map((color) => (
                          <Cell key={color} fill={color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <BreakdownRow color="rgb(var(--acc-500))" label="Period" value={`${avgPeriod} days`} />
                  <BreakdownRow color="#10b981" label="Fertile window" value="6 days" />
                  <BreakdownRow color="rgb(var(--border))" label="Other days" value={`${Math.max(1, avgCycle - avgPeriod - 6)} days`} />
                </div>
              </div>
            </section>
          </div>
        )}

        {tab === "cycles" && (
          <div className="grid gap-5 xl:grid-cols-2">
            <ChartPanel title="Cycle length" description={`${cycleLengths.length} measured cycles`} icon={CalendarDays}>
              {cycleLengths.length > 0 ? (
                <BarTrend data={cycleLengths} color="#8b5cf6" unit=" days" domain={[18, 45]} />
              ) : (
                <EmptyState icon={CalendarDays} title="No cycle trend yet" detail="Add period starts in Calendar to begin." href="/calendar" action="Add cycle" />
              )}
            </ChartPanel>
            <ChartPanel title="Period length" description={`${periodLengths.length} completed periods`} icon={Waves}>
              {periodLengths.length > 0 ? (
                <BarTrend data={periodLengths} color="rgb(var(--acc-500))" unit=" days" domain={[0, 10]} />
              ) : (
                <EmptyState icon={Waves} title="No completed periods yet" detail="Add period end dates to compare duration." href="/calendar" action="Open calendar" />
              )}
            </ChartPanel>

            <section className="section-panel p-5 sm:p-6 xl:col-span-2">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Recent cycle timeline</h2>
                  <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">A compact look at your last recorded cycles.</p>
                </div>
                <Link href="/calendar">
                  <Button variant="outline" size="sm">
                    <CalendarDays size={15} />
                    Edit
                  </Button>
                </Link>
              </div>
              {sortedCycles.length > 0 ? (
                <div className="space-y-3">
                  {sortedCycles.slice(-6).reverse().map((cycle, index) => (
                    <CycleRow key={cycle.startDate} cycle={cycle} index={index} cycles={sortedCycles} fallbackLength={avgCycle} fallbackPeriod={avgPeriod} />
                  ))}
                </div>
              ) : (
                <EmptyState icon={CalendarDays} title="No cycles recorded" detail="Your cycle history will appear here after your first period start." href="/calendar" action="Log period" />
              )}
            </section>
          </div>
        )}

        {tab === "logs" && (
          <div className="grid gap-5 xl:grid-cols-2">
            <ChartPanel title="Mood rhythm" description="Mood score from recent daily logs" icon={Activity}>
              {moodSeries(logArr).length > 0 ? (
                <AreaTrend data={moodSeries(logArr)} color="#8b5cf6" unit="/5" domain={[0, 5]} />
              ) : (
                <EmptyState icon={PenLine} title="No mood data yet" detail="Log mood for a few days to see patterns." href="/log" action="Add mood" />
              )}
            </ChartPanel>
            <ChartPanel title="Sleep and hydration" description="Recent lifestyle logs" icon={Droplets}>
              {lifestyleSeries(logArr).length > 0 ? (
                <AreaTrend data={lifestyleSeries(logArr)} color="#0ea5e9" unit="" domain={[0, 12]} />
              ) : (
                <EmptyState icon={Droplets} title="No lifestyle data yet" detail="Add sleep and water values in Daily Log." href="/log" action="Add log" />
              )}
            </ChartPanel>

            <section className="section-panel p-5 sm:p-6 xl:col-span-2">
              <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Most frequent symptoms</h2>
              <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">Based on your saved daily logs.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {symptomCounts(logArr).length > 0 ? (
                  symptomCounts(logArr).map(([symptom, count], index) => (
                    <div key={symptom} className="rounded-[22px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] px-4 py-3">
                      <p className="text-sm font-bold text-[rgb(var(--fg))]">{symptom}</p>
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">{count} logs - rank {index + 1}</p>
                    </div>
                  ))
                ) : (
                  <EmptyState icon={Sparkles} title="No symptoms yet" detail="Choose symptoms in Daily Log to build this summary." href="/log" action="Log symptoms" />
                )}
              </div>
            </section>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function getCycleLengths(cycles: Cycle[]) {
  return cycles
    .map((cycle, index) => {
      if (index === 0) return null;
      const previous = cycles[index - 1];
      const value = Math.round((new Date(cycle.startDate).getTime() - new Date(previous.startDate).getTime()) / 86_400_000);
      return { label: `C${index}`, value };
    })
    .filter(Boolean) as { label: string; value: number }[];
}

function getPeriodLengths(cycles: Cycle[]) {
  return cycles
    .filter((cycle) => cycle.endDate)
    .map((cycle, index) => {
      const value = Math.round((new Date(cycle.endDate!).getTime() - new Date(cycle.startDate).getTime()) / 86_400_000) + 1;
      return { label: `P${index + 1}`, value };
    });
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function moodSeries(logs: LogEntry[]) {
  const score: Record<string, number> = { happy: 5, energetic: 5, calm: 4, sad: 2, anxious: 2, irritable: 1 };
  return logs
    .slice(-21)
    .filter((log) => log.mood)
    .map((log) => ({ label: log.date.slice(5), value: score[log.mood as string] ?? 3 }));
}

function lifestyleSeries(logs: LogEntry[]) {
  return logs
    .slice(-21)
    .filter((log) => typeof log.sleepHrs === "number" || typeof log.waterCups === "number")
    .map((log) => ({ label: log.date.slice(5), value: log.sleepHrs ?? log.waterCups ?? 0 }));
}

function symptomCounts(logs: LogEntry[]) {
  const counts: Record<string, number> = {};
  logs.forEach((log) => log.symptoms.forEach((symptom) => {
    counts[symptom] = (counts[symptom] ?? 0) + 1;
  }));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
}

function StatCard({ icon: Icon, label, value, unit, tone }: { icon: LucideIcon; label: string; value: string | number; unit: string; tone: "rose" | "violet" | "blue" | "green" }) {
  const tones = {
    rose: "bg-rose-500/10 text-rose-700 dark:text-rose-200",
    violet: "bg-violet-500/10 text-violet-700 dark:text-violet-200",
    blue: "bg-sky-500/10 text-sky-700 dark:text-sky-200",
    green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  };

  return (
    <div className="rounded-[24px] border border-white/70 bg-white/62 p-4 shadow-[0_18px_42px_-34px_rgba(77,45,74,0.42)] dark:border-white/10 dark:bg-white/[0.055]">
      <span className={cn("mb-4 grid h-10 w-10 place-items-center rounded-2xl", tones[tone])}>
        <Icon size={18} />
      </span>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="metric-number text-4xl text-[rgb(var(--fg))]">{value}</span>
        <span className="text-sm font-bold text-[rgb(var(--muted))]">{unit}</span>
      </div>
    </div>
  );
}

function ChartPanel({ title, description, icon: Icon, children }: { title: string; description: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <section className="section-panel p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
          <Icon size={19} />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{description}</p>
        </div>
      </div>
      <div className="h-72">{children}</div>
    </section>
  );
}

function BarTrend({ data, color, unit, domain }: { data: { label: string; value: number }[]; color: string; unit: string; domain: [number, number] }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid stroke="rgb(var(--border))" strokeOpacity={0.55} vertical={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}${unit}`, "Value"]} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "rgb(var(--muted))" }} />
        <YAxis domain={domain} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "rgb(var(--muted))" }} />
        <Bar dataKey="value" fill={color} radius={[12, 12, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function AreaTrend({ data, color, unit, domain }: { data: { label: string; value: number }[]; color: string; unit: string; domain: [number, number] }) {
  return (
    <ResponsiveContainer>
      <AreaChart data={data} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id={`stats-area-${color.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.42} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgb(var(--border))" strokeOpacity={0.55} vertical={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}${unit}`, "Value"]} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "rgb(var(--muted))" }} />
        <YAxis domain={domain} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "rgb(var(--muted))" }} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#stats-area-${color.replace(/[^a-zA-Z0-9]/g, "")})`} dot={false} activeDot={{ r: 4, fill: color, stroke: "white", strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function EmptyState({ icon: Icon, title, detail, href, action }: { icon: LucideIcon; title: string; detail: string; href: string; action: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-[24px] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.44)] p-6 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
        <Icon size={20} />
      </span>
      <p className="font-display text-base font-semibold text-[rgb(var(--fg))]">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-[rgb(var(--muted))]">{detail}</p>
      <Link href={href} className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-brand-gradient px-4 text-sm font-bold text-white shadow-[0_16px_34px_-24px_var(--acc-glow)]">
        {action}
      </Link>
    </div>
  );
}

function BreakdownRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      <span className="text-sm font-medium text-[rgb(var(--muted))]">{label}</span>
      <span className="ml-auto text-sm font-bold text-[rgb(var(--fg))]">{value}</span>
    </div>
  );
}

function CycleRow({ cycle, index, cycles, fallbackLength, fallbackPeriod }: { cycle: Cycle; index: number; cycles: Cycle[]; fallbackLength: number; fallbackPeriod: number }) {
  const currentIndex = cycles.findIndex((item) => item.startDate === cycle.startDate);
  const nextCycle = cycles[currentIndex + 1];
  const length = nextCycle
    ? Math.round((new Date(nextCycle.startDate).getTime() - new Date(cycle.startDate).getTime()) / 86_400_000)
    : fallbackLength;
  const periodLength = cycle.endDate
    ? Math.round((new Date(cycle.endDate).getTime() - new Date(cycle.startDate).getTime()) / 86_400_000) + 1
    : fallbackPeriod;
  const width = Math.max(10, Math.min(100, (periodLength / Math.max(1, length)) * 100));

  return (
    <div className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.5)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[rgb(var(--fg))]">
            {formatDate(new Date(cycle.startDate), { month: "short", day: "numeric", year: "numeric" })}
          </p>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            {length} day cycle - {periodLength} day period
          </p>
        </div>
        <span className="rounded-full bg-[rgb(var(--acc-50))] px-3 py-1 text-xs font-bold text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
          #{cycles.length - index}
        </span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-[rgb(var(--border))]">
        <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

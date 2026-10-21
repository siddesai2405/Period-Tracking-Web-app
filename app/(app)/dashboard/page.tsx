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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Droplets,
  HeartHandshake,
  HeartPulse,
  Leaf,
  Moon,
  PenLine,
  Plus,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/topbar";
import { useUserData } from "@/lib/hooks/useUserData";
import { currentPhase, phaseInfo, predict, type CyclePhase } from "@/lib/ai/prediction";
import { generateInsights } from "@/lib/ai/insights";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const phaseView: Record<
  CyclePhase,
  {
    label: string;
    icon: LucideIcon;
    accent: string;
    soft: string;
    text: string;
    chart: string;
  }
> = {
  menstrual: {
    label: "Menstrual",
    icon: Waves,
    accent: "from-rose-200 via-pink-200 to-fuchsia-200",
    soft: "bg-rose-500/10 text-rose-700 dark:text-rose-200",
    text: "text-rose-700 dark:text-rose-200",
    chart: "#f43f72",
  },
  follicular: {
    label: "Follicular",
    icon: Leaf,
    accent: "from-emerald-100 via-teal-100 to-sky-100",
    soft: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
    text: "text-emerald-700 dark:text-emerald-200",
    chart: "#10b981",
  },
  ovulatory: {
    label: "Ovulatory",
    icon: Sun,
    accent: "from-amber-100 via-orange-100 to-rose-100",
    soft: "bg-amber-500/12 text-amber-800 dark:text-amber-200",
    text: "text-amber-700 dark:text-amber-200",
    chart: "#f59e0b",
  },
  luteal: {
    label: "Luteal",
    icon: Moon,
    accent: "from-violet-200 via-fuchsia-100 to-rose-100",
    soft: "bg-violet-500/10 text-violet-700 dark:text-violet-200",
    text: "text-violet-700 dark:text-violet-200",
    chart: "#8b5cf6",
  },
};

const fade = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] } },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { profile, cycles, logs } = useUserData();

  const prediction = useMemo(
    () => predict(cycles, profile.avgCycleLength, profile.avgPeriodLength, logs),
    [cycles, profile.avgCycleLength, profile.avgPeriodLength, logs],
  );
  const { phase, dayOfCycle } = currentPhase(new Date(), prediction, cycles);
  const info = phaseInfo[phase];
  const view = phaseView[phase];
  const PhaseIcon = view.icon;

  const logArr = useMemo(() => Object.values(logs).sort((a, b) => a.date.localeCompare(b.date)), [logs]);
  const last14 = logArr.slice(-14);
  const insights = useMemo(
    () => generateInsights({ phase, dayOfCycle, prediction, logs: logArr }),
    [phase, dayOfCycle, prediction, logArr],
  );

  const sleepData = last14.map((entry) => ({ date: entry.date.slice(5), value: entry.sleepHrs ?? null }));
  const waterData = last14.map((entry) => ({ date: entry.date.slice(5), value: entry.waterCups ?? null }));
  const avgSleep = average(last14.map((entry) => entry.sleepHrs).filter((value): value is number => typeof value === "number"));
  const avgWater = average(last14.map((entry) => entry.waterCups).filter((value): value is number => typeof value === "number"));

  const sortedCycles = useMemo(
    () => [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [cycles],
  );
  const cycleLengths = sortedCycles
    .map((cycle, index) => {
      if (index === 0) return null;
      const previous = sortedCycles[index - 1];
      const length = Math.round((new Date(cycle.startDate).getTime() - new Date(previous.startDate).getTime()) / 86_400_000);
      return { label: `C${index}`, value: length };
    })
    .filter(Boolean) as { label: string; value: number }[];

  if (!mounted) return null;

  const daysToPeriod = prediction
    ? Math.ceil((prediction.nextPeriodStart.getTime() - Date.now()) / 86_400_000)
    : null;
  const isLate = daysToPeriod !== null && daysToPeriod < 0;
  const cycleLength = prediction?.avgCycleLength ?? profile.avgCycleLength;
  const cycleProgress = Math.min(100, Math.max(4, (dayOfCycle / Math.max(1, cycleLength)) * 100));

  return (
    <div>
      <Topbar title={`Hi, ${profile.name || "Friend"}`} />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.section variants={fade} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="section-panel relative overflow-hidden p-0">
            <div className="hero-clean-surface relative min-h-[320px] overflow-hidden p-5 sm:p-7">
              <div className={cn("hero-clean-glow pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-gradient-to-br blur-3xl", view.accent)} />
              <div className="pointer-events-none absolute -bottom-32 left-8 h-72 w-72 rounded-full bg-[rgb(var(--acc-100))] opacity-60 blur-3xl dark:opacity-10" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(var(--acc-200)/0.18)_1px,transparent_0)] [background-size:22px_22px] opacity-[0.45] dark:opacity-[0.18]" />

              <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                <div className="min-w-0">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1", view.soft, "ring-[rgb(var(--border)/0.65)]")}>
                      <PhaseIcon size={14} />
                      {view.label} phase
                    </span>
                    <span className="rounded-full bg-[rgb(var(--card)/0.74)] px-3 py-1.5 text-xs font-bold text-[rgb(var(--fg))] ring-1 ring-[rgb(var(--border)/0.76)] backdrop-blur">
                      Day {dayOfCycle}
                    </span>
                    {prediction && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/82 px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200/80 backdrop-blur dark:bg-emerald-500/16 dark:text-emerald-100 dark:ring-emerald-300/20">
                        <ShieldCheck size={13} />
                        {prediction.confidencePct}% confidence
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-black uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Cycle snapshot</p>
                  <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-normal text-[rgb(var(--fg))] sm:text-5xl">
                    {prediction
                      ? isLate
                        ? `${Math.abs(daysToPeriod ?? 0)} days late`
                        : daysToPeriod === 0
                          ? "Period expected today"
                          : `${daysToPeriod} days to period`
                      : "Start with your first cycle"}
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))] sm:text-base">
                    {info.tip}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/log" className="pastel-primary inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black transition active:translate-y-0">
                      <Plus size={16} />
                      Quick log
                    </Link>
                    <Link href="/calendar" className="pastel-button inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black transition active:translate-y-0">
                      Open calendar
                      <ArrowRight size={16} />
                    </Link>
                  </div>

                  <div className="mt-6 grid gap-2 sm:grid-cols-3">
                    <HeroMiniStat icon={CalendarDays} label="Next period" value={prediction ? formatDate(prediction.nextPeriodStart) : "Add cycle"} tone={view.soft} />
                    <HeroMiniStat icon={Activity} label="Progress" value={`${Math.round(cycleProgress)}%`} tone={view.soft} />
                    <HeroMiniStat icon={ShieldCheck} label="Model" value={prediction?.confidenceLabel ?? "Learning"} tone={view.soft} />
                  </div>
                </div>

                <CycleRing progress={cycleProgress} color={view.chart} value={daysToPeriod} />
              </div>
            </div>
          </div>

          <aside className="section-panel p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Today focus</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-[rgb(var(--fg))]">{view.label} care</h2>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                  Keep the next action small and consistent. Better logs make better predictions.
                </p>
              </div>
              <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", view.soft)}>
                <Sparkles size={20} />
              </span>
            </div>

            <div className="space-y-3">
              <ActionLink href="/log" icon={PenLine} title="Log symptoms" detail="Mood, flow, notes" />
              <ActionLink href="/stats" icon={BarChart3} title="Review stats" detail="Cycle and lifestyle trends" />
              <ActionLink href="/insights" icon={Sparkles} title="Read insights" detail="Personalized analysis" />
              <ActionLink href="/partner-share" icon={HeartHandshake} title="Partner Share" detail="Share read-only dashboard" />
            </div>
          </aside>
        </motion.section>

        <motion.section variants={fade} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={HeartPulse} label="Average cycle" value={prediction?.avgCycleLength ?? profile.avgCycleLength} unit="days" tone="rose" detail={`${cycles.length} tracked`} />
          <Metric icon={Activity} label="Prediction" value={prediction?.confidencePct ?? 0} unit="%" tone="violet" detail={prediction?.confidenceLabel ?? "Learning"} />
          <Metric icon={Moon} label="Sleep" value={avgSleep ? avgSleep.toFixed(1) : "--"} unit="hrs" tone="blue" detail="14 day avg" />
          <Metric icon={Droplets} label="Hydration" value={avgWater ? avgWater.toFixed(1) : "--"} unit="cups" tone="green" detail="14 day avg" />
        </motion.section>

        <motion.section variants={fade} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-5 lg:grid-cols-2">
            <ChartPanel title="Sleep rhythm" description={`Last 14 days${avgSleep ? ` - avg ${avgSleep.toFixed(1)}h` : ""}`} icon={Moon}>
              <AreaMiniChart data={sleepData} color="#8b5cf6" unit="h" domain={[0, 12]} />
            </ChartPanel>
            <ChartPanel title="Hydration" description={`Last 14 days${avgWater ? ` - avg ${avgWater.toFixed(1)} cups` : ""}`} icon={Droplets}>
              <BarMiniChart data={waterData} color="#0ea5e9" unit=" cups" />
            </ChartPanel>
          </div>

          <div className="section-panel p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">AI notes</p>
                <h2 className="mt-1 font-display text-xl font-semibold text-[rgb(var(--fg))]">What matters now</h2>
              </div>
              <Link href="/insights">
                <Button variant="soft" size="sm">
                  All
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight, index) => (
                <div key={insight.id} className="rounded-[22px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-4">
                  <div className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
                      {index === 0 ? <Sparkles size={16} /> : index === 1 ? <Leaf size={16} /> : <Activity size={16} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[rgb(var(--fg))]">{insight.title}</p>
                      <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{insight.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section variants={fade} className="section-panel p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Cycle trend</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-[rgb(var(--fg))]">Recent cycle lengths</h2>
            </div>
            <Link href="/calendar">
              <Button variant="outline" size="sm">
                <CalendarDays size={15} />
                Add cycle
              </Button>
            </Link>
          </div>
          <div className="h-64">
            {cycleLengths.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={cycleLengths} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardCycleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(var(--acc-500))" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.75} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgb(var(--border))" strokeOpacity={0.6} vertical={false} />
                  <Tooltip content={<ChartTooltip unit=" days" />} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "rgb(var(--muted))" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "rgb(var(--muted))" }} domain={[18, 45]} />
                  <Bar dataKey="value" fill="url(#dashboardCycleGradient)" radius={[12, 12, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart icon={TrendingUp} title="No cycle trend yet" detail="Log at least two period starts to unlock this trend." />
            )}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function HeroMiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-[20px] border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--card)/0.58)] p-3 shadow-[0_12px_30px_-28px_rgba(72,39,72,0.42)] backdrop-blur">
      <div className="flex items-center gap-2">
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-2xl", tone)}>
          <Icon size={15} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgb(var(--muted))]">{label}</p>
          <p className="truncate text-sm font-bold text-[rgb(var(--fg))]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function CycleRing({ progress, color, value }: { progress: number; color: string; value: number | null }) {
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const dash = (progress / 100) * circumference;

  return (
    <div className="relative mx-auto grid h-48 w-48 place-items-center rounded-full border border-[rgb(var(--border)/0.70)] bg-[rgb(var(--card)/0.66)] shadow-[0_24px_64px_-42px_rgba(77,45,74,0.55)] backdrop-blur sm:h-56 sm:w-56">
      <div className="pointer-events-none absolute inset-4 rounded-full bg-[rgb(var(--surface)/0.62)]" />
      <svg viewBox="0 0 150 150" className="absolute h-44 w-44 -rotate-90 sm:h-52 sm:w-52">
        <circle cx="75" cy="75" r={radius} fill="none" stroke="rgb(var(--surface))" strokeWidth="13" />
        <motion.circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="relative text-center">
        <p className="font-display text-5xl font-semibold text-[rgb(var(--fg))]">{value === null ? "--" : Math.abs(value)}</p>
        <p className="mt-1 text-sm font-bold text-[rgb(var(--muted))]">
          {value === null ? "start tracking" : value < 0 ? "days late" : value === 0 ? "period today" : "days left"}
        </p>
        <span className="mx-auto mt-3 block h-1.5 w-14 rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  unit,
  tone,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit: string;
  tone: "rose" | "violet" | "blue" | "green";
  detail: string;
}) {
  const tones = {
    rose: "bg-rose-500/10 text-rose-700 dark:text-rose-200",
    violet: "bg-violet-500/10 text-violet-700 dark:text-violet-200",
    blue: "bg-sky-500/10 text-sky-700 dark:text-sky-200",
    green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  };

  return (
    <div className="bento-stat p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className={cn("grid h-10 w-10 place-items-center rounded-2xl", tones[tone])}>
          <Icon size={18} />
        </span>
        <span className="rounded-full bg-[rgb(var(--surface)/0.62)] px-2.5 py-1 text-[11px] font-bold text-[rgb(var(--muted))]">
          {detail}
        </span>
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="metric-number text-4xl text-[rgb(var(--fg))]">{value}</span>
        <span className="text-sm font-bold text-[rgb(var(--muted))]">{unit}</span>
      </div>
    </div>
  );
}

function ActionLink({ href, icon: Icon, title, detail }: { href: string; icon: LucideIcon; title: string; detail: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-[22px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-3 transition hover:-translate-y-0.5 hover:bg-[rgb(var(--card)/0.9)]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] transition group-hover:scale-105 dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-[rgb(var(--fg))]">{title}</span>
        <span className="block text-xs text-[rgb(var(--muted))]">{detail}</span>
      </span>
      <ArrowRight size={16} className="text-[rgb(var(--muted))] transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function ChartPanel({ title, description, icon: Icon, children }: { title: string; description: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="section-panel p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
          <Icon size={18} />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-[rgb(var(--fg))]">{title}</h2>
          <p className="text-xs text-[rgb(var(--muted))]">{description}</p>
        </div>
      </div>
      <div className="h-48">{children}</div>
    </div>
  );
}

function AreaMiniChart({ data, color, unit, domain }: { data: { date: string; value: number | null }[]; color: string; unit: string; domain: [number, number] }) {
  const hasData = data.some((item) => item.value !== null);
  if (!hasData) return <EmptyChart icon={Moon} title="No sleep logs yet" detail="Add sleep hours in Daily Log." />;

  return (
    <ResponsiveContainer>
      <AreaChart data={data} margin={{ left: -22, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id={`area-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.42} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgb(var(--border))" strokeOpacity={0.5} vertical={false} />
        <Tooltip content={<ChartTooltip unit={unit} />} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
        <YAxis domain={domain} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#area-${color.replace("#", "")})`} connectNulls dot={false} activeDot={{ r: 4, fill: color, stroke: "white", strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function BarMiniChart({ data, color, unit }: { data: { date: string; value: number | null }[]; color: string; unit: string }) {
  const hasData = data.some((item) => item.value !== null);
  if (!hasData) return <EmptyChart icon={Droplets} title="No hydration logs yet" detail="Add water cups in Daily Log." />;

  return (
    <ResponsiveContainer>
      <BarChart data={data} margin={{ left: -22, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid stroke="rgb(var(--border))" strokeOpacity={0.5} vertical={false} />
        <Tooltip content={<ChartTooltip unit={unit} />} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
        <Bar dataKey="value" fill={color} radius={[10, 10, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { value?: number | string | null }[];
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 shadow-xl">
      <p className="text-[11px] font-semibold text-[rgb(var(--muted))]">{label}</p>
      <p className="text-sm font-bold text-[rgb(var(--fg))]">
        {payload[0].value ?? "--"}
        {unit}
      </p>
    </div>
  );
}

function EmptyChart({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-[24px] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.42)] p-5 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
        <Icon size={20} />
      </span>
      <p className="text-sm font-bold text-[rgb(var(--fg))]">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-[rgb(var(--muted))]">{detail}</p>
    </div>
  );
}

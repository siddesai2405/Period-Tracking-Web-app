"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  ClipboardList,
  Droplets,
  HeartHandshake,
  HeartPulse,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PartnerDashboardPayload } from "@/lib/partnerShare";
import type { Cycle, LogEntry } from "@/lib/store";
import { currentPhase, phaseInfo, predict } from "@/lib/ai/prediction";
import { generateInsights } from "@/lib/ai/insights";
import { cn, formatDate } from "@/lib/utils";

type LoadState = "loading" | "ready" | "error";

export default function PartnerDashboardPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [state, setState] = useState<LoadState>("loading");
  const [payload, setPayload] = useState<PartnerDashboardPayload | null>(null);
  const [error, setError] = useState("Partner link is unavailable.");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!token) return;
      setState("loading");
      try {
        const response = await fetch(`/api/partner-share/${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Partner link is unavailable.");
        if (active) {
          setPayload(data as PartnerDashboardPayload);
          setState("ready");
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Partner link is unavailable.");
          setState("error");
        }
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [token]);

  if (state === "loading") {
    return (
      <PublicShell>
        <div className="grid min-h-[70vh] place-items-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[rgb(var(--acc-500)/0.26)] border-t-[rgb(var(--acc-500))]" />
            <p className="mt-4 text-sm font-bold text-[rgb(var(--muted))]">Loading shared dashboard...</p>
          </div>
        </div>
      </PublicShell>
    );
  }

  if (state === "error" || !payload) {
    return (
      <PublicShell>
        <div className="grid min-h-[70vh] place-items-center px-4">
          <section className="section-panel max-w-lg p-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-200">
              <AlertCircle size={21} />
            </span>
            <h1 className="mt-4 font-display text-2xl font-semibold text-[rgb(var(--fg))]">Partner link inactive</h1>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{error}</p>
            <Link href="/" className="mt-5 inline-block">
              <Button variant="outline">Go to Lotus Phase</Button>
            </Link>
          </section>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <PartnerDashboard payload={payload} />
    </PublicShell>
  );
}

function PartnerDashboard({ payload }: { payload: PartnerDashboardPayload }) {
  const logArr = useMemo(
    () => Object.values(payload.logs).sort((a, b) => a.date.localeCompare(b.date)),
    [payload.logs],
  );
  const prediction = useMemo(
    () => predict(payload.cycles, payload.profile.avgCycleLength, payload.profile.avgPeriodLength, payload.logs),
    [payload.cycles, payload.profile.avgCycleLength, payload.profile.avgPeriodLength, payload.logs],
  );
  const { phase, dayOfCycle } = currentPhase(new Date(), prediction, payload.cycles);
  const info = phaseInfo[phase];
  const insights = useMemo(
    () => generateInsights({ phase, dayOfCycle, prediction, logs: logArr }),
    [phase, dayOfCycle, prediction, logArr],
  );

  const last14 = logArr.slice(-14);
  const avgSleep = average(last14.map((entry) => entry.sleepHrs).filter((value): value is number => typeof value === "number"));
  const avgWater = average(last14.map((entry) => entry.waterCups).filter((value): value is number => typeof value === "number"));
  const symptomList = symptomCounts(logArr);
  const daysToPeriod = prediction
    ? Math.ceil((prediction.nextPeriodStart.getTime() - Date.now()) / 86_400_000)
    : null;
  const cycleProgress = prediction
    ? Math.min(100, Math.max(4, (dayOfCycle / Math.max(1, prediction.avgCycleLength)) * 100))
    : 0;
  const pcosAnswers = Object.values(payload.pcosProfile.answers);
  const pcosScore = pcosAnswers.reduce((sum, value) => sum + value, 0);

  return (
    <motion.main
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8"
    >
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-gradient text-white shadow-[0_18px_42px_-24px_var(--acc-glow)]">
            <HeartHandshake size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Lotus Phase partner view</p>
            <h1 className="font-display text-2xl font-semibold text-[rgb(var(--fg))] sm:text-3xl">
              {payload.profile.name || "Friend"}'s health dashboard
            </h1>
          </div>
        </div>
        <Badge tone="slate">
          <LockKeyhole size={13} />
          Read-only
        </Badge>
      </header>

      <section className="section-panel overflow-hidden p-0">
        <div className="hero-clean-surface relative overflow-hidden p-5 sm:p-7">
          <div className="hero-clean-glow pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full blur-3xl" />
          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={info.tone}>
                  <Waves size={13} />
                  {info.label} phase
                </Badge>
                <Badge tone="slate">Day {dayOfCycle}</Badge>
                {prediction && <Badge tone="green">{prediction.confidencePct}% prediction confidence</Badge>}
              </div>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-[rgb(var(--fg))] sm:text-5xl">
                {prediction
                  ? daysToPeriod !== null && daysToPeriod < 0
                    ? `${Math.abs(daysToPeriod)} days late`
                    : daysToPeriod === 0
                      ? "Period expected today"
                      : `${daysToPeriod} days to next period`
                  : "Cycle data is still building"}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))] sm:text-base">{info.tip}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MiniTile icon={CalendarDays} label="Next period" value={prediction ? formatDate(prediction.nextPeriodStart) : "Not enough data"} />
                <MiniTile icon={TrendingUp} label="Cycle progress" value={`${Math.round(cycleProgress)}%`} />
                <MiniTile icon={ClipboardList} label="Shared logs" value={`${logArr.length}`} />
              </div>
            </div>
            <div className="rounded-[28px] border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--card)/0.62)] p-5 shadow-[0_22px_64px_-44px_rgba(77,45,74,0.5)] backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Partner summary</p>
              <div className="mt-4 space-y-3">
                <SummaryRow label="Average cycle" value={`${prediction?.avgCycleLength ?? payload.profile.avgCycleLength} days`} />
                <SummaryRow label="Average period" value={`${prediction?.avgPeriodLength ?? payload.profile.avgPeriodLength} days`} />
                <SummaryRow label="Shared since" value={formatDate(payload.share.createdAt)} />
                <SummaryRow label="Health goal" value={healthGoalLabel(payload.profile.healthGoal)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={HeartPulse} label="Cycle avg" value={prediction?.avgCycleLength ?? payload.profile.avgCycleLength} unit="days" tone="rose" />
        <Metric icon={Moon} label="Sleep avg" value={avgSleep ? avgSleep.toFixed(1) : "--"} unit="hrs" tone="violet" />
        <Metric icon={Droplets} label="Hydration avg" value={avgWater ? avgWater.toFixed(1) : "--"} unit="cups" tone="blue" />
        <Metric icon={ShieldCheck} label="PCOS check" value={pcosAnswers.length ? pcosScore : "--"} unit={pcosAnswers.length ? "score" : ""} tone="green" />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <Panel title="Recent cycle history" icon={CalendarDays}>
            {payload.cycles.length > 0 ? (
              <div className="space-y-3">
                {payload.cycles.slice(-5).reverse().map((cycle, index) => (
                  <CycleRow key={cycle.startDate} cycle={cycle} index={index} cycles={payload.cycles} fallback={prediction?.avgCycleLength ?? payload.profile.avgCycleLength} />
                ))}
              </div>
            ) : (
              <EmptyState icon={CalendarDays} title="No cycles shared yet" detail="Cycle history will appear here after tracking starts." />
            )}
          </Panel>

          <Panel title="Recent daily logs" icon={Activity}>
            {logArr.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {logArr.slice(-6).reverse().map((log) => (
                  <LogCard key={log.date} log={log} />
                ))}
              </div>
            ) : (
              <EmptyState icon={ClipboardList} title="No logs shared yet" detail="Mood, symptoms, sleep, and hydration will appear here." />
            )}
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="What matters now" icon={Sparkles}>
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="rounded-[22px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-4">
                  <p className="text-sm font-bold text-[rgb(var(--fg))]">{insight.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{insight.body}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Common symptoms" icon={ClipboardList}>
            {symptomList.length > 0 ? (
              <div className="space-y-3">
                {symptomList.map(([symptom, count]) => (
                  <ProgressRow key={symptom} label={symptom} value={count} max={symptomList[0][1]} />
                ))}
              </div>
            ) : (
              <EmptyState icon={ClipboardList} title="No symptom trend yet" detail="Symptoms will summarize here as logs grow." />
            )}
          </Panel>

          <Panel title="Health profile" icon={ShieldCheck}>
            <div className="space-y-3">
              <SummaryRow label="Diet" value={dietLabel(payload.profile.dietPreference)} />
              <SummaryRow label="Activity" value={activityLabel(payload.profile.activityLevel)} />
              <SummaryRow label="Height" value={payload.profile.height ? `${payload.profile.height} cm` : "Not set"} />
              <SummaryRow label="Weight" value={payload.profile.weight ? `${payload.profile.weight} kg` : "Not set"} />
            </div>
          </Panel>
        </aside>
      </section>
    </motion.main>
  );
}

function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-bg min-h-screen text-[rgb(var(--fg))]">
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function symptomCounts(logs: LogEntry[]) {
  const counts: Record<string, number> = {};
  logs.forEach((log) => log.symptoms.forEach((symptom) => {
    counts[symptom] = (counts[symptom] ?? 0) + 1;
  }));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
}

function healthGoalLabel(value: string) {
  const labels: Record<string, string> = {
    maintain: "Maintain weight",
    weightloss: "Lose weight",
    weightgain: "Gain weight",
    pcos: "Manage PCOS",
    fertility: "Support fertility",
  };
  return labels[value] ?? "Maintain weight";
}

function dietLabel(value: string) {
  const labels: Record<string, string> = {
    nonveg: "Balanced",
    veg: "Vegetarian",
    vegan: "Vegan",
    glutenfree: "Gluten-free",
  };
  return labels[value] ?? "Balanced";
}

function activityLabel(value?: string) {
  const labels: Record<string, string> = {
    sedentary: "Sedentary",
    light: "Light",
    moderate: "Moderate",
    active: "Active",
    veryActive: "Very active",
  };
  return value ? labels[value] ?? "Not set" : "Not set";
}

function MiniTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--card)/0.58)] p-3 backdrop-blur">
      <Icon size={16} className="text-[rgb(var(--acc-600))] dark:text-[rgb(var(--acc-200))]" />
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-[rgb(var(--fg))]">{value}</p>
    </div>
  );
}

function Metric({ icon: Icon, label, value, unit, tone }: { icon: LucideIcon; label: string; value: string | number; unit: string; tone: "rose" | "violet" | "blue" | "green" }) {
  const tones = {
    rose: "bg-rose-500/10 text-rose-700 dark:text-rose-200",
    violet: "bg-violet-500/10 text-violet-700 dark:text-violet-200",
    blue: "bg-sky-500/10 text-sky-700 dark:text-sky-200",
    green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  };

  return (
    <div className="bento-stat p-4">
      <span className={cn("mb-4 grid h-10 w-10 place-items-center rounded-2xl", tones[tone])}>
        <Icon size={18} />
      </span>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="metric-number text-4xl text-[rgb(var(--fg))]">{value}</span>
        {unit && <span className="text-sm font-bold text-[rgb(var(--muted))]">{unit}</span>}
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <section className="section-panel p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
          <Icon size={18} />
        </span>
        <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[rgb(var(--surface)/0.54)] px-3 py-2">
      <span className="text-xs font-bold text-[rgb(var(--muted))]">{label}</span>
      <span className="text-right text-sm font-bold text-[rgb(var(--fg))]">{value}</span>
    </div>
  );
}

function CycleRow({ cycle, index, cycles, fallback }: { cycle: Cycle; index: number; cycles: Cycle[]; fallback: number }) {
  const currentIndex = cycles.findIndex((item) => item.startDate === cycle.startDate);
  const nextCycle = cycles[currentIndex + 1];
  const length = nextCycle
    ? Math.round((new Date(nextCycle.startDate).getTime() - new Date(cycle.startDate).getTime()) / 86_400_000)
    : fallback;
  const periodLength = cycle.endDate
    ? Math.round((new Date(cycle.endDate).getTime() - new Date(cycle.startDate).getTime()) / 86_400_000) + 1
    : null;
  const width = Math.max(8, Math.min(100, ((periodLength ?? 5) / Math.max(1, length)) * 100));

  return (
    <div className="rounded-[22px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[rgb(var(--fg))]">{formatDate(cycle.startDate)}</p>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            {length} day cycle{periodLength ? ` - ${periodLength} day period` : ""}
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

function LogCard({ log }: { log: LogEntry }) {
  return (
    <div className="rounded-[22px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-[rgb(var(--fg))]">{formatDate(log.date, { month: "short", day: "numeric" })}</p>
        {log.flow && <span className="rounded-full bg-[rgb(var(--acc-50))] px-2.5 py-1 text-[11px] font-bold text-[rgb(var(--acc-700))]">{log.flow}</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {log.mood && <Pill>{log.mood}</Pill>}
        {typeof log.sleepHrs === "number" && <Pill>{log.sleepHrs}h sleep</Pill>}
        {typeof log.waterCups === "number" && <Pill>{log.waterCups} cups</Pill>}
        {log.symptoms.slice(0, 3).map((symptom) => <Pill key={symptom}>{symptom}</Pill>)}
      </div>
      {log.notes && <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">{log.notes}</p>}
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-[rgb(var(--card)/0.74)] px-2.5 py-1 text-[11px] font-bold text-[rgb(var(--muted))] ring-1 ring-[rgb(var(--border)/0.72)]">
      {children}
    </span>
  );
}

function ProgressRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.max(8, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-[rgb(var(--fg))]">{label}</span>
        <span className="text-xs font-bold text-[rgb(var(--muted))]">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[rgb(var(--border))]">
        <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.42)] p-5 text-center">
      <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
        <Icon size={18} />
      </span>
      <p className="text-sm font-bold text-[rgb(var(--fg))]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{detail}</p>
    </div>
  );
}

"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Flower2,
  Heart,
  HeartPulse,
  Info,
  Leaf,
  Moon,
  PenLine,
  Plus,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Utensils,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/topbar";
import { useUserData } from "@/lib/hooks/useUserData";
import { currentPhase, phaseInfo, predict, type CyclePhase, type Prediction } from "@/lib/ai/prediction";
import { addDays, formatDate, isSameDay, startOfDay } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";

const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DayKind = "period" | "predicted-period" | "fertile" | "ovulation" | null;
type ActiveDayKind = Exclude<DayKind, null>;

const phaseStyles = {
  menstrual: {
    label: "Menstrual",
    color: "#e2376f",
    icon: Waves,
  },
  follicular: {
    label: "Follicular",
    color: "#16a34a",
    icon: Leaf,
  },
  ovulatory: {
    label: "Ovulatory",
    color: "#f59e0b",
    icon: Sun,
  },
  luteal: {
    label: "Luteal",
    color: "#8b5cf6",
    icon: Moon,
  },
};

const quickLinks = [
  { icon: PenLine, label: "Log symptoms", href: "/log" },
  { icon: BarChart3, label: "See stats", href: "/stats" },
  { icon: Sparkles, label: "Ask Luna", href: "/chat" },
  { icon: Activity, label: "Insights", href: "/insights" },
];

const dayVisuals: Record<
  ActiveDayKind,
  {
    icon: LucideIcon;
    label: string;
    shortLabel: string;
    desc: string;
    cell: string;
    marker: string;
    banner: string;
    iconColor: string;
    dot: string;
    rail: string;
  }
> = {
  period: {
    icon: Waves,
    label: "Period",
    shortLabel: "Period",
    desc: "Logged period day",
    cell:
      "border-rose-200/80 bg-rose-50/58 text-rose-950 shadow-[0_18px_40px_-34px_rgba(244,63,94,0.42)] dark:border-rose-300/28 dark:bg-rose-500/[0.075] dark:text-rose-50",
    marker: "bg-rose-100 text-rose-800 ring-1 ring-rose-300/85 shadow-[0_10px_22px_-15px_rgba(244,63,94,0.58)] dark:bg-rose-100 dark:text-rose-800 dark:ring-rose-200/85",
    banner: "bg-rose-500 text-white ring-1 ring-rose-300/80 shadow-[0_12px_22px_-14px_rgba(244,63,94,0.72)] dark:bg-rose-400 dark:text-rose-950 dark:ring-rose-200/80",
    iconColor: "text-rose-800",
    dot: "bg-rose-400",
    rail: "bg-rose-400/90",
  },
  "predicted-period": {
    icon: CalendarCheck2,
    label: "Predicted period",
    shortLabel: "Predict",
    desc: "Estimated next period",
    cell:
      "border-rose-200/70 bg-rose-50/34 text-rose-900 ring-1 ring-rose-100/60 dark:border-rose-200/24 dark:bg-rose-300/[0.045] dark:text-rose-100 dark:ring-rose-200/10",
    marker: "bg-pink-100 text-pink-800 ring-1 ring-pink-300/85 shadow-[0_10px_22px_-15px_rgba(236,72,153,0.54)] dark:bg-pink-100 dark:text-pink-800 dark:ring-pink-200/85",
    banner: "bg-pink-200 text-pink-900 ring-1 ring-pink-300/90 shadow-[0_12px_22px_-14px_rgba(236,72,153,0.58)] dark:bg-pink-200 dark:text-pink-950 dark:ring-pink-100/80",
    iconColor: "text-pink-800",
    dot: "bg-rose-400",
    rail: "bg-rose-300/86",
  },
  fertile: {
    icon: Leaf,
    label: "Fertile window",
    shortLabel: "Fertile",
    desc: "Higher fertility window",
    cell:
      "border-emerald-200/74 bg-emerald-50/42 text-emerald-900 shadow-[0_14px_34px_-32px_rgba(16,185,129,0.38)] dark:border-emerald-200/24 dark:bg-emerald-300/[0.07] dark:text-emerald-100",
    marker: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/85 shadow-[0_10px_22px_-15px_rgba(16,185,129,0.54)] dark:bg-emerald-100 dark:text-emerald-800 dark:ring-emerald-200/85",
    banner: "bg-emerald-300 text-emerald-950 ring-1 ring-emerald-200/90 shadow-[0_12px_22px_-14px_rgba(16,185,129,0.58)] dark:bg-emerald-300 dark:text-emerald-950 dark:ring-emerald-100/80",
    iconColor: "text-emerald-800",
    dot: "bg-emerald-400",
    rail: "bg-emerald-400/90",
  },
  ovulation: {
    icon: Sun,
    label: "Ovulation",
    shortLabel: "Ovulate",
    desc: "Estimated ovulation day",
    cell:
      "border-amber-200/78 bg-amber-50/44 text-amber-950 shadow-[0_14px_34px_-32px_rgba(245,158,11,0.42)] dark:border-amber-200/24 dark:bg-amber-300/[0.07] dark:text-amber-100",
    marker: "bg-amber-100 text-amber-900 ring-1 ring-amber-300/85 shadow-[0_10px_22px_-15px_rgba(245,158,11,0.58)] dark:bg-amber-100 dark:text-amber-900 dark:ring-amber-200/85",
    banner: "bg-amber-300 text-amber-950 ring-1 ring-amber-100/90 shadow-[0_12px_22px_-14px_rgba(245,158,11,0.62)] dark:bg-amber-300 dark:text-amber-950 dark:ring-amber-100/80",
    iconColor: "text-amber-900",
    dot: "bg-amber-400",
    rail: "bg-amber-400/90",
  },
};

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { cycles, profile, addCycle, removeCycle, logs } = useUserData();
  const push = useToast((s) => s.push);
  const [view, setView] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<Date>(new Date());
  const selectedDayRef = useRef<HTMLDivElement>(null);
  const [showFactors, setShowFactors] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const prediction = useMemo(
    () => predict(cycles, profile.avgCycleLength, profile.avgPeriodLength, logs),
    [cycles, profile.avgCycleLength, profile.avgPeriodLength, logs],
  );

  const { phase, dayOfCycle } = currentPhase(new Date(), prediction, cycles);
  const info = phaseInfo[phase];
  const phaseStyle = phaseStyles[phase];
  const PhaseIcon = phaseStyle.icon;

  const monthCells = useMemo(() => buildMonth(view), [view]);
  const periodDates = useMemo(() => {
    const dates = new Set<string>();
    cycles.forEach((cycle) => {
      const start = parseLocalDate(cycle.startDate);
      const end = getCycleDisplayEnd(cycle, profile.avgPeriodLength);
      for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
        dates.add(dateKey(d));
      }
    });
    return dates;
  }, [cycles, profile.avgPeriodLength]);

  if (!mounted) return null;

  const daysToPeriod = prediction
    ? Math.ceil((prediction.nextPeriodStart.getTime() - Date.now()) / 86_400_000)
    : null;
  const isLate = daysToPeriod !== null && daysToPeriod < 0;
  const ringPct = prediction
    ? Math.min(
        100,
        Math.max(4, ((prediction.avgCycleLength - Math.max(0, daysToPeriod ?? 0)) / prediction.avgCycleLength) * 100),
      )
    : 8;

  const selectedKey = dateKey(selected);
  const selectedKind = kindOf(selected);
  const selectedLog = logs[selectedKey];
  const selectedCycleStart = cycles.some((cycle) => cycle.startDate === selectedKey);
  const visibleDays = monthCells.filter((day): day is Date => Boolean(day));
  const monthSignalCounts = visibleDays.reduce(
    (acc, day) => {
      const kind = kindOf(day);
      if (kind) acc[kind] += 1;
      if (logs[dateKey(day)]) acc.logged += 1;
      return acc;
    },
    { period: 0, "predicted-period": 0, fertile: 0, ovulation: 0, logged: 0 } as Record<ActiveDayKind | "logged", number>,
  );

  function kindOf(d: Date): DayKind {
    const key = dateKey(d);
    if (periodDates.has(key)) return "period";
    if (!prediction) return null;
    if (isSameDay(d, prediction.ovulationDay)) return "ovulation";
    if (startOfDay(d) >= startOfDay(prediction.fertileStart) && startOfDay(d) <= startOfDay(prediction.fertileEnd)) return "fertile";
    if (startOfDay(d) >= startOfDay(prediction.nextPeriodStart) && startOfDay(d) <= startOfDay(prediction.nextPeriodEnd)) {
      return "predicted-period";
    }
    return null;
  }

  const markPeriodStart = async () => {
    await addCycle({ startDate: selectedKey });
    push({ title: "Period logged", description: formatDate(selected), tone: "success" });
  };

  const removePeriodStart = async () => {
    if (cycles.find((cycle) => cycle.startDate === selectedKey)) {
      await removeCycle(selectedKey);
      push({ title: "Period removed", description: formatDate(selected), tone: "info" });
    }
  };

  const focusSelectedDay = (date: Date) => {
    setSelected(date);
    window.setTimeout(() => {
      selectedDayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  };

  return (
    <div>
      <Topbar title="Calendar" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-6"
      >
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px] 2xl:grid-cols-[minmax(0,1fr)_410px]">
          <div className="section-panel calendar-shell overflow-hidden p-0">
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,rgb(var(--surface-2)/0.88),rgb(var(--surface)/0.78),rgb(var(--acc-50)/0.58))] p-4 ring-1 ring-[rgb(var(--border)/0.72)] dark:bg-[linear-gradient(135deg,rgb(var(--surface-2)/0.82),rgb(var(--surface)/0.72),rgba(244,114,182,0.10))] dark:ring-[rgb(var(--border)/0.68)] sm:p-5">
              <div className="pointer-events-none absolute -right-20 -top-28 h-56 w-56 rounded-full bg-pink-200/44 blur-3xl dark:bg-pink-400/10" />
              <div className="pointer-events-none absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-mint-200/34 blur-3xl dark:bg-emerald-300/10" />

              <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <Badge tone={phase === "menstrual" ? "rose" : phase === "follicular" ? "green" : phase === "ovulatory" ? "amber" : "lavender"} className="px-2.5 py-1 text-[11px]">
                      <PhaseIcon size={13} />
                      {phaseStyle.label} phase
                    </Badge>
                    <Badge tone="slate" className="px-2.5 py-1 text-[11px]">Day {dayOfCycle}</Badge>
                    {prediction && (
                      <Badge tone={prediction.confidencePct >= 60 ? "green" : "amber"} className="px-2.5 py-1 text-[11px]">
                        <ShieldCheck size={13} />
                        {prediction.confidencePct}% confidence
                      </Badge>
                    )}
                  </div>

                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Cycle calendar</p>
                  <div className="mt-1.5 grid grid-cols-[40px_minmax(0,auto)_40px] items-center gap-2 sm:inline-grid sm:grid-cols-[40px_auto_40px] sm:gap-3">
                    <button
                      type="button"
                      className="theme-toggle h-10 w-10"
                      onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
                      aria-label="Previous month"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <h2 className="min-w-0 text-center font-display text-3xl font-semibold tracking-normal text-[rgb(var(--fg))] sm:text-left sm:text-5xl">
                      {view.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </h2>
                    <button
                      type="button"
                      className="theme-toggle h-10 w-10"
                      onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
                      aria-label="Next month"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-[rgb(var(--muted))] sm:block">
                    {info.tip} Tap any day to log a period, add symptoms, and review fertility signals.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button variant="outline" onClick={() => setView(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
                    <CalendarDays size={16} />
                    Today
                  </Button>
                  <Button onClick={() => focusSelectedDay(new Date())}>
                    <Plus size={16} />
                    Log period
                  </Button>
                </div>
              </div>
            </div>

            <div className="calendar-grid-zone p-3 pb-5 sm:p-5">
              <div className="mb-2 sm:hidden">
                <CalendarLegendBar />
              </div>
              <div className="calendar-weekdays grid grid-cols-7 gap-1 rounded-2xl border border-[rgb(var(--border)/0.48)] bg-[rgb(var(--surface-2)/0.42)] p-1 text-center text-[9px] font-black uppercase tracking-[0.08em] text-[rgb(var(--muted))] sm:gap-2 sm:p-1.5 sm:text-[10px] sm:tracking-[0.12em]">
                {WEEK.map((day) => (
                  <div key={day} className="py-1.5">
                    {day}
                  </div>
                ))}
              </div>

              <motion.div
                key={`${view.getFullYear()}-${view.getMonth()}`}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.24 }}
                className="mt-2 grid grid-cols-7 gap-1.5 sm:mt-3 sm:gap-2"
              >
                {monthCells.map((day, index) => {
                  if (!day) return <div key={`empty-${index}`} className="min-h-[54px] sm:min-h-[90px] xl:min-h-[104px] 2xl:min-h-[112px]" />;
                  const key = dateKey(day);
                  return (
                    <CalendarDay
                      key={key}
                      date={day}
                      kind={kindOf(day)}
                      selected={isSameDay(day, selected)}
                      today={isSameDay(day, new Date())}
                      logged={!!logs[key]}
                      onClick={() => {
                        setSelected(day);
                      }}
                    />
                  );
                })}
              </motion.div>

              <div ref={selectedDayRef} className="mt-4 scroll-mt-24 xl:hidden">
                <SelectedDayCard
                  date={selected}
                  kind={selectedKind}
                  hasLog={!!selectedLog}
                  isPeriodStart={selectedCycleStart}
                  onPeriod={markPeriodStart}
                  onRemove={removePeriodStart}
                  compact
                />
              </div>

              <div className="mt-4 hidden sm:block">
                <IndicatorSummary />
                <MonthSignalStrip counts={monthSignalCounts} confidence={prediction?.confidencePct ?? null} selected={selected} />
              </div>

              <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
                <SignalCard icon={Waves} label="Next period" value={prediction ? shortDate(prediction.nextPeriodStart) : "Add cycle"} tone="rose" />
                <SignalCard icon={Leaf} label="Fertile" value={prediction ? `${shortDate(prediction.fertileStart)} - ${shortDate(prediction.fertileEnd)}` : "Learning"} tone="green" />
                <SignalCard icon={Sun} label="Ovulation" value={prediction ? shortDate(prediction.ovulationDay) : "Learning"} tone="amber" />
                <SignalCard icon={Moon} label="Phase" value={`Day ${dayOfCycle}`} tone="violet" />
              </div>

              {prediction && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowTimeline((value) => !value)}
                    className="flex w-full items-center justify-between rounded-2xl border border-[rgb(var(--border)/0.74)] bg-[rgb(var(--card)/0.74)] px-4 py-3 text-left text-sm font-black text-[rgb(var(--fg))] shadow-[0_12px_28px_-26px_rgba(73,45,72,0.4)] xl:hidden"
                    aria-expanded={showTimeline}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Sparkles size={16} className="text-[rgb(var(--acc-600))]" />
                      Cycle timeline
                    </span>
                    <ChevronRight size={16} className={cn("transition-transform", showTimeline && "rotate-90")} />
                  </button>
                  <div className={cn("xl:block", showTimeline ? "block" : "hidden")}>
                    <CycleMap
                      dayOfCycle={dayOfCycle}
                      phase={phase}
                      prediction={prediction}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-[104px] xl:self-start">
            <div className="section-panel calendar-subpanel relative overflow-hidden p-5 sm:p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[rgb(var(--acc-200))] opacity-40 blur-3xl dark:opacity-10" />
              <div className="relative">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-100))] text-[rgb(var(--acc-700))] dark:bg-[rgb(var(--acc-500)/0.16)] dark:text-[rgb(var(--acc-200))]">
                      <Flower2 size={20} />
                    </span>
                    <div>
                      <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Cycle Buddy</h2>
                      <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
                        {phaseStyle.label} phase, day {dayOfCycle} of this cycle.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <CycleRing pct={ringPct} color={phaseStyle.color} value={daysToPeriod} isLate={isLate} />
                </div>

                <PhaseRail phase={phase} />
                <CareCuePanel phase={phase} dayOfCycle={dayOfCycle} prediction={prediction} />

                <div className="mt-5 grid gap-3">
                  <Button className="w-full" onClick={() => focusSelectedDay(new Date())}>
                    <CalendarPlus size={16} />
                    Log period
                  </Button>
                  <Link href="/log">
                    <Button variant="outline" className="w-full">
                      <PenLine size={16} />
                      Add symptoms
                    </Button>
                  </Link>
                  {prediction && (
                    <Button variant="soft" className="w-full" onClick={() => setShowFactors(true)}>
                      <Info size={16} />
                      Prediction confidence
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <SelectedDayCard
              date={selected}
              kind={selectedKind}
              hasLog={!!selectedLog}
              isPeriodStart={selectedCycleStart}
              onPeriod={markPeriodStart}
              onRemove={removePeriodStart}
            />

            <div className="section-panel calendar-subpanel p-5">
              <h3 className="mb-4 font-display text-lg font-semibold text-[rgb(var(--fg))]">Calendar legend</h3>
              <div className="grid gap-2">
                <Legend icon={Waves} label="Period" desc="Logged period days" tone="period" />
                <Legend icon={CalendarCheck2} label="Predicted" desc="AI-estimated next period" tone="predicted" />
                <Legend icon={Leaf} label="Fertile" desc="Higher fertility window" tone="fertile" />
                <Legend icon={Sun} label="Ovulation" desc="Estimated ovulation day" tone="ovulation" />
                <Legend icon={CheckCircle2} label="Daily log" desc="Symptoms or notes saved" tone="logged" />
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="bento-stat group flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] transition-transform group-hover:scale-105 dark:bg-[rgb(var(--acc-500)/0.13)] dark:text-[rgb(var(--acc-200))]">
                <Icon size={19} />
              </span>
              <div>
                <p className="text-sm font-bold text-[rgb(var(--fg))]">{label}</p>
                <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">Open tool</p>
              </div>
            </Link>
          ))}
        </section>
      </motion.div>

      {showFactors && prediction && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-6" onClick={() => setShowFactors(false)}>
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-[rgb(var(--card))] p-6 shadow-2xl sm:rounded-[28px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[rgb(var(--border))] sm:hidden" />
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Prediction model</p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-[rgb(var(--fg))]">Confidence details</h3>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">How Lotus Phase rates this prediction using cycle history and recent logs.</p>
              </div>
              <span className="metric-number text-4xl text-[rgb(var(--acc-600))] dark:text-[rgb(var(--acc-200))]">{prediction.confidencePct}%</span>
            </div>
            <div className="mb-6 h-3 overflow-hidden rounded-full bg-[rgb(var(--surface))]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${prediction.confidencePct}%` }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                className="h-full rounded-full bg-brand-gradient"
              />
            </div>
            <div className="grid gap-3">
              {prediction.factors.map((factor, index) => (
                <div key={`${factor.label}-${index}`} className="flex items-start gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.58)] p-4">
                  <span
                    className={cn(
                      "mt-1 h-2.5 w-2.5 rounded-full",
                      factor.impact === "positive" ? "bg-emerald-400" : factor.impact === "negative" ? "bg-rose-400" : "bg-amber-400",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[rgb(var(--fg))]">{factor.label}</p>
                    <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{factor.detail}</p>
                  </div>
                  <span className="text-xs font-bold text-[rgb(var(--muted))]">
                    {factor.impact === "positive" ? "+" : ""}
                    {Math.round(factor.points * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

function buildMonth(view: Date) {
  const firstWeekday = view.getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let index = 0; index < firstWeekday; index++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(view.getFullYear(), view.getMonth(), day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getCycleDisplayEnd(cycle: { startDate: string; endDate?: string }, avgPeriodLength: number) {
  const start = parseLocalDate(cycle.startDate);
  const fallbackEnd = addDays(start, Math.max(1, avgPeriodLength) - 1);
  if (!cycle.endDate) return fallbackEnd;

  const storedEnd = parseLocalDate(cycle.endDate);
  return storedEnd <= start ? fallbackEnd : storedEnd;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shortDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SignalCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "rose" | "green" | "amber" | "violet";
}) {
  const toneClass = {
    rose: "bg-rose-500/12 text-rose-700 dark:text-rose-200",
    green: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-200",
    amber: "bg-amber-500/14 text-amber-700 dark:text-amber-200",
    violet: "bg-violet-500/12 text-violet-700 dark:text-violet-200",
  }[tone];

  return (
    <div className="rounded-[24px] border border-[rgb(var(--border)/0.78)] bg-[linear-gradient(180deg,rgb(var(--surface-2)/0.76),rgb(var(--surface)/0.64))] p-4 shadow-[0_12px_36px_-28px_rgba(73,45,72,0.38)]">
      <div className="flex items-center gap-3">
        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", toneClass)}>
          <Icon size={19} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{label}</p>
          <p className="mt-1 truncate text-base font-bold text-[rgb(var(--fg))]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function CycleMap({
  prediction,
  dayOfCycle,
  phase,
}: {
  prediction: Prediction;
  dayOfCycle: number;
  phase: CyclePhase;
}) {
  const cycleLength = Math.max(1, prediction.avgCycleLength);
  const periodEndDay = Math.min(cycleLength, Math.max(1, prediction.avgPeriodLength));
  const ovulationDay = Math.max(1, Math.min(cycleLength, cycleLength - 14));
  const fertileStartDay = Math.max(1, ovulationDay - 2);
  const fertileEndDay = Math.min(cycleLength, ovulationDay + 2);
  const progress = Math.min(100, Math.max(3, (dayOfCycle / cycleLength) * 100));
  const markerFor = (day: number) => `${Math.min(97, Math.max(3, (day / cycleLength) * 100))}%`;

  const milestones = [
    { icon: Waves, label: "Period", value: `Day 1-${periodEndDay}`, kind: "period" as ActiveDayKind, day: 1 },
    { icon: Leaf, label: "Fertile", value: `Day ${fertileStartDay}-${fertileEndDay}`, kind: "fertile" as ActiveDayKind, day: fertileStartDay },
    { icon: Sun, label: "Ovulation", value: `Day ${ovulationDay}`, kind: "ovulation" as ActiveDayKind, day: ovulationDay },
    { icon: CalendarCheck2, label: "Next", value: shortDate(prediction.nextPeriodStart), kind: "predicted-period" as ActiveDayKind, day: cycleLength },
  ];

  return (
    <div className="relative mt-5 overflow-hidden rounded-[28px] border border-[rgb(var(--border)/0.78)] bg-[linear-gradient(180deg,rgb(var(--surface-2)/0.78),rgb(var(--surface)/0.66))] p-4 shadow-[0_18px_48px_-34px_rgba(97,49,81,0.38)] backdrop-blur dark:border-[rgb(var(--border)/0.72)] dark:bg-[rgb(var(--surface-2)/0.52)]">
      <div className="pointer-events-none absolute -right-12 -top-16 h-32 w-32 rounded-full bg-[rgb(var(--acc-200))] opacity-35 blur-3xl dark:opacity-10" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Cycle map</p>
          <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
            Day {dayOfCycle} of {cycleLength} - {phaseStyles[phase].label} focus
          </p>
        </div>
        <Badge tone={prediction.confidencePct >= 60 ? "green" : "amber"}>
          <ShieldCheck size={13} />
          {prediction.confidenceLabel} confidence
        </Badge>
      </div>

      <div className="relative mt-5">
        <div className="relative h-3 overflow-hidden rounded-full bg-[rgb(var(--surface-2)/0.84)] ring-1 ring-[rgb(var(--border)/0.72)] dark:bg-[rgb(var(--surface)/0.72)] dark:ring-[rgb(var(--border)/0.72)]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="h-full rounded-full bg-brand-gradient"
          />
        </div>
        {milestones.map(({ day, kind, label }) => (
          <span
            key={`${kind}-${label}`}
            className={cn(
              "absolute top-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[rgb(var(--card))] shadow-[0_10px_24px_-14px_rgba(41,25,45,0.45)] dark:border-[rgb(var(--card))]",
              dayVisuals[kind].dot,
            )}
            style={{ left: markerFor(day) }}
            title={label}
          />
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {milestones.map(({ icon: Icon, label, value, kind }) => (
          <div key={label} className="flex items-center gap-2 rounded-2xl bg-[rgb(var(--surface-2)/0.58)] p-2.5 ring-1 ring-[rgb(var(--border)/0.62)] dark:bg-[rgb(var(--surface-2)/0.48)] dark:ring-[rgb(var(--border)/0.62)]">
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-2xl", dayVisuals[kind].marker)}>
              <Icon size={18} strokeWidth={3} className={dayVisuals[kind].iconColor} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">{label}</p>
              <p className="truncate text-sm font-bold text-[rgb(var(--fg))]">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IndicatorSummary() {
  const items = (Object.entries(dayVisuals) as [ActiveDayKind, (typeof dayVisuals)[ActiveDayKind]][]).map(([kind, visual]) => ({
    kind,
    ...visual,
  }));

  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {items.map(({ kind, icon: Icon, shortLabel, desc, banner }) => (
        <span
          key={kind}
          className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--border)/0.60)] bg-[rgb(var(--surface-2)/0.54)] px-2.5 py-1.5 text-[11px] font-black text-[rgb(var(--fg))] shadow-[0_8px_18px_-18px_rgba(73,45,72,0.35)] dark:bg-[rgb(var(--surface-2)/0.42)]"
          title={desc}
        >
          <span className={cn("inline-flex h-6 items-center gap-1 rounded-lg px-2 text-[9px] font-black uppercase", banner)}>
            <Icon size={12} strokeWidth={3} className="shrink-0" />
            {shortLabel}
          </span>
        </span>
      ))}
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--border)/0.60)] bg-[rgb(var(--surface-2)/0.54)] px-2.5 py-1.5 text-[11px] font-black text-[rgb(var(--fg))] shadow-[0_8px_18px_-18px_rgba(73,45,72,0.35)] dark:bg-[rgb(var(--surface-2)/0.42)]"
        title="Symptoms, mood, or notes saved"
      >
        <span className="inline-flex h-6 items-center gap-1 rounded-lg bg-fuchsia-500 px-2 text-[9px] font-black uppercase text-white ring-1 ring-fuchsia-300/80 shadow-[0_8px_18px_-12px_rgba(217,70,239,0.62)] dark:bg-fuchsia-400 dark:text-fuchsia-950 dark:ring-fuchsia-200/80">
          <CheckCircle2 size={12} strokeWidth={3} />
          Logged
        </span>
      </span>
    </div>
  );
}

function CalendarLegendBar() {
  const items = (Object.entries(dayVisuals) as [ActiveDayKind, (typeof dayVisuals)[ActiveDayKind]][]).map(([kind, visual]) => ({
    kind,
    ...visual,
  }));

  return (
    <div className="grid grid-cols-5 gap-1">
        {items.map(({ kind, shortLabel, banner, desc }) => (
          <span
            key={kind}
            title={desc}
            className={cn("inline-flex min-w-0 items-center justify-center rounded-[10px] px-1.5 py-1.5 text-[8px] font-black uppercase tracking-[0.02em]", banner)}
          >
            <span className="truncate">{shortLabel}</span>
          </span>
        ))}
        <span
          title="Symptoms, mood, or notes saved"
          className="inline-flex min-w-0 items-center justify-center gap-1 rounded-[10px] bg-fuchsia-500 px-1.5 py-1.5 text-[8px] font-black uppercase tracking-[0.02em] text-white ring-1 ring-fuchsia-300/80 shadow-[0_8px_18px_-12px_rgba(217,70,239,0.62)] dark:bg-fuchsia-400 dark:text-fuchsia-950 dark:ring-fuchsia-200/80"
        >
          <CheckCircle2 size={11} strokeWidth={3} />
          <span className="truncate">Logged</span>
        </span>
    </div>
  );
}

function MonthSignalStrip({
  counts,
  confidence,
  selected,
}: {
  counts: Record<ActiveDayKind | "logged", number>;
  confidence: number | null;
  selected: Date;
}) {
  const items: {
    key: ActiveDayKind | "logged";
    label: string;
    value: number;
    icon: LucideIcon;
    className: string;
  }[] = [
    { key: "period", label: "Period", value: counts.period, icon: Waves, className: "bg-rose-100 text-rose-800 ring-1 ring-rose-300/85 shadow-[0_10px_24px_-15px_rgba(244,63,94,0.52)] dark:bg-rose-100 dark:text-rose-800 dark:ring-rose-200/85" },
    {
      key: "predicted-period",
      label: "Predicted",
      value: counts["predicted-period"],
      icon: CalendarCheck2,
      className: "bg-pink-100 text-pink-800 ring-1 ring-pink-300/85 shadow-[0_8px_18px_-12px_rgba(236,72,153,0.54)] dark:bg-pink-100 dark:text-pink-800 dark:ring-pink-200/85",
    },
    {
      key: "fertile",
      label: "Fertile",
      value: counts.fertile,
      icon: Leaf,
      className: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/85 shadow-[0_8px_18px_-12px_rgba(16,185,129,0.54)] dark:bg-emerald-100 dark:text-emerald-800 dark:ring-emerald-200/85",
    },
    {
      key: "ovulation",
      label: "Ovulation",
      value: counts.ovulation,
      icon: Sun,
      className: "bg-amber-100 text-amber-900 ring-1 ring-amber-300/85 shadow-[0_8px_18px_-12px_rgba(245,158,11,0.58)] dark:bg-amber-100 dark:text-amber-900 dark:ring-amber-200/85",
    },
    {
      key: "logged",
      label: "Logged",
      value: counts.logged,
      icon: CheckCircle2,
      className: "bg-fuchsia-100 text-fuchsia-800 ring-1 ring-fuchsia-300/85 shadow-[0_8px_18px_-12px_rgba(217,70,239,0.54)] dark:bg-fuchsia-100 dark:text-fuchsia-800 dark:ring-fuchsia-200/85",
    },
  ];

  return (
    <div className="mb-3 rounded-[22px] border border-[rgb(var(--border)/0.58)] bg-[linear-gradient(180deg,rgb(var(--surface-2)/0.58),rgb(var(--surface)/0.44))] p-2.5 shadow-[0_12px_28px_-28px_rgba(72,39,72,0.34)] backdrop-blur dark:bg-[rgb(var(--surface-2)/0.38)]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Month signals</p>
          <p className="mt-0.5 text-sm font-semibold text-[rgb(var(--fg))]">
            Selected: {selected.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
        {confidence !== null && (
          <Badge tone={confidence >= 60 ? "green" : "amber"}>
            <ShieldCheck size={13} />
            {confidence}% model
          </Badge>
        )}
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-5">
        {items.map(({ key, label, value, icon: Icon, className }) => (
          <div key={key} className="flex items-center gap-2 rounded-2xl bg-[rgb(var(--surface-2)/0.46)] p-2 ring-1 ring-[rgb(var(--border)/0.44)] dark:bg-[rgb(var(--surface-2)/0.34)]">
            <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl", className)}>
              <Icon size={14} strokeWidth={3} fill="none" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-black leading-none text-[rgb(var(--fg))]">{value}</p>
              <p className="mt-0.5 truncate text-[9px] font-black uppercase tracking-[0.1em] text-[rgb(var(--muted))]">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarDay({
  date,
  kind,
  selected,
  today,
  logged,
  onClick,
}: {
  date: Date;
  kind: DayKind;
  selected: boolean;
  today: boolean;
  logged: boolean;
  onClick: () => void;
}) {
  const current = kind ? dayVisuals[kind] : null;
  const Icon = current?.icon;
  const aria = [
    formatDate(date),
    current?.label,
    today ? "today" : null,
    logged ? "daily log saved" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-label={aria}
      aria-pressed={selected}
      className={cn(
        "group relative flex min-h-[58px] flex-col items-start justify-between overflow-hidden rounded-[16px] border p-1.5 pb-8 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-30px_rgba(72,39,72,0.45)] focus:outline-none sm:min-h-[92px] sm:rounded-[22px] sm:p-3 sm:pb-11 xl:min-h-[100px] 2xl:min-h-[108px]",
        current?.cell ?? "border-[rgb(var(--border)/0.48)] bg-[rgb(var(--surface-2)/0.38)] text-[rgb(var(--fg))] hover:border-rose-200/70 hover:bg-rose-50/34 dark:border-[rgb(var(--border)/0.42)] dark:bg-[rgb(var(--surface-2)/0.30)] dark:hover:border-fuchsia-300/30 dark:hover:bg-fuchsia-300/[0.055]",
        selected && "z-10 -translate-y-0.5 ring-2 ring-rose-300/85 ring-offset-2 ring-offset-[rgb(var(--surface))] shadow-[0_18px_42px_-28px_rgba(244,114,182,0.58)] dark:ring-fuchsia-300/70 dark:ring-offset-[rgb(31,25,43)] dark:shadow-[0_0_0_1px_rgba(244,114,182,0.18),0_18px_42px_-28px_rgba(216,180,254,0.55)]",
        today && !selected && "border-rose-300/70 dark:border-fuchsia-300/50",
      )}
    >
      {logged && (
        <span
          aria-hidden="true"
          title="Daily log saved"
          className="absolute right-1.5 top-1.5 z-20 grid h-4 w-4 place-items-center rounded-full bg-fuchsia-500 text-white ring-2 ring-[rgb(var(--surface))] shadow-[0_8px_18px_-10px_rgba(217,70,239,0.72)] dark:bg-fuchsia-400 dark:text-fuchsia-950 dark:ring-[rgb(31,25,43)] sm:right-2 sm:top-2 sm:h-5 sm:w-5"
        >
          <Check size={11} strokeWidth={4} />
        </span>
      )}

      <span className="flex w-full items-start justify-between gap-1">
        <span
          className={cn(
            "relative z-10 inline-flex min-w-6 items-center justify-center rounded-md px-1 py-0.5 text-sm font-black leading-none text-[rgb(var(--fg))] sm:min-w-7 sm:text-base",
            current && "text-[rgb(var(--fg))] dark:text-[rgb(var(--fg))]",
            today && "bg-rose-100/78 text-rose-800 ring-1 ring-rose-300/75 dark:bg-fuchsia-300/18 dark:text-fuchsia-100 dark:ring-fuchsia-300/42",
          )}
        >
          {date.getDate()}
        </span>
        <span className={cn("relative z-10 flex items-center gap-1", logged && "pr-4 sm:pr-5")}>
          {today && (
            <span className="hidden rounded-full bg-[rgb(var(--acc-500))] px-2 py-1 text-[10px] font-black text-white shadow-sm sm:inline-flex">
              Today
            </span>
          )}
        </span>
      </span>

      {Icon && (
        <span className={cn("absolute bottom-1 left-1 right-1 z-10 inline-flex h-6 items-center justify-center gap-1 rounded-[10px] px-1 text-[8px] font-black uppercase tracking-[0.02em] shadow-sm sm:bottom-2 sm:left-2 sm:right-2 sm:h-8 sm:gap-1.5 sm:rounded-[14px] sm:px-2 sm:text-[10px]", current.banner)}>
          <Icon size={12} strokeWidth={3} className="hidden shrink-0 sm:block sm:h-[15px] sm:w-[15px]" />
          <span className="truncate">{current.shortLabel}</span>
        </span>
      )}

      {!Icon && (
        <span className="relative z-10 mt-auto hidden text-[10px] font-bold text-[rgb(var(--muted))] opacity-0 transition-opacity group-hover:opacity-100 sm:inline">
          Tap to plan
        </span>
      )}
    </motion.button>
  );
}

function CycleRing({
  pct,
  color,
  value,
  isLate,
}: {
  pct: number;
  color: string;
  value: number | null;
  isLate: boolean;
}) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div className="relative grid h-48 w-48 place-items-center">
      <svg viewBox="0 0 150 150" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="75" cy="75" r={radius} fill="none" stroke="rgb(var(--surface))" strokeWidth="14" />
        <motion.circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="text-center">
        <p className="metric-number text-5xl text-[rgb(var(--fg))]">{value === null ? "--" : Math.abs(value)}</p>
        <p className="mt-1 text-sm font-semibold text-[rgb(var(--muted))]">
          {value === null ? "log a cycle" : isLate ? "days late" : value === 0 ? "period today" : "days left"}
        </p>
      </div>
    </div>
  );
}

function PhaseRail({ phase }: { phase: CyclePhase }) {
  const phases: { key: CyclePhase; label: string; icon: LucideIcon }[] = [
    { key: "menstrual", label: "Period", icon: Waves },
    { key: "follicular", label: "Build", icon: Leaf },
    { key: "ovulatory", label: "Peak", icon: Sun },
    { key: "luteal", label: "Care", icon: Moon },
  ];

  return (
    <div className="mt-4 grid grid-cols-4 gap-2">
      {phases.map(({ key, label, icon: Icon }) => {
        const active = key === phase;
        return (
          <div
            key={key}
            className={cn(
              "rounded-2xl border p-2 text-center transition-all",
              active
                ? "border-[rgb(var(--acc-200))] bg-[rgb(var(--acc-50))] shadow-[0_14px_32px_-24px_rgba(215,71,121,0.5)] dark:border-[rgb(var(--acc-400)/0.35)] dark:bg-[rgb(var(--acc-500)/0.12)]"
                : "border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.46)]",
            )}
          >
            <span
              className={cn(
                "mx-auto grid h-8 w-8 place-items-center rounded-full",
                active ? "bg-[rgb(var(--acc-500))] text-white" : "bg-[rgb(var(--surface-2)/0.82)] text-[rgb(var(--muted))] ring-1 ring-[rgb(var(--border)/0.58)] dark:bg-[rgb(var(--surface-2)/0.62)] dark:ring-[rgb(var(--border)/0.58)]",
              )}
            >
              <Icon size={14} />
            </span>
            <p className={cn("mt-1 text-[10px] font-black uppercase tracking-[0.08em]", active ? "text-[rgb(var(--fg))]" : "text-[rgb(var(--muted))]")}>
              {label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function CareCuePanel({
  phase,
  dayOfCycle,
  prediction,
}: {
  phase: CyclePhase;
  dayOfCycle: number;
  prediction: Prediction | null;
}) {
  const cue = careCueFor(phase);

  return (
    <div className="mt-5 overflow-hidden rounded-[24px] border border-[rgb(var(--border)/0.74)] bg-[rgb(var(--surface)/0.52)] p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow-sm">
          <HeartPulse size={19} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Today focus</p>
          <h3 className="mt-1 font-display text-xl font-semibold text-[rgb(var(--fg))]">{cue.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{cue.copy}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {cue.actions.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl bg-[rgb(var(--surface-2)/0.56)] p-3 ring-1 ring-[rgb(var(--border)/0.52)]">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgb(var(--acc-50)/0.78)] text-[rgb(var(--acc-600))] ring-1 ring-[rgb(var(--border)/0.72)] dark:bg-[rgb(var(--acc-500)/0.13)] dark:text-[rgb(var(--acc-200))] dark:ring-[rgb(var(--acc-300)/0.22)]">
              <Icon size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[rgb(var(--fg))]">{label}</p>
              <p className="text-xs leading-5 text-[rgb(var(--muted))]">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {prediction && (
        <div className="mt-4 rounded-2xl bg-gradient-to-r from-[rgb(var(--acc-50)/0.9)] via-[rgb(var(--surface)/0.72)] to-[rgb(var(--surface-2)/0.70)] p-3 text-sm dark:from-[rgb(var(--acc-500)/0.12)] dark:via-[rgb(var(--surface)/0.62)] dark:to-[rgb(var(--surface-2)/0.58)]">
          <span className="font-bold text-[rgb(var(--fg))]">Planning note: </span>
          <span className="text-[rgb(var(--muted))]">
            Day {dayOfCycle}; next expected period is {shortDate(prediction.nextPeriodStart)}.
          </span>
        </div>
      )}
    </div>
  );
}

function careCueFor(phase: CyclePhase): {
  title: string;
  copy: string;
  actions: { icon: LucideIcon; label: string; value: string }[];
} {
  if (phase === "menstrual") {
    return {
      title: "Soothe and restore",
      copy: "Keep the day gentle, track flow changes, and add pain notes when anything feels different.",
      actions: [
        { icon: Droplets, label: "Hydration", value: "Warm fluids and steady water intake" },
        { icon: Moon, label: "Rest", value: "Protect sleep and lower intensity" },
        { icon: PenLine, label: "Track", value: "Log cramps, flow, and medication" },
      ],
    };
  }
  if (phase === "follicular") {
    return {
      title: "Build momentum",
      copy: "Energy often rises here, so this is a good window for planning, movement, and fresh routines.",
      actions: [
        { icon: Leaf, label: "Movement", value: "Try strength, walks, or light cardio" },
        { icon: Utensils, label: "Food", value: "Protein, greens, and iron support" },
        { icon: Sparkles, label: "Plan", value: "Set one small wellness target" },
      ],
    };
  }
  if (phase === "ovulatory") {
    return {
      title: "Peak and notice",
      copy: "Fertility signals can be strongest today. Add cervical, mood, or energy notes if relevant.",
      actions: [
        { icon: Sun, label: "Signal", value: "Watch discharge and body temperature" },
        { icon: Heart, label: "Mood", value: "Log libido, mood, and skin changes" },
        { icon: Droplets, label: "Hydration", value: "Keep fluids steady through the day" },
      ],
    };
  }
  return {
    title: "Slow down gently",
    copy: "The luteal phase benefits from steadier meals, magnesium-rich foods, and calmer evenings.",
    actions: [
      { icon: Moon, label: "Sleep", value: "Wind down earlier when possible" },
      { icon: Utensils, label: "Nutrients", value: "Magnesium, fiber, and balanced snacks" },
      { icon: HeartPulse, label: "Symptoms", value: "Track PMS patterns and tenderness" },
    ],
  };
}

function SelectedDayCard({
  date,
  kind,
  hasLog,
  isPeriodStart,
  onPeriod,
  onRemove,
  inSheet = false,
  compact = false,
}: {
  date: Date;
  kind: DayKind;
  hasLog: boolean;
  isPeriodStart: boolean;
  onPeriod: () => void;
  onRemove: () => void;
  inSheet?: boolean;
  compact?: boolean;
}) {
  const current = kind ? dayVisuals[kind] : null;
  const Icon = current?.icon ?? CalendarDays;
  const advice = selectedDayAdvice(kind, hasLog);

  return (
    <div className={cn(!inSheet && "section-panel calendar-subpanel", compact ? "p-4" : "p-5")}>
      <div className={cn("flex items-start justify-between gap-4", compact ? "mb-3" : "mb-4")}>
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn("grid shrink-0 place-items-center rounded-[18px]", compact ? "h-10 w-10" : "h-12 w-12", current?.marker ?? "bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-[rgb(var(--acc-500)/0.13)] dark:text-[rgb(var(--acc-200))]")}>
            <Icon size={compact ? 18 : 20} strokeWidth={3} className={current?.iconColor} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Selected day</p>
            <h3 className={cn("mt-1 truncate font-display font-semibold text-[rgb(var(--fg))]", compact ? "text-xl" : "text-2xl")}>
              {date.toLocaleDateString("en-US", { weekday: "long" })}
            </h3>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">{formatDate(date)}</p>
          </div>
        </div>
        {kind && <KindBadge kind={kind} />}
      </div>

      <div className={cn("rounded-[22px] border border-[rgb(var(--border))] bg-gradient-to-br from-[rgb(var(--surface-2)/0.86)] via-[rgb(var(--surface)/0.76)] to-[rgb(var(--acc-50)/0.62)] p-4 dark:from-[rgb(var(--surface-2)/0.72)] dark:via-[rgb(var(--surface)/0.62)] dark:to-[rgb(var(--acc-500)/0.10)]", compact ? "mb-3" : "mb-4")}>
        <p className="text-sm font-bold text-[rgb(var(--fg))]">{current ? current.desc : "No cycle signal for this date yet"}</p>
        <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
          {compact
            ? "Choose what happened on this day. Your logs make the next prediction smarter."
            : hasLog
              ? "You have a daily note saved here. Open symptoms to add more context."
              : "Add symptoms, mood, flow, sleep, or water to make future predictions more accurate."}
        </p>
      </div>

      {!compact && (
        <div className="mb-4 grid gap-2">
          {advice.map(({ icon: AdviceIcon, label, value }) => (
            <div key={label} className="flex items-start gap-3 rounded-2xl bg-[rgb(var(--surface)/0.56)] p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgb(var(--acc-50)/0.78)] text-[rgb(var(--acc-600))] ring-1 ring-[rgb(var(--border)/0.7)] dark:bg-[rgb(var(--acc-500)/0.13)] dark:text-[rgb(var(--acc-200))] dark:ring-[rgb(var(--acc-300)/0.22)]">
                <AdviceIcon size={16} />
              </span>
              <div>
                <p className="text-sm font-bold text-[rgb(var(--fg))]">{label}</p>
                <p className="mt-0.5 text-xs leading-5 text-[rgb(var(--muted))]">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {compact ? (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <CompactFact label="State" value={kind ? kindLabel(kind) : "Regular"} />
          <CompactFact label="Log" value={hasLog ? "Saved" : "Empty"} />
          <CompactFact label="Period" value={isPeriodStart ? "Started" : "Not marked"} className="col-span-2" />
        </div>
      ) : (
        <div className="mb-4 grid gap-2">
          <DetailRow label="Cycle state" value={kind ? kindLabel(kind) : "Regular day"} />
          <DetailRow label="Daily log" value={hasLog ? "Saved" : "No symptoms logged"} />
          <DetailRow label="Period start" value={isPeriodStart ? "Marked" : "Not marked"} />
        </div>
      )}

      {compact ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {!isPeriodStart ? (
            <Button onClick={onPeriod}>
              <CalendarPlus size={16} />
              Mark period start
            </Button>
          ) : (
            <Button variant="outline" onClick={onRemove}>
              <Trash2 size={15} />
              Remove period start
            </Button>
          )}
          <Link href="/log">
            <Button variant="soft" className="w-full">
              <PenLine size={15} />
              Log symptoms
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-2">
          <Link href="/log">
            <Button className="w-full">
              <PenLine size={15} />
              Log symptoms
            </Button>
          </Link>
          {!isPeriodStart && (
            <Button variant="soft" onClick={onPeriod}>
              <CalendarPlus size={16} />
              Mark period start
            </Button>
          )}
          {isPeriodStart && (
            <Button variant="outline" onClick={onRemove}>
              <Trash2 size={15} />
              Remove period start
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function selectedDayAdvice(kind: DayKind, hasLog: boolean): { icon: LucideIcon; label: string; value: string }[] {
  if (hasLog) {
    return [
      { icon: CheckCircle2, label: "Log saved", value: "This day already has context for prediction learning." },
      { icon: Sparkles, label: "Refine it", value: "Add sleep, water, or symptom intensity if anything changed." },
    ];
  }
  if (kind === "period") {
    return [
      { icon: Droplets, label: "Flow detail", value: "Log flow level, cramps, medication, and clot notes." },
      { icon: Moon, label: "Comfort", value: "Prioritise rest, heat support, and steady hydration." },
    ];
  }
  if (kind === "predicted-period") {
    return [
      { icon: CalendarCheck2, label: "Prediction check", value: "Confirm if bleeding starts to improve future accuracy." },
      { icon: HeartPulse, label: "Prepare", value: "Add PMS symptoms, cravings, mood, and tenderness." },
    ];
  }
  if (kind === "fertile") {
    return [
      { icon: Leaf, label: "Fertile signal", value: "Track discharge, libido, energy, and temperature cues." },
      { icon: Droplets, label: "Body care", value: "Keep hydration steady and note any ovulation discomfort." },
    ];
  }
  if (kind === "ovulation") {
    return [
      { icon: Sun, label: "Peak day", value: "Ovulation is estimated here; record body cues if relevant." },
      { icon: Heart, label: "Mood note", value: "Log mood, skin, sleep, and any mid-cycle pain." },
    ];
  }
  return [
    { icon: PenLine, label: "Daily pattern", value: "Add one note so the calendar becomes more personal." },
    { icon: Sparkles, label: "Prediction boost", value: "Small daily logs make confidence and timing smarter." },
  ];
}

function KindBadge({ kind }: { kind: DayKind }) {
  if (!kind) return null;
  const tone = kind === "period" || kind === "predicted-period" ? "rose" : kind === "fertile" ? "green" : "amber";
  return <Badge tone={tone}>{kindLabel(kind)}</Badge>;
}

function kindLabel(kind: DayKind) {
  if (kind === "period") return "Period";
  if (kind === "predicted-period") return "Predicted";
  if (kind === "fertile") return "Fertile";
  if (kind === "ovulation") return "Ovulation";
  return "Regular";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[rgb(var(--surface)/0.62)] px-4 py-3 text-sm">
      <span className="text-[rgb(var(--muted))]">{label}</span>
      <span className="text-right font-bold text-[rgb(var(--fg))]">{value}</span>
    </div>
  );
}

function CompactFact({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-[rgb(var(--border)/0.66)] bg-[rgb(var(--surface)/0.5)] px-3 py-2", className)}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-0.5 truncate text-xs font-black text-[rgb(var(--fg))]">{value}</p>
    </div>
  );
}

function Legend({
  icon: Icon,
  label,
  desc,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  desc: string;
  tone: "period" | "predicted" | "fertile" | "ovulation" | "logged";
}) {
  const toneClass = {
    period: "bg-rose-100 ring-1 ring-rose-300/85 shadow-[0_12px_26px_-16px_rgba(244,63,94,0.58)] dark:bg-rose-100 dark:ring-rose-200/85",
    predicted: "bg-pink-100 ring-1 ring-pink-300/85 shadow-[0_12px_26px_-16px_rgba(236,72,153,0.54)] dark:bg-pink-100 dark:ring-pink-200/85",
    fertile: "bg-emerald-100 ring-1 ring-emerald-300/85 shadow-[0_12px_26px_-16px_rgba(16,185,129,0.54)] dark:bg-emerald-100 dark:ring-emerald-200/85",
    ovulation: "bg-amber-100 ring-1 ring-amber-300/85 shadow-[0_12px_26px_-16px_rgba(245,158,11,0.58)] dark:bg-amber-100 dark:ring-amber-200/85",
    logged: "bg-fuchsia-100 ring-1 ring-fuchsia-300/85 shadow-[0_12px_26px_-16px_rgba(217,70,239,0.54)] dark:bg-fuchsia-100 dark:ring-fuchsia-200/85",
  }[tone];
  const iconClass = {
    period: "text-rose-800",
    predicted: "text-pink-800",
    fertile: "text-emerald-800",
    ovulation: "text-amber-900",
    logged: "text-fuchsia-800",
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[rgb(var(--surface)/0.52)] p-3">
      <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", toneClass)}>
        <Icon size={23} strokeWidth={3} className={iconClass} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[rgb(var(--fg))]">{label}</p>
        <p className="text-xs leading-5 text-[rgb(var(--muted))]">{desc}</p>
      </div>
    </div>
  );
}

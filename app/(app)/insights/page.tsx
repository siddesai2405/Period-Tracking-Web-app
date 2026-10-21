"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CalendarDays,
  HeartPulse,
  LineChart,
  PenLine,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/topbar";
import { useUserData } from "@/lib/hooks/useUserData";
import { currentPhase, phaseInfo, predict } from "@/lib/ai/prediction";
import { generateInsights } from "@/lib/ai/insights";
import {
  calculateHealthScore,
  getCycleRegularityMetrics,
  getMoodPhaseAnalysis,
  getPredictionAccuracy,
  getSymptomPhaseCorrelation,
} from "@/lib/ai/analytics";
import type { LogEntry } from "@/lib/store";
import { cn } from "@/lib/utils";

const phaseColors: Record<string, string> = {
  Menstrual: "#f43f5e",
  Follicular: "#10b981",
  Ovulatory: "#f59e0b",
  Luteal: "#8b5cf6",
};

const tooltipStyle = {
  background: "rgb(var(--card))",
  border: "1px solid rgb(var(--border))",
  borderRadius: 16,
  color: "rgb(var(--fg))",
  fontSize: 12,
  boxShadow: "0 18px 50px -28px rgba(64,35,62,0.5)",
};

export default function InsightsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { cycles, profile, logs, pcosProfile } = useUserData();
  const prediction = useMemo(
    () => predict(cycles, profile.avgCycleLength, profile.avgPeriodLength, logs),
    [cycles, profile.avgCycleLength, profile.avgPeriodLength, logs],
  );
  const { phase, dayOfCycle } = useMemo(
    () => currentPhase(new Date(), prediction, cycles),
    [prediction, cycles],
  );
  const phaseText = phaseInfo[phase];

  const logArr = useMemo(
    () => (Object.values(logs) as LogEntry[]).sort((a, b) => a.date.localeCompare(b.date)),
    [logs],
  );
  const insights = useMemo(
    () => generateInsights({ phase, dayOfCycle, prediction, logs: logArr }),
    [phase, dayOfCycle, prediction, logArr],
  );
  const healthScore = useMemo(
    () => calculateHealthScore(cycles, logs, profile, pcosProfile),
    [cycles, logs, profile, pcosProfile],
  );
  const regularity = useMemo(() => getCycleRegularityMetrics(cycles), [cycles]);
  const accuracy = useMemo(() => getPredictionAccuracy(cycles, profile), [cycles, profile]);
  const symptomCorr = useMemo(() => getSymptomPhaseCorrelation(cycles, logs, profile), [cycles, logs, profile]);
  const moodPhase = useMemo(() => getMoodPhaseAnalysis(cycles, logs, profile), [cycles, logs, profile]);

  if (!mounted) return null;

  const radarData = [
    { axis: "Regularity", value: Math.round((healthScore.regularity / 25) * 100) },
    { axis: "Lifestyle", value: Math.round((healthScore.lifestyle / 25) * 100) },
    { axis: "Data", value: Math.round((healthScore.dataCompleteness / 25) * 100) },
    { axis: "Comfort", value: Math.round((healthScore.symptomBurden / 25) * 100) },
  ];

  return (
    <div>
      <Topbar title="Insights" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-6"
      >
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="section-panel relative overflow-hidden p-0">
            <div className="hero-clean-surface relative overflow-hidden p-5 sm:p-6">
              <div className="hero-clean-glow pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-3xl" />
              <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                <div>
                  <Badge tone="rose">
                    <Brain size={13} />
                    Personalized analysis
                  </Badge>
                  <h1 className="mt-3 font-display text-3xl font-semibold tracking-normal text-[rgb(var(--fg))] sm:text-5xl">
                    Insights that explain the pattern.
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">
                    {phaseText.tip} Lotus Phase combines cycle history, logs, and lifestyle signals into readable guidance.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href="/log" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-bold text-white shadow-[0_18px_42px_-24px_var(--acc-glow)] transition hover:-translate-y-0.5">
                      <PenLine size={16} />
                      Add log context
                    </Link>
                    <Link href="/stats" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card)/0.62)] px-5 text-sm font-bold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--card)/0.9)]">
                      Open stats
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>

                <ScoreRing score={healthScore.total} color={healthScore.color} label={healthScore.label} />
              </div>
            </div>
          </div>

          <aside className="section-panel p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
                <ShieldCheck size={19} />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Model confidence</h2>
                <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
                  {prediction ? `${prediction.confidencePct}% ${prediction.confidenceLabel.toLowerCase()} confidence` : "Log one period to begin prediction analysis."}
                </p>
              </div>
            </div>
            <div className="grid gap-3">
              <InsightMetric icon={Target} label="Prediction MAE" value={accuracy ? `${accuracy.mae}d` : "--"} detail={accuracy ? `Grade ${accuracy.grade}` : "Need 3+ cycles"} />
              <InsightMetric icon={TrendingUp} label="Regularity" value={regularity ? `${regularity.cv}%` : "--"} detail={regularity?.label ?? "Need 2+ cycles"} />
              <InsightMetric icon={CalendarDays} label="Cycle day" value={dayOfCycle} detail={`${phaseText.label} phase`} />
            </div>
          </aside>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="section-panel p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">AI guidance</p>
                <h2 className="mt-1 font-display text-xl font-semibold text-[rgb(var(--fg))]">Recommended focus</h2>
              </div>
              <Badge tone="lavender">
                <Sparkles size={13} />
                Live
              </Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {insights.slice(0, 4).map((insight, index) => (
                <div key={insight.id} className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-4">
                  <span className="mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
                    {index === 0 ? <Sparkles size={17} /> : index === 1 ? <HeartPulse size={17} /> : index === 2 ? <Activity size={17} /> : <LineChart size={17} />}
                  </span>
                  <p className="text-sm font-bold text-[rgb(var(--fg))]">{insight.title}</p>
                  <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{insight.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="section-panel p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Score breakdown</h2>
            <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">Four signals create your wellness score.</p>
            <div className="mt-5 h-64">
              <ResponsiveContainer>
                <RadarChart data={radarData} outerRadius="74%">
                  <PolarGrid stroke="rgb(var(--border))" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                  <Radar dataKey="value" stroke="rgb(var(--acc-500))" fill="rgb(var(--acc-400))" fillOpacity={0.26} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, "Score"]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="section-panel p-5 sm:p-6">
            <SectionHeading icon={BarChart3} title="Symptom by phase" description="Occurrence rate for each symptom across cycle phases." />
            {symptomCorr.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-b border-[rgb(var(--border))]">
                      <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Symptom</th>
                      {["Menstrual", "Follicular", "Ovulatory", "Luteal"].map((label) => (
                        <th key={label} className="px-3 py-3 text-center text-xs font-bold" style={{ color: phaseColors[label] }}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {symptomCorr.slice(0, 8).map((row) => (
                      <tr key={row.symptom} className="border-b border-[rgb(var(--border))] last:border-0">
                        <td className="px-3 py-3 font-bold text-[rgb(var(--fg))]">{row.symptom}</td>
                        <HeatCell value={row.menstrual} phase="Menstrual" />
                        <HeatCell value={row.follicular} phase="Follicular" />
                        <HeatCell value={row.ovulatory} phase="Ovulatory" />
                        <HeatCell value={row.luteal} phase="Luteal" />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyPanel icon={PenLine} title="No symptom correlation yet" detail="Log symptoms for a few cycles to unlock phase patterns." />
            )}
          </div>

          <div className="section-panel p-5 sm:p-6">
            <SectionHeading icon={Activity} title="Mood by phase" description="Average mood score from daily logs." />
            <div className="h-[360px]">
              {moodPhase.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={moodPhase} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid stroke="rgb(var(--border))" strokeOpacity={0.55} vertical={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}/5`, "Average mood"]} />
                    <XAxis dataKey="phase" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "rgb(var(--muted))" }} />
                    <YAxis domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "rgb(var(--muted))" }} />
                    <Bar dataKey="avgScore" radius={[12, 12, 4, 4]}>
                      {moodPhase.map((entry) => (
                        <Cell key={entry.phase} fill={phaseColors[entry.phase] ?? "rgb(var(--acc-500))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel icon={Activity} title="No mood chart yet" detail="Add mood in Daily Log to see phase-based patterns." />
              )}
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}

function ScoreRing({ score, color, label }: { score: number; color: string; label: string }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div className="relative mx-auto grid h-52 w-52 place-items-center rounded-full bg-white/62 shadow-[0_24px_62px_-38px_rgba(94,55,88,0.55)] ring-1 ring-white/70 dark:bg-white/[0.06] dark:ring-white/10">
      <svg viewBox="0 0 150 150" className="absolute h-full w-full -rotate-90">
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
      <div className="relative text-center">
        <p className="metric-number text-5xl text-[rgb(var(--fg))]">{score}</p>
        <p className="mt-1 text-sm font-bold text-[rgb(var(--muted))]">{label}</p>
      </div>
    </div>
  );
}

function InsightMetric({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string | number; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">{label}</span>
        <span className="block text-lg font-black text-[rgb(var(--fg))]">{value}</span>
      </span>
      <span className="max-w-[110px] text-right text-xs font-semibold text-[rgb(var(--muted))]">{detail}</span>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
        <Icon size={19} />
      </span>
      <div>
        <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{description}</p>
      </div>
    </div>
  );
}

function HeatCell({ value, phase }: { value: number; phase: string }) {
  const color = phaseColors[phase] ?? "rgb(var(--acc-500))";
  const opacity = value > 0 ? Math.min(0.24 + value / 180, 0.74) : 0;
  return (
    <td className="px-3 py-3 text-center">
      <span
        className={cn("inline-flex min-w-12 justify-center rounded-xl px-2.5 py-1 text-xs font-black", value > 0 ? "text-[rgb(var(--fg))]" : "text-[rgb(var(--muted))]")}
        style={{ background: value > 0 ? `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}` : "transparent" }}
      >
        {value > 0 ? `${value}%` : "--"}
      </span>
    </td>
  );
}

function EmptyPanel({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.44)] p-6 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
        <Icon size={20} />
      </span>
      <p className="font-display text-base font-semibold text-[rgb(var(--fg))]">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-[rgb(var(--muted))]">{detail}</p>
      <Link href="/log" className="mt-4">
        <Button variant="soft">
          <PenLine size={16} />
          Add log
        </Button>
      </Link>
    </div>
  );
}

"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Leaf, Moon, Sun, Apple, Activity, AlertTriangle,
  Sparkles, Play, ExternalLink, Clock, RefreshCw, Wand2,
  Droplets, Brain, Shield,
} from "lucide-react";
import { Topbar } from "@/components/topbar";
import { Markdown } from "@/components/ui/markdown";
import { useUserData } from "@/lib/hooks/useUserData";
import { predict, currentPhase, phaseInfo } from "@/lib/ai/prediction";
import { WELLNESS } from "@/lib/ai/wellness";
import { streamFromAI } from "@/lib/ai/stream";
import { calculateHealthScore } from "@/lib/ai/analytics";
import { calculatePCOSRisk } from "@/lib/ai/pcos";
import { cn } from "@/lib/utils";
import type { CyclePhase } from "@/lib/ai/prediction";

// ─── Phase design tokens ──────────────────────────────────────────────────────
const PHASE_CONFIG: Record<CyclePhase, {
  grad: string; glow: string; ring: string;
  text: string; soft: string; icon: string;
}> = {
  menstrual:  { grad: "from-rose-600 to-pink-500",     glow: "rgba(244,63,94,0.35)",    ring: "#f43f5e", text: "text-rose-400",    soft: "bg-rose-500/10 border-rose-500/20",    icon: "🩸" },
  follicular: { grad: "from-emerald-600 to-teal-500",  glow: "rgba(16,185,129,0.35)",   ring: "#10b981", text: "text-emerald-400", soft: "bg-emerald-500/10 border-emerald-500/20", icon: "🌱" },
  ovulatory:  { grad: "from-amber-500 to-orange-400",  glow: "rgba(251,191,36,0.35)",   ring: "#f59e0b", text: "text-amber-400",   soft: "bg-amber-500/10 border-amber-500/20",  icon: "⚡" },
  luteal:     { grad: "from-violet-600 to-purple-500", glow: "rgba(139,92,246,0.35)",   ring: "#8b5cf6", text: "text-violet-400",  soft: "bg-violet-500/10 border-violet-500/20", icon: "🌙" },
};

function youtubeSearch(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " yoga tutorial")}`;
}

// ─── Energy meter ─────────────────────────────────────────────────────────────
function Meter({ label, value, icon, grad, delay }: {
  label: string; value: number; icon: React.ReactNode; grad: string; delay: number;
}) {
  return (
    <div className="rounded-2xl bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs opacity-70 flex items-center gap-1.5">{icon} {label}</span>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay }}
          className="font-display font-bold text-lg leading-none"
        >
          {value}%
        </motion.span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay }}
          className={cn("h-full rounded-full bg-gradient-to-r", grad)}
        />
      </div>
    </div>
  );
}

// ─── Yoga card with YouTube link ──────────────────────────────────────────────
function YogaCard({ name, duration, benefit, i }: { name: string; duration: string; benefit: string; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
      whileHover={{ y: -2 }}
      className="group rounded-2xl bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] hover:border-emerald-500/30 p-4 transition-all duration-300"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.12)" }}
    >
      <div className="flex items-start gap-3.5">
        {/* Numbered circle */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-display font-bold text-sm">
          {i + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm">{name}</p>
            <span className="flex items-center gap-1 text-[11px] opacity-50 shrink-0">
              <Clock size={10} />{duration}
            </span>
          </div>
          <p className="text-xs opacity-60 leading-relaxed mb-3">{benefit}</p>
          {/* YouTube link */}
          <a
            href={youtubeSearch(name)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 border border-red-500/20 hover:bg-red-500/25 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 hover:text-red-300 transition-all"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500/30">
              <Play size={7} className="ml-0.5" />
            </span>
            Watch Tutorial
            <ExternalLink size={9} className="opacity-70" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Food chip ────────────────────────────────────────────────────────────────
function FoodChip({ emoji, food, why, i }: { emoji: string; food: string; why: string; i: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: i * 0.06 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => setExpanded(!expanded)}
      className="group text-left rounded-2xl bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] hover:border-[rgb(var(--acc-200))] dark:hover:border-white/20 p-4 transition-all duration-300"
    >
      <p className="text-2xl mb-2">{emoji}</p>
      <p className="text-xs font-semibold mb-1">{food}</p>
      <AnimatePresence>
        {expanded ? (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="text-[11px] opacity-60 leading-snug overflow-hidden"
          >
            {why}
          </motion.p>
        ) : (
          <p className="text-[11px] opacity-40 truncate">{why}</p>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── AI Wellness Panel ────────────────────────────────────────────────────────
function AIWellnessPanel({ content, loading, cached, onGenerate }: {
  content: string; loading: boolean; cached: boolean; onGenerate: (force: boolean) => void;
}) {
  return (
    <div
      className="rounded-3xl overflow-hidden border border-[rgb(var(--border)/0.78)] dark:border-white/[0.08]"
      style={{
        background: "linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(139,92,246,0.08) 100%)",
        boxShadow: "0 8px 40px -12px rgba(16,185,129,0.20)",
      }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(var(--border)/0.72)] dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
            <Wand2 size={16} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">AI Wellness Routine</p>
            <p className="text-[11px] opacity-50">{cached ? "Cached · updates daily" : "Personalized for you"}</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onGenerate(true)}
          disabled={loading}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
            loading
              ? "opacity-40 cursor-not-allowed bg-white/5"
              : "bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30",
          )}
        >
          {loading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} className="text-emerald-300" />}
          {loading ? "Generating…" : cached ? "Regenerate" : "Generate Plan"}
        </motion.button>
      </div>
      <div className="px-5 py-5">
        {content ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Markdown text={content} />
          </motion.div>
        ) : loading ? (
          <div className="space-y-3">
            {[85, 65, 90, 50, 70].map((w, i) => (
              <div key={i} className="h-3 rounded-full bg-white/10 animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <div className="flex h-14 w-14 mx-auto mb-3 items-center justify-center rounded-3xl bg-emerald-500/15 border border-emerald-500/20">
              <Leaf size={24} className="text-emerald-400" />
            </div>
            <p className="text-sm font-semibold mb-1">Your personalized wellness plan</p>
            <p className="text-xs opacity-50 mb-4 max-w-xs mx-auto leading-relaxed">
              AI generates a custom yoga sequence, meditation, and self-care routine based on your phase and symptoms.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => onGenerate(false)}
              className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg"
            >
              Generate Routine
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WellnessPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { profile, cycles, logs, pcosProfile } = useUserData();
  const prediction = useMemo(() => predict(cycles, profile.avgCycleLength, profile.avgPeriodLength, logs), [profile, cycles, logs]);
  const { phase, dayOfCycle } = useMemo(() => currentPhase(new Date(), prediction, cycles), [prediction, cycles]);
  const plan = WELLNESS[phase];
  const info = phaseInfo[phase];
  const cfg = PHASE_CONFIG[phase];

  // AI state
  const [aiContent, setAiContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCached, setAiCached] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const todayStr = new Date().toISOString().slice(0, 10);
  const cacheKey = `luna-wellness-${todayStr}`;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const c = localStorage.getItem(cacheKey);
      if (c) { setAiContent(c); setAiCached(true); }
    }
  }, [cacheKey]);

  const generatePlan = useCallback(async (force: boolean) => {
    if (aiLoading) return;
    if (aiCached && !force) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setAiLoading(true); setAiContent(""); setAiCached(false);

    const todayLog = logs[todayStr];
    const recentLogs = Object.values(logs).sort((a,b) => b.date.localeCompare(a.date)).slice(0,14);
    const avgSleep = recentLogs.filter(l => l.sleepHrs != null).reduce((s,l,_,arr) => s + l.sleepHrs!/arr.length, 0) || null;
    const pcosResult = calculatePCOSRisk(pcosProfile.answers);
    const healthData = calculateHealthScore(cycles, logs, profile, pcosProfile);

    await streamFromAI("/api/wellness-plan", {
      context: {
        name: profile.name, phase, dayOfCycle,
        healthGoal: profile.healthGoal, activityLevel: profile.activityLevel,
        medicalConditions: profile.medicalConditions, recentSymptoms: todayLog?.symptoms ?? [],
        recentMood: todayLog?.mood ?? null, avgSleepHrs: avgSleep ? Math.round(avgSleep*10)/10 : null,
        stressLevel: profile.stressLevel, pcosRisk: pcosResult.riskLabel, healthScore: healthData?.total ?? null,
      },
    }, {
      onToken: (t) => setAiContent(p => p + t),
      onDone: (full) => { localStorage.setItem(cacheKey, full); setAiLoading(false); setAiCached(true); },
      onError: () => setAiLoading(false),
      signal: abortRef.current.signal,
    });
  }, [aiLoading, aiCached, phase, dayOfCycle, profile, logs, cycles, pcosProfile, todayStr, cacheKey]);

  if (!mounted) return null;

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="pb-6">
      <Topbar title="Wellness Companion" />

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

        {/* ── Phase Hero ── */}
        <motion.div
          variants={fadeUp}
          className={cn("relative overflow-hidden rounded-3xl p-7 text-white")}
          style={{
            background: `linear-gradient(135deg, ${cfg.ring}cc 0%, ${cfg.ring}66 100%)`,
            boxShadow: `0 16px 60px -20px ${cfg.glow}`,
          }}
        >
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-12 -bottom-12 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80 mb-2">
              <Sparkles size={13} /> Day {dayOfCycle} · {info.label} phase
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">
              {cfg.icon} {plan.title} mode
            </h1>
            <p className="text-sm leading-relaxed opacity-90 max-w-lg">{plan.hero}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2.5 text-xs font-medium">
              <Heart size={13} /> {plan.affirmation}
            </div>
          </div>
        </motion.div>

        {/* ── Energy Meters ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
          <Meter label="Energy" value={plan.energy} icon={<Activity size={13} />} grad={`${cfg.grad}`} delay={0.1} />
          <Meter label="Focus" value={plan.focus} icon={<Sparkles size={13} />} grad="from-violet-400 to-indigo-500" delay={0.2} />
          <Meter label="Social" value={plan.social} icon={<Heart size={13} />} grad="from-pink-400 to-rose-500" delay={0.3} />
        </motion.div>

        {/* ── AI Wellness Plan ── */}
        <motion.div variants={fadeUp}>
          <AIWellnessPanel content={aiContent} loading={aiLoading} cached={aiCached} onGenerate={generatePlan} />
        </motion.div>

        {/* ── Yoga & Movement ── */}
        <motion.div
          variants={fadeUp}
          className="rounded-3xl bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] overflow-hidden"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.14)" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(var(--border)/0.72)] dark:border-white/[0.08]">
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <Leaf size={15} />
              </span>
              Move with your body
            </h3>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold px-2.5 py-1">
              {plan.yoga.length} flows
            </span>
          </div>
          <div className="p-4 space-y-3">
            {plan.yoga.map((y, i) => (
              <YogaCard key={y.name} name={y.name} duration={y.duration} benefit={y.benefit} i={i} />
            ))}
            <div className="rounded-2xl bg-[rgb(var(--card)/0.62)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.68)] dark:border-white/[0.08] px-4 py-3 mt-1">
              <p className="text-xs opacity-60 leading-relaxed">
                <span className="font-semibold opacity-80">Movement tip: </span>
                {plan.movement}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Nutrition ── */}
        <motion.div
          variants={fadeUp}
          className="rounded-3xl bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(var(--border)/0.72)] dark:border-white/[0.08]">
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
                <Apple size={15} />
              </span>
              Eat for this phase
            </h3>
            <span className="rounded-full bg-rose-500/15 border border-rose-500/20 text-rose-400 text-[11px] font-bold px-2.5 py-1">
              {plan.nutrition.length} foods
            </span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {plan.nutrition.map((n, i) => (
              <FoodChip key={n.food} emoji={n.emoji} food={n.food} why={n.why} i={i} />
            ))}
          </div>
        </motion.div>

        {/* ── Sleep & Self-Care ── */}
        <motion.div
          variants={fadeUp}
          className="rounded-3xl bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[rgb(var(--border)/0.72)] dark:border-white/[0.08]">
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                <Moon size={15} />
              </span>
              Rest & self-care
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Moon size={13} className="text-indigo-400" />
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Sleep guidance</p>
              </div>
              <p className="text-sm opacity-85 leading-relaxed">{plan.rest}</p>
            </div>
            <div>
              <p className="text-xs font-bold opacity-50 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sun size={12} /> Self-care rituals
              </p>
              <div className="space-y-2.5">
                {plan.selfcare.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
                    <span className="opacity-80 leading-relaxed">{s}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Avoid ── */}
        <motion.div
          variants={fadeUp}
          className="rounded-3xl bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[rgb(var(--border)/0.72)] dark:border-white/[0.08]">
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <AlertTriangle size={15} />
              </span>
              Be gentle here
            </h3>
          </div>
          <div className="p-4 space-y-2.5">
            {plan.avoid.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 rounded-2xl bg-amber-500/8 border border-amber-500/15 p-4 text-sm"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs">⚠</span>
                <span className="opacity-80 leading-relaxed">{a}</span>
              </motion.div>
            ))}

            {/* Phase whisper */}
            <div
              className="mt-3 rounded-2xl p-5 text-white"
              style={{
                background: `linear-gradient(135deg, ${cfg.ring}99, ${cfg.ring}55)`,
                boxShadow: `0 8px 32px -12px ${cfg.glow}`,
              }}
            >
              <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1.5">
                🌸 Phase whisper
              </p>
              <p className="text-sm leading-relaxed opacity-95">{info.tip}</p>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-[11px] opacity-35 pb-2">
          Wellness guidance is general in nature · Always listen to your body
        </p>
      </motion.div>
    </div>
  );
}

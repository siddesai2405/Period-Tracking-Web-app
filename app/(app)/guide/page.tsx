"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun, Moon, Droplets, Flame, Brain, Heart, Zap,
  Utensils, Dumbbell, Sparkles, BookOpen, CheckCircle2,
  ArrowRight, Star, Clock, RefreshCw, Wand2, Play,
  ChevronDown, ChevronUp, ExternalLink, Leaf,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { Markdown } from "@/components/ui/markdown";
import { useUserData } from "@/lib/hooks/useUserData";
import { predict, currentPhase, phaseInfo } from "@/lib/ai/prediction";
import { WELLNESS } from "@/lib/ai/wellness";
import { dietPhases } from "@/lib/ai/diet";
import { streamFromAI } from "@/lib/ai/stream";
import { calculateHealthScore } from "@/lib/ai/analytics";
import { calculatePCOSRisk } from "@/lib/ai/pcos";
import { cn } from "@/lib/utils";
import type { CyclePhase } from "@/lib/ai/prediction";
import type { DietPreference, HealthGoal } from "@/lib/store";

// ─── Phase tokens ─────────────────────────────────────────────────────────────
const PHASE_GRAD: Record<CyclePhase, string> = {
  menstrual:  "from-rose-600 via-pink-500 to-rose-500",
  follicular: "from-emerald-600 via-teal-500 to-emerald-500",
  ovulatory:  "from-amber-500 via-orange-400 to-amber-400",
  luteal:     "from-violet-600 via-purple-500 to-violet-500",
};
const PHASE_GLOW: Record<CyclePhase, string> = {
  menstrual:  "rgba(244,63,94,0.40)",
  follicular: "rgba(16,185,129,0.40)",
  ovulatory:  "rgba(251,191,36,0.40)",
  luteal:     "rgba(139,92,246,0.40)",
};
const PHASE_ACCENT: Record<CyclePhase, string> = {
  menstrual:  "text-rose-400",
  follicular: "text-emerald-400",
  ovulatory:  "text-amber-400",
  luteal:     "text-violet-400",
};
const PHASE_RING: Record<CyclePhase, string> = {
  menstrual:  "#f43f5e",
  follicular: "#10b981",
  ovulatory:  "#f59e0b",
  luteal:     "#8b5cf6",
};
const PHASE_BG_CARD: Record<CyclePhase, string> = {
  menstrual:  "bg-rose-500/8 border-rose-500/20",
  follicular: "bg-emerald-500/8 border-emerald-500/20",
  ovulatory:  "bg-amber-500/8 border-amber-500/20",
  luteal:     "bg-violet-500/8 border-violet-500/20",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ordinal(n: number) {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", icon: Sun };
  if (h < 17) return { text: "Good afternoon", icon: Zap };
  return { text: "Good evening", icon: Moon };
}

function youtubeSearch(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " yoga tutorial beginners")}`;
}

function adaptMeal(text: string, pref: DietPreference): string {
  if (pref === "nonveg") return text;
  let out = text;
  out = out.replace(/\bsalmon\b/gi,"tofu").replace(/\bchicken\b/gi,"chickpeas")
    .replace(/\bturkey\b/gi,"lentils").replace(/\bbeef\b/gi,"tempeh")
    .replace(/\bsardines\b/gi,"edamame").replace(/\bshrimp\b/gi,"tempeh");
  if (pref === "vegan") {
    out = out.replace(/\bGreek yogurt\b/gi,"coconut yogurt").replace(/\byogurt\b/gi,"soy yogurt")
      .replace(/\beggs?\b/gi,"tofu scramble").replace(/\bkefir\b/gi,"kombucha")
      .replace(/\bdairy\b/gi,"plant-based").replace(/\bcheese\b/gi,"nutritional yeast")
      .replace(/\bmilk\b/gi,"oat milk");
  }
  return out;
}

const GOAL_MORNING: Record<HealthGoal, { title: string; tip: string; icon: string }> = {
  maintain:   { title: "Balance is your anchor", tip: "Start with a 10-min mindful walk, a balanced breakfast, and one clear intention for the day.", icon: "⚖️" },
  weightloss: { title: "Protein first, always", tip: "High-protein breakfast within 30 min of waking stabilises blood sugar and reduces cravings all day.", icon: "📉" },
  weightgain: { title: "Fuel up deliberately", tip: "Eat a calorie-dense breakfast within 20 min of waking. Nuts, full-fat dairy, eggs or avocado toast.", icon: "📈" },
  pcos:       { title: "Keep cortisol low", tip: "Low-GI breakfast + light movement before caffeine helps regulate insulin from the start of the day.", icon: "🔬" },
  fertility:  { title: "Nourish the foundation", tip: "Folate-rich breakfast and staying hydrated supports reproductive health.", icon: "🌸" },
};
const GOAL_EVENING: Record<HealthGoal, string[]> = {
  maintain:   ["Dim lights 1h before bed", "Gratitude journal — 3 wins from today", "Screen-free 30 min before sleep"],
  weightloss: ["Light walk after dinner aids digestion", "Avoid eating 2h before bed", "Track tomorrow's meals tonight"],
  weightgain: ["Casein-rich snack before bed (cottage cheese)", "Stretching to aid recovery", "Plan tomorrow's calorie targets"],
  pcos:       ["Herbal tea (spearmint or chamomile)", "Avoid screens — blue light spikes cortisol", "Journalling reduces next-day stress hormones"],
  fertility:  ["Cool, dark bedroom for hormone regulation", "Legs up the wall for 10 min", "No alcohol — disrupts progesterone"],
};
const HYDRATION: Record<CyclePhase, { goal: string; tip: string }> = {
  menstrual:  { goal: "2.5L", tip: "Warm drinks (ginger, chamomile) soothe cramps. Avoid iced water." },
  follicular: { goal: "2L",   tip: "Fresh lemon water in the morning kick-starts digestion." },
  ovulatory:  { goal: "2.5L", tip: "Stay extra hydrated — supports cervical mucus production." },
  luteal:     { goal: "2.2L", tip: "Herbal teas (peppermint, chamomile) ease bloating." },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckItem({ text, done, onToggle }: { text: string; done: boolean; onToggle: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onToggle}
      className="flex items-center gap-3 w-full text-left py-2.5 group"
    >
      <motion.span
        animate={done ? { scale: [1, 1.2, 1] } : {}}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
          done ? "border-emerald-400 bg-emerald-400/20 text-emerald-400" : "border-white/20 group-hover:border-white/40",
        )}
      >
        {done && <CheckCircle2 size={14} />}
      </motion.span>
      <span className={cn("text-sm leading-snug transition-all", done ? "line-through opacity-40" : "opacity-90")}>{text}</span>
    </motion.button>
  );
}

function SectionCard({
  icon: Icon, title, badge, children, defaultOpen = false, accent = "text-white",
}: {
  icon: LucideIcon; title: string; badge?: string; children: React.ReactNode; defaultOpen?: boolean; accent?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] backdrop-blur-sm"
      style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.15)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] transition-colors text-left"
      >
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08]", accent)}>
          <Icon size={17} />
        </span>
        <span className="font-semibold text-sm flex-1">{title}</span>
        {badge && (
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/60 mr-1">{badge}</span>
        )}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} className="opacity-40" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Animated stat bar ────────────────────────────────────────────────────────
function StatBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs opacity-70">{label}</span>
        <span className="text-xs font-bold">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut", delay }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}

// ─── Cycle ring SVG ───────────────────────────────────────────────────────────
function CycleRing({ dayOfCycle, totalDays, color }: { dayOfCycle: number; totalDays: number; color: string }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const progress = Math.min(dayOfCycle / totalDays, 1);
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
      <circle cx="55" cy="55" r={r} strokeWidth="6" stroke="rgba(255,255,255,0.10)" fill="none" />
      <motion.circle
        cx="55" cy="55" r={r}
        strokeWidth="6"
        stroke={color}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - progress * circ }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
        style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
      />
    </svg>
  );
}

// ─── Meal card ────────────────────────────────────────────────────────────────
const MEAL_COLORS = {
  Breakfast: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", emoji: "☀️" },
  Lunch:     { bg: "bg-sky-500/10 border-sky-500/20",     text: "text-sky-400",   emoji: "🌤️" },
  Dinner:    { bg: "bg-violet-500/10 border-violet-500/20", text: "text-violet-400", emoji: "🌙" },
};

function MealCard({ label, value, i }: { label: string; value: string; i: number }) {
  const c = MEAL_COLORS[label as keyof typeof MEAL_COLORS] ?? MEAL_COLORS.Breakfast;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08 }}
      className={cn("rounded-2xl border p-4", c.bg)}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{c.emoji}</span>
        <p className={cn("text-xs font-bold uppercase tracking-wide", c.text)}>{label}</p>
      </div>
      <p className="text-sm leading-relaxed opacity-85">{value}</p>
    </motion.div>
  );
}

// ─── Exercise card with YouTube link ─────────────────────────────────────────
function ExerciseCard({ name, duration, benefit, i }: { name: string; duration: string; benefit: string; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.07 }}
      className="group rounded-2xl bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.78)] dark:border-white/[0.08] p-4 hover:border-[rgb(var(--acc-200))] dark:hover:border-white/20 transition-all duration-300"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 font-bold text-sm font-display">
          {i + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold">{name}</p>
            <span className="text-xs opacity-50 flex items-center gap-1"><Clock size={10} />{duration}</span>
          </div>
          <p className="text-xs opacity-60 leading-relaxed">{benefit}</p>
          <a
            href={youtubeSearch(name)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors group-hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500/20">
              <Play size={8} className="ml-0.5" />
            </span>
            Watch on YouTube
            <ExternalLink size={9} className="opacity-60" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Hydration bar ────────────────────────────────────────────────────────────
function HydrationBar({ current, goal }: { current: number; goal: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: goal }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className={cn(
            "h-9 flex-1 rounded-xl transition-all",
            i < current
              ? "bg-gradient-to-t from-sky-500 to-sky-400 shadow-[0_4px_14px_-4px_rgba(56,189,248,0.5)]"
              : "bg-[rgb(var(--card)/0.78)] dark:bg-white/[0.07]",
          )}
          style={{ transformOrigin: "bottom" }}
        />
      ))}
    </div>
  );
}

// ─── AI Guide Panel ───────────────────────────────────────────────────────────
function AIGuidePanel({
  content, loading, cached, onGenerate,
}: {
  content: string; loading: boolean; cached: boolean; onGenerate: (force: boolean) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl overflow-hidden border border-[rgb(var(--border)/0.78)] dark:border-white/[0.08]"
      style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(236,28,108,0.08) 100%)",
        boxShadow: "0 8px 40px -12px rgba(139,92,246,0.25), 0 2px 0 rgba(255,255,255,0.04) inset",
      }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(var(--border)/0.72)] dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 shadow-lg">
            <Wand2 size={16} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">AI Personalized Guide</p>
            <p className="text-[11px] opacity-50">
              {cached ? "Cached · updates daily" : "Powered by Luna AI"}
            </p>
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
              : "bg-gradient-to-br from-violet-500/30 to-pink-500/30 border border-violet-500/30 hover:border-violet-400/50 hover:from-violet-500/40 hover:to-pink-500/40",
          )}
        >
          {loading
            ? <RefreshCw size={12} className="animate-spin" />
            : <Sparkles size={12} className="text-violet-300" />
          }
          {loading ? "Generating…" : cached ? "Regenerate" : "Generate My Guide"}
        </motion.button>
      </div>

      {/* Content area */}
      <div className="px-5 py-5">
        {content ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <Markdown text={content} />
          </motion.div>
        ) : loading ? (
          <div className="space-y-3 py-2">
            {[90, 70, 85, 55, 75, 60].map((w, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                className="h-3 rounded-full bg-white/10"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="flex h-16 w-16 mx-auto mb-4 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/20">
              <Sparkles size={28} className="text-violet-400" />
            </div>
            <p className="font-semibold text-sm mb-1">Personalized for you</p>
            <p className="text-xs opacity-50 mb-5 max-w-xs mx-auto leading-relaxed">
              Luna AI generates a custom guide using your cycle phase, symptoms, diet preferences, and health goals.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onGenerate(false)}
              className="rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:opacity-90 transition-opacity"
            >
              Generate Now
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function GuidePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { cycles, profile, logs, pcosProfile } = useUserData();
  const prediction = useMemo(() => predict(cycles, profile.avgCycleLength, profile.avgPeriodLength, logs), [cycles, profile, logs]);
  const { phase, dayOfCycle } = useMemo(() => currentPhase(new Date(), prediction, cycles), [prediction, cycles]);

  const wellness = WELLNESS[phase];
  const dietPhase = dietPhases.find((d) => d.phase === phase)!;
  const info = phaseInfo[phase];
  const goalMorning = GOAL_MORNING[profile.healthGoal ?? "maintain"];
  const goalEvening = GOAL_EVENING[profile.healthGoal ?? "maintain"];
  const hydration = HYDRATION[phase];
  const greeting = getGreeting();
  const GreetIcon = greeting.icon;

  const pref = profile.dietPreference ?? "nonveg";
  const meals = {
    breakfast: adaptMeal(dietPhase.sampleMealPlan.breakfast, pref),
    lunch:     adaptMeal(dietPhase.sampleMealPlan.lunch, pref),
    dinner:    adaptMeal(dietPhase.sampleMealPlan.dinner, pref),
    snacks:    dietPhase.sampleMealPlan.snacks.map((s) => adaptMeal(s, pref)).slice(0, 3),
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLog = logs[todayStr];
  const waterCups = todayLog?.waterCups ?? 0;

  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setChecks((p) => ({ ...p, [key]: !p[key] }));

  const morningTasks = [
    "Drink a full glass of water immediately after waking",
    goalMorning.tip.split(".")[0],
    wellness.yoga[0] ? `${wellness.yoga[0].name} — ${wellness.yoga[0].duration}` : "5-min gentle full-body stretch",
    "Set 1 clear intention for today",
  ];
  const eveningTasks = [
    ...goalEvening,
    wellness.selfcare[0] ?? "5 min journalling before sleep",
  ];

  // ── AI Guide state ──────────────────────────────────────────────────────────
  const [aiContent, setAiContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCached, setAiCached] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const cacheKey = `luna-guide-${todayStr}`;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setAiContent(cached); setAiCached(true); }
    }
  }, [cacheKey]);

  const generateGuide = useCallback(async (force: boolean) => {
    if (aiLoading) return;
    if (aiCached && !force) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setAiLoading(true);
    setAiContent("");
    setAiCached(false);

    const recentLogs = (Object.values(logs) as import("@/lib/store").LogEntry[]).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
    const avgSleep = recentLogs.filter((l) => l.sleepHrs != null).reduce((s, l, _, arr) => s + l.sleepHrs! / arr.length, 0) || null;
    const avgWater = recentLogs.filter((l) => l.waterCups != null).reduce((s, l, _, arr) => s + l.waterCups! / arr.length, 0) || null;
    const pcosResult = calculatePCOSRisk(pcosProfile.answers);
    const healthData = calculateHealthScore(cycles, logs, profile, pcosProfile);

    await streamFromAI(
      "/api/guide",
      {
        context: {
          name: profile.name, phase, dayOfCycle,
          dietPreference: profile.dietPreference, healthGoal: profile.healthGoal,
          recentSymptoms: todayLog?.symptoms ?? [], recentMood: todayLog?.mood ?? null,
          avgSleepHrs: avgSleep ? Math.round(avgSleep * 10) / 10 : null,
          avgWaterCups: avgWater ? Math.round(avgWater * 10) / 10 : null,
          pcosRisk: pcosResult.riskLabel, healthScore: healthData?.total ?? null,
          height: profile.height, weight: profile.weight,
          activityLevel: profile.activityLevel, medicalConditions: profile.medicalConditions,
          foodAllergies: profile.foodAllergies, stressLevel: profile.stressLevel,
          nextPeriodStart: prediction?.nextPeriodStart,
        },
      },
      {
        onToken: (t) => setAiContent((prev) => prev + t),
        onDone: (full) => { localStorage.setItem(cacheKey, full); setAiLoading(false); setAiCached(true); },
        onError: () => setAiLoading(false),
        signal: abortRef.current.signal,
      },
    );
  }, [aiLoading, aiCached, phase, dayOfCycle, profile, logs, cycles, pcosProfile, todayLog, cacheKey, prediction]);

  if (!mounted) return null;

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="pb-6">
      <Topbar title="Daily Guide" />

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

        {/* ── AI Personalized Guide ── */}
        <motion.div variants={fadeUp}>
          <AIGuidePanel
            content={aiContent}
            loading={aiLoading}
            cached={aiCached}
            onGenerate={generateGuide}
          />
        </motion.div>

        {/* ── Phase Hero Card ── */}
        <motion.div
          variants={fadeUp}
          className={cn("relative overflow-hidden rounded-3xl border p-6", PHASE_BG_CARD[phase])}
          style={{ boxShadow: `0 12px 48px -16px ${PHASE_GLOW[phase]}` }}
        >
          {/* Glow orb */}
          <div
            className="absolute -right-8 -top-8 h-48 w-48 rounded-full blur-3xl opacity-30"
            style={{ background: PHASE_RING[phase] }}
          />
          <div className="relative flex items-center gap-5">
            {/* Cycle ring */}
            <div className="relative shrink-0">
              <CycleRing
                dayOfCycle={dayOfCycle}
                totalDays={profile.avgCycleLength || 28}
                color={PHASE_RING[phase]}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold font-display leading-none">{dayOfCycle}</span>
                <span className="text-[10px] opacity-50 mt-0.5">of {profile.avgCycleLength || 28}</span>
              </div>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <GreetIcon size={14} className={PHASE_ACCENT[phase]} />
                <p className={cn("text-xs font-medium", PHASE_ACCENT[phase])}>{greeting.text}, {profile.name || "friend"}</p>
              </div>
              <h2 className="font-display text-2xl font-bold leading-tight mb-1">
                <span className="mr-2">{info.emoji}</span>{info.label}
              </h2>
              <p className={cn("text-xs font-bold uppercase tracking-widest mb-3", PHASE_ACCENT[phase])}>
                {ordinal(dayOfCycle)} day
              </p>
              <div className="flex items-start gap-2 rounded-2xl bg-white/10 px-3 py-2.5">
                <Star size={12} className={cn("shrink-0 mt-0.5", PHASE_ACCENT[phase])} />
                <p className="text-xs leading-relaxed opacity-90 italic">&ldquo;{wellness.affirmation}&rdquo;</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Energy Forecast ── */}
        <motion.div
          variants={fadeUp}
          className="rounded-3xl bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] px-5 py-5"
          style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.12)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Zap size={15} />
            </div>
            <p className="font-semibold text-sm">Today's energy forecast</p>
          </div>
          <div className="space-y-3">
            <StatBar label="Energy" value={wellness.energy} color={`bg-gradient-to-r ${PHASE_GRAD[phase]}`} delay={0.1} />
            <StatBar label="Focus" value={wellness.focus} color="bg-gradient-to-r from-blue-400 to-cyan-400" delay={0.2} />
            <StatBar label="Social battery" value={wellness.social} color="bg-gradient-to-r from-violet-400 to-pink-400" delay={0.3} />
          </div>
        </motion.div>

        {/* ── Morning Routine ── */}
        <motion.div variants={fadeUp}>
          <SectionCard icon={Sun} title="Morning Routine" defaultOpen={true} accent="text-amber-400" badge="tap to check off">
            <div className="divide-y divide-white/[0.05]">
              {morningTasks.map((task, i) => (
                <CheckItem key={i} text={task} done={!!checks[`m-${i}`]} onToggle={() => toggle(`m-${i}`)} />
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex items-start gap-3">
              <span className="text-xl shrink-0">{goalMorning.icon}</span>
              <div>
                <p className="text-xs font-bold text-amber-400 mb-1">{goalMorning.title}</p>
                <p className="text-xs opacity-75 leading-relaxed">{goalMorning.tip}</p>
              </div>
            </div>
          </SectionCard>
        </motion.div>

        {/* ── Today's Meals ── */}
        <motion.div variants={fadeUp}>
          <SectionCard icon={Utensils} title="Today's Meal Plan" defaultOpen={true} accent="text-emerald-400">
            <div className="space-y-3 mt-1">
              {[
                { label: "Breakfast", value: meals.breakfast },
                { label: "Lunch",     value: meals.lunch },
                { label: "Dinner",    value: meals.dinner },
              ].map((m, i) => <MealCard key={m.label} label={m.label} value={m.value} i={i} />)}
              {meals.snacks.length > 0 && (
                <div className="rounded-2xl bg-emerald-500/8 border border-emerald-500/15 p-4">
                  <p className="text-xs font-bold text-emerald-400 mb-2">🍎 Snacks</p>
                  <div className="space-y-1.5">
                    {meals.snacks.map((s, i) => (
                      <p key={i} className="text-sm opacity-80 flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                        {s}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 rounded-2xl bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] px-4 py-3 border border-[rgb(var(--border)/0.72)] dark:border-white/[0.08]">
              <p className="text-xs opacity-60 leading-relaxed">
                <span className="font-semibold text-emerald-400 opacity-100">Phase tip: </span>
                {dietPhase.tagline} — {dietPhase.description.split(".")[0]}.
              </p>
            </div>
          </SectionCard>
        </motion.div>

        {/* ── Hydration ── */}
        <motion.div
          variants={fadeUp}
          className="rounded-3xl bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] px-5 py-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                <Droplets size={15} />
              </div>
              <p className="font-semibold text-sm">Hydration</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-display text-sky-400">{waterCups}</span>
              <span className="text-sm opacity-50">/ 8 cups</span>
            </div>
          </div>
          <HydrationBar current={waterCups} goal={8} />
          <p className="mt-3 text-xs opacity-60 leading-relaxed">
            <span className="font-semibold text-sky-400 opacity-100">Goal: {hydration.goal}/day · </span>
            {hydration.tip}
          </p>
        </motion.div>

        {/* ── Movement & Yoga (with YouTube links) ── */}
        <motion.div variants={fadeUp}>
          <SectionCard icon={Dumbbell} title="Movement & Yoga" accent="text-rose-400">
            <p className="text-xs opacity-60 leading-relaxed mb-4 mt-1">{wellness.movement}</p>
            <div className="space-y-3">
              {wellness.yoga.map((y, i) => (
                <ExerciseCard key={y.name} name={y.name} duration={y.duration} benefit={y.benefit} i={i} />
              ))}
            </div>
          </SectionCard>
        </motion.div>

        {/* ── Key Nutrients ── */}
        <motion.div variants={fadeUp}>
          <SectionCard icon={Brain} title="Key Nutrients Today" accent="text-violet-400">
            <div className="grid grid-cols-2 gap-2.5 mt-1">
              {wellness.nutrition.map((n, i) => (
                <motion.div
                  key={n.food}
                  initial={{ opacity: 0, scale: 0.93 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] p-3.5"
                >
                  <p className="text-2xl mb-1.5">{n.emoji}</p>
                  <p className="text-xs font-bold mb-0.5">{n.food}</p>
                  <p className="text-[11px] opacity-55 leading-snug">{n.why}</p>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </motion.div>

        {/* ── Evening Wind-Down ── */}
        <motion.div variants={fadeUp}>
          <SectionCard icon={Moon} title="Evening Wind-Down" accent="text-indigo-400" badge="tap to check off">
            <div className="divide-y divide-white/[0.05] mt-1">
              {eveningTasks.map((task, i) => (
                <CheckItem key={i} text={task} done={!!checks[`e-${i}`]} onToggle={() => toggle(`e-${i}`)} />
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-3">
              <p className="text-xs">
                <span className="font-semibold text-indigo-400">Sleep tonight: </span>
                <span className="opacity-75">{wellness.rest}</span>
              </p>
            </div>
          </SectionCard>
        </motion.div>

        {/* ── Avoid Today ── */}
        <motion.div variants={fadeUp}>
          <SectionCard icon={Flame} title="Avoid Today" accent="text-red-400">
            <div className="space-y-2 mt-1">
              {[...wellness.avoid, ...dietPhase.limit.slice(0, 2)].map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl bg-red-500/8 border border-red-500/15 px-4 py-3 text-sm">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-[10px] font-bold">✕</span>
                  <span className="opacity-80">{item}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>

        {/* ── Self-Care ── */}
        <motion.div variants={fadeUp}>
          <SectionCard icon={Heart} title="Self-Care Nudges" accent="text-pink-400">
            <div className="space-y-2.5 mt-1">
              {wellness.selfcare.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-3 rounded-2xl bg-pink-500/8 border border-pink-500/15 p-3.5"
                >
                  <Sparkles size={14} className="text-pink-400 shrink-0" />
                  <p className="text-sm opacity-85">{item}</p>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </motion.div>

        {/* ── Luna's note footer ── */}
        <motion.div
          variants={fadeUp}
          className="rounded-3xl bg-[rgb(var(--card)/0.62)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.72)] dark:border-white/[0.08] p-5 flex items-start gap-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/20">
            <BookOpen size={16} className={PHASE_ACCENT[phase]} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold mb-1">Luna's note</p>
            <p className="text-xs opacity-60 leading-relaxed">{info.tip}</p>
          </div>
          <a
            href="/chat"
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-white/[0.07] hover:bg-[rgb(var(--card)/0.96)] dark:hover:bg-white/[0.12] border border-white/10 px-3 py-2 text-xs font-semibold transition-all"
          >
            Ask Luna <ArrowRight size={12} />
          </a>
        </motion.div>

        <p className="text-center text-[11px] opacity-35 pb-2">
          Guide updates daily · All advice is general wellness guidance only
        </p>
      </motion.div>
    </div>
  );
}

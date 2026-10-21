"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Droplets, ArrowRight, Check, X,
  Wand2, RefreshCw, Sparkles, Play, ExternalLink,
  Clock, Flame, Leaf,
} from "lucide-react";
import { Topbar } from "@/components/topbar";
import { Markdown } from "@/components/ui/markdown";
import { useUserData } from "@/lib/hooks/useUserData";
import type { DietPreference, HealthGoal } from "@/lib/store";
import { predict, currentPhase } from "@/lib/ai/prediction";
import { dietPhases, type DietPhase, type DietPhaseData } from "@/lib/ai/diet";
import { streamFromAI } from "@/lib/ai/stream";
import { calculateHealthScore } from "@/lib/ai/analytics";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Phase visual tokens ──────────────────────────────────────────────────────
const PHASE_GRAD: Record<DietPhase, string> = {
  menstrual:  "from-rose-600 via-pink-500 to-rose-500",
  follicular: "from-emerald-600 via-teal-500 to-emerald-500",
  ovulatory:  "from-amber-500 via-orange-400 to-amber-400",
  luteal:     "from-violet-600 via-purple-500 to-violet-500",
};
const PHASE_GLOW: Record<DietPhase, string> = {
  menstrual:  "rgba(244,63,94,0.40)",
  follicular: "rgba(16,185,129,0.40)",
  ovulatory:  "rgba(251,191,36,0.40)",
  luteal:     "rgba(139,92,246,0.40)",
};
const PHASE_TEXT: Record<DietPhase, string> = {
  menstrual: "text-rose-400", follicular: "text-emerald-400",
  ovulatory: "text-amber-400", luteal: "text-violet-400",
};
const PHASE_RING_COLOR: Record<DietPhase, string> = {
  menstrual: "#f43f5e", follicular: "#10b981", ovulatory: "#f59e0b", luteal: "#8b5cf6",
};

// ─── Diet helpers ─────────────────────────────────────────────────────────────
const GLUTEN_KW = ["wheat","bread","sourdough","roll","pasta","barley","rye","oat","oats","oatmeal","wrap","couscous"];
const MEAT_KW = ["chicken","beef","turkey","pork","lamb","mutton","meat","red meat"];
const FISH_KW = ["salmon","sardines","fish","oysters","seafood","tuna"];
const DAIRY_KW = ["dairy","milk","cheese","yogurt","yoghurt","kefir","butter","ghee","cream"];
const EGG_KW = ["egg","eggs"];

function containsAny(t: string, kw: string[]) { return kw.some(k => t.toLowerCase().includes(k)); }
function isAllowed(text: string, pref: DietPreference) {
  if (pref === "nonveg") return true;
  if (pref === "veg")  return !containsAny(text, [...MEAT_KW, ...FISH_KW]);
  if (pref === "vegan") return !containsAny(text, [...MEAT_KW, ...FISH_KW, ...DAIRY_KW, ...EGG_KW]);
  if (pref === "glutenfree") return !containsAny(text, GLUTEN_KW);
  return true;
}
function adaptText(text: string, pref: DietPreference) {
  if (pref === "nonveg") return text;
  let o = text.replace(/\bsalmon\b/gi,"tofu").replace(/\bchicken\b/gi,"chickpeas")
    .replace(/\bturkey\b/gi,"lentils").replace(/\bbeef\b/gi,"tempeh").replace(/\bsardines\b/gi,"edamame");
  if (pref === "vegan") {
    o = o.replace(/\bGreek yogurt\b/gi,"coconut yogurt").replace(/\byogurt\b/gi,"soy yogurt")
      .replace(/\beggs?\b/gi,"tofu scramble").replace(/\bkefir\b/gi,"kombucha")
      .replace(/\bdairy\b/gi,"plant-based").replace(/\bcheese\b/gi,"nutritional yeast").replace(/\bmilk\b/gi,"oat milk");
  }
  return o;
}
function youtubeRecipe(name: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " healthy recipe")}`;
}

// ─── Goal tips ────────────────────────────────────────────────────────────────
const GOAL_TIPS: Record<HealthGoal, { label: string; emoji: string; tip: string }> = {
  maintain:   { label: "Maintaining Weight",   emoji: "⚖️", tip: "Balanced macros and consistent meal timing support cycle health and a stable weight." },
  weightloss: { label: "Weight Loss",          emoji: "📉", tip: "Prioritise protein and fibre. Avoid skipping meals — it raises cortisol and disrupts your cycle." },
  weightgain: { label: "Gaining Weight",       emoji: "📈", tip: "Calorie-dense, nutrient-rich foods: nuts, avocado, legumes, whole grains. Eat more frequently." },
  pcos:       { label: "Managing PCOS",        emoji: "🔬", tip: "Low-GI carbs, anti-inflammatory foods and high protein help regulate insulin and hormones." },
  fertility:  { label: "Supporting Fertility", emoji: "🌸", tip: "Folate, zinc and antioxidants are key. Maintain a healthy weight, minimise alcohol." },
};
const DIET_LABELS: Record<DietPreference, { label: string; emoji: string }> = {
  nonveg: { label: "Non-Veg", emoji: "🍗" }, veg: { label: "Vegetarian", emoji: "🥦" },
  vegan:  { label: "Vegan",   emoji: "🌱" }, glutenfree: { label: "Gluten-Free", emoji: "🌾" },
};

// ─── Accordion ────────────────────────────────────────────────────────────────
function Accordion({ id, title, emoji, expanded, onToggle, count, children }: {
  id: string; title: string; emoji: string; expanded: boolean;
  onToggle: (id: string | null) => void; count?: number; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] bg-[rgb(var(--card)/0.62)] dark:bg-white/[0.07]">
      <button
        onClick={() => onToggle(expanded ? null : id)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] transition-colors text-left"
      >
        <span className="text-xl shrink-0">{emoji}</span>
        <span className="flex-1 font-semibold text-sm">{title}</span>
        {count !== undefined && (
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs opacity-60 mr-1">{count}</span>
        )}
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} className="opacity-40 shrink-0" />
        </motion.span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Meal card ────────────────────────────────────────────────────────────────
const MEAL_STYLE = {
  Breakfast: { border: "border-amber-500/20 bg-amber-500/8", label: "text-amber-400", emoji: "☀️" },
  Lunch:     { border: "border-sky-500/20 bg-sky-500/8",     label: "text-sky-400",   emoji: "🌤️" },
  Dinner:    { border: "border-violet-500/20 bg-violet-500/8",label: "text-violet-400",emoji: "🌙" },
};
function MealCard({ label, value, i }: { label: string; value: string; i: number }) {
  const s = MEAL_STYLE[label as keyof typeof MEAL_STYLE] ?? MEAL_STYLE.Breakfast;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
      className={cn("rounded-2xl border p-4", s.border)}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{s.emoji}</span>
        <p className={cn("text-[11px] font-bold uppercase tracking-wider", s.label)}>{label}</p>
      </div>
      <p className="text-sm opacity-85 leading-relaxed">{value}</p>
    </motion.div>
  );
}

// ─── Recipe card with YouTube link ───────────────────────────────────────────
function RecipeCard({ name, emoji, time, description, nutrients, i }: {
  name: string; emoji: string; time: string; description: string; nutrients: string; i: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
      whileHover={{ y: -2 }}
      className="group rounded-2xl bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] hover:border-[rgb(var(--acc-200))] dark:hover:border-white/20 p-4 transition-all duration-300"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1 text-[11px] opacity-50"><Clock size={10} />{time}</span>
          </div>
        </div>
      </div>
      <p className="text-xs opacity-70 leading-relaxed mb-3">{description}</p>
      <p className="text-[11px] opacity-50 mb-3">
        <span className="font-medium opacity-80">Nutrients: </span>{nutrients}
      </p>
      <a
        href={youtubeRecipe(name)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 border border-red-500/20 hover:bg-red-500/25 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 hover:text-red-300 transition-all"
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500/25">
          <Play size={7} className="ml-0.5" />
        </span>
        Watch Recipe
        <ExternalLink size={9} className="opacity-70" />
      </a>
    </motion.div>
  );
}

// ─── AI Meal Plan Panel ───────────────────────────────────────────────────────
function AIMealPanel({ content, loading, cached, onGenerate }: {
  content: string; loading: boolean; cached: boolean; onGenerate: (force: boolean) => void;
}) {
  return (
    <div
      className="rounded-3xl overflow-hidden border border-[rgb(var(--border)/0.78)] dark:border-white/[0.08] mb-4"
      style={{
        background: "linear-gradient(135deg, rgba(251,191,36,0.10) 0%, rgba(249,115,22,0.08) 100%)",
        boxShadow: "0 8px 40px -12px rgba(251,191,36,0.20)",
      }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(var(--border)/0.72)] dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
            <Wand2 size={16} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">AI 3-Day Meal Plan</p>
            <p className="text-[11px] opacity-50">{cached ? "Cached · updates daily" : "Personalized by Luna AI"}</p>
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
              : "bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30",
          )}
        >
          {loading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} className="text-amber-300" />}
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
            {[90, 65, 80, 55, 75, 60, 85].map((w, i) => (
              <div key={i} className="h-3 rounded-full bg-white/10 animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <div className="flex h-14 w-14 mx-auto mb-3 items-center justify-center rounded-3xl bg-amber-500/15 border border-amber-500/20">
              <Leaf size={24} className="text-amber-400" />
            </div>
            <p className="text-sm font-semibold mb-1">Your personalized 3-day meal plan</p>
            <p className="text-xs opacity-50 mb-4 max-w-xs mx-auto leading-relaxed">
              AI generates a custom plan with breakfast, lunch, dinner & snacks tailored to your phase, diet, and health goal.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => onGenerate(false)}
              className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg"
            >
              Generate My Plan
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DietPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { cycles, profile, logs, pcosProfile } = useUserData();
  const dietPref = profile.dietPreference ?? "nonveg";
  const healthGoal = profile.healthGoal ?? "maintain";

  const prediction = useMemo(() => predict(cycles, profile.avgCycleLength, profile.avgPeriodLength, logs), [cycles, profile.avgCycleLength, profile.avgPeriodLength, logs]);
  const { phase } = useMemo(() => currentPhase(new Date(), prediction, cycles), [prediction, cycles]);

  const [activePhase, setActivePhase] = useState<DietPhase>(phase);
  const [expanded, setExpanded] = useState<string | null>("meal");

  // AI state
  const [aiContent, setAiContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCached, setAiCached] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const todayStr = new Date().toISOString().slice(0, 10);
  const cacheKey = `luna-diet-${todayStr}`;

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
    const healthData = calculateHealthScore(cycles, logs, profile, pcosProfile);

    await streamFromAI("/api/diet-plan", {
      context: {
        name: profile.name, phase, dietPreference: profile.dietPreference,
        healthGoal: profile.healthGoal, foodAllergies: profile.foodAllergies,
        medicalConditions: profile.medicalConditions, weight: profile.weight,
        height: profile.height, activityLevel: profile.activityLevel,
        recentSymptoms: todayLog?.symptoms ?? [], avgSleepHrs: avgSleep ? Math.round(avgSleep*10)/10 : null,
        stressLevel: profile.stressLevel,
      },
    }, {
      onToken: (t) => setAiContent(p => p + t),
      onDone: (full) => { localStorage.setItem(cacheKey, full); setAiLoading(false); setAiCached(true); },
      onError: () => setAiLoading(false),
      signal: abortRef.current.signal,
    });
  }, [aiLoading, aiCached, phase, profile, logs, cycles, pcosProfile, todayStr, cacheKey]);

  if (!mounted) return null;

  const rawData = dietPhases.find(d => d.phase === activePhase)!;
  const goalTip = GOAL_TIPS[healthGoal];
  const dietLabel = DIET_LABELS[dietPref];

  const data: DietPhaseData = {
    ...rawData,
    eat: rawData.eat.filter(item => isAllowed(item, dietPref)),
    limit: rawData.limit,
    recipes: rawData.recipes.filter(r => isAllowed(r.description, dietPref)).map(r => ({ ...r, description: adaptText(r.description, dietPref) })),
    sampleMealPlan: {
      breakfast: adaptText(rawData.sampleMealPlan.breakfast, dietPref),
      lunch:     adaptText(rawData.sampleMealPlan.lunch, dietPref),
      dinner:    adaptText(rawData.sampleMealPlan.dinner, dietPref),
      snacks:    rawData.sampleMealPlan.snacks.filter(s => isAllowed(s, dietPref)).map(s => adaptText(s, dietPref)),
    },
  };

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="pb-6">
      <Topbar title="Diet Guide" />

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

        {/* ── Phase selector ── */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider opacity-50">Cycle phase</p>
            <p className="text-xs opacity-60">
              Current: <span className={cn("font-bold", PHASE_TEXT[phase])}>{rawData.label}</span>
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {dietPhases.map(dp => {
              const active = activePhase === dp.phase;
              return (
                <motion.button
                  key={dp.phase}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActivePhase(dp.phase)}
                  className={cn(
                    "relative overflow-hidden rounded-2xl py-4 px-2 text-center transition-all border",
                    active ? "border-transparent" : "border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] bg-[rgb(var(--card)/0.62)] dark:bg-white/[0.07] hover:border-[rgb(var(--acc-200))] dark:hover:border-white/20",
                  )}
                  style={active ? {
                    boxShadow: `0 8px 28px -8px ${PHASE_GLOW[dp.phase as DietPhase]}`,
                  } : {}}
                >
                  {active && (
                    <div className={cn("absolute inset-0 bg-gradient-to-br", PHASE_GRAD[dp.phase as DietPhase])} />
                  )}
                  <div className="relative">
                    <div className="text-2xl mb-1.5">{dp.emoji}</div>
                    <div className={cn("text-[10px] font-bold leading-tight", active ? "text-white" : "opacity-80")}>{dp.label}</div>
                    <div className={cn("text-[9px] mt-0.5", active ? "text-white/70" : "opacity-40")}>{dp.days}</div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Phase hero card ── */}
        <motion.div
          key={activePhase}
          variants={fadeUp}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="relative overflow-hidden rounded-3xl p-6"
            style={{ boxShadow: `0 16px 56px -20px ${PHASE_GLOW[activePhase]}` }}
          >
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", PHASE_GRAD[activePhase])} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-4xl mb-2">{data.emoji}</p>
                  <h2 className="font-display text-2xl font-bold text-white">{data.label}</h2>
                  <p className="text-sm text-white/70 mt-0.5">{data.days}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-white/80 uppercase tracking-widest">{data.tagline}</p>
                </div>
              </div>
              <p className="text-sm text-white/85 leading-relaxed">{data.description}</p>
            </div>
          </div>

          {/* Personalisation row */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <div className="flex items-center gap-2 rounded-2xl border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] px-3.5 py-2.5">
              <span className="text-base">{dietLabel.emoji}</span>
              <span className="text-xs font-semibold">{dietLabel.label}</span>
              <Check size={13} className="text-emerald-400 ml-1" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] px-3.5 py-2.5">
              <span className="text-base">{goalTip.emoji}</span>
              <span className="text-xs font-semibold">{goalTip.label}</span>
            </div>
            <Link
              href="/profile"
              className="ml-auto flex items-center gap-1.5 rounded-2xl border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] hover:border-[rgb(var(--acc-200))] dark:hover:border-white/20 px-3.5 py-2.5 text-xs opacity-70 hover:opacity-100 transition-all"
            >
              Edit <ArrowRight size={12} />
            </Link>
          </div>

          {/* Goal tip */}
          <div className="mt-3 rounded-2xl bg-[rgb(var(--card)/0.68)] dark:bg-white/[0.07] border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] p-4 flex gap-3">
            <span className="text-2xl shrink-0">{goalTip.emoji}</span>
            <div>
              <p className={cn("text-xs font-bold mb-1", PHASE_TEXT[activePhase])}>{goalTip.label}</p>
              <p className="text-xs opacity-65 leading-relaxed">{goalTip.tip}</p>
            </div>
          </div>

          {/* Diet adaptation notice */}
          {dietPref !== "nonveg" && (
            <div className="mt-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 flex items-center gap-2.5">
              <Check size={14} className="text-emerald-400 shrink-0" />
              <p className="text-xs">
                <span className="font-semibold text-emerald-400">Adapted for {dietLabel.label}: </span>
                <span className="opacity-70">incompatible items removed from all recommendations.</span>
              </p>
            </div>
          )}
        </motion.div>

        {/* ── AI 3-Day Meal Plan ── */}
        <motion.div variants={fadeUp}>
          <AIMealPanel content={aiContent} loading={aiLoading} cached={aiCached} onGenerate={generatePlan} />
        </motion.div>

        {/* ── Accordion sections ── */}
        <motion.div variants={fadeUp} className="space-y-2.5">

          {/* Today's Meal Plan */}
          <Accordion id="meal" title="Today's Meal Plan" emoji="📋" expanded={expanded === "meal"} onToggle={setExpanded}>
            <div className="space-y-2.5">
              {[
                { label: "Breakfast", value: data.sampleMealPlan.breakfast },
                { label: "Lunch",     value: data.sampleMealPlan.lunch },
                { label: "Dinner",    value: data.sampleMealPlan.dinner },
              ].map((m, i) => <MealCard key={m.label} label={m.label} value={m.value} i={i} />)}
              {data.sampleMealPlan.snacks.length > 0 && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4">
                  <p className="text-xs font-bold text-emerald-400 mb-2">🍎 Snacks</p>
                  <div className="space-y-1.5">
                    {data.sampleMealPlan.snacks.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm opacity-80">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Accordion>

          {/* Foods to Eat */}
          <Accordion id="eat" title="Foods to Eat" emoji="✅" expanded={expanded === "eat"} onToggle={setExpanded} count={data.eat.length}>
            {data.eat.length === 0 ? (
              <p className="text-sm opacity-50 italic">No items match your diet preference for this phase.</p>
            ) : (
              <div className="space-y-2">
                {data.eat.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm opacity-80 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </Accordion>

          {/* Foods to Limit */}
          <Accordion id="limit" title="Foods to Limit" emoji="⚠️" expanded={expanded === "limit"} onToggle={setExpanded} count={data.limit.length}>
            <div className="space-y-2">
              {data.limit.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <X size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <span className="text-sm opacity-80 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </Accordion>

          {/* Key Nutrients */}
          <Accordion id="nutrients" title="Key Nutrients" emoji="🔬" expanded={expanded === "nutrients"} onToggle={setExpanded} count={data.keyNutrients.length}>
            <div className="space-y-3">
              {data.keyNutrients.map(n => (
                <div key={n.name} className="rounded-2xl border border-[rgb(var(--border)/0.76)] dark:border-white/[0.08] bg-[rgb(var(--card)/0.62)] dark:bg-white/[0.07] p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-semibold text-sm">{n.name}</p>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[rgb(var(--card)/0.78)] dark:bg-white/[0.07]", PHASE_TEXT[activePhase])}>Key</span>
                  </div>
                  <p className="text-xs opacity-65 mb-1.5 leading-relaxed">{n.why}</p>
                  <p className="text-xs opacity-50">
                    <span className="font-medium opacity-80">Sources: </span>
                    {isAllowed(n.sources, dietPref) ? n.sources : adaptText(n.sources, dietPref)}
                  </p>
                </div>
              ))}
            </div>
          </Accordion>

          {/* Recipe Ideas with YouTube */}
          <Accordion id="recipes" title="Recipe Ideas" emoji="🍽️" expanded={expanded === "recipes"} onToggle={setExpanded} count={data.recipes.length}>
            {data.recipes.length === 0 ? (
              <p className="text-sm opacity-50 italic">No recipes match your diet preference.</p>
            ) : (
              <div className="space-y-3">
                {data.recipes.map((r, i) => (
                  <RecipeCard
                    key={r.name}
                    name={r.name}
                    emoji={r.emoji}
                    time={r.time}
                    description={r.description}
                    nutrients={r.nutrients}
                    i={i}
                  />
                ))}
              </div>
            )}
          </Accordion>

          {/* Hydration */}
          <Accordion id="hydration" title="Hydration Guide" emoji="💧" expanded={expanded === "hydration"} onToggle={setExpanded}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400">
                <Droplets size={18} />
              </div>
              <p className="text-sm opacity-80 leading-relaxed">{data.hydration}</p>
            </div>
          </Accordion>
        </motion.div>

        <p className="text-center text-[11px] opacity-35 pb-2">
          Dietary suggestions are general wellness guidance · Consult a registered dietitian for personalised advice.
        </p>
      </motion.div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Bot,
  Brain,
  CalendarDays,
  CheckCircle2,
  Droplets,
  HeartPulse,
  History,
  Leaf,
  Mic,
  MicOff,
  Moon,
  Salad,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Sun,
  Trash2,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import { StatusChip } from "@/components/ui/premium";
import { streamReply, type ChatMessage, type CycleContext } from "@/lib/ai/chat";
import { useUserData } from "@/lib/hooks/useUserData";
import { predict, currentPhase, phaseInfo } from "@/lib/ai/prediction";
import { calculatePCOSRisk } from "@/lib/ai/pcos";
import {
  calculateHealthScore,
  getCycleRegularityMetrics,
  getPredictionAccuracy,
  getSymptomPhaseCorrelation,
  getLifestyleCorrelations,
} from "@/lib/ai/analytics";
import { detectAnomalies } from "@/lib/ai/anomaly";
import { cn } from "@/lib/utils";
import type { CyclePhase } from "@/lib/ai/prediction";
import { useToast } from "@/components/ui/toaster";

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      0: { transcript: string };
    };
  };
};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const PHASE_SUGGESTIONS: Record<CyclePhase, string[]> = {
  menstrual: [
    "What helps cramps naturally?",
    "Best foods for my period?",
    "How to sleep better during my period?",
    "Why am I so tired right now?",
  ],
  follicular: [
    "Best workouts for this phase?",
    "How to boost my energy?",
    "Foods to eat this week?",
    "Why do I feel so good?",
  ],
  ovulatory: [
    "Signs of ovulation to look for?",
    "Nutrition for peak performance?",
    "How to maximise this phase?",
    "What is a fertile window exactly?",
  ],
  luteal: [
    "Why am I craving sweets?",
    "Natural PMS remedies?",
    "How to manage mood swings?",
    "Best foods to reduce bloating?",
  ],
};

const GENERAL_SUGGESTIONS = [
  "What supplements help cycle health?",
  "Is my cycle length normal?",
  "How does stress affect my period?",
  "Signs of hormonal imbalance?",
];

const PROMPT_GROUPS: {
  title: string;
  icon: LucideIcon;
  tone: "rose" | "violet" | "mint" | "amber" | "blue";
  prompts: string[];
}[] = [
  {
    title: "Symptoms",
    icon: HeartPulse,
    tone: "rose",
    prompts: ["What helps cramps naturally?", "Why am I bloated?", "How can I reduce PMS mood swings?"],
  },
  {
    title: "Food + Sleep",
    icon: Salad,
    tone: "mint",
    prompts: ["Best foods for my current phase?", "How do I sleep better tonight?", "What should I avoid before my period?"],
  },
  {
    title: "Cycle Basics",
    icon: CalendarDays,
    tone: "violet",
    prompts: ["Is my cycle length normal?", "What is ovulation?", "Explain period tracking basics 101"],
  },
  {
    title: "Hormonal Health",
    icon: ShieldCheck,
    tone: "amber",
    prompts: ["Signs of hormonal imbalance?", "When should I check PCOS symptoms?", "How does stress affect my period?"],
  },
];

const PHASE_ICONS: Record<CyclePhase, typeof Sun> = {
  menstrual: Moon,
  follicular: Leaf,
  ovulatory: Zap,
  luteal: Moon,
};

const PHASE_TONE: Record<CyclePhase, "rose" | "mint" | "amber" | "violet"> = {
  menstrual: "rose",
  follicular: "mint",
  ovulatory: "amber",
  luteal: "violet",
};

const PHASE_DOT: Record<CyclePhase, string> = {
  menstrual: "bg-rose-400",
  follicular: "bg-emerald-400",
  ovulatory: "bg-amber-400",
  luteal: "bg-violet-400",
};

const ymd = (date: Date) => date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

function cleanProviderLabel(raw: string) {
  if (raw.startsWith("groq:")) {
    const model = raw.replace("groq:", "");
    if (model.includes("llama-3.3-70b")) return "Llama 3.3 70B - Groq";
    return `${model} - Groq`;
  }
  if (raw === "offline-kb") return "Luna - offline";
  if (raw.startsWith("offline-fallback")) return "Luna - offline fallback";
  return raw;
}

function localClarifyingReply(content: string, context: CycleContext) {
  const trimmed = content.trim();
  if (/^\d+$/.test(trimmed)) {
    return [
      `I saw "${trimmed}", but I need a little more context so I do not guess about your health.`,
      "",
      "You can ask it like:",
      `- "Is a ${trimmed}-day cycle normal?"`,
      `- "I am ${trimmed} days late, what should I do?"`,
      `- "Explain cycle basics 101"`,
      "",
      `Right now I can also help with your ${context.phase ?? "current"} phase, symptoms, period timing, PCOS questions, food, sleep, or stress.`,
    ].join("\n");
  }
  return null;
}

function normalizeChatText(value: string) {
  return value
    .replace(/\u00f0\u0178\u0152\u00b8/g, "")
    .replace(/\u00e2\u20ac[\u201c\u201d]/g, "-")
    .replace(/\u00c2\u00b7/g, "-")
    .replace(/\u00e2\u20ac\u00a6/g, "...")
    .replace(/\u00e2\u0153\u2022/g, "x")
    .replace(/\u00e2\u20ac\u2122/g, "'");
}

function timeLabel(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function toneClasses(tone: "rose" | "violet" | "mint" | "amber" | "blue") {
  const tones = {
    rose: "bg-rose-500/10 text-rose-700 ring-rose-200/70 dark:text-rose-200 dark:ring-rose-300/20",
    violet: "bg-violet-500/10 text-violet-700 ring-violet-200/70 dark:text-violet-200 dark:ring-violet-300/20",
    mint: "bg-emerald-500/10 text-emerald-700 ring-emerald-200/70 dark:text-emerald-200 dark:ring-emerald-300/20",
    amber: "bg-amber-500/12 text-amber-800 ring-amber-200/70 dark:text-amber-200 dark:ring-amber-300/20",
    blue: "bg-sky-500/10 text-sky-700 ring-sky-200/70 dark:text-sky-200 dark:ring-sky-300/20",
  };
  return tones[tone];
}

function LunaAvatar({ size = 40, pulse = false }: { size?: number; pulse?: boolean }) {
  return (
    <div className="relative shrink-0 rounded-[18px]" style={{ width: size, height: size }}>
      {pulse && <div className="absolute inset-0 rounded-[18px] bg-[rgb(var(--acc-400)/0.36)] blur-xl orb-breathe" />}
      <div className="absolute inset-0 rounded-[18px] bg-[linear-gradient(135deg,rgb(var(--acc-500)),rgb(var(--gend-rgb)))] shadow-[0_18px_38px_-24px_var(--acc-glow)]" />
      <div className="absolute inset-[3px] rounded-[15px] bg-white/12" />
      <div className="relative flex h-full items-center justify-center">
        <Sparkles size={size * 0.44} className="text-white" strokeWidth={2.2} />
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-2 w-2 rounded-full bg-[rgb(var(--acc-400)/0.68)]"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: index * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function ContextTile({
  icon: Icon,
  label,
  value,
  tone = "rose",
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  tone?: "rose" | "violet" | "mint" | "amber" | "blue";
}) {
  return (
    <div className="min-w-[150px] rounded-2xl border border-[rgb(var(--border)/0.62)] bg-[rgb(var(--card)/0.62)] p-3 dark:bg-white/[0.04]">
      <span className={cn("mb-2 grid h-9 w-9 place-items-center rounded-2xl ring-1", toneClasses(tone))}>
        <Icon size={16} strokeWidth={2.25} />
      </span>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-[rgb(var(--fg))]">{value}</p>
    </div>
  );
}

function ChatBubble({
  msg,
  name,
  streaming,
  providerLabel,
}: {
  msg: ChatMessage;
  name: string;
  streaming?: boolean;
  providerLabel?: string;
}) {
  const isAssistant = msg.role === "assistant";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn("flex w-full gap-2 lg:gap-3", isAssistant ? "justify-start" : "justify-end")}
    >
      {isAssistant && <LunaAvatar size={36} pulse={streaming} />}

      <div className={cn("flex max-w-[92%] flex-col lg:max-w-[76%] xl:max-w-[68%]", isAssistant ? "items-start" : "items-end")}>
        <div
          className={cn(
            "rounded-[22px] px-3 py-2.5 text-[13px] leading-relaxed shadow-[0_16px_42px_-34px_rgba(83,48,82,0.44)] lg:rounded-[26px] lg:px-4 lg:py-3 lg:text-sm",
            isAssistant
              ? "rounded-bl-lg border border-[rgb(var(--border)/0.70)] bg-[rgb(var(--card)/0.86)] text-[rgb(var(--fg))] dark:bg-[rgb(var(--surface-2)/0.78)]"
              : "rounded-br-lg bg-[linear-gradient(135deg,rgb(var(--acc-500)),rgb(var(--gend-rgb)))] text-white shadow-[0_18px_42px_-28px_var(--acc-glow)]",
          )}
        >
          {isAssistant ? <Markdown text={msg.content} /> : <p className="whitespace-pre-wrap">{msg.content}</p>}
          {streaming && <span className="ml-0.5 inline-block h-[1em] w-0.5 align-middle bg-[rgb(var(--acc-500)/0.72)] animate-pulse" />}
        </div>
        <p className="mt-1.5 px-2 text-[10px] font-semibold text-[rgb(var(--muted))]">
          {isAssistant ? providerLabel ?? "Luna" : name || "You"} - {timeLabel(msg.ts)}
        </p>
      </div>

      {!isAssistant && (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[16px] bg-[linear-gradient(135deg,rgb(var(--acc-100)),rgb(var(--surface-2)))] text-xs font-black text-[rgb(var(--acc-700))] ring-1 ring-[rgb(var(--acc-200)/0.70)] dark:bg-[linear-gradient(135deg,rgb(var(--acc-500)/0.18),rgb(var(--surface-2)/0.76))] dark:text-[rgb(var(--acc-100))] dark:ring-[rgb(var(--acc-300)/0.18)]">
          {(name?.[0] ?? "Y").toUpperCase()}
        </div>
      )}
    </motion.div>
  );
}

function LunaThinkingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3"
    >
      <LunaAvatar size={36} pulse />
      <div className="rounded-[24px] rounded-bl-lg border border-[rgb(var(--border)/0.70)] bg-[rgb(var(--card)/0.86)] px-4 py-3 shadow-[0_16px_42px_-34px_rgba(83,48,82,0.44)] dark:bg-[rgb(var(--surface-2)/0.78)]">
        <div className="mb-1 flex items-center gap-2">
          <p className="text-xs font-black text-[rgb(var(--fg))]">Luna is thinking</p>
          <TypingDots />
        </div>
        <p className="text-xs text-[rgb(var(--muted))]">Checking your cycle context before answering.</p>
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const { profile, cycles, logs, pcosProfile, chatHistory, setChatHistory, clearChatHistory } = useUserData();
  const push = useToast((state) => state.push);

  const { context, phase } = useMemo(() => {
    const prediction = predict(cycles, profile.avgCycleLength, profile.avgPeriodLength, logs);
    const phaseResult = currentPhase(new Date(), prediction, cycles);
    const recent = (Object.values(logs) as import("@/lib/store").LogEntry[])
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);
    const symptomCount: Record<string, number> = {};
    recent.forEach((entry) => entry.symptoms.forEach((symptom) => (symptomCount[symptom] = (symptomCount[symptom] || 0) + 1)));
    const topSymptoms = Object.entries(symptomCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([symptom]) => symptom);
    const sleepVals = recent.filter((entry) => entry.sleepHrs).map((entry) => entry.sleepHrs!);
    const waterVals = recent.filter((entry) => entry.waterCups).map((entry) => entry.waterCups!);
    const avg = (values: number[]) => (values.length ? +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : null);
    let pcosRisk: string | null = null;
    let rotterdamPhenotype: string | null = null;
    if (Object.keys(pcosProfile.answers).length > 0) {
      const pcosResult = calculatePCOSRisk(pcosProfile.answers);
      pcosRisk = pcosResult.riskLabel;
      rotterdamPhenotype = pcosResult.rotterdam.label;
    }

    const healthScore = calculateHealthScore(cycles, logs, profile, pcosProfile);
    const regularity = getCycleRegularityMetrics(cycles);
    const accuracy = getPredictionAccuracy(cycles, profile);
    const symptomCorrelation = getSymptomPhaseCorrelation(cycles, logs, profile);
    const topPhaseSymptom = symptomCorrelation.length > 0 ? symptomCorrelation[0].symptom : null;
    const correlation = getLifestyleCorrelations(cycles, logs);
    const anomalies = detectAnomalies(cycles, logs, profile);
    const activeAnomalies = anomalies.map((anomaly) => ({
      severity: anomaly.severity,
      title: anomaly.title,
      detail: anomaly.detail,
    }));

    let loggingStreakDays = 0;
    const day = new Date();
    while (true) {
      const key = day.toISOString().slice(0, 10);
      if (!logs[key]) break;
      loggingStreakDays++;
      day.setDate(day.getDate() - 1);
    }

    return {
      phase: phaseResult.phase,
      context: {
        name: profile.name,
        phase: phaseInfo[phaseResult.phase].label,
        dayOfCycle: phaseResult.dayOfCycle,
        avgCycleLength: prediction?.avgCycleLength,
        avgPeriodLength: prediction?.avgPeriodLength,
        nextPeriodStart: prediction ? ymd(prediction.nextPeriodStart) : undefined,
        ovulationDay: prediction ? ymd(prediction.ovulationDay) : undefined,
        confidence: prediction?.confidence,
        recentSymptoms: topSymptoms,
        recentMood: recent.find((entry) => entry.mood)?.mood ?? null,
        avgSleepHrs: avg(sleepVals),
        avgWaterCups: avg(waterVals),
        pcosRisk,
        healthScore: healthScore.total,
        cycleRegularity: regularity?.label ?? null,
        predictionMae: accuracy?.mae ?? null,
        topPhaseSymptom,
        cyclesLogged: cycles.length,
        loggingStreakDays,
        gpCiLower: prediction?.ciLower95Days ?? null,
        gpCiUpper: prediction?.ciUpper95Days ?? null,
        gpStd: prediction?.gpStd ?? null,
        modelUsed: prediction?.modelUsed ?? null,
        gpWeight: prediction?.gpWeight ?? null,
        activeAnomalies,
        sleepCycleR: correlation?.sleepR ?? null,
        stressCycleR: correlation?.stressR ?? null,
        strongestLifestyleFactor: correlation?.strongestFactor ?? null,
        strongestLifestyleR: correlation?.strongestR ?? null,
        rotterdamPhenotype,
      } satisfies CycleContext,
    };
  }, [profile, cycles, logs, pcosProfile]);

  const greeting = useMemo(() => {
    const name = profile.name && profile.name !== "Friend" ? `, ${profile.name}` : "";
    return `Hi${name} - I'm Luna, your private AI wellness companion. You're in your **${context.phase}** phase (day ${context.dayOfCycle ?? 1} of your cycle). I can help with nutrition, symptoms, mood, sleep, and anything cycle-related. What's on your mind?`;
  }, [profile.name, context.phase, context.dayOfCycle]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (chatHistory && chatHistory.length > 0) return chatHistory as ChatMessage[];
    return [{ role: "assistant", content: normalizeChatText(greeting), ts: Date.now() }];
  });

  useEffect(() => {
    setChatHistory(messages);
  }, [messages, setChatHistory]);

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [providerLabel, setProviderLabel] = useState("Llama 3.3 70B - Groq");
  const [listening, setListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(chatHistory.length === 0);
  const [showMemoryBadge, setShowMemoryBadge] = useState(chatHistory.length > 0);
  const [errorText, setErrorText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const hydratedHistoryRef = useRef(chatHistory.length > 0);
  const promptHydratedRef = useRef(false);

  useEffect(() => {
    if (!hydratedHistoryRef.current && chatHistory.length > 0 && messages.length <= 1) {
      setMessages((chatHistory as ChatMessage[]).map((message) => ({ ...message, content: normalizeChatText(message.content) })));
      setShowSuggestions(false);
      setShowMemoryBadge(true);
      hydratedHistoryRef.current = true;
    }
  }, [chatHistory, messages.length]);

  useEffect(() => {
    setProviderLabel(cleanProviderLabel("groq:llama-3.3-70b-versatile"));
  }, []);

  useEffect(() => {
    if (promptHydratedRef.current) return;
    const prompt = searchParams.get("prompt")?.trim();
    if (!prompt) return;
    promptHydratedRef.current = true;
    setInput(prompt);
    setShowSuggestions(false);
    window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [searchParams]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, streamingText]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || thinking) return;
    setErrorText("");
    setShowSuggestions(false);
    setShowMemoryBadge(false);
    const newMessages: ChatMessage[] = [...messages, { role: "user", content, ts: Date.now() }];
    setMessages(newMessages);
    setInput("");

    const localReply = localClarifyingReply(content, context);
    if (localReply) {
      setMessages([...newMessages, { role: "assistant", content: localReply, ts: Date.now() }]);
      setProviderLabel("Luna - clarification");
      return;
    }

    setThinking(true);
    setStreamingText("");
    abortRef.current = new AbortController();
    let accumulated = "";
    await streamReply(newMessages, context, {
      signal: abortRef.current.signal,
      onToken: (token) => {
        accumulated += token;
        setStreamingText(accumulated);
      },
      onDone: (full, label) => {
        const finalMessages = [...newMessages, { role: "assistant" as const, content: full || accumulated, ts: Date.now() }];
        setMessages(finalMessages);
        setStreamingText("");
        setThinking(false);
        setProviderLabel(cleanProviderLabel(label));
      },
      onError: () => {
        setThinking(false);
        setErrorText("Luna had trouble connecting, so I used the offline health guide. Try again if you want a deeper answer.");
      },
    });
  };

  const stop = () => {
    abortRef.current?.abort();
    if (streamingText) setMessages((current) => [...current, { role: "assistant", content: streamingText, ts: Date.now() }]);
    setStreamingText("");
    setThinking(false);
  };

  const clearChat = () => {
    clearChatHistory();
    setMessages([{ role: "assistant", content: normalizeChatText(greeting), ts: Date.now() }]);
    setShowSuggestions(true);
    setShowMemoryBadge(false);
    setErrorText("");
  };

  const toggleMic = () => {
    if (typeof window === "undefined") return;
    const speechWindow = window as SpeechWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      push({
        title: "Voice input unavailable",
        description: "Try Chrome or Edge, or type your question to Luna.",
        tone: "info",
      });
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let text = "";
      for (let index = event.resultIndex; index < event.results.length; index++) {
        text += event.results[index][0].transcript;
      }
      setInput(text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const PhaseIcon = PHASE_ICONS[phase] ?? Sparkles;
  const phaseSuggestions = PHASE_SUGGESTIONS[phase] ?? GENERAL_SUGGESTIONS;
  const savedCount = chatHistory.length;
  const confidence = context.confidence != null ? `${Math.round(context.confidence * 100)}% confidence` : "Building confidence";

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-[430px] flex-col gap-3 pb-0 lg:h-[calc(100vh-7rem)] lg:min-h-0 lg:gap-4 lg:pb-3">
      <section className="relative overflow-hidden rounded-[24px] border border-[rgb(var(--border)/0.74)] bg-[linear-gradient(135deg,rgb(var(--card)/0.92),rgb(var(--surface-2)/0.72))] p-3 shadow-[var(--card-shadow)] dark:bg-[linear-gradient(135deg,rgb(var(--surface-2)/0.88),rgb(var(--surface)/0.66))] lg:rounded-[30px] lg:p-5">
        <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-[rgb(var(--acc-300)/0.20)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-emerald-300/14 blur-3xl" />

        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <LunaAvatar size={46} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-semibold tracking-normal text-[rgb(var(--fg))] lg:text-2xl">Luna AI</h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-200/70 dark:text-emerald-200 dark:ring-emerald-300/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
                {savedCount > 1 && <StatusChip icon={History} label={`${savedCount} remembered`} tone="violet" className="py-1" />}
              </div>
              <p className="mt-1 hidden max-w-2xl text-sm leading-6 text-[rgb(var(--muted))] lg:block">
                Private cycle guidance for symptoms, food, sleep, PCOS questions, and daily decisions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusChip icon={PhaseIcon} label={`${context.phase} - day ${context.dayOfCycle ?? "?"}`} tone={PHASE_TONE[phase]} />
            <StatusChip icon={Bot} label={providerLabel} tone="blue" className="hidden lg:inline-flex" />
            <button
              type="button"
              onClick={clearChat}
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--card)/0.72)] px-3 text-xs font-black text-[rgb(var(--muted))] transition hover:-translate-y-0.5 hover:border-rose-300/70 hover:text-rose-600 dark:bg-white/[0.04] dark:hover:text-rose-200 lg:h-10"
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        <div className="relative mt-3 hidden gap-3 overflow-x-auto pb-2 lg:flex xl:grid xl:grid-cols-5 xl:overflow-visible scrollbar-none">
          <ContextTile icon={CalendarDays} label="Cycle phase" value={`${context.phase ?? "Unknown"} day ${context.dayOfCycle ?? "?"}`} tone={PHASE_TONE[phase]} />
          <ContextTile icon={TrendingUp} label="Prediction" value={confidence} tone="violet" />
          <ContextTile icon={HeartPulse} label="Recent symptoms" value={context.recentSymptoms?.length ? context.recentSymptoms.slice(0, 2).join(", ") : "None logged"} tone="rose" />
          <ContextTile icon={Moon} label="Sleep" value={context.avgSleepHrs != null ? `${context.avgSleepHrs}h avg` : "Not logged"} tone="blue" />
          <ContextTile icon={Droplets} label="Hydration" value={context.avgWaterCups != null ? `${context.avgWaterCups} cups` : "Not logged"} tone="mint" />
        </div>
      </section>

      <AnimatePresence>
        {showMemoryBadge && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-2xl border border-violet-300/40 bg-violet-50/90 px-4 py-3 text-xs font-semibold text-violet-800 shadow-[0_14px_32px_-28px_rgba(124,58,237,0.45)] dark:border-violet-500/20 dark:bg-violet-500/[0.08] dark:text-violet-200"
          >
            <History size={14} className="shrink-0" />
            <span>Your previous conversation has been restored. Luna remembers your history.</span>
            <button type="button" onClick={() => setShowMemoryBadge(false)} className="ml-auto rounded-full px-2 py-0.5 text-violet-500 transition hover:bg-violet-500/10 hover:text-violet-800 dark:hover:text-violet-100">
              x
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorText && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2 rounded-2xl border border-amber-300/50 bg-amber-50/95 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/[0.08] dark:text-amber-100"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{errorText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[rgb(var(--border)/0.74)] bg-[rgb(var(--card)/0.58)] shadow-[var(--card-shadow)] dark:bg-white/[0.035] lg:rounded-[30px]">
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto px-3 py-3 scrollbar-none lg:space-y-5 lg:px-6 lg:py-5"
        >
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <ChatBubble key={`${message.ts}-${index}`} msg={message} name={profile.name} providerLabel={message.role === "assistant" ? providerLabel : undefined} />
            ))}
            {streamingText && (
              <ChatBubble
                key="streaming"
                msg={{ role: "assistant", content: streamingText, ts: Date.now() }}
                name={profile.name}
                providerLabel={providerLabel}
                streaming
              />
            )}
            {thinking && !streamingText && <LunaThinkingCard key="thinking" />}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showSuggestions && messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="border-t border-[rgb(var(--border)/0.62)] bg-[rgb(var(--surface)/0.36)] px-3 py-3 dark:bg-white/[0.025] lg:px-6 lg:py-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", PHASE_DOT[phase])} />
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Suggested for {context.phase} phase</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden scrollbar-none">
                {phaseSuggestions.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => send(prompt)}
                    className="min-w-[11rem] rounded-2xl bg-[rgb(var(--card)/0.72)] px-3 py-2 text-left text-xs font-bold leading-5 text-[rgb(var(--muted))] ring-1 ring-[rgb(var(--border)/0.58)]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="hidden gap-3 lg:grid lg:grid-cols-4">
                {PROMPT_GROUPS.map((group, index) => {
                  const GroupIcon = group.icon;
                  const prompts = index === 0 ? phaseSuggestions.slice(0, 3) : group.prompts;
                  return (
                    <div key={group.title} className="rounded-[22px] border border-[rgb(var(--border)/0.62)] bg-[rgb(var(--card)/0.68)] p-3 dark:bg-white/[0.04]">
                      <div className="mb-3 flex items-center gap-2">
                        <span className={cn("grid h-9 w-9 place-items-center rounded-2xl ring-1", toneClasses(group.tone))}>
                          <GroupIcon size={16} strokeWidth={2.2} />
                        </span>
                        <p className="text-sm font-black text-[rgb(var(--fg))]">{group.title}</p>
                      </div>
                      <div className="space-y-2">
                        {prompts.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => send(prompt)}
                            className="block w-full rounded-2xl bg-[rgb(var(--surface)/0.58)] px-3 py-2 text-left text-xs font-semibold leading-5 text-[rgb(var(--muted))] transition hover:-translate-y-0.5 hover:bg-[rgb(var(--acc-50)/0.82)] hover:text-[rgb(var(--fg))] dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-[rgb(var(--border)/0.62)] bg-[rgb(var(--card)/0.74)] p-2.5 backdrop-blur dark:bg-[rgb(var(--surface)/0.72)] lg:p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
            className="rounded-[22px] border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.66)] p-1.5 shadow-[0_18px_48px_-38px_rgba(83,48,82,0.46)] dark:bg-white/[0.04] lg:rounded-[24px] lg:p-2"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMic}
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-[17px] border transition-all lg:h-12 lg:w-12 lg:rounded-[19px]",
                  listening
                    ? "animate-pulse border-transparent bg-[linear-gradient(135deg,rgb(var(--acc-500)),rgb(var(--gend-rgb)))] text-white shadow-[0_18px_38px_-24px_var(--acc-glow)]"
                    : "border-[rgb(var(--border)/0.72)] bg-[rgb(var(--card)/0.74)] text-[rgb(var(--muted))] hover:-translate-y-0.5 hover:border-[rgb(var(--acc-300)/0.68)] hover:text-[rgb(var(--acc-600))] dark:bg-white/[0.04] dark:hover:text-[rgb(var(--acc-200))]",
                )}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
              >
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" size={16} />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={listening ? "Listening..." : "Ask Luna about symptoms, food, sleep..."}
                  className="h-11 w-full rounded-[17px] border border-transparent bg-[rgb(var(--card)/0.82)] pl-10 pr-3 text-[13px] font-semibold text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] transition focus:border-[rgb(var(--acc-300)/0.68)] focus:outline-none focus:ring-4 focus:ring-[rgb(var(--acc-100)/0.60)] dark:bg-white/[0.05] dark:focus:ring-[rgb(var(--acc-400)/0.10)] lg:h-12 lg:rounded-[19px] lg:pl-11 lg:pr-4 lg:text-sm"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                />
              </div>

              {thinking ? (
                <button
                  type="button"
                  onClick={stop}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-[17px] border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--card)/0.74)] text-[rgb(var(--muted))] transition hover:-translate-y-0.5 hover:border-rose-300/70 hover:text-rose-600 dark:bg-white/[0.04] dark:hover:text-rose-200 lg:h-12 lg:w-12 lg:rounded-[19px]"
                  title="Stop"
                  aria-label="Stop Luna response"
                >
                  <Square size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-[17px] transition-all lg:h-12 lg:w-12 lg:rounded-[19px]",
                    input.trim()
                      ? "bg-[linear-gradient(135deg,rgb(var(--acc-500)),rgb(var(--gend-rgb)))] text-white shadow-[0_18px_38px_-24px_var(--acc-glow)] hover:-translate-y-0.5"
                      : "cursor-not-allowed border border-[rgb(var(--border)/0.62)] bg-[rgb(var(--surface)/0.58)] text-[rgb(var(--muted)/0.58)] dark:bg-white/[0.035]",
                  )}
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              )}
            </div>
          </form>

          <p className="mt-2 hidden items-center justify-center gap-1.5 text-center text-[10px] font-semibold leading-snug text-[rgb(var(--muted))] lg:flex">
            <Waves size={11} />
            Luna provides wellness guidance, not medical advice. Conversation saved on your device.
          </p>
        </div>
      </section>
    </div>
  );
}

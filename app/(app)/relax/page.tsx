"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BellRing,
  Brain,
  CheckCircle2,
  CircleDot,
  CloudRain,
  ExternalLink,
  Headphones,
  HeartPulse,
  Leaf,
  Moon,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Trees,
  Waves,
  Wifi,
  Wind,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { SectionPanel, StatusChip } from "@/components/ui/premium";
import { cn } from "@/lib/utils";

type BreathPhase = "inhale" | "hold" | "exhale" | "rest";
type Tab = "music" | "breathing" | "meditation" | "play";
type MusicCategory = "all" | "nature" | "lo-fi" | "classical" | "sleep" | "meditation";
type Tone = "rose" | "violet" | "mint" | "amber" | "blue";
type PlayGame = "pop" | "sort";
type SortTube = Tone[];

interface Bubble {
  id: string;
  x: number;
  y: number;
  size: number;
  tone: Tone;
  drift: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  category: MusicCategory;
  duration: string;
  icon: LucideIcon;
  gradient: string;
  glow: string;
  mood: string;
}

const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "jfKfPfyJRdk",
    title: "Lo-Fi Chill Beats",
    artist: "Study & Relaxation",
    category: "lo-fi",
    duration: "Live",
    icon: Headphones,
    gradient: "from-violet-500 via-fuchsia-500 to-rose-400",
    glow: "rgba(168,85,247,0.46)",
    mood: "Soft focus",
  },
  {
    id: "4oStw0r33so",
    title: "Peaceful Piano",
    artist: "Classical Serenity",
    category: "classical",
    duration: "3 hr",
    icon: Music2,
    gradient: "from-rose-400 via-pink-500 to-violet-500",
    glow: "rgba(236,72,153,0.45)",
    mood: "Gentle release",
  },
  {
    id: "q76bMs-NwRk",
    title: "528 Hz Healing",
    artist: "Solfeggio Frequencies",
    category: "meditation",
    duration: "8 hr",
    icon: Sparkles,
    gradient: "from-teal-400 via-cyan-500 to-sky-500",
    glow: "rgba(20,184,166,0.42)",
    mood: "Deep calm",
  },
  {
    id: "UfcAVejslrU",
    title: "Gentle Rainfall",
    artist: "Nature Sounds",
    category: "nature",
    duration: "4 hr",
    icon: CloudRain,
    gradient: "from-sky-400 via-indigo-400 to-violet-500",
    glow: "rgba(59,130,246,0.42)",
    mood: "Cozy rest",
  },
  {
    id: "7maJOI3QMu0",
    title: "Ocean Waves",
    artist: "Coastal Calm",
    category: "nature",
    duration: "3 hr",
    icon: Waves,
    gradient: "from-cyan-400 via-teal-500 to-emerald-400",
    glow: "rgba(8,145,178,0.42)",
    mood: "Slow exhale",
  },
  {
    id: "77ZozI0rw7w",
    title: "Deep Sleep Music",
    artist: "Delta Waves",
    category: "sleep",
    duration: "8 hr",
    icon: Moon,
    gradient: "from-indigo-500 via-violet-500 to-fuchsia-500",
    glow: "rgba(99,102,241,0.46)",
    mood: "Sleep prep",
  },
  {
    id: "WJf0mLuqp1E",
    title: "Forest Ambience",
    artist: "Birds & Leaves",
    category: "nature",
    duration: "5 hr",
    icon: Trees,
    gradient: "from-emerald-400 via-teal-500 to-cyan-500",
    glow: "rgba(16,185,129,0.42)",
    mood: "Grounding",
  },
  {
    id: "wOh1OJZxGBk",
    title: "Tibetan Bowls",
    artist: "Meditation Bells",
    category: "meditation",
    duration: "2 hr",
    icon: BellRing,
    gradient: "from-amber-300 via-orange-400 to-rose-400",
    glow: "rgba(245,158,11,0.42)",
    mood: "Clear mind",
  },
];

const CATEGORIES: { id: MusicCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "nature", label: "Nature" },
  { id: "lo-fi", label: "Lo-Fi" },
  { id: "classical", label: "Classical" },
  { id: "sleep", label: "Sleep" },
  { id: "meditation", label: "Meditation" },
];

const BREATHING_PATTERNS: {
  label: string;
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
  description: string;
  tone: Tone;
  gradient: string;
}[] = [
  {
    label: "4-7-8 Relax",
    inhale: 4,
    hold: 7,
    exhale: 8,
    rest: 0,
    description: "Classic anxiety relief",
    tone: "violet",
    gradient: "from-violet-500 to-fuchsia-500",
  },
  {
    label: "Box Breathing",
    inhale: 4,
    hold: 4,
    exhale: 4,
    rest: 4,
    description: "Nervous system reset",
    tone: "blue",
    gradient: "from-sky-500 to-cyan-500",
  },
  {
    label: "2-1-4 Calming",
    inhale: 2,
    hold: 1,
    exhale: 4,
    rest: 0,
    description: "Quick calm for cramps",
    tone: "rose",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    label: "Equal Breathing",
    inhale: 4,
    hold: 0,
    exhale: 4,
    rest: 0,
    description: "Grounding and centering",
    tone: "mint",
    gradient: "from-emerald-500 to-teal-500",
  },
];

const MEDITATIONS: {
  title: string;
  duration: number;
  icon: LucideIcon;
  tone: Tone;
  description: string;
}[] = [
  {
    title: "Body Scan for Period Pain",
    duration: 5,
    icon: HeartPulse,
    tone: "rose",
    description: "Gently release tension to ease cramps",
  },
  {
    title: "Hormonal Balance Visualisation",
    duration: 7,
    icon: Activity,
    tone: "violet",
    description: "Visualise hormonal harmony and wellness",
  },
  {
    title: "Self-Compassion for PMS",
    duration: 5,
    icon: Sparkles,
    tone: "mint",
    description: "Soften self-judgment during luteal phase",
  },
  {
    title: "Deep Sleep Preparation",
    duration: 10,
    icon: Moon,
    tone: "blue",
    description: "Progressive relaxation for restful sleep",
  },
  {
    title: "Morning Cycle Affirmations",
    duration: 4,
    icon: Leaf,
    tone: "amber",
    description: "Start your day with positive awareness",
  },
];

const TABS: { id: Tab; label: string; description: string; icon: LucideIcon }[] = [
  { id: "music", label: "Music", description: "Soothing soundscapes", icon: Music2 },
  { id: "breathing", label: "Breathe", description: "Guided nervous-system reset", icon: Wind },
  { id: "meditation", label: "Meditate", description: "Timed mindful sessions", icon: Brain },
  { id: "play", label: "Play", description: "Bubble pop + sort", icon: CircleDot },
];

const BUBBLE_TONES: Tone[] = ["rose", "violet", "mint", "amber", "blue"];
const SORT_TONES: Tone[] = ["rose", "violet", "mint", "blue"];
const SORT_CAPACITY = 4;
const SORT_PUZZLES: SortTube[][] = [
  [
    ["rose", "violet", "violet", "rose"],
    ["mint", "blue", "blue", "violet"],
    ["mint", "rose", "blue", "mint"],
    ["rose", "blue", "violet", "mint"],
    [],
    [],
  ],
  [
    ["rose", "mint", "violet", "blue"],
    ["rose", "rose", "mint", "blue"],
    ["violet", "blue", "rose", "violet"],
    ["blue", "mint", "violet", "mint"],
    [],
    [],
  ],
  [
    ["blue", "blue", "mint", "violet"],
    ["mint", "violet", "rose", "rose"],
    ["blue", "mint", "violet", "blue"],
    ["violet", "rose", "rose", "mint"],
    [],
    [],
  ],
  [
    ["mint", "rose", "mint", "rose"],
    ["blue", "blue", "violet", "blue"],
    ["mint", "violet", "mint", "violet"],
    ["rose", "rose", "violet", "blue"],
    [],
    [],
  ],
  [
    ["blue", "mint", "rose", "violet"],
    ["rose", "violet", "blue", "rose"],
    ["mint", "mint", "blue", "mint"],
    ["violet", "rose", "blue", "violet"],
    [],
    [],
  ],
  [
    ["blue", "rose", "violet", "mint"],
    ["violet", "rose", "mint", "violet"],
    ["rose", "mint", "blue", "blue"],
    ["violet", "rose", "blue", "mint"],
    [],
    [],
  ],
];
const BUBBLE_FLOATERS = [
  { left: "12%", top: "18%", delay: 0, size: 8 },
  { left: "82%", top: "16%", delay: 0.7, size: 11 },
  { left: "68%", top: "76%", delay: 1.35, size: 7 },
  { left: "20%", top: "72%", delay: 2.05, size: 10 },
  { left: "48%", top: "28%", delay: 2.75, size: 6 },
];

function createBubble(index = 0): Bubble {
  const tone = BUBBLE_TONES[Math.floor(Math.random() * BUBBLE_TONES.length)] ?? "blue";
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    x: 8 + Math.random() * 84,
    y: 12 + Math.random() * 72,
    size: 54 + Math.random() * 54,
    tone,
    drift: Math.random() * 34 - 17,
    delay: Math.random() * 1.8 + index * 0.04,
    duration: 6.2 + Math.random() * 4.4,
    opacity: 0.68 + Math.random() * 0.24,
  };
}

function createBubbleField(count = 16): Bubble[] {
  return Array.from({ length: count }, (_, index) => createBubble(index));
}

function sortTop(tube: SortTube) {
  return tube[tube.length - 1];
}

function canMoveSortBubble(tubes: SortTube[], from: number, to: number) {
  if (from === to) return false;
  const source = tubes[from];
  const target = tubes[to];
  if (!source || !target || source.length === 0 || target.length >= SORT_CAPACITY) return false;
  const moving = sortTop(source);
  const targetTop = sortTop(target);
  return !targetTop || targetTop === moving;
}

function moveSortBubble(tubes: SortTube[], from: number, to: number): SortTube[] | null {
  if (!canMoveSortBubble(tubes, from, to)) return null;
  return tubes.map((tube, index) => {
    if (index === from) return tube.slice(0, -1);
    if (index === to) return [...tube, sortTop(tubes[from]) as Tone];
    return [...tube];
  });
}

function sortIsSolved(tubes: SortTube[]) {
  return tubes.every((tube) => tube.length === 0 || (tube.length === SORT_CAPACITY && tube.every((tone) => tone === tube[0])));
}

function createSortPuzzle(): SortTube[] {
  const puzzle = SORT_PUZZLES[Math.floor(Math.random() * SORT_PUZZLES.length)] ?? SORT_PUZZLES[0];
  return puzzle.map((tube) => [...tube]);
}

function formatClock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function toneClasses(tone: Tone) {
  const tones = {
    rose: "bg-rose-500/10 text-rose-700 ring-rose-200/70 dark:text-rose-200 dark:ring-rose-300/20",
    violet: "bg-violet-500/10 text-violet-700 ring-violet-200/70 dark:text-violet-200 dark:ring-violet-300/20",
    mint: "bg-emerald-500/10 text-emerald-700 ring-emerald-200/70 dark:text-emerald-200 dark:ring-emerald-300/20",
    amber: "bg-amber-500/12 text-amber-800 ring-amber-200/70 dark:text-amber-200 dark:ring-amber-300/20",
    blue: "bg-sky-500/10 text-sky-700 ring-sky-200/70 dark:text-sky-200 dark:ring-sky-300/20",
  };
  return tones[tone];
}

function bubbleToneClasses(tone: Tone) {
  const tones = {
    rose: {
      fill: "from-rose-100/92 via-pink-200/62 to-white/36",
      ring: "ring-rose-200/80 dark:ring-rose-200/24",
      sparkle: "text-rose-500 dark:text-rose-100",
      glow: "rgba(244,63,94,0.32)",
    },
    violet: {
      fill: "from-violet-100/92 via-fuchsia-200/58 to-white/36",
      ring: "ring-violet-200/78 dark:ring-violet-200/24",
      sparkle: "text-violet-500 dark:text-violet-100",
      glow: "rgba(168,85,247,0.32)",
    },
    mint: {
      fill: "from-emerald-100/92 via-teal-200/60 to-white/36",
      ring: "ring-emerald-200/78 dark:ring-emerald-200/24",
      sparkle: "text-emerald-500 dark:text-emerald-100",
      glow: "rgba(16,185,129,0.30)",
    },
    amber: {
      fill: "from-amber-100/94 via-orange-200/58 to-white/38",
      ring: "ring-amber-200/78 dark:ring-amber-200/24",
      sparkle: "text-amber-600 dark:text-amber-100",
      glow: "rgba(245,158,11,0.28)",
    },
    blue: {
      fill: "from-sky-100/92 via-cyan-200/58 to-white/36",
      ring: "ring-sky-200/78 dark:ring-sky-200/24",
      sparkle: "text-sky-500 dark:text-sky-100",
      glow: "rgba(14,165,233,0.30)",
    },
  };
  return tones[tone];
}

function sortBubbleStyles(tone: Tone) {
  const tones = {
    rose: {
      label: "R",
      name: "Rose",
      background: "linear-gradient(145deg, #fb7185 0%, #e11d48 62%, #be123c 100%)",
      border: "rgba(254,205,211,0.95)",
      glow: "rgba(225,29,72,0.55)",
      foreground: "#fff1f2",
    },
    violet: {
      label: "V",
      name: "Violet",
      background: "linear-gradient(145deg, #c084fc 0%, #7c3aed 62%, #5b21b6 100%)",
      border: "rgba(221,214,254,0.95)",
      glow: "rgba(124,58,237,0.55)",
      foreground: "#f5f3ff",
    },
    mint: {
      label: "M",
      name: "Mint",
      background: "linear-gradient(145deg, #5eead4 0%, #10b981 58%, #047857 100%)",
      border: "rgba(167,243,208,0.95)",
      glow: "rgba(16,185,129,0.50)",
      foreground: "#ecfdf5",
    },
    amber: {
      label: "A",
      name: "Amber",
      background: "linear-gradient(145deg, #fcd34d 0%, #f97316 62%, #c2410c 100%)",
      border: "rgba(254,215,170,0.95)",
      glow: "rgba(249,115,22,0.50)",
      foreground: "#fff7ed",
    },
    blue: {
      label: "B",
      name: "Blue",
      background: "linear-gradient(145deg, #38bdf8 0%, #2563eb 62%, #1e3a8a 100%)",
      border: "rgba(186,230,253,0.95)",
      glow: "rgba(37,99,235,0.52)",
      foreground: "#eff6ff",
    },
  };
  return tones[tone];
}

function PanelHeading({
  icon: Icon,
  label,
  title,
  description,
}: {
  icon: LucideIcon;
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-500)/0.10)] text-[rgb(var(--acc-600))] ring-1 ring-[rgb(var(--acc-200)/0.58)] dark:text-[rgb(var(--acc-200))] dark:ring-[rgb(var(--acc-300)/0.18)]">
        <Icon size={20} strokeWidth={2.3} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{label}</p>
        <h2 className="mt-1 font-display text-xl font-semibold tracking-normal text-[rgb(var(--fg))] sm:text-2xl">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{description}</p>}
      </div>
    </div>
  );
}

export default function RelaxPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [tab, setTab] = useState<Tab>("music");

  const [nowPlaying, setNowPlaying] = useState<MusicTrack | null>(null);
  const [activeCategory, setActiveCategory] = useState<MusicCategory>("all");

  const [breathPatternIdx, setBreathPatternIdx] = useState(0);
  const [breathActive, setBreathActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>("inhale");
  const [breathCount, setBreathCount] = useState(0);
  const [breathTick, setBreathTick] = useState(0);
  const breathTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [meditationTimer, setMeditationTimer] = useState(0);
  const [meditationRunning, setMeditationRunning] = useState(false);
  const [meditationTotal, setMeditationTotal] = useState(300);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const meditationRef = useRef<NodeJS.Timeout | null>(null);

  const [playGame, setPlayGame] = useState<PlayGame>("pop");
  const [bubbles, setBubbles] = useState<Bubble[]>(() => createBubbleField());
  const [bubblesPopped, setBubblesPopped] = useState(0);
  const [bubbleSeconds, setBubbleSeconds] = useState(0);
  const [bubbleStarted, setBubbleStarted] = useState(false);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [sortTubes, setSortTubes] = useState<SortTube[]>(() => createSortPuzzle());
  const [selectedTube, setSelectedTube] = useState<number | null>(null);
  const [sortMoves, setSortMoves] = useState(0);

  useEffect(
    () => () => {
      if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
      if (meditationRef.current) clearInterval(meditationRef.current);
      if (bubbleTimerRef.current) clearInterval(bubbleTimerRef.current);
    },
    [],
  );

  const pattern = BREATHING_PATTERNS[breathPatternIdx];

  const runBreathCycle = useCallback(() => {
    const phases: { phase: BreathPhase; duration: number }[] = [
      { phase: "inhale", duration: pattern.inhale },
      ...(pattern.hold > 0 ? [{ phase: "hold" as BreathPhase, duration: pattern.hold }] : []),
      { phase: "exhale", duration: pattern.exhale },
      ...(pattern.rest > 0 ? [{ phase: "rest" as BreathPhase, duration: pattern.rest }] : []),
    ];
    let index = 0;
    let tick = 0;

    const advance = () => {
      const current = phases[index];
      setBreathPhase(current.phase);
      setBreathTick(tick + 1);
      tick++;

      if (tick >= current.duration) {
        tick = 0;
        index = (index + 1) % phases.length;
        if (index === 0) setBreathCount((count) => count + 1);
      }
      breathTimerRef.current = setTimeout(advance, 1000);
    };

    advance();
  }, [pattern]);

  useEffect(() => {
    if (breathActive) {
      runBreathCycle();
    } else {
      if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
      setBreathPhase("inhale");
      setBreathTick(0);
    }
    return () => {
      if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
    };
  }, [breathActive, runBreathCycle]);

  useEffect(() => {
    if (meditationRunning) {
      meditationRef.current = setInterval(() => {
        setMeditationTimer((time) => {
          if (time >= meditationTotal) {
            setMeditationRunning(false);
            return 0;
          }
          return time + 1;
        });
      }, 1000);
    } else if (meditationRef.current) {
      clearInterval(meditationRef.current);
    }
    return () => {
      if (meditationRef.current) clearInterval(meditationRef.current);
    };
  }, [meditationRunning, meditationTotal]);

  useEffect(() => {
    if (bubbleStarted) {
      bubbleTimerRef.current = setInterval(() => setBubbleSeconds((seconds) => seconds + 1), 1000);
    } else if (bubbleTimerRef.current) {
      clearInterval(bubbleTimerRef.current);
    }
    return () => {
      if (bubbleTimerRef.current) clearInterval(bubbleTimerRef.current);
    };
  }, [bubbleStarted]);

  const popBubble = useCallback((id: string) => {
    setBubbleStarted(true);
    setBubblesPopped((count) => count + 1);
    setBubbles((current) => [...current.filter((bubble) => bubble.id !== id), createBubble()]);
  }, []);

  const resetBubbles = useCallback(() => {
    setBubbles(createBubbleField());
    setBubblesPopped(0);
    setBubbleSeconds(0);
    setBubbleStarted(false);
  }, []);

  const sortSolved = sortIsSolved(sortTubes);

  const handleSortTubeClick = useCallback(
    (index: number) => {
      if (sortSolved) return;

      if (selectedTube === null) {
        if (sortTubes[index]?.length) setSelectedTube(index);
        return;
      }

      if (selectedTube === index) {
        setSelectedTube(null);
        return;
      }

      const next = moveSortBubble(sortTubes, selectedTube, index);
      if (next) {
        setSortTubes(next);
        setSortMoves((moves) => moves + 1);
        setSelectedTube(null);
        return;
      }

      setSelectedTube(sortTubes[index]?.length ? index : null);
    },
    [selectedTube, sortSolved, sortTubes],
  );

  const resetSort = useCallback(() => {
    setSortTubes(createSortPuzzle());
    setSelectedTube(null);
    setSortMoves(0);
  }, []);

  const filteredTracks = useMemo(
    () => (activeCategory === "all" ? MUSIC_TRACKS : MUSIC_TRACKS.filter((track) => track.category === activeCategory)),
    [activeCategory],
  );

  if (!mounted) return null;

  const breathScale = breathPhase === "inhale" ? 1.28 : breathPhase === "hold" ? 1.28 : 0.88;
  const breathLabel = { inhale: "Breathe in", hold: "Hold", exhale: "Breathe out", rest: "Rest" }[breathPhase];
  const meditationPercent = meditationTotal > 0 ? (meditationTimer / meditationTotal) * 100 : 0;
  const meditationRemaining = meditationTotal - meditationTimer;
  const circumference = 2 * Math.PI * 46;
  const bubbleState = bubblesPopped >= 24 ? "Deep calm" : bubblesPopped >= 12 ? "Settling" : bubblesPopped > 0 ? "Floating" : "Ready";
  const bubbleProgress = Math.min(100, Math.round((bubblesPopped / 24) * 100));
  const sortSolvedTubes = sortTubes.filter((tube) => tube.length === SORT_CAPACITY && tube.every((tone) => tone === tube[0])).length;
  const sortProgress = Math.min(100, Math.round((sortSolvedTubes / SORT_TONES.length) * 100));
  const sortState = sortSolved ? "Sorted" : selectedTube !== null ? "Choose tube" : sortMoves > 0 ? "Sorting" : "Ready";

  return (
    <div className="pb-28 lg:pb-8">
      <Topbar title="Relax & Sleep" />

      <section className="relative mb-5 overflow-hidden rounded-[32px] border border-[rgb(var(--border)/0.72)] bg-[linear-gradient(135deg,rgb(var(--card)/0.92),rgb(var(--surface-2)/0.72))] p-5 shadow-[var(--card-shadow)] dark:bg-[linear-gradient(135deg,rgb(var(--surface-2)/0.88),rgb(var(--surface)/0.66))] sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[rgb(var(--acc-300)/0.20)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusChip icon={Moon} label="Sleep support" tone="violet" />
              <StatusChip icon={Wind} label="Breath coach" tone="mint" />
              <StatusChip icon={Sparkles} label="Soft reset" tone="rose" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Calm studio</p>
            <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold tracking-normal text-[rgb(var(--fg))] sm:text-5xl">
              Settle your body, soften your mind.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))] sm:text-base">
              Choose a soundscape, follow a breathing rhythm, start a short meditation, or use soft bubble games to move attention away from stress.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="gap-2"
                onClick={() => {
                  setTab("breathing");
                  setBreathActive(true);
                }}
              >
                <Wind size={18} />
                Start breathing
              </Button>
              <Button variant="outline" size="lg" className="gap-2" onClick={() => setTab("music")}>
                <Music2 size={18} />
                Browse sounds
              </Button>
            </div>
          </div>

          <div className="relative mx-auto grid h-64 w-64 place-items-center rounded-full bg-[rgb(var(--card)/0.48)] ring-1 ring-[rgb(var(--border)/0.60)] dark:bg-white/[0.04]">
            <motion.div
              className="absolute h-52 w-52 rounded-full bg-[radial-gradient(circle,rgb(var(--acc-300)/0.22),transparent_68%)]"
              animate={{ scale: breathActive ? [1, 1.12, 1] : [1, 1.04, 1], opacity: [0.55, 0.85, 0.55] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative grid h-44 w-44 place-items-center rounded-full bg-[linear-gradient(135deg,rgb(var(--acc-100)/0.86),rgb(var(--surface-2)/0.84))] text-center shadow-[0_24px_60px_-38px_var(--acc-glow)] ring-1 ring-[rgb(var(--acc-200)/0.66)] dark:bg-[linear-gradient(135deg,rgb(var(--acc-500)/0.18),rgb(var(--surface-2)/0.74))] dark:ring-[rgb(var(--acc-300)/0.16)]">
              <div>
                <Wind className="mx-auto mb-3 text-[rgb(var(--acc-600))] dark:text-[rgb(var(--acc-200))]" size={30} strokeWidth={2.2} />
                <p className="font-display text-3xl font-semibold text-[rgb(var(--fg))]">{breathActive ? breathLabel : "Ready"}</p>
                <p className="mt-1 text-xs font-bold text-[rgb(var(--muted))]">{pattern.label}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Headphones, label: "Soundscapes", value: `${MUSIC_TRACKS.length} tracks`, tone: "rose" as Tone },
            { icon: Wind, label: "Breath patterns", value: `${BREATHING_PATTERNS.length} guides`, tone: "mint" as Tone },
            { icon: Brain, label: "Meditations", value: `${MEDITATIONS.length} sessions`, tone: "violet" as Tone },
            { icon: CircleDot, label: "Bubble games", value: "Pop + sort", tone: "amber" as Tone },
          ].map(({ icon: Icon, label, value, tone }) => (
            <div key={label} className="rounded-2xl border border-[rgb(var(--border)/0.62)] bg-[rgb(var(--card)/0.64)] p-4 dark:bg-white/[0.04]">
              <span className={cn("mb-3 grid h-10 w-10 place-items-center rounded-2xl ring-1", toneClasses(tone))}>
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{label}</p>
              <p className="mt-1 font-display text-xl font-semibold text-[rgb(var(--fg))]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mb-5 overflow-x-auto rounded-[24px] border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--card)/0.72)] p-1.5 shadow-[0_18px_44px_-38px_rgba(83,48,82,0.42)] backdrop-blur dark:bg-white/[0.05]">
        <div className="grid min-w-[640px] grid-cols-4 gap-1.5 md:min-w-0">
          {TABS.map(({ id, label, description, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-3 rounded-[18px] px-3.5 py-3 text-left transition-all",
                  active
                    ? "bg-[linear-gradient(135deg,rgb(var(--acc-500)),rgb(var(--gend-rgb)))] text-white shadow-[0_16px_34px_-24px_var(--acc-glow)]"
                    : "text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface-2)/0.72)] hover:text-[rgb(var(--fg))] dark:hover:bg-white/[0.06]",
                )}
              >
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1",
                    active ? "bg-white/18 text-white ring-white/16" : "bg-[rgb(var(--surface)/0.72)] text-[rgb(var(--acc-600))] ring-[rgb(var(--border)/0.66)] dark:text-[rgb(var(--acc-200))]",
                  )}
                >
                  <Icon size={18} strokeWidth={2.3} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black">{label}</span>
                  <span className={cn("mt-0.5 hidden truncate text-[11px] font-semibold sm:block", active ? "text-white/78" : "text-[rgb(var(--muted))]")}>
                    {description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {tab === "music" && (
        <div className="space-y-5">
          <AnimatePresence>
            {nowPlaying && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                className="overflow-hidden rounded-[28px] border border-[rgb(var(--border)/0.76)] bg-[rgb(var(--card)/0.86)] shadow-[var(--card-shadow)] dark:bg-[rgb(var(--surface-2)/0.72)]"
                style={{ boxShadow: `0 26px 70px -34px ${nowPlaying.glow}` }}
              >
                <div className="relative p-4 sm:p-5">
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-[0.18]", nowPlaying.gradient)} />
                  <div className="relative flex items-center gap-3">
                    <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-[0_16px_34px_-24px_rgba(0,0,0,0.55)]", nowPlaying.gradient)}>
                      {(() => {
                        const NowPlayingIcon = nowPlaying.icon;
                        return <NowPlayingIcon size={22} strokeWidth={2.4} />;
                      })()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Now playing</p>
                      <p className="mt-1 truncate font-display text-xl font-semibold text-[rgb(var(--fg))]">{nowPlaying.title}</p>
                      <p className="truncate text-sm text-[rgb(var(--muted))]">{nowPlaying.artist}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <a
                        href={`https://www.youtube.com/watch?v=${nowPlaying.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--card)/0.78)] text-[rgb(var(--fg))] transition hover:-translate-y-0.5 hover:border-[rgb(var(--acc-300)/0.70)] dark:bg-white/[0.06]"
                        aria-label={`Open ${nowPlaying.title} on YouTube`}
                      >
                        <ExternalLink size={16} />
                      </a>
                      <button
                        type="button"
                        onClick={() => setNowPlaying(null)}
                        className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--card)/0.78)] text-[rgb(var(--fg))] transition hover:-translate-y-0.5 hover:border-[rgb(var(--acc-300)/0.70)] dark:bg-white/[0.06]"
                        aria-label="Close player"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
                  <iframe
                    key={nowPlaying.id}
                    src={`https://www.youtube-nocookie.com/embed/${nowPlaying.id}?autoplay=1&rel=0&modestbranding=1&color=white`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={nowPlaying.title}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <SectionPanel>
            <PanelHeading
              icon={Headphones}
              label="Sound library"
              title="Pick a calming soundscape"
              description="Filter by mood and open any track in the embedded player."
            />

            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-xs font-black transition-all",
                    activeCategory === category.id
                      ? "border-transparent bg-[linear-gradient(135deg,rgb(var(--acc-500)),rgb(var(--gend-rgb)))] text-white shadow-[0_14px_28px_-22px_var(--acc-glow)]"
                      : "border-[rgb(var(--border)/0.72)] bg-[rgb(var(--card)/0.70)] text-[rgb(var(--muted))] hover:border-[rgb(var(--acc-300)/0.68)] hover:text-[rgb(var(--fg))] dark:bg-white/[0.04]",
                  )}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filteredTracks.map((track) => {
                const TrackIcon = track.icon;
                const isPlaying = nowPlaying?.id === track.id;
                return (
                  <motion.button
                    key={track.id}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setNowPlaying(isPlaying ? null : track)}
                    className={cn(
                      "group overflow-hidden rounded-[24px] border bg-[rgb(var(--card)/0.76)] text-left transition-all hover:-translate-y-1 dark:bg-white/[0.04]",
                      isPlaying
                        ? "border-[rgb(var(--acc-300)/0.72)] ring-4 ring-[rgb(var(--acc-200)/0.22)]"
                        : "border-[rgb(var(--border)/0.70)] hover:border-[rgb(var(--acc-300)/0.54)]",
                    )}
                    style={{ boxShadow: isPlaying ? `0 24px 56px -30px ${track.glow}` : undefined }}
                  >
                    <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
                      <Image
                        src={`https://img.youtube.com/vi/${track.id}/hqdefault.jpg`}
                        alt={track.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 280px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className={cn("absolute inset-0 bg-gradient-to-t opacity-75", track.gradient)} />
                      <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                        <span className="rounded-full bg-black/42 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur">
                          {track.duration}
                        </span>
                        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/18 text-white ring-1 ring-white/20 backdrop-blur">
                          <TrackIcon size={17} strokeWidth={2.4} />
                        </span>
                      </div>
                      <span className="absolute inset-0 grid place-items-center">
                        <span className={cn("grid h-12 w-12 place-items-center rounded-full backdrop-blur transition", isPlaying ? "bg-white text-[rgb(var(--acc-600))]" : "bg-black/42 text-white ring-1 ring-white/24 group-hover:bg-black/56")}>
                          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
                        </span>
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="mb-2 flex items-center gap-2">
                        {isPlaying && <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.16)]" />}
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{track.mood}</p>
                      </div>
                      <p className="font-display text-base font-semibold text-[rgb(var(--fg))]">{track.title}</p>
                      <p className="mt-1 text-xs font-semibold text-[rgb(var(--muted))]">{track.artist}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-[rgb(var(--muted))]">
              <Wifi size={13} /> Streams via YouTube - internet required
            </p>
          </SectionPanel>
        </div>
      )}

      {tab === "breathing" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <SectionPanel>
            <PanelHeading
              icon={Wind}
              label="Breath coach"
              title="Follow the rhythm"
              description="Choose a pattern, then let the animated orb guide your inhale, hold, exhale, and rest."
            />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
              <div className="grid gap-3 sm:grid-cols-2">
                {BREATHING_PATTERNS.map((item, index) => {
                  const active = breathPatternIdx === index;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setBreathPatternIdx(index);
                        setBreathActive(false);
                        setBreathCount(0);
                      }}
                      className={cn(
                        "rounded-[22px] border p-4 text-left transition-all hover:-translate-y-0.5",
                        active
                          ? "border-transparent bg-[linear-gradient(135deg,rgb(var(--acc-500)),rgb(var(--gend-rgb)))] text-white shadow-[0_22px_48px_-32px_var(--acc-glow)]"
                          : "border-[rgb(var(--border)/0.74)] bg-[rgb(var(--card)/0.70)] text-[rgb(var(--fg))] hover:border-[rgb(var(--acc-300)/0.66)] dark:bg-white/[0.04]",
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className={cn("grid h-10 w-10 place-items-center rounded-2xl ring-1", active ? "bg-white/18 text-white ring-white/20" : toneClasses(item.tone))}>
                          <Wind size={18} strokeWidth={2.3} />
                        </span>
                        <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black", active ? "bg-white/16 text-white" : "bg-[rgb(var(--surface)/0.76)] text-[rgb(var(--muted))]")}>
                          {item.inhale}-{item.hold}-{item.exhale}{item.rest > 0 ? `-${item.rest}` : ""}
                        </span>
                      </div>
                      <p className="font-display text-lg font-semibold">{item.label}</p>
                      <p className={cn("mt-1 text-sm leading-5", active ? "text-white/78" : "text-[rgb(var(--muted))]")}>{item.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mx-auto flex flex-col items-center text-center">
                <div className="relative grid h-64 w-64 place-items-center">
                  <motion.div
                    className="absolute rounded-full bg-[radial-gradient(circle,rgb(var(--acc-300)/0.26),transparent_68%)]"
                    style={{ width: 238, height: 238 }}
                    animate={breathActive ? { scale: breathScale * 1.08, opacity: [0.55, 0.22, 0.55] } : { scale: [1, 1.04, 1], opacity: [0.25, 0.45, 0.25] }}
                    transition={{ duration: breathActive ? (breathPhase === "inhale" ? pattern.inhale : breathPhase === "exhale" ? pattern.exhale : 1) : 4, repeat: breathActive ? 0 : Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute rounded-full border border-[rgb(var(--acc-200)/0.70)] dark:border-[rgb(var(--acc-300)/0.16)]"
                    style={{ width: 196, height: 196 }}
                    animate={breathActive ? { scale: breathScale * 1.06 } : { scale: 1 }}
                    transition={{ duration: breathPhase === "inhale" ? pattern.inhale : breathPhase === "exhale" ? pattern.exhale : 0.4, ease: "easeInOut" }}
                  />
                  <motion.div
                    animate={breathActive ? { scale: breathScale } : { scale: 1 }}
                    transition={{ duration: breathPhase === "inhale" ? pattern.inhale : breathPhase === "exhale" ? pattern.exhale : 0.4, ease: "easeInOut" }}
                    className={cn("relative grid h-40 w-40 place-items-center rounded-full bg-gradient-to-br text-white shadow-[0_26px_60px_-34px_var(--acc-glow)]", pattern.gradient)}
                  >
                    <div>
                      <p className="font-display text-2xl font-semibold">{breathActive ? breathLabel : "Ready"}</p>
                      <p className="mt-1 text-3xl font-semibold tabular-nums">{breathActive ? breathTick : pattern.inhale}</p>
                    </div>
                  </motion.div>
                </div>
                <p className="font-display text-xl font-semibold text-[rgb(var(--fg))]">{pattern.label}</p>
                <p className="mt-1 text-sm text-[rgb(var(--muted))]">{pattern.description}</p>
                <Button
                  className="mt-5 gap-2 px-8"
                  onClick={() => {
                    setBreathActive((active) => !active);
                    if (breathActive) setBreathCount(0);
                  }}
                >
                  {breathActive ? (
                    <>
                      <Pause size={16} /> Stop
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="currentColor" /> Start
                    </>
                  )}
                </Button>
                {breathCount > 0 && (
                  <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-sm font-semibold text-[rgb(var(--muted))]">
                    {breathCount} complete breath{breathCount !== 1 ? "s" : ""}
                  </motion.p>
                )}
              </div>
            </div>
          </SectionPanel>

          <SectionPanel>
            <PanelHeading icon={HeartPulse} label="Why it helps" title="A softer nervous system" />
            <div className="space-y-3">
              {[
                "Activates the parasympathetic nervous system.",
                "Reduces cortisol, especially useful in luteal phase.",
                "Eases menstrual cramps by relaxing abdominal tension.",
                "Improves heart rate variability and emotional regulation.",
              ].map((benefit) => (
                <div key={benefit} className="flex gap-3 rounded-2xl border border-[rgb(var(--border)/0.58)] bg-[rgb(var(--card)/0.58)] p-3 dark:bg-white/[0.04]">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={17} />
                  <p className="text-sm leading-6 text-[rgb(var(--fg))]">{benefit}</p>
                </div>
              ))}
            </div>
          </SectionPanel>
        </div>
      )}

      {tab === "meditation" && (
        <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          <SectionPanel>
            <PanelHeading icon={Timer} label="Timer" title="Meditation timer" description="Pick a duration and settle into a short practice." />

            <div className="mb-6 flex flex-wrap gap-2">
              {[5, 10, 15, 20].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => {
                    setMeditationTotal(minutes * 60);
                    setMeditationTimer(0);
                    setMeditationRunning(false);
                    setActiveSession(null);
                  }}
                  className={cn(
                    "rounded-2xl border px-4 py-2 text-sm font-black transition-all",
                    meditationTotal === minutes * 60
                      ? "border-transparent bg-[linear-gradient(135deg,rgb(var(--acc-500)),rgb(var(--gend-rgb)))] text-white shadow-[0_14px_28px_-22px_var(--acc-glow)]"
                      : "border-[rgb(var(--border)/0.72)] bg-[rgb(var(--card)/0.70)] text-[rgb(var(--muted))] hover:border-[rgb(var(--acc-300)/0.66)] hover:text-[rgb(var(--fg))] dark:bg-white/[0.04]",
                  )}
                >
                  {minutes} min
                </button>
              ))}
            </div>

            <div className="mb-6 flex justify-center">
              <div className="relative h-44 w-44">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="rgb(var(--border) / 0.54)" strokeWidth="7" />
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="url(#meditationGradient)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - meditationPercent / 100)}
                    style={{ transition: "stroke-dashoffset 1s linear", filter: "drop-shadow(0 0 8px rgba(226,55,111,0.34))" }}
                  />
                  <defs>
                    <linearGradient id="meditationGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgb(var(--acc-500))" />
                      <stop offset="100%" stopColor="rgb(var(--gend-rgb))" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="font-display text-4xl font-semibold text-[rgb(var(--fg))] tabular-nums">{formatClock(meditationRemaining)}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">remaining</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1 gap-2" onClick={() => setMeditationRunning((running) => !running)}>
                {meditationRunning ? (
                  <>
                    <Pause size={16} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" /> {meditationTimer > 0 ? "Resume" : "Start"}
                  </>
                )}
              </Button>
              {meditationTimer > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setMeditationTimer(0);
                    setMeditationRunning(false);
                    setActiveSession(null);
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
            {activeSession && (
              <p className="mt-4 rounded-2xl bg-[rgb(var(--surface)/0.62)] px-4 py-3 text-center text-xs font-semibold text-[rgb(var(--muted))] dark:bg-white/[0.04]">
                Session: <span className="text-[rgb(var(--fg))]">{activeSession}</span>
              </p>
            )}
          </SectionPanel>

          <SectionPanel>
            <PanelHeading icon={Brain} label="Guided sessions" title="Choose a practice" description="Short sessions designed for cramps, PMS, sleep, and softer mornings." />

            <div className="grid gap-3 md:grid-cols-2">
              {MEDITATIONS.map((session) => {
                const SessionIcon = session.icon;
                return (
                  <motion.div
                    key={session.title}
                    whileTap={{ scale: 0.99 }}
                    className="flex items-center gap-4 rounded-[22px] border border-[rgb(var(--border)/0.68)] bg-[rgb(var(--card)/0.66)] p-4 dark:bg-white/[0.04]"
                  >
                    <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1", toneClasses(session.tone))}>
                      <SessionIcon size={20} strokeWidth={2.3} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-semibold text-[rgb(var(--fg))]">{session.title}</p>
                      <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{session.description}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-xs font-black text-[rgb(var(--muted))] tabular-nums">{session.duration} min</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMeditationTotal(session.duration * 60);
                          setMeditationTimer(0);
                          setMeditationRunning(true);
                          setActiveSession(session.title);
                          setTab("meditation");
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-2xl bg-[linear-gradient(135deg,rgb(var(--acc-500)),rgb(var(--gend-rgb)))] px-3 text-xs font-black text-white shadow-[0_12px_24px_-18px_var(--acc-glow)] transition hover:-translate-y-0.5"
                      >
                        <Play size={11} fill="currentColor" /> Start
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </SectionPanel>
        </div>
      )}

      {tab === "play" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 rounded-[24px] border border-[rgb(var(--border)/0.68)] bg-[rgb(var(--card)/0.70)] p-2 shadow-[0_18px_44px_-38px_rgba(83,48,82,0.42)] backdrop-blur dark:bg-white/[0.05]">
            {[
              { id: "pop" as PlayGame, label: "Mindful Pop", description: "Slow floating bubbles" },
              { id: "sort" as PlayGame, label: "Bubble Sort", description: "Short color puzzle" },
            ].map(({ id, label, description }) => {
              const active = playGame === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlayGame(id)}
                  className={cn(
                    "flex min-w-[180px] flex-1 items-center gap-3 rounded-[18px] px-4 py-3 text-left transition-all",
                    active
                      ? "bg-[linear-gradient(135deg,rgb(var(--acc-500)),rgb(var(--gend-rgb)))] text-white shadow-[0_18px_34px_-24px_var(--acc-glow)]"
                      : "text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface-2)/0.72)] hover:text-[rgb(var(--fg))] dark:hover:bg-white/[0.06]",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1",
                      active ? "bg-white/18 text-white ring-white/18" : "bg-[rgb(var(--surface)/0.72)] text-[rgb(var(--acc-600))] ring-[rgb(var(--border)/0.66)] dark:text-[rgb(var(--acc-200))]",
                    )}
                  >
                    <CircleDot size={18} strokeWidth={2.4} />
                  </span>
                  <span>
                    <span className="block text-sm font-black">{label}</span>
                    <span className={cn("mt-0.5 block text-[11px] font-semibold", active ? "text-white/78" : "text-[rgb(var(--muted))]")}>{description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {playGame === "pop" ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <SectionPanel className="overflow-hidden p-0">
            <div className="relative overflow-hidden rounded-[inherit] bg-[linear-gradient(135deg,rgb(var(--card)/0.94),rgb(var(--acc-50)/0.58),rgb(var(--surface-2)/0.76))] p-5 dark:bg-[linear-gradient(135deg,rgb(var(--surface-2)/0.90),rgba(35,56,66,0.58),rgb(var(--surface)/0.84))] sm:p-6">
              <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-sky-300/18 blur-3xl" />
              <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-300/18 blur-3xl" />
              <div className="pointer-events-none absolute bottom-4 right-20 h-44 w-44 rounded-full bg-rose-300/16 blur-3xl" />

              <div className="relative">
                <PanelHeading
                  icon={CircleDot}
                  label="Bubble game"
                  title="Mindful Pop"
                  description="A soft, pressure-free bubble field for settling your attention."
                />

                <div className="mb-5 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Popped", value: bubblesPopped },
                    { label: "Calm time", value: formatClock(bubbleSeconds) },
                    { label: "State", value: bubbleState },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-[rgb(var(--border)/0.58)] bg-[rgb(var(--card)/0.68)] p-4 text-center shadow-[0_16px_34px_-30px_rgba(83,48,82,0.30)] dark:bg-white/[0.045]">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{stat.label}</p>
                      <p className="mt-1 font-display text-2xl font-semibold text-[rgb(var(--fg))] tabular-nums">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div
                  role="group"
                  aria-label="Mindful bubble pop game"
                  className="relative min-h-[380px] overflow-hidden rounded-[30px] border border-[rgb(var(--border)/0.70)] bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.84),transparent_28%),radial-gradient(circle_at_78%_16%,rgba(186,230,253,0.38),transparent_25%),linear-gradient(145deg,rgba(240,249,255,0.88),rgba(245,243,255,0.76),rgba(236,253,245,0.78))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_26px_64px_-46px_rgba(83,48,82,0.48)] dark:bg-[radial-gradient(circle_at_20%_16%,rgba(255,255,255,0.10),transparent_27%),radial-gradient(circle_at_80%_18%,rgba(56,189,248,0.17),transparent_25%),linear-gradient(145deg,rgba(24,39,52,0.94),rgba(35,25,48,0.88),rgba(25,44,44,0.80))] sm:min-h-[460px]"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-[0.30] [background-image:radial-gradient(circle_at_center,rgb(var(--fg)/0.14)_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.10]" />
                  <div className="pointer-events-none absolute inset-x-8 bottom-6 h-24 rounded-full bg-white/24 blur-2xl dark:bg-white/[0.04]" />

                  {BUBBLE_FLOATERS.map((floater) => (
                    <motion.span
                      key={`${floater.left}-${floater.top}`}
                      className="pointer-events-none absolute rounded-full bg-white/70 shadow-[0_0_24px_rgba(255,255,255,0.42)] dark:bg-white/18"
                      style={{ left: floater.left, top: floater.top, width: floater.size, height: floater.size }}
                      animate={{ y: [-8, 10, -8], x: [0, 8, 0], opacity: [0.35, 0.78, 0.35] }}
                      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: floater.delay }}
                    />
                  ))}

                  <AnimatePresence initial={false}>
                    {bubbles.map((bubble) => {
                      const styles = bubbleToneClasses(bubble.tone);
                      return (
                        <motion.div
                          key={bubble.id}
                          className="absolute"
                          style={{
                            left: `${bubble.x}%`,
                            top: `${bubble.y}%`,
                            width: bubble.size,
                            height: bubble.size,
                            transform: "translate(-50%, -50%)",
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, filter: "blur(6px)" }}
                          transition={{ duration: 0.38, ease: "easeOut" }}
                        >
                          <motion.button
                            type="button"
                            aria-label="Pop calming bubble"
                            onClick={() => popBubble(bubble.id)}
                            whileTap={{ scale: 0.9 }}
                            animate={{ x: [0, bubble.drift, 0], y: [0, -14, 0], scale: [0.97, 1.06, 0.97] }}
                            transition={{ duration: bubble.duration, repeat: Infinity, ease: "easeInOut", delay: bubble.delay }}
                            className={cn(
                              "group relative grid h-full w-full place-items-center overflow-hidden rounded-full bg-gradient-to-br ring-1 outline-none transition focus-visible:ring-4 focus-visible:ring-white/80",
                              styles.fill,
                              styles.ring,
                            )}
                            style={{
                              opacity: bubble.opacity,
                              boxShadow: `0 18px ${Math.round(bubble.size * 0.56)}px -22px ${styles.glow}, inset 10px 12px 22px rgba(255,255,255,0.62), inset -14px -16px 28px rgba(255,255,255,0.18)`,
                            }}
                          >
                            <span className="absolute left-[18%] top-[16%] h-[24%] w-[24%] rounded-full bg-white/72 blur-[1px]" />
                            <span className="absolute right-[18%] top-[30%] h-[10%] w-[10%] rounded-full bg-white/50" />
                            <Sparkles className={cn("relative opacity-60 transition group-hover:opacity-90", styles.sparkle)} size={Math.max(13, bubble.size * 0.18)} strokeWidth={2.5} />
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <Button variant="outline" className="gap-2" onClick={resetBubbles}>
                    <RotateCcw size={15} /> Reset bubbles
                  </Button>
                  <p className="flex items-center gap-1.5 text-center text-xs font-semibold text-[rgb(var(--muted))]">
                    <CircleDot size={13} /> No timer goal, no win state
                  </p>
                </div>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel>
            <PanelHeading icon={Sparkles} label="Why it helps" title="Relaxed visual grounding" />
            <div className="mb-5 rounded-[24px] border border-[rgb(var(--border)/0.60)] bg-[rgb(var(--card)/0.62)] p-4 dark:bg-white/[0.04]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Calm flow</p>
                <p className="text-sm font-black text-[rgb(var(--fg))]">{bubbleProgress}%</p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[rgb(var(--surface)/0.78)] dark:bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,rgb(var(--gend-rgb)),#34d399)]"
                  animate={{ width: `${bubbleProgress}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                />
              </div>
            </div>
            <div className="space-y-3">
              {[
                "Slow motion gives your eyes a soft place to rest.",
                "Simple tapping can interrupt anxious looping without pressure.",
                "The field refreshes gently, so there is nothing to complete.",
                "Short visual pauses can support cramp and PMS self-soothing.",
              ].map((benefit) => (
                <div key={benefit} className="flex gap-3 rounded-2xl border border-[rgb(var(--border)/0.58)] bg-[rgb(var(--card)/0.58)] p-3 dark:bg-white/[0.04]">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-[rgb(var(--acc-500))]" size={17} />
                  <p className="text-sm leading-6 text-[rgb(var(--fg))]">{benefit}</p>
                </div>
              ))}
            </div>
          </SectionPanel>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <SectionPanel className="overflow-hidden p-0">
                <div className="relative overflow-hidden rounded-[inherit] bg-[linear-gradient(135deg,rgb(var(--card)/0.94),rgb(var(--acc-50)/0.58),rgb(var(--surface-2)/0.76))] p-5 dark:bg-[linear-gradient(135deg,rgb(var(--surface-2)/0.90),rgba(35,56,66,0.58),rgb(var(--surface)/0.84))] sm:p-6">
                  <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-violet-300/16 blur-3xl" />
                  <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-300/18 blur-3xl" />

                  <div className="relative">
                    <PanelHeading
                      icon={CircleDot}
                      label="Bubble sort"
                      title="Bubble Sort"
                      description="Move one top bubble at a time into matching tubes. Short, tidy, and pressure-free."
                    />

                    <div className="mb-5 flex flex-wrap gap-2">
                      {SORT_TONES.map((tone) => {
                        const styles = sortBubbleStyles(tone);
                        return (
                          <span
                            key={tone}
                            className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border)/0.58)] bg-[rgb(var(--card)/0.64)] px-3 py-1.5 text-[11px] font-black text-[rgb(var(--muted))] dark:bg-white/[0.04]"
                          >
                            <span
                              className="grid h-4 w-4 place-items-center rounded-full border text-[7px] leading-none"
                              style={{ background: styles.background, borderColor: styles.border, color: styles.foreground }}
                            >
                              {styles.label}
                            </span>
                            {styles.name}
                          </span>
                        );
                      })}
                    </div>

                    <div className="mb-5 grid gap-3 sm:grid-cols-3">
                      {[
                        { label: "Moves", value: sortMoves },
                        { label: "Sorted", value: `${sortSolvedTubes}/${SORT_TONES.length}` },
                        { label: "State", value: sortState },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-2xl border border-[rgb(var(--border)/0.58)] bg-[rgb(var(--card)/0.68)] p-4 text-center shadow-[0_16px_34px_-30px_rgba(83,48,82,0.30)] dark:bg-white/[0.045]">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{stat.label}</p>
                          <p className="mt-1 font-display text-2xl font-semibold text-[rgb(var(--fg))] tabular-nums">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {sortSolved && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="mb-5 rounded-[24px] border border-emerald-300/45 bg-emerald-100/62 p-4 text-center text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100"
                      >
                        <CheckCircle2 size={28} className="mx-auto mb-2" />
                        <p className="font-display text-xl font-semibold">All bubbles sorted</p>
                        <p className="mt-1 text-sm font-semibold">{sortMoves} gentle moves</p>
                      </motion.div>
                    )}

                    <div
                      role="group"
                      aria-label="Bubble sort tubes"
                      className="flex min-h-[360px] flex-wrap items-end justify-center gap-3 rounded-[30px] border border-[rgb(var(--border)/0.70)] bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.84),transparent_28%),radial-gradient(circle_at_78%_16%,rgba(186,230,253,0.32),transparent_25%),linear-gradient(145deg,rgba(240,249,255,0.84),rgba(245,243,255,0.74),rgba(236,253,245,0.76))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_26px_64px_-46px_rgba(83,48,82,0.48)] dark:bg-[radial-gradient(circle_at_20%_16%,rgba(255,255,255,0.10),transparent_27%),radial-gradient(circle_at_80%_18%,rgba(56,189,248,0.15),transparent_25%),linear-gradient(145deg,rgba(24,39,52,0.94),rgba(35,25,48,0.88),rgba(25,44,44,0.80))] sm:min-h-[430px] sm:gap-4"
                    >
                      {sortTubes.map((tube, tubeIndex) => {
                        const selected = selectedTube === tubeIndex;
                        const canReceive = selectedTube !== null && canMoveSortBubble(sortTubes, selectedTube, tubeIndex);

                        return (
                          <button
                            key={tubeIndex}
                            type="button"
                            onClick={() => handleSortTubeClick(tubeIndex)}
                            disabled={sortSolved}
                            aria-label={`Bubble sort tube ${tubeIndex + 1}`}
                            className={cn(
                              "group flex flex-col items-center gap-2 rounded-[26px] p-2 outline-none transition focus-visible:ring-4 focus-visible:ring-[rgb(var(--acc-200)/0.44)] disabled:cursor-default",
                              selected
                                ? "bg-[rgb(var(--acc-100)/0.74)] ring-2 ring-[rgb(var(--acc-400)/0.68)] dark:bg-white/[0.08]"
                                : canReceive
                                  ? "bg-emerald-100/62 ring-2 ring-emerald-300/60 dark:bg-emerald-400/[0.08] dark:ring-emerald-300/26"
                                  : "hover:bg-white/42 dark:hover:bg-white/[0.05]",
                            )}
                          >
                            <div className="flex h-64 w-20 flex-col justify-end gap-2 rounded-b-[34px] rounded-t-[18px] border border-[rgb(var(--border)/0.72)] bg-white/42 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_18px_36px_-30px_rgba(83,48,82,0.48)] dark:bg-white/[0.04] sm:w-24">
                              {Array.from({ length: SORT_CAPACITY }).map((_, slotIndex) => {
                                const tone = tube[SORT_CAPACITY - 1 - slotIndex];
                                const styles = tone ? sortBubbleStyles(tone) : sortBubbleStyles("rose");
                                return (
                                  <div key={slotIndex} className="grid h-11 place-items-center">
                                    {tone ? (
                                      <motion.span
                                        layout
                                        className="relative grid h-11 w-11 place-items-center rounded-full border text-[10px] font-black shadow-sm"
                                        style={{
                                          background: styles.background,
                                          borderColor: styles.border,
                                          boxShadow: `0 14px 30px -18px ${styles.glow}, inset 8px 9px 16px rgba(255,255,255,0.38), inset -10px -12px 18px rgba(0,0,0,0.14)`,
                                          color: styles.foreground,
                                        }}
                                      >
                                        <span className="absolute left-[18%] top-[15%] h-2.5 w-2.5 rounded-full bg-white/54 blur-[0.5px]" />
                                        <span className="relative drop-shadow-sm">{styles.label}</span>
                                        <span className="sr-only">{styles.name}</span>
                                      </motion.span>
                                    ) : (
                                      <span className="block h-11 w-11 rounded-full border border-dashed border-[rgb(var(--border)/0.55)] bg-white/22 dark:bg-white/[0.03]" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                              Tube {tubeIndex + 1}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                      <Button variant="outline" className="gap-2" onClick={resetSort}>
                        <RotateCcw size={15} /> New sort
                      </Button>
                      <p className="flex items-center gap-1.5 text-center text-xs font-semibold text-[rgb(var(--muted))]">
                        <CircleDot size={13} /> Tap a source tube, then a matching or empty tube
                      </p>
                    </div>
                  </div>
                </div>
              </SectionPanel>

              <SectionPanel>
                <PanelHeading icon={Sparkles} label="Why it helps" title="Short calming focus" />
                <div className="mb-5 rounded-[24px] border border-[rgb(var(--border)/0.60)] bg-[rgb(var(--card)/0.62)] p-4 dark:bg-white/[0.04]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Sorted flow</p>
                    <p className="text-sm font-black text-[rgb(var(--fg))]">{sortProgress}%</p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[rgb(var(--surface)/0.78)] dark:bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,rgb(var(--gend-rgb)),#34d399)]"
                      animate={{ width: `${sortProgress}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 18 }}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    "A tiny sorting task gives busy thoughts one simple track.",
                    "Matching colors is satisfying without adding time pressure.",
                    "Valid moves keep the puzzle gentle and easy to understand.",
                    "The short format works well for quick mood resets.",
                  ].map((benefit) => (
                    <div key={benefit} className="flex gap-3 rounded-2xl border border-[rgb(var(--border)/0.58)] bg-[rgb(var(--card)/0.58)] p-3 dark:bg-white/[0.04]">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-[rgb(var(--acc-500))]" size={17} />
                      <p className="text-sm leading-6 text-[rgb(var(--fg))]">{benefit}</p>
                    </div>
                  ))}
                </div>
              </SectionPanel>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

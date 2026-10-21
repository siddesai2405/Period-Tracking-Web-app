"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  Check,
  CloudRain,
  Droplets,
  Flame,
  HeartPulse,
  Moon,
  PenLine,
  Save,
  Smile,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { today } from "@/lib/store";
import type { Flow, Mood } from "@/lib/store";
import { useUserData } from "@/lib/hooks/useUserData";
import { FLOWS, MOODS, SYMPTOMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";
import { burstConfetti } from "@/lib/confetti";

const moodIcons: Record<Exclude<Mood, null>, LucideIcon> = {
  happy: Smile,
  calm: Moon,
  energetic: Zap,
  sad: CloudRain,
  anxious: Activity,
  irritable: Flame,
};

const flowTone: Record<Exclude<Flow, null>, string> = {
  spotting: "bg-rose-200 text-rose-800",
  light: "bg-rose-300 text-rose-900",
  medium: "bg-rose-500 text-white",
  heavy: "bg-rose-700 text-white",
};

export default function LogPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { logs, upsertLog } = useUserData();
  const push = useToast((state) => state.push);

  const [date, setDate] = useState(today());
  const [flow, setFlow] = useState<Flow>(null);
  const [mood, setMood] = useState<Mood>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [sleep, setSleep] = useState<number | "">("");
  const [water, setWater] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const existing = logs[date];
    if (existing) {
      setFlow(existing.flow);
      setMood(existing.mood);
      setSymptoms(existing.symptoms);
      setSleep(existing.sleepHrs ?? "");
      setWater(existing.waterCups ?? "");
      setNotes(existing.notes ?? "");
      return;
    }

    setFlow(null);
    setMood(null);
    setSymptoms([]);
    setSleep("");
    setWater("");
    setNotes("");
  }, [date, logs]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - index);
      const key = dateKey(d);
      return { key, date: d, log: logs[key] };
    });
  }, [logs]);

  if (!mounted) return null;

  const selectedLog = logs[date];
  const completion = [flow, mood, symptoms.length > 0, sleep !== "", water !== "", notes.trim().length > 0].filter(Boolean).length;
  const completionPct = Math.round((completion / 6) * 100);

  const toggleSymptom = (symptom: string) => {
    setSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom],
    );
  };

  const save = async () => {
    setSaving(true);
    await upsertLog({
      date,
      flow,
      mood,
      symptoms,
      sleepHrs: sleep === "" ? undefined : Number(sleep),
      waterCups: water === "" ? undefined : Number(water),
      notes: notes.trim() || undefined,
    });
    setSaving(false);
    burstConfetti();
    push({ title: "Log saved", description: "Your daily health note is updated.", tone: "success" });
  };

  return (
    <div>
      <Topbar title="Daily log" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]"
      >
        <section className="section-panel overflow-hidden p-0">
          <div className="hero-clean-surface relative overflow-hidden p-5 sm:p-6">
            <div className="hero-clean-glow pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl" />
            <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <Badge tone="rose">
                  <PenLine size={13} />
                  Daily check-in
                </Badge>
                <h1 className="mt-3 font-display text-3xl font-semibold tracking-normal text-[rgb(var(--fg))] sm:text-5xl">
                  How are you feeling today?
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">
                  Capture the small details that shape your cycle predictions: flow, mood, symptoms, sleep, hydration, and notes.
                </p>
              </div>

              <div className="min-w-[220px] rounded-[24px] border border-white/70 bg-white/62 p-4 shadow-[0_18px_42px_-30px_rgba(88,54,84,0.45)] dark:border-white/10 dark:bg-white/[0.055]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Completion</span>
                  <span className="text-sm font-black text-[rgb(var(--fg))]">{completionPct}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/80 ring-1 ring-black/[0.04] dark:bg-white/[0.08] dark:ring-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPct}%` }}
                    className="h-full rounded-full bg-brand-gradient"
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">
                  {selectedLog ? "This day already has a saved log." : "Fill what you know. You can update this later."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-7 p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)] md:items-end">
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} max={today()} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <MiniStatus icon={Waves} label="Flow" active={flow !== null} />
                <MiniStatus icon={Smile} label="Mood" active={mood !== null} />
                <MiniStatus icon={Sparkles} label="Symptoms" active={symptoms.length > 0} />
              </div>
            </div>

            <LogSection icon={Waves} title="Flow" description="How heavy is bleeding today?">
              <div className="grid gap-2 sm:grid-cols-5">
                <ChoiceButton active={flow === null} onClick={() => setFlow(null)}>
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  None
                </ChoiceButton>
                {FLOWS.map((item) => (
                  <ChoiceButton key={item.id} active={flow === item.id} onClick={() => setFlow(item.id as Flow)}>
                    <span className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
                    {item.label}
                  </ChoiceButton>
                ))}
              </div>
            </LogSection>

            <LogSection icon={HeartPulse} title="Mood" description="Pick the closest match for the day.">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                {MOODS.map((item) => {
                  const id = item.id as Exclude<Mood, null>;
                  const Icon = moodIcons[id];
                  const active = mood === id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMood(id)}
                      className={cn(
                        "group rounded-[22px] border p-3 text-left transition-all hover:-translate-y-0.5",
                        active
                          ? "border-transparent bg-brand-gradient text-white shadow-[0_18px_42px_-28px_var(--acc-glow)]"
                          : "border-[rgb(var(--border))] bg-[rgb(var(--card)/0.62)] text-[rgb(var(--fg))] hover:border-[rgb(var(--acc-200))]",
                      )}
                    >
                      <span className={cn("mb-3 grid h-10 w-10 place-items-center rounded-2xl", active ? "bg-white/22 text-white" : "bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]")}>
                        <Icon size={18} />
                      </span>
                      <span className="block text-sm font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </LogSection>

            <LogSection icon={Sparkles} title="Symptoms" description="Tap all that apply.">
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS.map((symptom) => (
                  <ChoiceButton key={symptom} active={symptoms.includes(symptom)} onClick={() => toggleSymptom(symptom)}>
                    {symptoms.includes(symptom) && <Check size={14} />}
                    {symptom}
                  </ChoiceButton>
                ))}
              </div>
            </LogSection>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Sleep hours</Label>
                <Input
                  type="number"
                  min={0}
                  max={16}
                  step={0.5}
                  value={sleep}
                  onChange={(event) => setSleep(event.target.value === "" ? "" : Number(event.target.value))}
                  placeholder="e.g. 7.5"
                />
              </div>
              <div>
                <Label>Water cups</Label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={water}
                  onChange={(event) => setWater(event.target.value === "" ? "" : Number(event.target.value))}
                  placeholder="e.g. 8"
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Energy, cravings, pain, medication, or anything else worth remembering..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-[140px]"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-[rgb(var(--border))] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-[rgb(var(--muted))]">
                Daily logs improve cycle predictions, symptom insights, and wellness suggestions.
              </p>
              <Button onClick={save} size="lg" disabled={saving}>
                <Save size={16} />
                {saving ? "Saving..." : "Save log"}
              </Button>
            </div>
          </div>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-[104px] xl:self-start">
          <div className="section-panel p-5">
            <div className="mb-4 flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
                <CalendarDays size={19} />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">This week</h2>
                <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">Select a recent day to view or edit.</p>
              </div>
            </div>

            <div className="space-y-2">
              {weekDays.map(({ key, date: day, log }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDate(key)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-[22px] border px-4 py-3 text-left transition-all",
                    date === key
                      ? "border-transparent bg-brand-gradient text-white shadow-[0_18px_42px_-30px_var(--acc-glow)]"
                      : "border-[rgb(var(--border))] bg-[rgb(var(--card)/0.58)] text-[rgb(var(--fg))] hover:border-[rgb(var(--acc-200))]",
                  )}
                >
                  <span>
                    <span className="block text-sm font-bold">{day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                    <span className={cn("mt-0.5 block text-xs", date === key ? "text-white/78" : "text-[rgb(var(--muted))]")}>
                      {log ? `${log.symptoms.length} symptoms - ${log.flow ?? "no flow"}` : "No log"}
                    </span>
                  </span>
                  {log ? (
                    <span className={cn("grid h-8 w-8 place-items-center rounded-full", date === key ? "bg-white/22 text-white" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200")}>
                      <Check size={15} />
                    </span>
                  ) : (
                    <span className={cn("grid h-8 w-8 place-items-center rounded-full", date === key ? "bg-white/16 text-white" : "bg-[rgb(var(--surface))] text-[rgb(var(--muted))]")}>
                      <PenLine size={14} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="section-panel p-5">
            <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Today summary</h2>
            <div className="mt-4 grid gap-2">
              <SummaryRow icon={Waves} label="Flow" value={flow ? labelFor(FLOWS, flow) : "None"} tone={flow ? flowTone[flow] : undefined} />
              <SummaryRow icon={HeartPulse} label="Mood" value={mood ? labelFor(MOODS, mood) : "Not set"} />
              <SummaryRow icon={Droplets} label="Water" value={water === "" ? "Not set" : `${water} cups`} />
              <SummaryRow icon={Moon} label="Sleep" value={sleep === "" ? "Not set" : `${sleep} hours`} />
            </div>
            <Link href="/calendar" className="mt-4 block">
              <Button variant="soft" className="w-full">
                <CalendarDays size={16} />
                View calendar
              </Button>
            </Link>
          </div>
        </aside>
      </motion.div>
    </div>
  );
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function labelFor<T extends readonly { id: string; label: string }[]>(items: T, id: string) {
  return items.find((item) => item.id === id)?.label ?? id;
}

function LogSection({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
          <Icon size={17} />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-[rgb(var(--fg))]">{title}</h2>
          <p className="text-xs leading-5 text-[rgb(var(--muted))]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition-all hover:-translate-y-0.5",
        active
          ? "border-transparent bg-brand-gradient text-white shadow-[0_18px_42px_-30px_var(--acc-glow)]"
          : "border-[rgb(var(--border))] bg-[rgb(var(--card)/0.62)] text-[rgb(var(--fg))] hover:border-[rgb(var(--acc-200))]",
      )}
    >
      {children}
    </button>
  );
}

function MiniStatus({ icon: Icon, label, active }: { icon: LucideIcon; label: string; active: boolean }) {
  return (
    <div className={cn("rounded-[20px] border p-3", active ? "border-[rgb(var(--acc-200))] bg-[rgb(var(--acc-50))] dark:border-[rgb(var(--acc-400)/0.25)] dark:bg-[rgb(var(--acc-500)/0.12)]" : "border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.5)]")}>
      <Icon className={active ? "text-[rgb(var(--acc-600))] dark:text-[rgb(var(--acc-200))]" : "text-[rgb(var(--muted))]"} size={17} />
      <p className="mt-2 text-xs font-bold text-[rgb(var(--fg))]">{label}</p>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] bg-[rgb(var(--surface)/0.54)] p-3">
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-2xl", tone ?? "bg-white/70 text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]")}>
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">{label}</span>
        <span className="block truncate text-sm font-bold text-[rgb(var(--fg))]">{value}</span>
      </span>
    </div>
  );
}

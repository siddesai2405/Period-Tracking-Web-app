"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/topbar";
import { useUserData } from "@/lib/hooks/useUserData";
import { calculatePCOSRisk, pcosQuestions, type PCOSResult } from "@/lib/ai/pcos";
import { cn } from "@/lib/utils";

type Step = "intro" | "quiz" | "result";

export default function PCOSPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { pcosProfile, setPCOSAnswers } = useUserData();
  const [step, setStep] = useState<Step>("intro");
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>(pcosProfile.answers ?? {});
  const [result, setResult] = useState<PCOSResult | null>(null);
  const [expanded, setExpanded] = useState<string | null>("doctor");

  const hasExisting = Object.keys(pcosProfile.answers).length > 0;
  const progress = ((qIdx + 1) / pcosQuestions.length) * 100;
  const currentQuestion = pcosQuestions[qIdx];

  const introCards = useMemo(
    () => [
      { icon: ClipboardList, title: "12 focused questions", detail: "Cycle regularity, skin, hair, cravings, energy, and family history." },
      { icon: ShieldCheck, title: "Awareness only", detail: "This does not diagnose PCOS. It helps you prepare for a doctor visit." },
      { icon: HeartPulse, title: "Actionable next steps", detail: "You get lifestyle pointers and care prompts based on the result." },
    ],
    [],
  );

  if (!mounted) return null;

  const handleAnswer = async (score: number) => {
    const question = pcosQuestions[qIdx];
    const next = { ...answers, [question.id]: score };
    setAnswers(next);

    if (qIdx < pcosQuestions.length - 1) {
      setQIdx(qIdx + 1);
      return;
    }

    const risk = calculatePCOSRisk(next);
    await setPCOSAnswers(next);
    setResult(risk);
    setStep("result");
  };

  const restart = () => {
    setAnswers({});
    setQIdx(0);
    setResult(null);
    setExpanded("doctor");
    setStep("quiz");
  };

  const viewSaved = () => {
    const risk = calculatePCOSRisk(pcosProfile.answers);
    setAnswers(pcosProfile.answers);
    setResult(risk);
    setStep("result");
  };

  return (
    <div>
      <Topbar title="PCOS & Hormonal Health" />

      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.34 }}
            className="space-y-6"
          >
            <section className="section-panel overflow-hidden p-0">
              <div className="hero-clean-surface relative overflow-hidden p-5 sm:p-7">
                <div className="hero-clean-glow pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl" />
                <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
                  <div>
                    <Badge tone="lavender">
                      <Stethoscope size={13} />
                      Hormonal awareness
                    </Badge>
                    <h1 className="mt-3 font-display text-3xl font-semibold tracking-normal text-[rgb(var(--fg))] sm:text-5xl">
                      PCOS risk assessment, made clearer.
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">
                      Answer a short evidence-informed questionnaire and get a calm, readable awareness result with practical next steps.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button onClick={restart} size="lg">
                        Start assessment
                        <ChevronRight size={17} />
                      </Button>
                      {hasExisting && (
                        <Button variant="outline" onClick={viewSaved} size="lg">
                          View last result
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/70 bg-white/62 p-5 shadow-[0_24px_64px_-42px_rgba(87,52,84,0.55)] dark:border-white/10 dark:bg-white/[0.06]">
                    <div className="grid h-16 w-16 place-items-center rounded-[24px] bg-brand-gradient text-white shadow-[0_18px_42px_-24px_var(--acc-glow)]">
                      <Sparkles size={28} />
                    </div>
                    <p className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Important note</p>
                    <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]">
                      This tool is educational and cannot replace medical diagnosis, labs, ultrasound, or a qualified clinician.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              {introCards.map(({ icon: Icon, title, detail }) => (
                <div key={title} className="section-panel p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
                    <Icon size={19} />
                  </span>
                  <h2 className="mt-4 font-display text-lg font-semibold text-[rgb(var(--fg))]">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{detail}</p>
                </div>
              ))}
            </section>

            <section className="section-panel p-5 sm:p-6">
              <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Common signs to watch</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  "Irregular or absent periods",
                  "Acne or very oily skin",
                  "Excess hair growth",
                  "Hair thinning on scalp",
                  "Unexplained weight gain",
                  "Energy crashes after meals",
                  "Dark skin patches",
                  "Intense carb cravings",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 rounded-2xl bg-[rgb(var(--surface)/0.54)] p-3 text-sm text-[rgb(var(--fg))]">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[rgb(var(--acc-500))]" />
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {step === "quiz" && (
          <motion.div
            key={`quiz-${qIdx}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28 }}
            className="mx-auto max-w-4xl space-y-5"
          >
            <section className="section-panel p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => (qIdx > 0 ? setQIdx(qIdx - 1) : setStep("intro"))}
                  className="grid h-11 w-11 place-items-center rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card)/0.62)] text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--card)/0.9)]"
                  aria-label="Back"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                      Question {qIdx + 1} of {pcosQuestions.length}
                    </p>
                    <p className="text-xs font-bold text-[rgb(var(--acc-600))] dark:text-[rgb(var(--acc-200))]">{Math.round(progress)}%</p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[rgb(var(--surface))]">
                    <motion.div
                      className="h-full rounded-full bg-brand-gradient"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Assessment</p>
                <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-[rgb(var(--fg))] sm:text-3xl">
                  {clean(currentQuestion.question)}
                </h2>
              </div>

              <div className="mt-5 grid gap-3">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={`${currentQuestion.id}-${index}`}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(option.score)}
                    className="group flex items-center gap-4 rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--card)/0.62)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[rgb(var(--acc-200))] hover:bg-[rgb(var(--card)/0.9)]"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-sm font-black text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold leading-6 text-[rgb(var(--fg))]">{clean(option.label)}</span>
                    <ChevronRight size={17} className="text-[rgb(var(--muted))] transition group-hover:translate-x-0.5" />
                  </motion.button>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {step === "result" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.34 }}
            className="space-y-6"
          >
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
              <div className="section-panel p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <RiskRing result={result} />
                  <div className="min-w-0 flex-1">
                    <Badge tone={result.risk === "low" ? "green" : result.risk === "moderate" ? "amber" : "rose"}>
                      <AlertTriangle size={13} />
                      Awareness result
                    </Badge>
                    <h1 className="mt-3 font-display text-3xl font-semibold text-[rgb(var(--fg))]">{clean(result.riskLabel)}</h1>
                    <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{clean(result.summary)}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button onClick={restart}>
                        <RotateCcw size={16} />
                        Retake
                      </Button>
                      <Button variant="outline" onClick={() => setStep("intro")}>
                        Back to intro
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="section-panel p-5 sm:p-6">
                <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Symptoms flagged</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.topSymptoms.length > 0 ? (
                    result.topSymptoms.map((item) => (
                      <span key={item} className="rounded-full bg-[rgb(var(--acc-50))] px-3 py-2 text-xs font-bold text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
                        {clean(item)}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-[rgb(var(--muted))]">No strong symptom cluster was flagged from your answers.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <ResultPanel
                id="doctor"
                title="When to see a doctor"
                icon={Stethoscope}
                expanded={expanded}
                setExpanded={setExpanded}
                items={result.whenToSeeDoctor}
              />
              <ResultPanel
                id="steps"
                title="Recommended next steps"
                icon={CheckCircle2}
                expanded={expanded}
                setExpanded={setExpanded}
                items={result.recommendations}
              />
            </section>

            <section className="section-panel p-5 sm:p-6">
              <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Lifestyle guide</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {result.lifestyleGuide.map((section) => (
                  <div key={section.title} className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-4">
                    <h3 className="font-display text-lg font-semibold text-[rgb(var(--fg))]">{clean(section.title)}</h3>
                    <ul className="mt-3 space-y-2">
                      {section.tips.slice(0, 4).map((tip) => (
                        <li key={tip} className="flex gap-2 text-sm leading-6 text-[rgb(var(--muted))]">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--acc-500))]" />
                          <span>{clean(tip)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RiskRing({ result }: { result: PCOSResult }) {
  const pct = Math.round(result.pct * 100);
  const color = result.risk === "low" ? "#10b981" : result.risk === "moderate" ? "#f59e0b" : "#ef4444";
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = result.pct * circumference;

  return (
    <div className="relative grid h-44 w-44 shrink-0 place-items-center rounded-full bg-[rgb(var(--surface)/0.54)]">
      <svg viewBox="0 0 140 140" className="absolute h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgb(var(--border))" strokeWidth="12" />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
          transition={{ duration: 0.85, ease: "easeOut" }}
        />
      </svg>
      <div className="relative text-center">
        <p className="metric-number text-5xl text-[rgb(var(--fg))]">{pct}</p>
        <p className="text-xs font-bold text-[rgb(var(--muted))]">score</p>
      </div>
    </div>
  );
}

function ResultPanel({
  id,
  title,
  icon: Icon,
  expanded,
  setExpanded,
  items,
}: {
  id: string;
  title: string;
  icon: LucideIcon;
  expanded: string | null;
  setExpanded: (value: string | null) => void;
  items: string[];
}) {
  const open = expanded === id;
  return (
    <div className="section-panel overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setExpanded(open ? null : id)}
        className="flex w-full items-center gap-3 p-5 text-left sm:p-6"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
          <Icon size={19} />
        </span>
        <span className="min-w-0 flex-1 font-display text-xl font-semibold text-[rgb(var(--fg))]">{title}</span>
        <ChevronRight className={cn("text-[rgb(var(--muted))] transition", open && "rotate-90")} size={18} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[rgb(var(--border))] p-5 sm:p-6">
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={`${id}-${index}`} className="flex gap-3 rounded-[20px] bg-[rgb(var(--surface)/0.54)] p-3 text-sm leading-6 text-[rgb(var(--fg))]">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[rgb(var(--acc-50))] text-xs font-black text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
                      {index + 1}
                    </span>
                    <span>{clean(item)}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function clean(value: string) {
  return value
    .replace(/\u00e2\u20ac[\u201c\u201d]/g, "-")
    .replace(/\u00c2\u00b1/g, "+/-")
    .replace(/\u00c2\u00b7/g, "-")
    .replace(/\u00c3\u2014/g, "x")
    .replace(/\u00e2\u20ac\u2122/g, "'")
    .replace(/\u00e2\u20ac[\u0153\ufffd]/g, "\"")
    .replace(/\u00e2\u20ac\u00a6/g, "...")
    .replace(/\u00e2\u2030\u00a5/g, ">=")
    .replace(/\u00e2\u2030\u00a4/g, "<=");
}

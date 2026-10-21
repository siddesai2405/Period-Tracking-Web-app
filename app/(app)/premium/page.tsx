"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Check,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Unlock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/topbar";

const features = [
  "Full cycle and period history overview",
  "Pregnancy chance by phase",
  "AI prediction confidence scores",
  "Cycle syncing guides",
  "Advanced wellness reports",
  "Unlimited Luna AI chat",
  "PCOS awareness assessment",
  "Phase-aware diet and wellness plans",
  "Relaxation and sleep coaching",
  "Community and doctor access",
];

const cards = [
  { icon: TrendingUp, title: "Sharper forecasts", desc: "Predictions improve as your cycle history grows." },
  { icon: Sparkles, title: "Personal insights", desc: "Phase-aware guidance for logs, symptoms, and habits." },
  { icon: ShieldCheck, title: "Private by design", desc: "Your health data stays protected in your account." },
];

export default function PremiumPage() {
  return (
    <div>
      <Topbar title="Features" />

      <div className="space-y-6">
        <section className="section-panel overflow-hidden p-0">
          <div className="hero-clean-surface relative overflow-hidden p-6 text-center sm:p-10">
            <div className="hero-clean-glow pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl" />
            <div className="relative mx-auto max-w-3xl">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-brand-gradient text-white shadow-[0_22px_54px_-28px_var(--acc-glow)]">
                <Unlock size={34} />
              </div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Lotus Phase access</p>
              <h1 className="mt-2 font-display text-4xl font-semibold tracking-normal text-[rgb(var(--fg))] sm:text-5xl">
                Everything is already unlocked.
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[rgb(var(--muted))] sm:text-base">
                No paywalls, no confusing tiers, no hidden upgrade screen. The full health companion is available for you now.
              </p>
              <div className="mt-6 flex items-center justify-center gap-1.5 text-sm font-bold text-[rgb(var(--fg))]">
                {[0, 1, 2, 3, 4].map((item) => (
                  <Sparkles key={item} size={17} className="text-[rgb(var(--acc-500))]" />
                ))}
                <span className="ml-2">All features active</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <MiniCard key={card.title} {...card} />
          ))}
        </section>

        <section className="section-panel p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
              <BarChart3 size={19} />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Included features</h2>
              <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">Everything below is available in the app today.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 rounded-[20px] bg-[rgb(var(--surface)/0.54)] p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-white">
                  <Check size={15} strokeWidth={3} />
                </span>
                <span className="text-sm font-semibold text-[rgb(var(--fg))]">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        <Link href="/calendar" className="block">
          <Button variant="soft" className="w-full">
            <ArrowLeft size={16} />
            Back to calendar
          </Button>
        </Link>
      </div>
    </div>
  );
}

function MiniCard({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="section-panel p-5 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
        <Icon size={22} />
      </div>
      <p className="font-display text-lg font-semibold text-[rgb(var(--fg))]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{desc}</p>
    </div>
  );
}

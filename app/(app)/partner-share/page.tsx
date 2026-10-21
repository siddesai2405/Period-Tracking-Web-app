"use client";

import { motion } from "framer-motion";
import { Eye, HeartHandshake, Link2, LockKeyhole, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PartnerSharePanel } from "@/components/partner-share-panel";
import { Topbar } from "@/components/topbar";

const shareHighlights: { icon: LucideIcon; label: string; detail: string }[] = [
  { icon: Eye, label: "Read-only", detail: "Partner can view, never edit." },
  { icon: ShieldCheck, label: "Private link", detail: "Access works only while enabled." },
  { icon: LockKeyhole, label: "Revocable", detail: "Turn it off anytime." },
];

export default function PartnerSharePage() {
  return (
    <div>
      <Topbar title="Partner Share" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-5"
      >
        <section className="section-panel overflow-hidden p-0">
          <div className="hero-clean-surface relative overflow-hidden p-5 sm:p-7">
            <div className="hero-clean-glow pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full blur-3xl" />
            <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
              <div className="min-w-0">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[rgb(var(--card)/0.72)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[rgb(var(--muted))] ring-1 ring-[rgb(var(--border)/0.72)]">
                  <HeartHandshake size={14} />
                  Trusted partner view
                </div>
                <h1 className="font-display text-3xl font-semibold leading-tight tracking-normal text-[rgb(var(--fg))] sm:text-5xl">
                  Share the full health dashboard with your partner.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))] sm:text-base">
                  Create one private link for cycle predictions, logs, symptoms, lifestyle notes, and PCOS summaries.
                </p>
              </div>

              <div className="grid gap-3">
                {shareHighlights.map((item) => (
                  <ShareHighlight key={item.label} {...item} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <PartnerSharePanel />
      </motion.div>
    </div>
  );
}

function ShareHighlight({ icon: Icon, label, detail }: { icon: LucideIcon; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--card)/0.62)] p-3 backdrop-blur">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[rgb(var(--fg))]">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-[rgb(var(--muted))]">{detail}</span>
      </span>
    </div>
  );
}

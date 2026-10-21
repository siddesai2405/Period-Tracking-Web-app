"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Check,
  Download,
  FileText,
  Leaf,
  LogOut,
  Moon,
  Palette,
  PenLine,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PartnerSharePanel } from "@/components/partner-share-panel";
import { Topbar } from "@/components/topbar";
import { useTheme } from "@/components/theme-provider";
import { signOut } from "@/lib/auth";
import type { AccentTheme, DietPreference, HealthGoal } from "@/lib/store";
import { useUserData } from "@/lib/hooks/useUserData";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { buildHealthReportPdf } from "@/lib/healthReportPdf";

const dietOptions: { id: DietPreference; label: string; desc: string; icon: LucideIcon }[] = [
  { id: "nonveg", label: "Balanced", desc: "Includes all food groups", icon: Utensils },
  { id: "veg", label: "Vegetarian", desc: "No meat or fish", icon: Leaf },
  { id: "vegan", label: "Vegan", desc: "Fully plant-based", icon: Leaf },
  { id: "glutenfree", label: "Gluten-free", desc: "Avoids wheat, barley, rye", icon: ShieldCheck },
];

const goalOptions: { id: HealthGoal; label: string; icon: LucideIcon }[] = [
  { id: "maintain", label: "Maintain weight", icon: Activity },
  { id: "weightloss", label: "Lose weight", icon: Target },
  { id: "weightgain", label: "Gain weight", icon: BarChart3 },
  { id: "pcos", label: "Manage PCOS", icon: ShieldCheck },
  { id: "fertility", label: "Support fertility", icon: Sparkles },
];

const accentOptions: { id: AccentTheme; label: string; color: string }[] = [
  { id: "rose", label: "Rose", color: "bg-rose-500" },
  { id: "purple", label: "Purple", color: "bg-violet-500" },
  { id: "ocean", label: "Ocean", color: "bg-sky-500" },
  { id: "forest", label: "Forest", color: "bg-emerald-500" },
  { id: "sunset", label: "Sunset", color: "bg-orange-500" },
];

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const router = useRouter();
  const push = useToast((state) => state.push);
  const { mode, setMode, accent, setAccent } = useTheme();
  const { profile, setProfile, cycles, logs, pcosProfile, chatHistory, isAdmin } = useUserData();

  const [name, setName] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setCycleLength(profile.avgCycleLength);
    setPeriodLength(profile.avgPeriodLength);
  }, [profile.name, profile.avgCycleLength, profile.avgPeriodLength]);

  if (!mounted) return null;

  const saveProfile = async () => {
    setSaving(true);
    await setProfile({
      name: name.trim() || "Friend",
      avgCycleLength: cycleLength,
      avgPeriodLength: periodLength,
    });
    setSaving(false);
    push({ title: "Settings saved", description: "Your profile has been updated.", tone: "success" });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportJsonData = () => {
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), profile, cycles, logs, pcosProfile, chatHistory }, null, 2)],
      { type: "application/json" },
    );
    downloadBlob(blob, `lotus-phase-data-${new Date().toISOString().slice(0, 10)}.json`);
    push({ title: "Export started", description: "Your JSON backup is downloading.", tone: "success" });
  };

  const exportPdfData = () => {
    const exportedAt = new Date().toISOString();
    const pdfBytes = buildHealthReportPdf({ profile, cycles, logs, pcosProfile, chatHistory, exportedAt });
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    downloadBlob(blob, `lotus-phase-health-report-${exportedAt.slice(0, 10)}.pdf`);
    push({ title: "PDF ready", description: "Your health report is downloading.", tone: "success" });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div>
      <Topbar title="Profile" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]"
      >
        <aside className="space-y-5">
          <section className="section-panel overflow-hidden p-0">
            <div className="hero-clean-surface relative overflow-hidden p-6">
              <div className="hero-clean-glow pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl" />
              <div className="relative">
                <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-brand-gradient font-display text-3xl font-bold text-white shadow-[0_22px_54px_-28px_var(--acc-glow)]">
                  {(profile.name || "F").slice(0, 1).toUpperCase()}
                </div>
                <h1 className="mt-5 font-display text-3xl font-semibold text-[rgb(var(--fg))]">{profile.name || "Friend"}</h1>
                <p className="mt-1 text-sm text-[rgb(var(--muted))]">{profile.email || "Lotus Phase member"}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MiniStat icon={CalendarDays} label="Cycles" value={cycles.length} />
                  <MiniStat icon={PenLine} label="Logs" value={Object.keys(logs).length} />
                </div>
              </div>
            </div>
          </section>

          <section className="section-panel p-5">
            <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Account actions</h2>
            <div className="mt-4 space-y-3">
              <ActionButton icon={FileText} label="Download health PDF" onClick={exportPdfData} />
              <ActionButton icon={Download} label="Download raw JSON" onClick={exportJsonData} />
              <Link href="/pcos" className="block">
                <ActionButton icon={ShieldCheck} label="PCOS assessment" />
              </Link>
              {(profile.isAdmin || isAdmin) && (
                <Link href="/admin" className="block">
                  <ActionButton icon={ShieldCheck} label="Admin panel" />
                </Link>
              )}
              <ActionButton icon={LogOut} label="Sign out" onClick={handleSignOut} danger />
            </div>
          </section>
        </aside>

        <main className="space-y-5">
          <section className="section-panel p-5 sm:p-6">
            <SectionHeader icon={User} title="Personal settings" description="Update the profile details used across Lotus Phase." />
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
              </div>
              <div>
                <Label>Average cycle length</Label>
                <Input type="number" min={20} max={45} value={cycleLength} onChange={(event) => setCycleLength(Number(event.target.value) || 28)} />
              </div>
              <div>
                <Label>Average period length</Label>
                <Input type="number" min={2} max={10} value={periodLength} onChange={(event) => setPeriodLength(Number(event.target.value) || 5)} />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={saveProfile} disabled={saving}>
                <Check size={16} />
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </section>

          <section className="section-panel p-5 sm:p-6">
            <SectionHeader icon={Download} title="Download your data" description="Keep a polished health report or a raw backup of your Lotus Phase records." />
            <div className="grid gap-3 md:grid-cols-2">
              <ExportTile
                icon={FileText}
                title="Health report PDF"
                detail="A readable report with profile, cycles, logs, PCOS answers, and recent Luna chats."
                label="Download PDF"
                onClick={exportPdfData}
                tone="rose"
              />
              <ExportTile
                icon={Download}
                title="Raw data backup"
                detail="A complete JSON file for safekeeping or moving your data later."
                label="Download JSON"
                onClick={exportJsonData}
                tone="violet"
              />
            </div>
          </section>

          <PartnerSharePanel />

          <section className="section-panel p-5 sm:p-6">
            <SectionHeader icon={Palette} title="Appearance" description="Tune the app so light and dark mode both feel yours." />
            <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className="grid grid-cols-2 gap-2 rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-2">
                <button
                  type="button"
                  onClick={() => setMode("light")}
                  className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-[18px] text-sm font-bold transition-all", mode === "light" ? "bg-[rgb(var(--card)/0.92)] text-[rgb(var(--fg))] shadow-[0_10px_22px_-18px_rgba(72,39,72,0.42)] ring-1 ring-[rgb(var(--border)/0.72)] dark:bg-white/10" : "text-[rgb(var(--muted))] hover:bg-[rgb(var(--card)/0.46)]")}
                >
                  <Sparkles size={16} />
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setMode("dark")}
                  className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-[18px] text-sm font-bold transition-all", mode === "dark" ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))] shadow-[0_10px_22px_-18px_rgba(72,39,72,0.42)]" : "text-[rgb(var(--muted))] hover:bg-[rgb(var(--card)/0.46)]")}
                >
                  <Moon size={16} />
                  Dark
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {accentOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAccent(option.id)}
                    className={cn(
                      "inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-bold transition-all",
                      accent === option.id
                        ? "border-[rgb(var(--acc-300))] bg-[rgb(var(--acc-50))] text-[rgb(var(--fg))] dark:bg-white/[0.08]"
                        : "border-[rgb(var(--border))] bg-[rgb(var(--card)/0.54)] text-[rgb(var(--muted))]",
                    )}
                  >
                    <span className={cn("h-3 w-3 rounded-full", option.color)} />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="section-panel p-5 sm:p-6">
              <SectionHeader icon={Utensils} title="Diet preference" description="Used by diet and wellness plans." />
              <div className="grid gap-2">
                {dietOptions.map((option) => (
                  <OptionRow
                    key={option.id}
                    icon={option.icon}
                    title={option.label}
                    detail={option.desc}
                    selected={profile.dietPreference === option.id}
                    onClick={() => setProfile({ dietPreference: option.id })}
                  />
                ))}
              </div>
            </div>

            <div className="section-panel p-5 sm:p-6">
              <SectionHeader icon={Target} title="Health goal" description="Personalizes recommendations and plans." />
              <div className="grid gap-2">
                {goalOptions.map((option) => (
                  <OptionRow
                    key={option.id}
                    icon={option.icon}
                    title={option.label}
                    selected={profile.healthGoal === option.id}
                    onClick={() => setProfile({ healthGoal: option.id })}
                  />
                ))}
              </div>
            </div>
          </section>
        </main>
      </motion.div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-white/70 bg-white/62 p-3 dark:border-white/10 dark:bg-white/[0.06]">
      <Icon size={17} className="text-[rgb(var(--acc-600))] dark:text-[rgb(var(--acc-200))]" />
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">{label}</p>
      <p className="metric-number mt-1 text-2xl text-[rgb(var(--fg))]">{value}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
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

function OptionRow({
  icon: Icon,
  title,
  detail,
  selected,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  detail?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-[22px] border p-3 text-left transition-all hover:-translate-y-0.5",
        selected
          ? "border-[rgb(var(--acc-200))] bg-[rgb(var(--acc-50))] dark:border-[rgb(var(--acc-400)/0.25)] dark:bg-[rgb(var(--acc-500)/0.12)]"
          : "border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)]",
      )}
    >
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl", selected ? "bg-brand-gradient text-white" : "bg-white/70 text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]")}>
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-[rgb(var(--fg))]">{title}</span>
        {detail && <span className="mt-0.5 block text-xs leading-5 text-[rgb(var(--muted))]">{detail}</span>}
      </span>
      {selected && <Check size={17} className="text-[rgb(var(--acc-600))] dark:text-[rgb(var(--acc-200))]" />}
    </button>
  );
}

function ExportTile({
  icon: Icon,
  title,
  detail,
  label,
  onClick,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  label: string;
  onClick: () => void;
  tone: "rose" | "violet";
}) {
  const toneClass =
    tone === "rose"
      ? "from-rose-500 to-pink-500 shadow-rose-500/20"
      : "from-violet-500 to-fuchsia-500 shadow-violet-500/20";

  return (
    <div className="rounded-[26px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-4 shadow-[0_18px_48px_-38px_rgba(93,56,86,0.42)]">
      <div className="flex items-start gap-3">
        <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br text-white shadow-lg", toneClass)}>
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold text-[rgb(var(--fg))]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{detail}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--fg))] px-4 text-sm font-black text-[rgb(var(--bg))] transition hover:opacity-90"
      >
        {label}
      </button>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, danger = false }: { icon: LucideIcon; label: string; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[22px] border p-3 text-left transition-all hover:-translate-y-0.5",
        danger
          ? "border-red-200 bg-red-500/8 text-red-700 dark:border-red-400/20 dark:text-red-200"
          : "border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] text-[rgb(var(--fg))]",
      )}
    >
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl", danger ? "bg-red-500/10" : "bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]")}>
        <Icon size={17} />
      </span>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}

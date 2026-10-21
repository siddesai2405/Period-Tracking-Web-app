import { CalendarDays, HeartPulse, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { BloomLogo } from "@/components/bloom-logo";

const bullets = [
  { icon: CalendarDays, text: "Smart period and fertility predictions" },
  { icon: Sparkles, text: "Phase-aware tips for food, mood, and sleep" },
  { icon: HeartPulse, text: "Luna AI support when you need guidance" },
  { icon: ShieldCheck, text: "Private health data with secure Supabase auth" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-bg flex min-h-screen text-[rgb(var(--fg))]">
      <div className="hidden w-[500px] shrink-0 p-6 lg:block xl:w-[560px]">
        <div className="section-panel flex h-full flex-col overflow-hidden p-8">
          <Link href="/" className="mb-auto flex items-center gap-3">
            <BloomLogo size={50} rounded="16" />
            <div>
              <p className="font-display text-2xl font-semibold">Lotus Phase</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">AI wellness companion</p>
            </div>
          </Link>

          <div className="py-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-white/60 px-4 py-2 text-xs font-bold text-[rgb(var(--acc-700))] dark:bg-white/[0.06] dark:text-[rgb(var(--acc-200))]">
              <Sparkles size={14} />
              Gentle cycle intelligence
            </div>
            <h2 className="font-display text-5xl font-semibold leading-[1.05] tracking-normal">
              Understand your rhythm with calm, beautiful care.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[rgb(var(--muted))]">
              Track symptoms, predict your next period, and get phase-aware wellness guidance in one private app.
            </p>

            <ul className="mt-8 grid gap-3">
              {bullets.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card)/0.64)] px-4 py-3 text-sm font-semibold">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
                    <Icon size={17} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[24px] bg-brand-gradient p-5 text-white shadow-glow">
            <p className="text-sm font-semibold leading-6">
              "The predictions and phase tips made my cycle feel understandable instead of stressful."
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-white/75">Lotus Phase user</p>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-screen flex-1 flex-col items-center justify-center px-5 py-10">
        <Link href="/" className="relative mb-8 flex items-center gap-3 lg:hidden">
          <BloomLogo size={42} rounded="14" />
          <span className="font-display text-xl font-semibold">Lotus Phase</span>
        </Link>

        <div className="section-panel relative z-10 w-full max-w-md p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

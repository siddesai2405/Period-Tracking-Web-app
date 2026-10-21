"use client";
import { CalendarPlus, Moon, Search, Sparkles, Sun } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useUserData } from "@/lib/hooks/useUserData";

const topbarCopy: Record<string, string> = {
  Calendar: "Plan periods, fertile windows, and daily notes.",
  Statistics: "Track cycle patterns, logs, and lifestyle trends.",
  "Daily log": "Capture symptoms, mood, flow, sleep, water, and notes.",
  Insights: "Personalized signals from your cycle and wellness history.",
  "Luna AI": "Ask cycle, symptom, nutrition, sleep, and PCOS questions.",
  "Daily Guide": "Phase-aware care for movement, food, mood, and rest.",
  "Wellness Companion": "Rituals and routines tuned to your current phase.",
  "Diet Guide": "Nutrients, meals, and shopping ideas for cycle support.",
  "PCOS & Hormonal Health": "Assess symptoms and plan calmer next steps.",
  "Talk to Doctor": "Find care options and prepare for consultations.",
  "Relax & Sleep": "Breathing, meditation, sounds, and mindful bubble games.",
  Community: "Share support, questions, and wins with other users.",
  "Partner Share": "Share a private, read-only health dashboard with your partner.",
  Features: "Upgrade options and advanced Lotus Phase capabilities.",
  Profile: "Personalize your health profile, theme, privacy, and account.",
};

export function Topbar({ title }: { title?: string }) {
  const router = useRouter();
  const { profile } = useUserData();
  const { mode, toggle } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);
  const [query, setQuery] = useState("");
  const description = title ? topbarCopy[title] ?? "Your soft cycle care space for today." : undefined;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/chat?prompt=${encodeURIComponent(trimmed)}` : "/chat");
  }

  return (
    <header className="topbar-surface sticky top-3 z-30 mb-6 px-4 py-3 sm:px-5 lg:top-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 xl:grid-cols-[minmax(15rem,auto)_minmax(18rem,42rem)_auto]">
        {title && (
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="hidden h-2.5 w-2.5 shrink-0 rounded-full bg-[rgb(var(--acc-400))] shadow-[0_0_0_6px_rgb(var(--acc-100)/0.72)] sm:block" />
              <h1
                className="truncate font-display font-semibold tracking-normal"
                style={{ color: "rgb(var(--fg))", fontSize: "clamp(1.18rem, 2vw, 1.72rem)" }}
              >
                {title}
              </h1>
            </div>
            {description && (
              <p className="mt-1 hidden truncate text-xs font-semibold text-[rgb(var(--muted))] sm:block">
                {description}
              </p>
            )}
          </div>
        )}

        <form onSubmit={submitSearch} className="hidden min-w-0 items-center xl:flex">
          <div className="relative w-full">
            <Search
              size={14}
              strokeWidth={2.2}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
              style={{ color: searchFocused ? "rgb(var(--acc-500))" : "rgb(var(--muted))" }}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ask Luna about symptoms, food, sleep..."
              className="input-glass h-10 w-full pl-9 pr-4 text-[13px]"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </form>

        <div className="topbar-actions-group">
          <Link
            href="/log"
            className="topbar-cta hidden sm:inline-flex"
          >
            <span className="topbar-cta-icon" aria-hidden="true">
              <CalendarPlus size={16} strokeWidth={2.6} />
            </span>
            <span>Log today</span>
          </Link>

          <Link
            href="/chat"
            className="topbar-secondary hidden lg:inline-flex"
          >
            <span className="topbar-secondary-icon" aria-hidden="true">
              <Sparkles size={15} strokeWidth={2.6} />
            </span>
            <span>Ask Luna</span>
          </Link>

          <button
            type="button"
            onClick={toggle}
            aria-label={mode === "dark" ? "Switch to day mode" : "Switch to night mode"}
            className="topbar-icon-tile inline-flex"
            title={mode === "dark" ? "Day mode" : "Night mode"}
          >
            {mode === "dark" ? <Sun size={17} strokeWidth={2.4} /> : <Moon size={17} strokeWidth={2.4} />}
          </button>

          <Link href="/profile" className="topbar-avatar-tile" aria-label="Profile">
            <span className="topbar-avatar-initial">{profile.name?.[0]?.toUpperCase() ?? "B"}</span>
            <span className="topbar-avatar-status" />
          </Link>
        </div>
      </div>
    </header>
  );
}

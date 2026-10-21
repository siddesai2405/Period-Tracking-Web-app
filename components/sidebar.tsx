"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ChevronRight,
  Crown,
  Flower2,
  HeartHandshake,
  LayoutDashboard,
  MessageCircleHeart,
  Music,
  PenLine,
  Salad,
  Sparkles,
  Stethoscope,
  UserCircle2,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { BloomLogo } from "@/components/bloom-logo";
import { useApp } from "@/lib/store";

const sections = [
  {
    title: "Tracking",
    color: "#f65b89",
    links: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/stats", label: "Statistics", icon: BarChart3 },
      { href: "/log", label: "Log Today", icon: PenLine },
    ],
  },
  {
    title: "Wellness",
    color: "#b79af8",
    links: [
      { href: "/guide", label: "Daily Guide", icon: BookOpenCheck },
      { href: "/chat", label: "Luna AI", icon: MessageCircleHeart },
      { href: "/insights", label: "Insights", icon: Sparkles },
      { href: "/wellness", label: "Wellness", icon: Flower2 },
      { href: "/diet", label: "Diet Guide", icon: Salad },
      { href: "/pcos", label: "PCOS Check", icon: Activity },
      { href: "/relax", label: "Relax & Sleep", icon: Music },
    ],
  },
  {
    title: "Care",
    color: "#7dd3fc",
    links: [
      { href: "/partner-share", label: "Partner Share", icon: HeartHandshake },
      { href: "/doctor", label: "Talk to Doctor", icon: Stethoscope },
    ],
  },
  {
    title: "Community",
    color: "#6ee7b7",
    links: [{ href: "/community", label: "Community", icon: Users }],
  },
];

const bottomLinks = [
  { href: "/profile", label: "Settings", icon: UserCircle2 },
  { href: "/premium", label: "Premium", icon: Crown },
];

export function Sidebar() {
  const pathname = usePathname();
  const profile = useApp((s) => s.profile);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const [todayLabel, setTodayLabel] = useState("Today");

  useEffect(() => {
    setTodayLabel(new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
  }, []);

  return (
    <aside className="sidebar-surface sticky top-0 hidden h-screen w-[286px] shrink-0 flex-col overflow-hidden px-4 py-4 lg:flex xl:w-[304px] xl:px-5">
      <Link href="/dashboard" className="group mb-4 flex items-center gap-3 rounded-[24px] p-2 transition-all hover:bg-[rgb(var(--card)/0.58)] dark:hover:bg-white/[0.04]">
        <BloomLogo size={52} rounded="16" className="shrink-0 transition-transform duration-300 group-hover:scale-105" />
        <div className="min-w-0">
          <p className="font-display text-[24px] font-semibold leading-none tracking-normal text-[rgb(var(--fg))]">
            Lotus Phase
          </p>
          <p className="mt-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
            Cycle care
          </p>
        </div>
      </Link>

      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-none">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="mb-2 flex items-center gap-2 px-3">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: section.color }} />
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
                {section.title}
              </p>
            </div>
            <div className="space-y-1">
              {section.links.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className="group relative flex items-center gap-3 rounded-[20px] px-3 py-2.5 text-sm font-bold transition-all"
                    style={{ color: active ? "rgb(var(--fg))" : "rgb(var(--muted))" }}
                  >
                    <AnimatePresence>
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-0 -z-10 rounded-[18px]"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          style={{
                            background: "var(--nav-active-bg)",
                            border: "1px solid var(--nav-active-border)",
                            boxShadow: "0 18px 38px -30px var(--acc-glow)",
                          }}
                          transition={{ type: "spring", stiffness: 500, damping: 36 }}
                        />
                      )}
                    </AnimatePresence>
                    {!active && (
                      <span className="absolute inset-0 -z-10 rounded-[20px] opacity-0 transition-opacity group-hover:opacity-100" style={{ background: "rgb(var(--card) / 0.56)" }} />
                    )}
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-[14px] transition-all"
                      style={
                        active
                          ? { background: "linear-gradient(135deg, var(--gstart), var(--gmid), var(--gend))", color: "white", boxShadow: "0 12px 26px -18px var(--acc-glow)" }
                          : { background: "rgb(var(--card) / 0.64)", color: "rgb(var(--muted))", border: "1px solid rgb(var(--border) / 0.54)" }
                      }
                    >
                      <Icon size={16} strokeWidth={active ? 2.4 : 2} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {active && <ChevronRight size={14} className="text-[rgb(var(--acc-500))]" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-3 shrink-0 border-t border-[rgb(var(--border)/0.68)] pt-3">
        <div className="space-y-1">
          {bottomLinks.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-[20px] px-3 py-2 text-sm font-bold text-[rgb(var(--muted))] transition-all hover:bg-[rgb(var(--card)/0.62)] hover:text-[rgb(var(--fg))]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-[13px] border border-[rgb(var(--border)/0.54)] bg-[rgb(var(--card)/0.64)]">
                  <Icon size={15} />
                </span>
                <span className="flex-1">{label}</span>
                {active && <span className="h-2 w-2 rounded-full bg-[rgb(var(--acc-500))]" />}
              </Link>
            );
          })}
        </div>

        <div className="mt-3 overflow-hidden rounded-[22px] border border-[rgb(var(--border)/0.78)] bg-[linear-gradient(135deg,rgb(var(--acc-50)/0.82),rgb(var(--surface-2)/0.68))] p-3 shadow-[0_16px_36px_-32px_rgba(88,49,84,0.42)] dark:bg-[linear-gradient(135deg,rgb(var(--acc-500)/0.12),rgb(var(--surface-2)/0.62))]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Today</p>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.16)]" />
          </div>
          <p className="mt-1 font-display text-lg font-semibold tracking-normal text-[rgb(var(--fg))]">{todayLabel}</p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">Care plan and quick logging are ready.</p>
        </div>

        <Link href="/profile" className="mt-3 flex items-center gap-3 rounded-[22px] border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--card)/0.66)] p-3 transition-all hover:-translate-y-0.5 hover:bg-[rgb(var(--card)/0.88)]">
          <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-sm font-extrabold text-white">
            {profile?.name?.[0]?.toUpperCase() ?? "B"}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[rgb(var(--card))] bg-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[rgb(var(--fg))]">{profile?.name ?? "Lotus User"}</p>
            <p className="mt-0.5 truncate text-xs font-medium text-[rgb(var(--muted))]">Cycle care active</p>
          </div>
          <ChevronRight size={15} className="text-[rgb(var(--muted))]" />
        </Link>
      </div>
    </aside>
  );
}

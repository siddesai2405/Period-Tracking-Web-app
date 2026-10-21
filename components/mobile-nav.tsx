"use client";
import { useEffect, useState } from "react";
import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Crown,
  Flower2,
  HeartHandshake,
  LayoutDashboard,
  Menu,
  MessageCircleHeart,
  Music,
  PenLine,
  Salad,
  Sparkles,
  Stethoscope,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const leftLinks = [
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/diet", label: "Diet", icon: Salad },
];

const rightLinks = [
  { href: "/relax", label: "Relax", icon: Music },
  { href: "/doctor", label: "Doctor", icon: Stethoscope },
];

const moreLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/log", label: "Log Today", icon: PenLine },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
  { href: "/guide", label: "Daily Guide", icon: BookOpenCheck },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/wellness", label: "Wellness", icon: Flower2 },
  { href: "/pcos", label: "PCOS Check", icon: Activity },
  { href: "/partner-share", label: "Partner Share", icon: HeartHandshake },
  { href: "/community", label: "Community", icon: Users },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
  { href: "/premium", label: "Premium", icon: Crown },
];

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const chatActive = isActive("/chat");
  const moreActive = moreLinks.some(({ href }) => isActive(href));

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-safe lg:hidden">
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              className="fixed inset-0 z-0 bg-black/12 backdrop-blur-[1px] dark:bg-black/34"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="relative z-20 mx-auto mb-3 max-h-[62vh] max-w-md overflow-hidden rounded-[28px] border border-[rgb(var(--border)/0.86)] bg-[rgb(var(--card)/0.95)] p-3 shadow-[0_24px_70px_-36px_rgba(73,45,72,0.58)] backdrop-blur-2xl dark:bg-[rgb(var(--card)/0.92)]"
            >
              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--muted))]">More sections</p>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close more sections"
                  className="grid h-8 w-8 place-items-center rounded-2xl text-[rgb(var(--muted))] transition hover:bg-[rgb(var(--surface-2)/0.72)] hover:text-[rgb(var(--fg))]"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
              <div className="grid max-h-[48vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
                {moreLinks.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex min-w-0 items-center gap-2 rounded-[18px] border px-3 py-2.5 text-xs font-black transition-all",
                        active
                          ? "border-[rgb(var(--acc-300)/0.58)] bg-[rgb(var(--acc-100)/0.58)] text-[rgb(var(--acc-700))] dark:bg-white/[0.08] dark:text-[rgb(var(--acc-100))]"
                          : "border-[rgb(var(--border)/0.58)] bg-[rgb(var(--card)/0.62)] text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface-2)/0.76)] hover:text-[rgb(var(--fg))] dark:bg-white/[0.035]",
                      )}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[13px] bg-[rgb(var(--surface)/0.72)] ring-1 ring-[rgb(var(--border)/0.48)] dark:bg-white/[0.04]">
                        <Icon size={15} strokeWidth={2.35} />
                      </span>
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="relative z-20 mx-auto mb-3 grid max-w-md grid-cols-[1fr_1fr_68px_1fr_1fr] items-end rounded-[30px] border border-[rgb(var(--border)/0.86)] bg-[rgb(var(--card)/0.90)] px-2 pt-2 shadow-[0_18px_48px_-30px_rgba(73,45,72,0.42)] backdrop-blur-2xl dark:bg-[rgb(var(--card)/0.84)]">
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          aria-label={moreOpen ? "Close more sections" : "Open more sections"}
          aria-expanded={moreOpen}
          className={cn(
            "absolute -right-1 -top-12 grid h-10 w-10 place-items-center rounded-2xl border text-[rgb(var(--muted))] shadow-[0_14px_34px_-28px_rgba(73,45,72,0.52)] backdrop-blur-xl transition-all active:scale-95",
            moreOpen || moreActive
              ? "border-[rgb(var(--acc-300)/0.64)] bg-[linear-gradient(135deg,rgb(var(--acc-100)/0.92),rgb(var(--surface-2)/0.88))] text-[rgb(var(--acc-700))] dark:bg-white/[0.10] dark:text-[rgb(var(--acc-100))]"
              : "border-[rgb(var(--border)/0.78)] bg-[rgb(var(--card)/0.88)] hover:bg-[rgb(var(--surface-2)/0.84)] hover:text-[rgb(var(--fg))]",
          )}
        >
          {moreOpen ? <X size={18} strokeWidth={2.6} /> : <Menu size={19} strokeWidth={2.5} />}
        </button>

        {leftLinks.map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} active={isActive(href)}>
            <Icon size={21} strokeWidth={isActive(href) ? 2.4 : 1.9} />
          </NavItem>
        ))}

        <div className="flex justify-center">
          <Link
            href="/chat"
            aria-label="Open AI chat"
            className="pastel-primary relative -top-5 flex h-[60px] w-[60px] flex-col items-center justify-center gap-0.5 rounded-full text-white transition-all active:translate-y-0 active:scale-95"
            style={{
              background: "linear-gradient(135deg, var(--gstart), var(--gmid), var(--gend))",
              boxShadow: "0 18px 38px -22px var(--acc-glow), 0 0 0 7px rgb(var(--card) / 0.90)",
            }}
          >
            <MessageCircleHeart size={24} strokeWidth={2.55} />
            <span className="text-[10px] font-black leading-none">AI</span>
            {chatActive && (
              <motion.span
                layoutId="fab-active"
                className="absolute inset-0 rounded-full border-2 border-white/70"
                initial={{ scale: 0.86, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              />
            )}
          </Link>
        </div>

        {rightLinks.map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} active={isActive(href)}>
            <Icon size={21} strokeWidth={isActive(href) ? 2.4 : 1.9} />
          </NavItem>
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-0 flex-col items-center gap-1 px-1 pb-3 pt-1 text-[10px] font-black transition-all",
        active ? "text-[rgb(var(--acc-600))] dark:text-[rgb(var(--acc-200))]" : "text-[rgb(var(--muted))]",
      )}
    >
      <span className="relative grid h-10 w-10 place-items-center rounded-[16px]">
        <AnimatePresence>
          {active && (
            <motion.span
              layoutId="mobile-nav-active"
              className="absolute inset-0 rounded-[17px]"
              initial={{ opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.86 }}
              style={{
                background: "linear-gradient(135deg, rgba(var(--gstart-rgb),0.18), rgba(var(--gend-rgb),0.16))",
                border: "1px solid rgba(var(--gstart-rgb),0.28)",
                boxShadow: "0 10px 24px -18px var(--acc-glow)",
              }}
              transition={{ type: "spring", stiffness: 520, damping: 38 }}
            />
          )}
        </AnimatePresence>
        <span className="relative z-10">{children}</span>
      </span>
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

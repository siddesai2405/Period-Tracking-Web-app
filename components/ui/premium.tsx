import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--acc-600))] dark:text-[rgb(var(--acc-300))]">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-normal text-[rgb(var(--fg))] sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionPanel({
  children,
  className,
  compact = false,
}: React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }) {
  return (
    <section className={cn("section-panel", compact ? "p-4" : "p-5 sm:p-6", className)}>
      {children}
    </section>
  );
}

export function SectionTitle({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgb(var(--acc-500)/0.1)] text-[rgb(var(--acc-600))] dark:text-[rgb(var(--acc-300))]">
            <Icon size={17} strokeWidth={2.1} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold text-[rgb(var(--fg))]">{title}</h2>
          {description && <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  tone = "rose",
  detail,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  unit?: string;
  tone?: "rose" | "blue" | "green" | "amber" | "violet";
  detail?: string;
  className?: string;
}) {
  const tones = {
    rose: "bg-[rgb(var(--acc-500)/0.1)] text-[rgb(var(--acc-600))] dark:text-[rgb(var(--acc-300))]",
    blue: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  };

  return (
    <div className={cn("bento-stat p-4", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className={cn("grid h-9 w-9 place-items-center rounded-xl", tones[tone])}>
          <Icon size={17} strokeWidth={2.1} />
        </span>
        {detail && <span className="text-xs font-medium text-[rgb(var(--muted))]">{detail}</span>}
      </div>
      <p className="text-xs font-medium text-[rgb(var(--muted))]">{label}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="metric-number text-3xl text-[rgb(var(--fg))]">{value}</span>
        {unit && <span className="text-xs font-medium text-[rgb(var(--muted))]">{unit}</span>}
      </div>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: string; icon?: LucideIcon }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1", className)}>
      {options.map((option) => {
        const active = value === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
              active
                ? "bg-[rgb(var(--card))] text-[rgb(var(--fg))] shadow-sm"
                : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]",
            )}
          >
            {Icon && <Icon size={15} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-6 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[rgb(var(--acc-500)/0.1)] text-[rgb(var(--acc-600))] dark:text-[rgb(var(--acc-300))]">
        <Icon size={22} />
      </span>
      <p className="font-display text-base font-semibold text-[rgb(var(--fg))]">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm leading-6 text-[rgb(var(--muted))]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function IconTile({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card)/0.78)] p-4", className)}>
      <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--acc-500)/0.1)] text-[rgb(var(--acc-600))] dark:text-[rgb(var(--acc-300))]">
        <Icon size={18} />
      </span>
      <p className="text-sm font-semibold text-[rgb(var(--fg))]">{title}</p>
      {description && <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{description}</p>}
    </div>
  );
}

export function StatusChip({
  icon: Icon,
  label,
  tone = "rose",
  className,
}: {
  icon?: LucideIcon;
  label: React.ReactNode;
  tone?: "rose" | "violet" | "mint" | "amber" | "blue" | "slate";
  className?: string;
}) {
  const tones = {
    rose: "bg-[rgb(var(--acc-100)/0.82)] text-[rgb(var(--acc-700))] ring-[rgb(var(--acc-200)/0.78)] dark:bg-[rgb(var(--acc-500)/0.15)] dark:text-[rgb(var(--acc-200))] dark:ring-[rgb(var(--acc-300)/0.18)]",
    violet: "bg-violet-100/82 text-violet-700 ring-violet-200/80 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-300/18",
    mint: "bg-emerald-100/82 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-300/18",
    amber: "bg-amber-100/84 text-amber-800 ring-amber-200/80 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-300/18",
    blue: "bg-sky-100/82 text-sky-700 ring-sky-200/80 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-300/18",
    slate: "bg-slate-100/86 text-slate-700 ring-slate-200/80 dark:bg-white/10 dark:text-white/80 dark:ring-white/10",
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1", tones[tone], className)}>
      {Icon && <Icon size={13} strokeWidth={2.3} />}
      {label}
    </span>
  );
}

export function ActionTile({
  icon: Icon,
  title,
  description,
  action,
  tone = "rose",
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  tone?: "rose" | "violet" | "mint" | "amber" | "blue";
  className?: string;
}) {
  const tones = {
    rose: "from-rose-50 to-pink-50 text-rose-700 dark:from-rose-500/12 dark:to-pink-500/8 dark:text-rose-200",
    violet: "from-violet-50 to-fuchsia-50 text-violet-700 dark:from-violet-500/12 dark:to-fuchsia-500/8 dark:text-violet-200",
    mint: "from-emerald-50 to-teal-50 text-emerald-700 dark:from-emerald-500/12 dark:to-teal-500/8 dark:text-emerald-200",
    amber: "from-amber-50 to-orange-50 text-amber-800 dark:from-amber-500/13 dark:to-orange-500/8 dark:text-amber-200",
    blue: "from-sky-50 to-cyan-50 text-sky-700 dark:from-sky-500/12 dark:to-cyan-500/8 dark:text-sky-200",
  };

  return (
    <div className={cn("action-tile group", className)}>
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br transition-transform group-hover:scale-105", tones[tone])}>
        <Icon size={19} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[rgb(var(--fg))]">{title}</p>
        {description && <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function ChartPanel({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement> & {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("chart-panel", className)}>
      <SectionTitle icon={Icon} title={title} description={description} action={action} />
      {children}
    </section>
  );
}

export function LoadingSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-3 rounded-full bg-[linear-gradient(90deg,rgb(var(--surface)/0.72),rgb(var(--acc-100)/0.68),rgb(var(--surface)/0.72))] bg-[length:220%_100%] animate-[shimmer_1.8s_ease-in-out_infinite] dark:from-white/[0.05] dark:via-white/[0.10] dark:to-white/[0.05]"
          style={{ width: `${index === lines - 1 ? 62 : 100}%` }}
        />
      ))}
    </div>
  );
}

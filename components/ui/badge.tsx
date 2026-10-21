import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "rose" | "lavender" | "green" | "amber" | "slate";
const tones: Record<Tone, string> = {
  rose: "bg-[rgb(var(--acc-100)/0.88)] text-[rgb(var(--acc-800))] ring-[rgb(var(--acc-200)/0.82)] dark:bg-[rgb(var(--acc-500)/0.18)] dark:text-[rgb(var(--acc-100))] dark:ring-[rgb(var(--acc-300)/0.22)]",
  lavender: "bg-violet-100/86 text-violet-800 ring-violet-200/82 dark:bg-violet-500/18 dark:text-violet-100 dark:ring-violet-300/22",
  green: "bg-emerald-100/86 text-emerald-800 ring-emerald-200/82 dark:bg-emerald-500/18 dark:text-emerald-100 dark:ring-emerald-300/22",
  amber: "bg-amber-100/88 text-amber-900 ring-amber-200/82 dark:bg-amber-500/18 dark:text-amber-100 dark:ring-amber-300/22",
  slate: "bg-slate-100/90 text-slate-800 ring-slate-200/82 dark:bg-white/10 dark:text-white/88 dark:ring-white/12",
};

export function Badge({
  tone = "rose",
  className,
  ...props
}: { tone?: Tone } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 shadow-[0_8px_18px_-16px_rgba(72,39,72,0.42)]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

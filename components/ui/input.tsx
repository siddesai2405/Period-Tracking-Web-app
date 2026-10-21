import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-2xl border border-[rgb(var(--border)/0.86)] bg-[rgb(var(--card)/0.80)] px-4 text-sm font-medium text-[rgb(var(--fg))] shadow-[0_10px_30px_-26px_rgba(93,56,86,0.40)]",
        "placeholder:text-[rgb(var(--muted))] placeholder:opacity-60 dark:bg-white/[0.06] dark:placeholder:text-white/35",
        "focus:border-[rgb(var(--acc-300))] focus:bg-[rgb(var(--card)/0.94)] focus:outline-none focus:ring-4 focus:ring-[rgb(var(--acc-200))] focus:ring-opacity-40",
        "disabled:cursor-not-allowed disabled:bg-[rgb(var(--surface)/0.58)] disabled:opacity-60 dark:focus:ring-[rgb(var(--acc-400))] dark:focus:ring-opacity-20 transition-all",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[96px] w-full resize-none rounded-2xl border border-[rgb(var(--border)/0.86)] bg-[rgb(var(--card)/0.80)] p-4 text-sm font-medium text-[rgb(var(--fg))] shadow-[0_10px_30px_-26px_rgba(93,56,86,0.40)]",
      "placeholder:text-[rgb(var(--muted))] placeholder:opacity-60 dark:bg-white/[0.06] dark:placeholder:text-white/35",
      "focus:border-[rgb(var(--acc-300))] focus:bg-[rgb(var(--card)/0.94)] focus:outline-none focus:ring-4 focus:ring-[rgb(var(--acc-200))] focus:ring-opacity-40",
      "disabled:cursor-not-allowed disabled:bg-[rgb(var(--surface)/0.58)] disabled:opacity-60 dark:focus:ring-[rgb(var(--acc-400))] dark:focus:ring-opacity-20 transition-all",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Label = ({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]", className)} {...p} />
);

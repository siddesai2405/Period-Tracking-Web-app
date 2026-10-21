"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "soft" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "button-control pastel-primary active:translate-y-0 active:scale-[0.985]",
  ghost:
    "button-control border border-transparent bg-transparent text-[rgb(var(--fg))] hover:-translate-y-0.5 hover:bg-[rgb(var(--surface-2)/0.72)] dark:hover:bg-[rgb(var(--surface-2)/0.56)] active:translate-y-0 active:scale-[0.985]",
  outline:
    "button-control pastel-button active:translate-y-0 active:scale-[0.985]",
  soft:
    "button-control pastel-soft active:translate-y-0 active:scale-[0.985]",
  destructive:
    "button-control border border-red-300/50 bg-[linear-gradient(135deg,#fb7185,#ef4444)] text-white shadow-[0_18px_42px_-24px_rgba(239,68,68,0.75)] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-[0.985] dark:border-red-300/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base sm:px-7",
  icon: "h-10 w-10 px-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[18px] font-extrabold tracking-normal transition-all duration-200",
        "select-none disabled:pointer-events-none disabled:translate-y-0 disabled:scale-100 disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--acc-300))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";

"use client";
import { create } from "zustand";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = { id: string; title: string; description?: string; tone?: "success" | "info" | "error" };
type Store = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
};
export const useToast = create<Store>((set) => ({
  toasts: [],
  push: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: crypto.randomUUID() }] })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function Toaster() {
  const { toasts, remove } = useToast();
  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => remove(t.id), 4200));
    return () => timers.forEach(clearTimeout);
  }, [toasts, remove]);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-[340px] max-w-[90vw] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="glass pointer-events-auto rounded-2xl p-4 shadow-glass"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 rounded-full p-1.5",
                  t.tone === "error"
                    ? "bg-red-100 text-red-600"
                    : t.tone === "info"
                    ? "bg-lavender-100 text-lavender-700"
                    : "bg-emerald-100 text-emerald-700",
                )}
              >
                {t.tone === "info" ? <Info size={16} /> : <CheckCircle2 size={16} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs opacity-70">{t.description}</p>}
              </div>
              <button onClick={() => remove(t.id)} className="opacity-50 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

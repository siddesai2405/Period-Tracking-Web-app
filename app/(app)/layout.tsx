"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { supabase } from "@/lib/supabase";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      } else {
        setChecked(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  if (!checked) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[rgb(var(--acc-500)/0.3)] border-t-[rgb(var(--acc-500))] animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen" style={{ color: "rgb(var(--fg))" }}>
      <div className="relative z-10 flex min-h-screen w-full">
        <Sidebar />
        <main className="main-card min-h-screen flex-1 min-w-0 overflow-x-hidden px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-5 xl:px-10 2xl:px-12">
          <div className="w-full">
            {children}
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}

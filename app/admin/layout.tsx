"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const adminShellStyle = {
  background: "rgb(var(--bg))",
  color: "rgb(var(--fg))",
  colorScheme: "dark",
} as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", data.session.user.id)
        .single();

      if (!(prof as { is_admin?: boolean } | null)?.is_admin) {
        router.replace("/dashboard");
        return;
      }
      setChecked(true);
    });
  }, [router]);

  if (!checked) {
    return (
      <div className="dark min-h-screen flex items-center justify-center" style={adminShellStyle}>
        <div className="h-8 w-8 rounded-full border-2 border-[rgb(var(--acc-500)/0.3)] border-t-[rgb(var(--acc-500))] animate-spin" />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen" style={adminShellStyle}>
      {children}
    </div>
  );
}

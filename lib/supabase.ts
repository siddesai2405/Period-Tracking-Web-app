import { createBrowserClient } from "@supabase/ssr";

// Returns undefined when env vars aren't available (during build-time SSR).
// All pages that use this are "use client" and check for session before rendering.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const supabase = createBrowserClient<any>(url, anonKey);

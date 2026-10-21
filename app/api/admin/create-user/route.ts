import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { name, email, password, is_admin, onboarded } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
  }

  if (String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: String(email).trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Update the auto-created profile with the provided name
  if (data.user) {
    await supabaseAdmin
      .from("profiles")
      .upsert({
        id: data.user.id,
        name,
        is_admin: Boolean(is_admin),
        is_active: true,
        onboarded: Boolean(onboarded),
      }, { onConflict: "id" });
  }

  return NextResponse.json({ user: { id: data.user?.id, email: data.user?.email, name, is_admin: Boolean(is_admin) } });
}

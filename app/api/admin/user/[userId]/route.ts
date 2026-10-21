import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getUserDetail } from "@/lib/db/admin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { userId } = params;
  const detail = await getUserDetail(userId);
  if (!detail) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ detail });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { userId } = params;
  if (userId === auth.user.id) {
    return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { userId } = params;
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
  if (typeof body.is_admin === "boolean") patch.is_admin = body.is_admin;
  if (typeof body.onboarded === "boolean") patch.onboarded = body.onboarded;
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();

  if (userId === auth.user.id && body.is_admin === false) {
    return NextResponse.json({ error: "You cannot remove your own admin access" }, { status: 400 });
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No supported fields to update" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update(patch)
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (typeof patch.name === "string") {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { name: patch.name },
    });
  }

  const detail = await getUserDetail(userId);
  return NextResponse.json({ success: true, detail });
}

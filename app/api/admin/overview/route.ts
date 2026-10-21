import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAllUsers, getPlatformStats } from "@/lib/db/admin";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const [users, stats] = await Promise.all([getAllUsers(), getPlatformStats()]);

  return NextResponse.json({
    users,
    stats,
    currentAdminId: auth.user.id,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserDetail } from "@/lib/db/admin";

export const runtime = "nodejs";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { userId } = params;
  const format = req.nextUrl.searchParams.get("format") ?? "json";

  const detail = await getUserDetail(userId);
  if (!detail) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (format === "csv") {
    const rows = [
      ["Date", "Flow", "Mood", "Symptoms", "Sleep (hrs)", "Water (cups)", "Notes"],
      ...detail.logs.map((l) => [
        l.date,
        l.flow ?? "",
        l.mood ?? "",
        l.symptoms.join(";"),
        l.sleepHrs ?? "",
        l.waterCups ?? "",
        l.notes ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="bloom-logs-${userId.slice(0, 8)}.csv"`,
      },
    });
  }

  // Fetch profile for JSON export
  const { data: prof } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return NextResponse.json(
    {
      profile: prof,
      profileSummary: detail.profile,
      fullProfile: detail.fullProfile,
      cycles: detail.cycles,
      logs: detail.logs,
      pcosProfile: detail.pcosProfile,
      chatMessages: detail.chatMessages,
      exportedAt: new Date().toISOString(),
    },
    { headers: { "Content-Disposition": `attachment; filename="bloom-data-${userId.slice(0, 8)}.json"` } },
  );
}

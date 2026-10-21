import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { PartnerDashboardPayload, PartnerPublicProfile } from "@/lib/partnerShare";
import type { Cycle, LogEntry, PCOSProfile } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function mapPublicProfile(row: Record<string, any>): PartnerPublicProfile {
  return {
    name: row.name || "Friend",
    avgCycleLength: row.avg_cycle_length || 28,
    avgPeriodLength: row.avg_period_length || 5,
    birthYear: row.birth_year ?? undefined,
    accentTheme: row.accent_theme || "rose",
    dietPreference: row.diet_preference || "nonveg",
    healthGoal: row.health_goal || "maintain",
    activityLevel: row.activity_level ?? undefined,
    height: row.height ?? undefined,
    weight: row.weight ?? undefined,
    medicalConditions: row.medical_conditions || [],
    foodAllergies: row.food_allergies || [],
    stressLevel: row.stress_level ?? undefined,
  };
}

function mapCycles(rows: Record<string, any>[]): Cycle[] {
  return rows.map((row) => ({
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
  }));
}

function mapLogs(rows: Record<string, any>[]): Record<string, LogEntry> {
  const logs: Record<string, LogEntry> = {};
  rows.forEach((row) => {
    logs[row.date] = {
      date: row.date,
      flow: row.flow ?? null,
      mood: row.mood ?? null,
      symptoms: row.symptoms || [],
      sleepHrs: row.sleep_hrs ?? undefined,
      waterCups: row.water_cups ?? undefined,
      notes: row.notes ?? undefined,
    };
  });
  return logs;
}

function mapPcos(row: Record<string, any> | null): PCOSProfile {
  if (!row) return { answers: {} };
  return {
    answers: row.answers || {},
    completedAt: row.completed_at ?? undefined,
  };
}

export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const token = params.token?.trim();
  if (!token || token.length < 20) {
    return NextResponse.json({ error: "Invalid partner link." }, { status: 400 });
  }

  const { data: share, error: shareError } = await supabaseAdmin
    .from("partner_shares")
    .select("*")
    .eq("token", token)
    .eq("is_active", true)
    .single();

  if (shareError || !share) {
    return NextResponse.json({ error: "Partner link is no longer active." }, { status: 404 });
  }

  const ownerId = share.owner_id;
  const [profileResult, cyclesResult, logsResult, pcosResult] = await Promise.all([
    supabaseAdmin.from("profiles").select("*").eq("id", ownerId).single(),
    supabaseAdmin.from("cycles").select("start_date, end_date").eq("user_id", ownerId).order("start_date", { ascending: true }),
    share.include_logs
      ? supabaseAdmin.from("daily_logs").select("*").eq("user_id", ownerId).order("date", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    share.include_pcos
      ? supabaseAdmin.from("pcos_assessments").select("answers, completed_at").eq("user_id", ownerId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (profileResult.error || !profileResult.data) {
    return NextResponse.json({ error: "Shared dashboard is unavailable." }, { status: 404 });
  }

  if (cyclesResult.error || logsResult.error || pcosResult.error) {
    return NextResponse.json({ error: "Could not load shared health data." }, { status: 500 });
  }

  const payload: PartnerDashboardPayload = {
    share: {
      partnerName: share.partner_name ?? "",
      createdAt: share.created_at,
      updatedAt: share.updated_at,
    },
    profile: mapPublicProfile(profileResult.data as Record<string, any>),
    cycles: mapCycles((cyclesResult.data ?? []) as Record<string, any>[]),
    logs: mapLogs((logsResult.data ?? []) as Record<string, any>[]),
    pcosProfile: mapPcos((pcosResult.data ?? null) as Record<string, any> | null),
  };

  return NextResponse.json(payload);
}

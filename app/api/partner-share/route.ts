import { randomBytes } from "crypto";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { PartnerShare } from "@/lib/partnerShare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function mapShare(row: Record<string, any>): PartnerShare {
  return {
    id: row.id,
    token: row.token,
    partnerName: row.partner_name ?? "",
    partnerEmail: row.partner_email ?? "",
    isActive: row.is_active ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revokedAt: row.revoked_at ?? undefined,
  };
}

async function requireUser() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Route handlers here only need to read the existing browser session.
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true as const, user };
}

function newToken() {
  return randomBytes(24).toString("base64url");
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 140) : "";
}

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("partner_shares")
    .select("*")
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Partner sharing is not ready yet." }, { status: 500 });
  }

  return NextResponse.json({ share: data ? mapShare(data as Record<string, any>) : null });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const partnerName = cleanText(body.partnerName);
  const partnerEmail = cleanText(body.partnerEmail).toLowerCase();

  const { data, error } = await supabaseAdmin
    .from("partner_shares")
    .upsert(
      {
        owner_id: auth.user.id,
        token: newToken(),
        partner_name: partnerName,
        partner_email: partnerEmail,
        include_dashboard: true,
        include_logs: true,
        include_pcos: true,
        is_active: true,
        revoked_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id" },
    )
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not create partner link." }, { status: 500 });
  }

  return NextResponse.json({ share: mapShare(data as Record<string, any>) });
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const partnerName = cleanText(body.partnerName);
  const partnerEmail = cleanText(body.partnerEmail).toLowerCase();

  const { data, error } = await supabaseAdmin
    .from("partner_shares")
    .update({
      partner_name: partnerName,
      partner_email: partnerEmail,
      updated_at: new Date().toISOString(),
    })
    .eq("owner_id", auth.user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not update partner details." }, { status: 500 });
  }

  return NextResponse.json({ share: data ? mapShare(data as Record<string, any>) : null });
}

export async function DELETE() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("partner_shares")
    .update({
      is_active: false,
      token: newToken(),
      revoked_at: now,
      updated_at: now,
    })
    .eq("owner_id", auth.user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not turn off partner share." }, { status: 500 });
  }

  return NextResponse.json({ share: data ? mapShare(data as Record<string, any>) : null });
}

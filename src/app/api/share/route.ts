import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/siteUrl";
import {
  SharedSchedulePayload,
  DEFAULT_SHARE_DAYS,
  MAX_SHARE_DAYS,
} from "@/lib/share/types";

/**
 * 32 bytes from the CSPRNG, base64url encoded. Long enough that guessing is
 * not a realistic attack even though the link needs no password -- which
 * matters, because what sits behind it is client names and home addresses.
 *
 * Web Crypto rather than node:crypto's randomBytes. Both are cryptographically
 * secure and this is the only Node built-in the app reached for, so using the
 * standard API keeps the route runnable on any runtime rather than tying the
 * one security-critical function in the codebase to a compatibility shim.
 */
function makeToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  // btoa needs a binary string; Uint8Array has no direct base64 encoder.
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: {
    staffLocalId?: string;
    scheduleDate?: string;
    /** The day this round covers, "YYYY-MM-DD", for selecting it later. */
    scheduleOn?: string;
    days?: number;
    payload?: SharedSchedulePayload;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { staffLocalId, payload, scheduleDate } = body;

  if (!staffLocalId || typeof staffLocalId !== "string") {
    return NextResponse.json({ error: "staffLocalId is required" }, { status: 400 });
  }
  if (!payload || !Array.isArray(payload.stops)) {
    return NextResponse.json({ error: "payload.stops is required" }, { status: 400 });
  }
  if (payload.stops.length === 0) {
    return NextResponse.json({ error: "Nothing to share — that round has no visits." }, { status: 400 });
  }

  // Clamp rather than reject: an out-of-range value is a caller bug, and
  // silently issuing a link that never expires would be the worst outcome.
  const requested = Number(body.days);
  const days = Number.isFinite(requested)
    ? Math.min(Math.max(Math.trunc(requested), 1), MAX_SHARE_DAYS)
    : DEFAULT_SHARE_DAYS;

  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const token = makeToken();

  // Service role because the row is written on the user's behalf with a token
  // the browser never chooses. user_id is taken from the verified session, not
  // from the request body, so a caller cannot share on someone else's account.
  const { error } = await serviceClient().from("shared_schedules").insert({
    user_id: user.id,
    token,
    staff_local_id: staffLocalId,
    staff_name: payload.staffName ?? "",
    schedule_date: scheduleDate ?? null,
    // Only stored if it is a real date -- a malformed value would make the
    // staff page silently fall back to the most recent round instead.
    schedule_on: /^\d{4}-\d{2}-\d{2}$/.test(body.scheduleOn ?? "")
      ? body.scheduleOn
      : null,
    payload,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error("Failed to create share link:", error);
    return NextResponse.json({ error: "Could not create share link" }, { status: 500 });
  }

  return NextResponse.json({
    url: `${SITE_URL}/r/${token}`,
    expiresAt: expiresAt.toISOString(),
  });
}

/** Revoke a link. Kept separate from delete so the record survives for audit. */
export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  // Scoped to the caller's own rows, so knowing a token is not enough to
  // revoke someone else's link.
  const { error } = await supabase
    .from("shared_schedules")
    .update({ revoked: true })
    .eq("token", token)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not revoke link" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

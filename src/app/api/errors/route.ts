import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Caps on what a browser can put in the database.
 *
 * This endpoint is unauthenticated by necessity -- the errors most worth
 * having are the ones that hit logged-out visitors -- so it has to assume the
 * caller is hostile. A stack trace beyond a couple of thousand characters is
 * all framework frames anyway.
 */
const MAX_MESSAGE = 500;
const MAX_STACK = 4000;
const MAX_URL = 500;

function clamp(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/**
 * Groups repeats of the same fault.
 *
 * Message plus the first stack frame: the message alone would merge genuinely
 * different bugs that happen to share wording, and the whole stack would split
 * one bug across every line number it was ever thrown from. Query strings are
 * dropped from the path so ?id=1 and ?id=2 are one problem, not two.
 */
function fingerprint(message: string, stack: string | null, url: string | null): string {
  const frame = stack?.split("\n").find((l) => /\bat\b|@/.test(l))?.trim().slice(0, 200) ?? "";
  let path = "";
  try {
    path = url ? new URL(url).pathname : "";
  } catch {
    path = "";
  }
  return `${message.slice(0, 200)}|${frame}|${path}`;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = clamp(body.message, MAX_MESSAGE);
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const stack = clamp(body.stack, MAX_STACK);
  const url = clamp(body.url, MAX_URL);
  const source = ["client", "boundary", "server"].includes(String(body.source))
    ? String(body.source)
    : "client";

  // Read the session if there is one, but never require it. An anonymous
  // report is still worth storing; it just has no user against it.
  let userId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    // No session, or cookies unavailable. Not a reason to drop the report.
  }

  const svc = serviceClient();
  const fp = fingerprint(message, stack, url);

  // Fold into an existing unacknowledged report for the same fault rather than
  // adding a row per occurrence -- one bug hit fifty times is one thing to fix.
  const { data: existing } = await svc
    .from("error_reports")
    .select("id, occurrences")
    .eq("fingerprint", fp)
    .is("acknowledged_at", null)
    .limit(1)
    .maybeSingle();

  if (existing) {
    await svc
      .from("error_reports")
      .update({
        occurrences: (existing.occurrences ?? 1) + 1,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return NextResponse.json({ ok: true, grouped: true });
  }

  const { error } = await svc.from("error_reports").insert({
    message,
    stack,
    url,
    source,
    user_id: userId,
    fingerprint: fp,
    user_agent: clamp(req.headers.get("user-agent"), 300),
    context: typeof body.context === "object" && body.context ? body.context : {},
  });

  if (error) {
    // Never surface a storage failure to the page that was already broken.
    console.error("error_reports insert failed:", error.message);
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}

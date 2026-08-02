import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { SharedSchedulePayload } from "@/lib/share/types";
import ShareRouteLinks from "@/components/share/ShareRouteLinks";
import RoundTimeline from "@/components/share/RoundTimeline";

// Never cached: a revoked or expired link must stop working immediately, not
// whenever a cache entry happens to fall out.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Belt and braces alongside the robots.txt disallow. A share link may be
// pasted into a group chat that pre-fetches URLs, so it must never be indexed
// even if a crawler reaches it directly.
export const metadata: Metadata = {
  title: "Your round",
  robots: { index: false, follow: false, nocache: true },
};

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="mb-3 text-2xl font-semibold text-slate-100">{title}</h1>
      <p className="text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}

export default async function SharedRoundPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const { data, error } = await serviceClient()
    .from("shared_schedules")
    .select("staff_name, schedule_date, payload, expires_at, revoked")
    .eq("token", token)
    .maybeSingle();

  // One message for missing, revoked and expired alike -- distinguishing them
  // would tell someone probing tokens which ones were once real.
  const unavailable =
    error ||
    !data ||
    data.revoked ||
    new Date(data.expires_at).getTime() < Date.now();

  if (unavailable) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Notice
          title="This link is no longer available"
          body="It may have expired or been withdrawn. Ask whoever sent it for an up-to-date link."
        />
      </div>
    );
  }

  const payload = data.payload as SharedSchedulePayload;
  const stops = payload.stops ?? [];
  const breaks = payload.breaks ?? [];


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            {payload.staffName || data.staff_name || "Your round"}
          </h1>
          {data.schedule_date && (
            <p className="mt-1 text-sm text-slate-400">{data.schedule_date}</p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            {stops.length} visit{stops.length === 1 ? "" : "s"}
            {breaks.length > 0 &&
              ` · ${breaks.length} break${breaks.length === 1 ? "" : "s"}`}
          </p>
        </header>

        <ShareRouteLinks payload={payload} />

        <RoundTimeline payload={payload} />

        <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-600">
          This page contains personal information. Do not forward it. The link
          stops working on{" "}
          {new Date(data.expires_at).toLocaleDateString("en-GB")}.
        </p>
      </div>
    </div>
  );
}

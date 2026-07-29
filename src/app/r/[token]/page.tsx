import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { SharedSchedulePayload } from "@/lib/share/types";
import ShareRouteLinks from "@/components/share/ShareRouteLinks";

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

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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

  // Visits and breaks interleaved, so the page reads as the day actually runs.
  const timeline = [
    ...stops.map((s) => ({ kind: "stop" as const, at: s.start, data: s })),
    ...breaks.map((b) => ({ kind: "break" as const, at: b.start, data: b })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

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

        <ol className="mt-6 space-y-2">
          <li className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm">
            <span className="font-medium text-slate-300">Start</span>
            <span className="ml-2 text-slate-400">
              {payload.originLabel} · {payload.originPostcode}
            </span>
          </li>

          {timeline.map((entry, i) =>
            entry.kind === "break" ? (
              <li
                key={`b-${i}`}
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-amber-200">Break</span>
                  <span className="text-xs text-amber-200/80">
                    {fmtTime(entry.data.start)}–{fmtTime(entry.data.end)}
                  </span>
                </div>
              </li>
            ) : (
              <li
                key={`s-${i}`}
                className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-slate-100">
                    {entry.data.clientName}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {fmtTime(entry.data.start)}–{fmtTime(entry.data.end)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {entry.data.address ? `${entry.data.address}, ` : ""}
                  {entry.data.postcode}
                </p>
              </li>
            )
          )}

          <li className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm">
            <span className="font-medium text-slate-300">Finish</span>
            <span className="ml-2 text-slate-400">
              {payload.destinationLabel} · {payload.destinationPostcode}
            </span>
          </li>
        </ol>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-600">
          This page contains personal information. Do not forward it. The link
          stops working on{" "}
          {new Date(data.expires_at).toLocaleDateString("en-GB")}.
        </p>
      </div>
    </div>
  );
}

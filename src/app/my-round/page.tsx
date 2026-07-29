import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SharedSchedulePayload } from "@/lib/share/types";
import ShareRouteLinks from "@/components/share/ShareRouteLinks";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My round",
  robots: { index: false, follow: false },
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default async function MyRoundPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Everything below relies on RLS rather than filtering by hand: the staff
  // policy only exposes rows published to this login, so a bug here cannot
  // widen what a staff member sees.
  const { data: rows } = await supabase
    .from("shared_schedules")
    .select("staff_name, schedule_date, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(1);

  const latest = rows?.[0];

  if (!latest) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="mb-3 text-2xl font-semibold">No round yet</h1>
          <p className="text-sm leading-relaxed text-slate-400">
            Nothing has been published to you. Once your manager generates and
            shares a schedule, it will appear here.
          </p>
        </div>
      </div>
    );
  }

  const payload = latest.payload as SharedSchedulePayload;
  const stops = payload.stops ?? [];
  const breaks = payload.breaks ?? [];

  const timeline = [
    ...stops.map((s) => ({ kind: "stop" as const, at: s.start, data: s })),
    ...breaks.map((b) => ({ kind: "break" as const, at: b.start, data: b })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            {payload.staffName || latest.staff_name || "My round"}
          </h1>
          {latest.schedule_date && (
            <p className="mt-1 text-sm text-slate-400">{latest.schedule_date}</p>
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
      </div>
    </div>
  );
}

import { SharedSchedulePayload } from "@/lib/share/types";
import { wazeUrl } from "@/lib/navigation/mapLinks";

/**
 * The stop-by-stop list of a shared round.
 *
 * Shared by the tokenised link page and the staff login page, which rendered
 * near-identical markup and had already begun to drift -- the note above this
 * list told staff to use the Waze button on each stop, and there were none.
 *
 * No client directives: every stop is a plain anchor, so this renders on the
 * server and works before any JavaScript loads. That matters for someone
 * opening their round on a phone with poor signal.
 */
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function WazeLink({ label, postcode }: { label: string; postcode: string }) {
  if (!postcode) return null;
  return (
    <a
      href={wazeUrl({ label, postcode })}
      target="_blank"
      rel="noopener noreferrer"
      title={`Navigate to ${label} in Waze`}
      className="shrink-0 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-700"
    >
      Waze
    </a>
  );
}

export default function RoundTimeline({
  payload,
}: {
  payload: SharedSchedulePayload;
}) {
  const stops = payload.stops ?? [];
  const breaks = payload.breaks ?? [];

  // Interleaved by start time, so the list reads as the day actually runs.
  const timeline = [
    ...stops.map((s) => ({ kind: "stop" as const, at: s.start, data: s })),
    ...breaks.map((b) => ({ kind: "break" as const, at: b.start, data: b })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <ol className="mt-6 space-y-2">
      <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm">
        <span className="min-w-0">
          <span className="font-medium text-slate-300">Start</span>
          <span className="ml-2 text-slate-400">
            {payload.originLabel} · {payload.originPostcode}
          </span>
        </span>
        <WazeLink label={payload.originLabel} postcode={payload.originPostcode} />
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
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
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
              </div>
              <WazeLink
                label={entry.data.clientName}
                postcode={entry.data.postcode}
              />
            </div>
          </li>
        )
      )}

      <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm">
        <span className="min-w-0">
          <span className="font-medium text-slate-300">Finish</span>
          <span className="ml-2 text-slate-400">
            {payload.destinationLabel} · {payload.destinationPostcode}
          </span>
        </span>
        <WazeLink
          label={payload.destinationLabel}
          postcode={payload.destinationPostcode}
        />
      </li>
    </ol>
  );
}

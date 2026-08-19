"use client";

import { useEffect, useState } from "react";
import { SharedSchedulePayload } from "@/lib/share/types";
import { decodeRound } from "@/lib/share/fragment";
import ShareRouteLinks from "./ShareRouteLinks";
import RoundTimeline from "./RoundTimeline";

/**
 * A carer's round, read out of the URL fragment.
 *
 * There is no fetch here and no login. The fragment is the round: the browser
 * never sends it anywhere, so this page renders personal data that our servers
 * have not seen and cannot log.
 *
 * That is also why the decode has to happen in an effect rather than during
 * render -- location.hash does not exist while the page is being prerendered.
 */

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="mb-3 text-2xl font-semibold text-slate-100">{title}</h1>
      <p className="text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}

/** Local date, matching how the engine builds times from local midnight. */
function localIso(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function RoundFromFragment() {
  const [state, setState] = useState<
    { status: "loading" } | { status: "empty" } | { status: "bad" } | { status: "ok"; payload: SharedSchedulePayload }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    // Every branch resolves asynchronously, including the empty one. Setting
    // state synchronously here would run during the effect, which React warns
    // about and which would render twice on the way to the same answer.
    (async () => {
      const fragment = window.location.hash.replace(/^#/, "");
      const payload = fragment ? await decodeRound(fragment) : null;
      if (cancelled) return;

      if (!fragment) setState({ status: "empty" });
      else setState(payload ? { status: "ok", payload } : { status: "bad" });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <Notice title="Opening your round…" body="One moment." />;
  }

  if (state.status === "empty") {
    return (
      <Notice
        title="No round in this link"
        body="Open the full link you were sent, including everything after the # symbol. Copying only part of it leaves the round behind."
      />
    );
  }

  if (state.status === "bad") {
    return (
      <Notice
        title="This link could not be read"
        body="It may have been cut short when it was sent. Ask whoever sent it for a fresh link."
      />
    );
  }

  const { payload } = state;
  const stops = payload.stops ?? [];
  const breaks = payload.breaks ?? [];

  const first = stops[0] ? new Date(stops[0].start) : null;
  const dayLabel = first
    ? first.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null;
  const isToday = first ? localIso(first) === localIso(new Date()) : true;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {payload.staffName || "Your round"}
        </h1>
        {dayLabel && <p className="mt-1 text-sm text-slate-400">{dayLabel}</p>}
        <p className="mt-1 text-xs text-slate-500">
          {stops.length} visit{stops.length === 1 ? "" : "s"}
          {breaks.length > 0 &&
            ` · ${breaks.length} break${breaks.length === 1 ? "" : "s"}`}
        </p>
      </header>

      {/* Links are issued per day, so an old one opened by mistake looks
          exactly like a current one. Saying which day it is for is the only
          thing standing between a stale bookmark and a wasted morning. */}
      {!isToday && dayLabel && (
        <p className="mb-6 rounded border border-amber-700/60 bg-amber-950/40 px-3 py-2 text-xs leading-relaxed text-amber-200">
          This round is for <strong>{dayLabel}</strong>, which is not today.
          Check you have opened the most recent link you were sent.
        </p>
      )}

      <ShareRouteLinks payload={payload} />

      <RoundTimeline payload={payload} />

      <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-600">
        This page contains personal information. Do not forward it.
      </p>
    </div>
  );
}

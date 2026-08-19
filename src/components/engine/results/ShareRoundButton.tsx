"use client";

import { useState } from "react";
import { ScheduledVisit, ScheduledBreak } from "@/lib/scheduler/types";
import { SharedSchedulePayload } from "@/lib/share/types";
import { roundLink } from "@/lib/share/fragment";
import type { NavStop } from "@/lib/navigation/mapLinks";

interface ShareRoundButtonProps {
  staffName: string;
  origin: NavStop | null;
  destination: NavStop | null;
  visits: ScheduledVisit[];
  breaks: ScheduledBreak[];
}

export default function ShareRoundButton({
  staffName,
  origin,
  destination,
  visits,
  breaks,
}: ShareRoundButtonProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!origin || !destination || visits.length === 0) return null;

  /**
   * Build the link here, in the browser.
   *
   * This used to POST the round to /api/share, which wrote it to a table and
   * handed back a short token. The round now travels in the URL fragment,
   * which is never sent to a server -- so the carer's phone gets the names and
   * addresses without them passing through us on the way.
   */
  const create = async () => {
    setBusy(true);
    setError(null);

    const payload: SharedSchedulePayload = {
      staffName,
      originLabel: origin.label,
      originPostcode: origin.postcode,
      destinationLabel: destination.label,
      destinationPostcode: destination.postcode,
      stops: visits.map((v) => ({
        clientName: v.clientName,
        postcode: v.postcode,
        address: v.address,
        start: v.start,
        end: v.end,
      })),
      breaks: breaks.map((b) => ({ start: b.start, end: b.end })),
      generatedAt: new Date().toISOString(),
    };

    try {
      setUrl(await roundLink(window.location.origin, payload));
    } catch {
      setError("Could not build the link for this round.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the input below is selectable as a fallback.
    }
  };

  // Local date, matching how the engine builds times from local midnight.
  // Using the ISO string's date part would be a day early on BST evenings.
  const first = visits[0] ? new Date(visits[0].start) : null;
  const dayLabel = first
    ? first.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null;

  return (
    <div className="mt-2 border-t border-slate-700/60 pt-2" onClick={(e) => e.stopPropagation()}>
      {!url ? (
        <>
          <button
            type="button"
            onClick={create}
            disabled={busy}
            className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-100 transition-colors hover:border-slate-600 hover:bg-slate-700 disabled:opacity-50"
          >
            {busy ? "Building link…" : "Share with staff"}
          </button>
          {error && <p className="mt-1 text-[10px] text-amber-300">{error}</p>}
        </>
      ) : (
        <div>
          <div className="flex items-center gap-1">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-300"
            />
            <button
              type="button"
              onClick={copy}
              className="shrink-0 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] text-slate-100 hover:bg-slate-700"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
            The round{dayLabel ? ` for ${dayLabel}` : ""} is carried inside this
            link, not stored on our servers. That also means it{" "}
            <strong className="text-slate-400">cannot be withdrawn</strong> once
            sent — send a fresh link each day, and only to the person doing the
            round.
          </p>
        </div>
      )}
    </div>
  );
}

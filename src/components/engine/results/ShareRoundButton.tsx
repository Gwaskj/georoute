"use client";

import { useState } from "react";
import { ScheduledVisit, ScheduledBreak } from "@/lib/scheduler/types";
import { SharedSchedulePayload } from "@/lib/share/types";
import type { NavStop } from "@/lib/navigation/mapLinks";

interface ShareRoundButtonProps {
  staffId: string;
  staffName: string;
  origin: NavStop | null;
  destination: NavStop | null;
  visits: ScheduledVisit[];
  breaks: ScheduledBreak[];
}

export default function ShareRoundButton({
  staffId,
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
      // Local date, matching how the engine builds times from local midnight.
      // Using the ISO string's date part would be a day early in BST evenings.
      const first = visits[0] ? new Date(visits[0].start) : null;
      const scheduleOn = first
        ? [
            first.getFullYear(),
            String(first.getMonth() + 1).padStart(2, "0"),
            String(first.getDate()).padStart(2, "0"),
          ].join("-")
        : undefined;

      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffLocalId: staffId,
          scheduleOn,
          scheduleDate: visits[0]
            ? new Date(visits[0].start).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            : undefined,
          payload,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(
          res.status === 401
            ? "Sharing needs an account — free mode keeps everything in this browser."
            : json.error ?? "Could not create link"
        );
        return;
      }

      setUrl(json.url);
    } catch {
      setError("Could not create link");
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
            {busy ? "Creating link…" : "Share with staff"}
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
            Read-only, expires in 14 days. It contains client names and
            addresses, so send it only to the person doing the round.
          </p>
        </div>
      )}
    </div>
  );
}

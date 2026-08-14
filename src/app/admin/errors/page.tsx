"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";

interface ErrorRow {
  id: number;
  message: string;
  stack: string | null;
  url: string | null;
  source: string;
  user_id: string | null;
  occurrences: number;
  created_at: string;
  last_seen_at: string;
  acknowledged_at: string | null;
}

function when(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString("en-GB");
}

export default function AdminErrorsPage() {
  const isAdmin = useIsAdmin();
  const [rows, setRows] = useState<ErrorRow[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Which filter the rows currently on screen belong to. Loading is derived
  // from it rather than held separately, so there is no setState in the effect
  // body -- every state change below happens after an await, once the data it
  // describes actually exists.
  const [loadedFor, setLoadedFor] = useState<boolean | null>(null);
  const loading = loadedFor !== showResolved;

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;

    (async () => {
      let q = supabase
        .from("error_reports")
        .select("*")
        .order("last_seen_at", { ascending: false })
        .limit(100);

      if (!showResolved) q = q.is("acknowledged_at", null);

      const { data } = await q;
      if (!active) return;
      setRows((data as ErrorRow[]) ?? []);
      setLoadedFor(showResolved);
    })();

    return () => {
      active = false;
    };
  }, [isAdmin, showResolved]);

  // Acknowledging goes through the API route because the table has no update
  // policy -- the browser can read errors but not change them, so the write
  // happens server-side after re-checking that the caller is an admin.
  async function acknowledge(id: number) {
    const res = await fetch("/api/admin/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setRows((r) => r.filter((x) => x.id !== id));
  }

  if (isAdmin === null) return null;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center text-slate-400">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Errors</h1>
          <p className="mt-1 text-sm text-slate-400">
            Failures that reached someone using the site. Repeats of the same
            fault are grouped rather than listed separately.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
          />
          Include resolved
        </label>
      </header>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      {!loading && rows.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-10 text-center">
          <p className="text-sm text-slate-300">Nothing has broken.</p>
          <p className="mt-1 text-xs text-slate-500">
            Errors appear here automatically, with a notice on the site when
            there are new ones.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-100">
                  {r.message}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {when(r.last_seen_at)}
                  {r.occurrences > 1 && ` · ${r.occurrences} times`}
                  {` · ${r.source}`}
                  {r.user_id ? " · signed in" : " · signed out"}
                </p>
                {r.url && (
                  <p className="mt-0.5 truncate text-xs text-slate-600">{r.url}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {r.stack && (
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-200"
                  >
                    {expanded === r.id ? "Hide" : "Stack"}
                  </button>
                )}
                {!r.acknowledged_at && (
                  <button
                    type="button"
                    onClick={() => acknowledge(r.id)}
                    className="rounded bg-teal-600 px-2 py-1 text-xs font-medium text-white"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>

            {expanded === r.id && r.stack && (
              <pre className="mt-3 max-h-64 overflow-auto rounded bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-400">
                {r.stack}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

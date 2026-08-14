"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

/**
 * Tells the site owner, on the site, that something has broken.
 *
 * Deliberately not email. An emailed alert for a bug that has already happened
 * is noise arriving at the wrong moment; this appears while you are looking at
 * the thing it concerns, and stays until acknowledged.
 *
 * Renders nothing at all for everyone else. The query is safe regardless --
 * row-level security restricts error_reports to admins, so a non-admin gets
 * zero rows rather than a hidden count -- but not issuing it at all keeps a
 * request off every page load for every visitor.
 */
export default function ErrorNotice() {
  const [count, setCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (!profile?.is_admin) return;

      const { count: n } = await supabase
        .from("error_reports")
        .select("id", { count: "exact", head: true })
        .is("acknowledged_at", null);

      if (active && n) setCount(n);
    }

    // Deferred rather than run on mount: this is the owner's convenience, and
    // it should not compete with the page itself for the first second of load.
    const timer = setTimeout(check, 1500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  if (!count || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-amber-500/40 bg-slate-900 px-4 py-3 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 text-amber-400">
          ⚠
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-100">
            {count} unresolved {count === 1 ? "error" : "errors"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
            Something failed for someone using the site.
          </p>
          <Link
            href="/admin/errors"
            className="mt-2 inline-block text-xs font-medium text-teal-400 hover:text-teal-300"
          >
            See what broke →
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Hide until next page load"
          className="text-slate-500 hover:text-slate-300"
        >
          ×
        </button>
      </div>
    </div>
  );
}

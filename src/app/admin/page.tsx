"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";

interface Issue {
  id: string;
  severity: "warn" | "info";
  title: string;
  detail: string;
  href?: string;
}

interface Overview {
  generatedAt: string;
  totals: Record<string, number>;
  recent: Record<string, number>;
  actionCounts: Record<string, number>;
  issues: Issue[];
  activity: { id: string; action: string; created_at: string; detail: string | null }[];
}

const SECTIONS = [
  ["/admin/users", "Users", "Accounts, Pro status and renewals"],
  ["/admin/schedule", "Schedule", "Generated rounds and saved routes"],
  ["/admin/logs", "Logs", "Every recorded action, in full"],
  ["/admin/pricing", "Pricing", "Plan tiers and Stripe price IDs"],
  ["/admin/settings", "Settings", "Global defaults"],
  ["/admin/header-editor", "Header", "Nav, logo and banner"],
  ["/admin/themes", "Themes", "Colours and presentation"],
  ["/admin/editor", "Pages", "Home and pricing page content"],
] as const;

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
      <div className="text-2xl font-semibold tabular-nums text-slate-100">{value}</div>
      <div className="mt-0.5 text-xs text-slate-400">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

const fmtWhen = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

export default function AdminDashboardPage() {
  const isAdmin = useIsAdmin();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin !== true) return;
    fetch("/api/admin/overview")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [isAdmin]);

  if (isAdmin === null) {
    return <div className="p-10 text-center text-slate-400">Checking permissions…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="p-10 text-center text-red-400">
        You do not have permission to view this page.
      </div>
    );
  }

  const t = data?.totals ?? {};
  const r = data?.recent ?? {};

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-slate-100">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
        {data && (
          <span className="text-xs text-slate-500">
            as of{" "}
            {new Date(data.generatedAt).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!data && !error && <p className="text-sm text-slate-400">Loading…</p>}

      {data && (
        <>
          {/* Problems first: the numbers are context, but this is the reason to
              open the page at all. */}
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
              Needs attention
            </h2>
            {data.issues.length === 0 ? (
              <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300">
                Nothing flagged. No routing failures, no unsynced subscriptions, and
                no records missing a postcode.
              </div>
            ) : (
              <ul className="space-y-2">
                {data.issues.map((i) => (
                  <li
                    key={i.id}
                    className={`rounded-xl border px-4 py-3 ${
                      i.severity === "warn"
                        ? "border-amber-700/50 bg-amber-950/20"
                        : "border-slate-800 bg-slate-900/60"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            i.severity === "warn" ? "text-amber-200" : "text-slate-200"
                          }`}
                        >
                          {i.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                          {i.detail}
                        </p>
                      </div>
                      {i.href && (
                        <Link
                          href={i.href}
                          className="shrink-0 rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
                        >
                          Look
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
              Accounts
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <Stat
                label="Owner accounts"
                value={t.owners ?? 0}
                sub={`+${r.newOwners30 ?? 0} in 30 days`}
              />
              <Stat label="Pro" value={t.pro ?? 0} />
              <Stat label="Free" value={t.free ?? 0} />
              <Stat
                label="Staff logins"
                value={t.staffAccounts ?? 0}
                sub={`${t.staffWithLogin ?? 0} staff linked`}
              />
              <Stat label="Admins" value={t.admins ?? 0} />
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
              Data
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <Stat label="Staff records" value={t.staffRecords ?? 0} />
              <Stat
                label="Appointments"
                value={t.appointments ?? 0}
                sub={`${t.recurring ?? 0} recurring`}
              />
              <Stat label="Archived" value={t.archivedAppointments ?? 0} />
              <Stat label="Saved routes" value={t.savedRoutes ?? 0} />
              <Stat
                label="Share links"
                value={t.shareLinks ?? 0}
                sub={`${t.activeShareLinks ?? 0} still active`}
              />
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
              Usage
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Schedules generated (7d)" value={r.schedules7 ?? 0} />
              <Stat label="Schedules generated (30d)" value={r.schedules30 ?? 0} />
              <Stat label="New accounts (7d)" value={r.newOwners7 ?? 0} />
              <Stat label="New accounts (30d)" value={r.newOwners30 ?? 0} />
            </div>

            {Object.keys(data.actionCounts).length > 0 && (
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <p className="mb-2 text-xs text-slate-400">
                  Logged actions across the most recent 400 entries
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(data.actionCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([action, count]) => (
                      <span
                        key={action}
                        className={`rounded border px-2 py-0.5 text-[11px] ${
                          action.includes("error") || action.includes("failed")
                            ? "border-amber-700/60 text-amber-300"
                            : "border-slate-700 text-slate-300"
                        }`}
                      >
                        {action}{" "}
                        <span className="tabular-nums text-slate-500">{count}</span>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </section>

          <section className="mb-8">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                Recent activity
              </h2>
              <Link href="/admin/logs" className="text-xs text-teal-400 hover:text-teal-300">
                All logs →
              </Link>
            </div>
            {data.activity.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing logged yet.</p>
            ) : (
              <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/60">
                {data.activity.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-baseline gap-x-3 px-4 py-2 text-xs"
                  >
                    <span className="font-medium text-slate-200">{a.action}</span>
                    <span className="text-slate-500">{fmtWhen(a.created_at)}</span>
                    {a.detail && (
                      <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-slate-500">
                        {a.detail}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
              Sections
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {SECTIONS.map(([href, title, desc]) => (
                <Link
                  key={href}
                  href={href}
                  className="group rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 transition hover:border-teal-500/40 hover:bg-slate-900"
                >
                  <div className="text-sm font-medium text-slate-100 group-hover:text-teal-300">
                    {title}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                    {desc}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

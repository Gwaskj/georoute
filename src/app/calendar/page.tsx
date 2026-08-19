import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CalendarView from "@/components/calendar/CalendarView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendar",
  description:
    "See which visits fall on which day, and skip or move a single occurrence without changing the rest of the series.",
  // Shows client names once populated, so it is kept out of the index for the
  // same reason /account and /staff are.
  robots: { index: false, follow: false },
};

function Gate({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: { href: string; label: string }[];
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="mb-3 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mb-8 text-sm leading-relaxed text-slate-400">{body}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {cta.map((c, i) => (
            <Link
              key={c.href}
              href={c.href}
              className={
                i === 0
                  ? "inline-flex items-center rounded-full bg-teal-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
                  : "inline-flex items-center rounded-full border border-slate-600 px-6 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              }
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function CalendarPage() {
  const user = await getUser();

  if (!user) {
    return (
      <Gate
        title="Calendar is a Pro feature"
        body="Planning visits across future dates needs somewhere to keep them, so the calendar requires an account. Free mode holds your data in the browser session only, which cannot carry a round from one day to the next."
        cta={[
          { href: "/signup", label: "Create an account" },
          { href: "/pricing", label: "See pricing" },
        ]}
      />
    );
  }

  // Staff accounts are read-only and have their own page; showing them an
  // upgrade prompt would be misleading, since upgrading is not theirs to do.
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("owner_user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.owner_user_id) redirect("/my-round");

  const status = await getSubscriptionStatus(user.id);

  if (status !== "pro") {
    return (
      <Gate
        title="Calendar is a Pro feature"
        body="Upgrade to Pro to schedule visits on future dates, set up recurring rounds, and skip or move a single occurrence without disturbing the rest of the series."
        cta={[
          { href: "/pricing", label: "Upgrade to Pro" },
          { href: "/scheduler", label: "Back to scheduler" },
        ]}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-slate-400">
            Which visits are due on which day. Select a date to skip or move a
            single occurrence, or to plan that day.
          </p>
        </header>

        <CalendarView />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/auth";
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

export default async function CalendarPage() {
  const user = await getUser();
  const isFree = !user;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-slate-400">
            Which visits are due on which day. Select a date to skip or move a
            single occurrence, or to plan that day.
          </p>
          {isFree && (
            <p className="mt-2 rounded border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-400">
              You are in free mode, so this only shows the appointments in this
              browser session.{" "}
              <Link href="/signup" className="text-teal-400 hover:text-teal-300">
                Create an account
              </Link>{" "}
              to keep them.
            </p>
          )}
        </header>

        <CalendarView isFree={isFree} />
      </div>
    </div>
  );
}

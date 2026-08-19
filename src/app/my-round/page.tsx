import type { Metadata } from "next";
import RoundFromFragment from "@/components/share/RoundFromFragment";

/**
 * A carer's round.
 *
 * This used to require a staff login and read the round from shared_schedules
 * over RLS. Both are gone: the round arrives in the URL fragment, which the
 * browser never transmits, so there is nothing here to authenticate against
 * and nothing on the server to read.
 */

// Belt and braces alongside the robots.txt disallow. A round link may be
// pasted into a group chat that pre-fetches URLs, so it must never be indexed
// even if a crawler reaches it directly.
export const metadata: Metadata = {
  title: "My round",
  robots: { index: false, follow: false, nocache: true },
};

export default function MyRoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <RoundFromFragment />
    </div>
  );
}

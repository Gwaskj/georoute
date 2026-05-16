// src/app/scheduler/page.tsx
import { getUser } from "@/lib/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import SchedulePage from "@/components/schedule/SchedulePage";

export default async function SchedulerPage() {
  const user = await getUser();
  const status = await getSubscriptionStatus(user?.id ?? null);

  // Free = no user OR subscription status = "free"
  const isFree = status === "free";

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-50">Scheduler</h1>

          <span className="rounded-full border border-teal-500/40 bg-slate-900 px-3 py-1 text-xs text-teal-300">
            {isFree
              ? "Free tier · session‑only · no saved data"
              : "Pro · Supabase‑backed · persistent data"}
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <SchedulePage isFree={isFree} />
        </div>
      </div>
    </div>
  );
}


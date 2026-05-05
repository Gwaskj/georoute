import { getUser } from '@/lib/auth';
import { getSubscriptionStatus } from '@/lib/subscription';

export default async function SchedulerPage() {
  const user = await getUser();
  const status = await getSubscriptionStatus(user?.id ?? null);

  const isFree = status === 'free';

  // Here you’d query today’s routes and enforce the 10 routes/day limit in server actions.
  // Show a banner if they hit the limit.

  return (
    <div className="bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-50">Scheduler</h1>
          {isFree && (
            <span className="rounded-full border border-teal-500/40 bg-slate-900 px-3 py-1 text-xs text-teal-300">
              Free tier · 10 routes/day
            </span>
          )}
        </div>
        {/* Your existing drag-and-drop scheduler goes here */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
          {/* Replace this with your real scheduler UI */}
          Scheduler UI placeholder – wire your existing component here.
        </div>
      </div>
    </div>
  );
}

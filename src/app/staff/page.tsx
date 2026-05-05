import { getUser } from '@/lib/auth';
import { getSubscriptionStatus } from '@/lib/subscription';

export default async function StaffPage() {
  const user = await getUser();
  const status = await getSubscriptionStatus(user?.id ?? null);
  const isFree = status === 'free';

  // Query staff count from Supabase and enforce max 2 on free tier in server actions.

  return (
    <div className="bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-50">Staff</h1>
          {isFree && (
            <span className="rounded-full border border-teal-500/40 bg-slate-900 px-3 py-1 text-xs text-teal-300">
              Free tier · Max 2 staff
            </span>
          )}
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
          {/* Replace with your staff list + add staff form */}
          Staff management UI placeholder – enforce max 2 staff in server actions.
        </div>
      </div>
    </div>
  );
}

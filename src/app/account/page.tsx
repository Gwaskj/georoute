import { getUser } from '@/lib/auth';
import { getSubscriptionStatus } from '@/lib/subscription';
import Link from 'next/link';

export default async function AccountPage() {
  const user = await getUser();
  const status = await getSubscriptionStatus(user?.id ?? null);

  return (
    <div className="bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold text-slate-50">Account</h1>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
          <p>Email: <span className="font-medium text-slate-100">{user?.email}</span></p>
          <p className="mt-2">
            Plan:{' '}
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs uppercase tracking-wide text-teal-300">
              {status === 'pro' ? 'Pro' : 'Free'}
            </span>
          </p>
          <div className="mt-4">
            <Link
              href="/app/account/billing"
              className="text-sm font-medium text-teal-300 hover:text-teal-200"
            >
              Manage billing →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

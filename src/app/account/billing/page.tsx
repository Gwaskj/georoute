import { getUser } from '@/lib/auth';
import { getSubscriptionStatus } from '@/lib/subscription';

export default async function BillingPage() {
  const user = await getUser();
  const status = await getSubscriptionStatus(user?.id ?? null);

  // Wire this to Stripe customer portal / checkout session.

  return (
    <div className="bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold text-slate-50">Billing</h1>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
          <p className="mb-2">
            Current plan:{' '}
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs uppercase tracking-wide text-teal-300">
              {status === 'pro' ? 'Pro' : 'Free'}
            </span>
          </p>
          <p className="text-xs text-slate-400">
            Connect this page to your Stripe customer portal or checkout session to let users upgrade,
            downgrade, or cancel their subscription.
          </p>
          <button
            className="mt-4 rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-teal-400 px-4 py-2 text-sm font-medium text-slate-950 hover:brightness-110 transition"
          >
            Open billing portal
          </button>
        </div>
      </div>
    </div>
  );
}

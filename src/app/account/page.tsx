import { getUser } from '@/lib/auth';
import { getSubscriptionStatus } from '@/lib/subscription';
import ManageBillingButton from '@/components/account/ManageBillingButton';
import ChangePasswordForm from '@/components/account/ChangePasswordForm';

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
          <p className="mt-2 text-xs text-slate-400">
            Manage your subscription, payment method, and invoices via the Stripe billing portal.
          </p>
          <div className="mt-4">
            <ManageBillingButton />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Change password</h2>
          <p className="mt-1 text-xs text-slate-400">
            Update the password used to sign in to your account.
          </p>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}

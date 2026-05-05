import { AdBlock } from '@/components/AdBlock';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Simple pricing for growing teams
          </h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Start free, then upgrade when you’re ready to scale beyond 2 staff and 10 routes per day.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-sm font-semibold text-slate-100">Free</h2>
            <p className="mt-1 text-xs text-slate-400">Perfect for testing GeoRoute with a small team.</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-slate-50">£0</span>
              <span className="text-xs text-slate-400">/month</span>
            </div>
            <ul className="mt-4 space-y-2 text-xs text-slate-300">
              <li>• Up to 2 staff members</li>
              <li>• Up to 10 routes per day</li>
              <li>• Core drag-and-drop scheduler</li>
              <li>• Basic route overview</li>
              <li>• Ads on public pages</li>
            </ul>
            <Link
              href="/signup"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800 transition"
            >
              Start free
            </Link>
          </div>
          <div className="relative rounded-2xl border border-teal-500/60 bg-gradient-to-br from-green-600 via-teal-600 to-teal-500 p-6 text-slate-950 shadow-xl shadow-teal-500/40">
            <div className="absolute right-4 top-4 rounded-full bg-slate-950/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-900">
              Most popular
            </div>
            <h2 className="text-sm font-semibold">Pro</h2>
            <p className="mt-1 text-xs text-slate-900/80">
              For teams that rely on GeoRoute every day.
            </p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-semibold">£29</span>
              <span className="text-xs text-slate-900/80">/month per workspace</span>
            </div>
            <ul className="mt-4 space-y-2 text-xs text-slate-900/90">
              <li>• Unlimited staff members</li>
              <li>• Unlimited routes per day</li>
              <li>• Priority scheduling performance</li>
              <li>• No ads anywhere</li>
              <li>• Priority support</li>
            </ul>
            <Link
              href="/signup"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-slate-50 hover:bg-slate-900 transition"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
        <div className="mt-10">
          <AdBlock />
        </div>
      </div>
    </div>
  );
}

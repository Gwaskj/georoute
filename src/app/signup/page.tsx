import Link from 'next/link';
import { AdBlock } from '@/components/AdBlock';

export default function SignupPage() {
  return (
    <div className="bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 md:flex-row md:items-start">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-slate-50">Create your GeoRoute workspace</h1>
          <p className="mt-2 text-sm text-slate-300">
            Start free with up to 2 staff and 10 routes per day. Upgrade when you’re ready.
          </p>
          {/* Replace with your actual signup logic */}
          <form className="mt-6 space-y-4 max-w-sm">
            <div className="space-y-1 text-sm">
              <label className="text-slate-200">Work email</label>
              <input
                type="email"
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-teal-400"
              />
            </div>
            <div className="space-y-1 text-sm">
              <label className="text-slate-200">Password</label>
              <input
                type="password"
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-teal-400"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-teal-400 px-4 py-2 text-sm font-medium text-slate-950 hover:brightness-110 transition"
            >
              Create workspace
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-teal-300 hover:text-teal-200">
              Log in
            </Link>
          </p>
        </div>
        <div className="flex-1">
          <AdBlock />
        </div>
      </div>
    </div>
  );
}

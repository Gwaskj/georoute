"use client";

import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import Link from "next/link";

export default function AdminSettingsPage() {
  const isAdmin = useIsAdmin();

  if (isAdmin === null) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Admin Settings</h1>
      <p className="text-slate-400 mb-6">
        Scheduling settings (office postcode, day hours) are per-user and managed from the{" "}
        <Link href="/settings" className="text-teal-400 underline hover:text-teal-300">
          Settings page
        </Link>
        .
      </p>
    </div>
  );
}

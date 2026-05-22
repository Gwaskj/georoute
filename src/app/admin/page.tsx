"use client";

import { useIsAdmin } from "@/lib/hooks/useIsAdmin";

export default function AdminDashboardPage() {
  const isAdmin = useIsAdmin();

  if (isAdmin === null) {
    return (
      <div className="p-10 text-center text-gray-400">
        Checking permissions…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-10 text-center text-red-500">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-semibold mb-4">Admin Dashboard</h1>
      <p className="text-gray-300">Welcome, admin.</p>
    </div>
  );
}

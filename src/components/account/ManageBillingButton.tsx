"use client";

import { useState } from "react";

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setError(data?.error ?? "Could not open the billing portal.");
    } catch {
      setError("Could not open the billing portal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-teal-400 px-4 py-2 text-sm font-medium text-slate-950 hover:brightness-110 transition disabled:opacity-50"
      >
        {loading ? "Opening…" : "Manage subscription"}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

"use client";

import { createClient } from "@/lib/supabase/client";

export default function PricingPage() {
  async function upgrade() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({ user_id: user.id }),
    });

    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">GeoRoute Pro</h1>
      <p className="mb-6 text-gray-600">
        Unlock full scheduling, staff, routes, and cloud syncing.
      </p>

      <button
        onClick={upgrade}
        className="px-6 py-3 bg-black text-white rounded-md"
      >
        Upgrade to Pro
      </button>
    </div>
  );
}

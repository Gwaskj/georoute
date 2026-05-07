"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/supabaseClient";

export default function AdminPricingEditor() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Load user
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user || null;
      setUser(currentUser);

      // Load profile
      if (currentUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", currentUser.id)
          .single();

        setProfile(profileData);
      }

      // Load pricing plans
      const { data: pricingData } = await supabase
        .from("pricing")
        .select("*")
        .order("price");

      // Ensure features is always an array
      const normalized = (pricingData || []).map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : p.features ? p.features : [],
      }));

      setPlans(normalized);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) return null;

  // Block non-admins
  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-300 text-sm">You do not have permission to edit pricing.</p>
      </div>
    );
  }

  async function saveChanges() {
    setSaving(true);

    for (const plan of plans) {
      // 1. Create new Stripe price via Edge Function
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-stripe-price`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            plan: plan.plan,
            amount: plan.price,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.priceId) {
        console.error("Stripe price creation failed:", json);
        alert("Failed to create Stripe price for plan: " + plan.plan);
        setSaving(false);
        return;
      }

      const priceId = json.priceId as string;

      // 2. Save new price + Stripe Price ID to Supabase
      await supabase
        .from("pricing")
        .update({
          plan: plan.plan,
          price: plan.price,
          description: plan.description,
          features: plan.features,
          stripe_price_id: priceId,
        })
        .eq("id", plan.id);
    }

    setSaving(false);
    alert("Pricing + Stripe updated successfully");
  }

  function updateFeature(planIndex: number, featureIndex: number, value: string) {
    const updated = [...plans];
    updated[planIndex].features[featureIndex] = value;
    setPlans(updated);
  }

  function addFeature(planIndex: number) {
    const updated = [...plans];
    updated[planIndex].features.push("");
    setPlans(updated);
  }

  function removeFeature(planIndex: number, featureIndex: number) {
    const updated = [...plans];
    updated[planIndex].features.splice(featureIndex, 1);
    setPlans(updated);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-6 py-10">
      <h1 className="text-3xl font-semibold mb-8">Admin Pricing Editor</h1>

      <div className="grid gap-8 md:grid-cols-2">
        {plans.map((plan, planIndex) => (
          <div
            key={plan.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <h2 className="text-lg font-semibold capitalize">{plan.plan}</h2>

            {/* Plan name */}
            <label className="block mt-4 text-sm text-slate-300">Plan name</label>
            <input
              className="w-full mt-1 rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
              value={plan.plan}
              onChange={(e) => {
                const updated = [...plans];
                updated[planIndex].plan = e.target.value;
                setPlans(updated);
              }}
            />

            {/* Price */}
            <label className="block mt-4 text-sm text-slate-300">Price (£)</label>
            <input
              type="number"
              className="w-full mt-1 rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
              value={plan.price}
              onChange={(e) => {
                const updated = [...plans];
                updated[planIndex].price = Number(e.target.value);
                setPlans(updated);
              }}
            />

            {/* Description */}
            <label className="block mt-4 text-sm text-slate-300">Description</label>
            <textarea
              className="w-full mt-1 rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
              value={plan.description}
              onChange={(e) => {
                const updated = [...plans];
                updated[planIndex].description = e.target.value;
                setPlans(updated);
              }}
            />

            {/* Features */}
            <label className="block mt-4 text-sm text-slate-300">Features</label>
            <div className="space-y-2 mt-2">
              {plan.features.map((feature: string, featureIndex: number) => (
                <div key={featureIndex} className="flex gap-2">
                  <input
                    className="flex-1 rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                    value={feature}
                    onChange={(e) =>
                      updateFeature(planIndex, featureIndex, e.target.value)
                    }
                  />
                  <button
                    onClick={() => removeFeature(planIndex, featureIndex)}
                    className="px-3 py-2 text-xs bg-red-600 rounded hover:bg-red-700"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => addFeature(planIndex)}
              className="mt-3 px-4 py-2 text-xs bg-slate-700 rounded hover:bg-slate-600"
            >
              + Add feature
            </button>

            {/* Stripe Price ID (read-only display) */}
            <div className="mt-4 text-[11px] text-slate-400 break-all">
              Current Stripe price ID:
              <br />
              {plan.stripe_price_id || "None yet (will be created on save)"}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={saveChanges}
        disabled={saving}
        className="mt-10 rounded-full bg-teal-500 text-slate-900 px-6 py-3 font-medium hover:brightness-110 transition disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save changes (and update Stripe)"}
      </button>
    </div>
  );
}

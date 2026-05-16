"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import AdBanner from "@/components/AdBanner";

export default function PricingPage() {
  const supabase = createSupabaseBrowserClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("is_pro, is_admin")
          .eq("user_id", currentUser.id)
          .single();

        setProfile(profileData);
      }

      const { data: pricingData } = await supabase
        .from("pricing")
        .select("*")
        .order("price");

      setPlans(pricingData || []);
      setLoading(false);
    }

    load();
  }, [supabase]);

  if (loading) return null;

  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Simple pricing for growing teams
          </h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Start free, then upgrade when you’re ready to scale.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 ${
                plan.plan === "pro"
                  ? "border border-teal-500/60 bg-gradient-to-br from-green-600 via-teal-600 to-teal-500 text-slate-950 shadow-xl shadow-teal-500/40"
                  : "border border-slate-800 bg-slate-900/80 text-slate-50"
              }`}
            >
              <h2 className="text-sm font-semibold capitalize">{plan.plan}</h2>
              <p className="mt-1 text-xs opacity-80">{plan.description}</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-semibold">£{plan.price}</span>
                <span className="text-xs opacity-80">/month</span>
              </div>

              <ul className="mt-4 space-y-2 text-xs opacity-90">
                {plan.features?.map((f: string, i: number) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition ${
                  plan.plan === "pro"
                    ? "bg-slate-950 text-slate-50 hover:bg-slate-900"
                    : "border border-slate-700 text-slate-100 hover:bg-slate-800"
                }`}
              >
                {plan.plan === "pro" ? "Upgrade to Pro" : "Start free"}
              </Link>
            </div>
          ))}
        </div>

        {/* Ads only for free users */}
        {!user || (user && profile && !profile.is_pro) ? (
          <div className="mt-10">
            <AdBanner />
          </div>
        ) : null}

        {/* Admin link */}
        {profile?.is_admin && (
          <div className="mt-10 text-center">
            <Link
              href="/admin/pricing"
              className="text-teal-400 hover:text-teal-300 text-sm underline"
            >
              Edit pricing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

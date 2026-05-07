"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/supabase/supabaseClient";
import AdBanner from "@/components/AdBanner";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("is_pro")
          .eq("id", currentUser.id)
          .single();

        setProfile(profileData);
      }

      setLoading(false);
    }

    loadUser();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-20">

        {/* Ads for free logged-in users */}
        {user && profile && !profile.is_pro && (
          <div className="mb-10">
            <AdBanner />
          </div>
        )}

        {/* Logged OUT content */}
        {!loading && !user && (
          <>
            <h1 className="text-4xl font-bold">Welcome to GeoRoute</h1>
            <p className="mt-4 text-slate-300 max-w-xl">
              Plan routes, manage staff schedules, and streamline your daily operations.
            </p>

            <div className="mt-8 flex gap-4">
              <Link
                href="/login"
                className="rounded-full bg-teal-500 text-slate-900 px-6 py-3 font-medium hover:brightness-110 transition"
              >
                Log in
              </Link>

              <Link
                href="/signup"
                className="rounded-full border border-teal-500 text-teal-300 px-6 py-3 font-medium hover:bg-teal-600 hover:text-slate-900 transition"
              >
                Create account
              </Link>
            </div>

            {/* Ads allowed for logged-out users */}
            <div className="mt-12">
              <AdBanner />
            </div>
          </>
        )}

        {/* Logged IN content */}
        {!loading && user && (
          <>
            <h1 className="text-4xl font-bold">Welcome back</h1>
            <p className="mt-4 text-slate-300 max-w-xl">
              Access your routes, schedules, and tools below.
            </p>

            <div className="mt-8 flex gap-4">
              <Link
                href="/scheduler"
                className="rounded-full bg-teal-500 text-slate-900 px-6 py-3 font-medium hover:brightness-110 transition"
              >
                Go to Scheduler
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

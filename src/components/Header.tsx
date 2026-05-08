"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabaseClient";

interface HeaderProps {
  title: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  logo_x: number;
  logo_y: number;
  logo_scale: number;
  banner_offset_x: number;
  banner_offset_y: number;
}

export default function Header(props: HeaderProps) {
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 150);

    async function loadUser() {
      const { data: userData } = await supabase.auth.getUser();
      const u = userData?.user || null;
      setUser(u);

      if (u) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("is_pro, subscription_renewal")
          .eq("user_id", u.id)
          .single();

        setProfile(profileData);
      }
    }

    loadUser();
    return () => clearTimeout(t);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function openBillingPortal() {
    if (!user) return;

    const { data: session } = await supabase.auth.getSession();
    const accessToken = session?.session?.access_token;
    if (!accessToken) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-portal-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ user_id: user.id }),
      }
    );

    const json = await res.json();
    if (json.url) window.location.href = json.url;
  }

  const safeTitle = props.title || "GeoRoute";
  const safeLogo = props.logoUrl || "/logo-placeholder.png";

  if (!loaded) {
    return (
      <header className="h-20 w-full bg-slate-800/40 backdrop-blur-sm" />
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900/40 backdrop-blur-xl border-b border-slate-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">

        {/* LOGO + TITLE */}
        <div
          className="flex items-center gap-3"
          style={{
            transform: `translate(${props.logo_x}px, ${props.logo_y}px) scale(${props.logo_scale})`,
            transformOrigin: "top left",
          }}
        >
          <Image
            src={safeLogo}
            alt="Logo"
            width={50}
            height={50}
            className="object-contain"
          />
          <span className="text-xl font-semibold text-white">{safeTitle}</span>
        </div>

        {/* NAV */}
        <nav className="flex items-center gap-6 text-slate-200">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/scheduler" className="hover:text-white">Scheduler</Link>
          {!user && <Link href="/login" className="hover:text-white">Login</Link>}
        </nav>

        {/* USER AREA */}
        {user && (
          <div className="flex items-center gap-3">

            {/* PLAN BADGE */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                profile?.is_pro
                  ? "bg-emerald-400 text-black"
                  : "bg-amber-400 text-black"
              }`}
            >
              {profile?.is_pro ? "Pro" : "Free"}
            </span>

            {/* RENEWAL DATE */}
            {profile?.is_pro && profile.subscription_renewal && (
              <span className="text-xs text-slate-300">
                Renews: {new Date(profile.subscription_renewal).toLocaleDateString()}
              </span>
            )}

            {/* BILLING */}
            {profile?.is_pro && (
              <button
                onClick={openBillingPortal}
                className="rounded-full bg-teal-500 px-4 py-1 text-xs font-semibold text-black hover:bg-teal-400"
              >
                Billing
              </button>
            )}

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="rounded-full bg-red-500 px-4 py-1 text-xs font-semibold text-white hover:bg-red-400"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

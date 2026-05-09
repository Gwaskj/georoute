"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/supabase/supabaseClient";

interface HeaderProps {
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
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const safeLogo = props.logoUrl || "/logo-placeholder.png";
  const safeBanner = props.bannerUrl || "/Banner-placeholder.jpg";

  if (!loaded) {
    return <header className="h-20 w-full bg-slate-800/40" />;
  }

  return (
    <header
      className="w-full relative shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
      style={{
        backgroundImage: `url(${safeBanner})`,
        backgroundSize: "cover",
        backgroundPosition: `${props.banner_offset_x}px ${props.banner_offset_y}px`,
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">

        <div
          className="flex items-center"
          style={{
            transform: `translate(${props.logo_x}px, ${props.logo_y}px) scale(${props.logo_scale * 0.9})`,
            transformOrigin: "top left",
          }}
        >
          <Image
            src={safeLogo}
            alt="Logo"
            width={130}
            height={130}
            className="object-contain"
          />
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white text-3xl px-3 py-1 rounded-md hover:bg-white/10 transition"
          >
            ☰
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg shadow-xl p-3 flex flex-col w-44 z-50">

              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="text-white py-2 px-3 rounded hover:bg-slate-700 transition"
              >
                Home
              </Link>

              <Link
                href="/scheduler"
                onClick={() => setMenuOpen(false)}
                className="text-white py-2 px-3 rounded hover:bg-slate-700 transition"
              >
                Scheduler
              </Link>

              {profile?.is_pro && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    openBillingPortal();
                  }}
                  className="text-black bg-emerald-400 py-2 px-3 rounded hover:bg-emerald-300 transition text-left"
                >
                  Billing
                </button>
              )}

              {profile?.is_pro && (
                <span className="text-xs text-slate-300 px-3 py-1">
                  Renews: {new Date(profile.subscription_renewal).toLocaleDateString()}
                </span>
              )}

              {user && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="text-white bg-red-500 py-2 px-3 rounded hover:bg-red-400 transition text-left"
                >
                  Logout
                </button>
              )}

              {!user && (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-white py-2 px-3 rounded hover:bg-slate-700 transition"
                >
                  Login
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

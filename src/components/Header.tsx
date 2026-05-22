"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";

const supabase = createSupabaseBrowserClient();

export default function Header({
  logoUrl,
  bannerUrl,
  logo_x,
  logo_y,
  logo_scale,
  banner_offset_x,
  banner_offset_y,
  banner_scale,
}: {
  logoUrl: string | null;
  bannerUrl: string | null;
  logo_x: number;
  logo_y: number;
  logo_scale: number;
  banner_offset_x: number;
  banner_offset_y: number;
  banner_scale: number;
}) {
  const isAdmin = useIsAdmin();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      const u = auth?.user || null;
      setUser(u);

      if (u) {
        const { data: p } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", u.id)
          .single();

        setProfile(p || null);
      }
    }

    load();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const isPro = profile?.plan === "pro";

  return (
    <header className="relative w-full bg-slate-950 text-slate-100 border-b border-slate-800">

      {/* BANNER */}
      {bannerUrl && (
        <div
          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
          style={{
            transform: `translate(${banner_offset_x}px, ${banner_offset_y}px) scale(${banner_scale})`,
            transformOrigin: "top left",
          }}
        >
          <Image
            src={bannerUrl}
            alt="Banner"
            fill
            className="object-cover opacity-40"
          />
        </div>
      )}

      {/* INNER HEADER */}
      <div className="relative max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 relative">
            {logoUrl && (
              <Image
                src={logoUrl}
                alt="Logo"
                width={100}
                height={100}
                style={{
                  transform: `translate(${logo_x}px, ${logo_y}px) scale(${logo_scale})`,
                  transformOrigin: "top left",
                }}
                className="object-contain"
              />
            )}

            <span className="font-semibold text-lg tracking-tight">
              GeoRoute
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/scheduler" className="hover:text-teal-400">
              Scheduler
            </Link>

            {user && (
              <Link href="/account" className="hover:text-teal-400">
                Account
              </Link>
            )}

            {isPro && (
              <Link href="/account/billing" className="hover:text-teal-400">
                Billing
              </Link>
            )}

            {isAdmin && (
              <div
                className="relative"
                onMouseEnter={() => setAdminOpen(true)}
                onMouseLeave={() => setAdminOpen(false)}
              >
                <button className="hover:text-teal-400">Admin</button>

                {adminOpen && (
                  <div className="absolute left-0 top-full w-48 z-50 bg-slate-900 border border-slate-700 rounded shadow-lg py-2">
                    <Link href="/admin/users" className="block px-4 py-2 hover:bg-slate-800">Users</Link>
                    <Link href="/admin/staff" className="block px-4 py-2 hover:bg-slate-800">Staff</Link>
                    <Link href="/admin/appointments" className="block px-4 py-2 hover:bg-slate-800">Appointments</Link>
                    <Link href="/admin/pricing" className="block px-4 py-2 hover:bg-slate-800">Pricing</Link>
                    <Link href="/admin/header-editor" className="block px-4 py-2 hover:bg-slate-800">Header Editor</Link>
                    <Link href="/admin/logs" className="block px-4 py-2 hover:bg-slate-800">Logs</Link>
                    <Link href="/admin/settings" className="block px-4 py-2 hover:bg-slate-800">Settings</Link>
                    <Link href="/admin/editor" className="block px-4 py-2 hover:bg-slate-800">Editor</Link>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* RIGHT */}
        <div className="hidden md:flex items-center gap-4">
          {!user && (
            <Link
              href="/login"
              className="px-4 py-2 bg-teal-500 text-slate-900 rounded font-medium hover:brightness-110"
            >
              Login
            </Link>
          )}

          {user && (
            <button
              onClick={logout}
              className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700"
            >
              Logout
            </button>
          )}
        </div>

        <button
          className="md:hidden text-slate-300"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";

const supabase = createSupabaseBrowserClient();

export default function Header() {
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
    <header className="w-full bg-slate-950 text-slate-100 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Logo"
              width={34}
              height={34}
              className="rounded"
              style={{ height: "auto" }}
            />
            <span className="font-semibold text-lg tracking-tight">
              GeoRoute
            </span>
          </Link>

          {/* DESKTOP NAV */}
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

            {/* ADMIN DROPDOWN — TRUE HOVER VERSION */}
            {isAdmin && (
              <div
                className="relative"
                onMouseEnter={() => setAdminOpen(true)}
                onMouseLeave={() => setAdminOpen(false)}
              >
                <button className="hover:text-teal-400">Admin</button>

                {adminOpen && (
                  <div
                    className="
                      absolute left-0 top-full w-48 z-50
                      bg-slate-900 border border-slate-700 rounded shadow-lg py-2
                    "
                  >
                    <Link
                      href="/admin/users"
                      className="block px-4 py-2 hover:bg-slate-800"
                    >
                      Users
                    </Link>
                    <Link
                      href="/admin/staff"
                      className="block px-4 py-2 hover:bg-slate-800"
                    >
                      Staff
                    </Link>
                    <Link
                      href="/admin/appointments"
                      className="block px-4 py-2 hover:bg-slate-800"
                    >
                      Appointments
                    </Link>
                    <Link
                      href="/admin/pricing"
                      className="block px-4 py-2 hover:bg-slate-800"
                    >
                      Pricing
                    </Link>
                    <Link
                      href="/admin/header-editor"
                      className="block px-4 py-2 hover:bg-slate-800"
                    >
                      Header Editor
                    </Link>
                    <Link
                      href="/admin/logs"
                      className="block px-4 py-2 hover:bg-slate-800"
                    >
                      Logs
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="block px-4 py-2 hover:bg-slate-800"
                    >
                      Settings
                    </Link>
                    <Link
                      href="/admin/editor"
                      className="block px-4 py-2 hover:bg-slate-800"
                    >
                      Editor
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* RIGHT SIDE */}
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

        {/* MOBILE MENU BUTTON */}
        <button
          className="md:hidden text-slate-300"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-4 space-y-4 text-sm">
          <Link href="/scheduler" className="block">
            Scheduler
          </Link>

          {user && <Link href="/account">Account</Link>}
          {isPro && <Link href="/account/billing">Billing</Link>}

          {isAdmin && (
            <div className="pt-2 border-t border-slate-700">
              <p className="text-xs uppercase text-slate-500 mb-2">Admin</p>

              <Link href="/admin/users" className="block">
                Users
              </Link>
              <Link href="/admin/staff" className="block">
                Staff
              </Link>
              <Link href="/admin/appointments" className="block">
                Appointments
              </Link>
              <Link href="/admin/pricing" className="block">
                Pricing
              </Link>
              <Link href="/admin/header-editor" className="block">
                Header Editor
              </Link>
              <Link href="/admin/logs" className="block">
                Logs
              </Link>
              <Link href="/admin/settings" className="block">
                Settings
              </Link>
              <Link href="/admin/editor" className="block">
                Editor
              </Link>
            </div>
          )}

          {!user && (
            <Link
              href="/login"
              className="block px-4 py-2 bg-teal-500 text-slate-900 rounded font-medium text-center"
            >
              Login
            </Link>
          )}

          {user && (
            <button
              onClick={logout}
              className="w-full px-4 py-2 bg-slate-800 rounded hover:bg-slate-700"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
}

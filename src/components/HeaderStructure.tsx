"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useThemeStore } from "@/store/themeStore";
import SeasonalDoodle from "@/components/effects/SeasonalDoodle";

export type NavItem = {
  id: string;
  text: string;
  href: string;
  align?: "left" | "right";
  isAdmin?: boolean;
};

export type BrandConfig = {
  enabled: boolean;
  text: string;
};

type Props = {
  logoUrl: string | null;
  bannerUrl: string | null;
  logo_x: number;
  logo_y: number;
  logo_scale: number;
  logo_rotation: number;
  banner_offset_x: number;
  banner_offset_y: number;
  banner_scale: number;
  banner_rotation: number;
  brand: BrandConfig;
  navItems: NavItem[];
  userPresent: boolean;
  isPro: boolean;
  isAdmin: boolean;
  onLogout: () => void;
};

export function HeaderStructure({
  logoUrl,
  bannerUrl,
  logo_x,
  logo_y,
  logo_scale,
  logo_rotation,
  banner_offset_x,
  banner_offset_y,
  banner_scale,
  banner_rotation,
  brand,
  navItems,
  userPresent,
  isPro,
  isAdmin,
  onLogout,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const { activeConfig } = useThemeStore();

  const leftNav = navItems.filter((n) => n.align !== "right");
  const rightNav = navItems.filter((n) => n.align === "right");

  return (
    <header className="relative w-full bg-slate-950 text-slate-100 border-b border-slate-800">
      {bannerUrl && (
        <div
          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
          style={{
            transform: `translate(${banner_offset_x}px, ${banner_offset_y}px) scale(${banner_scale}) rotate(${banner_rotation}deg)`,
            transformOrigin: "top left",
          }}
        >
          <Image
            src={bannerUrl}
            alt="Banner"
            fill
            className="object-cover opacity-40"
            priority
          />
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 relative">
            {logoUrl && (
              <div
                className="relative inline-block"
                style={{
                  transform: `translate(${logo_x}px, ${logo_y}px) scale(${logo_scale}) rotate(${logo_rotation}deg)`,
                  transformOrigin: "top left",
                }}
              >
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={100}
                  height={100}
                  className="object-contain"
                  style={{ width: "100px", height: "100px" }}
                />
              </div>
            )}

            {brand.enabled && (
              <span className="relative inline-flex items-end font-semibold text-lg tracking-tight">
                {activeConfig.logoDoodle !== "none" && (
                  <span
                    className="absolute pointer-events-none"
                    style={{ top: "-22px", left: "-4px" }}
                    aria-hidden
                  >
                    <SeasonalDoodle
                      doodle={activeConfig.logoDoodle}
                      color={activeConfig.logoDoodleColor}
                    />
                  </span>
                )}
                {brand.text}
              </span>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            {leftNav.map((item) => {
              if (item.isAdmin && !isAdmin) return null;

              if (item.id === "admin") {
                return (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => setAdminOpen(true)}
                    onMouseLeave={() => setAdminOpen(false)}
                  >
                    <button className="hover:text-teal-400">{item.text}</button>

                    {adminOpen && (
                      <div className="absolute left-0 top-full w-48 z-50 bg-slate-900 border border-slate-700 rounded shadow-lg py-2">
                        <Link href="/admin/users" className="block px-4 py-2 hover:bg-slate-800">Users</Link>
                        <Link href="/admin/staff" className="block px-4 py-2 hover:bg-slate-800">Staff</Link>
                        <Link href="/admin/appointments" className="block px-4 py-2 hover:bg-slate-800">Appointments</Link>
                        <Link href="/admin/pricing" className="block px-4 py-2 hover:bg-slate-800">Pricing</Link>
                        <Link href="/admin/logs" className="block px-4 py-2 hover:bg-slate-800">Logs</Link>
                        <Link href="/admin/header-editor" className="block px-4 py-2 hover:bg-slate-800">Header Editor</Link>
                        <Link href="/admin/themes" className="block px-4 py-2 hover:bg-slate-800">Theme Builder</Link>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link key={item.id} href={item.href} className="hover:text-teal-400">
                  {item.text}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {rightNav.map((item) => {
            if (item.isAdmin && !isAdmin) return null;

            if (item.id === "admin") {
              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => setAdminOpen(true)}
                  onMouseLeave={() => setAdminOpen(false)}
                >
                  <button className="hover:text-teal-400">{item.text}</button>

                  {adminOpen && (
                    <div className="absolute right-0 top-full w-48 z-50 bg-slate-900 border border-slate-700 rounded shadow-lg py-2">
                      <Link href="/admin/users" className="block px-4 py-2 hover:bg-slate-800">Users</Link>
                      <Link href="/admin/staff" className="block px-4 py-2 hover:bg-slate-800">Staff</Link>
                      <Link href="/admin/appointments" className="block px-4 py-2 hover:bg-slate-800">Appointments</Link>
                      <Link href="/admin/pricing" className="block px-4 py-2 hover:bg-slate-800">Pricing</Link>
                      <Link href="/admin/logs" className="block px-4 py-2 hover:bg-slate-800">Logs</Link>
                      <Link href="/admin/header-editor" className="block px-4 py-2 hover:bg-slate-800">Header Editor</Link>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.id} href={item.href} className="hover:text-teal-400 text-sm">
                {item.text}
              </Link>
            );
          })}

          {!userPresent && (
            <Link
              href="/login"
              className="px-4 py-2 bg-teal-500 text-slate-900 rounded font-medium hover:brightness-110"
            >
              Login
            </Link>
          )}

          {userPresent && (
            <button
              onClick={onLogout}
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

        {mobileOpen && (
          <div className="absolute top-16 inset-x-0 bg-slate-950 border-t border-slate-800 md:hidden z-50">
            <nav className="flex flex-col px-4 py-3 gap-2 text-sm">
              {brand.enabled && (
                <span className="py-1 font-semibold">{brand.text}</span>
              )}

              {navItems.map((item) => {
                if (item.isAdmin && !isAdmin) return null;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="py-1 hover:text-teal-400"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.text}
                  </Link>
                );
              })}

              {userPresent ? (
                <button
                  onClick={onLogout}
                  className="mt-2 text-left py-1 text-red-300"
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  className="mt-2 py-1 text-teal-400"
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

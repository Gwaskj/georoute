"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";
import SeasonalDoodle from "@/components/effects/SeasonalDoodle";
import { clampHeaderTransform } from "@/lib/header/bounds";

export type NavItem = {
  id: string;
  text: string;
  href: string;
  align?: "left" | "right";
  isAdmin?: boolean;
  /**
   * Show this item inside the menu dropdown rather than inline in the header.
   * Lets the bar stay short as pages are added, without hiding anything.
   */
  inMenu?: boolean;
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

/**
 * The admin sub-pages, in one place.
 *
 * This list was previously written out three times -- twice in the desktop
 * paths and not at all in the mobile one, which is how the mobile menu ended
 * up rendering "Admin" as an ordinary link to its placeholder href of "#".
 * Tapping it navigated nowhere and the sub-pages were unreachable on a phone.
 */
const ADMIN_LINKS: [string, string][] = [
  ["/admin/errors", "Errors"],
  ["/admin/users", "Users"],
  ["/admin/staff", "Staff"],
  ["/admin/appointments", "Appointments"],
  ["/admin/pricing", "Pricing"],
  ["/admin/logs", "Logs"],
  ["/admin/header-editor", "Header Editor"],
  ["/admin/themes", "Theme Builder"],
  ["/admin/editor", "Page Editor"],
];

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Closing used to be handled by onMouseLeave. With the menu opening on click
  // instead, it needs an explicit way out: a click anywhere else, or Escape.
  // Without this it could only be dismissed by hitting the same button again,
  // which is not where anyone's hand goes next.
  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);
  const { activeConfig } = useThemeStore();

  const leftNav = navItems.filter((n) => n.align !== "right" && !n.inMenu);
  const rightNav = navItems.filter((n) => n.align === "right" && !n.inMenu);
  // Everything flagged inMenu, wherever it was aligned, collects in the
  // dropdown. Admin-only entries are still filtered by isAdmin below.
  const menuNav = navItems.filter((n) => n.inMenu);

  // Clamped on the way in, so no value in the database can push the logo off
  // the page or blow the banner up beyond the bar. The editor clamps too; this
  // is what protects against anything saved before it did, or edited by hand.
  const logo = clampHeaderTransform({
    x: logo_x,
    y: logo_y,
    scale: logo_scale,
    rotation: logo_rotation,
  });
  const banner = clampHeaderTransform({
    x: banner_offset_x,
    y: banner_offset_y,
    scale: banner_scale,
    rotation: banner_rotation,
  });

  return (
    <header className="relative w-full bg-slate-950 text-slate-100 border-b border-slate-800">
      {bannerUrl && (
        /* The clip is on this wrapper, which never moves.
         *
         * It used to sit on the transformed element itself, so scaling or
         * nudging the banner moved its own clipping box and the image could
         * spill outside the header instead of being cropped by it. Anything
         * the editor does now happens inside a fixed frame.
         *
         * pointer-events-none so the banner cannot swallow clicks meant for
         * the logo or the navigation sitting above it. */
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${banner.x}px, ${banner.y}px) scale(${banner.scale}) rotate(${banner.rotation}deg)`,
              // Centre, so the editor's scale control grows the image about
              // its middle rather than throwing it down and to the right.
              transformOrigin: "center",
            }}
          >
            <Image
              src={bannerUrl}
              alt=""
              fill
              // Was 40%, which left a wide landscape squeezed into a 64px
              // strip reading as a smudge rather than a picture. The scrim
              // below now does the contrast work, so the image can be itself.
              className="object-cover opacity-70"
              sizes="100vw"
              priority
            />
          </div>

          {/* Keeps the logo and the navigation legible whatever the banner
              happens to show. Solid at the left where the logo sits, easing
              off across the middle so the image is still visible, and firming
              up again on the right behind the menu. */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/55 to-slate-950/85" />
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 relative">
            {/* The nudge below applies from small screens up, not on a phone.
                The header editor stores one offset for every width, so a value
                chosen to place the logo nicely on a desktop pushed it inward on
                a 390px screen and left a gap where the logo should have been.
                Scale and rotation still apply everywhere; only the translation
                is held back. See .logo-transform in globals.css. */}
            {logoUrl && (
              <div
                className="logo-transform relative inline-block shrink-0"
                style={
                  {
                    "--logo-tx": `${logo.x}px`,
                    "--logo-ty": `${logo.y}px`,
                    "--logo-scale": logo.scale,
                    "--logo-rotation": `${logo.rotation}deg`,
                  } as React.CSSProperties
                }
              >
                {/* The header bar is 64px tall, so a fixed 100x100 logo was
                    being clipped top and bottom on every page. Height is
                    pinned to fit the bar and width follows the aspect ratio,
                    so any logo shape renders whole. */}
                {/* Decorative when the brand name is rendered as text beside
                    it -- announcing "Logo" and then the name repeats it. */}
                <Image
                  src={logoUrl}
                  alt={brand.enabled ? "" : brand.text || "GeoRoutes"}
                  width={200}
                  height={48}
                  className="h-10 w-auto max-w-[160px] object-contain"
                  priority
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
                        <Link href="/admin/editor" className="block px-4 py-2 hover:bg-slate-800">Page Editor</Link>
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
                      <Link href="/admin/themes" className="block px-4 py-2 hover:bg-slate-800">Theme Builder</Link>
                      <Link href="/admin/editor" className="block px-4 py-2 hover:bg-slate-800">Page Editor</Link>
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

          {menuNav.length > 0 && (
            // Click to open, not hover. A tap on a touch device fires a
            // synthetic mouseenter and then a click, so hover-to-open plus
            // click-to-toggle meant the menu opened and immediately closed
            // again on a phone -- and a menu that opens on hover has no way to
            // be dismissed by keyboard either.
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                aria-label="More"
                className="flex items-center gap-2 rounded px-2 py-2 text-sm hover:text-teal-400"
              >
                <span className="flex flex-col gap-[3px]">
                  <span className="block h-[2px] w-4 bg-current" />
                  <span className="block h-[2px] w-4 bg-current" />
                  <span className="block h-[2px] w-4 bg-current" />
                </span>
                Menu
              </button>

              {/* Rendered whether or not the menu is open, and hidden with CSS
                  rather than unmounted. Unmounting meant these links existed
                  only after a hover, so a crawler -- which does not hover --
                  saw a header containing four links and never followed Help or
                  anything else in here. The markup is identical either way, so
                  this is a visibility change, not a difference in what is
                  served to people and to crawlers. */}
              <div
                className={`absolute right-0 top-full z-50 w-52 rounded border border-slate-700 bg-slate-900 py-2 shadow-lg ${
                  menuOpen ? "" : "pointer-events-none invisible opacity-0"
                }`}
                aria-hidden={menuOpen ? undefined : true}
              >
                {(() => {
                  return menuNav.map((item) => {
                    if (item.isAdmin && !isAdmin) return null;

                    // The admin entry has sub-pages. Nesting a second dropdown
                    // inside this one would be awkward to use, so its links are
                    // listed flat under a heading instead.
                    if (item.id === "admin") {
                      return (
                        <div key={item.id} className="mt-1 border-t border-slate-800 pt-1">
                          <p className="px-4 py-1 text-[10px] uppercase tracking-widest text-slate-400">
                            {item.text}
                          </p>
                          {[
                            ["/admin/users", "Users"],
                            ["/admin/staff", "Staff"],
                            ["/admin/appointments", "Appointments"],
                            ["/admin/pricing", "Pricing"],
                            ["/admin/logs", "Logs"],
                            ["/admin/header-editor", "Header Editor"],
                            ["/admin/themes", "Theme Builder"],
                            ["/admin/editor", "Page Editor"],
                          ].map(([href, label]) => (
                            <Link
                              key={href}
                              href={href}
                              onClick={() => setMenuOpen(false)}
                              className="block px-4 py-2 text-sm hover:bg-slate-800"
                            >
                              {label}
                            </Link>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-slate-800"
                      >
                        {item.text}
                      </Link>
                    );
                  });
                })()}
              </div>
            </div>
          )}

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

                // Admin is a heading with sub-pages, not a destination -- its
                // href is only ever "#". Rendered as a link, a tap went to "#"
                // and the sub-pages could not be reached from a phone at all.
                // Listed flat rather than behind a second toggle: a dropdown
                // inside an already-open menu is an extra tap for no benefit
                // when there is room to show the lot.
                if (item.id === "admin") {
                  return (
                    <div key={item.id} className="mt-1 border-t border-slate-800 pt-2">
                      <p className="py-1 text-[10px] uppercase tracking-widest text-slate-400">
                        {item.text}
                      </p>
                      {ADMIN_LINKS.map(([href, label]) => (
                        <Link
                          key={href}
                          href={href}
                          className="block py-1 pl-3 hover:text-teal-400"
                          onClick={() => setMobileOpen(false)}
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  );
                }

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

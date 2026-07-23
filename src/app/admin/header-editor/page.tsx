"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import type { NavItem, BrandConfig } from "@/components/HeaderStructure";

const SNAP = 5;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

type Layout = {
  brand?: BrandConfig | null;
  navItems?: NavItem[] | null;
};

export default function HeaderEditorPage() {
  const isAdmin = useIsAdmin();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [bannerUploadError, setBannerUploadError] = useState<string | null>(null);

  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);

  const [logoX, setLogoX] = useState(0);
  const [logoY, setLogoY] = useState(0);
  const [logoScale, setLogoScale] = useState(1);
  const [logoRotation, setLogoRotation] = useState(0);

  const [bannerX, setBannerX] = useState(0);
  const [bannerY, setBannerY] = useState(0);
  const [bannerScale, setBannerScale] = useState(1);
  const [bannerRotation, setBannerRotation] = useState(0);

  const [brand, setBrand] = useState<BrandConfig>({
    enabled: true,
    text: "GeoRoutes",
  });

  const [navItems, setNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    if (isAdmin !== true) return;

    async function load() {
      const { data } = await supabase
        .from("site_header")
        .select("*")
        .eq("id", 1)
        .single();

      if (!data) return;

      setLogoUrl(data.logo_url);
      setBannerUrl(data.banner_url);

      setLogoX(data.logo_x ?? 0);
      setLogoY(data.logo_y ?? 0);
      setLogoScale(data.logo_scale ?? 1);
      setLogoRotation(data.logo_rotation ?? 0);

      setBannerX(data.banner_offset_x ?? 0);
      setBannerY(data.banner_offset_y ?? 0);
      setBannerScale(data.banner_scale ?? 1);
      setBannerRotation(data.banner_rotation ?? 0);

      const layout = (data.layout || {}) as Layout;

      setBrand(
        layout.brand ?? {
          enabled: true,
          text: "GeoRoutes",
        }
      );

      const defaultNav: NavItem[] = [
        { id: "scheduler", text: "Scheduler", href: "/scheduler", align: "left" },
        { id: "settings", text: "Settings", href: "/settings", align: "left" },
        { id: "account", text: "Account", href: "/account", align: "left" },
        { id: "feedback", text: "Feedback", href: "/feedback", align: "left" },
        { id: "admin", text: "Admin", href: "#", align: "right", isAdmin: true },
      ];

      let items: NavItem[] =
        layout.navItems && Array.isArray(layout.navItems)
          ? layout.navItems
          : defaultNav;

      // The standalone Billing page was merged into /account — drop any
      // stale nav item still pointing at the old route.
      items = items.filter((n) => n.href !== "/account/billing");

      // Inject Settings if missing so the user can position and save it
      if (!items.some((n) => n.href === "/settings")) {
        const after = items.findIndex((n) => n.href === "/scheduler");
        const at = after >= 0 ? after + 1 : 1;
        items = [
          ...items.slice(0, at),
          { id: "settings", text: "Settings", href: "/settings", align: "left" },
          ...items.slice(at),
        ];
      }

      setNavItems(items);
    }

    load();
  }, [isAdmin]);

  // Pull the storage object path back out of a public URL we generated,
  // so a freshly-uploaded replacement can clean up the file it replaces.
  // Returns null for anything that isn't one of our own site-assets URLs
  // (e.g. a manually pasted external URL) — those are never deleted.
  function extractSiteAssetPath(url: string | null): string | null {
    if (!url) return null;
    const marker = "/object/public/site-assets/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length);
  }

  async function handleFileUpload(file: File, kind: "logo" | "banner") {
    const setUploading = kind === "logo" ? setLogoUploading : setBannerUploading;
    const setUploadError = kind === "logo" ? setLogoUploadError : setBannerUploadError;
    const setUrl = kind === "logo" ? setLogoUrl : setBannerUrl;
    const previousUrl = kind === "logo" ? logoUrl : bannerUrl;

    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("Image must be 5MB or smaller.");
      return;
    }

    setUploading(true);

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `header/${kind}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("site-assets")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setUploadError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    setUrl(data.publicUrl);
    setUploading(false);

    // Replace, don't accumulate: remove the file this upload superseded.
    const previousPath = extractSiteAssetPath(previousUrl);
    if (previousPath && previousPath !== path) {
      const { error: removeError } = await supabase.storage
        .from("site-assets")
        .remove([previousPath]);
      if (removeError) {
        console.error(`Failed to clean up previous ${kind} image:`, removeError);
      }
    }
  }

  function startDrag(e: React.MouseEvent<HTMLElement>, type: "logo" | "banner") {
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;

    const initialX = type === "logo" ? logoX : bannerX;
    const initialY = type === "logo" ? logoY : bannerY;

    function move(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      const newX = Math.round((initialX + dx) / SNAP) * SNAP;
      const newY = Math.round((initialY + dy) / SNAP) * SNAP;

      if (type === "logo") {
        setLogoX(newX);
        setLogoY(newY);
      } else {
        setBannerX(newX);
        setBannerY(newY);
      }
    }

    function stop() {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  }

  function startResize(e: React.MouseEvent<HTMLDivElement>, type: "logo" | "banner") {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const initialScale = type === "logo" ? logoScale : bannerScale;

    function move(ev: MouseEvent) {
      const dy = ev.clientY - startY;
      const newScale = Math.max(0.2, initialScale + dy * 0.01);

      if (type === "logo") setLogoScale(newScale);
      else setBannerScale(newScale);
    }

    function stop() {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  }

  function startRotate(e: React.MouseEvent<HTMLDivElement>, type: "logo" | "banner") {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const initialRotation = type === "logo" ? logoRotation : bannerRotation;

    function move(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      const delta = dx * 0.5;
      const newRotation = Math.round((initialRotation + delta) / 5) * 5;

      if (type === "logo") setLogoRotation(newRotation);
      else setBannerRotation(newRotation);
    }

    function stop() {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  }
  function moveNavItem(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= navItems.length) return;
    const copy = [...navItems];
    const tmp = copy[index];
    copy[index] = copy[target];
    copy[target] = tmp;
    setNavItems(copy);
  }

  function updateNavItem(index: number, patch: Partial<NavItem>) {
    setNavItems((items) =>
      items.map((item, i) => {
        if (i !== index) return item;
        return { ...item, ...patch };
      })
    );
  }

  function addNavItem() {
    setNavItems((items) => [
      ...items,
      {
        id: `item-${Date.now()}`,
        text: "New item",
        href: "/",
        align: "left",
      },
    ]);
  }

  function deleteNavItem(index: number) {
    setNavItems((items) => items.filter((_, i) => i !== index));
  }

  async function save() {
    await supabase
      .from("site_header")
      .update({
        logo_url: logoUrl,
        banner_url: bannerUrl,
        logo_x: logoX,
        logo_y: logoY,
        logo_scale: logoScale,
        logo_rotation: logoRotation,
        banner_offset_x: bannerX,
        banner_offset_y: bannerY,
        banner_scale: bannerScale,
        banner_rotation: bannerRotation,
        layout: {
          brand,
          navItems,
        },
      })
      .eq("id", 1);

    alert("Saved");
  }

  function resetTransforms() {
    setLogoX(0);
    setLogoY(0);
    setLogoScale(1);
    setLogoRotation(0);
    setBannerX(0);
    setBannerY(0);
    setBannerScale(1);
    setBannerRotation(0);
  }

  const leftNav = navItems.filter((n) => n.align !== "right");
  const rightNav = navItems.filter((n) => n.align === "right");

  if (isAdmin === null) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-300 text-sm">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 p-6 space-y-6 text-slate-100">
      <h1 className="text-2xl font-bold mb-2 text-slate-50">Header Editor</h1>

      <div className="relative w-full bg-slate-950 border border-slate-800 overflow-hidden">
        {bannerUrl && (
          <div
            className="absolute inset-0 w-full h-full overflow-hidden"
            style={{
              transform: `translate(${bannerX}px, ${bannerY}px) scale(${bannerScale}) rotate(${bannerRotation}deg)`,
              transformOrigin: "top left",
            }}
          >
            <div className="relative w-full h-full">
              <Image
                src={bannerUrl}
                alt="Banner"
                fill
                className="object-cover opacity-50 cursor-move"
                onMouseDown={(e) => startDrag(e, "banner")}
              />

              <div
                onMouseDown={(e) => startResize(e, "banner")}
                className="absolute bottom-4 right-4 w-5 h-5 bg-white rounded-full cursor-nwse-resize border border-black"
              />

              <div
                onMouseDown={(e) => startRotate(e, "banner")}
                className="absolute top-4 right-4 w-5 h-5 bg-teal-400 rounded-full cursor-ew-resize border border-black"
              />
            </div>
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 relative">
              {logoUrl && (
                <div
                  className="relative inline-block"
                  style={{
                    transform: `translate(${logoX}px, ${logoY}px) scale(${logoScale}) rotate(${logoRotation}deg)`,
                    transformOrigin: "top left",
                  }}
                >
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    width={100}
                    height={100}
                    className="object-contain cursor-move"
                    style={{ width: "100px", height: "100px" }}
                    onMouseDown={(e) => startDrag(e, "logo")}
                  />

                  <div
                    onMouseDown={(e) => startResize(e, "logo")}
                    className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full cursor-nwse-resize border border-black"
                  />

                  <div
                    onMouseDown={(e) => startRotate(e, "logo")}
                    className="absolute -top-5 right-0 w-4 h-4 bg-teal-400 rounded-full cursor-ew-resize border border-black"
                  />
                </div>
              )}

              {brand.enabled && (
                <span className="font-semibold text-lg tracking-tight text-white select-none">
                  {brand.text}
                </span>
              )}
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm text-white">
              {leftNav.map((item) => (
                <span key={item.id} className="select-none">
                  {item.text}
                </span>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4 text-white opacity-70 select-none">
            {rightNav.map((item) => (
              <span key={item.id}>{item.text}</span>
            ))}
            <span className="px-4 py-2 bg-slate-800 rounded">Logout</span>
          </div>

          <button className="md:hidden text-slate-300 opacity-50 select-none">
            ☰
          </button>
        </div>
      </div>
      <div className="max-w-3xl space-y-6">
        <div className="flex gap-3">
          <button
            onClick={save}
            className="px-4 py-2 bg-teal-500 text-slate-900 rounded font-medium"
          >
            Save
          </button>

          <button
            onClick={resetTransforms}
            className="px-4 py-2 bg-slate-800 text-slate-100 rounded font-medium"
          >
            Reset transforms
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">
            Logo
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-400"
              placeholder="Image URL, or upload a file →"
              value={logoUrl || ""}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
            <button
              type="button"
              onClick={() => logoFileInputRef.current?.click()}
              disabled={logoUploading}
              className="whitespace-nowrap px-3 py-2 text-sm bg-slate-800 text-white rounded border border-slate-700 hover:bg-slate-700 disabled:opacity-50"
            >
              {logoUploading ? "Uploading…" : "Upload image"}
            </button>
            <input
              ref={logoFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, "logo");
                e.target.value = "";
              }}
            />
          </div>
          {logoUploadError && (
            <p className="mt-1 text-xs text-red-400">{logoUploadError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">
            Banner
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-400"
              placeholder="Image URL, or upload a file →"
              value={bannerUrl || ""}
              onChange={(e) => setBannerUrl(e.target.value)}
            />
            <button
              type="button"
              onClick={() => bannerFileInputRef.current?.click()}
              disabled={bannerUploading}
              className="whitespace-nowrap px-3 py-2 text-sm bg-slate-800 text-white rounded border border-slate-700 hover:bg-slate-700 disabled:opacity-50"
            >
              {bannerUploading ? "Uploading…" : "Upload image"}
            </button>
            <input
              ref={bannerFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, "banner");
                e.target.value = "";
              }}
            />
          </div>
          {bannerUploadError && (
            <p className="mt-1 text-xs text-red-400">{bannerUploadError}</p>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Brand</h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={brand.enabled}
                onChange={(e) =>
                  setBrand((b) => ({ ...b, enabled: e.target.checked }))
                }
              />
              Show brand text
            </label>
          </div>
          <div>
            <label className="block text-xs mb-1 text-slate-300">
              Brand text
            </label>
            <input
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-sm text-white"
              value={brand.text}
              onChange={(e) =>
                setBrand((b) => ({ ...b, text: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Navigation items
            </h2>
            <button
              onClick={addNavItem}
              className="px-3 py-1 text-sm bg-slate-800 text-white rounded"
            >
              Add item
            </button>
          </div>

          {navItems.map((item, index) => (
            <div
              key={item.id}
              className="border border-slate-700 rounded p-3 space-y-2 bg-slate-900"
            >
              <div className="flex gap-2 text-xs text-slate-400">
                <span>ID: {item.id}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1 text-slate-300">
                    Text
                  </label>
                  <input
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-sm text-white"
                    value={item.text}
                    onChange={(e) =>
                      updateNavItem(index, { text: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1 text-slate-300">
                    Link (href)
                  </label>
                  <input
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-sm text-white"
                    value={item.href}
                    onChange={(e) =>
                      updateNavItem(index, { href: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-300">Admin only:</label>
                <input
                  type="checkbox"
                  checked={item.isAdmin || false}
                  onChange={(e) =>
                    updateNavItem(index, { isAdmin: e.target.checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => moveNavItem(index, -1)}
                    className="px-2 py-1 text-xs bg-slate-800 text-white rounded"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveNavItem(index, 1)}
                    className="px-2 py-1 text-xs bg-slate-800 text-white rounded"
                  >
                    ↓
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-300">Align:</label>
                  <select
                    className="bg-slate-950 border border-slate-700 text-xs text-white rounded px-2 py-1"
                    value={item.align || "left"}
                    onChange={(e) =>
                      updateNavItem(index, {
                        align: e.target.value as "left" | "right",
                      })
                    }
                  >
                    <option value="left">Left group</option>
                    <option value="right">Right group</option>
                  </select>

                  <button
                    onClick={() => deleteNavItem(index)}
                    className="px-2 py-1 text-xs bg-red-700 text-white rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

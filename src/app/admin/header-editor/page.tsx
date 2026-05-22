"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const supabase = createSupabaseBrowserClient();

export default function HeaderEditorPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  const [logoX, setLogoX] = useState(0);
  const [logoY, setLogoY] = useState(0);
  const [logoScale, setLogoScale] = useState(1);

  const [bannerX, setBannerX] = useState(0);
  const [bannerY, setBannerY] = useState(0);
  const [bannerScale, setBannerScale] = useState(1);

  useEffect(() => {
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

      setBannerX(data.banner_offset_x ?? 0);
      setBannerY(data.banner_offset_y ?? 0);
      setBannerScale(data.banner_scale ?? 1);
    }

    load();
  }, []);

  function startDrag(e: any, type: "logo" | "banner") {
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;

    const initialX = type === "logo" ? logoX : bannerX;
    const initialY = type === "logo" ? logoY : bannerY;

    function move(ev: any) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      if (type === "logo") {
        setLogoX(initialX + dx);
        setLogoY(initialY + dy);
      } else {
        setBannerX(initialX + dx);
        setBannerY(initialY + dy);
      }
    }

    function stop() {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  }

  function startResize(e: any, type: "logo" | "banner") {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const initialScale = type === "logo" ? logoScale : bannerScale;

    function move(ev: any) {
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

  async function save() {
    await supabase
      .from("site_header")
      .update({
        logo_url: logoUrl,
        banner_url: bannerUrl,
        logo_x: logoX,
        logo_y: logoY,
        logo_scale: logoScale,
        banner_offset_x: bannerX,
        banner_offset_y: bannerY,
        banner_scale: bannerScale,
      })
      .eq("id", 1);

    alert("Saved");
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <h1 className="text-2xl font-bold mb-2">Header Editor</h1>

      {/* FULL REAL HEADER PREVIEW */}
      <div className="relative w-full bg-slate-950 border border-slate-800 overflow-hidden">

        {/* Banner */}
        {bannerUrl && (
          <div
            onMouseDown={(e) => startDrag(e, "banner")}
            className="absolute inset-0 cursor-move"
            style={{
              transform: `translate(${bannerX}px, ${bannerY}px) scale(${bannerScale})`,
              transformOrigin: "top left",
            }}
          >
            <Image
              src={bannerUrl}
              alt="Banner"
              fill
              className="object-cover opacity-50"
            />

            <div
              onMouseDown={(e) => startResize(e, "banner")}
              className="absolute bottom-1 right-1 w-4 h-4 bg-white rounded-full cursor-nwse-resize"
            />
          </div>
        )}

        {/* INNER HEADER — EXACT SAME DOM AS REAL HEADER */}
        <div className="relative max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* LEFT */}
          <div className="flex items-center gap-6">

            {/* Logo */}
            {logoUrl && (
              <div
                onMouseDown={(e) => startDrag(e, "logo")}
                className="absolute cursor-move"
                style={{
                  transform: `translate(${logoX}px, ${logoY}px) scale(${logoScale})`,
                  transformOrigin: "top left",
                }}
              >
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={100}
                  height={100}
                  className="object-contain"
                />

                <div
                  onMouseDown={(e) => startResize(e, "logo")}
                  className="absolute bottom-1 right-1 w-4 h-4 bg-white rounded-full cursor-nwse-resize"
                />
              </div>
            )}

            <span className="font-semibold text-lg tracking-tight text-white select-none">
              GeoRoute
            </span>

            {/* Fake nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm text-white opacity-70 select-none">
              <span>Scheduler</span>
              <span>Account</span>
              <span>Billing</span>
              <span>Admin</span>
            </nav>
          </div>

          {/* RIGHT */}
          <div className="hidden md:flex items-center gap-4 text-white opacity-70 select-none">
            <span className="px-4 py-2 bg-slate-800 rounded">Logout</span>
          </div>

          <button className="md:hidden text-slate-300 opacity-50 select-none">
            ☰
          </button>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="max-w-3xl space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-white">Logo URL</label>
          <input
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-400"
            value={logoUrl || ""}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Banner URL</label>
          <input
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-400"
            value={bannerUrl || ""}
            onChange={(e) => setBannerUrl(e.target.value)}
          />
        </div>

        <button
          onClick={save}
          className="px-4 py-2 bg-teal-500 text-slate-900 rounded font-medium"
        >
          Save
        </button>
      </div>
    </div>
  );
}

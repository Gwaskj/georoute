"use client";

import "@/styles/admin-settings.css";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import Image from "next/image";

const supabase = createSupabaseBrowserClient();

export default function HeaderEditorPage() {
  const isAdmin = useIsAdmin();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    logo_url: "",
    banner_url: "",
    logo_x: 0,
    logo_y: 0,
    logo_scale: 1,
    banner_offset_x: 0,
    banner_offset_y: 0,
  });

  useEffect(() => {
    if (isAdmin !== true) return;

    async function load() {
      const { data: header } = await supabase
        .from("site_header")
        .select("*")
        .eq("id", 1)
        .single();

      if (header) {
        setForm({
          logo_url: header.logo_url || "",
          banner_url: header.banner_url || "",
          logo_x: header.logo_x ?? 0,
          logo_y: header.logo_y ?? 0,
          logo_scale: header.logo_scale ?? 1,
          banner_offset_x: header.banner_offset_x ?? 0,
          banner_offset_y: header.banner_offset_y ?? 0,
        });
      }

      setLoading(false);
    }

    load();
  }, [isAdmin]);

  if (isAdmin === null) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p>You do not have permission to edit the header.</p>
      </div>
    );
  }

  if (loading) return null;

  async function uploadImage(e: any, type: "logo" | "banner") {
    const file = e.target.files?.[0];
    if (!file) return;

    const filePath = `${type}-${Date.now()}`;

    const { error: uploadError } = await supabase.storage
      .from("header-assets")
      .upload(filePath, file);

    if (uploadError) {
      alert("Upload failed");
      return;
    }

    const publicUrl = supabase.storage
      .from("header-assets")
      .getPublicUrl(filePath).data.publicUrl;

    setForm((prev) => ({
      ...prev,
      [`${type}_url`]: publicUrl,
    }));
  }

  async function saveChanges() {
    setSaving(true);

    const { error } = await supabase
      .from("site_header")
      .update({
        logo_url: form.logo_url,
        banner_url: form.banner_url,
        logo_x: form.logo_x,
        logo_y: form.logo_y,
        logo_scale: form.logo_scale,
        banner_offset_x: form.banner_offset_x,
        banner_offset_y: form.banner_offset_y,
      })
      .eq("id", 1);

    setSaving(false);

    if (error) {
      alert("Failed to save");
    } else {
      alert("Header updated!");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-6 py-10">
      <h1 className="text-3xl font-semibold mb-8">Header Editor</h1>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div>
            <label className="block text-sm mb-1">Logo Image</label>
            <input type="file" onChange={(e) => uploadImage(e, "logo")} />
          </div>

          <div>
            <label className="block text-sm mb-1">Banner Image</label>
            <input type="file" onChange={(e) => uploadImage(e, "banner")} />
          </div>

          <div>
            <label className="block text-sm mb-1">Logo X Offset</label>
            <input
              type="number"
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded"
              value={form.logo_x}
              onChange={(e) =>
                setForm({ ...form, logo_x: Number(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Logo Y Offset</label>
            <input
              type="number"
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded"
              value={form.logo_y}
              onChange={(e) =>
                setForm({ ...form, logo_y: Number(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Logo Scale</label>
            <input
              type="number"
              step="0.1"
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded"
              value={form.logo_scale}
              onChange={(e) =>
                setForm({ ...form, logo_scale: Number(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Banner Offset X</label>
            <input
              type="number"
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded"
              value={form.banner_offset_x}
              onChange={(e) =>
                setForm({ ...form, banner_offset_x: Number(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Banner Offset Y</label>
            <input
              type="number"
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded"
              value={form.banner_offset_y}
              onChange={(e) =>
                setForm({ ...form, banner_offset_y: Number(e.target.value) })
              }
            />
          </div>

          <button
            onClick={saveChanges}
            disabled={saving}
            className="mt-4 bg-teal-500 text-slate-900 px-6 py-3 rounded font-medium hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Live Preview</h2>

          <div
            style={{
              height: 120,
              backgroundImage: `url(${form.banner_url || "/Banner-placeholder.jpg"})`,
              backgroundSize: "cover",
              backgroundPosition: `${form.banner_offset_x}px ${form.banner_offset_y}px`,
              display: "flex",
              alignItems: "center",
              paddingLeft: 20,
            }}
          >
            <div
              style={{
                transform: `translate(${form.logo_x}px, ${form.logo_y}px) scale(${form.logo_scale})`,
                transformOrigin: "top left",
                display: "flex",
                alignItems: "center",
              }}
            >
           <Image
  src="/logo-placeholder.png"
  alt="Logo"
  width={34}
  height={34}
  className="rounded"
  style={{ width: "auto", height: "auto" }}
/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

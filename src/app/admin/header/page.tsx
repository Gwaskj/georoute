"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateHeaderAction } from "./actions";

const supabase = createClient();

export default function HeaderEditor() {
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("site_header")
        .select("*")
        .eq("id", 1)
        .single();

      setConfig(data);
    }
    load();
  }, []);

  if (!config) return <p>Loading…</p>;

  async function save() {
    setSaving(true);
    const form = new FormData();

    Object.entries(config).forEach(([k, v]) => {
      form.set(k, String(v));
    });

    await updateHeaderAction(form);
    setSaving(false);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Header Editor</h1>

      <div
        style={{
          marginTop: 20,
          border: "1px solid #ddd",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 140,
            backgroundImage: `url(${config.banner_url})`,
            backgroundSize: "cover",
            backgroundPosition: `${config.banner_offset_x}px ${config.banner_offset_y}px`,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              transform: `translate(${config.logo_x}px, ${config.logo_y}px) scale(${config.logo_scale})`,
              transformOrigin: "top left",
              cursor: "grab",
            }}
            draggable
            onDrag={(e) => {
              setConfig((prev: any) => ({
                ...prev,
                logo_x: prev.logo_x + e.movementX,
                logo_y: prev.logo_y + e.movementY,
              }));
            }}
          >
            <img
              src={config.logo_url}
              width={70}
              height={70}
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
        <label>
          Logo Scale
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.05"
            value={config.logo_scale}
            onChange={(e) =>
              setConfig((prev: any) => ({
                ...prev,
                logo_scale: Number(e.target.value),
              }))
            }
          />
        </label>

        <label>
          Banner Offset X
          <input
            type="range"
            min="-200"
            max="200"
            value={config.banner_offset_x}
            onChange={(e) =>
              setConfig((prev: any) => ({
                ...prev,
                banner_offset_x: Number(e.target.value),
              }))
            }
          />
        </label>

        <label>
          Banner Offset Y
          <input
            type="range"
            min="-200"
            max="200"
            value={config.banner_offset_y}
            onChange={(e) =>
              setConfig((prev: any) => ({
                ...prev,
                banner_offset_y: Number(e.target.value),
              }))
            }
          />
        </label>
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{
          marginTop: 20,
          padding: "10px 16px",
          background: "#111",
          color: "white",
          borderRadius: 6,
        }}
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

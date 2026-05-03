"use client";

import { useEffect, useState } from "react";
import { Editor, Frame, Element, useEditor } from "@craftjs/core";
import { Page } from "./blocks/Page";
import { Section } from "./blocks/Section";
import { Container } from "./blocks/Container";
import { Columns } from "./blocks/Columns";
import { Column } from "./blocks/Column";
import { TextBlock } from "./blocks/TextBlock";
import { Hero } from "./blocks/Hero";
import { MapBlock } from "./blocks/MapBlock";

import { Toolbox } from "./blocks/Toolbox";
import { SettingsPanel } from "./SettingsPanel";

// ⭐ CLIENT-SAFE load/save (no server imports)
async function loadLayout() {
  const res = await fetch("/admin/editor/load", { cache: "no-store" });
  return res.json();
}

async function saveLayout(payload: any) {
  await fetch("/admin/editor/save", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

type EditorClientProps = {
  userId: string;
  isAdmin: boolean;
};

export function EditorClient({ userId, isAdmin }: EditorClientProps) {
  const [initialData, setInitialData] = useState<any>(null);
  const [applyToAll, setApplyToAll] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchLayout() {
      const layout = await loadLayout();
      setInitialData(layout?.data ?? {});
      setApplyToAll(layout?.is_global ?? false);
    }
    fetchLayout();
  }, [userId]);

  if (initialData === null) {
    return <p>Loading editor…</p>;
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Editor
        resolver={{
          Page,
          Section,
          Container,
          Columns,
          Column,
          TextBlock,
          Hero,
          MapBlock,
        }}
      >
        <div style={{ display: "flex", height: "100%", width: "100%" }}>
          <Toolbox />

          <div style={{ flex: 1, overflow: "auto", background: "#f0f0f0" }}>
            <EditorShell
              initialData={initialData}
              isAdmin={isAdmin}
              applyToAll={applyToAll}
              setApplyToAll={setApplyToAll}
              saving={saving}
              setSaving={setSaving}
            />
          </div>

          <SettingsPanel />
        </div>
      </Editor>
    </div>
  );
}

type EditorShellProps = {
  initialData: any;
  isAdmin: boolean;
  applyToAll: boolean;
  setApplyToAll: (v: boolean) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
};

function EditorShell({
  initialData,
  isAdmin,
  applyToAll,
  setApplyToAll,
  saving,
  setSaving,
}: EditorShellProps) {
  const { query } = useEditor();

  const handleSave = async () => {
    if (!isAdmin) return;

    const json = query.serialize();
    setSaving(true);

    await saveLayout({
      data: json,
      is_global: applyToAll,
    });

    setSaving(false);
  };

  return (
    <>
      {isAdmin && (
        <div
          style={{
            padding: 10,
            background: "#fff",
            borderBottom: "1px solid #ddd",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
            />
            Apply layout to all users
          </label>

          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: "6px 12px",
              borderRadius: 4,
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {saving ? "Saving…" : "Save layout"}
          </button>
        </div>
      )}

      <Frame data={initialData || {}}>
        <Element
          is={Page}
          canvas
          backgroundColor="#ffffff"
          backgroundImage=""
          backgroundSize="cover"
          backgroundPosition="center"
        />
      </Frame>
    </>
  );
}

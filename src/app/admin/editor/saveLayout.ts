// saveLayout.ts — CLIENT SAFE VERSION
"use client";

export async function saveLayout(payload: { data: any; is_global: boolean }) {
  try {
    await fetch("/admin/editor/save", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    // fail silently
  }
}

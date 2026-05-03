// loadLayout.ts — CLIENT SAFE VERSION
"use client";

export async function loadLayout() {
  try {
    const res = await fetch("/admin/editor/load", {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      return { data: {}, is_global: false };
    }

    const json = await res.json();
    return {
      data: json?.data ?? {},
      is_global: json?.is_global ?? false,
    };
  } catch {
    return { data: {}, is_global: false };
  }
}

"use client";

import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const supabase = createSupabaseBrowserClient();

export default function EditorPage() {
  const isAdmin = useIsAdmin();

  if (isAdmin === null) return null;

  if (!isAdmin)
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p>You do not have permission to access this page.</p>
      </div>
    );

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Admin Editor</h1>
      <p className="mt-4 text-gray-700">This page exists now.</p>
    </div>
  );
}

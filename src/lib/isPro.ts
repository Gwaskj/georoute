"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function isProUser() {
  const supabase = await createSupabaseServerClient(); // ✅ FIXED — await it

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (error) return false;

  return data?.tier === "pro";
}

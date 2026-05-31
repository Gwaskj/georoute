"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function isProUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .single();

  if (error) return false;

  return data?.is_pro === true;
}

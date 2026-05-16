import { createSupabaseServerClient } from "./supabase/server";

export async function getUser() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

// /src/lib/auth.ts
import { createSupabaseServerClient } from "./supabase/server";

export async function getUser() {
  const supabase = await createSupabaseServerClient(); // FIXED

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, return null — DO NOT create anonymous users on the server
  return user ?? null;
}

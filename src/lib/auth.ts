// /src/lib/auth.ts
import { createSupabaseServerClient } from "./supabase/server";

export async function getUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}

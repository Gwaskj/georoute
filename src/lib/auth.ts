// C:\Users\matth\georoute\src\lib\auth.ts
import { createSupabaseServerClient } from "./supabase/server";

export async function getUser() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return user;

  const { data } = await supabase.auth.signInAnonymously();
  return data?.user ?? null;
}

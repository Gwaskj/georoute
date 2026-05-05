import { createSupabaseServerClient } from './supabase/server';

export async function getUser() {
  const supabase = await createSupabaseServerClient(); // ← THIS was the missing await
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

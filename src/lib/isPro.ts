import { createClient } from "@/lib/supabase/client";

export async function isProUser() {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_pro")
    .single();

  return data?.is_pro === true;
}

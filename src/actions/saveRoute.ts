"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function saveRoute(route: {
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  route_data: any;
}) {
  const supabase = await createSupabaseServerClient(); // ← FIXED

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not logged in" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro")
    .single();

  if (!profile?.is_pro) {
    return { error: "Upgrade required" };
  }

  const { error } = await supabase.from("routes").insert({
    user_id: user.id,
    ...route,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

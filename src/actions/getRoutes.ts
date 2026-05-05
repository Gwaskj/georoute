"use server";

import { createClient } from "@/lib/supabase/server";

export async function getRoutes() {
  const supabase = await createClient(); // IMPORTANT: await this

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading routes:", error);
    return [];
  }

  return data || [];
}

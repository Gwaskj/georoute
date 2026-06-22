// /src/lib/subscription.ts
import { createSupabaseServerClient } from "./supabase/server";

export type SubscriptionStatus = "free" | "pro";

export async function getSubscriptionStatus(
  userId: string | null
): Promise<SubscriptionStatus> {
  if (!userId) return "free";

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return "free";

  return data.is_pro ? "pro" : "free";
}

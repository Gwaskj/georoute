import { supabase } from "@/lib/supabase/client";

export async function logAction(
  action: string,
  targetUserId: string | null,
  details: any = {}
) {
  const { data } = await supabase.auth.getUser();
  const actorId = data.user?.id ?? null;

  await supabase.from("activity_logs").insert({
    actor_id: actorId,
    target_user_id: targetUserId,
    action,
    details,
  });
}

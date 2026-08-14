import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logAction(
  action: string,
  targetUserId: string | null,
  // Matches logsClient.logActivity, which types the same argument this way.
  // The column is jsonb, so anything serialisable is valid -- what is not
  // wanted is a caller passing a function or a class instance by accident.
  details: Record<string, unknown> = {}
) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const actorId = data.user?.id ?? null;

  await supabase.from("activity_logs").insert({
    actor_id: actorId,
    target_user_id: targetUserId,
    action,
    details,
  });
}

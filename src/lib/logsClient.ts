// src/lib/logsClient.ts
// Browser-side counterpart to logs.ts — for use from client components and
// Zustand stores, which can't import the server client (it depends on
// next/headers).
import { supabase } from "@/lib/supabase/client";

export async function logActivity(
  action: string,
  targetUserId: string | null = null,
  details: Record<string, unknown> = {}
) {
  const { data } = await supabase.auth.getUser();
  const actorId = data.user?.id ?? null;
  // activity_logs RLS requires auth.uid() is not null — skip silently for
  // anonymous/free-tier usage rather than log a failed insert every time.
  if (!actorId) return;

  const { error } = await supabase.from("activity_logs").insert({
    actor_id: actorId,
    target_user_id: targetUserId,
    action,
    details,
  });

  if (error) {
    console.error(`Failed to log activity "${action}":`, error);
  }
}

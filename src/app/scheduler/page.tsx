// C:\Users\matth\georoute\src\app\scheduler\page.tsx
export const dynamic = "force-dynamic";

import { getUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SchedulePage from "@/components/schedule/SchedulePage";

export default async function SchedulerPage() {
  // 1. Create ONE SSR client
  const supabase = await createSupabaseServerClient();

  // 2. Get user from SSR
  const user = await getUser();

  // 3. Default to free
  let isFree = true;

  // 4. If logged in, check profile
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("user_id", user.id)
      .maybeSingle();

    isFree = !data?.is_pro;
  }

  return <SchedulePage isFree={isFree} />;
}

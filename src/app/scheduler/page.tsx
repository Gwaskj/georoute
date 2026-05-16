export const dynamic = "force-dynamic";

import { getUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SchedulePage from "@/components/schedule/SchedulePage";

export default async function SchedulerPage() {
  const user = await getUser();
  console.log("SERVER USER:", user);

  let isFree = true;

  if (user) {
    const supabase = createSupabaseServerClient();

    const { data } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("user_id", user.id)
      .single();

    isFree = !data?.is_pro;
  }

  return <SchedulePage isFree={isFree} />;
}

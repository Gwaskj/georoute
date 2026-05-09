import SchedulePage from "@/components/schedule/SchedulePage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createSupabaseServerClient();

  // Get user (may be null)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isPro = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .maybeSingle();

    isPro = profile?.is_pro === true;
  }

  // Free = not logged in OR logged in but not Pro
  const isFree = !isPro;

  return <SchedulePage isFree={isFree} />;
}


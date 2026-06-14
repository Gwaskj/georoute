export const dynamic = "force-dynamic";

import { getUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SchedulePage from "@/components/schedule/SchedulePage";
import type { AnyBlock } from "@/lib/types/cms";

const FALLBACK_BLOCKS: AnyBlock[] = [
  {
    id: "scheduler_header",
    type: "scheduler_header",
    visible: true,
    data: {
      title: "GeoRoute Scheduler",
      freeSubtitle: "Free mode — data stored in this browser session only.",
      proSubtitle: "Pro mode — data stored in your GeoRoute workspace.",
    },
  },
  {
    id: "generate_intro",
    type: "section_intro",
    visible: true,
    data: {
      title: "Generate schedule",
      description:
        "Use your current staff, appointments, call purposes and custom windows to generate an optimised schedule.",
    },
  },
];

export default async function SchedulerPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getUser();

  let isFree = true;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("user_id", user.id)
      .maybeSingle();
    isFree = !data?.is_pro;
  }

  let cmsBlocks: AnyBlock[] = FALLBACK_BLOCKS;
  try {
    const { data } = await supabase
      .from("page_content")
      .select("blocks")
      .eq("page_id", "scheduler")
      .maybeSingle();
    if (data?.blocks && Array.isArray(data.blocks)) {
      cmsBlocks = data.blocks as AnyBlock[];
    }
  } catch {
    // table not yet set up — use fallback
  }

  return <SchedulePage isFree={isFree} cmsBlocks={cmsBlocks} />;
}

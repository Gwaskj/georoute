import { createSupabaseServerClient } from "@/lib/supabase/server";
import PageRenderer from "@/components/cms/PageRenderer";
import FreeTierAdSlot from "@/components/ads/FreeTierAdSlot";
import type { AnyBlock } from "@/lib/types/cms";

export const dynamic = "force-dynamic";

const FALLBACK_BLOCKS: AnyBlock[] = [
  {
    id: "hero",
    type: "hero",
    visible: true,
    data: {
      badge: "Route Planning Platform",
      title: "Smarter Route Planning",
      titleAccent: "For High‑Performing Teams",
      subtitle:
        "Plan schedules, assign staff, and generate optimised routes — all in one beautifully simple dashboard designed for speed and clarity.",
      primaryCtaText: "Get Started Free",
      primaryCtaUrl: "/scheduler",
      secondaryCtaText: "View Pricing",
      secondaryCtaUrl: "/pricing",
    },
  },
  {
    id: "features",
    type: "features",
    visible: true,
    data: {
      title: "Powerful Tools, Beautifully Designed",
      subtitle:
        "Everything your team needs to plan, schedule, and execute routes efficiently.",
      items: [
        {
          id: "f1",
          title: "Drag-and-Drop Scheduling",
          description:
            "Build and adjust your team's day in seconds with a clean, intuitive timeline.",
          gradient: "teal",
        },
        {
          id: "f2",
          title: "Optimised Route Planning",
          description:
            "Generate the fastest route instantly — saving time, fuel, and stress.",
          gradient: "indigo",
        },
        {
          id: "f3",
          title: "Team-Ready Dashboard",
          description: "See every appointment, location, and route at a glance.",
          gradient: "purple",
        },
        {
          id: "f4",
          title: "Real-Time Updates",
          description:
            "Make changes on the fly and instantly update your team.",
          gradient: "emerald",
        },
      ],
    },
  },
  {
    id: "map_preview",
    type: "map_preview",
    visible: true,
    data: {
      title: "See Your Day at a Glance",
      subtitle:
        "A clean visual overview of your team's routes — pins, paths, and all.",
      imageUrl: "/fake-map.png",
      imageAlt: "Route map preview",
    },
  },
  {
    id: "cta",
    type: "cta",
    visible: true,
    data: {
      title: "Start Planning Smarter Today",
      subtitle:
        "Join teams who save hours every week with automated scheduling and optimised routing.",
      primaryBtnText: "Get Started Free",
      primaryBtnUrl: "/scheduler",
      secondaryBtnText: "View Pricing",
      secondaryBtnUrl: "/pricing",
    },
  },
];

export default async function HomePage() {
  let blocks: AnyBlock[] = FALLBACK_BLOCKS;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("page_content")
      .select("blocks")
      .eq("page_id", "home")
      .maybeSingle();

    if (data?.blocks && Array.isArray(data.blocks)) {
      blocks = data.blocks as AnyBlock[];
    }
  } catch {
    // Table not yet created — fall back to static content
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.35),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.25),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),transparent_70%)]" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04] bg-[url('/grid.svg')] bg-repeat" />

      <PageRenderer blocks={blocks} />

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-slate-600">
          Advertisement
        </p>
        <FreeTierAdSlot />
      </div>
    </div>
  );
}

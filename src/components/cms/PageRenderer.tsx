import type { AnyBlock } from "@/lib/types/cms";
import HeroBlock from "./blocks/HeroBlock";
import FeaturesBlock from "./blocks/FeaturesBlock";
import MapPreviewBlock from "./blocks/MapPreviewBlock";
import CtaBlock from "./blocks/CtaBlock";
import PricingHeaderBlock from "./blocks/PricingHeaderBlock";
import SchedulerHeaderBlock from "./blocks/SchedulerHeaderBlock";
import SectionIntroBlock from "./blocks/SectionIntroBlock";

function renderBlock(block: AnyBlock) {
  switch (block.type) {
    case "hero":
      return <HeroBlock data={block.data} />;
    case "features":
      return <FeaturesBlock data={block.data} />;
    case "map_preview":
      return <MapPreviewBlock data={block.data} />;
    case "cta":
      return <CtaBlock data={block.data} />;
    case "pricing_header":
      return <PricingHeaderBlock data={block.data} />;
    case "scheduler_header":
      return <SchedulerHeaderBlock data={block.data} />;
    case "section_intro":
      return <SectionIntroBlock data={block.data} />;
    default:
      return null;
  }
}

export default function PageRenderer({ blocks }: { blocks: AnyBlock[] }) {
  const visible = blocks.filter((b) => b.visible);

  return (
    <>
      {visible.map((block, i) => (
        <div key={block.id}>
          {i > 0 && block.type !== "cta" && (
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />
          )}
          <div
            style={
              block.style?.py
                ? { paddingTop: block.style.py, paddingBottom: block.style.py }
                : undefined
            }
          >
            {renderBlock(block)}
          </div>
        </div>
      ))}
    </>
  );
}

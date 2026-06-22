export interface HeroData {
  badge?: string;
  title: string;
  titleAccent?: string;
  subtitle?: string;
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  gradient: "teal" | "indigo" | "purple" | "emerald";
}

export interface FeaturesData {
  title?: string;
  subtitle?: string;
  items: FeatureItem[];
}

export interface MapPreviewData {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface CtaData {
  title: string;
  subtitle?: string;
  primaryBtnText?: string;
  primaryBtnUrl?: string;
  secondaryBtnText?: string;
  secondaryBtnUrl?: string;
}

export interface PricingHeaderData {
  title: string;
  subtitle?: string;
}

export interface SchedulerHeaderData {
  title: string;
  freeSubtitle?: string;
  proSubtitle?: string;
}

export interface SectionIntroData {
  title: string;
  description?: string;
}

export type BlockType =
  | "hero"
  | "features"
  | "map_preview"
  | "cta"
  | "pricing_header"
  | "scheduler_header"
  | "section_intro";

interface BaseBlock {
  id: string;
  type: BlockType;
  visible: boolean;
  style?: { py?: number };
}

export interface HeroBlock extends BaseBlock {
  type: "hero";
  data: HeroData;
}
export interface FeaturesBlock extends BaseBlock {
  type: "features";
  data: FeaturesData;
}
export interface MapPreviewBlock extends BaseBlock {
  type: "map_preview";
  data: MapPreviewData;
}
export interface CtaBlock extends BaseBlock {
  type: "cta";
  data: CtaData;
}
export interface PricingHeaderBlock extends BaseBlock {
  type: "pricing_header";
  data: PricingHeaderData;
}
export interface SchedulerHeaderBlock extends BaseBlock {
  type: "scheduler_header";
  data: SchedulerHeaderData;
}
export interface SectionIntroBlock extends BaseBlock {
  type: "section_intro";
  data: SectionIntroData;
}

export type AnyBlock =
  | HeroBlock
  | FeaturesBlock
  | MapPreviewBlock
  | CtaBlock
  | PricingHeaderBlock
  | SchedulerHeaderBlock
  | SectionIntroBlock;

import type { PageProps } from "./Page";
import { Page } from "./Page";

import type { SectionProps } from "./Section";
import { Section } from "./Section";

import type { ContainerProps } from "./Container";
import { Container } from "./Container";

import type { ColumnsProps } from "./Columns";
import { Columns } from "./Columns";

import type { ColumnProps } from "./Column";
import { Column } from "./Column";

import type { TextBlockProps } from "./TextBlock";
import { TextBlock } from "./TextBlock";

import type { HeroProps } from "./Hero";
import { Hero } from "./Hero";

import type { MapBlockProps } from "./MapBlock.client";
import { MapBlock } from "./MapBlock";

import { PageSettings } from "./PageSettings";
import { SectionSettings } from "./SectionSettings";
import { ContainerSettings } from "./ContainerSettings";
import { ColumnsSettings } from "./ColumnsSettings";
import { ColumnSettings } from "./ColumnSettings";
import { TextBlockSettings } from "./TextBlockSettings";
import { HeroSettings } from "./HeroSettings";
import { MapBlockSettings } from "./MapBlockSettings";

export type BlockType =
  | "page"
  | "section"
  | "container"
  | "columns"
  | "column"
  | "text"
  | "hero"
  | "map";

export type BlockDefinition<Props> = {
  component: React.ComponentType<Props>;
  settings: React.ComponentType<any>;
  defaultProps: Props;
  displayName: string;
};

export const BlockRegistry: Record<BlockType, BlockDefinition<any>> = {
  page: {
    component: Page,
    settings: PageSettings,
    defaultProps: {
      backgroundColor: "#ffffff",
      backgroundImage: "",
      backgroundSize: "cover",
      backgroundPosition: "center",
    } satisfies PageProps,
    displayName: "Page",
  },

  section: {
    component: Section,
    settings: SectionSettings,
    defaultProps: {
      padding: 24,
      backgroundColor: "#f9fafb",
    } satisfies SectionProps,
    displayName: "Section",
  },

  container: {
    component: Container,
    settings: ContainerSettings,
    defaultProps: {
      padding: 20,
      background: "#f5f5f5",
    } satisfies ContainerProps,
    displayName: "Container",
  },

  columns: {
    component: Columns,
    settings: ColumnsSettings,
    defaultProps: {
      gap: 16,
    } satisfies ColumnsProps,
    displayName: "Columns",
  },

  column: {
    component: Column,
    settings: ColumnSettings,
    defaultProps: {
      padding: 16,
      background: "#ffffff",
    } satisfies ColumnProps,
    displayName: "Column",
  },

  text: {
    component: TextBlock,
    settings: TextBlockSettings,
    defaultProps: {
      text: "Text",
      fontSize: 16,
      color: "#000000",
      align: "left",
    } satisfies TextBlockProps,
    displayName: "Text",
  },

  hero: {
    component: Hero,
    settings: HeroSettings,
    defaultProps: {
      title: "Welcome to GeoRoute",
      subtitle: "Plan, optimize, and manage your routes with ease.",
      align: "left",
      backgroundColor: "#0f172a",
      textColor: "#ffffff",
      padding: 32,
    } satisfies HeroProps,
    displayName: "Hero",
  },

  map: {
    component: MapBlock,
    settings: MapBlockSettings,
    defaultProps: {
      lat: 53.0027,
      lng: -2.1794,
      zoom: 12,
      height: 300,
      width: "100%",
      staffId: null,
      markers: [],
      routes: [],
      useGeolocation: false,
    } satisfies MapBlockProps,
    displayName: "Map",
  },
};

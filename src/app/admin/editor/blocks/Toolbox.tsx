"use client";

import { useEditor } from "@craftjs/core";

import { Page } from "./Page";
import type { PageProps } from "./Page";

import { Section } from "./Section";
import type { SectionProps } from "./Section";

import { Container, ContainerCanvas } from "./Container";
import type { ContainerProps } from "./Container";

import { Columns } from "./Columns";
import type { ColumnsProps } from "./Columns";

import { Column, ColumnCanvas } from "./Column";
import type { ColumnProps } from "./Column";

import { TextBlock } from "./TextBlock";
import type { TextBlockProps } from "./TextBlock";

import { Hero } from "./Hero";
import type { HeroProps } from "./Hero";

import { MapBlock } from "./MapBlock";
import type { MapBlockProps } from "./MapBlock";

import { SectionCanvas } from "./Section";

export function Toolbox() {
  const { connectors } = useEditor();

  return (
    <div
      style={{
        width: 250,
        background: "#fafafa",
        borderRight: "1px solid #ddd",
        padding: 20,
        display: "grid",
        gap: 16,
      }}
    >
      <h3>Blocks</h3>

      <ToolItem<PageProps>
        label="Page"
        create={(ref) =>
          connectors.create(
            ref,
            <Page
              backgroundColor="#ffffff"
              backgroundImage=""
              backgroundSize="cover"
              backgroundPosition="center"
            />
          )
        }
      />

      <ToolItem<SectionProps>
        label="Section"
        create={(ref) =>
          connectors.create(
            ref,
            <Section padding={24} backgroundColor="#f9fafb" />
          )
        }
      />

      <ToolItem<ContainerProps>
        label="Container"
        create={(ref) =>
          connectors.create(
            ref,
            <Container padding={20} background="#f5f5f5" />
          )
        }
      />

      <ToolItem<ColumnsProps>
        label="Columns"
        create={(ref) => connectors.create(ref, <Columns gap={16} />)}
      />

      <ToolItem<ColumnProps>
        label="Column"
        create={(ref) =>
          connectors.create(
            ref,
            <Column padding={16} background="#ffffff" />
          )
        }
      />

      <ToolItem<TextBlockProps>
        label="Text"
        create={(ref) =>
          connectors.create(
            ref,
            <TextBlock
              text="Text"
              fontSize={16}
              color="#000000"
              align="left"
            />
          )
        }
      />

      <ToolItem<HeroProps>
        label="Hero"
        create={(ref) =>
          connectors.create(
            ref,
            <Hero
              title="Welcome to GeoRoute"
              subtitle="Plan, optimize, and manage your routes with ease."
              align="left"
              backgroundColor="#0f172a"
              textColor="#ffffff"
              padding={32}
            />
          )
        }
      />

      <ToolItem<MapBlockProps>
        label="Map"
        create={(ref) =>
          connectors.create(
            ref,
            <MapBlock
              lat={53.0027}
              lng={-2.1794}
              zoom={12}
              height={300}
              width="100%"
              staffId={null}
              markers={[]}
              routes={[]}
              useGeolocation={false}
            />
          )
        }
      />
    </div>
  );
}

type ToolItemProps<T> = {
  label: string;
  create: (ref: HTMLDivElement) => void;
};

function ToolItem<T>({ label, create }: ToolItemProps<T>) {
  return (
    <div
      ref={(ref) => {
        if (ref) create(ref);
      }}
      style={{
        padding: 10,
        border: "1px solid #ddd",
        borderRadius: 6,
        cursor: "grab",
        background: "#fff",
      }}
    >
      {label}
    </div>
  );
}

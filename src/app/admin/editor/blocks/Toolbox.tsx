"use client";

import { useEditor } from "@craftjs/core";

import { Page } from "./Page";
import { Section } from "./Section";
import { Container } from "./Container";
import { Columns } from "./Columns";
import { Column } from "./Column";
import { TextBlock } from "./TextBlock";
import { Hero } from "./Hero";
import { MapBlock } from "./MapBlock";

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

      <ToolItem
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

      <ToolItem
        label="Section"
        create={(ref) =>
          connectors.create(
            ref,
            <Section padding={24} backgroundColor="#f9fafb" />
          )
        }
      />

      <ToolItem
        label="Container"
        create={(ref) =>
          connectors.create(
            ref,
            <Container padding={20} background="#f5f5f5" />
          )
        }
      />

      <ToolItem
        label="Columns"
        create={(ref) => connectors.create(ref, <Columns gap={16} />)}
      />

      <ToolItem
        label="Column"
        create={(ref) =>
          connectors.create(
            ref,
            <Column padding={16} background="#ffffff" />
          )
        }
      />

      <ToolItem
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

      <ToolItem
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

      <ToolItem
        label="Map"
        create={(ref) =>
          connectors.create(
            ref,
            <MapBlock
              staffId={null}
              zoom={12}
              height={300}
              width="100%"
              lat={53.0027}
              lng={-2.1794}
            />
          )
        }
      />
    </div>
  );
}

type ToolItemProps = {
  label: string;
  create: (ref: HTMLDivElement) => void;
};

function ToolItem({ label, create }: ToolItemProps) {
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

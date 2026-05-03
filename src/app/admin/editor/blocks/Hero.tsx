"use client";

import { useNode } from "@craftjs/core";

export type HeroProps = {
  title: string;
  subtitle: string;
  align: "left" | "center" | "right";
  backgroundColor: string;
  textColor: string;
  padding: number;
};

export function Hero({
  title,
  subtitle,
  align,
  backgroundColor,
  textColor,
  padding,
}: HeroProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <section
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        padding,
        backgroundColor,
        color: textColor,
        textAlign: align,
        borderRadius: 8,
      }}
    >
      <h1 style={{ margin: 0, marginBottom: 8 }}>{title}</h1>
      <p style={{ margin: 0, opacity: 0.8 }}>{subtitle}</p>
    </section>
  );
}

Hero.craft = {
  displayName: "Hero",
  props: {
    title: "Welcome to GeoRoute",
    subtitle: "Plan, optimize, and manage your routes with ease.",
    align: "left",
    backgroundColor: "#0f172a",
    textColor: "#ffffff",
    padding: 32,
  },
};

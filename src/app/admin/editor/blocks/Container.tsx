"use client";

import { ReactNode } from "react";
import { useNode } from "@craftjs/core";

interface ContainerProps {
  children?: ReactNode;
}

export function Container({ children }: ContainerProps) {
  const { connectors } = useNode();

  return (
    <div
      ref={(ref) => {
        if (ref) connectors.connect(ref);
      }}
      style={{
        padding: "20px",
        border: "1px dashed #ccc",
        minHeight: "50px",
      }}
    >
      {children}
    </div>
  );
}

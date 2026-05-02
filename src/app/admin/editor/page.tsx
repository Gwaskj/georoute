"use client";

import { useState } from "react";
import { Puck } from "@puckeditor/core";
import { puckConfig } from "@/puck/puck.config";

export default function EditorPage() {
  const [data, setData] = useState<any>({ content: [] });

  return (
    <div style={{ padding: 20 }}>
      <Puck
        config={puckConfig}
        data={data}
        onChange={(nextData) => setData(nextData)}
      />
    </div>
  );
}

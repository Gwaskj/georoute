"use client";

import { useState } from "react";
import { Puck } from "@puckeditor/core";
import { puckConfig } from "@/puck/puck.config";
import styles from "./PuckEditorPage.module.css";

export default function PuckEditorPage() {
  // Puck v1 expects untyped JSON-like data
  const [data, setData] = useState<{ content: unknown[] }>({ content: [] });

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Puck Editor</h1>

      <Puck config={puckConfig} data={data} onChange={setData} />
    </div>
  );
}

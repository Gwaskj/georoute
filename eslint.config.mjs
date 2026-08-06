import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// eslint-config-next 16 ships native flat configs, so these are spread
// directly. Routing them through FlatCompat instead throws on a circular
// structure while validating the legacy schema.
export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      // Deno, not Node -- different globals and import style entirely.
      "supabase/functions/**",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

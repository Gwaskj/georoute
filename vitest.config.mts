import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

export default defineConfig({
  resolve: {
    alias: {
      // Same "@/..." alias the app uses, so tests import modules by the path
      // they are written with rather than by relative depth.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Node, not jsdom: what is under test here is scheduling arithmetic, not
    // components. Nothing in these suites touches the DOM.
    environment: "node",
    // e2e/ is Playwright's; it must not be collected by vitest, which would
    // try to run browser tests in a Node process.
    include: ["src/**/*.test.ts"],
  },
});

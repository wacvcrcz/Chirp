import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Database tests skip themselves unless RUN_DB_TESTS=1 (set by test:db).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: true,
    testTimeout: 30_000,
  },
});

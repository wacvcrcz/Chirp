import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

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
    // Database tests are skipped unless TEST_DATABASE_URL is set.
    // See AGENTS.md for Supabase local and pnpm db:test-setup.
    testTimeout: 20_000,
  },
});

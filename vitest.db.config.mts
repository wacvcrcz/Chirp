import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config.mts";

// Database tests run against the hosted dev project. They create and delete
// their own users; nothing is truncated. `pnpm test` does not load this file.
// Load local env files here so `pnpm test:db` works standalone. Values are
// never printed or forwarded to the tests as output.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // Optional file.
  }
}
process.env.RUN_DB_TESTS = "1";

export default mergeConfig(
  base,
  defineConfig({
    test: { testTimeout: 60_000, hookTimeout: 60_000 },
  }),
);

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  // Always show /en or /ar so direction and theme screenshots are unambiguous.
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

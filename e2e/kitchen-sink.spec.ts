import { expect, test } from "@playwright/test";

// Parallel workers race the Turbopack dev compiler and occasionally get the
// runtime error overlay, so the four screenshots run one at a time.
test.describe.configure({ mode: "serial" });

const MODES = [
  { name: "en-light", locale: "en", theme: "light", dir: "ltr" },
  { name: "en-dark", locale: "en", theme: "dark", dir: "ltr" },
  { name: "ar-light", locale: "ar", theme: "light", dir: "rtl" },
  { name: "ar-dark", locale: "ar", theme: "dark", dir: "rtl" },
] as const;

for (const mode of MODES) {
  test(`kitchen sink: ${mode.name}`, async ({ page }) => {
    await page.addInitScript((theme) => {
      window.localStorage.setItem("theme", theme);
    }, mode.theme);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${mode.locale}/dev/kitchen-sink`);

    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", mode.locale);
    await expect(html).toHaveAttribute("dir", mode.dir);
    if (mode.theme === "dark") {
      await expect(html).toHaveClass(/dark/);
    } else {
      await expect(html).not.toHaveClass(/dark/);
    }

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: mode.locale === "ar" ? "مختبر التصميم" : "Kitchen sink",
      }),
    ).toBeVisible();

    await page.evaluate(() => document.fonts.ready);
    // Keep the Next.js dev tools badge out of the reference screenshots.
    await page.addStyleTag({ content: "nextjs-portal { display: none !important }" });
    await page.screenshot({
      path: `test-results/screenshots/kitchen-sink-${mode.name}.png`,
      fullPage: true,
    });
  });
}

import { expect, test } from "@playwright/test";

test("root redirects to the default locale and renders the shell", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);

  await expect(
    page.getByRole("navigation", { name: "Feed" }).getByRole("link", {
      name: "For you",
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Chirp" }).first()).toBeVisible();
});

test("Arabic renders right to left", async ({ page }) => {
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
});

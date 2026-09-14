import { test, expect } from "@playwright/test";

test.describe("Dashboard Protected Routes", () => {
  test("should redirect unauthenticated user to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect unauthenticated user from admin panel to admin login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

import { test, expect } from "@playwright/test";

test.describe("Authentication Flows", () => {
  test("should render user login form and validate fields", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign In|Login/i })).toBeVisible();

    // Check link to register
    const signupLink = page.getByRole("link", { name: /Sign up|Create account/i });
    await expect(signupLink).toBeVisible();
  });

  test("should render separate admin login portal", async ({ page }) => {
    await page.goto("/admin/login");

    await expect(page.getByText(/Admin Console|Superadmin/i).first()).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should render the hero section, navigation and CTAs", async ({ page }) => {
    await page.goto("/");

    // Verify page title or app name
    await expect(page).toHaveTitle(/VocalIQ/i);

    // Verify main navigation links
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();

    // Verify hero CTA buttons
    const ctaButton = page.getByRole("link", { name: /Start Free Trial|Get Started/i }).first();
    await expect(ctaButton).toBeVisible();

    // Verify features section
    const featuresHeading = page.getByText(/Features|Everything you need/i).first();
    await expect(featuresHeading).toBeVisible();
  });

  test("should navigate to login page from landing", async ({ page }) => {
    await page.goto("/");
    const loginLink = page.getByRole("link", { name: /Sign In|Login/i }).first();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});

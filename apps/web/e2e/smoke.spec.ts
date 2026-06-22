import { test, expect } from "@playwright/test";

test.describe("App Smoke Test", () => {
  test("home page loads and displays welcome message", async ({ page }) => {
    await page.goto("/");

    // Check that the page loads with the expected content
    await expect(page.locator("h1")).toContainText("Welcome to LedgerMx");
  });

  test("navigation to onboarding page works", async ({ page }) => {
    await page.goto("/");

    // Click the onboarding link
    await page.click("a[href='/onboarding']");

    // Verify we're on the onboarding page
    await expect(page.locator("h1")).toContainText("LedgerMx Setup");
  });
});

/**
 * E2E tests for authentication pages.
 * Tests registration page load, login page load, and unauthenticated redirects.
 */
import { test, expect } from "@playwright/test";

test.describe("Authentication Pages", () => {
  test("registration page loads correctly", async ({ page }) => {
    await page.goto("/register");

    // Check page title or header
    await expect(page).toHaveURL("/register");
    
    // Check for registration form elements
    await expect(page.locator("form[aria-label='Registration Form']")).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']").first()).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("login page loads correctly", async ({ page }) => {
    await page.goto("/login");

    // Check page title or header
    await expect(page).toHaveURL("/login");
    
    // Check for login form elements
    await expect(page.locator("form[aria-label='Login Form']")).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("unauthenticated user is redirected to login when accessing protected route", async ({
    page,
  }) => {
    // Try to access a protected route (e.g., /accounts) without being authenticated
    await page.goto("/accounts");

    // Should be redirected to /login with redirect parameter
    await expect(page).toHaveURL(/\/login.*redirect=%2Faccounts/);
  });

  test("home page is publicly accessible without redirect", async ({
    page,
  }) => {
    // Home page should be publicly accessible without authentication
    await page.goto("/");

    // Should remain on home page, not redirect to login
    await expect(page).toHaveURL("/");
    
    // Verify the page loads with expected content
    await expect(page.locator("h1")).toContainText("Welcome to LedgerMx");
  });
});

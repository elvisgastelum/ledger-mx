/**
 * E2E tests for transaction form and categories.
 *
 * NOTE: These are MOCKED frontend E2E visibility flows.
 * Backend seeding/integration remains covered by application tests.
 * No live API/DB is used; all backend calls are intercepted via page.route().
 */
import { test, expect } from "@playwright/test";

// Mock data
const MOCK_USER = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "test@example.com",
  displayName: "Test User",
};

const MOCK_ACCESS_TOKEN = "mock-access-token-12345";

const MOCK_ACCOUNTS = [
  {
    id: "660e8400-e29b-41d4-a716-446655440001",
    name: "Checking Account",
    type: "checking",
    balanceCents: 500000,
    currency: "USD",
    status: "active",
    ownership: "user",
    systemRole: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440002",
    name: "Savings Account",
    type: "savings",
    balanceCents: 1000000,
    currency: "USD",
    status: "active",
    ownership: "user",
    systemRole: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
];

const MOCK_CATEGORIES = [
  {
    id: "770e8400-e29b-41d4-a716-446655440001",
    name: "Need",
    parentId: null,
    categoryGroupId: "880e8400-e29b-41d4-a716-446655440001",
    ownership: "user",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    usageCount: 0,
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440002",
    name: "Groceries",
    parentId: "770e8400-e29b-41d4-a716-446655440001",
    categoryGroupId: "880e8400-e29b-41d4-a716-446655440001",
    ownership: "user",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    usageCount: 0,
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440003",
    name: "Want",
    parentId: null,
    categoryGroupId: "880e8400-e29b-41d4-a716-446655440002",
    ownership: "user",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    usageCount: 0,
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440004",
    name: "Dining Out",
    parentId: "770e8400-e29b-41d4-a716-446655440003",
    categoryGroupId: "880e8400-e29b-41d4-a716-446655440002",
    ownership: "user",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    usageCount: 0,
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440005",
    name: "Savings",
    parentId: null,
    categoryGroupId: "880e8400-e29b-41d4-a716-446655440003",
    ownership: "user",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    usageCount: 0,
  },
];

const MOCK_TRANSACTIONS: any[] = [];

/**
 * Helper to setup all common API mocks for authenticated user flows.
 */
async function setupAuthenticatedMocks(page: any) {
  // Mock auth refresh to "authenticate" the user
  await page.route("**/api/v1/auth/refresh", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: MOCK_ACCESS_TOKEN,
        user: MOCK_USER,
      }),
    });
  });

  // Mock categories list - match any URL ending with /api/v1/categories or /api/v1/categories?...
  await page.route(/.*\/api\/v1\/categories.*/, async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        categories: MOCK_CATEGORIES,
      }),
    });
  });

  // Mock accounts list
  await page.route(/.*\/api\/v1\/accounts.*/, async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accounts: MOCK_ACCOUNTS,
      }),
    });
  });

  // Mock transactions list
  await page.route(/.*\/api\/v1\/transactions.*/, async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        transactions: MOCK_TRANSACTIONS,
      }),
    });
  });
}

test.describe("Transaction Form - Category Selector", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedMocks(page);
  });

  test("should display category selector in transaction form and allow selection", async ({
    page,
  }) => {
    // Navigate to transactions page
    await page.goto("/transactions");

    // Wait for transactions page to load by checking for heading or empty state
    await expect(page.getByRole("heading", { level: 1, name: /^Transactions$/ })).toBeVisible();

    // Click "Create Transaction" button in the empty state (mocks return empty transactions)
    await page.getByText(/no transactions found/i).locator("..").getByRole("button", { name: /create transaction/i }).click();

    // Wait for form to appear
    await expect(page.getByRole("form", { name: "Create Transaction" })).toBeVisible();

    // Verify the Category selector is present (should be visible when expense type is selected)
    // First, select "Expense" type to reveal the category field
    const typeSelect = page.locator("#type");
    await typeSelect.click();
    await page.getByRole("option", { name: "Expense" }).click();

    // Now the category selector should be visible
    const categoryLabel = page.getByLabel(/category/i);
    await expect(categoryLabel).toBeVisible();

    // Click on the category selector to open the dropdown
    const categoryTrigger = page.locator("#categoryId");
    await expect(categoryTrigger).toBeVisible();
    await categoryTrigger.click();

    // Wait for the dropdown to open (Radix portal)
    const selectContent = page.locator("[role='listbox']");
    await expect(selectContent).toBeVisible();

    // Wait for the dropdown to open and verify categories are listed
    // The SelectContent should be visible with category options
    await expect(selectContent.getByText("Need", { exact: false })).toBeVisible();
    await expect(selectContent.getByText("Want", { exact: false })).toBeVisible();
    await expect(selectContent.getByText("Savings", { exact: false })).toBeVisible();

    // Verify child categories are also visible (with indentation)
    await expect(selectContent.getByText("Groceries", { exact: false })).toBeVisible();
    await expect(selectContent.getByText("Dining Out", { exact: false })).toBeVisible();

    // Select a category
    await selectContent.getByText("Need", { exact: false }).click();

    // Verify the selector now shows the selected value
    await expect(categoryTrigger).toContainText("Need");
  });

  test("should show category selector for income transactions", async ({
    page,
  }) => {
    // Navigate to transactions page
    await page.goto("/transactions");
    await expect(page.getByRole("heading", { level: 1, name: /^Transactions$/ })).toBeVisible();

    // Click "Create Transaction" button in the empty state (mocks return empty transactions)
    await page.getByText(/no transactions found/i).locator("..").getByRole("button", { name: /create transaction/i }).click();

    // Wait for form to appear
    await expect(page.getByRole("form", { name: "Create Transaction" })).toBeVisible();

    // Select "Income" type
    const typeSelect = page.locator("#type");
    await typeSelect.click();
    await page.getByRole("option", { name: "Income" }).click();

    // Now the category selector should be visible for income too
    const categoryTrigger = page.locator("#categoryId");
    await expect(categoryTrigger).toBeVisible();

    // Click to open dropdown
    await categoryTrigger.click();

    // Wait for the dropdown to open and verify categories are listed
    const selectContent = page.locator("[role='listbox']");
    await expect(selectContent).toBeVisible();
    await expect(selectContent.getByText("Need", { exact: false })).toBeVisible();
  });

  test("should require category selection before submitting expense", async ({
    page,
  }) => {
    // Navigate to transactions page
    await page.goto("/transactions");
    await expect(page.getByRole("heading", { level: 1, name: /^Transactions$/ })).toBeVisible();

    // Click "Create Transaction" button in the empty state (mocks return empty transactions)
    await page.getByText(/no transactions found/i).locator("..").getByRole("button", { name: /create transaction/i }).click();

    // Wait for form to appear
    await expect(page.getByRole("form", { name: "Create Transaction" })).toBeVisible();

    // Fill in required fields except category
    await page.locator("#amount").fill("100.00");

    // Select an account
    const accountSelect = page.locator("#expenseAccountId");
    await accountSelect.click();
    await page.getByRole("option").first().click();

    // Try to submit without selecting category (scope to form to avoid strict mode violation)
    await page.getByRole("form", { name: "Create Transaction" }).getByRole("button", { name: /create transaction/i }).click();

    // Should show validation error for category
    await expect(page.getByText(/select a category/i)).toBeVisible();
  });
});

test.describe("Onboarding - Default Categories", () => {
  test.beforeEach(async ({ page }) => {
    // Clear onboarding localStorage to ensure Step 1 is shown
    // Use addInitScript to run before page loads (avoids origin error)
    await page.addInitScript(() => localStorage.removeItem('ledger-mx-onboarding'));
  });

  test("should create default categories after onboarding and display them in transaction form", async ({
    page,
  }) => {
    // Setup auth mock
    await setupAuthenticatedMocks(page);

    // Mock the onboarding layout application
    await page.route(/.*\/api\/v1\/onboarding\/layout.*/, async (route: any) => {
      const request = route.request();
      if (request.method() === "POST") {
        // In a real flow, the backend would create categories based on layout
        // For this mock, we'll just return success
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            categoryGroups: [
              {
                id: "880e8400-e29b-41d4-a716-446655440001",
                name: "Need",
                kind: "expense",
                idealPercentageBasisPoints: 5000,
                sortOrder: 0,
                ownership: "user",
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
              },
              {
                id: "880e8400-e29b-41d4-a716-446655440002",
                name: "Want",
                kind: "expense",
                idealPercentageBasisPoints: 3000,
                sortOrder: 1,
                ownership: "user",
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
              },
              {
                id: "880e8400-e29b-41d4-a716-446655440003",
                name: "Savings",
                kind: "expense",
                idealPercentageBasisPoints: 2000,
                sortOrder: 2,
                ownership: "user",
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
              },
            ],
            created: true,
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to onboarding page
    await page.goto("/onboarding");
    // Wait for onboarding page to load by checking for the setup heading
    await expect(page.getByRole("heading", { name: /LedgerMx Setup/i })).toBeVisible();

    // Verify onboarding wizard is visible
    await expect(page.getByRole("heading", { name: /LedgerMx Setup/i })).toBeVisible();

    // Step 1: Welcome - Click "Get Started" (button has aria-label="Start onboarding")
    await page.getByRole("button", { name: /start onboarding/i }).click();

    // Step 2: Layout Selection - Select "50/30/20 Layout"
    await expect(page.getByText(/Choose Your Budget Layout/i)).toBeVisible();
    await page.getByText(/50\/30\/20 Layout/i).click();

    // Click "Next"
    await page.getByRole("button", { name: /next/i }).click();

    // Step 3: Income Group - Click "Next"
    await expect(page.getByRole('heading', { name: /Income Categories/i })).toBeVisible();
    await page.getByRole("button", { name: /next/i }).click();

    // Step 4: Summary - Click "Create Groups"
    await expect(page.getByRole('heading', { name: /Summary/i })).toBeVisible();
    const createGroupsButton = page.getByRole("button", { name: "Create category groups" });
    await expect(createGroupsButton).toBeEnabled();
    await createGroupsButton.click();

    // Wait for onboarding to complete and redirect to dashboard
    await page.waitForURL("/");

    // Now navigate to transactions page to verify categories are available
    await page.goto("/transactions");
    await expect(page.getByRole("heading", { level: 1, name: /^Transactions$/ })).toBeVisible();

    // Click "Create Transaction" button in the empty state (mocks return empty transactions)
    await page.getByText(/no transactions found/i).locator("..").getByRole("button", { name: /create transaction/i }).click();

    // Wait for form to appear
    await expect(page.getByRole("form", { name: "Create Transaction" })).toBeVisible();

    // Select "Expense" type to reveal category field
    const typeSelect = page.locator("#type");
    await typeSelect.click();
    await page.getByRole("option", { name: "Expense" }).click();

    // Click on the category selector to open the dropdown
    const categoryTrigger = page.locator("#categoryId");
    await expect(categoryTrigger).toBeVisible();
    await categoryTrigger.click();

    // Wait for the dropdown to open (Radix portal)
    const selectContent = page.locator("[role='listbox']");
    await expect(selectContent).toBeVisible();

    // Verify default categories from 50/30/20 layout are visible
    // (These would have been created during onboarding)
    await expect(selectContent.getByText("Need", { exact: false })).toBeVisible();
    await expect(selectContent.getByText("Want", { exact: false })).toBeVisible();
    await expect(selectContent.getByText("Savings", { exact: false })).toBeVisible();
  });
});

/**
 * Personal seed data template.
 *
 * This file serves as a template for personal seed data.
 * Copy this file to `personal.ts` and customize with your own data.
 *
 * IMPORTANT: The `personal.ts` file should be gitignored and never committed.
 * See `.gitignore` for the pattern.
 *
 * Usage:
 * 1. Copy this file: `cp personal.template.ts personal.ts`
 * 2. Customize the data with your real accounts and categories
 * 3. Run: `pnpm --filter @ledger-mx/database seed:personal`
 */

import type {
  SeedUser,
  SeedCategoryGroup,
  SeedCategory,
  SeedAccount,
  SeedEnvelope,
  SeedTransaction,
  SeedTransactionLine,
  SeedData,
} from "./types.js";

// Replace with your actual user ID if you have one, or leave as-is to create a new user
export const personalUser: SeedUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "your-email@example.com",
  passwordHash: "$2b$10$hashed_password_for_personal_user",
  displayName: "Your Name",
};

/**
 * Customize these with your real financial data.
 * This is just a template - modify to match your actual accounts, categories, etc.
 */
export const personalCategoryGroups: SeedCategoryGroup[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    userId: personalUser.id,
    name: "Income",
    kind: "income",
    sortOrder: 0,
    ownership: "system",
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    userId: personalUser.id,
    name: "Housing",
    kind: "expense",
    sortOrder: 1,
    ownership: "user",
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    userId: personalUser.id,
    name: "Food",
    kind: "expense",
    sortOrder: 2,
    ownership: "user",
  },
];

export const personalCategories: SeedCategory[] = [
  {
    id: "10000000-0000-0000-0000-000000000101",
    userId: personalUser.id,
    name: "Salary",
    categoryGroupId: "10000000-0000-0000-0000-000000000001",
  },
  {
    id: "10000000-0000-0000-0000-000000000102",
    userId: personalUser.id,
    name: "Rent",
    categoryGroupId: "10000000-0000-0000-0000-000000000002",
  },
  {
    id: "10000000-0000-0000-0000-000000000103",
    userId: personalUser.id,
    name: "Groceries",
    categoryGroupId: "10000000-0000-0000-0000-000000000003",
  },
];

export const personalAccounts: SeedAccount[] = [
  {
    id: "10000000-0000-0000-0000-000000000201",
    userId: personalUser.id,
    name: "My Checking",
    type: "debit",
    currencyCode: "USD",
  },
  {
    id: "10000000-0000-0000-0000-000000000202",
    userId: personalUser.id,
    name: "My Savings",
    type: "savings",
    currencyCode: "USD",
  },
];

export const personalEnvelopes: SeedEnvelope[] = [
  {
    id: "10000000-0000-0000-0000-000000000301",
    userId: personalUser.id,
    name: "Rent",
    targetAmountCents: 150000,
    isProtected: true,
    sortOrder: 0,
  },
  {
    id: "10000000-0000-0000-0000-000000000302",
    userId: personalUser.id,
    name: "Groceries",
    targetAmountCents: 50000,
    isProtected: false,
    sortOrder: 1,
  },
];

/**
 * Add your real transactions here.
 * Each transaction must have at least one transaction line.
 */
export const personalTransactions: SeedTransaction[] = [
  // Example transaction - replace with your real data
  // {
  //   id: "10000000-0000-0000-0000-000000000401",
  //   userId: personalUser.id,
  //   type: "income",
  //   occurredAt: new Date("2024-06-01"),
  //   description: "Paycheck",
  // },
];

export const personalTransactionLines: SeedTransactionLine[] = [
  // Example transaction line - replace with your real data
  // {
  //   id: "10000000-0000-0000-0000-000000000501",
  //   userId: personalUser.id,
  //   transactionId: "10000000-0000-0000-0000-000000000401",
  //   targetType: "account",
  //   accountId: "10000000-0000-0000-0000-000000000201",
  //   amountCents: 250000,
  //   memo: "Salary deposit",
  // },
];

/**
 * Complete personal seed data.
 * Customize the arrays above to match your real financial data.
 */
export const personalSeedData: SeedData = {
  users: [personalUser],
  categoryGroups: personalCategoryGroups,
  categories: personalCategories,
  accounts: personalAccounts,
  envelopes: personalEnvelopes,
  transactions: personalTransactions,
  transactionLines: personalTransactionLines,
};

/**
 * Returns the personal seed data.
 */
export function getPersonalSeedData(): SeedData {
  return personalSeedData;
}

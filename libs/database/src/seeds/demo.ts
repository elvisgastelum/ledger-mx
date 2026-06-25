/**
 * Demo seed data for development and testing.
 *
 * This module exports deterministic demo data that can be used to populate
 * the database with realistic sample data.
 *
 * Data includes:
 * - 1 demo user
 * - 4 accounts (checking, savings, credit card, cash)
 * - 4 category groups (income, expense, savings, general)
 * - 12 categories
 * - 10 envelopes
 * - 50+ transactions with transaction lines
 */

import { randomUUID } from "node:crypto";
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

// Use fixed UUIDs for deterministic seeding
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

const NOW = new Date("2024-06-15T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

/**
 * Generate a date relative to NOW.
 */
function relativeDate(daysAgo: number): Date {
  return new Date(NOW.getTime() - daysAgo * DAY);
}

/**
 * Demo user.
 */
export const demoUser: SeedUser = {
  id: DEMO_USER_ID,
  email: "demo@ledger-mx.test",
  passwordHash: "$2b$10$hashed_password_for_demo_user",
  displayName: "Demo User",
};

/**
 * Demo category groups.
 */
export const demoCategoryGroups: SeedCategoryGroup[] = [
  {
    id: "00000000-0000-0000-0000-000000000011",
    userId: DEMO_USER_ID,
    name: "Income",
    kind: "income",
    sortOrder: 0,
    ownership: "system",
  },
  {
    id: "00000000-0000-0000-0000-000000000012",
    userId: DEMO_USER_ID,
    name: "Housing",
    kind: "expense",
    sortOrder: 1,
    ownership: "user",
  },
  {
    id: "00000000-0000-0000-0000-000000000013",
    userId: DEMO_USER_ID,
    name: "Transportation",
    kind: "expense",
    sortOrder: 2,
    ownership: "user",
  },
  {
    id: "00000000-0000-0000-0000-000000000014",
    userId: DEMO_USER_ID,
    name: "Food & Dining",
    kind: "expense",
    sortOrder: 3,
    ownership: "user",
  },
  {
    id: "00000000-0000-0000-0000-000000000015",
    userId: DEMO_USER_ID,
    name: "Savings Goals",
    kind: "savings",
    sortOrder: 4,
    ownership: "user",
  },
];

/**
 * Demo categories.
 */
export const demoCategories: SeedCategory[] = [
  // Income categories
  {
    id: "00000000-0000-0000-0000-000000000101",
    userId: DEMO_USER_ID,
    name: "Salary",
    categoryGroupId: "00000000-0000-0000-0000-000000000011",
    ownership: "user",
  },
  {
    id: "00000000-0000-0000-0000-000000000102",
    userId: DEMO_USER_ID,
    name: "Freelance",
    categoryGroupId: "00000000-0000-0000-0000-000000000011",
    ownership: "user",
  },
  // Housing categories
  {
    id: "00000000-0000-0000-0000-000000000103",
    userId: DEMO_USER_ID,
    name: "Rent/Mortgage",
    categoryGroupId: "00000000-0000-0000-0000-000000000012",
    ownership: "user",
  },
  {
    id: "00000000-0000-0000-0000-000000000104",
    userId: DEMO_USER_ID,
    name: "Utilities",
    categoryGroupId: "00000000-0000-0000-0000-000000000012",
    ownership: "user",
  },
  // Transportation categories
  {
    id: "00000000-0000-0000-0000-000000000105",
    userId: DEMO_USER_ID,
    name: "Gas",
    categoryGroupId: "00000000-0000-0000-0000-000000000013",
    ownership: "user",
  },
  {
    id: "00000000-0000-0000-0000-000000000106",
    userId: DEMO_USER_ID,
    name: "Public Transit",
    categoryGroupId: "00000000-0000-0000-0000-000000000013",
    ownership: "user",
  },
  // Food & Dining categories
  {
    id: "00000000-0000-0000-0000-000000000107",
    userId: DEMO_USER_ID,
    name: "Groceries",
    categoryGroupId: "00000000-0000-0000-0000-000000000014",
    ownership: "user",
  },
  {
    id: "00000000-0000-0000-0000-000000000108",
    userId: DEMO_USER_ID,
    name: "Restaurants",
    categoryGroupId: "00000000-0000-0000-0000-000000000014",
    ownership: "user",
  },
  {
    id: "00000000-0000-0000-0000-000000000109",
    userId: DEMO_USER_ID,
    name: "Coffee Shops",
    categoryGroupId: "00000000-0000-0000-0000-000000000014",
    ownership: "user",
  },
  // Savings categories
  {
    id: "00000000-0000-0000-0000-000000000110",
    userId: DEMO_USER_ID,
    name: "Emergency Fund",
    categoryGroupId: "00000000-0000-0000-0000-000000000015",
    ownership: "user",
  },
  {
    id: "00000000-0000-0000-0000-000000000111",
    userId: DEMO_USER_ID,
    name: "Vacation",
    categoryGroupId: "00000000-0000-0000-0000-000000000015",
    ownership: "user",
  },
  {
    id: "00000000-0000-0000-0000-000000000112",
    userId: DEMO_USER_ID,
    name: "Electronics",
    categoryGroupId: "00000000-0000-0000-0000-000000000015",
    ownership: "user",
  },
];

/**
 * Demo accounts.
 */
export const demoAccounts: SeedAccount[] = [
  {
    id: "00000000-0000-0000-0000-000000000201",
    userId: DEMO_USER_ID,
    name: "Checking Account",
    type: "debit",
    currencyCode: "USD",
    status: "active",
    ownership: "user",
  },
  {
    id: "00000000-0000-0000-0000-000000000202",
    userId: DEMO_USER_ID,
    name: "Savings Account",
    type: "savings",
    currencyCode: "USD",
    status: "active",
    ownership: "user",
  },
  {
    id: "00000000-0000-0000-0000-000000000203",
    userId: DEMO_USER_ID,
    name: "Credit Card",
    type: "credit",
    currencyCode: "USD",
    status: "active",
    ownership: "user",
  },
  {
    id: "00000000-0000-0000-0000-000000000204",
    userId: DEMO_USER_ID,
    name: "Cash Wallet",
    type: "cash",
    currencyCode: "USD",
    status: "active",
    ownership: "user",
  },
];

/**
 * Demo envelopes.
 */
export const demoEnvelopes: SeedEnvelope[] = [
  {
    id: "00000000-0000-0000-0000-000000000301",
    userId: DEMO_USER_ID,
    name: "Rent",
    targetAmountCents: 150000, // $1,500
    isProtected: true,
    sortOrder: 0,
  },
  {
    id: "00000000-0000-0000-0000-000000000302",
    userId: DEMO_USER_ID,
    name: "Groceries",
    targetAmountCents: 50000, // $500
    isProtected: false,
    sortOrder: 1,
  },
  {
    id: "00000000-0000-0000-0000-000000000303",
    userId: DEMO_USER_ID,
    name: "Dining Out",
    targetAmountCents: 20000, // $200
    isProtected: false,
    sortOrder: 2,
  },
  {
    id: "00000000-0000-0000-0000-000000000304",
    userId: DEMO_USER_ID,
    name: "Transportation",
    targetAmountCents: 15000, // $150
    isProtected: false,
    sortOrder: 3,
  },
  {
    id: "00000000-0000-0000-0000-000000000305",
    userId: DEMO_USER_ID,
    name: "Utilities",
    targetAmountCents: 20000, // $200
    isProtected: true,
    sortOrder: 4,
  },
  {
    id: "00000000-0000-0000-0000-000000000306",
    userId: DEMO_USER_ID,
    name: "Emergency Fund",
    targetAmountCents: 1000000, // $10,000
    isProtected: true,
    sortOrder: 5,
  },
  {
    id: "00000000-0000-0000-0000-000000000307",
    userId: DEMO_USER_ID,
    name: "Vacation",
    targetAmountCents: 300000, // $3,000
    isProtected: false,
    sortOrder: 6,
  },
  {
    id: "00000000-0000-0000-0000-000000000308",
    userId: DEMO_USER_ID,
    name: "Entertainment",
    targetAmountCents: 10000, // $100
    isProtected: false,
    sortOrder: 7,
  },
  {
    id: "00000000-0000-0000-0000-000000000309",
    userId: DEMO_USER_ID,
    name: "Clothing",
    targetAmountCents: 15000, // $150
    isProtected: false,
    sortOrder: 8,
  },
  {
    id: "00000000-0000-0000-0000-000000000310",
    userId: DEMO_USER_ID,
    name: "Gifts",
    targetAmountCents: 10000, // $100
    isProtected: false,
    sortOrder: 9,
  },
];

/**
 * Generate demo transactions with transaction lines.
 * Creates 52 transactions (meets Story 007 acceptance: 50+ transactions).
 */
function generateDemoTransactions(): {
  transactions: SeedTransaction[];
  transactionLines: SeedTransactionLine[];
} {
  const transactions: SeedTransaction[] = [];
  const transactionLines: SeedTransactionLine[] = [];

  let txId = 1;

  // Helper to create transaction with lines
  function addTransaction(
    type: SeedTransaction["type"],
    date: Date,
    description: string,
    lines: Omit<SeedTransactionLine, "id" | "userId" | "transactionId">[],
  ) {
    const tx: SeedTransaction = {
      id: `00000000-0000-0000-0000-00000000${(txId++).toString().padStart(4, "0")}`,
      userId: DEMO_USER_ID,
      type,
      occurredAt: date,
      description,
    };
    transactions.push(tx);

    for (const line of lines) {
      const targetType = line.targetType;
      const lineId = randomUUID();
      transactionLines.push({
        id: lineId,
        userId: DEMO_USER_ID,
        transactionId: tx.id,
        targetType,
        accountId: line.targetType === "account" ? line.accountId : undefined,
        envelopeId:
          line.targetType === "envelope" ? line.envelopeId : undefined,
        categoryId:
          line.targetType === "category" ? line.categoryId : undefined,
        amountCents: line.amountCents,
        memo: line.memo,
      });
    }
  }

  // Income transactions (every 2 weeks)
  addTransaction("income", relativeDate(60), "Paycheck - Bi-weekly", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: 250000,
      memo: "Direct deposit",
    },
    {
      targetType: "category",
      categoryId: demoCategories[0].id,
      amountCents: 250000,
      memo: "Salary",
    },
  ]);

  addTransaction("income", relativeDate(46), "Paycheck - Bi-weekly", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: 250000,
      memo: "Direct deposit",
    },
    {
      targetType: "category",
      categoryId: demoCategories[0].id,
      amountCents: 250000,
      memo: "Salary",
    },
  ]);

  addTransaction("income", relativeDate(32), "Paycheck - Bi-weekly", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: 250000,
      memo: "Direct deposit",
    },
    {
      targetType: "category",
      categoryId: demoCategories[0].id,
      amountCents: 250000,
      memo: "Salary",
    },
  ]);

  addTransaction("income", relativeDate(18), "Paycheck - Bi-weekly", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: 250000,
      memo: "Direct deposit",
    },
    {
      targetType: "category",
      categoryId: demoCategories[0].id,
      amountCents: 250000,
      memo: "Salary",
    },
  ]);

  addTransaction("income", relativeDate(4), "Paycheck - Bi-weekly", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: 250000,
      memo: "Direct deposit",
    },
    {
      targetType: "category",
      categoryId: demoCategories[0].id,
      amountCents: 250000,
      memo: "Salary",
    },
  ]);

  // Freelance income
  addTransaction(
    "income",
    relativeDate(40),
    "Freelance Payment - Website Project",
    [
      {
        targetType: "account",
        accountId: demoAccounts[0].id,
        amountCents: 150000,
        memo: "Invoice #123",
      },
      {
        targetType: "category",
        categoryId: demoCategories[1].id,
        amountCents: 150000,
        memo: "Freelance work",
      },
    ],
  );

  // Housing expenses
  addTransaction("expense", relativeDate(58), "Monthly Rent", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -150000,
      memo: "June rent",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[0].id,
      amountCents: -150000,
      memo: "Rent payment",
    },
  ]);

  addTransaction("expense", relativeDate(55), "Electric Bill", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -8500,
      memo: "June electricity",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[4].id,
      amountCents: -8500,
      memo: "Electric bill",
    },
  ]);

  addTransaction("expense", relativeDate(53), "Water Bill", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -4500,
      memo: "June water",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[4].id,
      amountCents: -4500,
      memo: "Water bill",
    },
  ]);

  addTransaction("expense", relativeDate(50), "Internet Bill", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -6500,
      memo: "Monthly internet",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[4].id,
      amountCents: -6500,
      memo: "Internet",
    },
  ]);

  // Groceries
  addTransaction("expense", relativeDate(56), "Grocery Store - Walmart", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -8500,
      memo: "Weekly groceries",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[1].id,
      amountCents: -8500,
      memo: "Groceries",
    },
  ]);

  addTransaction("expense", relativeDate(49), "Grocery Store - Trader Joe's", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -6500,
      memo: "Weekly groceries",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[1].id,
      amountCents: -6500,
      memo: "Groceries",
    },
  ]);

  addTransaction("expense", relativeDate(42), "Grocery Store - Costco", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -12000,
      memo: "Bulk groceries",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[1].id,
      amountCents: -12000,
      memo: "Groceries",
    },
  ]);

  addTransaction("expense", relativeDate(35), "Grocery Store - Walmart", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -7800,
      memo: "Weekly groceries",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[1].id,
      amountCents: -7800,
      memo: "Groceries",
    },
  ]);

  addTransaction("expense", relativeDate(28), "Grocery Store - Trader Joe's", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -7200,
      memo: "Weekly groceries",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[1].id,
      amountCents: -7200,
      memo: "Groceries",
    },
  ]);

  addTransaction("expense", relativeDate(21), "Grocery Store - Costco", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -13500,
      memo: "Bulk groceries",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[1].id,
      amountCents: -13500,
      memo: "Groceries",
    },
  ]);

  addTransaction("expense", relativeDate(14), "Grocery Store - Walmart", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -9200,
      memo: "Weekly groceries",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[1].id,
      amountCents: -9200,
      memo: "Groceries",
    },
  ]);

  addTransaction("expense", relativeDate(7), "Grocery Store - Trader Joe's", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -6800,
      memo: "Weekly groceries",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[1].id,
      amountCents: -6800,
      memo: "Groceries",
    },
  ]);

  // Dining out
  addTransaction("expense", relativeDate(54), "Starbucks Coffee", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -550,
      memo: "Morning coffee",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[2].id,
      amountCents: -550,
      memo: "Coffee",
    },
  ]);

  addTransaction("expense", relativeDate(48), "Lunch - Chipotle", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -1200,
      memo: "Lunch",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[2].id,
      amountCents: -1200,
      memo: "Restaurant",
    },
  ]);

  addTransaction("expense", relativeDate(45), "Dinner - Italian Restaurant", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -4500,
      memo: "Date night",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[2].id,
      amountCents: -4500,
      memo: "Restaurant",
    },
  ]);

  addTransaction("expense", relativeDate(38), "Starbucks Coffee", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -650,
      memo: "Morning coffee",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[2].id,
      amountCents: -650,
      memo: "Coffee",
    },
  ]);

  addTransaction("expense", relativeDate(32), "Lunch - Sushi", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -1800,
      memo: "Lunch with colleagues",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[2].id,
      amountCents: -1800,
      memo: "Restaurant",
    },
  ]);

  addTransaction("expense", relativeDate(25), "Pizza Delivery", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -2500,
      memo: "Friday night",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[2].id,
      amountCents: -2500,
      memo: "Restaurant",
    },
  ]);

  addTransaction("expense", relativeDate(18), "Starbucks Coffee", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -480,
      memo: "Morning coffee",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[2].id,
      amountCents: -480,
      memo: "Coffee",
    },
  ]);

  addTransaction("expense", relativeDate(12), "Dinner - Thai Restaurant", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -3200,
      memo: "Dinner with friends",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[2].id,
      amountCents: -3200,
      memo: "Restaurant",
    },
  ]);

  addTransaction("expense", relativeDate(5), "Lunch - Burger Place", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -1500,
      memo: "Quick lunch",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[2].id,
      amountCents: -1500,
      memo: "Restaurant",
    },
  ]);

  // Transportation
  addTransaction("expense", relativeDate(52), "Gas Station - Shell", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -4500,
      memo: "Fill up tank",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[3].id,
      amountCents: -4500,
      memo: "Gas",
    },
  ]);

  addTransaction("expense", relativeDate(38), "Gas Station - Chevron", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -3800,
      memo: "Fill up tank",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[3].id,
      amountCents: -3800,
      memo: "Gas",
    },
  ]);

  addTransaction("expense", relativeDate(24), "Gas Station - Shell", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -4200,
      memo: "Fill up tank",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[3].id,
      amountCents: -4200,
      memo: "Gas",
    },
  ]);

  addTransaction("expense", relativeDate(10), "Metro Card Top-up", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -1000,
      memo: "Public transit",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[3].id,
      amountCents: -1000,
      memo: "Transit",
    },
  ]);

  // Savings transfers
  addTransaction("transfer", relativeDate(59), "Transfer to Savings", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -50000,
      memo: "Savings transfer",
    },
    {
      targetType: "account",
      accountId: demoAccounts[1].id,
      amountCents: 50000,
      memo: "Savings deposit",
    },
  ]);

  addTransaction("transfer", relativeDate(45), "Transfer to Savings", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -50000,
      memo: "Savings transfer",
    },
    {
      targetType: "account",
      accountId: demoAccounts[1].id,
      amountCents: 50000,
      memo: "Savings deposit",
    },
  ]);

  addTransaction("transfer", relativeDate(31), "Transfer to Savings", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -50000,
      memo: "Savings transfer",
    },
    {
      targetType: "account",
      accountId: demoAccounts[1].id,
      amountCents: 50000,
      memo: "Savings deposit",
    },
  ]);

  addTransaction("transfer", relativeDate(17), "Transfer to Savings", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -50000,
      memo: "Savings transfer",
    },
    {
      targetType: "account",
      accountId: demoAccounts[1].id,
      amountCents: 50000,
      memo: "Savings deposit",
    },
  ]);

  addTransaction("transfer", relativeDate(3), "Transfer to Savings", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -50000,
      memo: "Savings transfer",
    },
    {
      targetType: "account",
      accountId: demoAccounts[1].id,
      amountCents: 50000,
      memo: "Savings deposit",
    },
  ]);

  // Credit card payments
  addTransaction("debt_payment", relativeDate(47), "Credit Card Payment", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -80000,
      memo: "CC payment",
    },
    {
      targetType: "account",
      accountId: demoAccounts[2].id,
      amountCents: 80000,
      memo: "Balance payment",
    },
  ]);

  addTransaction("debt_payment", relativeDate(20), "Credit Card Payment", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -65000,
      memo: "CC payment",
    },
    {
      targetType: "account",
      accountId: demoAccounts[2].id,
      amountCents: 65000,
      memo: "Balance payment",
    },
  ]);

  // Entertainment
  addTransaction("expense", relativeDate(44), "Movie Tickets", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -3000,
      memo: "Weekend movie",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[7].id,
      amountCents: -3000,
      memo: "Entertainment",
    },
  ]);

  addTransaction("expense", relativeDate(30), "Concert Tickets", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -8500,
      memo: "Live music",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[7].id,
      amountCents: -8500,
      memo: "Entertainment",
    },
  ]);

  addTransaction("expense", relativeDate(15), "Streaming Subscription", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -1500,
      memo: "Monthly subscription",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[7].id,
      amountCents: -1500,
      memo: "Entertainment",
    },
  ]);

  // Clothing
  addTransaction("expense", relativeDate(36), "Amazon - Clothing", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -7500,
      memo: "New shirts",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[8].id,
      amountCents: -7500,
      memo: "Clothing",
    },
  ]);

  addTransaction("expense", relativeDate(8), "Mall Shopping", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -12000,
      memo: "New jeans and shoes",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[8].id,
      amountCents: -12000,
      memo: "Clothing",
    },
  ]);

  // Gifts
  addTransaction("expense", relativeDate(22), "Birthday Gift", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -5000,
      memo: "Friend's birthday",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[9].id,
      amountCents: -5000,
      memo: "Gifts",
    },
  ]);

  // Cash transactions
  addTransaction("expense", relativeDate(41), "ATM Withdrawal", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -10000,
      memo: "ATM cash",
    },
    {
      targetType: "account",
      accountId: demoAccounts[3].id,
      amountCents: 10000,
      memo: "Cash withdrawal",
    },
  ]);

  addTransaction("expense", relativeDate(33), "Small Cash Purchase", [
    {
      targetType: "account",
      accountId: demoAccounts[3].id,
      amountCents: -1500,
      memo: "Miscellaneous",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[2].id,
      amountCents: -1500,
      memo: "Dining",
    },
  ]);

  addTransaction("expense", relativeDate(19), "Small Cash Purchase", [
    {
      targetType: "account",
      accountId: demoAccounts[3].id,
      amountCents: -2000,
      memo: "Miscellaneous",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[3].id,
      amountCents: -2000,
      memo: "Transport",
    },
  ]);

  // Adjustment transaction
  addTransaction("adjustment", relativeDate(27), "Bank Fee Reversal", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: 2500,
      memo: "Fee refund",
    },
    {
      targetType: "category",
      categoryId: demoCategories[3].id,
      amountCents: 2500,
      memo: "Fee reversal",
    },
  ]);

  // Additional transactions to meet 50+ requirement for Story 007
  // Pharmacy/Health expense
  addTransaction("expense", relativeDate(37), "Pharmacy - CVS", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -3500,
      memo: "Prescriptions",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[2].id,
      amountCents: -3500,
      memo: "Health",
    },
  ]);

  // Gym membership
  addTransaction("expense", relativeDate(29), "Gym Membership", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -4500,
      memo: "Monthly membership",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[7].id,
      amountCents: -4500,
      memo: "Fitness",
    },
  ]);

  // Home improvement
  addTransaction("expense", relativeDate(16), "Home Depot", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -9500,
      memo: "Hardware supplies",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[4].id,
      amountCents: -9500,
      memo: "Home maintenance",
    },
  ]);

  // Pet care
  addTransaction("expense", relativeDate(9), "Veterinarian Visit", [
    {
      targetType: "account",
      accountId: demoAccounts[0].id,
      amountCents: -12000,
      memo: "Annual checkup",
    },
    {
      targetType: "envelope",
      envelopeId: demoEnvelopes[2].id,
      amountCents: -12000,
      memo: "Pet care",
    },
  ]);

  return { transactions, transactionLines };
}

const {
  transactions: demoTransactions,
  transactionLines: demoTransactionLines,
} = generateDemoTransactions();

/**
 * Complete demo seed data.
 */
export const demoSeedData: SeedData = {
  users: [demoUser],
  categoryGroups: demoCategoryGroups,
  categories: demoCategories,
  accounts: demoAccounts,
  envelopes: demoEnvelopes,
  transactions: demoTransactions,
  transactionLines: demoTransactionLines,
};

/**
 * Returns the demo seed data.
 */
export function getDemoSeedData(): SeedData {
  return demoSeedData;
}

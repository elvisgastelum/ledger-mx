import { expect, test } from "vitest";
import {
  ACCOUNT_TYPES,
  TRANSACTION_LINE_TARGET_TYPES,
} from "@ledger-mx/domain";
import {
  users,
  accounts,
  envelopes,
  categories,
  transactions,
  transactionLines,
} from "./index";

test("user-owned tables have userId field", () => {
  expect(accounts.userId).toBeDefined();
  expect(envelopes.userId).toBeDefined();
  expect(categories.userId).toBeDefined();
  expect(transactions.userId).toBeDefined();
  expect(transactionLines.userId).toBeDefined();
});

test("domain ACCOUNT_TYPES includes all required types", () => {
  expect(ACCOUNT_TYPES).toContain("debit");
  expect(ACCOUNT_TYPES).toContain("credit");
  expect(ACCOUNT_TYPES).toContain("loan");
  expect(ACCOUNT_TYPES).toContain("savings");
  expect(ACCOUNT_TYPES).toContain("cash");
});

test("domain TRANSACTION_LINE_TARGET_TYPES includes all required types", () => {
  expect(TRANSACTION_LINE_TARGET_TYPES).toContain("account");
  expect(TRANSACTION_LINE_TARGET_TYPES).toContain("envelope");
  expect(TRANSACTION_LINE_TARGET_TYPES).toContain("category");
});

test("integer money columns exist on relevant tables", () => {
  expect("targetAmountCents" in envelopes).toBe(true);
  expect("amountCents" in transactionLines).toBe(true);
});

test("deletedAt exists on soft-deletable tables", () => {
  expect("deletedAt" in users).toBe(true);
  expect("deletedAt" in accounts).toBe(true);
  expect("deletedAt" in envelopes).toBe(true);
  expect("deletedAt" in transactionLines).toBe(true);
});

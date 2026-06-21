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
  sessions,
  authAuditLogs,
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

test("users table has passwordHash field", () => {
  expect("passwordHash" in users).toBe(true);
});

test("sessions table has required auth fields", () => {
  expect(sessions.userId).toBeDefined();
  expect("refreshTokenHash" in sessions).toBe(true);
  expect("deviceName" in sessions).toBe(true);
  expect("ipAddress" in sessions).toBe(true);
  expect("userAgent" in sessions).toBe(true);
  expect("lastActiveAt" in sessions).toBe(true);
  expect("expiresAt" in sessions).toBe(true);
  expect("revokedAt" in sessions).toBe(true);
  expect("createdAt" in sessions).toBe(true);
  expect("updatedAt" in sessions).toBe(true);
});

test("authAuditLogs table has required fields", () => {
  expect(authAuditLogs.userId).toBeDefined();
  expect("eventType" in authAuditLogs).toBe(true);
  expect("ipAddress" in authAuditLogs).toBe(true);
  expect("userAgent" in authAuditLogs).toBe(true);
  expect("metadata" in authAuditLogs).toBe(true);
  expect("createdAt" in authAuditLogs).toBe(true);
});

test("sessions and authAuditLogs are user-scoped", () => {
  expect(sessions.userId).toBeDefined();
  expect(authAuditLogs.userId).toBeDefined();
});

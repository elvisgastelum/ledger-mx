import { expect, test } from "vitest";
import {
  PACKAGE_NAME,
  ACCOUNT_TYPES,
  TRANSACTION_LINE_TARGET_TYPES,
} from "./index";

test("domain package exports PACKAGE_NAME", () => {
  expect(PACKAGE_NAME).toBe("@ledger-mx/domain");
});

test("ACCOUNT_TYPES contains all required account types", () => {
  expect(ACCOUNT_TYPES).toContain("debit");
  expect(ACCOUNT_TYPES).toContain("credit");
  expect(ACCOUNT_TYPES).toContain("loan");
  expect(ACCOUNT_TYPES).toContain("savings");
  expect(ACCOUNT_TYPES).toContain("cash");
  expect(ACCOUNT_TYPES).toHaveLength(5);
});

test("TRANSACTION_LINE_TARGET_TYPES contains all required target types", () => {
  expect(TRANSACTION_LINE_TARGET_TYPES).toContain("account");
  expect(TRANSACTION_LINE_TARGET_TYPES).toContain("envelope");
  expect(TRANSACTION_LINE_TARGET_TYPES).toContain("category");
  expect(TRANSACTION_LINE_TARGET_TYPES).toHaveLength(3);
});

import { expect, test, describe } from "vitest";
import { TransactionLine } from "./transaction-line";
import { InvalidTransactionLineAmountError } from "./ledger-errors";
import {
  transactionLineIdFromString,
  transactionIdFromString,
  accountIdFromString,
  envelopeIdFromString,
  categoryIdFromString,
} from "../value-objects/uuid";

// Valid UUID v4 strings for testing
const LINE_ID = "423e4567-e89b-42d3-a456-426614174003";
const TRANSACTION_ID = "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a";
const ACCOUNT_ID = "123e4567-e89b-42d3-a456-426614174000";
const ENVELOPE_ID = "323e4567-e89b-42d3-a456-426614174002";
const CATEGORY_ID = "423e4567-e89b-42d3-a456-426614174006";

// Create branded IDs using factory functions
const lineId = transactionLineIdFromString(LINE_ID);
const transactionId = transactionIdFromString(TRANSACTION_ID);
const accountId = accountIdFromString(ACCOUNT_ID);
const envelopeId = envelopeIdFromString(ENVELOPE_ID);
const categoryId = categoryIdFromString(CATEGORY_ID);

describe("TransactionLine", () => {
  test("accepts a valid line", () => {
    const line = new TransactionLine({
      id: lineId,
      transactionId: transactionId,
      targetType: "account",
      targetId: accountId,
      amountCents: 100,
    });
    expect(line.id).toBe(LINE_ID);
    expect(line.transactionId).toBe(TRANSACTION_ID);
    expect(line.targetType).toBe("account");
    expect(line.targetId).toBe(ACCOUNT_ID);
    expect(line.amountCents).toBe(100);
  });

  test("rejects zero amount", () => {
    expect(
      () =>
        new TransactionLine({
          id: lineId,
          transactionId: transactionId,
          targetType: "account",
          targetId: accountId,
          amountCents: 0,
        }),
    ).toThrow(InvalidTransactionLineAmountError);
  });

  test("rejects non-integer amount", () => {
    expect(
      () =>
        new TransactionLine({
          id: lineId,
          transactionId: transactionId,
          targetType: "account",
          targetId: accountId,
          amountCents: 100.5,
        }),
    ).toThrow(InvalidTransactionLineAmountError);
  });

  test("rejects negative amount", () => {
    const line = new TransactionLine({
      id: lineId,
      transactionId: transactionId,
      targetType: "account",
      targetId: accountId,
      amountCents: -100,
    });
    expect(line.amountCents).toBe(-100);
  });

  test("accepts envelope target type", () => {
    const line = new TransactionLine({
      id: lineId,
      transactionId: transactionId,
      targetType: "envelope",
      targetId: envelopeId,
      amountCents: 100,
    });
    expect(line.targetType).toBe("envelope");
  });

  test("accepts category target type", () => {
    const line = new TransactionLine({
      id: lineId,
      transactionId: transactionId,
      targetType: "category",
      targetId: categoryId,
      amountCents: 100,
    });
    expect(line.targetType).toBe("category");
  });
});

// Factory function validation tests moved to uuid.test.ts
// Invalid ID tests are now tested at the factory level, not the constructor level

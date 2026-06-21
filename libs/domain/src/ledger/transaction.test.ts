import { expect, test, describe } from "vitest";
import { Transaction } from "./transaction";
import { TransactionLine } from "./transaction-line";
import type { TransactionLineProps } from "./transaction-line";
import { TransactionType } from "../index";
import {
  InvalidTransactionLineCountError,
  UnbalancedTransactionError,
  InvalidTransactionLineAmountError,
} from "./ledger-errors";
import {
  transactionIdFromString,
  userIdFromString,
  transactionLineIdFromString,
  accountIdFromString,
  envelopeIdFromString,
} from "../value-objects/uuid";

// Valid UUID v4 strings for testing
const TRANSACTION_ID = "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a";
const USER_ID = "8a3b2c1d-5678-4f9e-8a1b-2c3d4e5f6a7b";
const ACCOUNT_ID_1 = "123e4567-e89b-42d3-a456-426614174000";
const ACCOUNT_ID_2 = "223e4567-e89b-42d3-a456-426614174001";
const ENVELOPE_ID = "323e4567-e89b-42d3-a456-426614174002";
const LINE_ID_1 = "423e4567-e89b-42d3-a456-426614174003";
const LINE_ID_2 = "523e4567-e89b-42d3-a456-426614174004";
const LINE_ID_3 = "623e4567-e89b-42d3-a456-426614174005";

// Create branded IDs using factory functions
const transactionId = transactionIdFromString(TRANSACTION_ID);
const userId = userIdFromString(USER_ID);
const accountId1 = accountIdFromString(ACCOUNT_ID_1);
const accountId2 = accountIdFromString(ACCOUNT_ID_2);
const envelopeId = envelopeIdFromString(ENVELOPE_ID);
const lineId1 = transactionLineIdFromString(LINE_ID_1);
const lineId2 = transactionLineIdFromString(LINE_ID_2);
const lineId3 = transactionLineIdFromString(LINE_ID_3);

describe("Transaction", () => {
  const createValidLine = (props: Partial<TransactionLineProps> = {}) => {
    return new TransactionLine({
      id: props.id ?? lineId1,
      transactionId: props.transactionId ?? transactionId,
      targetType: props.targetType ?? "account",
      targetId: props.targetId ?? accountId1,
      amountCents: props.amountCents ?? 100,
    });
  };

  test("rejects fewer than 2 lines", () => {
    const singleLine = createValidLine();
    expect(
      () =>
        new Transaction({
          id: transactionId,
          userId: userId,
          type: "income" as TransactionType,
          occurredAt: new Date(),
          lines: [singleLine],
        }),
    ).toThrow(InvalidTransactionLineCountError);
  });

  test("rejects unbalanced lines (sum ≠ 0)", () => {
    const line1 = createValidLine({ amountCents: 100 });
    const line2 = createValidLine({ id: lineId2, amountCents: 200 }); // Sum 300
    expect(
      () =>
        new Transaction({
          id: transactionId,
          userId: userId,
          type: "income" as TransactionType,
          occurredAt: new Date(),
          lines: [line1, line2],
        }),
    ).toThrow(UnbalancedTransactionError);
  });

  test("rejects zero line amount (enforced in TransactionLine)", () => {
    expect(() => createValidLine({ amountCents: 0 })).toThrow(
      InvalidTransactionLineAmountError,
    );
  });

  test("accepts balanced two-line transaction", () => {
    const line1 = createValidLine({ amountCents: 100 });
    const line2 = createValidLine({ id: lineId2, amountCents: -100 });
    const transaction = new Transaction({
      id: transactionId,
      userId: userId,
      type: "income" as TransactionType,
      occurredAt: new Date(),
      lines: [line1, line2],
    });
    expect(transaction.lines).toHaveLength(2);
    expect(transaction.type).toBe("income");
  });

  test("accepts balanced multi-line transaction (3+ lines)", () => {
    const line1 = createValidLine({ amountCents: 100 });
    const line2 = createValidLine({ id: lineId2, amountCents: 200 });
    const line3 = createValidLine({
      id: lineId3,
      amountCents: -300,
      targetType: "envelope",
      targetId: envelopeId,
    });
    const transaction = new Transaction({
      id: transactionId,
      userId: userId,
      type: "transfer" as TransactionType,
      occurredAt: new Date(),
      lines: [line1, line2, line3],
    });
    expect(transaction.lines).toHaveLength(3);
  });

  test("accepts debt_payment transaction and exposes type", () => {
    const line1 = createValidLine({ amountCents: 500, targetType: "account" });
    const line2 = createValidLine({
      id: lineId2,
      amountCents: -500,
      targetType: "account",
      targetId: accountId2,
    });
    const transaction = new Transaction({
      id: transactionId,
      userId: userId,
      type: "debt_payment" as TransactionType,
      occurredAt: new Date(),
      lines: [line1, line2],
    });
    expect(transaction.type).toBe("debt_payment");
  });

  describe("transaction type examples", () => {
    test("expense: $100 groceries (account -10000, category +10000)", () => {
      const expenseLine = createValidLine({
        amountCents: -10000,
        targetType: "account",
        targetId: accountId1,
      });
      const categoryLine = createValidLine({
        id: lineId2,
        amountCents: 10000,
        targetType: "category",
      });
      const transaction = new Transaction({
        id: transactionId,
        userId: userId,
        type: "expense" as TransactionType,
        occurredAt: new Date(),
        lines: [expenseLine, categoryLine],
      });
      expect(transaction.type).toBe("expense");
      expect(transaction.lines).toHaveLength(2);
      // Sum must be zero
      const sum = transaction.lines.reduce((s, l) => s + l.amountCents, 0);
      expect(sum).toBe(0);
    });

    test("income: $5000 paycheck (account +500000, source -500000)", () => {
      const accountLine = createValidLine({
        amountCents: 500000,
        targetType: "account",
        targetId: accountId1,
      });
      const sourceLine = createValidLine({
        id: lineId2,
        amountCents: -500000,
        targetType: "account",
        targetId: accountId2,
      });
      const transaction = new Transaction({
        id: transactionId,
        userId: userId,
        type: "income" as TransactionType,
        occurredAt: new Date(),
        lines: [accountLine, sourceLine],
      });
      expect(transaction.type).toBe("income");
      const sum = transaction.lines.reduce((s, l) => s + l.amountCents, 0);
      expect(sum).toBe(0);
    });

    test("transfer: $200 BBVA → Cash (bbva -20000, cash +20000)", () => {
      const fromLine = createValidLine({
        amountCents: -20000,
        targetType: "account",
        targetId: accountId1,
      });
      const toLine = createValidLine({
        id: lineId2,
        amountCents: 20000,
        targetType: "account",
        targetId: accountId2,
      });
      const transaction = new Transaction({
        id: transactionId,
        userId: userId,
        type: "transfer" as TransactionType,
        occurredAt: new Date(),
        lines: [fromLine, toLine],
      });
      expect(transaction.type).toBe("transfer");
      const sum = transaction.lines.reduce((s, l) => s + l.amountCents, 0);
      expect(sum).toBe(0);
    });

    test("debt_payment: $300 BBVA → Credit Card (account -30000, debt +30000)", () => {
      const accountLine = createValidLine({
        amountCents: -30000,
        targetType: "account",
        targetId: accountId1,
      });
      const debtLine = createValidLine({
        id: lineId2,
        amountCents: 30000,
        targetType: "account",
        targetId: accountId2,
      });
      const transaction = new Transaction({
        id: transactionId,
        userId: userId,
        type: "debt_payment" as TransactionType,
        occurredAt: new Date(),
        lines: [accountLine, debtLine],
      });
      expect(transaction.type).toBe("debt_payment");
      const sum = transaction.lines.reduce((s, l) => s + l.amountCents, 0);
      expect(sum).toBe(0);
    });
  });

  test("rejects lines with mismatched transactionId", () => {
    const mismatchedTransactionId = transactionIdFromString(
      "f7a6b5c4-d3e2-49fa-8b7c-6d5e4f3a2b1c",
    );
    const line = createValidLine({
      transactionId: mismatchedTransactionId,
    });
    expect(
      () =>
        new Transaction({
          id: transactionId,
          userId: userId,
          type: "income" as TransactionType,
          occurredAt: new Date(),
          lines: [
            line,
            createValidLine({ id: lineId2, amountCents: -line.amountCents }),
          ],
        }),
    ).toThrow(/must belong to the same transaction/);
  });
});

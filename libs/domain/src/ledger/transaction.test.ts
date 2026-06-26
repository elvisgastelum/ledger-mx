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
  categoryIdFromString,
} from "../value-objects/uuid";
import { TransactionBuilder, TransactionLineBuilder } from "./builders";

// Valid UUID v4 strings for testing
const TRANSACTION_ID = "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a";
const USER_ID = "8a3b2c1d-5678-4f9e-8a1b-2c3d4e5f6a7b";
const ACCOUNT_ID_1 = "123e4567-e89b-42d3-a456-426614174000";
const ACCOUNT_ID_2 = "223e4567-e89b-42d3-a456-426614174001";
const ENVELOPE_ID = "323e4567-e89b-42d3-a456-426614174002";
const CATEGORY_ID = "423e4567-e89b-42d3-a456-426614174006";
const LINE_ID_1 = "523e4567-e89b-42d3-a456-426614174003";
const LINE_ID_2 = "623e4567-e89b-42d3-a456-426614174004";
const LINE_ID_3 = "723e4567-e89b-42d3-a456-426614174005";

// Create branded IDs using factory functions
const transactionId = transactionIdFromString(TRANSACTION_ID);
const userId = userIdFromString(USER_ID);
const accountId1 = accountIdFromString(ACCOUNT_ID_1);
const accountId2 = accountIdFromString(ACCOUNT_ID_2);
const envelopeId = envelopeIdFromString(ENVELOPE_ID);
const categoryId = categoryIdFromString(CATEGORY_ID);
const lineId1 = transactionLineIdFromString(LINE_ID_1);
const lineId2 = transactionLineIdFromString(LINE_ID_2);
const lineId3 = transactionLineIdFromString(LINE_ID_3);

describe("Transaction", () => {
  const createValidLine = (props: Partial<TransactionLineProps> = {}) => {
    return new TransactionLineBuilder()
      .withId(props.id ?? lineId1)
      .withTransactionId(props.transactionId ?? transactionId)
      .withTarget(props.targetType ?? "account", props.targetId ?? accountId1)
      .withAmountCents(props.amountCents ?? 100)
      .build();
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
    const transaction = new TransactionBuilder()
      .withId(transactionId)
      .withUserId(userId)
      .withType("income")
      .withOccurredAt(new Date())
      .withTransactionLine((line) =>
        line.withId(lineId1).withAmountCents(100).withAccountTarget(accountId1),
      )
      .withTransactionLine((line) =>
        line.withId(lineId2).withAmountCents(-100).withAccountTarget(accountId2),
      )
      .build();
    expect(transaction.lines).toHaveLength(2);
    expect(transaction.type).toBe("income");
  });

  test("accepts balanced multi-line transaction (3+ lines)", () => {
    const transaction = new TransactionBuilder()
      .withId(transactionId)
      .withUserId(userId)
      .withType("transfer")
      .withOccurredAt(new Date())
      .withTransactionLine((line) =>
        line.withId(lineId1).withAmountCents(100).withAccountTarget(accountId1),
      )
      .withTransactionLine((line) =>
        line.withId(lineId2).withAmountCents(200).withAccountTarget(accountId2),
      )
      .withTransactionLine((line) =>
        line
          .withId(lineId3)
          .withEnvelopeTarget(envelopeId)
          .withAmountCents(-300),
      )
      .build();
    expect(transaction.lines).toHaveLength(3);
  });

  test("accepts debt_payment transaction and exposes type", () => {
    const transaction = new TransactionBuilder()
      .withId(transactionId)
      .withUserId(userId)
      .withType("debt_payment")
      .withOccurredAt(new Date())
      .withTransactionLine((line) =>
        line.withId(lineId1).withAmountCents(500).withAccountTarget(accountId1),
      )
      .withTransactionLine((line) =>
        line
          .withId(lineId2)
          .withAmountCents(-500)
          .withAccountTarget(accountId2),
      )
      .build();
    expect(transaction.type).toBe("debt_payment");
  });

  describe("transaction type examples", () => {
    test("expense: $100 groceries (account -10000, category +10000)", () => {
      const categoryId = categoryIdFromString(CATEGORY_ID);
      const transaction = new TransactionBuilder()
        .withId(transactionId)
        .withUserId(userId)
        .withType("expense")
        .withOccurredAt(new Date())
        .withTransactionLine((line) =>
          line
            .withId(lineId1)
            .withAmountCents(-10000)
            .withAccountTarget(accountId1),
        )
        .withTransactionLine((line) =>
          line
            .withId(lineId2)
            .withAmountCents(10000)
            .withCategoryTarget(categoryId),
        )
        .build();
      expect(transaction.type).toBe("expense");
      expect(transaction.lines).toHaveLength(2);
      // Sum must be zero
      const sum = transaction.lines.reduce((s, l) => s + l.amountCents, 0);
      expect(sum).toBe(0);
    });

    test("income: $5000 paycheck (account +500000, source -500000)", () => {
      const transaction = new TransactionBuilder()
        .withId(transactionId)
        .withUserId(userId)
        .withType("income")
        .withOccurredAt(new Date())
        .withTransactionLine((line) =>
          line
            .withId(lineId1)
            .withAmountCents(500000)
            .withAccountTarget(accountId1),
        )
        .withTransactionLine((line) =>
          line
            .withId(lineId2)
            .withAmountCents(-500000)
            .withAccountTarget(accountId2),
        )
        .build();
      expect(transaction.type).toBe("income");
      const sum = transaction.lines.reduce((s, l) => s + l.amountCents, 0);
      expect(sum).toBe(0);
    });

    test("transfer: $200 BBVA → Cash (bbva -20000, cash +20000)", () => {
      const transaction = new TransactionBuilder()
        .withId(transactionId)
        .withUserId(userId)
        .withType("transfer")
        .withOccurredAt(new Date())
        .withTransactionLine((line) =>
          line
            .withId(lineId1)
            .withAmountCents(-20000)
            .withAccountTarget(accountId1),
        )
        .withTransactionLine((line) =>
          line
            .withId(lineId2)
            .withAmountCents(20000)
            .withAccountTarget(accountId2),
        )
        .build();
      expect(transaction.type).toBe("transfer");
      const sum = transaction.lines.reduce((s, l) => s + l.amountCents, 0);
      expect(sum).toBe(0);
    });

    test("debt_payment: $300 BBVA → Credit Card (account -30000, debt +30000)", () => {
      const transaction = new TransactionBuilder()
        .withId(transactionId)
        .withUserId(userId)
        .withType("debt_payment")
        .withOccurredAt(new Date())
        .withTransactionLine((line) =>
          line
            .withId(lineId1)
            .withAmountCents(-30000)
            .withAccountTarget(accountId1),
        )
        .withTransactionLine((line) =>
          line
            .withId(lineId2)
            .withAmountCents(30000)
            .withAccountTarget(accountId2),
        )
        .build();
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

describe("Transaction.createReversal", () => {
  const originalTransactionId = transactionIdFromString(
    "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a",
  );
  const reversalTransactionId = transactionIdFromString(
    "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  );
  const reversalLineId1 = transactionLineIdFromString(
    "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
  );
  const reversalLineId2 = transactionLineIdFromString(
    "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
  );

  test("creates reversal with negated lines and reversalOfTransactionId", () => {
    const originalLine1 = new TransactionLine({
      id: lineId1,
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId1,
      amountCents: 10000,
    });
    const originalLine2 = new TransactionLine({
      id: lineId2,
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId2,
      amountCents: -10000,
    });

    const originalTransaction = new Transaction({
      id: originalTransactionId,
      userId: userId,
      type: "income" as TransactionType,
      occurredAt: new Date("2024-01-15"),
      lines: [originalLine1, originalLine2],
    });

    const reversal = originalTransaction.createReversal({
      reversalTransactionId,
      reversalLineIds: [reversalLineId1, reversalLineId2],
    });

    expect(reversal.type).toBe("reversal");
    expect(reversal.reversalOfTransactionId).toBe(originalTransactionId);
    expect(reversal.lines).toHaveLength(2);
    expect(reversal.lines[0].amountCents).toBe(-10000); // Negated
    expect(reversal.lines[1].amountCents).toBe(10000); // Negated
    expect(reversal.lines[0].targetId).toBe(accountId1);
    expect(reversal.lines[1].targetId).toBe(accountId2);
  });

  test("reversal maintains double-entry invariant (sums to zero)", () => {
    const originalLine1 = new TransactionLine({
      id: lineId1,
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId1,
      amountCents: 50000,
    });
    const originalLine2 = new TransactionLine({
      id: lineId2,
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId2,
      amountCents: -50000,
    });

    const originalTransaction = new Transaction({
      id: originalTransactionId,
      userId: userId,
      type: "expense" as TransactionType,
      occurredAt: new Date(),
      lines: [originalLine1, originalLine2],
    });

    const reversal = originalTransaction.createReversal({
      reversalTransactionId,
      reversalLineIds: [reversalLineId1, reversalLineId2],
    });

    const sum = reversal.lines.reduce((s, l) => s + l.amountCents, 0);
    expect(sum).toBe(0); // Reversal is also balanced
  });

  test("original + reversal nets to zero by target", () => {
    const originalLine1 = new TransactionLine({
      id: lineId1,
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId1,
      amountCents: 10000,
    });
    const originalLine2 = new TransactionLine({
      id: lineId2,
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId2,
      amountCents: -10000,
    });

    const originalTransaction = new Transaction({
      id: originalTransactionId,
      userId: userId,
      type: "income" as TransactionType,
      occurredAt: new Date(),
      lines: [originalLine1, originalLine2],
    });

    const reversal = originalTransaction.createReversal({
      reversalTransactionId,
      reversalLineIds: [reversalLineId1, reversalLineId2],
    });

    // Net effect should be zero for each target
    const netByTarget = new Map<string, number>();

    for (const line of originalTransaction.lines) {
      const target = line.targetId as string;
      netByTarget.set(
        target,
        (netByTarget.get(target) || 0) + line.amountCents,
      );
    }
    for (const line of reversal.lines) {
      const target = line.targetId as string;
      netByTarget.set(
        target,
        (netByTarget.get(target) || 0) + line.amountCents,
      );
    }

    // All targets should net to zero
    for (const amount of netByTarget.values()) {
      expect(amount).toBe(0);
    }
  });

  test("throws if reversal line count does not match original", () => {
    const originalLine1 = new TransactionLine({
      id: lineId1,
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId1,
      amountCents: 10000,
    });
    const originalLine2 = new TransactionLine({
      id: lineId2,
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId2,
      amountCents: -10000,
    });

    const originalTransaction = new Transaction({
      id: originalTransactionId,
      userId: userId,
      type: "income" as TransactionType,
      occurredAt: new Date(),
      lines: [originalLine1, originalLine2],
    });

    expect(() =>
      originalTransaction.createReversal({
        reversalTransactionId,
        reversalLineIds: [reversalLineId1], // Only 1 line, should be 2
      }),
    ).toThrow(InvalidTransactionLineCountError);
  });

  test("uses custom description if provided", () => {
    const originalLine1 = new TransactionLine({
      id: lineId1,
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId1,
      amountCents: 10000,
    });
    const originalLine2 = new TransactionLine({
      id: lineId2,
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId2,
      amountCents: -10000,
    });

    const originalTransaction = new Transaction({
      id: originalTransactionId,
      userId: userId,
      type: "income" as TransactionType,
      occurredAt: new Date(),
      lines: [originalLine1, originalLine2],
    });

    const customDescription = "Custom reversal description";
    const reversal = originalTransaction.createReversal({
      reversalTransactionId,
      reversalLineIds: [reversalLineId1, reversalLineId2],
      description: customDescription,
    });

    expect(reversal.description).toBe(customDescription);
  });

  test("uses default description if not provided", () => {
    const originalLine1 = new TransactionLine({
      id: lineId1,
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId1,
      amountCents: 10000,
    });
    const originalLine2 = new TransactionLine({
      id: lineId2,
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId2,
      amountCents: -10000,
    });

    const originalTransaction = new Transaction({
      id: originalTransactionId,
      userId: userId,
      type: "income" as TransactionType,
      occurredAt: new Date(),
      lines: [originalLine1, originalLine2],
    });

    const reversal = originalTransaction.createReversal({
      reversalTransactionId,
      reversalLineIds: [reversalLineId1, reversalLineId2],
    });

    expect(reversal.description).toBe(
      `Reversal of transaction ${originalTransactionId}`,
    );
  });
});

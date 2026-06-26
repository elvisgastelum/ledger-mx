import { expect, test, describe } from "vitest";
import { TransactionBuilder } from "./transaction-builder";
import { TransactionLineBuilder } from "./transaction-line-builder";
import {
  transactionIdFromString,
  userIdFromString,
  transactionLineIdFromString,
  accountIdFromString,
} from "../../value-objects/uuid";

// Valid UUID v4 strings for testing
const TRANSACTION_ID = "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a";
const USER_ID = "8a3b2c1d-5678-4f9e-8a1b-2c3d4e5f6a7b";
const ACCOUNT_ID_1 = "123e4567-e89b-42d3-a456-426614174000";
const ACCOUNT_ID_2 = "223e4567-e89b-42d3-a456-426614174001";
const LINE_ID_1 = "523e4567-e89b-42d3-a456-426614174003";
const LINE_ID_2 = "623e4567-e89b-42d3-a456-426614174004";

const transactionId = transactionIdFromString(TRANSACTION_ID);
const userId = userIdFromString(USER_ID);
const accountId1 = accountIdFromString(ACCOUNT_ID_1);
const accountId2 = accountIdFromString(ACCOUNT_ID_2);
const lineId1 = transactionLineIdFromString(LINE_ID_1);
const lineId2 = transactionLineIdFromString(LINE_ID_2);

describe("TransactionBuilder", () => {
  test("builds a valid balanced transaction using callback for lines", () => {
    const transaction = new TransactionBuilder()
      .withId(transactionId)
      .withUserId(userId)
      .withType("income")
      .withOccurredAt(new Date("2024-01-15"))
      .withTransactionLine((line) =>
        line.withId(lineId1).withAmountCents(100).withAccountTarget(accountId1),
      )
      .withTransactionLine((line) =>
        line.withId(lineId2).withAmountCents(-100).withAccountTarget(accountId2),
      )
      .build();

    expect(transaction.id).toBe(TRANSACTION_ID);
    expect(transaction.userId).toBe(USER_ID);
    expect(transaction.type).toBe("income");
    expect(transaction.lines).toHaveLength(2);
    expect(transaction.lines[0].amountCents).toBe(100);
    expect(transaction.lines[1].amountCents).toBe(-100);
  });

  test("callback line builder automatically receives transactionId", () => {
    const transaction = new TransactionBuilder()
      .withId(transactionId)
      .withUserId(userId)
      .withType("expense")
      .withOccurredAt(new Date("2024-01-15"))
      .withTransactionLine((line) => {
        // The line builder should already have transactionId set
        const builtLine = line.withId(lineId1).withAmountCents(-100).withAccountTarget(accountId1).build();
        expect(builtLine.transactionId).toBe(TRANSACTION_ID);
        return line;
      })
      .withTransactionLine((line) =>
        line.withId(lineId2).withAmountCents(100).withAccountTarget(accountId2),
      )
      .build();

    expect(transaction.lines[0].transactionId).toBe(TRANSACTION_ID);
    expect(transaction.lines[1].transactionId).toBe(TRANSACTION_ID);
  });

  test("throws clear error if withTransactionLine(callback) used before withId", () => {
    const builder = new TransactionBuilder()
      .withUserId(userId)
      .withType("income")
      .withOccurredAt(new Date("2024-01-15"));

    expect(() =>
      builder.withTransactionLine((line) =>
        line.withId(lineId1).withAmountCents(100).withAccountTarget(accountId1),
      ),
    ).toThrow(
      "TransactionBuilder: Cannot use callback overload of withTransactionLine() because transaction ID is not set.",
    );
  });

  test("can add pre-built lines without calling withId first (using withTransactionLine with line object)", () => {
    const line1 = new TransactionLineBuilder()
      .withId(lineId1)
      .withTransactionId(transactionId)
      .withAccountTarget(accountId1)
      .withAmountCents(100)
      .build();

    const line2 = new TransactionLineBuilder()
      .withId(lineId2)
      .withTransactionId(transactionId)
      .withAccountTarget(accountId2)
      .withAmountCents(-100)
      .build();

    const transaction = new TransactionBuilder()
      .withId(transactionId)
      .withUserId(userId)
      .withType("income")
      .withOccurredAt(new Date("2024-01-15"))
      .withTransactionLine(line1)
      .withTransactionLine(line2)
      .build();

    expect(transaction.lines).toHaveLength(2);
  });

  test("throws if id is missing when building", () => {
    // Use pre-built lines (not callbacks) to test build-time validation
    // Callback overload throws immediately if id is not set (tested separately)
    const line1 = new TransactionLineBuilder()
      .withId(lineId1)
      .withTransactionId(transactionId) // arbitrary, won't be used since build will fail
      .withAccountTarget(accountId1)
      .withAmountCents(100)
      .build();

    const line2 = new TransactionLineBuilder()
      .withId(lineId2)
      .withTransactionId(transactionId)
      .withAccountTarget(accountId2)
      .withAmountCents(-100)
      .build();

    const builder = new TransactionBuilder()
      .withUserId(userId)
      .withType("income")
      .withOccurredAt(new Date("2024-01-15"))
      .withTransactionLine(line1)
      .withTransactionLine(line2);

    expect(() => builder.build()).toThrow("TransactionBuilder: id is required");
  });

  test("throws if userId is missing when building", () => {
    const builder = new TransactionBuilder()
      .withId(transactionId)
      .withType("income")
      .withOccurredAt(new Date("2024-01-15"))
      .withTransactionLine((line) =>
        line.withId(lineId1).withAmountCents(100).withAccountTarget(accountId1),
      )
      .withTransactionLine((line) =>
        line.withId(lineId2).withAmountCents(-100).withAccountTarget(accountId2),
      );

    expect(() => builder.build()).toThrow("TransactionBuilder: userId is required");
  });

  test("throws if fewer than 2 lines", () => {
    const builder = new TransactionBuilder()
      .withId(transactionId)
      .withUserId(userId)
      .withType("income")
      .withOccurredAt(new Date("2024-01-15"))
      .withTransactionLine((line) =>
        line.withId(lineId1).withAmountCents(100).withAccountTarget(accountId1),
      );

    expect(() => builder.build()).toThrow("TransactionBuilder: at least 2 lines are required");
  });
});

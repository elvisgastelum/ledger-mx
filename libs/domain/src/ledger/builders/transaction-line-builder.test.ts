import { expect, test, describe } from "vitest";
import { TransactionLineBuilder } from "./transaction-line-builder";
import {
  transactionLineIdFromString,
  transactionIdFromString,
  accountIdFromString,
} from "../../value-objects/uuid";
import { InvalidTransactionLineAmountError } from "../ledger-errors";

// Valid UUID v4 strings for testing
const LINE_ID = "423e4567-e89b-42d3-a456-426614174003";
const TRANSACTION_ID = "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a";
const ACCOUNT_ID = "123e4567-e89b-42d3-a456-426614174000";

const lineId = transactionLineIdFromString(LINE_ID);
const transactionId = transactionIdFromString(TRANSACTION_ID);
const accountId = accountIdFromString(ACCOUNT_ID);

describe("TransactionLineBuilder", () => {
  test("builds a valid line with all required fields", () => {
    const line = new TransactionLineBuilder()
      .withId(lineId)
      .withTransactionId(transactionId)
      .withAccountTarget(accountId)
      .withAmountCents(100)
      .build();

    expect(line.id).toBe(LINE_ID);
    expect(line.transactionId).toBe(TRANSACTION_ID);
    expect(line.targetType).toBe("account");
    expect(line.targetId).toBe(ACCOUNT_ID);
    expect(line.amountCents).toBe(100);
  });

  test("throws if id is missing", () => {
    const builder = new TransactionLineBuilder()
      .withTransactionId(transactionId)
      .withAccountTarget(accountId)
      .withAmountCents(100);

    expect(() => builder.build()).toThrow("TransactionLineBuilder: id is required");
  });

  test("throws if transactionId is missing", () => {
    const builder = new TransactionLineBuilder()
      .withId(lineId)
      .withAccountTarget(accountId)
      .withAmountCents(100);

    expect(() => builder.build()).toThrow("TransactionLineBuilder: transactionId is required");
  });

  test("throws if target is missing", () => {
    const builder = new TransactionLineBuilder()
      .withId(lineId)
      .withTransactionId(transactionId)
      .withAmountCents(100);

    expect(() => builder.build()).toThrow("TransactionLineBuilder: targetType is required");
  });

  test("throws if amountCents is missing", () => {
    const builder = new TransactionLineBuilder()
      .withId(lineId)
      .withTransactionId(transactionId)
      .withAccountTarget(accountId);

    expect(() => builder.build()).toThrow("TransactionLineBuilder: amountCents is required");
  });

  test("throws if amountCents is zero", () => {
    const builder = new TransactionLineBuilder()
      .withId(lineId)
      .withTransactionId(transactionId)
      .withAccountTarget(accountId)
      .withAmountCents(0);

    expect(() => builder.build()).toThrow(InvalidTransactionLineAmountError);
  });

  test("accepts negative amountCents", () => {
    const line = new TransactionLineBuilder()
      .withId(lineId)
      .withTransactionId(transactionId)
      .withAccountTarget(accountId)
      .withAmountCents(-100)
      .build();

    expect(line.amountCents).toBe(-100);
  });
});

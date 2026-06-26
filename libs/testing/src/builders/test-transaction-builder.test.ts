import { expect, test, describe } from "vitest";
import { TestTransactionBuilder } from "./test-transaction-builder";
import { TestTransactionLineBuilder } from "./test-transaction-line-builder";
import { testTransactionId, testAccountId, testCategoryId } from "./test-ids";

describe("TestTransactionBuilder", () => {
  test("builds a valid transaction with safe defaults", () => {
    const transaction = new TestTransactionBuilder()
      .withDefaultExpense(10000)
      .build();

    expect(transaction.id).toBeDefined();
    expect(transaction.userId).toBeDefined();
    expect(transaction.type).toBe("expense");
    expect(transaction.lines).toHaveLength(2);
  });

  test("default test transaction builds balanced two-line transaction", () => {
    const transaction = new TestTransactionBuilder().withDefaultExpense(10000).build();

    expect(transaction.lines).toHaveLength(2);
    const sum = transaction.lines.reduce((s, l) => s + l.amountCents, 0);
    expect(sum).toBe(0);
  });

  test("withDefaultExpense creates account and category lines", () => {
    const transaction = new TestTransactionBuilder().withDefaultExpense(5000).build();

    const accountLines = transaction.lines.filter((l) => l.targetType === "account");
    const categoryLines = transaction.lines.filter((l) => l.targetType === "category");

    expect(accountLines).toHaveLength(1);
    expect(categoryLines).toHaveLength(1);
    expect(accountLines[0].amountCents).toBe(-5000);
    expect(categoryLines[0].amountCents).toBe(5000);
  });

  test("withTransactionLineBuilder uses parent transaction id", () => {
    const transactionId = testTransactionId();
    let capturedLineTransactionId: string | undefined;

    const transaction = new TestTransactionBuilder()
      .withId(transactionId)
      .withTransactionLineBuilder((builder) => {
        const line = builder
          .withAccountTarget(testAccountId())
          .withAmountCents(-5000)
          .build();
        capturedLineTransactionId = line.transactionId as string;
        return builder;
      })
      .withTransactionLineBuilder((builder) =>
        builder
          .withCategoryTarget(testCategoryId())
          .withAmountCents(5000),
      )
      .build();

    expect(capturedLineTransactionId).toBe(transactionId as string);
    expect(transaction.lines[0].transactionId).toBe(transactionId);
    expect(transaction.lines[1].transactionId).toBe(transactionId);
  });

  test("withTransactionLineBuilder can be used multiple times", () => {
    const transaction = new TestTransactionBuilder()
      .withTransactionLineBuilder((builder) =>
        builder.withAccountTarget(testAccountId()).withAmountCents(-10000),
      )
      .withTransactionLineBuilder((builder) =>
        builder.withCategoryTarget(testCategoryId()).withAmountCents(10000),
      )
      .build();

    expect(transaction.lines).toHaveLength(2);
    const sum = transaction.lines.reduce((s, l) => s + l.amountCents, 0);
    expect(sum).toBe(0);
  });
});

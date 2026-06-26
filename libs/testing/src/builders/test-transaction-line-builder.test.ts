import { expect, test, describe } from "vitest";
import { TestTransactionLineBuilder } from "./test-transaction-line-builder";
import { testTransactionLineId, testTransactionId, testAccountId, testCategoryId, testEnvelopeId } from "./test-ids";

describe("TestTransactionLineBuilder", () => {
  test("sets id by default in constructor", () => {
    const builder = new TestTransactionLineBuilder();
    const line = builder
      .withTransactionId(testTransactionId())
      .withAccountTarget(testAccountId())
      .withAmountCents(100)
      .build();

    expect(line.id).toBeDefined();
    expect(line.id).toBe(testTransactionLineId() as string);
  });

  test("requires transactionId to be set explicitly", () => {
    const builder = new TestTransactionLineBuilder()
      .withId(testTransactionLineId())
      .withAccountTarget(testAccountId())
      .withAmountCents(100);

    expect(() => builder.build()).toThrow("TransactionLineBuilder: transactionId is required");
  });

  test("requires target to be set explicitly", () => {
    const builder = new TestTransactionLineBuilder()
      .withId(testTransactionLineId())
      .withTransactionId(testTransactionId())
      .withAmountCents(100);

    expect(() => builder.build()).toThrow("TransactionLineBuilder: targetType is required");
  });

  test("requires amountCents to be set explicitly", () => {
    const builder = new TestTransactionLineBuilder()
      .withId(testTransactionLineId())
      .withTransactionId(testTransactionId())
      .withAccountTarget(testAccountId());

    expect(() => builder.build()).toThrow("TransactionLineBuilder: amountCents is required");
  });

  test("builds valid line when all required fields are set", () => {
    const lineId = testTransactionLineId();
    const transactionId = testTransactionId();
    const accountId = testAccountId();

    const line = new TestTransactionLineBuilder()
      .withId(lineId)
      .withTransactionId(transactionId)
      .withAccountTarget(accountId)
      .withAmountCents(100)
      .build();

    expect(line.id).toBe(lineId as string);
    expect(line.transactionId).toBe(transactionId as string);
    expect(line.targetType).toBe("account");
    expect(line.targetId).toBe(accountId as string);
    expect(line.amountCents).toBe(100);
  });

  test("supports withAmountCents for negative amounts", () => {
    const line = new TestTransactionLineBuilder()
      .withId(testTransactionLineId())
      .withTransactionId(testTransactionId())
      .withAccountTarget(testAccountId())
      .withAmountCents(-5000)
      .build();

    expect(line.amountCents).toBe(-5000);
  });

  test("supports withCategoryTarget and withEnvelopeTarget", () => {
    const line1 = new TestTransactionLineBuilder()
      .withId(testTransactionLineId())
      .withTransactionId(testTransactionId())
      .withCategoryTarget(testCategoryId())
      .withAmountCents(100)
      .build();

    expect(line1.targetType).toBe("category");

    const line2 = new TestTransactionLineBuilder()
      .withId(testTransactionLineId())
      .withTransactionId(testTransactionId())
      .withEnvelopeTarget(testEnvelopeId())
      .withAmountCents(200)
      .build();

    expect(line2.targetType).toBe("envelope");
  });
});

import {
  TransactionBuilder as DomainTransactionBuilder,
  Transaction,
  TransactionType,
  UserId,
  TransactionId,
} from "@ledger-mx/domain";
import {
  testUserId,
  testTransactionId,
  testAccountId,
  testCategoryId,
} from "./test-ids";
import { TestTransactionLineBuilder } from "./test-transaction-line-builder";

/**
 * Test-only TransactionBuilder with safe defaults.
 * Creates a valid balanced transaction with two lines (account and category) summing to zero.
 */
export class TestTransactionBuilder {
  private builder = new DomainTransactionBuilder();
  private currentTransactionId: TransactionId;

  constructor() {
    // Set sensible defaults
    this.currentTransactionId = testTransactionId();
    this.builder
      .withId(this.currentTransactionId)
      .withUserId(testUserId())
      .withType("expense")
      .withOccurredAt(new Date("2024-01-15T00:00:00.000Z"));
  }

  withId(id: TransactionId): this {
    this.currentTransactionId = id;
    this.builder.withId(id);
    return this;
  }

  withUserId(userId: UserId): this {
    this.builder.withUserId(userId);
    return this;
  }

  withType(type: TransactionType): this {
    this.builder.withType(type);
    return this;
  }

  withOccurredAt(occurredAt: Date): this {
    this.builder.withOccurredAt(occurredAt);
    return this;
  }

  withDescription(description: string): this {
    this.builder.withDescription(description);
    return this;
  }

  withTransactionLine(line: Parameters<DomainTransactionBuilder["withTransactionLine"]>[0]): this {
    this.builder.withTransactionLine(line);
    return this;
  }

  /**
   * Adds a transaction line using a callback that receives a pre-configured TestTransactionLineBuilder.
   * The transaction ID is automatically set on the line builder before the callback is invoked.
   */
  withTransactionLineBuilder(
    callback: (builder: TestTransactionLineBuilder) => TestTransactionLineBuilder,
  ): this {
    const lineBuilder = new TestTransactionLineBuilder();
    // Automatically set the parent transaction ID on the line builder
    lineBuilder.withTransactionId(this.currentTransactionId);
    const configuredBuilder = callback(lineBuilder);
    const line = configuredBuilder.build();
    this.builder.withTransactionLine(line);
    return this;
  }

  /**
   * Applies sensible defaults for a balanced expense transaction.
   * Creates two lines: account (-amount) and category (+amount).
   */
  withDefaultExpense(amountCents: number = 10000): this {
    const transactionId = testTransactionId();
    this.currentTransactionId = transactionId;
    this.builder
      .withId(transactionId)
      .withType("expense")
      .withTransactionLine(
        new TestTransactionLineBuilder()
          .withTransactionId(transactionId)
          .withAccountTarget(testAccountId())
          .withAmountCents(-amountCents)
          .build(),
      )
      .withTransactionLine(
        new TestTransactionLineBuilder()
          .withTransactionId(transactionId)
          .withCategoryTarget(testCategoryId())
          .withAmountCents(amountCents)
          .build(),
      );
    return this;
  }

  build(): Transaction {
    return this.builder.build();
  }
}

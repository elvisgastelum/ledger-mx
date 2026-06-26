import {
  TransactionLineBuilder,
  TransactionLine,
  AccountId,
  CategoryId,
  EnvelopeId,
} from "@ledger-mx/domain";
import {
  testTransactionLineId,
  testAccountId,
  testCategoryId,
  testEnvelopeId,
} from "./test-ids";

/**
 * Test-only TransactionLineBuilder with safe defaults.
 * Composes the runtime TransactionLineBuilder with sensible test defaults.
 */
export class TestTransactionLineBuilder {
  private builder = new TransactionLineBuilder();

  constructor() {
    // Set default ID
    this.builder.withId(testTransactionLineId());
  }

  withId(id: ReturnType<typeof testTransactionLineId>): this {
    this.builder.withId(id);
    return this;
  }

  withTransactionId(transactionId: Parameters<TransactionLineBuilder["withTransactionId"]>[0]): this {
    this.builder.withTransactionId(transactionId);
    return this;
  }

  withTarget(
    targetType: Parameters<TransactionLineBuilder["withTarget"]>[0],
    targetId: Parameters<TransactionLineBuilder["withTarget"]>[1],
  ): this {
    this.builder.withTarget(targetType, targetId);
    return this;
  }

  withAccountTarget(accountId: AccountId): this {
    this.builder.withAccountTarget(accountId);
    return this;
  }

  withEnvelopeTarget(envelopeId: EnvelopeId): this {
    this.builder.withEnvelopeTarget(envelopeId);
    return this;
  }

  withCategoryTarget(categoryId: CategoryId): this {
    this.builder.withCategoryTarget(categoryId);
    return this;
  }

   withAmountCents(amountCents: number): this {
    this.builder.withAmountCents(amountCents);
    return this;
  }

  build(): TransactionLine {
    return this.builder.build();
  }
}

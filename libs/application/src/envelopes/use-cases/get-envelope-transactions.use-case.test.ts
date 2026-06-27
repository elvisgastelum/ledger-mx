import { describe, it, expect, beforeEach } from "vitest";
import { GetEnvelopeTransactionsUseCase } from "./get-envelope-transactions.use-case";
import type { EnvelopeRepository, TransactionRepository, UserId, EnvelopeId, TransactionId, TransactionLineId, Envelope, Transaction } from "@ledger-mx/domain";
import { EnvelopeNotFoundError } from "../envelope.errors";
import { TransactionBuilder } from "@ledger-mx/domain";
import { userIdFromString, envelopeIdFromString } from "@ledger-mx/domain";

// In-memory fake repositories
class FakeEnvelopeRepository implements EnvelopeRepository {
  private envelopes: Map<string, Envelope> = new Map();

  async save(envelope: Envelope): Promise<void> {
    this.envelopes.set(`${envelope.userId}:${envelope.id}`, envelope);
  }

  async findById(userId: UserId, id: EnvelopeId): Promise<Envelope | null> {
    return this.envelopes.get(`${userId}:${id}`) ?? null;
  }

  async listByUserId(userId: UserId): Promise<Envelope[]> {
    return Array.from(this.envelopes.values()).filter(
      (e) => e.userId === userId && !e.deletedAt,
    );
  }

  async archive(userId: UserId, id: EnvelopeId, deletedAt: Date): Promise<void> {
    const key = `${userId}:${id}`;
    const envelope = this.envelopes.get(key);
    if (envelope) {
      (envelope as { deletedAt: Date | null }).deletedAt = deletedAt;
    }
  }

  async getBalance(userId: UserId, id: EnvelopeId): Promise<number> {
    return 0;
  }

  async getBalances(userId: UserId, ids: EnvelopeId[]): Promise<Map<string, number>> {
    return new Map();
  }

  async findDefaultEnvelopes(userId: UserId): Promise<Envelope[]> {
    return [];
  }

  reset() {
    this.envelopes.clear();
  }
}

class FakeTransactionRepository implements TransactionRepository {
  private transactions: Map<string, { userId: string; transaction: Transaction }> = new Map();

  async save(transaction: Transaction): Promise<void> {
    this.transactions.set(`${transaction.userId}:${transaction.id}`, {
      userId: transaction.userId,
      transaction,
    });
  }

  async findById(userId: UserId, id: TransactionId): Promise<Transaction | null> {
    const result = this.transactions.get(`${userId}:${id}`);
    return result ? result.transaction : null;
  }

  async listByUserId(userId: UserId): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((t) => t.userId === userId)
      .map((t) => t.transaction);
  }

  async findReversalByOriginalId(userId: UserId, originalId: TransactionId): Promise<Transaction | null> {
    return null;
  }

  async findByEnvelopeId(userId: UserId, envelopeId: EnvelopeId): Promise<Transaction[]> {
    const result: Transaction[] = [];
    for (const { userId: uid, transaction } of this.transactions.values()) {
      if (uid === userId) {
        const hasEnvelopeLine = transaction.lines.some(
          (line) => line.targetType === "envelope" && line.targetId === envelopeId,
        );
        if (hasEnvelopeLine) {
          result.push(transaction);
        }
      }
    }
    return result;
  }

  reset() {
    this.transactions.clear();
  }
}

describe("GetEnvelopeTransactionsUseCase", () => {
  let envelopeRepository: FakeEnvelopeRepository;
  let transactionRepository: FakeTransactionRepository;
  let useCase: GetEnvelopeTransactionsUseCase;
  let userId: UserId;
  let envelopeId: EnvelopeId;
  let accountId: string;

  beforeEach(() => {
    envelopeRepository = new FakeEnvelopeRepository();
    transactionRepository = new FakeTransactionRepository();
    useCase = new GetEnvelopeTransactionsUseCase(envelopeRepository, transactionRepository);
    userId = userIdFromString("550e8400-e29b-41d4-a716-446655440000");
    envelopeId = envelopeIdFromString("770e8400-e29b-41d4-a716-446655440000");
    accountId = "123e4567-e89b-42d3-a456-426614174000";
  });

  it("should return transactions for an envelope", async () => {
    // Create envelope
    const envelope = {
      id: envelopeId,
      userId,
      name: "Groceries",
      targetAmountCents: 50000,
      isProtected: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await envelopeRepository.save(envelope);

    // Create a transaction with envelope line using the correct builder API
    const transaction = new TransactionBuilder()
      .withId("test-tx-id" as TransactionId)
      .withUserId(userId)
      .withType("envelope_allocation")
      .withOccurredAt(new Date())
      .withTransactionLine((lineBuilder) =>
        lineBuilder
          .withId("line-1" as TransactionLineId)
          .withAccountTarget(accountId as never)
          .withAmountCents(-5000)
      )
      .withTransactionLine((lineBuilder) =>
        lineBuilder
          .withId("line-2" as TransactionLineId)
          .withEnvelopeTarget(envelopeId as never)
          .withAmountCents(5000)
      )
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();

    await transactionRepository.save(transaction);

    const result = await useCase.execute({
      userId,
      envelopeId: envelopeId as string,
    });

    expect(result.envelopeId).toBe(envelopeId);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].id).toBe("test-tx-id");
  });

  it("should throw EnvelopeNotFoundError if envelope does not exist", async () => {
    await expect(
      useCase.execute({
        userId,
        envelopeId: envelopeId as string,
      }),
    ).rejects.toThrow(EnvelopeNotFoundError);
  });

  it("should return empty array if envelope has no transactions", async () => {
    // Create envelope
    const envelope = {
      id: envelopeId,
      userId,
      name: "Groceries",
      targetAmountCents: 50000,
      isProtected: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await envelopeRepository.save(envelope);

    const result = await useCase.execute({
      userId,
      envelopeId: envelopeId as string,
    });

    expect(result.envelopeId).toBe(envelopeId);
    expect(result.transactions).toHaveLength(0);
  });

  it("should only return transactions for the specified envelope", async () => {
    // Create two envelopes
    const envelope1 = {
      id: envelopeId,
      userId,
      name: "Groceries",
      targetAmountCents: 50000,
      isProtected: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const envelope2Id = envelopeIdFromString("770e8400-e29b-41d4-a716-446655440001");
    const envelope2 = {
      id: envelope2Id,
      userId,
      name: "Dining Out",
      targetAmountCents: 30000,
      isProtected: true,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await envelopeRepository.save(envelope1);
    await envelopeRepository.save(envelope2);

    // Create transaction for envelope1
    const transaction1 = new TransactionBuilder()
      .withId("test-tx-1" as TransactionId)
      .withUserId(userId)
      .withType("envelope_allocation")
      .withOccurredAt(new Date())
      .withTransactionLine((lineBuilder) =>
        lineBuilder
          .withId("line-1" as TransactionLineId)
          .withAccountTarget(accountId as never)
          .withAmountCents(-5000)
      )
      .withTransactionLine((lineBuilder) =>
        lineBuilder
          .withId("line-2" as TransactionLineId)
          .withEnvelopeTarget(envelopeId as never)
          .withAmountCents(5000)
      )
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();

    // Create transaction for envelope2
    const transaction2 = new TransactionBuilder()
      .withId("test-tx-2" as TransactionId)
      .withUserId(userId)
      .withType("envelope_allocation")
      .withOccurredAt(new Date())
      .withTransactionLine((lineBuilder) =>
        lineBuilder
          .withId("line-3" as TransactionLineId)
          .withAccountTarget(accountId as never)
          .withAmountCents(-3000)
      )
      .withTransactionLine((lineBuilder) =>
        lineBuilder
          .withId("line-4" as TransactionLineId)
          .withEnvelopeTarget(envelope2Id as never)
          .withAmountCents(3000)
      )
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();

    await transactionRepository.save(transaction1);
    await transactionRepository.save(transaction2);

    // Get transactions for envelope1
    const result = await useCase.execute({
      userId,
      envelopeId: envelopeId as string,
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].id).toBe("test-tx-1");
  });
});

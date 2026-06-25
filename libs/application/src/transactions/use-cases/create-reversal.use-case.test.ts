import { expect, test, describe, beforeEach } from "vitest";
import { CreateReversalUseCase } from "./create-reversal.use-case";
import { Transaction } from "@ledger-mx/domain";
import { TransactionLine } from "@ledger-mx/domain";
import {
  transactionIdFromString,
  userIdFromString,
  transactionLineIdFromString,
  accountIdFromString,
} from "@ledger-mx/domain";
import type {
  TransactionRepository,
  UserId,
  TransactionId,
} from "@ledger-mx/domain";

// In-memory fake repository for testing
class FakeTransactionRepository implements TransactionRepository {
  private transactions = new Map<string, Transaction>();

  async save(transaction: Transaction): Promise<void> {
    this.transactions.set(transaction.id as string, transaction);
  }

  async findById(
    userId: UserId,
    transactionId: TransactionId,
  ): Promise<Transaction | null> {
    const tx = this.transactions.get(transactionId as string);
    if (tx && tx.userId === userId) {
      return tx;
    }
    return null;
  }

  async listByUserId(userId: UserId): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (tx) => tx.userId === userId,
    );
  }

  async findReversalByOriginalId(
    userId: UserId,
    originalTransactionId: TransactionId,
  ): Promise<Transaction | null> {
    const reversal = Array.from(this.transactions.values()).find(
      (tx) =>
        tx.userId === userId &&
        tx.reversalOfTransactionId === originalTransactionId,
    );
    return reversal ?? null;
  }
}

describe("CreateReversalUseCase", () => {
  let repo: FakeTransactionRepository;
  let useCase: CreateReversalUseCase;
  let userId: UserId;
  let originalTransactionId: TransactionId;
  let accountId1: ReturnType<typeof accountIdFromString>;
  let accountId2: ReturnType<typeof accountIdFromString>;

  beforeEach(() => {
    repo = new FakeTransactionRepository();
    useCase = new CreateReversalUseCase(repo);
    userId = userIdFromString("8a3b2c1d-5678-4f9e-8a1b-2c3d4e5f6a7b");
    originalTransactionId = transactionIdFromString(
      "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a",
    );
    accountId1 = accountIdFromString("123e4567-e89b-42d3-a456-426614174000");
    accountId2 = accountIdFromString("223e4567-e89b-42d3-a456-426614174001");
  });

  test("creates reversal transaction with negated lines", async () => {
    // Create original transaction
    const originalLine1 = new TransactionLine({
      id: transactionLineIdFromString("423e4567-e89b-42d3-a456-426614174003"),
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId1,
      amountCents: 10000,
    });
    const originalLine2 = new TransactionLine({
      id: transactionLineIdFromString("523e4567-e89b-42d3-a456-426614174004"),
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId2,
      amountCents: -10000,
    });

    const originalTransaction = new Transaction({
      id: originalTransactionId,
      userId,
      type: "income",
      occurredAt: new Date("2024-01-15"),
      lines: [originalLine1, originalLine2],
    });

    await repo.save(originalTransaction);

    // Create reversal
    const reversalId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
    const result = await useCase.execute({
      userId: userId as string,
      originalTransactionId: originalTransactionId as string,
      id: reversalId,
      lineIds: [
        "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
        "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
      ],
    });

    expect(result.type).toBe("reversal");
    expect(result.reversalOfTransactionId).toBe(originalTransactionId);
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0].amountCents).toBe(-10000); // Negated
    expect(result.lines[1].amountCents).toBe(10000); // Negated
  });

  test("rejects duplicate reversal", async () => {
    // Create original transaction
    const originalLine1 = new TransactionLine({
      id: transactionLineIdFromString("423e4567-e89b-42d3-a456-426614174003"),
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId1,
      amountCents: 10000,
    });
    const originalLine2 = new TransactionLine({
      id: transactionLineIdFromString("523e4567-e89b-42d3-a456-426614174004"),
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId2,
      amountCents: -10000,
    });

    const originalTransaction = new Transaction({
      id: originalTransactionId,
      userId,
      type: "income",
      occurredAt: new Date("2024-01-15"),
      lines: [originalLine1, originalLine2],
    });

    await repo.save(originalTransaction);

    // Create first reversal
    await useCase.execute({
      userId: userId as string,
      originalTransactionId: originalTransactionId as string,
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      lineIds: [
        "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
        "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
      ],
    });

    // Try to create second reversal - should fail
    await expect(
      useCase.execute({
        userId: userId as string,
        originalTransactionId: originalTransactionId as string,
        id: "f1g2h3i4-j5k6-4l7m-8n9o-0p1q2r3s4t5u",
        lineIds: [
          "g1h2i3j4-k5l6-4m7n-8o9p-0q1r2s3t4u5v",
          "h1i2j3k4-l5m6-4n7o-8p9q-0r1s2t3u4v5w",
        ],
      }),
    ).rejects.toThrow("already has a reversal");
  });

  test("rejects reversal for non-existent transaction", async () => {
    await expect(
      useCase.execute({
        userId: userId as string,
        originalTransactionId: "non-existent-id",
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        lineIds: [
          "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
          "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
        ],
      }),
    ).rejects.toThrow("Transaction not found");
  });

  test("user isolation - wrong user cannot reverse", async () => {
    // Create original transaction for user1
    const originalLine1 = new TransactionLine({
      id: transactionLineIdFromString("423e4567-e89b-42d3-a456-426614174003"),
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId1,
      amountCents: 10000,
    });
    const originalLine2 = new TransactionLine({
      id: transactionLineIdFromString("523e4567-e89b-42d3-a456-426614174004"),
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId2,
      amountCents: -10000,
    });

    const originalTransaction = new Transaction({
      id: originalTransactionId,
      userId,
      type: "income",
      occurredAt: new Date("2024-01-15"),
      lines: [originalLine1, originalLine2],
    });

    await repo.save(originalTransaction);

    // Try to reverse with different user
    const differentUserId = "9c8d7e6f-5a4b-4c3d-2e1f-0a9b8c7d6e5f";
    await expect(
      useCase.execute({
        userId: differentUserId,
        originalTransactionId: originalTransactionId as string,
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        lineIds: [
          "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
          "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
        ],
      }),
    ).rejects.toThrow("Transaction not found");
  });

  test("reversal satisfies double-entry (sums to zero)", async () => {
    // Create original transaction
    const originalLine1 = new TransactionLine({
      id: transactionLineIdFromString("423e4567-e89b-42d3-a456-426614174003"),
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId1,
      amountCents: 50000,
    });
    const originalLine2 = new TransactionLine({
      id: transactionLineIdFromString("523e4567-e89b-42d3-a456-426614174004"),
      transactionId: originalTransactionId,
      targetType: "account",
      targetId: accountId2,
      amountCents: -50000,
    });

    const originalTransaction = new Transaction({
      id: originalTransactionId,
      userId,
      type: "expense",
      occurredAt: new Date(),
      lines: [originalLine1, originalLine2],
    });

    await repo.save(originalTransaction);

    // Create reversal
    const result = await useCase.execute({
      userId: userId as string,
      originalTransactionId: originalTransactionId as string,
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      lineIds: [
        "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
        "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
      ],
    });

    // Reversal should also be balanced
    const sum = result.lines.reduce((s, l) => s + l.amountCents, 0);
    expect(sum).toBe(0);
  });
});

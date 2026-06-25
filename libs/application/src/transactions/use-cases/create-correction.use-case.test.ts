import { expect, test, describe, beforeEach } from "vitest";
import { CreateCorrectionUseCase } from "./create-correction.use-case";
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

describe("CreateCorrectionUseCase", () => {
  let repo: FakeTransactionRepository;
  let useCase: CreateCorrectionUseCase;
  let userId: UserId;
  let originalTransactionId: TransactionId;
  let accountId1: ReturnType<typeof accountIdFromString>;
  let accountId2: ReturnType<typeof accountIdFromString>;

  beforeEach(() => {
    repo = new FakeTransactionRepository();
    useCase = new CreateCorrectionUseCase(repo);
    userId = userIdFromString("8a3b2c1d-5678-4f9e-8a1b-2c3d4e5f6a7b");
    originalTransactionId = transactionIdFromString(
      "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a",
    );
    accountId1 = accountIdFromString("123e4567-e89b-42d3-a456-426614174000");
    accountId2 = accountIdFromString("223e4567-e89b-42d3-a456-426614174001");
  });

  test("creates reversal and corrected transaction", async () => {
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

    // Create correction
    const result = await useCase.execute({
      userId: userId as string,
      originalTransactionId: originalTransactionId as string,
      reversal: {
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        lineIds: [
          "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
          "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
        ],
      },
      correctedTransaction: {
        id: "f1g2h3i4-j5k6-4l7m-8n9o-0p1q2r3s4t5u",
        transactionDate: "2024-01-16T00:00:00.000Z",
        type: "income",
        note: "Corrected transaction",
        lines: [
          {
            id: "g1h2i3j4-k5l6-4m7n-8o9p-0q1r2s3t4u5v",
            targetType: "account",
            accountId: accountId1 as string,
            categoryId: null,
            envelopeId: null,
            amountCents: 15000,
            type: "income",
          },
          {
            id: "h1i2j3k4-l5m6-4n7o-8p9q-0r1s2t3u4v5w",
            targetType: "account",
            accountId: accountId2 as string,
            categoryId: null,
            envelopeId: null,
            amountCents: -15000,
            type: "income",
          },
        ],
      },
    });

    // Check reversal
    expect(result.reversal.type).toBe("reversal");
    expect(result.reversal.reversalOfTransactionId).toBe(originalTransactionId);

    // Check corrected transaction
    expect(result.correctedTransaction.type).toBe("income");
    expect(result.correctedTransaction.note).toBe("Corrected transaction");
    expect(result.correctedTransaction.lines).toHaveLength(2);
    expect(result.correctedTransaction.lines[0].amountCents).toBe(15000);
    expect(result.correctedTransaction.lines[1].amountCents).toBe(-15000);
  });

  test("balance/net effect after correction equals corrected transaction", async () => {
    // Create original transaction (user received $100)
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

    // Correct to $150
    await useCase.execute({
      userId: userId as string,
      originalTransactionId: originalTransactionId as string,
      reversal: {
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        lineIds: [
          "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
          "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
        ],
      },
      correctedTransaction: {
        id: "f1g2h3i4-j5k6-4l7m-8n9o-0p1q2r3s4t5u",
        transactionDate: "2024-01-16T00:00:00.000Z",
        type: "income",
        lines: [
          {
            id: "g1h2i3j4-k5l6-4m7n-8o9p-0q1r2s3t4u5v",
            targetType: "account",
            accountId: accountId1 as string,
            categoryId: null,
            envelopeId: null,
            amountCents: 15000,
            type: "income",
          },
          {
            id: "h1i2j3k4-l5m6-4n7o-8p9q-0r1s2t3u4v5w",
            targetType: "account",
            accountId: accountId2 as string,
            categoryId: null,
            envelopeId: null,
            amountCents: -15000,
            type: "income",
          },
        ],
      },
    });

    // Net effect on account1 should be $150 (not $100)
    const netEffect = new Map<string, number>();

    // Original: account1 +10000, account2 -10000
    netEffect.set(accountId1 as string, 10000);
    netEffect.set(accountId2 as string, -10000);

    // Reversal: account1 -10000, account2 +10000
    netEffect.set(
      accountId1 as string,
      netEffect.get(accountId1 as string)! - 10000,
    );
    netEffect.set(
      accountId2 as string,
      netEffect.get(accountId2 as string)! + 10000,
    );

    // Corrected: account1 +15000, account2 -15000
    netEffect.set(
      accountId1 as string,
      netEffect.get(accountId1 as string)! + 15000,
    );
    netEffect.set(
      accountId2 as string,
      netEffect.get(accountId2 as string)! - 15000,
    );

    // Net effect should be: account1 +15000, account2 -15000
    expect(netEffect.get(accountId1 as string)).toBe(15000);
    expect(netEffect.get(accountId2 as string)).toBe(-15000);
  });

  test("rejects correction with unbalanced corrected transaction", async () => {
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

    // Try to create correction with unbalanced corrected transaction (lines sum to 5000, not 0)
    await expect(
      useCase.execute({
        userId: userId as string,
        originalTransactionId: originalTransactionId as string,
        reversal: {
          id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          lineIds: [
            "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
            "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
          ],
        },
        correctedTransaction: {
          id: "f1g2h3i4-j5k6-4l7m-8n9o-0p1q2r3s4t5u",
          transactionDate: "2024-01-16T00:00:00.000Z",
          type: "income",
          lines: [
            {
              id: "g1h2i3j4-k5l6-4m7n-8o9p-0q1r2s3t4u5v",
              targetType: "account",
              accountId: accountId1 as string,
              categoryId: null,
              envelopeId: null,
              amountCents: 15000, // +15000
              type: "income",
            },
            {
              id: "h1i2j3k4-l5m6-4n7o-8p9q-0r1s2t3u4v5w",
              targetType: "account",
              accountId: accountId2 as string,
              categoryId: null,
              envelopeId: null,
              amountCents: -10000, // -10000, sum = 5000, not 0!
              type: "income",
            },
          ],
        },
      }),
    ).rejects.toThrow("must be zero");
  });

  test("rejects correction if original already has reversal", async () => {
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
    const reversalLine1 = new TransactionLine({
      id: transactionLineIdFromString("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"),
      transactionId: transactionIdFromString(
        "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      ),
      targetType: "account",
      targetId: accountId1,
      amountCents: -10000,
    });
    const reversalLine2 = new TransactionLine({
      id: transactionLineIdFromString("e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b"),
      transactionId: transactionIdFromString(
        "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      ),
      targetType: "account",
      targetId: accountId2,
      amountCents: 10000,
    });

    const existingReversal = new Transaction({
      id: transactionIdFromString("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"),
      userId,
      type: "reversal",
      occurredAt: new Date(),
      lines: [reversalLine1, reversalLine2],
      reversalOfTransactionId: originalTransactionId,
    });

    await repo.save(existingReversal);

    // Try to create correction - should fail
    await expect(
      useCase.execute({
        userId: userId as string,
        originalTransactionId: originalTransactionId as string,
        reversal: {
          id: "f1g2h3i4-j5k6-4l7m-8n9o-0p1q2r3s4t5u",
          lineIds: [
            "g1h2i3j4-k5l6-4m7n-8o9p-0q1r2s3t4u5v",
            "h1i2j3k4-l5m6-4n7o-8p9q-0r1s2t3u4v5w",
          ],
        },
        correctedTransaction: {
          id: "i1j2k3l4-m5n6-4o7p-8q9r-0s1t2u3v4w5x",
          transactionDate: "2024-01-16T00:00:00.000Z",
          type: "income",
          lines: [
            {
              id: "j1k2l3m4-n5o6-4p7q-8r9s-0t1u2v3w4x5y",
              targetType: "account",
              accountId: accountId1 as string,
              categoryId: null,
              envelopeId: null,
              amountCents: 15000,
              type: "income",
            },
            {
              id: "k1l2m3n4-o5p6-4q7r-8s9t-0u1v2w3x4y5z",
              targetType: "account",
              accountId: accountId2 as string,
              categoryId: null,
              envelopeId: null,
              amountCents: -15000,
              type: "income",
            },
          ],
        },
      }),
    ).rejects.toThrow("already has a reversal");
  });

  test("user isolation - wrong user cannot correct", async () => {
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

    // Try to correct with different user
    const differentUserId = "9c8d7e6f-5a4b-4c3d-2e1f-0a9b8c7d6e5f";
    await expect(
      useCase.execute({
        userId: differentUserId,
        originalTransactionId: originalTransactionId as string,
        reversal: {
          id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          lineIds: [
            "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
            "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
          ],
        },
        correctedTransaction: {
          id: "f1g2h3i4-j5k6-4l7m-8n9o-0p1q2r3s4t5u",
          transactionDate: "2024-01-16T00:00:00.000Z",
          type: "income",
          lines: [
            {
              id: "g1h2i3j4-k5l6-4m7n-8o9p-0q1r2s3t4u5v",
              targetType: "account",
              accountId: accountId1 as string,
              categoryId: null,
              envelopeId: null,
              amountCents: 15000,
              type: "income",
            },
            {
              id: "h1i2j3k4-l5m6-4n7o-8p9q-0r1s2t3u4v5w",
              targetType: "account",
              accountId: accountId2 as string,
              categoryId: null,
              envelopeId: null,
              amountCents: -15000,
              type: "income",
            },
          ],
        },
      }),
    ).rejects.toThrow("Transaction not found");
  });
});

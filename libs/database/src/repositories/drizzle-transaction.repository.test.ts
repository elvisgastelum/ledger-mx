import { describe, it, expect, vi, beforeEach } from "vitest";
import { DrizzleTransactionRepository } from "./drizzle-transaction.repository";
import { Transaction, TransactionLine } from "@ledger-mx/domain";
import type { UserId, AccountId } from "@ledger-mx/domain";
import {
  userIdFromString,
  transactionIdFromString,
  transactionLineIdFromString,
  accountIdFromString,
} from "@ledger-mx/domain";
import type { Database } from "../connection";

describe("DrizzleTransactionRepository", () => {
  // Define types for mock database
  interface MockWhereResult {
    limit: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    then: (resolve: (value: unknown) => void) => void;
  }

  let mockDb: Record<string, ReturnType<typeof vi.fn>>;
  let repo: DrizzleTransactionRepository;
  let userId: UserId;
  let accountId1: AccountId;
  let accountId2: AccountId;

  // Helper to create a mock chain that properly handles Drizzle ORM patterns
  function createMockChain(defaultResolveValue: unknown[] = []) {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};

    // Methods that return the chain (for chaining)
    const chainMethods = [
      "select",
      "from",
      "values",
      "set",
      "onConflictDoUpdate",
      "insert",
      "delete",
      "update",
    ];
    chainMethods.forEach((method) => {
      chain[method] = vi.fn().mockReturnValue(chain);
    });

    // where() returns an object with limit, orderBy, and then (for awaiting)
    const whereResult: MockWhereResult = {
      limit: vi.fn().mockResolvedValue(defaultResolveValue),
      orderBy: vi.fn().mockResolvedValue(defaultResolveValue),
      then: (resolve: (value: unknown) => void) => resolve(defaultResolveValue),
    };
    chain.where = vi.fn().mockReturnValue(whereResult);

    return chain;
  }

  beforeEach(() => {
    mockDb = {
      insert: vi.fn().mockReturnValue(createMockChain()),
      select: vi.fn().mockReturnValue(createMockChain()),
      delete: vi.fn().mockReturnValue(createMockChain()),
      update: vi.fn().mockReturnValue(createMockChain()),
    };

    repo = new DrizzleTransactionRepository(mockDb as unknown as Database);
    userId = userIdFromString("8a3b2c1d-5678-4f9e-8a1b-2c3d4e5f6a7b");
    accountId1 = accountIdFromString("123e4567-e89b-42d3-a456-426614174000");
    accountId2 = accountIdFromString("223e4567-e89b-42d3-a456-426614174001");
  });

  describe("save behavior", () => {
    it("should insert transaction without hard delete of lines", async () => {
      const transactionId = transactionIdFromString(
        "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a",
      );
      const lineId1 = transactionLineIdFromString(
        "423e4567-e89b-42d3-a456-426614174003",
      );
      const lineId2 = transactionLineIdFromString(
        "523e4567-e89b-42d3-a456-426614174004",
      );

      const line1 = new TransactionLine({
        id: lineId1,
        transactionId: transactionId,
        targetType: "account",
        targetId: accountId1,
        amountCents: 10000,
      });
      const line2 = new TransactionLine({
        id: lineId2,
        transactionId: transactionId,
        targetType: "account",
        targetId: accountId2,
        amountCents: -10000,
      });

      const transaction = new Transaction({
        id: transactionId,
        userId,
        type: "income",
        occurredAt: new Date("2024-01-15"),
        lines: [line1, line2],
      });

      // Mock select().from().where().limit() to return empty array (transaction doesn't exist)
      const mockSelectChain = createMockChain();
      mockSelectChain.where.mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });
      mockDb.select.mockReturnValue(mockSelectChain);

      await repo.save(transaction);

      // Verify insert was called (not update with onConflictDoUpdate)
      expect(mockDb.insert).toHaveBeenCalled();

      // Verify delete was NOT called (no hard delete)
      expect(mockDb.delete).not.toHaveBeenCalled();
    });

    it("should throw FinancialRecordModificationError if transaction already exists", async () => {
      const transactionId = transactionIdFromString(
        "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a",
      );
      const lineId1 = transactionLineIdFromString(
        "423e4567-e89b-42d3-a456-426614174003",
      );
      const lineId2 = transactionLineIdFromString(
        "523e4567-e89b-42d3-a456-426614174004",
      );

      const line1 = new TransactionLine({
        id: lineId1,
        transactionId: transactionId,
        targetType: "account",
        targetId: accountId1,
        amountCents: 10000,
      });
      const line2 = new TransactionLine({
        id: lineId2,
        transactionId: transactionId,
        targetType: "account",
        targetId: accountId2,
        amountCents: -10000,
      });

      const transaction = new Transaction({
        id: transactionId,
        userId,
        type: "income",
        occurredAt: new Date("2024-01-15"),
        lines: [line1, line2],
      });

      // Mock select().from().where().limit() to return existing transaction
      const mockSelectChain = createMockChain();
      mockSelectChain.where.mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ id: transactionId }]),
      });
      mockDb.select.mockReturnValue(mockSelectChain);

      // Should throw error
      await expect(repo.save(transaction)).rejects.toThrow(
        "already exists and cannot be modified",
      );
    });
  });

  describe("findReversalByOriginalId", () => {
    it("should be user-scoped in query", async () => {
      const originalTransactionId = transactionIdFromString(
        "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a",
      );

      const mockSelectChain = createMockChain();
      mockSelectChain.where.mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });
      mockDb.select.mockReturnValue(mockSelectChain);

      await repo.findReversalByOriginalId(userId, originalTransactionId);

      // Verify where was called (for user scoping)
      expect(mockSelectChain.where).toHaveBeenCalled();
    });

    it("should return null if no reversal exists", async () => {
      const originalTransactionId = transactionIdFromString(
        "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a",
      );

      const mockSelectChain = createMockChain();
      mockSelectChain.where.mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });
      mockDb.select.mockReturnValue(mockSelectChain);

      const result = await repo.findReversalByOriginalId(
        userId,
        originalTransactionId,
      );

      expect(result).toBeNull();
    });
  });

  describe("user scoping", () => {
    it("should scope findById to userId", async () => {
      const transactionId = transactionIdFromString(
        "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a",
      );

      const mockSelectChain = createMockChain();
      mockSelectChain.where.mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });
      mockDb.select.mockReturnValue(mockSelectChain);

      await repo.findById(userId, transactionId);

      // Verify where was called (for user scoping)
      expect(mockSelectChain.where).toHaveBeenCalled();
    });

    it("should scope listByUserId to userId", async () => {
      const mockSelectChain = createMockChain();
      mockSelectChain.where.mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([]),
        then: (resolve: (value: unknown) => void) => resolve([]),
      });
      mockDb.select.mockReturnValue(mockSelectChain);

      await repo.listByUserId(userId);

      // Verify where was called (for user scoping)
      expect(mockSelectChain.where).toHaveBeenCalled();
    });
  });
});

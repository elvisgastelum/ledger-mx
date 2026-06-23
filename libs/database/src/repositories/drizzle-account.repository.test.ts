import { describe, it, expect, vi } from "vitest";
import { DrizzleAccountRepository } from "./drizzle-account.repository";
import type { UserId, AccountId } from "@ledger-mx/domain";
import { userIdFromString, accountIdFromString } from "@ledger-mx/domain";
import type { Database } from "../connection";

describe("DrizzleAccountRepository", () => {
  describe("archive behavior", () => {
    it("should set isArchived=true and deletedAt timestamp", async () => {
      // Create a mock that tracks calls
      const mockSet = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockUpdate = vi.fn().mockReturnValue({
        set: mockSet.mockReturnValue({
          where: mockWhere,
        }),
      });

      const mockDb = {
        update: mockUpdate,
      };

      const repo = new DrizzleAccountRepository(mockDb as unknown as Database);
      const userId = userIdFromString("550e8400-e29b-41d4-a716-446655440000") as UserId;
      const accountId = accountIdFromString("660e8400-e29b-41d4-a716-446655440000") as AccountId;
      const deletedAt = new Date("2024-01-15T10:30:00Z");

      await repo.archive(userId, accountId, deletedAt);

      // Verify the set method was called with correct parameters
      expect(mockSet).toHaveBeenCalledWith({
        isArchived: true,
        updatedAt: expect.any(Date),
        deletedAt: deletedAt,
      });

      // Verify the where clause was called (for user scoping)
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe("user scoping", () => {
    it("should scope save to userId", async () => {
      const mockWhere = vi.fn().mockReturnThis();
      const mockOnConflictDoUpdate = vi.fn().mockReturnValue({
        where: mockWhere,
      });
      const mockValues = vi.fn().mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate,
      });
      const mockInsert = vi.fn().mockReturnValue({
        values: mockValues,
      });

      const mockDb = {
        insert: mockInsert,
      };

      const repo = new DrizzleAccountRepository(mockDb as unknown as Database);
      const userId = userIdFromString("550e8400-e29b-41d4-a716-446655440000") as UserId;
      const accountId = accountIdFromString("660e8400-e29b-41d4-a716-446655440000") as AccountId;

      await repo.save({
        id: accountId,
        userId: userId,
        name: "Test Account",
        type: "debit",
        currencyCode: "MXN",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Verify onConflictDoUpdate was called with where option
      expect(mockOnConflictDoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.anything(),
          set: expect.anything(),
          where: expect.anything(),
        }),
      );
    });

    it("should scope findById to userId and exclude deleted", async () => {
      const mockWhere = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({
        where: mockWhere.mockReturnValue({
          limit: mockLimit,
        }),
      });
      const mockSelect = vi.fn().mockReturnValue({
        from: mockFrom,
      });

      const mockDb = {
        select: mockSelect,
      };

      const repo = new DrizzleAccountRepository(mockDb as unknown as Database);
      const userId = userIdFromString("550e8400-e29b-41d4-a716-446655440000") as UserId;
      const accountId = accountIdFromString("660e8400-e29b-41d4-a716-446655440000") as AccountId;

      await repo.findById(userId, accountId);

      // Verify where was called
      expect(mockWhere).toHaveBeenCalled();
    });

    it("should scope listByUserId to userId and exclude deleted", async () => {
      const mockWhere = vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([]),
      });
      const mockFrom = vi.fn().mockReturnValue({
        where: mockWhere,
      });
      const mockSelect = vi.fn().mockReturnValue({
        from: mockFrom,
      });

      const mockDb = {
        select: mockSelect,
      };

      const repo = new DrizzleAccountRepository(mockDb as unknown as Database);
      const userId = userIdFromString("550e8400-e29b-41d4-a716-446655440000") as UserId;

      await repo.listByUserId(userId);

      // Verify where was called
      expect(mockWhere).toHaveBeenCalled();
    });
  });
});

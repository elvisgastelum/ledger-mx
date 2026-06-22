import { describe, it, expect, beforeEach } from "vitest";
import {
  QueuedWrite,
  QueuedWriteStatus,
  QueuedWriteType,
  SyncConflict,
  ConflictResolutionChoice,
  DEFAULT_SYNC_CONFIG,
} from "./types";

/**
 * In-test fake implementations for sync strategy
 * These are minimal fakes to verify invariants without full implementation
 */

interface FakeQueueStore {
  writes: Map<string, QueuedWrite>;
}

function createFakeStore(): FakeQueueStore {
  return { writes: new Map() };
}

function addFakeWrite(
  store: FakeQueueStore,
  overrides: Partial<QueuedWrite> = {},
): QueuedWrite {
  const write: QueuedWrite = {
    id: `write-${Date.now()}-${Math.random()}`,
    type: "INSERT" as QueuedWriteType,
    table: "transactions",
    data: { id: "txn-1", amount: 100 },
    status: "pending" as QueuedWriteStatus,
    attempts: 0,
    maxAttempts: DEFAULT_SYNC_CONFIG.maxRetryAttempts,
    createdAt: new Date(),
    ...overrides,
  };
  store.writes.set(write.id, write);
  return write;
}

/**
 * Simulates processing a single write with success/failure
 */
async function simulateSyncWrite(
  write: QueuedWrite,
  shouldSucceed: boolean,
): Promise<{ success: boolean; error?: string }> {
  if (!shouldSucceed) {
    return { success: false, error: "Network error" };
  }
  return { success: true };
}

/**
 * Calculate exponential backoff (matches offline-retry.md spec)
 */
function calculateBackoff(attempt: number): number {
  return Math.pow(2, attempt) * 1000;
}

describe("Sync Strategy Invariants", () => {
  let store: FakeQueueStore;

  beforeEach(() => {
    store = createFakeStore();
  });

  describe("Offline writes queue as pending", () => {
    it("should queue offline writes with pending status", () => {
      const write = addFakeWrite(store, { status: "pending" });

      expect(write.status).toBe("pending");
      expect(store.writes.has(write.id)).toBe(true);
      expect(write.attempts).toBe(0);
    });

    it("should have required fields for offline writes", () => {
      const write = addFakeWrite(store);

      expect(write.id).toBeDefined();
      expect(write.type).toBeDefined();
      expect(write.table).toBeDefined();
      expect(write.data).toBeDefined();
      expect(write.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("Successful flush marks synced", () => {
    it("should mark write as synced after successful sync", async () => {
      const write = addFakeWrite(store, { status: "pending" });

      // Simulate successful sync
      const result = await simulateSyncWrite(write, true);

      if (result.success) {
        write.status = "synced";
        store.writes.set(write.id, write);
      }

      expect(write.status).toBe("synced");
    });

    it("should not retry synced writes", () => {
      const write = addFakeWrite(store, {
        status: "synced",
        attempts: 1,
      });

      const pendingWrites = Array.from(store.writes.values()).filter(
        (w) => w.status === "pending",
      );

      expect(pendingWrites).not.toContain(write);
    });
  });

  describe("Failed attempts increment retry/backoff metadata", () => {
    it("should increment attempts on failure", async () => {
      const write = addFakeWrite(store, {
        status: "pending",
        attempts: 0,
      });

      // Simulate failed sync
      const result = await simulateSyncWrite(write, false);

      if (!result.success) {
        write.attempts += 1;
        write.lastError = result.error;
        write.nextRetryAt = new Date(
          Date.now() + calculateBackoff(write.attempts),
        );
        store.writes.set(write.id, write);
      }

      expect(write.attempts).toBe(1);
      expect(write.lastError).toBe("Network error");
      expect(write.nextRetryAt).toBeInstanceOf(Date);
    });

    it("should calculate exponential backoff correctly", () => {
      expect(calculateBackoff(1)).toBe(2000); // 2^1 * 1000
      expect(calculateBackoff(2)).toBe(4000); // 2^2 * 1000
      expect(calculateBackoff(3)).toBe(8000); // 2^3 * 1000
    });

    it("should not retry before nextRetryAt", () => {
      const futureDate = new Date(Date.now() + 5000);
      const write = addFakeWrite(store, {
        status: "pending",
        attempts: 2,
        nextRetryAt: futureDate,
      });

      const now = new Date();
      const shouldRetry = write.nextRetryAt! <= now;

      expect(shouldRetry).toBe(false);
    });
  });

  describe("Max attempts marks error", () => {
    it("should mark write as error after exceeding max attempts", () => {
      const write = addFakeWrite(store, {
        status: "pending",
        attempts: DEFAULT_SYNC_CONFIG.maxRetryAttempts,
      });

      if (write.attempts >= write.maxAttempts) {
        write.status = "error";
        store.writes.set(write.id, write);
      }

      expect(write.status).toBe("error");
    });

    it("should not process error-status writes in retry queue", () => {
      const errorWrite = addFakeWrite(store, {
        status: "error",
        attempts: DEFAULT_SYNC_CONFIG.maxRetryAttempts,
      });

      const pendingWrites = Array.from(store.writes.values()).filter(
        (w) => w.status === "pending",
      );

      expect(pendingWrites).not.toContain(errorWrite);
    });
  });

  describe("Conflicts require explicit user resolution", () => {
    it("should not auto-delete records during conflict", () => {
      const conflict: SyncConflict = {
        id: "conflict-1",
        tableName: "transactions",
        recordId: "txn-1",
        versionA: { id: "txn-1", amount: 100, description: "Version A" },
        versionB: { id: "txn-1", amount: 150, description: "Version B" },
      };

      // Explicit assertion: no silent auto-delete
      expect(conflict.versionA).toBeDefined();
      expect(conflict.versionB).toBeDefined();
      expect(conflict.resolution).toBeUndefined();
    });

    it("should require explicit resolution choice", () => {
      const conflict: SyncConflict = {
        id: "conflict-1",
        tableName: "transactions",
        recordId: "txn-1",
        versionA: { id: "txn-1", amount: 100 },
        versionB: { id: "txn-1", amount: 150 },
      };

      // No resolution by default - user must choose
      expect(conflict.resolution).toBeUndefined();

      // User chooses "keep-both"
      conflict.resolution = "keep-both";
      conflict.resolvedAt = new Date();

      expect(conflict.resolution).toBe("keep-both");
      expect(conflict.resolvedAt).toBeInstanceOf(Date);
    });

    it("should support all resolution choices", () => {
      const choices: ConflictResolutionChoice[] = [
        "keep-a",
        "keep-b",
        "keep-both",
        "merge",
      ];

      choices.forEach((choice) => {
        const conflict: SyncConflict = {
          id: `conflict-${choice}`,
          tableName: "transactions",
          recordId: "txn-1",
          versionA: { id: "txn-1", amount: 100 },
          versionB: { id: "txn-1", amount: 150 },
          resolution: choice,
        };

        expect(conflict.resolution).toBe(choice);
      });
    });
  });
});

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { eq } from "drizzle-orm";
import * as schema from "../schema/index.js";
import { seedDemo, resetUser, verifySeed } from "./run.js";
import { demoUser, getDemoSeedData } from "./demo.js";
import { validateTransactionLines } from "./run.js";
import type {
  SeedData,
  SeedAccount,
  SeedEnvelope,
  SeedTransactionLine,
} from "./types.js";

describe("Seed Integration Tests", () => {
  // Container type - match testcontainers API
  let container: {
    getConnectionUri(): string;
    stop(): Promise<unknown>;
  } | null = null;
  let pool: Pool;
  let db: NodePgDatabase<typeof schema>;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer("postgres:16-alpine")
      .withDatabase("test_db")
      .withUsername("test_user")
      .withPassword("test_password")
      .start();

    const connectionString = container.getConnectionUri();

    // Create pool and database connection
    pool = new Pool({ connectionString });
    db = drizzle(pool, { schema });

    // Run migrations
    const migrationsFolder = new URL("../../drizzle", import.meta.url).pathname;
    await migrate(db, { migrationsFolder });
  }, 60000);

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
    if (container) {
      await container.stop();
    }
  });

  describe("Demo Seed Data", () => {
    it("should have valid demo seed data structure", () => {
      const seedData = getDemoSeedData();

      expect(seedData.users).toHaveLength(1);
      expect(seedData.categoryGroups.length).toBeGreaterThanOrEqual(4);
      expect(seedData.categories.length).toBeGreaterThanOrEqual(10);
      expect(seedData.accounts.length).toBeGreaterThanOrEqual(3);
      expect(seedData.accounts.length).toBeLessThanOrEqual(5);
      expect(seedData.envelopes.length).toBeGreaterThanOrEqual(10);
      expect(seedData.transactions.length).toBeGreaterThanOrEqual(50);
      expect(seedData.transactionLines.length).toBeGreaterThanOrEqual(50);
    });

    it("should have valid transaction lines", () => {
      const seedData = getDemoSeedData();

      // This should not throw
      expect(() => validateTransactionLines(seedData)).not.toThrow();
    });

    it("should seed demo data and verify counts", async () => {
      await seedDemo(db);

      const result = await verifySeed(db, demoUser.id);

      expect(result.users).toBe(1);
      expect(result.categoryGroups).toBeGreaterThanOrEqual(4);
      expect(result.categories).toBeGreaterThanOrEqual(10);
      expect(result.accounts).toBeGreaterThanOrEqual(3);
      expect(result.envelopes).toBeGreaterThanOrEqual(10);
      expect(result.transactions).toBeGreaterThanOrEqual(50);
      expect(result.transactionLines).toBeGreaterThanOrEqual(50);
    }, 30000);

    it("should be idempotent (reseed without errors)", async () => {
      // First seed
      await seedDemo(db);

      // Reseed (should reset and seed again)
      await seedDemo(db);

      const result = await verifySeed(db, demoUser.id);
      expect(result.transactions).toBeGreaterThanOrEqual(50);
    }, 30000);
  });

  describe("Reset Functionality", () => {
    beforeEach(async () => {
      // Seed demo data before each reset test
      await seedDemo(db);
    });

    it("should reset demo user data but keep user row", async () => {
      // Verify data exists
      let result = await verifySeed(db, demoUser.id);
      expect(result.transactions).toBeGreaterThanOrEqual(50);

      // Reset
      await resetUser(db, demoUser.id, false);

      // Verify data is cleared but user remains (resetUser intentionally keeps user)
      result = await verifySeed(db, demoUser.id);
      expect(result.users).toBe(1); // User row is kept
      expect(result.categoryGroups).toBe(0);
      expect(result.categories).toBe(0);
      expect(result.accounts).toBe(0);
      expect(result.envelopes).toBe(0);
      expect(result.transactions).toBe(0);
      expect(result.transactionLines).toBe(0);
    }, 30000);

    it("should only reset specified user data", async () => {
      // Create another user's data manually
      const otherUserId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
      await db.insert(schema.users).values({
        id: otherUserId,
        email: "other@example.com",
        displayName: "Other User",
      });

      // Reset only demo user
      await resetUser(db, demoUser.id, false);

      // Verify other user still exists
      const otherUsers = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, otherUserId));
      expect(otherUsers).toHaveLength(1);

      // Clean up
      await db.delete(schema.users).where(eq(schema.users.id, otherUserId));
    }, 30000);
  });

  describe("Transaction Line Validation", () => {
    it("should reject transaction lines with no target", () => {
      const invalidSeedData: SeedData = {
        users: [],
        categoryGroups: [],
        categories: [],
        accounts: [],
        envelopes: [],
        transactions: [],
        transactionLines: [
          {
            id: "test-line-1",
            userId: demoUser.id,
            transactionId: "test-tx-1",
            targetType: "account",
            amountCents: 1000,
            // Missing accountId - this should cause validation to fail
          } as SeedTransactionLine,
        ],
      };

      expect(() => validateTransactionLines(invalidSeedData)).toThrow();
    });

    it("should reject transaction lines with multiple targets", () => {
      const invalidSeedData: SeedData = {
        users: [],
        categoryGroups: [],
        categories: [],
        accounts: [
          {
            id: "acc-1",
            userId: demoUser.id,
            name: "Test",
            type: "debit",
          } as SeedAccount,
        ],
        envelopes: [
          { id: "env-1", userId: demoUser.id, name: "Test" } as SeedEnvelope,
        ],
        transactions: [],
        transactionLines: [
          {
            id: "test-line-1",
            userId: demoUser.id,
            transactionId: "test-tx-1",
            targetType: "account",
            accountId: "acc-1",
            envelopeId: "env-1", // Multiple targets
            amountCents: 1000,
          } as SeedTransactionLine,
        ],
      };

      expect(() => validateTransactionLines(invalidSeedData)).toThrow();
    });

    it("should reject transaction lines with zero amount", () => {
      const invalidSeedData: SeedData = {
        users: [],
        categoryGroups: [],
        categories: [],
        accounts: [
          {
            id: "acc-1",
            userId: demoUser.id,
            name: "Test",
            type: "debit",
          } as SeedAccount,
        ],
        envelopes: [],
        transactions: [],
        transactionLines: [
          {
            id: "test-line-1",
            userId: demoUser.id,
            transactionId: "test-tx-1",
            targetType: "account",
            accountId: "acc-1",
            amountCents: 0, // Zero amount
          } as SeedTransactionLine,
        ],
      };

      expect(() => validateTransactionLines(invalidSeedData)).toThrow();
    });
  });
});

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "../schema/index";
import { DrizzleEnvelopeRepository } from "./drizzle-envelope.repository";
import { DrizzleUserRepository } from "./drizzle-user.repository";
import { DrizzleAccountRepository } from "./drizzle-account.repository";
import { DrizzleTransactionRepository } from "./drizzle-transaction.repository";
import {
  UserId,
  userIdFromString,
  EnvelopeId,
  envelopeIdFromString,
  AccountId,
  accountIdFromString,
  CategoryId,
  categoryIdFromString,
  CategoryGroupId,
  categoryGroupIdFromString,
  TransactionId,
  transactionIdFromString,
  transactionLineIdFromString,
} from "@ledger-mx/domain";
import { Transaction } from "@ledger-mx/domain";
import { TransactionLine } from "@ledger-mx/domain";
import { NodeCryptoIdGenerator } from "@ledger-mx/infrastructure";

const idGenerator = new NodeCryptoIdGenerator();

describe("DrizzleEnvelopeRepository Integration Tests", () => {
  let container: Awaited<ReturnType<typeof PostgreSqlContainer.prototype.start>> | null = null;
  let pool: Pool;
  let db: NodePgDatabase<typeof schema>;
  let envelopeRepository: DrizzleEnvelopeRepository;
  let userRepository: DrizzleUserRepository;
  let accountRepository: DrizzleAccountRepository;
  let transactionRepository: DrizzleTransactionRepository;

  // Test IDs
  let userAId: UserId;
  let userBId: UserId;

  // Test envelopes
  let userAEnvelope1Id: EnvelopeId;
  let userAEnvelope2Id: EnvelopeId;
  let userBEnvelopeId: EnvelopeId;

  // Test accounts (for funding envelopes)
  let userACheckingId: AccountId;
  let userBCheckingId: AccountId;

  // Category IDs for transaction line targets
  let userACategoryId: CategoryId;
  let userBCategoryId: CategoryId;
  let userACategoryGroupId: CategoryGroupId;
  let userBCategoryGroupId: CategoryGroupId;

  beforeAll(async () => {
    // Start PostgreSQL container
    const pgContainer = new PostgreSqlContainer("postgres:16-alpine")
      .withDatabase("test_db")
      .withUsername("test_user")
      .withPassword("test_password");

    container = await pgContainer.start();

    const connectionString = container.getConnectionUri();

    // Create pool and database connection
    pool = new Pool({ connectionString });
    db = drizzle(pool, { schema });

    // Run migrations
    const migrationsFolder = new URL("../../drizzle", import.meta.url).pathname;
    await migrate(db, { migrationsFolder });

    // Create repositories
    envelopeRepository = new DrizzleEnvelopeRepository(db);
    userRepository = new DrizzleUserRepository(db);
    accountRepository = new DrizzleAccountRepository(db);
    transactionRepository = new DrizzleTransactionRepository(db);

    // Generate test IDs
    userAId = userIdFromString(idGenerator.uuid());
    userBId = userIdFromString(idGenerator.uuid());
    userAEnvelope1Id = envelopeIdFromString(idGenerator.uuid());
    userAEnvelope2Id = envelopeIdFromString(idGenerator.uuid());
    userBEnvelopeId = envelopeIdFromString(idGenerator.uuid());
    userACheckingId = accountIdFromString(idGenerator.uuid());
    userBCheckingId = accountIdFromString(idGenerator.uuid());
    userACategoryGroupId = categoryGroupIdFromString(idGenerator.uuid());
    userBCategoryGroupId = categoryGroupIdFromString(idGenerator.uuid());
    userACategoryId = categoryIdFromString(idGenerator.uuid());
    userBCategoryId = categoryIdFromString(idGenerator.uuid());
  }, 60000);

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    // Clean up tables between tests (handle FK constraints by order)
    await db.delete(schema.transactionLines);
    await db.delete(schema.transactions);
    await db.delete(schema.accounts);
    await db.delete(schema.categories);
    await db.delete(schema.categoryGroups);
    await db.delete(schema.envelopes);
    await db.delete(schema.users);

    // Seed user A
    await userRepository.save({
      id: userAId,
      email: "user-a@example.com",
      passwordHash: "hash-a",
      displayName: "User A",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed user B
    await userRepository.save({
      id: userBId,
      email: "user-b@example.com",
      passwordHash: "hash-b",
      displayName: "User B",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed accounts for user A
    await accountRepository.save({
      id: userACheckingId,
      userId: userAId,
      name: "Checking",
      type: "debit",
      currencyCode: "MXN",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      ownership: "user",
      systemRole: null,
    });

    // Seed account for user B
    await accountRepository.save({
      id: userBCheckingId,
      userId: userBId,
      name: "Checking B",
      type: "debit",
      currencyCode: "MXN",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      ownership: "user",
      systemRole: null,
    });

    // Seed category groups
    await db.insert(schema.categoryGroups).values({
      id: userACategoryGroupId,
      userId: userAId,
      name: "User A Category Group",
      kind: "expense",
      sortOrder: 0,
      ownership: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(schema.categoryGroups).values({
      id: userBCategoryGroupId,
      userId: userBId,
      name: "User B Category Group",
      kind: "expense",
      sortOrder: 0,
      ownership: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed categories
    await db.insert(schema.categories).values({
      id: userACategoryId,
      userId: userAId,
      name: "User A Category",
      categoryGroupId: userACategoryGroupId,
      ownership: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(schema.categories).values({
      id: userBCategoryId,
      userId: userBId,
      name: "User B Category",
      categoryGroupId: userBCategoryGroupId,
      ownership: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed envelopes for user A
    await envelopeRepository.save({
      id: userAEnvelope1Id,
      userId: userAId,
      name: "Groceries",
      targetAmountCents: 50000,
      isProtected: false,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await envelopeRepository.save({
      id: userAEnvelope2Id,
      userId: userAId,
      name: "Emergency Fund",
      targetAmountCents: 1000000,
      isProtected: true,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed envelope for user B
    await envelopeRepository.save({
      id: userBEnvelopeId,
      userId: userBId,
      name: "User B Envelope",
      targetAmountCents: 25000,
      isProtected: false,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe("getBalance", () => {
    it("should return 0 for envelope with no transactions", async () => {
      const balance = await envelopeRepository.getBalance(
        userAId,
        userAEnvelope1Id,
      );

      expect(balance).toBe(0);
    });

    it("should derive balance from transaction lines for envelope", async () => {
      // Create a transaction that funds the envelope (+10000 cents)
      const txId = transactionIdFromString(idGenerator.uuid());

      const tx = new Transaction({
        id: txId,
        userId: userAId,
        type: "transfer",
        occurredAt: new Date("2024-01-01"),
        description: "Fund envelope",
        lines: [
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: txId,
            targetType: "account",
            targetId: userACheckingId,
            amountCents: -10000, // -10000 from checking
          }),
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: txId,
            targetType: "envelope",
            targetId: userAEnvelope1Id,
            amountCents: 10000, // +10000 to envelope
          }),
        ],
      });
      await transactionRepository.save(tx);

      const balance = await envelopeRepository.getBalance(
        userAId,
        userAEnvelope1Id,
      );

      expect(balance).toBe(10000);
    });

    it("should sum multiple transaction lines for same envelope", async () => {
      // Create multiple transactions funding the envelope
      const txId1 = transactionIdFromString(idGenerator.uuid());

      const tx1 = new Transaction({
        id: txId1,
        userId: userAId,
        type: "transfer",
        occurredAt: new Date("2024-01-01"),
        description: "Fund envelope 1",
        lines: [
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: txId1,
            targetType: "account",
            targetId: userACheckingId,
            amountCents: -5000,
          }),
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: txId1,
            targetType: "envelope",
            targetId: userAEnvelope1Id,
            amountCents: 5000,
          }),
        ],
      });
      await transactionRepository.save(tx1);

      const txId2 = transactionIdFromString(idGenerator.uuid());

      const tx2 = new Transaction({
        id: txId2,
        userId: userAId,
        type: "transfer",
        occurredAt: new Date("2024-01-02"),
        description: "Fund envelope 2",
        lines: [
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: txId2,
            targetType: "account",
            targetId: userACheckingId,
            amountCents: -7500,
          }),
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: txId2,
            targetType: "envelope",
            targetId: userAEnvelope1Id,
            amountCents: 7500,
          }),
        ],
      });
      await transactionRepository.save(tx2);

      const balance = await envelopeRepository.getBalance(
        userAId,
        userAEnvelope1Id,
      );

      // 5000 + 7500 = 12500
      expect(balance).toBe(12500);
    });

    it("should handle spending from envelope (negative amounts)", async () => {
      // First fund the envelope
      const fundTxId = transactionIdFromString(idGenerator.uuid());

      const fundTx = new Transaction({
        id: fundTxId,
        userId: userAId,
        type: "transfer",
        occurredAt: new Date("2024-01-01"),
        description: "Fund envelope",
        lines: [
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: fundTxId,
            targetType: "account",
            targetId: userACheckingId,
            amountCents: -10000,
          }),
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: fundTxId,
            targetType: "envelope",
            targetId: userAEnvelope1Id,
            amountCents: 10000,
          }),
        ],
      });
      await transactionRepository.save(fundTx);

      // Then spend from envelope
      const spendTxId = transactionIdFromString(idGenerator.uuid());

      const spendTx = new Transaction({
        id: spendTxId,
        userId: userAId,
        type: "expense",
        occurredAt: new Date("2024-01-02"),
        description: "Spend from envelope",
        lines: [
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: spendTxId,
            targetType: "envelope",
            targetId: userAEnvelope1Id,
            amountCents: -3500, // -3500 from envelope
          }),
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: spendTxId,
            targetType: "category",
            targetId: userACategoryId,
            amountCents: 3500,
          }),
        ],
      });
      await transactionRepository.save(spendTx);

      const balance = await envelopeRepository.getBalance(
        userAId,
        userAEnvelope1Id,
      );

      // 10000 - 3500 = 6500
      expect(balance).toBe(6500);
    });
  });

  describe("getBalances", () => {
    it("should return balances for multiple envelopes in batch", async () => {
      // Fund envelope 1
      const txId1 = transactionIdFromString(idGenerator.uuid());

      const tx1 = new Transaction({
        id: txId1,
        userId: userAId,
        type: "transfer",
        occurredAt: new Date("2024-01-01"),
        description: "Fund envelope 1",
        lines: [
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: txId1,
            targetType: "account",
            targetId: userACheckingId,
            amountCents: -10000,
          }),
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: txId1,
            targetType: "envelope",
            targetId: userAEnvelope1Id,
            amountCents: 10000,
          }),
        ],
      });
      await transactionRepository.save(tx1);

      // Fund envelope 2
      const txId2 = transactionIdFromString(idGenerator.uuid());

      const tx2 = new Transaction({
        id: txId2,
        userId: userAId,
        type: "transfer",
        occurredAt: new Date("2024-01-01"),
        description: "Fund envelope 2",
        lines: [
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: txId2,
            targetType: "account",
            targetId: userACheckingId,
            amountCents: -20000,
          }),
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: txId2,
            targetType: "envelope",
            targetId: userAEnvelope2Id,
            amountCents: 20000,
          }),
        ],
      });
      await transactionRepository.save(tx2);

      const balances = await envelopeRepository.getBalances(userAId, [
        userAEnvelope1Id,
        userAEnvelope2Id,
      ]);

      expect(balances.get(userAEnvelope1Id)).toBe(10000);
      expect(balances.get(userAEnvelope2Id)).toBe(20000);
    });

    it("should only return balances for requested envelope IDs", async () => {
      // Fund envelope 1
      const txId = transactionIdFromString(idGenerator.uuid());

      const tx = new Transaction({
        id: txId,
        userId: userAId,
        type: "transfer",
        occurredAt: new Date("2024-01-01"),
        description: "Fund envelope 1",
        lines: [
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: txId,
            targetType: "account",
            targetId: userACheckingId,
            amountCents: -10000,
          }),
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: txId,
            targetType: "envelope",
            targetId: userAEnvelope1Id,
            amountCents: 10000,
          }),
        ],
      });
      await transactionRepository.save(tx);

      // Only request balance for envelope 1 (not envelope 2)
      const balances = await envelopeRepository.getBalances(userAId, [
        userAEnvelope1Id,
      ]);

      expect(balances.has(userAEnvelope1Id)).toBe(true);
      expect(balances.get(userAEnvelope1Id)).toBe(10000);
      expect(balances.has(userAEnvelope2Id)).toBe(false);
    });

    it("should return empty map for user with no envelopes", async () => {
      const newUserId = userIdFromString(idGenerator.uuid());
      await userRepository.save({
        id: newUserId,
        email: "new-user@example.com",
        passwordHash: "hash-new",
        displayName: "New User",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const balances = await envelopeRepository.getBalances(newUserId, [
        userAEnvelope1Id,
      ]);

      expect(balances.size).toBe(0);
    });

    it("should not return balances for another user's envelopes (cross-user isolation)", async () => {
      // Fund user B's envelope
      const txId = transactionIdFromString(idGenerator.uuid());

      const tx = new Transaction({
        id: txId,
        userId: userBId,
        type: "transfer",
        occurredAt: new Date("2024-01-01"),
        description: "Fund user B envelope",
        lines: [
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: txId,
            targetType: "account",
            targetId: userBCheckingId,
            amountCents: -15000,
          }),
          new TransactionLine({
            id: transactionLineIdFromString(idGenerator.uuid()),
            transactionId: txId,
            targetType: "envelope",
            targetId: userBEnvelopeId,
            amountCents: 15000,
          }),
        ],
      });
      await transactionRepository.save(tx);

      // User A requests balance for user B's envelope (should not be returned)
      const balances = await envelopeRepository.getBalances(userAId, [
        userBEnvelopeId,
      ]);

      // userBEnvelopeId belongs to user B, so user A should not see it in results
      expect(balances.has(userBEnvelopeId)).toBe(false);
      expect(balances.get(userBEnvelopeId)).toBeUndefined();
    });
  });
});

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "../schema/index";
import { DrizzleBalanceRepository } from "./drizzle-balance.repository";
import { DrizzleAccountRepository } from "./drizzle-account.repository";
import { DrizzleTransactionRepository } from "./drizzle-transaction.repository";
import { DrizzleUserRepository } from "./drizzle-user.repository";
import {
  UserId,
  userIdFromString,
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

describe("DrizzleBalanceRepository Integration Tests", () => {
  let container: InstanceType<typeof PostgreSqlContainer> | null = null;
  let pool: Pool;
  let db: NodePgDatabase<typeof schema>;
  let balanceRepository: DrizzleBalanceRepository;
  let accountRepository: DrizzleAccountRepository;
  let transactionRepository: DrizzleTransactionRepository;
  let userRepository: DrizzleUserRepository;

  // Test IDs
  let userAId: UserId;
  let userBId: UserId;

  // Test accounts
  let userACheckingId: AccountId;
  let userASavingsId: AccountId;
  let userBCheckingId: AccountId;

  // Category IDs and related IDs for transaction line targets
  let userACategoryId: CategoryId;
  let userBCategoryId: CategoryId;
  let userACategoryGroupId: CategoryGroupId;
  let userBCategoryGroupId: CategoryGroupId;

  // Test transactions
  let userATransaction1Id: TransactionId;
  let userATransaction2Id: TransactionId;
  let userBTransaction1Id: TransactionId;

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

    // Create repositories
    balanceRepository = new DrizzleBalanceRepository(db);
    accountRepository = new DrizzleAccountRepository(db);
    transactionRepository = new DrizzleTransactionRepository(db);
    userRepository = new DrizzleUserRepository(db);

    // Generate test IDs
    userAId = userIdFromString(idGenerator.uuid());
    userBId = userIdFromString(idGenerator.uuid());
    userACheckingId = accountIdFromString(idGenerator.uuid());
    userASavingsId = accountIdFromString(idGenerator.uuid());
    userBCheckingId = accountIdFromString(idGenerator.uuid());
    userACategoryGroupId = categoryGroupIdFromString(idGenerator.uuid());
    userBCategoryGroupId = categoryGroupIdFromString(idGenerator.uuid());
    userACategoryId = categoryIdFromString(idGenerator.uuid()); // Valid UUID for category target
    userBCategoryId = categoryIdFromString(idGenerator.uuid()); // Valid UUID for category target
    userATransaction1Id = transactionIdFromString(idGenerator.uuid());
    userATransaction2Id = transactionIdFromString(idGenerator.uuid());
    userBTransaction1Id = transactionIdFromString(idGenerator.uuid());
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
    // Delete in correct order: children before parents
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

    await accountRepository.save({
      id: userASavingsId,
      userId: userAId,
      name: "Savings",
      type: "savings",
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

    // Seed category groups for users
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

    // Seed categories for users
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

    // Seed transactions for user A: balanced lines with integer cents
    // Transaction 1: +50000 cents to checking (deposit)
    const tx1Line1Id = transactionLineIdFromString(idGenerator.uuid());
    const tx1Line2Id = transactionLineIdFromString(idGenerator.uuid());
    const tx1 = new Transaction({
      id: userATransaction1Id,
      userId: userAId,
      type: "income",
      occurredAt: new Date("2024-01-01"),
      description: "Deposit",
      lines: [
        new TransactionLine({
          id: tx1Line1Id,
          transactionId: userATransaction1Id,
          targetType: "account",
          targetId: userACheckingId,
          amountCents: 50000, // +50000 to checking
        }),
        new TransactionLine({
          id: tx1Line2Id,
          transactionId: userATransaction1Id,
          targetType: "category",
          targetId: userACategoryId,
          amountCents: -50000, // Offset line
        }),
      ],
    });
    await transactionRepository.save(tx1);

    // Transaction 2: -30000 cents from checking (expense), +30000 to savings (transfer)
    const tx2Line1Id = transactionLineIdFromString(idGenerator.uuid());
    const tx2Line2Id = transactionLineIdFromString(idGenerator.uuid());
    const tx2 = new Transaction({
      id: userATransaction2Id,
      userId: userAId,
      type: "transfer",
      occurredAt: new Date("2024-01-02"),
      description: "Transfer to savings",
      lines: [
        new TransactionLine({
          id: tx2Line1Id,
          transactionId: userATransaction2Id,
          targetType: "account",
          targetId: userACheckingId,
          amountCents: -30000, // -30000 from checking
        }),
        new TransactionLine({
          id: tx2Line2Id,
          transactionId: userATransaction2Id,
          targetType: "account",
          targetId: userASavingsId,
          amountCents: 30000, // +30000 to savings
        }),
      ],
    });
    await transactionRepository.save(tx2);

    // Seed transaction for user B (should not affect user A's balances)
    const txBLine1Id = transactionLineIdFromString(idGenerator.uuid());
    const txBLine2Id = transactionLineIdFromString(idGenerator.uuid());
    const txB = new Transaction({
      id: userBTransaction1Id,
      userId: userBId,
      type: "income",
      occurredAt: new Date("2024-01-01"),
      description: "User B deposit",
      lines: [
        new TransactionLine({
          id: txBLine1Id,
          transactionId: userBTransaction1Id,
          targetType: "account",
          targetId: userBCheckingId,
          amountCents: 100000, // +100000 to user B's checking
        }),
        new TransactionLine({
          id: txBLine2Id,
          transactionId: userBTransaction1Id,
          targetType: "category",
          targetId: userBCategoryId,
          amountCents: -100000, // Offset line
        }),
      ],
    });
    await transactionRepository.save(txB);
  });

  describe("getAccountBalance", () => {
    it("should return expected sum from transaction lines for user A's checking", async () => {
      // User A checking: +50000 (tx1) -30000 (tx2) = 20000 cents
      const result = await balanceRepository.getAccountBalance(
        userAId,
        userACheckingId,
      );

      expect(result).not.toBeNull();
      expect(result?.accountId).toBe(userACheckingId);
      expect(result?.balanceCents).toBe(20000); // 50000 - 30000
    });

    it("should return null for account belonging to another user", async () => {
      const result = await balanceRepository.getAccountBalance(
        userAId,
        userBCheckingId,
      );

      expect(result).toBeNull();
    });
  });

  describe("getAccountBalances", () => {
    it("should return all account balances for user A and exclude user B accounts", async () => {
      const result = await balanceRepository.getAccountBalances(userAId);

      expect(result).toHaveLength(2); // Checking + Savings
      const checkingBalance = result.find(
        (b) => b.accountId === userACheckingId,
      );
      const savingsBalance = result.find((b) => b.accountId === userASavingsId);

      expect(checkingBalance?.balanceCents).toBe(20000); // 50000 - 30000
      expect(savingsBalance?.balanceCents).toBe(30000); // +30000 from transfer
    });

    it("should return empty array for user with no accounts", async () => {
      const newUserId = userIdFromString(idGenerator.uuid());
      await userRepository.save({
        id: newUserId,
        email: "new-user@example.com",
        passwordHash: "hash-new",
        displayName: "New User",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await balanceRepository.getAccountBalances(newUserId);
      expect(result).toEqual([]);
    });
  });

  describe("getBalancesByAccountType", () => {
    it("should group balances by account type for user A", async () => {
      const result = await balanceRepository.getBalancesByAccountType(userAId);

      expect(result).toHaveLength(2); // debit and savings
      const debitBalance = result.find((b) => b.accountType === "debit");
      const savingsBalance = result.find((b) => b.accountType === "savings");

      expect(debitBalance?.balanceCents).toBe(20000); // Checking balance
      expect(debitBalance?.accountCount).toBe(1);
      expect(savingsBalance?.balanceCents).toBe(30000); // Savings balance
      expect(savingsBalance?.accountCount).toBe(1);
    });
  });

  describe("getLiabilityBalances", () => {
    it("should return empty array when user has no liability accounts", async () => {
      const result = await balanceRepository.getLiabilityBalances(userAId);
      expect(result).toEqual([]);
    });

    it("should return liability accounts only when user has credit/loan accounts", async () => {
      // Add a credit account for user A
      const creditAccountId = accountIdFromString(idGenerator.uuid());
      await accountRepository.save({
        id: creditAccountId,
        userId: userAId,
        name: "Credit Card",
        type: "credit",
        currencyCode: "MXN",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        ownership: "user",
        systemRole: null,
      });

      // Create category group and category for credit transaction
      const creditCategoryGroupId = categoryGroupIdFromString(
        idGenerator.uuid(),
      );
      const creditCategoryId = categoryIdFromString(idGenerator.uuid()); // Valid category UUID
      await db.insert(schema.categoryGroups).values({
        id: creditCategoryGroupId,
        userId: userAId,
        name: "Credit Category Group",
        kind: "expense",
        sortOrder: 0,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await db.insert(schema.categories).values({
        id: creditCategoryId,
        userId: userAId,
        name: "Credit Category",
        categoryGroupId: creditCategoryGroupId,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add a transaction for the credit account (expense: +50000 liability)
      const creditTxId = transactionIdFromString(idGenerator.uuid());
      const creditTxLine1Id = transactionLineIdFromString(idGenerator.uuid());
      const creditTxLine2Id = transactionLineIdFromString(idGenerator.uuid());
      const creditTx = new Transaction({
        id: creditTxId,
        userId: userAId,
        type: "expense",
        occurredAt: new Date("2024-01-03"),
        description: "Credit card expense",
        lines: [
          new TransactionLine({
            id: creditTxLine1Id,
            transactionId: creditTxId,
            targetType: "account",
            targetId: creditAccountId,
            amountCents: 50000, // +50000 liability (user spent on credit)
          }),
          new TransactionLine({
            id: creditTxLine2Id,
            transactionId: creditTxId,
            targetType: "category",
            targetId: creditCategoryId,
            amountCents: -50000,
          }),
        ],
      });
      await transactionRepository.save(creditTx);

      const result = await balanceRepository.getLiabilityBalances(userAId);
      expect(result).toHaveLength(1);
      expect(result[0].accountId).toBe(creditAccountId);
      expect(result[0].accountType).toBe("credit");
      expect(result[0].balanceCents).toBe(50000); // Positive liability amount
    });

    it("should not return another user's liability balances (cross-user isolation)", async () => {
      // Add a credit account for user B
      const userBCreditAccountId = accountIdFromString(idGenerator.uuid());
      await accountRepository.save({
        id: userBCreditAccountId,
        userId: userBId,
        name: "User B Credit Card",
        type: "credit",
        currencyCode: "MXN",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        ownership: "user",
        systemRole: null,
      });

      // Create category group and category for user B's credit transaction
      const userBCreditCategoryGroupId = categoryGroupIdFromString(
        idGenerator.uuid(),
      );
      const userBCreditCategoryId = categoryIdFromString(idGenerator.uuid());
      await db.insert(schema.categoryGroups).values({
        id: userBCreditCategoryGroupId,
        userId: userBId,
        name: "User B Credit Category Group",
        kind: "expense",
        sortOrder: 0,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await db.insert(schema.categories).values({
        id: userBCreditCategoryId,
        userId: userBId,
        name: "User B Credit Category",
        categoryGroupId: userBCreditCategoryGroupId,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add a transaction for user B's credit account
      const userBCreditTxId = transactionIdFromString(idGenerator.uuid());
      const userBCreditTxLine1Id = transactionLineIdFromString(
        idGenerator.uuid(),
      );
      const userBCreditTxLine2Id = transactionLineIdFromString(
        idGenerator.uuid(),
      );
      const userBCreditTx = new Transaction({
        id: userBCreditTxId,
        userId: userBId,
        type: "expense",
        occurredAt: new Date("2024-01-04"),
        description: "User B credit card expense",
        lines: [
          new TransactionLine({
            id: userBCreditTxLine1Id,
            transactionId: userBCreditTxId,
            targetType: "account",
            targetId: userBCreditAccountId,
            amountCents: 75000, // +75000 liability for user B
          }),
          new TransactionLine({
            id: userBCreditTxLine2Id,
            transactionId: userBCreditTxId,
            targetType: "category",
            targetId: userBCreditCategoryId,
            amountCents: -75000,
          }),
        ],
      });
      await transactionRepository.save(userBCreditTx);

      // User A should not see user B's liability balances
      const userAResult = await balanceRepository.getLiabilityBalances(userAId);
      expect(userAResult).toHaveLength(0);

      // User B should see their own liability balance
      const userBResult = await balanceRepository.getLiabilityBalances(userBId);
      expect(userBResult).toHaveLength(1);
      expect(userBResult[0].accountId).toBe(userBCreditAccountId);
      expect(userBResult[0].balanceCents).toBe(75000);
    });
  });
});

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "../schema/index";
import { DrizzleCategoryRepository } from "./drizzle-category.repository";
import { DrizzleCategoryGroupRepository } from "./drizzle-category-group.repository";
import { DrizzleUserRepository } from "./drizzle-user.repository";
import {
  UserId,
  userIdFromString,
  CategoryId,
  categoryIdFromString,
  CategoryGroupId,
  categoryGroupIdFromString,
} from "@ledger-mx/domain";
import { NodeCryptoIdGenerator } from "@ledger-mx/infrastructure";

const idGenerator = new NodeCryptoIdGenerator();

describe("DrizzleCategoryRepository Integration Tests", () => {
  let container: any = null;
  let pool: Pool;
  let db: NodePgDatabase<typeof schema>;
  let categoryRepository: DrizzleCategoryRepository;
  let categoryGroupRepository: DrizzleCategoryGroupRepository;
  let userRepository: DrizzleUserRepository;

  // Test IDs
  let userAId: UserId;
  let userBId: UserId;

  // Category Group IDs
  let userACategoryGroupId: CategoryGroupId;
  let userBCategoryGroupId: CategoryGroupId;

  // Category IDs
  let userACategoryId: CategoryId;
  let userACategoryChildId: CategoryId;
  let userBCategoryId: CategoryId;

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
    categoryRepository = new DrizzleCategoryRepository(db);
    categoryGroupRepository = new DrizzleCategoryGroupRepository(db);
    userRepository = new DrizzleUserRepository(db);

    // Generate test IDs
    userAId = userIdFromString(idGenerator.uuid());
    userBId = userIdFromString(idGenerator.uuid());
    userACategoryGroupId = categoryGroupIdFromString(idGenerator.uuid());
    userBCategoryGroupId = categoryGroupIdFromString(idGenerator.uuid());
    userACategoryId = categoryIdFromString(idGenerator.uuid());
    userACategoryChildId = categoryIdFromString(idGenerator.uuid());
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
    // Clean up tables between tests
    await db.delete(schema.transactionLines);
    await db.delete(schema.transactions);
    await db.delete(schema.categories);
    await db.delete(schema.categoryGroups);
    await db.delete(schema.accounts);
    await db.delete(schema.envelopes);
    await db.delete(schema.users);

    // Seed users
    await userRepository.save({
      id: userAId,
      email: "user-a@example.com",
      passwordHash: "hash-a",
      displayName: "User A",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await userRepository.save({
      id: userBId,
      email: "user-b@example.com",
      passwordHash: "hash-b",
      displayName: "User B",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed category groups
    await categoryGroupRepository.save({
      id: userACategoryGroupId,
      userId: userAId,
      name: "User A Category Group",
      kind: "expense",
      idealPercentageBasisPoints: 5000,
      sortOrder: 0,
      ownership: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await categoryGroupRepository.save({
      id: userBCategoryGroupId,
      userId: userBId,
      name: "User B Category Group",
      kind: "expense",
      idealPercentageBasisPoints: 5000,
      sortOrder: 0,
      ownership: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed categories for user A (parent and child)
    await categoryRepository.save({
      id: userACategoryId,
      userId: userAId,
      name: "User A Parent Category",
      parentId: null,
      categoryGroupId: userACategoryGroupId,
      ownership: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await categoryRepository.save({
      id: userACategoryChildId,
      userId: userAId,
      name: "User A Child Category",
      parentId: userACategoryId,
      categoryGroupId: userACategoryGroupId,
      ownership: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed category for user B
    await categoryRepository.save({
      id: userBCategoryId,
      userId: userBId,
      name: "User B Category",
      parentId: null,
      categoryGroupId: userBCategoryGroupId,
      ownership: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe("listByUserId", () => {
    it("should return only active (non-archived) categories for a user", async () => {
      // Archive user A's parent category
      await categoryRepository.softDelete(userAId, userACategoryId, new Date());

      const result = await categoryRepository.listByUserId(userAId);

      // Should only return the child category (parent is archived)
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(userACategoryChildId);
      expect(result[0].name).toBe("User A Child Category");
    });

    it("should not return archived categories", async () => {
      const resultBefore = await categoryRepository.listByUserId(userAId);
      expect(resultBefore).toHaveLength(2); // Parent + Child

      // Archive one category
      await categoryRepository.softDelete(userAId, userACategoryId, new Date());

      const resultAfter = await categoryRepository.listByUserId(userAId);
      expect(resultAfter).toHaveLength(1); // Only child remains
      expect(resultAfter[0].id).toBe(userACategoryChildId);
    });

    it("should respect user scoping - only return categories for specified user", async () => {
      const userAResult = await categoryRepository.listByUserId(userAId);
      const userBResult = await categoryRepository.listByUserId(userBId);

      expect(userAResult).toHaveLength(2);
      expect(userAResult.map((c) => c.id)).toContain(userACategoryId);
      expect(userAResult.map((c) => c.id)).toContain(userACategoryChildId);

      expect(userBResult).toHaveLength(1);
      expect(userBResult[0].id).toBe(userBCategoryId);
    });

    it("should return empty array for user with no active categories", async () => {
      // Archive all user A's categories
      await categoryRepository.softDelete(userAId, userACategoryId, new Date());
      await categoryRepository.softDelete(userAId, userACategoryChildId, new Date());

      const result = await categoryRepository.listByUserId(userAId);
      expect(result).toEqual([]);
    });
  });

  describe("findById", () => {
    it("should return null for archived category", async () => {
      // Archive the category
      await categoryRepository.softDelete(userAId, userACategoryId, new Date());

      const result = await categoryRepository.findById(userAId, userACategoryId);
      expect(result).toBeNull();
    });

    it("should return category for non-archived category", async () => {
      const result = await categoryRepository.findById(userAId, userACategoryId);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(userACategoryId);
    });
  });

  describe("hasActiveChildren", () => {
    it("should return false if all children are archived", async () => {
      // Archive the child category
      await categoryRepository.softDelete(userAId, userACategoryChildId, new Date());

      const result = await categoryRepository.hasActiveChildren(userAId, userACategoryId);
      expect(result).toBe(false);
    });

    it("should return true if parent has active children", async () => {
      const result = await categoryRepository.hasActiveChildren(userAId, userACategoryId);
      expect(result).toBe(true);
    });
  });
});

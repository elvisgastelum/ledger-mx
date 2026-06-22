import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "../schema/index";
import { DrizzleUserRepository } from "./drizzle-user.repository";
import { DrizzleSessionRepository } from "./drizzle-session.repository";
import { DrizzleAuthAuditLogRepository } from "./drizzle-auth-audit-log.repository";
import { AuthUser, AuthSession, AuthAuditLog, SessionId, sessionIdFromString, UserId, userIdFromString } from "@ledger-mx/domain";
import { NodeCryptoIdGenerator } from "@ledger-mx/infrastructure";

const idGenerator = new NodeCryptoIdGenerator();

describe("Auth Repositories Integration Tests", () => {
  let container: InstanceType<typeof PostgreSqlContainer> | null = null;
  let pool: Pool;
  let db: NodePgDatabase<typeof schema>;
  let userRepository: DrizzleUserRepository;
  let sessionRepository: DrizzleSessionRepository;
  let auditLogRepository: DrizzleAuthAuditLogRepository;

  const testUser1Id: UserId = userIdFromString(idGenerator.uuid());
  const testUser2Id: UserId = userIdFromString(idGenerator.uuid());

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
    const migrationsFolder = new URL(
      "../../drizzle",
      import.meta.url,
    ).pathname;
    await migrate(db, { migrationsFolder });

    // Create repositories
    userRepository = new DrizzleUserRepository(db);
    sessionRepository = new DrizzleSessionRepository(db);
    auditLogRepository = new DrizzleAuthAuditLogRepository(db);
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
    await db.delete(schema.authAuditLogs);
    await db.delete(schema.sessions);
    await db.delete(schema.users);
  });

  describe("DrizzleUserRepository", () => {
    it("should save a new user and retrieve by email", async () => {
      const user: AuthUser = {
        id: testUser1Id,
        email: "test@example.com",
        passwordHash: "hashed_password_123",
        displayName: "Test User",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      await userRepository.save(user);

      const found = await userRepository.findByEmail("test@example.com");
      expect(found).not.toBeNull();
      expect(found?.id).toBe(testUser1Id);
      expect(found?.email).toBe("test@example.com");
      expect(found?.passwordHash).toBe("hashed_password_123");
      expect(found?.displayName).toBe("Test User");
    });

    it("should save a new user and retrieve by id", async () => {
      const user: AuthUser = {
        id: testUser1Id,
        email: "test2@example.com",
        passwordHash: "hashed_password_456",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      await userRepository.save(user);

      const found = await userRepository.findById(testUser1Id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(testUser1Id);
      expect(found?.email).toBe("test2@example.com");
    });

    it("should return null for non-existent email", async () => {
      const found = await userRepository.findByEmail("nonexistent@example.com");
      expect(found).toBeNull();
    });

    it("should return null for non-existent id", async () => {
      const found = await userRepository.findById(userIdFromString(idGenerator.uuid()));
      expect(found).toBeNull();
    });

    it("should update existing user on save (upsert)", async () => {
      const user: AuthUser = {
        id: testUser1Id,
        email: "upsert@example.com",
        passwordHash: "original_hash",
        displayName: "Original Name",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      await userRepository.save(user);

      // Update user
      const updatedUser: AuthUser = {
        ...user,
        passwordHash: "updated_hash",
        displayName: "Updated Name",
        updatedAt: new Date("2024-01-02T00:00:00Z"),
      };

      await userRepository.save(updatedUser);

      const found = await userRepository.findById(testUser1Id);
      expect(found?.passwordHash).toBe("updated_hash");
      expect(found?.displayName).toBe("Updated Name");
    });

    it("should handle user with null passwordHash", async () => {
      const user: AuthUser = {
        id: testUser1Id,
        email: "nopassword@example.com",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      await userRepository.save(user);

      const found = await userRepository.findByEmail("nopassword@example.com");
      expect(found).not.toBeNull();
      expect(found?.passwordHash).toBeUndefined();
    });
  });

  describe("DrizzleSessionRepository", () => {
    beforeEach(async () => {
      // Create a user for session tests
      const user: AuthUser = {
        id: testUser1Id,
        email: "sessionuser@example.com",
        passwordHash: "hash",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };
      await userRepository.save(user);

      const user2: AuthUser = {
        id: testUser2Id,
        email: "sessionuser2@example.com",
        passwordHash: "hash",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };
      await userRepository.save(user2);
    });

    it("should save a session and find by refresh token hash", async () => {
      const sessionId: SessionId = sessionIdFromString(idGenerator.uuid());
      const session: AuthSession = {
        id: sessionId,
        userId: testUser1Id,
        refreshTokenHash: "sha256_hash_value_123",
        deviceName: "Chrome on Mac",
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0",
        lastActiveAt: new Date("2024-01-01T00:00:00Z"),
        expiresAt: new Date("2024-02-01T00:00:00Z"),
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      await sessionRepository.save(session);

      const found = await sessionRepository.findByRefreshTokenHash(
        "sha256_hash_value_123",
      );
      expect(found).not.toBeNull();
      expect(found?.id).toBe(sessionId);
      expect(found?.userId).toBe(testUser1Id);
      expect(found?.refreshTokenHash).toBe("sha256_hash_value_123");
      expect(found?.deviceName).toBe("Chrome on Mac");
    });

    it("should return null for non-existent refresh token hash", async () => {
      const found = await sessionRepository.findByRefreshTokenHash(
        "nonexistent_hash",
      );
      expect(found).toBeNull();
    });

    it("should revoke session scoped by userId - correct user", async () => {
      const sessionId: SessionId = sessionIdFromString(idGenerator.uuid());
      const session: AuthSession = {
        id: sessionId,
        userId: testUser1Id,
        refreshTokenHash: "revoke_test_hash",
        lastActiveAt: new Date("2024-01-01T00:00:00Z"),
        expiresAt: new Date("2024-02-01T00:00:00Z"),
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      await sessionRepository.save(session);

      const revokedAt = new Date("2024-01-15T00:00:00Z");
      await sessionRepository.revoke(sessionId, testUser1Id, revokedAt);

      // Verify session is revoked
      const found = await sessionRepository.findById(sessionId);
      expect(found?.revokedAt).toEqual(revokedAt);
    });

    it("should NOT revoke session when wrong userId is provided", async () => {
      const sessionId: SessionId = sessionIdFromString(idGenerator.uuid());
      const session: AuthSession = {
        id: sessionId,
        userId: testUser1Id,
        refreshTokenHash: "wrong_user_test_hash",
        lastActiveAt: new Date("2024-01-01T00:00:00Z"),
        expiresAt: new Date("2024-02-01T00:00:00Z"),
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      await sessionRepository.save(session);

      const revokedAt = new Date("2024-01-15T00:00:00Z");

      // Attempt to revoke with wrong userId (user2 instead of user1)
      await sessionRepository.revoke(sessionId, testUser2Id, revokedAt);

      // Verify session is NOT revoked (still null)
      const found = await sessionRepository.findById(sessionId);
      expect(found?.revokedAt).toBeUndefined();
    });

    it("should revokeAllForUser only revoke sessions for specific user", async () => {
      // Create multiple sessions for user1
      const session1Id: SessionId = sessionIdFromString(idGenerator.uuid());
      const session2Id: SessionId = sessionIdFromString(idGenerator.uuid());
      const session3Id: SessionId = sessionIdFromString(idGenerator.uuid()); // For user2

      const session1: AuthSession = {
        id: session1Id,
        userId: testUser1Id,
        refreshTokenHash: "user1_session1_hash",
        lastActiveAt: new Date("2024-01-01T00:00:00Z"),
        expiresAt: new Date("2024-02-01T00:00:00Z"),
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const session2: AuthSession = {
        id: session2Id,
        userId: testUser1Id,
        refreshTokenHash: "user1_session2_hash",
        lastActiveAt: new Date("2024-01-01T00:00:00Z"),
        expiresAt: new Date("2024-02-01T00:00:00Z"),
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const session3: AuthSession = {
        id: session3Id,
        userId: testUser2Id,
        refreshTokenHash: "user2_session_hash",
        lastActiveAt: new Date("2024-01-01T00:00:00Z"),
        expiresAt: new Date("2024-02-01T00:00:00Z"),
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      await sessionRepository.save(session1);
      await sessionRepository.save(session2);
      await sessionRepository.save(session3);

      // Revoke all sessions for user1
      const revokedAt = new Date("2024-01-15T00:00:00Z");
      await sessionRepository.revokeAllForUser(testUser1Id, revokedAt);

      // Verify user1 sessions are revoked
      const found1 = await sessionRepository.findById(session1Id);
      expect(found1?.revokedAt).toEqual(revokedAt);

      const found2 = await sessionRepository.findById(session2Id);
      expect(found2?.revokedAt).toEqual(revokedAt);

      // Verify user2 session is NOT revoked
      const found3 = await sessionRepository.findById(session3Id);
      expect(found3?.revokedAt).toBeUndefined();
    });

    it("should find active sessions by userId", async () => {
      const session1Id: SessionId = sessionIdFromString(idGenerator.uuid());
      const session2Id: SessionId = sessionIdFromString(idGenerator.uuid());

      const session1: AuthSession = {
        id: session1Id,
        userId: testUser1Id,
        refreshTokenHash: "active_session1_hash",
        lastActiveAt: new Date("2024-01-01T00:00:00Z"),
        expiresAt: new Date("2024-02-01T00:00:00Z"),
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const session2: AuthSession = {
        id: session2Id,
        userId: testUser1Id,
        refreshTokenHash: "active_session2_hash",
        lastActiveAt: new Date("2024-01-01T00:00:00Z"),
        expiresAt: new Date("2024-02-01T00:00:00Z"),
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      await sessionRepository.save(session1);
      await sessionRepository.save(session2);

      const activeSessions =
        await sessionRepository.findActiveByUserId(testUser1Id);
      expect(activeSessions).toHaveLength(2);
      expect(activeSessions.map((s) => s.id)).toContain(session1Id);
      expect(activeSessions.map((s) => s.id)).toContain(session2Id);
    });

    it("should not return revoked sessions in findActiveByUserId", async () => {
      const sessionId: SessionId = sessionIdFromString(idGenerator.uuid());

      const session: AuthSession = {
        id: sessionId,
        userId: testUser1Id,
        refreshTokenHash: "revoked_active_test",
        lastActiveAt: new Date("2024-01-01T00:00:00Z"),
        expiresAt: new Date("2024-02-01T00:00:00Z"),
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      await sessionRepository.save(session);

      // Revoke the session
      await sessionRepository.revoke(
        sessionId,
        testUser1Id,
        new Date("2024-01-10T00:00:00Z"),
      );

      const activeSessions =
        await sessionRepository.findActiveByUserId(testUser1Id);
      expect(activeSessions).toHaveLength(0);
    });
  });

  describe("DrizzleAuthAuditLogRepository", () => {
    beforeEach(async () => {
      // Create a user for audit log tests
      const user: AuthUser = {
        id: testUser1Id,
        email: "audituser@example.com",
        passwordHash: "hash",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };
      await userRepository.save(user);
    });

    it("should record an audit log entry", async () => {
      const auditLog: AuthAuditLog = {
        id: idGenerator.uuid(),
        userId: testUser1Id,
        eventType: "LOGIN_SUCCESS",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        metadata: { key: "value" },
        createdAt: new Date("2024-01-01T00:00:00Z"),
      };

      await auditLogRepository.record(auditLog);

      // Verify by querying the database directly
      const result = await db.select().from(schema.authAuditLogs).limit(1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(auditLog.id);
      expect(result[0].userId).toBe(testUser1Id);
      expect(result[0].eventType).toBe("LOGIN_SUCCESS");
      expect(result[0].ipAddress).toBe("192.168.1.1");
      expect(result[0].userAgent).toBe("Mozilla/5.0");
      expect(result[0].metadata).toEqual({ key: "value" });
    });

    it("should record audit log without userId (nullable)", async () => {
      const auditLog: AuthAuditLog = {
        id: idGenerator.uuid(),
        eventType: "LOGIN_FAILED",
        ipAddress: "10.0.0.1",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      };

      await auditLogRepository.record(auditLog);

      const result = await db.select().from(schema.authAuditLogs).limit(1);
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBeNull();
      expect(result[0].eventType).toBe("LOGIN_FAILED");
    });

    it("should record multiple audit log entries", async () => {
      const auditLog1: AuthAuditLog = {
        id: idGenerator.uuid(),
        userId: testUser1Id,
        eventType: "LOGIN_SUCCESS",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      };

      const auditLog2: AuthAuditLog = {
        id: idGenerator.uuid(),
        userId: testUser1Id,
        eventType: "TOKEN_REFRESH",
        createdAt: new Date("2024-01-01T00:01:00Z"),
      };

      await auditLogRepository.record(auditLog1);
      await auditLogRepository.record(auditLog2);

      const result = await db.select().from(schema.authAuditLogs);
      expect(result).toHaveLength(2);
    });
  });
});

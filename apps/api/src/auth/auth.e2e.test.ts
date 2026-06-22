import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import cookieParser from "cookie-parser";
import supertest from "supertest";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "../../../../libs/database/src/schema/index";

/**
 * E2E tests for auth flow with real PostgreSQL database
 *
 * Tests:
 * - Register sets httpOnly refresh cookie and response body omits refreshToken
 * - Login sets/rotates cookie
 * - Refresh with cookie returns new access token and sets a new refresh cookie
 * - Logout clears/invalidates cookie and subsequent refresh with old cookie fails
 * - Validation rejects invalid register payload
 */

// Set environment variables BEFORE module imports (ConfigModule reads at import time)
// This must be at the top level, before imports are evaluated
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-for-e2e-tests-minimum-32-chars!";
process.env.AUTH_REFRESH_COOKIE_NAME = "ledger_mx_refresh_token";
process.env.AUTH_REFRESH_COOKIE_SECURE = "false";
process.env.AUTH_REFRESH_COOKIE_SAME_SITE = "lax";
process.env.JWT_ACCESS_TOKEN_TTL = "15m";

describe("Auth E2E (real database)", () => {
  let app: INestApplication;
  let container: InstanceType<typeof PostgreSqlContainer> | null = null;
  let pool: Pool;
  let db: NodePgDatabase<typeof schema>;

  beforeAll(async () => {
    // Start PostgreSQL container with proper chaining
    container = await new PostgreSqlContainer("postgres:16-alpine")
      .withDatabase("test_db")
      .withUsername("test_user")
      .withPassword("test_password")
      .start();

    const connectionString = container.getConnectionUri();

    // Set DATABASE_URL after container starts (ConfigModule will read this)
    process.env.DATABASE_URL = connectionString;

    // Dynamic import of AppModule AFTER env vars are set (ESM imports are hoisted)
    const { AppModule } = await import("../app.module");

    // Create pool and database connection (same as working integration test)
    pool = new Pool({ connectionString });
    // Swallow expected connection termination errors during teardown
    pool.on('error', () => {});
    db = drizzle(pool, { schema });

    // Run migrations with correct path from apps/api/src/auth/ to libs/database/drizzle
    // Path: ../../../../libs/database/drizzle (4 levels up to repo root, then into libs)
    const migrationsFolder = new URL(
      "../../../../libs/database/drizzle",
      import.meta.url,
    ).pathname;
    await migrate(db, { migrationsFolder });

    // Create NestJS testing module with real AppModule
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Enable cookie parsing (same as main.ts)
    app.use(cookieParser());

    await app.init();
  }, 120000); // 2 minute timeout for container startup and migrations

  afterAll(async () => {
    // Cleanup in reverse order, catching errors to ensure all cleanup runs
    try {
      if (app) {
        await app.close();
      }
    } catch (error) {
      console.error("Error closing Nest app:", error);
    }

    try {
      if (pool) {
        await pool.end();
      }
    } catch (error) {
      console.error("Error closing pool:", error);
    }

    try {
      if (container) {
        await container.stop();
      }
    } catch (error) {
      console.error("Error stopping container:", error);
    }
  });

  beforeEach(async () => {
    // Clean up tables between tests (handle FK constraints by order)
    await db.delete(schema.authAuditLogs);
    await db.delete(schema.sessions);
    await db.delete(schema.users);
  });

  describe("POST /auth/register", () => {
    it("should register a new user and set refresh token in httpOnly cookie", async () => {
      const response = await supertest(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "Password123@",
          displayName: "Test User",
        })
        .expect(201);

      // Response should have accessToken and sessionId, but NOT refreshToken
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("sessionId");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toMatchObject({
        email: "test@example.com",
        displayName: "Test User",
      });
      expect(response.body).not.toHaveProperty("refreshToken");

      // Refresh token should be in cookie
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.length).toBeGreaterThan(0);

      const refreshCookie = cookies.find((c: string) =>
        c.includes("ledger_mx_refresh_token"),
      );
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain("HttpOnly");
      expect(refreshCookie).toContain("Path=/auth");
    });

    it("should return 400 for invalid email", async () => {
      await supertest(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "invalid-email",
          password: "Password123@",
        })
        .expect(400);
    });

    it("should return 400 for weak password", async () => {
      await supertest(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "short",
        })
        .expect(400);
    });

    it("should return 409 for duplicate email", async () => {
      await supertest(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "Password123@",
        })
        .expect(201);

      await supertest(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "Password123@",
        })
        .expect(409);
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      // Register a user first
      await supertest(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "Password123@",
        })
        .expect(201);
    });

    it("should login with valid credentials and set refresh token in cookie", async () => {
      const response = await supertest(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "Password123@",
        })
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("sessionId");
      expect(response.body).not.toHaveProperty("refreshToken");

      // Refresh token should be in cookie
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c: string) =>
        c.includes("ledger_mx_refresh_token"),
      );
      expect(refreshCookie).toBeDefined();
    });

    it("should return 401 for invalid credentials", async () => {
      await supertest(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "WrongPassword123@",
        })
        .expect(401);
    });
  });

  describe("POST /auth/refresh", () => {
    let refreshToken: string;

    beforeEach(async () => {
      const response = await supertest(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "Password123@",
        })
        .expect(201);

      // Extract refresh token from cookie
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c: string) =>
        c.includes("ledger_mx_refresh_token"),
      );
      expect(refreshCookie).toBeDefined();
      refreshToken = refreshCookie!.split("=")[1].split(";")[0];
    });

    it("should refresh tokens with valid refresh token from cookie", async () => {
      const response = await supertest(app.getHttpServer())
        .post("/auth/refresh")
        .set("Cookie", [`ledger_mx_refresh_token=${refreshToken}`])
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("sessionId");
      expect(response.body).not.toHaveProperty("refreshToken");

      // New refresh token should be in cookie
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
    });

    it("should return 401 for invalid refresh token", async () => {
      await supertest(app.getHttpServer())
        .post("/auth/refresh")
        .set("Cookie", ["ledger_mx_refresh_token=invalid-token"])
        .expect(401);
    });

    it("should return 401 when no refresh token provided", async () => {
      await supertest(app.getHttpServer())
        .post("/auth/refresh")
        .expect(401);
    });
  });

  describe("POST /auth/logout", () => {
    let refreshToken: string;

    beforeEach(async () => {
      const response = await supertest(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "Password123@",
        })
        .expect(201);

      // Extract refresh token from cookie
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c: string) =>
        c.includes("ledger_mx_refresh_token"),
      );
      expect(refreshCookie).toBeDefined();
      refreshToken = refreshCookie!.split("=")[1].split(";")[0];
    });

    it("should logout successfully and clear cookie", async () => {
      const response = await supertest(app.getHttpServer())
        .post("/auth/logout")
        .set("Cookie", [`ledger_mx_refresh_token=${refreshToken}`])
        .expect(200);

      expect(response.body).toEqual({ success: true });

      // Cookie should be cleared
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const clearedCookie = cookies.find((c: string) =>
        c.includes("ledger_mx_refresh_token"),
      );
      expect(clearedCookie).toBeDefined();
      expect(clearedCookie).toContain("Max-Age=0");
    });

    it("should invalidate refresh token after logout", async () => {
      await supertest(app.getHttpServer())
        .post("/auth/logout")
        .set("Cookie", [`ledger_mx_refresh_token=${refreshToken}`])
        .expect(200);

      // Try to refresh with the logged-out token
      await supertest(app.getHttpServer())
        .post("/auth/refresh")
        .set("Cookie", [`ledger_mx_refresh_token=${refreshToken}`])
        .expect(401);
    });
  });
});

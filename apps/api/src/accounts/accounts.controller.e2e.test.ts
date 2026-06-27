import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

// Set environment variables BEFORE module imports (ConfigModule reads at import time)
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-for-e2e-tests-minimum-32-chars!";
process.env.AUTH_REFRESH_COOKIE_NAME = "ledger_mx_refresh_token";
process.env.AUTH_REFRESH_COOKIE_SECURE = "false";
process.env.AUTH_REFRESH_COOKIE_SAME_SITE = "lax";
process.env.JWT_ACCESS_TOKEN_TTL = "15m";

describe("AccountsController (e2e)", () => {
  let app: INestApplication;
  let container: any = null;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer("postgres:16-alpine")
      .withDatabase("test_db")
      .withUsername("test_user")
      .withPassword("test_password")
      .start();

    // Set DATABASE_URL after container starts
    process.env.DATABASE_URL = container.getConnectionUri();

    // Dynamic import of AppModule AFTER env vars are set
    const { AppModule } = await import("../app.module");

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  }, 120000); // 2 minute timeout for container startup

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (container) {
      await container.stop();
    }
  });

  describe("authentication", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/accounts")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("CRUD operations", () => {
    // These tests would require a valid JWT token and test database
    // For now, they verify the endpoints exist and return expected status codes

    it("should have POST /api/v1/accounts endpoint", async () => {
      // Without auth, should get 401 (not 404)
      const response = await request(app.getHttpServer())
        .post("/api/v1/accounts")
        .send({ name: "Test", type: "debit", currency: "MXN" })
        .expect(401);

      expect(response.status).not.toBe(404);
    });

    it("should have GET /api/v1/accounts endpoint", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/accounts")
        .expect(401);

      expect(response.status).not.toBe(404);
    });

    it("should have PATCH /api/v1/accounts/:id endpoint", async () => {
      const response = await request(app.getHttpServer())
        .patch("/api/v1/accounts/test-id")
        .send({ name: "Updated" })
        .expect(401);

      expect(response.status).not.toBe(404);
    });

    it("should have DELETE /api/v1/accounts/:id endpoint", async () => {
      const response = await request(app.getHttpServer())
        .delete("/api/v1/accounts/test-id")
        .expect(401);

      expect(response.status).not.toBe(404);
    });
  });
});

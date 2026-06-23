import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../app.module";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("AccountsController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
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

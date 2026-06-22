import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ExportController } from "./export.controller";
import { ExportTransactionsCsvUseCase } from "@ledger-mx/application";

describe("ExportController", () => {
  let app: INestApplication;
  let mockUseCase: { execute: ReturnType<typeof vi.fn> };

  // Mock user
  const validUserId = "550e8400-e29b-41d4-a716-446655440000";

  // Mock guard that attaches user to request
  const mockJwtAuthGuard = {
    canActivate: vi.fn().mockImplementation((context) => {
      const request = context.switchToHttp().getRequest();
      request.user = { sub: validUserId, email: "test@example.com" };
      return true;
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockUseCase = {
      execute: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [
        {
          provide: ExportTransactionsCsvUseCase,
          useValue: mockUseCase,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /api/v1/export/csv", () => {
    it("should return CSV content", async () => {
      // Arrange
      const csvContent = "date,amount,category,note,account\n2024-01-15,50.00,Groceries,Weekly shopping,Checking";
      mockUseCase.execute.mockResolvedValue({ csv: csvContent });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get("/api/v1/export/csv")
        .expect(200);

      expect(response.text).toBe(csvContent);
      expect(mockUseCase.execute).toHaveBeenCalledWith({
        userId: expect.anything(),
        startDate: undefined,
        endDate: undefined,
      });
    });

    it("should handle date range query parameters", async () => {
      // Arrange
      mockUseCase.execute.mockResolvedValue({ csv: "date,amount,category,note,account" });

      // Act & Assert
      await request(app.getHttpServer())
        .get("/api/v1/export/csv")
        .query({
          startDate: "2024-01-01T00:00:00.000Z",
          endDate: "2024-01-31T23:59:59.999Z",
        })
        .expect(200);

      expect(mockUseCase.execute).toHaveBeenCalledWith({
        userId: expect.anything(),
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      });
    });

    it("should return 400 for invalid startDate", async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get("/api/v1/export/csv")
        .query({ startDate: "invalid-date" })
        .expect(400);
    });

    it("should return 400 for invalid endDate", async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get("/api/v1/export/csv")
        .query({ endDate: "invalid-date" })
        .expect(400);
    });

    it("should return 400 when startDate > endDate", async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get("/api/v1/export/csv")
        .query({
          startDate: "2024-12-31T00:00:00.000Z",
          endDate: "2024-01-01T00:00:00.000Z",
        })
        .expect(400);
    });
  });
});

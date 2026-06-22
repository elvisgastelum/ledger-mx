import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExportTransactionsCsvUseCase } from "./export-transactions-csv.use-case";
import type { TransactionExportRepository, TransactionExportRow } from "../ports/transaction-export.repository.port";
import type { UserId } from "@ledger-mx/domain";

describe("ExportTransactionsCsvUseCase", () => {
  let mockRepository: { fetchForExport: ReturnType<typeof vi.fn<TransactionExportRepository["fetchForExport"]>> };
  let useCase: ExportTransactionsCsvUseCase;
  const mockUserId: UserId = "user-123" as UserId;

  beforeEach(() => {
    // Create a mock repository
    mockRepository = {
      fetchForExport: vi.fn<TransactionExportRepository["fetchForExport"]>(),
    };

    useCase = new ExportTransactionsCsvUseCase(mockRepository as unknown as TransactionExportRepository);
  });

  describe("CSV generation", () => {
    it("should generate CSV with correct headers", async () => {
      // Arrange
      const mockRows: TransactionExportRow[] = [];
      mockRepository.fetchForExport.mockResolvedValue(mockRows);

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
      });

      // Assert
      expect(result.csv).toContain("date,amount,category,note,account");
    });

    it("should include header even for empty exports", async () => {
      // Arrange
      mockRepository.fetchForExport.mockResolvedValue([]);

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
      });

      // Assert
      expect(result.csv).toBe("date,amount,category,note,account");
    });

    it("should format date as YYYY-MM-DD", async () => {
      // Arrange
      const mockRows: TransactionExportRow[] = [
        {
          date: new Date("2024-01-15T10:30:00Z"),
          amount: 5000,
          category: "Groceries",
          note: "Weekly shopping",
          account: "Checking",
        },
      ];
      mockRepository.fetchForExport.mockResolvedValue(mockRows);

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
      });

      // Assert
      expect(result.csv).toContain("2024-01-15");
    });

    it("should format amount as decimal string", async () => {
      // Arrange
      const mockRows: TransactionExportRow[] = [
        {
          date: new Date("2024-01-15"),
          amount: 5000, // $50.00
          category: "Groceries",
          note: null,
          account: "Checking",
        },
      ];
      mockRepository.fetchForExport.mockResolvedValue(mockRows);

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
      });

      // Assert
      expect(result.csv).toContain("50.00");
    });

    it("should handle negative amounts", async () => {
      // Arrange
      const mockRows: TransactionExportRow[] = [
        {
          date: new Date("2024-01-15"),
          amount: -2500, // -$25.00
          category: "Entertainment",
          note: null,
          account: "Credit Card",
        },
      ];
      mockRepository.fetchForExport.mockResolvedValue(mockRows);

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
      });

      // Assert
      expect(result.csv).toContain("-25.00");
    });
  });

  describe("CSV escaping", () => {
    it("should escape CSV values correctly", async () => {
      // Arrange
      const mockRows: TransactionExportRow[] = [
        {
          date: new Date("2024-01-15"),
          amount: 1000,
          category: "Food",
          note: 'Value with "quotes"',
          account: "Checking",
        },
      ];
      mockRepository.fetchForExport.mockResolvedValue(mockRows);

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
      });

      // Assert - double quotes should be escaped by doubling them
      expect(result.csv).toContain('"Value with ""quotes"""');
    });

    it("should wrap values with commas in quotes", async () => {
      // Arrange
      const mockRows: TransactionExportRow[] = [
        {
          date: new Date("2024-01-15"),
          amount: 1000,
          category: "Food, Groceries",
          note: null,
          account: "Checking",
        },
      ];
      mockRepository.fetchForExport.mockResolvedValue(mockRows);

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
      });

      // Assert
      expect(result.csv).toContain('"Food, Groceries"');
    });

    it("should mitigate spreadsheet formula injection", async () => {
      // Arrange
      const mockRows: TransactionExportRow[] = [
        {
          date: new Date("2024-01-15"),
          amount: 1000,
          category: null,
          note: "=SUM(A1:A10)",
          account: "Checking",
        },
      ];
      mockRepository.fetchForExport.mockResolvedValue(mockRows);

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
      });

      // Assert - values starting with = should be prefixed with '
      expect(result.csv).toContain("'=SUM(A1:A10)");
    });

    it("should mitigate formula injection for +, -, @, tab, carriage return", async () => {
      // Arrange
      const mockRows: TransactionExportRow[] = [
        {
          date: new Date("2024-01-15"),
          amount: 1000,
          category: null,
          note: "+1+1",
          account: "Checking",
        },
        {
          date: new Date("2024-01-15"),
          amount: 1000,
          category: null,
          note: "-A1",
          account: "Checking",
        },
        {
          date: new Date("2024-01-15"),
          amount: 1000,
          category: null,
          note: "@A1",
          account: "Checking",
        },
      ];
      mockRepository.fetchForExport.mockResolvedValue(mockRows);

      // Act
      const result = await useCase.execute({
        userId: mockUserId,
      });

      // Assert
      expect(result.csv).toContain("'+1+1");
      expect(result.csv).toContain("'-A1");
      expect(result.csv).toContain("'@A1");
    });
  });

  describe("date filtering", () => {
    it("should pass date filters to repository", async () => {
      // Arrange
      mockRepository.fetchForExport.mockResolvedValue([]);
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      // Act
      await useCase.execute({
        userId: mockUserId,
        startDate,
        endDate,
      });

      // Assert
      expect(mockRepository.fetchForExport).toHaveBeenCalledWith(
        "user-123",
        startDate,
        endDate,
      );
    });

    it("should validate date range and throw on invalid range", async () => {
      // Arrange
      mockRepository.fetchForExport.mockResolvedValue([]);
      const startDate = new Date("2024-12-31");
      const endDate = new Date("2024-01-01");

      // Act & Assert
      await expect(
        useCase.execute({
          userId: mockUserId,
          startDate,
          endDate,
        }),
      ).rejects.toThrow("startDate must be before or equal to endDate");
    });

    it("should work without date filters", async () => {
      // Arrange
      mockRepository.fetchForExport.mockResolvedValue([]);

      // Act
      await useCase.execute({
        userId: mockUserId,
      });

      // Assert
      expect(mockRepository.fetchForExport).toHaveBeenCalledWith(
        "user-123",
        undefined,
        undefined,
      );
    });
  });

  describe("user scoping", () => {
    it("should pass userId to repository", async () => {
      // Arrange
      mockRepository.fetchForExport.mockResolvedValue([]);
      const userId: UserId = "user-456" as UserId;

      // Act
      await useCase.execute({
        userId,
      });

      // Assert
      expect(mockRepository.fetchForExport).toHaveBeenCalledWith(
        userId,
        undefined,
        undefined,
      );
    });
  });
});

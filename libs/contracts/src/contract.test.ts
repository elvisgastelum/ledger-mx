import { describe, it, expect } from "vitest";
import { contract, Contract } from "./contract";
import { initClient } from "@ts-rest/core";
import {
  MoneySchema,
  UuidSchema,
  CreateTransactionRequestSchema,
  UpdateTransactionRequestSchema,
} from "./index";

// Compile-time checks: these will fail at compile-time if types don't match

// Check contract type
const _contractCheck: Contract = contract;
void _contractCheck;

// Check client initialization
const _client = initClient(contract, { baseUrl: "http://localhost:3000" });
void _client;

// Check endpoint response shapes
type RegisterResponse = Contract["auth"]["register"]["responses"][201];
type _RegisterResponseCheck = RegisterResponse extends { accessToken: string } ? true : never;
void ({} as _RegisterResponseCheck);

type ListCategoriesResponse = Contract["categoryGroups"]["list"]["responses"][200];
type _ListCategoriesCheck = ListCategoriesResponse extends { categoryGroups: unknown[] } ? true : never;
void ({} as _ListCategoriesCheck);

type ApplyLayoutResponse = Contract["onboarding"]["applyLayout"]["responses"][200];
type _ApplyLayoutCheck = ApplyLayoutResponse extends { categoryGroups: unknown[]; created: boolean } ? true : never;
void ({} as _ApplyLayoutCheck);

// Runtime validation tests
describe("Schema runtime validation", () => {
  describe("MoneySchema", () => {
    it("should accept integer cents", () => {
      expect(MoneySchema.safeParse(1234).success).toBe(true);
      expect(MoneySchema.safeParse(0).success).toBe(true);
      expect(MoneySchema.safeParse(999999).success).toBe(true);
    });

    it("should reject floats", () => {
      expect(MoneySchema.safeParse(12.34).success).toBe(false);
      expect(MoneySchema.safeParse(0.01).success).toBe(false);
      expect(MoneySchema.safeParse(99.99).success).toBe(false);
    });

    it("should reject negative values", () => {
      expect(MoneySchema.safeParse(-100).success).toBe(false);
    });

    it("should reject non-numbers", () => {
      expect(MoneySchema.safeParse("1000").success).toBe(false);
      expect(MoneySchema.safeParse(null).success).toBe(false);
      expect(MoneySchema.safeParse(undefined).success).toBe(false);
    });
  });

  describe("UuidSchema", () => {
    it("should accept valid UUID v4", () => {
      expect(UuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000").success).toBe(true);
      expect(UuidSchema.safeParse("6ba7b810-9dad-11d1-80b4-00c04fd430c8").success).toBe(true);
    });

    it("should reject invalid UUIDs", () => {
      expect(UuidSchema.safeParse("not-a-uuid").success).toBe(false);
      expect(UuidSchema.safeParse("550e8400-e29b-41d4-a716").success).toBe(false);
      expect(UuidSchema.safeParse("").success).toBe(false);
    });
  });

  describe("CreateTransactionRequestSchema", () => {
    const validLine = (overrides = {}) => ({
      id: "550e8400-e29b-41d4-a716-446655440001",
      targetType: "account" as const,
      accountId: "660e8400-e29b-41d4-a716-446655440000",
      categoryId: null,
      envelopeId: null,
      amountCents: -1234,
      type: "expense" as const,
      ...overrides,
    });

    it("should accept valid transaction with lines summing to zero", () => {
      const validTransaction = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        transactionDate: new Date().toISOString(),
        type: "expense" as const,
        lines: [
          validLine({ amountCents: -1234 }),
          validLine({
            id: "550e8400-e29b-41d4-a716-446655440002",
            targetType: "category" as const,
            accountId: null,
            categoryId: "770e8400-e29b-41d4-a716-446655440000",
            amountCents: 1234,
          }),
        ],
      };

      expect(CreateTransactionRequestSchema.safeParse(validTransaction).success).toBe(true);
    });

    it("should reject transaction where lines do not sum to zero", () => {
      const invalidTransaction = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        transactionDate: new Date().toISOString(),
        type: "expense" as const,
        lines: [
          validLine({ amountCents: -1234 }),
          validLine({
            id: "550e8400-e29b-41d4-a716-446655440002",
            targetType: "category" as const,
            accountId: null,
            categoryId: "770e8400-e29b-41d4-a716-446655440000",
            amountCents: 999, // Sum is -1234 + 999 = -235, not zero
          }),
        ],
      };

       const result = CreateTransactionRequestSchema.safeParse(invalidTransaction);
       expect(result.success).toBe(false);
       if (!result.success) {
         expect(result.error.issues.some((issue) => issue.message.includes("sum to zero"))).toBe(true);
       }
     });

    it("should reject transaction with float amounts in lines", () => {
      const invalidTransaction = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        transactionDate: new Date().toISOString(),
        type: "expense" as const,
        lines: [
          validLine({ amountCents: -1234.50 }), // Float
          validLine({
            id: "550e8400-e29b-41d4-a716-446655440002",
            targetType: "category" as const,
            accountId: null,
            categoryId: "770e8400-e29b-41d4-a716-446655440000",
            amountCents: 1234.50, // Float
          }),
        ],
      };

      expect(CreateTransactionRequestSchema.safeParse(invalidTransaction).success).toBe(false);
    });

    it("should reject transaction where lines do not sum to zero", () => {
      const invalidTransaction = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        transactionDate: new Date().toISOString(),
        type: "expense" as const,
        lines: [
          validLine({ amountCents: -1234 }),
          validLine({
            id: "550e8400-e29b-41d4-a716-446655440002",
            accountId: null,
            categoryId: "770e8400-e29b-41d4-a716-446655440000",
            amountCents: 999, // Sum is -1234 + 999 = -235, not zero
          }),
        ],
      };

       const result = CreateTransactionRequestSchema.safeParse(invalidTransaction);
       expect(result.success).toBe(false);
       if (!result.success) {
         expect(result.error.issues.some((issue) => issue.message.includes("sum to zero"))).toBe(true);
       }
     });

    it("should reject transaction with less than 2 lines", () => {
      const invalidTransaction = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        transactionDate: new Date().toISOString(),
        type: "expense" as const,
        lines: [validLine()], // Only 1 line
      };

      expect(CreateTransactionRequestSchema.safeParse(invalidTransaction).success).toBe(false);
    });

    it("should reject transaction with float amounts in lines", () => {
      const invalidTransaction = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        transactionDate: new Date().toISOString(),
        type: "expense" as const,
        lines: [
          validLine({ amountCents: -1234.50 }), // Float
          validLine({
            id: "550e8400-e29b-41d4-a716-446655440002",
            accountId: null,
            categoryId: "770e8400-e29b-41d4-a716-446655440000",
            amountCents: 1234.50, // Float
          }),
        ],
      };

      expect(CreateTransactionRequestSchema.safeParse(invalidTransaction).success).toBe(false);
    });
  });

  describe("UpdateTransactionRequestSchema", () => {
    it("should accept valid update with lines summing to zero", () => {
      const validUpdate = {
        transactionDate: new Date().toISOString(),
        lines: [
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            targetType: "account" as const,
            accountId: "660e8400-e29b-41d4-a716-446655440000",
            categoryId: null,
            envelopeId: null,
            amountCents: -5000,
            type: "expense" as const,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            targetType: "category" as const,
            accountId: null,
            categoryId: "770e8400-e29b-41d4-a716-446655440000",
            envelopeId: null,
            amountCents: 5000,
            type: "expense" as const,
          },
        ],
      };

      expect(UpdateTransactionRequestSchema.safeParse(validUpdate).success).toBe(true);
    });

    it("should reject update where lines do not sum to zero", () => {
      const invalidUpdate = {
        lines: [
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            targetType: "account" as const,
            accountId: "660e8400-e29b-41d4-a716-446655440000",
            categoryId: null,
            envelopeId: null,
            amountCents: -5000,
            type: "expense" as const,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            targetType: "category" as const,
            accountId: null,
            categoryId: "770e8400-e29b-41d4-a716-446655440000",
            envelopeId: null,
            amountCents: 3000, // Sum is -2000, not zero
            type: "expense" as const,
          },
        ],
      };

       const result = UpdateTransactionRequestSchema.safeParse(invalidUpdate);
       expect(result.success).toBe(false);
       if (!result.success) {
         expect(result.error.issues.some((issue) => issue.message.includes("sum to zero"))).toBe(true);
       }
     });

    it("should reject empty update object", () => {
      const emptyUpdate = {};

      const result = UpdateTransactionRequestSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message.toLowerCase().includes("at least one updatable field"))).toBe(true);
      }
    });
  });
});


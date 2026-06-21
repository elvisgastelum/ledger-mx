import { expect, test, describe } from "vitest";
import {
  isUuidV4,
  assertUuidV4,
  UUID_V4_REGEX,
  userIdFromString,
  accountIdFromString,
  envelopeIdFromString,
  categoryIdFromString,
  transactionIdFromString,
  transactionLineIdFromString,
  UserId,
  AccountId,
  EnvelopeId,
  CategoryId,
  TransactionLineTargetId,
} from "./uuid";
import { InvalidIdError } from "../ledger/ledger-errors";

// Valid UUID v4 strings for testing
const VALID_USER_ID = "8a3b2c1d-5678-4f9e-8a1b-2c3d4e5f6a7b";
const VALID_ACCOUNT_ID = "123e4567-e89b-42d3-a456-426614174000";
const VALID_ENVELOPE_ID = "323e4567-e89b-42d3-a456-426614174002";
const VALID_CATEGORY_ID = "423e4567-e89b-42d3-a456-426614174006";
const VALID_TRANSACTION_ID = "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a";
const VALID_LINE_ID = "423e4567-e89b-42d3-a456-426614174003";

// Invalid UUID strings
const INVALID_UUID_EMPTY = "";
const INVALID_UUID_FORMAT = "not-a-valid-uuid";

describe("UUID Utilities", () => {
  describe("UUID_V4_REGEX", () => {
    test("matches valid UUID v4 strings", () => {
      expect(UUID_V4_REGEX.test(VALID_USER_ID)).toBe(true);
      expect(UUID_V4_REGEX.test(VALID_ACCOUNT_ID)).toBe(true);
    });

    test("rejects invalid UUID strings", () => {
      expect(UUID_V4_REGEX.test(INVALID_UUID_FORMAT)).toBe(false);
      expect(UUID_V4_REGEX.test(INVALID_UUID_EMPTY)).toBe(false);
    });
  });

  describe("isUuidV4", () => {
    test("returns true for valid UUID v4", () => {
      expect(isUuidV4(VALID_USER_ID)).toBe(true);
    });

    test("returns false for invalid UUID", () => {
      expect(isUuidV4(INVALID_UUID_FORMAT)).toBe(false);
      expect(isUuidV4(INVALID_UUID_EMPTY)).toBe(false);
    });
  });

  describe("assertUuidV4", () => {
    test("does not throw for valid UUID v4", () => {
      expect(() => assertUuidV4(VALID_USER_ID, "UserId")).not.toThrow();
    });

    test("throws InvalidIdError for empty string", () => {
      expect(() => assertUuidV4(INVALID_UUID_EMPTY, "UserId")).toThrow(
        InvalidIdError,
      );
    });

    test("throws InvalidIdError for invalid format", () => {
      expect(() => assertUuidV4(INVALID_UUID_FORMAT, "UserId")).toThrow(
        InvalidIdError,
      );
    });

    test("includes field name in error message", () => {
      try {
        assertUuidV4(INVALID_UUID_FORMAT, "TransactionId");
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidIdError);
        expect((e as Error).message).toContain("TransactionId");
      }
    });
  });
});

describe("Branded ID Factory Functions", () => {
  describe("userIdFromString", () => {
    test("creates UserId from valid UUID v4", () => {
      const result = userIdFromString(VALID_USER_ID);
      expect(result).toBe(VALID_USER_ID);
      // Runtime value is still a string
      expect(typeof result).toBe("string");
    });

    test("throws for invalid UUID", () => {
      expect(() => userIdFromString(INVALID_UUID_FORMAT)).toThrow(
        InvalidIdError,
      );
    });

    test("returns branded type", () => {
      const result: UserId = userIdFromString(VALID_USER_ID);
      // Type check - this compiles if the type is correct
      expect(result).toBeDefined();
    });
  });

  describe("accountIdFromString", () => {
    test("creates AccountId from valid UUID v4", () => {
      const result = accountIdFromString(VALID_ACCOUNT_ID);
      expect(result).toBe(VALID_ACCOUNT_ID);
    });

    test("throws for invalid UUID", () => {
      expect(() => accountIdFromString(INVALID_UUID_FORMAT)).toThrow(
        InvalidIdError,
      );
    });
  });

  describe("envelopeIdFromString", () => {
    test("creates EnvelopeId from valid UUID v4", () => {
      const result = envelopeIdFromString(VALID_ENVELOPE_ID);
      expect(result).toBe(VALID_ENVELOPE_ID);
    });
  });

  describe("categoryIdFromString", () => {
    test("creates CategoryId from valid UUID v4", () => {
      const result = categoryIdFromString(VALID_CATEGORY_ID);
      expect(result).toBe(VALID_CATEGORY_ID);
    });
  });

  describe("transactionIdFromString", () => {
    test("creates TransactionId from valid UUID v4", () => {
      const result = transactionIdFromString(VALID_TRANSACTION_ID);
      expect(result).toBe(VALID_TRANSACTION_ID);
    });
  });

  describe("transactionLineIdFromString", () => {
    test("creates TransactionLineId from valid UUID v4", () => {
      const result = transactionLineIdFromString(VALID_LINE_ID);
      expect(result).toBe(VALID_LINE_ID);
    });
  });

  describe("Brand Type Compatibility", () => {
    test("TransactionLineTargetId accepts AccountId", () => {
      const accountId: AccountId = accountIdFromString(VALID_ACCOUNT_ID);
      const target: TransactionLineTargetId = accountId;
      expect(target).toBe(VALID_ACCOUNT_ID);
    });

    test("TransactionLineTargetId accepts EnvelopeId", () => {
      const envelopeId: EnvelopeId = envelopeIdFromString(VALID_ENVELOPE_ID);
      const target: TransactionLineTargetId = envelopeId;
      expect(target).toBe(VALID_ENVELOPE_ID);
    });

    test("TransactionLineTargetId accepts CategoryId", () => {
      const categoryId: CategoryId = categoryIdFromString(VALID_CATEGORY_ID);
      const target: TransactionLineTargetId = categoryId;
      expect(target).toBe(VALID_CATEGORY_ID);
    });
  });

  describe("Runtime Behavior", () => {
    test("branded ID equals original string at runtime", () => {
      const userId = userIdFromString(VALID_USER_ID);
      expect(userId === VALID_USER_ID).toBe(true);
      expect(userId !== VALID_USER_ID).toBe(false);
    });

    test("branded IDs from same UUID are equal", () => {
      const id1 = userIdFromString(VALID_USER_ID);
      const id2 = userIdFromString(VALID_USER_ID);
      expect(id1 === id2).toBe(true);
    });
  });
});

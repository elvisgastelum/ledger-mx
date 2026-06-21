import { InvalidIdError } from "../ledger/ledger-errors";

/**
 * Dependency-free UUID v4 validation regex
 * Matches standard UUID v4 format: xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx
 */
export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Tests if a string is a valid UUID v4.
 * @param value - The string to test
 * @returns true if valid UUID v4, false otherwise
 */
export function isUuidV4(value: string): boolean {
  return UUID_V4_REGEX.test(value);
}

/**
 * Asserts that a string is a valid UUID v4, throwing InvalidIdError if not.
 * @param value - The string to validate
 * @param fieldName - The field name to include in the error message
 * @throws InvalidIdError if value is not a valid UUID v4
 */
export function assertUuidV4(value: string, fieldName: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new InvalidIdError(`${fieldName} must be a non-empty string`);
  }
  if (!isUuidV4(value)) {
    throw new InvalidIdError(`${fieldName} must be a valid UUID v4`);
  }
}

/**
 * Compile-time brand helper type.
 * Brands a base type T with a string literal BrandName for type safety.
 */
export type Brand<T, BrandName extends string> = T & {
  readonly __brand: BrandName;
};

// Branded ID Types
export type UserId = Brand<string, "UserId">;
export type AccountId = Brand<string, "AccountId">;
export type EnvelopeId = Brand<string, "EnvelopeId">;
export type CategoryId = Brand<string, "CategoryId">;
export type TransactionId = Brand<string, "TransactionId">;
export type TransactionLineId = Brand<string, "TransactionLineId">;

/**
 * Union type for transaction line target IDs.
 * A target can be an account, envelope, or category.
 */
export type TransactionLineTargetId = AccountId | EnvelopeId | CategoryId;

// Factory Functions

/**
 * Creates a UserId from a string after validating it's a valid UUID v4.
 * @param value - The UUID v4 string
 * @returns UserId (branded string)
 * @throws InvalidIdError if value is not a valid UUID v4
 */
export function userIdFromString(value: string): UserId {
  assertUuidV4(value, "UserId");
  return value as UserId;
}

/**
 * Creates an AccountId from a string after validating it's a valid UUID v4.
 * @param value - The UUID v4 string
 * @returns AccountId (branded string)
 * @throws InvalidIdError if value is not a valid UUID v4
 */
export function accountIdFromString(value: string): AccountId {
  assertUuidV4(value, "AccountId");
  return value as AccountId;
}

/**
 * Creates an EnvelopeId from a string after validating it's a valid UUID v4.
 * @param value - The UUID v4 string
 * @returns EnvelopeId (branded string)
 * @throws InvalidIdError if value is not a valid UUID v4
 */
export function envelopeIdFromString(value: string): EnvelopeId {
  assertUuidV4(value, "EnvelopeId");
  return value as EnvelopeId;
}

/**
 * Creates a CategoryId from a string after validating it's a valid UUID v4.
 * @param value - The UUID v4 string
 * @returns CategoryId (branded string)
 * @throws InvalidIdError if value is not a valid UUID v4
 */
export function categoryIdFromString(value: string): CategoryId {
  assertUuidV4(value, "CategoryId");
  return value as CategoryId;
}

/**
 * Creates a TransactionId from a string after validating it's a valid UUID v4.
 * @param value - The UUID v4 string
 * @returns TransactionId (branded string)
 * @throws InvalidIdError if value is not a valid UUID v4
 */
export function transactionIdFromString(value: string): TransactionId {
  assertUuidV4(value, "TransactionId");
  return value as TransactionId;
}

/**
 * Creates a TransactionLineId from a string after validating it's a valid UUID v4.
 * @param value - The UUID v4 string
 * @returns TransactionLineId (branded string)
 * @throws InvalidIdError if value is not a valid UUID v4
 */
export function transactionLineIdFromString(value: string): TransactionLineId {
  assertUuidV4(value, "TransactionLineId");
  return value as TransactionLineId;
}

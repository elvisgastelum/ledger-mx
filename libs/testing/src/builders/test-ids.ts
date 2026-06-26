import {
  userIdFromString,
  accountIdFromString,
  envelopeIdFromString,
  categoryIdFromString,
  categoryGroupIdFromString,
  transactionIdFromString,
  transactionLineIdFromString,
  UserId,
  AccountId,
  EnvelopeId,
  CategoryId,
  CategoryGroupId,
  TransactionId,
  TransactionLineId,
} from "@ledger-mx/domain";

/**
 * Valid UUID v4 strings for testing.
 * These are deterministic and valid RFC 4122 version 4 UUIDs.
 */
const TEST_USER_ID = "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a";
const TEST_ACCOUNT_ID_1 = "123e4567-e89b-42d3-a456-426614174000";
const TEST_ACCOUNT_ID_2 = "223e4567-e89b-42d3-a456-426614174001";
const TEST_ENVELOPE_ID = "323e4567-e89b-42d3-a456-426614174002";
const TEST_CATEGORY_ID = "423e4567-e89b-42d3-a456-426614174003";
const TEST_CATEGORY_GROUP_ID = "523e4567-e89b-42d3-a456-426614174004";
const TEST_TRANSACTION_ID = "623e4567-e89b-42d3-a456-426614174005";
const TEST_TRANSACTION_LINE_ID_1 = "723e4567-e89b-42d3-a456-426614174006";
const TEST_TRANSACTION_LINE_ID_2 = "823e4567-e89b-42d3-a456-426614174007";
const TEST_TRANSACTION_LINE_ID_3 = "923e4567-e89b-42d3-a456-426614174008";

/**
 * Creates a test UserId with a valid UUID v4.
 * @param override - Optional UUID v4 string to override the default.
 * @returns UserId branded string
 */
export function testUserId(override?: string): UserId {
  return userIdFromString(override ?? TEST_USER_ID);
}

/**
 * Creates a test AccountId with a valid UUID v4.
 * @param override - Optional UUID v4 string to override the default.
 * @returns AccountId branded string
 */
export function testAccountId(override?: string): AccountId {
  return accountIdFromString(override ?? TEST_ACCOUNT_ID_1);
}

/**
 * Creates a second test AccountId with a valid UUID v4.
 * @param override - Optional UUID v4 string to override the default.
 * @returns AccountId branded string
 */
export function testAccountId2(override?: string): AccountId {
  return accountIdFromString(override ?? TEST_ACCOUNT_ID_2);
}

/**
 * Creates a test EnvelopeId with a valid UUID v4.
 * @param override - Optional UUID v4 string to override the default.
 * @returns EnvelopeId branded string
 */
export function testEnvelopeId(override?: string): EnvelopeId {
  return envelopeIdFromString(override ?? TEST_ENVELOPE_ID);
}

/**
 * Creates a test CategoryId with a valid UUID v4.
 * @param override - Optional UUID v4 string to override the default.
 * @returns CategoryId branded string
 */
export function testCategoryId(override?: string): CategoryId {
  return categoryIdFromString(override ?? TEST_CATEGORY_ID);
}

/**
 * Creates a test CategoryGroupId with a valid UUID v4.
 * @param override - Optional UUID v4 string to override the default.
 * @returns CategoryGroupId branded string
 */
export function testCategoryGroupId(override?: string): CategoryGroupId {
  return categoryGroupIdFromString(override ?? TEST_CATEGORY_GROUP_ID);
}

/**
 * Creates a test TransactionId with a valid UUID v4.
 * @param override - Optional UUID v4 string to override the default.
 * @returns TransactionId branded string
 */
export function testTransactionId(override?: string): TransactionId {
  return transactionIdFromString(override ?? TEST_TRANSACTION_ID);
}

/**
 * Creates a test TransactionLineId with a valid UUID v4.
 * @param override - Optional UUID v4 string to override the default.
 * @returns TransactionLineId branded string
 */
export function testTransactionLineId(override?: string): TransactionLineId {
  return transactionLineIdFromString(override ?? TEST_TRANSACTION_LINE_ID_1);
}

/**
 * Creates a second test TransactionLineId with a valid UUID v4.
 * @param override - Optional UUID v4 string to override the default.
 * @returns TransactionLineId branded string
 */
export function testTransactionLineId2(override?: string): TransactionLineId {
  return transactionLineIdFromString(override ?? TEST_TRANSACTION_LINE_ID_2);
}

/**
 * Creates a third test TransactionLineId with a valid UUID v4.
 * @param override - Optional UUID v4 string to override the default.
 * @returns TransactionLineId branded string
 */
export function testTransactionLineId3(override?: string): TransactionLineId {
  return transactionLineIdFromString(override ?? TEST_TRANSACTION_LINE_ID_3);
}

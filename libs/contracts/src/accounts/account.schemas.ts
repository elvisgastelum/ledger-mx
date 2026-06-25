import { z } from "zod";
import { UuidSchema, MoneySchema } from "../common.schemas";

/**
 * Account type enum values (aligned with domain and database)
 */
export const ACCOUNT_TYPES = [
  "debit",
  "credit",
  "loan",
  "savings",
  "cash",
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

/**
 * Account status enum values
 */
export const ACCOUNT_STATUSES = ["active", "archived"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/**
 * Ownership type enum values
 */
export const OWNERSHIP_TYPES = ["user", "system"] as const;
export type OwnershipType = (typeof OWNERSHIP_TYPES)[number];

/**
 * System role enum values for system accounts
 */
export const SYSTEM_ROLES = ["expense", "income", "salary"] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number] | null;

/**
 * Schema for Account response
 */
export const AccountSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(100),
  type: z.enum(ACCOUNT_TYPES),
  balanceCents: MoneySchema.describe("Current account balance in cents"),
  currency: z
    .string()
    .length(3)
    .default("MXN")
    .describe("ISO 4217 currency code"),
  status: z
    .enum(ACCOUNT_STATUSES)
    .describe("Account status: active or archived"),
  ownership: z
    .enum(OWNERSHIP_TYPES)
    .describe("Whether this is a user or system-managed account"),
  systemRole: z
    .enum(SYSTEM_ROLES)
    .nullable()
    .describe(
      "System role for system accounts (expense, income, salary, or null)",
    ),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Account = z.infer<typeof AccountSchema>;

/**
 * Schema for creating an account
 * Note: User ID is derived from session, not from request body
 * Note: status, ownership, and systemRole cannot be set via API - they are system-managed
 */
export const CreateAccountRequestSchema = z
  .object({
    name: z.string().min(1).max(100),
    type: z.enum(ACCOUNT_TYPES),
    currency: z
      .string()
      .length(3)
      .default("MXN")
      .describe("ISO 4217 currency code"),
  })
  .strict();

export type CreateAccountRequest = z.infer<typeof CreateAccountRequestSchema>;

/**
 * Schema for updating an account
 * Note: ownership and systemRole cannot be updated via API - they are system-managed
 */
export const UpdateAccountRequestSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    type: z.enum(ACCOUNT_TYPES).optional(),
    currency: z.string().length(3).optional(),
    status: z.enum(ACCOUNT_STATUSES).optional(),
  })
  .strict();

export type UpdateAccountRequest = z.infer<typeof UpdateAccountRequestSchema>;

/**
 * Schema for single account response
 */
export const AccountResponseSchema = AccountSchema;

export type AccountResponse = z.infer<typeof AccountResponseSchema>;

/**
 * Schema for list accounts response
 */
export const ListAccountsResponseSchema = z.object({
  accounts: z.array(AccountSchema),
});

export type ListAccountsResponse = z.infer<typeof ListAccountsResponseSchema>;

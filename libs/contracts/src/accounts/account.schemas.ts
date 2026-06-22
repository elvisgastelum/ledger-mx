import { z } from "zod";
import { UuidSchema, MoneySchema } from "../common.schemas";

/**
 * Account type enum values
 */
export const ACCOUNT_TYPES = ["checking", "savings", "credit", "cash", "investment"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

/**
 * Schema for Account response
 */
export const AccountSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(100),
  type: z.enum(ACCOUNT_TYPES),
  balanceCents: MoneySchema.describe("Current account balance in cents"),
  currency: z.string().length(3).default("MXN").describe("ISO 4217 currency code"),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Account = z.infer<typeof AccountSchema>;

/**
 * Schema for creating an account
 * Note: User ID is derived from session, not from request body
 */
export const CreateAccountRequestSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(ACCOUNT_TYPES),
  currency: z.string().length(3).default("MXN").describe("ISO 4217 currency code"),
}).strict();

export type CreateAccountRequest = z.infer<typeof CreateAccountRequestSchema>;

/**
 * Schema for updating an account
 */
export const UpdateAccountRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(ACCOUNT_TYPES).optional(),
  currency: z.string().length(3).optional(),
  isActive: z.boolean().optional(),
}).strict();

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

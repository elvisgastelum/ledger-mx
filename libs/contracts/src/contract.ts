import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  ErrorResponseSchema,
  UuidSchema,
  MoneySchema,
  SignedMoneySchema,
  DateRangeQuerySchema,
  PaginationQuerySchema,
} from "./common.schemas";
import {
  CreateCategoryGroupRequestSchema,
  UpdateCategoryGroupRequestSchema,
  ListCategoryGroupsResponseSchema,
  CategoryGroupResponseSchema,
} from "./category-groups/category-group.schemas";
import {
  ApplyLayoutRequestSchema,
  ApplyLayoutResponseSchema,
} from "./onboarding/onboarding.schemas";
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  AuthSuccessResponseSchema,
  LogoutResponseSchema,
} from "./auth";
import {
  AccountResponseSchema,
  ListAccountsResponseSchema,
  CreateAccountRequestSchema,
  UpdateAccountRequestSchema,
} from "./accounts/account.schemas";
import {
  TransactionResponseSchema,
  ListTransactionsResponseSchema,
  CreateTransactionRequestSchema,
  CreateReversalRequestSchema,
} from "./transactions/transaction.schemas";
import {
  AccountBalanceResponseSchema,
  BalancesByAccountTypeResponseSchema,
  LiabilityBalancesResponseSchema,
  GeneralBalanceResponseSchema,
} from "./balances/balance.schemas";
import {
  CreateCategoryRequestSchema,
  UpdateCategoryRequestSchema,
  ListCategoriesResponseSchema,
  GetCategoryResponseSchema,
  CategoryResponseSchema,
} from "./categories/category.schemas";
import {
  EnvelopeResponseSchema,
  ListEnvelopesResponseSchema,
  CreateEnvelopeRequestSchema,
  UpdateEnvelopeRequestSchema,
  FundEnvelopeRequestSchema,
  AllocateEnvelopeRequestSchema,
  EnvelopeBalanceResponseSchema,
  EnvelopeTransactionsResponseSchema,
} from "./envelopes";

const c = initContract();

/**
 * Root API contract (single source of truth for API shape)
 * All implemented endpoints are fully typed; planned endpoints are marked as such.
 */
export const contract = c.router(
  {
    // AUTH ENDPOINTS (implemented, matches actual /auth/* routes)
    auth: c.router({
      register: {
        method: "POST",
        path: "/auth/register",
        body: RegisterRequestSchema,
        responses: {
          201: AuthSuccessResponseSchema,
          400: ErrorResponseSchema,
          409: ErrorResponseSchema.describe("Email already registered"),
        },
        summary: "Register a new user and return auth tokens",
        metadata: { implemented: true, auth: false },
      },
      login: {
        method: "POST",
        path: "/auth/login",
        body: LoginRequestSchema,
        responses: {
          200: AuthSuccessResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema.describe("Invalid email or password"),
        },
        summary: "Login with email and password, return auth tokens",
        metadata: { implemented: true, auth: false },
      },
      refresh: {
        method: "POST",
        path: "/auth/refresh",
        body: z.void(),
        responses: {
          200: AuthSuccessResponseSchema,
          401: ErrorResponseSchema.describe("Invalid or expired refresh token"),
        },
        summary: "Refresh access token using a valid refresh token",
        metadata: { implemented: true, auth: false },
      },
      logout: {
        method: "POST",
        path: "/auth/logout",
        body: z.void(),
        responses: {
          200: LogoutResponseSchema.describe("Logout successful"),
          401: ErrorResponseSchema.describe("Invalid refresh token"),
        },
        summary: "Invalidate a refresh token (logout)",
        metadata: { implemented: true, auth: false },
      },
    }),

    // CATEGORY GROUPS ENDPOINTS (implemented, matches actual /category-groups routes)
    categoryGroups: c.router({
      list: {
        method: "GET",
        path: "/category-groups",
        query: PaginationQuerySchema.optional(),
        responses: {
          200: ListCategoryGroupsResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: "List all category groups for the authenticated user",
        metadata: { implemented: true, auth: true, scopes: ["user:read"] },
      },
      create: {
        method: "POST",
        path: "/category-groups",
        body: CreateCategoryGroupRequestSchema,
        responses: {
          201: CategoryGroupResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: "Create a new category group for the authenticated user",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
      update: {
        method: "PATCH",
        path: "/category-groups/:id",
        pathParams: z.object({ id: UuidSchema }),
        body: UpdateCategoryGroupRequestSchema,
        responses: {
          200: CategoryGroupResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Category group not found or not owned by user",
          ),
        },
        summary: "Update an existing category group by ID",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
      delete: {
        method: "DELETE",
        path: "/category-groups/:id",
        pathParams: z.object({ id: UuidSchema }),
        responses: {
          204: z.void(),
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Category group not found or not owned by user",
          ),
        },
        summary: "Delete a category group by ID",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
    }),

    // CATEGORIES ENDPOINTS (implemented)
    categories: c.router({
      list: {
        method: "GET",
        path: "/categories",
        query: z
          .object({
            categoryGroupId: UuidSchema.optional(),
          })
          .optional(),
        responses: {
          200: ListCategoriesResponseSchema,
          401: ErrorResponseSchema,
        },
        summary:
          "List all categories for the authenticated user, optionally filtered by group",
        metadata: { implemented: true, auth: true, scopes: ["user:read"] },
      },
      create: {
        method: "POST",
        path: "/categories",
        body: CreateCategoryRequestSchema,
        responses: {
          201: CategoryResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Category group not found or not owned by user",
          ),
        },
        summary: "Create a new category for the authenticated user",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
      get: {
        method: "GET",
        path: "/categories/:id",
        pathParams: z.object({ id: UuidSchema }),
        responses: {
          200: GetCategoryResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Category not found or not owned by user",
          ),
        },
        summary: "Get a single category by ID",
        metadata: { implemented: true, auth: true, scopes: ["user:read"] },
      },
      update: {
        method: "PUT",
        path: "/categories/:id",
        pathParams: z.object({ id: UuidSchema }),
        body: UpdateCategoryRequestSchema,
        responses: {
          200: CategoryResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Category not found or not owned by user",
          ),
        },
        summary: "Update an existing category by ID",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
      archive: {
        method: "POST",
        path: "/categories/:id/archive",
        pathParams: z.object({ id: UuidSchema }),
        body: z.void(),
        responses: {
          204: z.void(),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Category not found or not owned by user",
          ),
        },
        summary: "Archive a category by ID (soft delete)",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
    }),

    // ACCOUNTS ENDPOINTS (implemented)
    accounts: c.router({
      list: {
        method: "GET",
        path: "/accounts",
        query: PaginationQuerySchema.optional(),
        responses: {
          200: ListAccountsResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: "List all accounts for the authenticated user",
        metadata: { implemented: true, auth: true, scopes: ["user:read"] },
      },
      create: {
        method: "POST",
        path: "/accounts",
        body: CreateAccountRequestSchema,
        responses: {
          201: AccountResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: "Create a new account for the authenticated user",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
      update: {
        method: "PATCH",
        path: "/accounts/:id",
        pathParams: z.object({ id: UuidSchema }),
        body: UpdateAccountRequestSchema,
        responses: {
          200: AccountResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Account not found or not owned by user",
          ),
        },
        summary: "Update an existing account by ID",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
      archive: {
        method: "DELETE",
        path: "/accounts/:id",
        pathParams: z.object({ id: UuidSchema }),
        responses: {
          204: z.void(),
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Account not found or not owned by user",
          ),
        },
        summary: "Archive an account by ID (soft delete)",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
    }),

    // ENVELOPES ENDPOINTS (implemented)
    envelopes: c.router({
      list: {
        method: "GET",
        path: "/envelopes",
        query: PaginationQuerySchema.optional(),
        responses: {
          200: ListEnvelopesResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: "List all envelopes for the authenticated user",
        metadata: { implemented: true, auth: true, scopes: ["user:read"] },
      },
      create: {
        method: "POST",
        path: "/envelopes",
        body: CreateEnvelopeRequestSchema,
        responses: {
          201: EnvelopeResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: "Create a new envelope for the authenticated user",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
      get: {
        method: "GET",
        path: "/envelopes/:id",
        pathParams: z.object({ id: UuidSchema }),
        responses: {
          200: EnvelopeResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Envelope not found or not owned by user",
          ),
        },
        summary: "Get a single envelope by ID",
        metadata: { implemented: true, auth: true, scopes: ["user:read"] },
      },
      update: {
        method: "PATCH",
        path: "/envelopes/:id",
        pathParams: z.object({ id: UuidSchema }),
        body: UpdateEnvelopeRequestSchema,
        responses: {
          200: EnvelopeResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Envelope not found or not owned by user",
          ),
        },
        summary: "Update an existing envelope by ID",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
      archive: {
        method: "DELETE",
        path: "/envelopes/:id",
        pathParams: z.object({ id: UuidSchema }),
        responses: {
          204: z.void(),
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Envelope not found or not owned by user",
          ),
        },
        summary: "Archive an envelope by ID (soft delete)",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
      fund: {
        method: "POST",
        path: "/envelopes/:id/fund",
        pathParams: z.object({ id: UuidSchema }),
        body: FundEnvelopeRequestSchema,
        responses: {
          200: EnvelopeResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Envelope or account not found or not owned by user",
          ),
        },
        summary: "Fund an envelope from an account",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
      allocate: {
        method: "POST",
        path: "/envelopes/:id/allocate",
        pathParams: z.object({ id: UuidSchema }),
        body: AllocateEnvelopeRequestSchema,
        responses: {
          200: EnvelopeResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Envelope or account not found or not owned by user",
          ),
        },
        summary: "Allocate budget to an envelope from an account",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
      getBalance: {
        method: "GET",
        path: "/envelopes/:id/balance",
        pathParams: z.object({ id: UuidSchema }),
        responses: {
          200: EnvelopeBalanceResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Envelope not found or not owned by user",
          ),
        },
        summary: "Get balance for a specific envelope",
        metadata: { implemented: true, auth: true, scopes: ["user:read"] },
      },
      getTransactions: {
        method: "GET",
        path: "/envelopes/:id/transactions",
        pathParams: z.object({ id: UuidSchema }),
        responses: {
          200: EnvelopeTransactionsResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Envelope not found or not owned by user",
          ),
        },
        summary: "Get transactions for a specific envelope",
        metadata: { implemented: true, auth: true, scopes: ["user:read"] },
      },
    }),

    // TRANSACTIONS ENDPOINTS (implemented)
    transactions: c.router({
      list: {
        method: "GET",
        path: "/transactions",
        query: PaginationQuerySchema.optional(),
        responses: {
          200: ListTransactionsResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: "List all transactions for the authenticated user",
        metadata: { implemented: true, auth: true, scopes: ["user:read"] },
      },
      create: {
        method: "POST",
        path: "/transactions",
        body: CreateTransactionRequestSchema,
        responses: {
          201: TransactionResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: "Create a new transaction (double-entry)",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
      reverse: {
        method: "POST",
        path: "/transactions/:id/reverse",
        pathParams: z.object({ id: UuidSchema }),
        body: CreateReversalRequestSchema,
        responses: {
          201: TransactionResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Transaction not found or not owned by user",
          ),
          409: ErrorResponseSchema.describe(
            "Transaction already has a reversal",
          ),
        },
        summary:
          "Create a reversal transaction to negate an existing transaction",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
    }),

    // BALANCES ENDPOINTS (implemented)
    balances: c.router({
      general: {
        method: "GET",
        path: "/balances",
        responses: {
          200: GeneralBalanceResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: "Get general balance summary (assets, liabilities, net worth)",
        metadata: { implemented: true, auth: true, scopes: ["user:read"] },
      },
      getAccount: {
        method: "GET",
        path: "/balances/accounts/:accountId",
        pathParams: z.object({ accountId: UuidSchema }),
        responses: {
          200: AccountBalanceResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema.describe(
            "Account not found or not owned by user",
          ),
        },
        summary: "Get balance for a specific account",
        metadata: { implemented: true, auth: true, scopes: ["user:read"] },
      },
      byAccountType: {
        method: "GET",
        path: "/balances/by-account-type",
        responses: {
          200: BalancesByAccountTypeResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: "Get balances grouped by account type",
        metadata: { implemented: true, auth: true, scopes: ["user:read"] },
      },
      liabilities: {
        method: "GET",
        path: "/balances/liabilities",
        responses: {
          200: LiabilityBalancesResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: "Get balances for liability accounts (credit and loan)",
        metadata: { implemented: true, auth: true, scopes: ["user:read"] },
      },
    }),

    // ONBOARDING ENDPOINTS (implemented, matches actual /onboarding/layout route)
    onboarding: c.router({
      applyLayout: {
        method: "POST",
        path: "/onboarding/layout",
        body: ApplyLayoutRequestSchema,
        responses: {
          200: ApplyLayoutResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: "Apply a default category group layout during user onboarding",
        metadata: { implemented: true, auth: true, scopes: ["user:write"] },
      },
    }),

    // REPORTS ENDPOINTS (implemented)
    reports: c.router({
      getSpendableBalance: {
        method: "GET",
        path: "/reports/spendable-balance",
        query: DateRangeQuerySchema.optional(),
        responses: {
          200: z
            .object({
              accountBalance: SignedMoneySchema.describe(
                "Total balance across all accounts (can be negative for liabilities)",
              ),
              envelopeAllocations: MoneySchema.describe(
                "Total allocated to envelopes (non-negative)",
              ),
              upcomingObligations: MoneySchema.describe(
                "Placeholder for upcoming obligations (MVP card 028 not yet implemented) - currently always 0",
              ),
              spendableBalance: SignedMoneySchema.describe(
                "Available spendable balance = accountBalance - envelopeAllocations - upcomingObligations",
              ),
              asOfDate: z
                .string()
                .datetime({ offset: true })
                .nullable()
                .describe("Point-in-time date for the balance calculation"),
            })
            .describe("Spendable balance calculation"),
          401: ErrorResponseSchema,
        },
        summary: "Get spendable balance for a date range",
        metadata: {
          implemented: true,
          auth: true,
          scopes: ["user:read"],
        },
      },
      getExpensesByCategory: {
        method: "GET",
        path: "/reports/expenses-by-category",
        query: DateRangeQuerySchema.optional(),
        responses: {
          200: z
            .array(
              z.object({
                categoryGroupId: UuidSchema,
                categoryGroupName: z.string(),
                totalExpenses: MoneySchema.describe(
                  "Total expenses for this category group (absolute value in cents)",
                ),
                percentageOfTotal: z
                  .number()
                  .min(0)
                  .max(100)
                  .describe("Percentage of total expenses"),
              }),
            )
            .describe("Expenses grouped by category"),
          401: ErrorResponseSchema,
        },
        summary: "Get expenses grouped by category for a date range",
        metadata: {
          implemented: true,
          auth: true,
          scopes: ["user:read"],
        },
      },
      getDebtProgress: {
        method: "GET",
        path: "/reports/debt-progress",
        query: DateRangeQuerySchema.optional(),
        responses: {
          200: z
            .object({
              totalDebt: MoneySchema.describe(
                "Total outstanding debt (non-negative)",
              ),
              paidDebt: MoneySchema.describe(
                "Placeholder - no reliable basis for paid debt yet - currently always 0",
              ),
              remainingDebt: MoneySchema.describe(
                "Remaining debt to pay off (non-negative)",
              ),
              progressPercentage: z
                .number()
                .min(0)
                .max(100)
                .describe(
                  "Placeholder - no reliable basis yet - currently always 0",
                ),
              interest: MoneySchema.describe(
                "Placeholder - no interest calculation yet - currently always 0",
              ),
              payoffDate: z
                .string()
                .datetime({ offset: true })
                .nullable()
                .describe("Placeholder - no payoff calculation yet"),
              liabilityAccounts: z
                .array(
                  z.object({
                    accountId: UuidSchema,
                    accountName: z.string(),
                    accountType: z
                      .enum(["credit", "loan"])
                      .describe("Liability account type"),
                    currentBalance: SignedMoneySchema.describe(
                      "Current balance (negative for outstanding debt)",
                    ),
                  }),
                )
                .describe("Liability account details"),
            })
            .describe("Debt payoff progress"),
          401: ErrorResponseSchema,
        },
        summary: "Get debt payoff progress for a date range",
        metadata: {
          implemented: true,
          auth: true,
          scopes: ["user:read"],
        },
      },
    }),

    // EXPORT ENDPOINTS (implemented)
    export: c.router({
      downloadCsv: {
        method: "GET",
        path: "/export/csv",
        query: DateRangeQuerySchema.optional(),
        responses: {
          200: z.string().min(1),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
        },
        summary:
          "Download transactions as a CSV file with optional date range filter",
        metadata: { implemented: true, auth: true, scopes: ["user:read"] },
      },
    }),

    // HEALTH ENDPOINTS (planned, not yet implemented)
    health: c.router({
      liveness: {
        method: "GET",
        path: "/health/liveness",
        responses: {
          200: z
            .object({ status: z.literal("ok") })
            .describe("Liveness check passed"),
          503: ErrorResponseSchema.describe("Service unavailable"),
        },
        summary: "Kubernetes liveness probe endpoint",
        metadata: { implemented: false, auth: false, planned: true },
      },
      readiness: {
        method: "GET",
        path: "/health/readiness",
        responses: {
          200: z
            .object({
              status: z.literal("ok"),
              checks: z.object({
                database: z.boolean(),
                redis: z.boolean().optional(),
              }),
            })
            .describe("Readiness check passed"),
          503: ErrorResponseSchema.describe(
            "Service not ready (dependent systems down)",
          ),
        },
        summary: "Kubernetes readiness probe endpoint",
        metadata: { implemented: false, auth: false, planned: true },
      },
    }),
  },
  { pathPrefix: "/api/v1" },
);

export type Contract = typeof contract;

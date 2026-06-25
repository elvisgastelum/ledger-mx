import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  ErrorResponseSchema,
  UuidSchema,
  MoneySchema,
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
} from "./transactions/transaction.schemas";

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

    // REPORTS ENDPOINTS (planned, not yet implemented)
    reports: c.router({
      getSpendableBalance: {
        method: "GET",
        path: "/reports/spendable-balance",
        query: DateRangeQuerySchema.optional(),
        responses: {
          200: z
            .object({
              totalIncome: MoneySchema,
              totalExpenses: MoneySchema,
              spendableBalance: MoneySchema,
            })
            .describe("Spendable balance calculation"),
          401: ErrorResponseSchema,
          501: ErrorResponseSchema.describe("Endpoint not yet implemented"),
        },
        summary: "Get spendable balance for a date range",
        metadata: {
          implemented: false,
          auth: true,
          scopes: ["user:read"],
          planned: true,
        },
      },
      getExpensesByCategory: {
        method: "GET",
        path: "/reports/expenses-by-category",
        query: DateRangeQuerySchema,
        responses: {
          200: z
            .array(
              z.object({
                categoryGroupId: UuidSchema,
                categoryGroupName: z.string(),
                totalExpenses: MoneySchema,
                percentageOfTotal: z.number().min(0).max(100),
              }),
            )
            .describe("Expenses grouped by category"),
          401: ErrorResponseSchema,
          501: ErrorResponseSchema.describe("Endpoint not yet implemented"),
        },
        summary: "Get expenses grouped by category for a date range",
        metadata: {
          implemented: false,
          auth: true,
          scopes: ["user:read"],
          planned: true,
        },
      },
      getDebtProgress: {
        method: "GET",
        path: "/reports/debt-progress",
        query: DateRangeQuerySchema.optional(),
        responses: {
          200: z
            .object({
              totalDebt: MoneySchema,
              paidDebt: MoneySchema,
              remainingDebt: MoneySchema,
              progressPercentage: z.number().min(0).max(100),
            })
            .describe("Debt payoff progress"),
          401: ErrorResponseSchema,
          501: ErrorResponseSchema.describe("Endpoint not yet implemented"),
        },
        summary: "Get debt payoff progress for a date range",
        metadata: {
          implemented: false,
          auth: true,
          scopes: ["user:read"],
          planned: true,
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

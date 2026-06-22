import { z } from "zod";

/**
 * Standard error response schema for all API endpoints
 */
export const ErrorResponseSchema = z.object({
  error: z.string().min(1).describe("Error type identifier (e.g., 'VALIDATION_ERROR', 'UNAUTHORIZED')"),
  message: z.string().min(1).describe("Human-readable error description"),
  statusCode: z.number().int().min(100).max(599).describe("HTTP status code matching the response"),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Reusable UUID v4 schema for path/body parameters
 */
export const UuidSchema = z.string().uuid().describe("UUID v4 identifier");

/**
 * Monetary value schema (stored as integer cents to avoid floating point errors)
 */
export const MoneySchema = z.number().int().min(0).describe("Monetary value in cents (1/100 of currency unit)");

/**
 * Signed monetary value schema (can be negative for transaction lines)
 */
export const SignedMoneySchema = z.number().int().describe("Signed monetary value in cents (negative for outflow, positive for inflow)");

/**
 * Common date range query parameters for time-series endpoints
 */
export const DateRangeQuerySchema = z.object({
  startDate: z.string().datetime({ offset: true }).optional().describe("Inclusive start of date range (ISO 8601)"),
  endDate: z.string().datetime({ offset: true }).optional().describe("Inclusive end of date range (ISO 8601)"),
});

export type DateRangeQuery = z.infer<typeof DateRangeQuerySchema>;

/**
 * Common pagination query parameters for list endpoints
 */
export const PaginationQuerySchema = z.object({
  page: z.number().int().min(1).optional().describe("Page number (1-based)"),
  limit: z.number().int().min(1).max(100).optional().describe("Number of items per page (max 100)"),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

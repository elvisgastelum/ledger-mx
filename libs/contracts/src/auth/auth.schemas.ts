import { z } from "zod";
import { ErrorResponseSchema, UuidSchema } from "../common.schemas";

// Password complexity: at least one uppercase, one lowercase, one number, and one special character
const passwordSchema = z
  .string()
  .min(8, { message: "password must be at least 8 characters long" })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  });

/**
 * Request body for user registration
 */
export const RegisterRequestSchema = z.object({
  email: z.string().email({ message: "email must be a valid email address" }).describe("User's email address (used for login)"),
  password: passwordSchema.describe("User's password (min 8 chars, uppercase, lowercase, number, special char)"),
  displayName: z.string().max(100).optional().describe("Optional display name for the user"),
  deviceName: z.string().max(200).optional().describe("Optional device name for session tracking"),
  rememberMe: z.boolean().optional().describe("If true, extends refresh token expiry to 30 days"),
}).strict();

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

/**
 * Request body for user login
 */
export const LoginRequestSchema = z.object({
  email: z.string().email({ message: "email must be a valid email address" }).describe("User's email address"),
  password: passwordSchema.describe("User's password"),
  deviceName: z.string().max(200).optional().describe("Optional device name for session tracking"),
  rememberMe: z.boolean().optional().describe("If true, extends refresh token expiry to 30 days"),
}).strict();

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * Request body for refreshing access tokens
 * Refresh token can come from cookie or optionally from body
 */
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().optional().describe("Refresh token (can also be provided via httpOnly cookie)"),
}).strict();

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

/**
 * Request body for user logout
 * Refresh token can come from cookie or optionally from body
 */
export const LogoutRequestSchema = z.object({
  refreshToken: z.string().optional().describe("Refresh token to invalidate (can also be provided via httpOnly cookie)"),
}).strict();

export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;

/**
 * Response body for successful authentication (register/login/refresh)
 * Note: refreshToken is set as httpOnly cookie, not returned in JSON body
 */
export const AuthSuccessResponseSchema = z.object({
  accessToken: z.string().min(1).describe("JWT access token (short-lived)"),
  sessionId: z.string().min(1).describe("Session ID for the active session"),
  user: z.object({
    id: UuidSchema,
    email: z.string().email(),
    displayName: z.string().optional().describe("User's display name, if set"),
  }).describe("Authenticated user summary"),
});

export type AuthSuccessResponse = z.infer<typeof AuthSuccessResponseSchema>;

/**
 * Response body for logout
 */
export const LogoutResponseSchema = z.object({
  success: z.literal(true).describe("Indicates logout was successful"),
});

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

// Export all auth schemas
export { ErrorResponseSchema, UuidSchema };

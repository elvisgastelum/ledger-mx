import type { UserId } from "@ledger-mx/domain";

/**
 * Payload contained within a signed access token.
 */
export interface AccessTokenPayload {
  /** Subject (user ID) */
  sub: UserId;
  /** User's email */
  email: string;
  /** Optional session ID for token binding */
  sessionId?: string;
}

/**
 * Port for JWT token operations.
 * Infrastructure will implement this (e.g., using jsonwebtoken or @nestjs/jwt).
 */
export interface TokenService {
  /**
   * Signs an access token with the given payload.
   * @param payload - The payload to sign
   * @returns The signed JWT access token
   */
  signAccessToken(payload: AccessTokenPayload): Promise<string>;

  /**
   * Generates a cryptographically random refresh token.
   * @returns A raw refresh token string
   */
  generateRefreshToken(): Promise<string>;

  /**
   * Hashes a refresh token for secure storage.
   * @param token - The raw refresh token
   * @returns The hashed token
   */
  hashRefreshToken(token: string): Promise<string>;
}

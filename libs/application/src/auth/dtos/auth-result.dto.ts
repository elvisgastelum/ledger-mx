import type { UserId } from "@ledger-mx/domain";

/**
 * Result returned after successful authentication.
 */
export interface AuthResult {
  /** JWT access token */
  accessToken: string;
  /** Raw refresh token (returned only once on creation/rotation) */
  refreshToken: string;
  /** Session ID associated with this auth */
  sessionId: string;
  /** Basic user information */
  user: {
    id: UserId;
    email: string;
    displayName?: string | null;
  };
}

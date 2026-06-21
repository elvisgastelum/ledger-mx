import type { SessionId, AuthSession } from "../auth/auth-session";
import type { UserId } from "../value-objects/uuid";

/**
 * Repository interface for persisting and retrieving auth sessions.
 * Framework-agnostic, no implementation details.
 */
export interface SessionRepository {
  /**
   * Saves a new session.
   * @param session - The session to save
   */
  save(session: AuthSession): Promise<void>;

  /**
   * Updates an existing session.
   * @param session - The session to update
   */
  update(session: AuthSession): Promise<void>;

  /**
   * Finds a session by its ID.
   * @param id - The session ID to search for
   * @param userId - Optional user ID to scope the search
   * @returns The session or null if not found
   */
  findById(id: SessionId, userId?: UserId): Promise<AuthSession | null>;

  /**
   * Finds a session by its refresh token hash.
   * @param hash - The hashed refresh token to search for
   * @returns The session or null if not found
   */
  findByRefreshTokenHash(hash: string): Promise<AuthSession | null>;

  /**
   * Finds all active sessions for a user.
   * @param userId - The user ID to search for
   * @returns Array of active sessions
   */
  findActiveByUserId(userId: UserId): Promise<AuthSession[]>;

  /**
   * Revokes a specific session.
   * @param sessionId - The session ID to revoke
   * @param userId - The user ID that owns the session
   * @param revokedAt - When the session was revoked
   */
  revoke(sessionId: SessionId, userId: UserId, revokedAt: Date): Promise<void>;

  /**
   * Revokes all sessions for a user.
   * @param userId - The user ID whose sessions should be revoked
   * @param revokedAt - When the sessions were revoked
   */
  revokeAllForUser(userId: UserId, revokedAt: Date): Promise<void>;
}

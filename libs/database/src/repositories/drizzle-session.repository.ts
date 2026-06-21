import { eq, and, isNull } from "drizzle-orm";
import type {
  AuthSession,
  SessionRepository,
  SessionId,
} from "@ledger-mx/domain";
import type { UserId } from "@ledger-mx/domain";
import type { Database } from "../connection";
import { sessions } from "../schema";

/**
 * Drizzle ORM implementation of SessionRepository.
 */
export class DrizzleSessionRepository implements SessionRepository {
  constructor(private readonly db: Database) {}

  async save(session: AuthSession): Promise<void> {
    await this.db
      .insert(sessions)
      .values(this.mapToDb(session))
      .onConflictDoUpdate({
        target: sessions.id,
        set: {
          refreshTokenHash: session.refreshTokenHash,
          deviceName: session.deviceName ?? null,
          ipAddress: session.ipAddress ?? null,
          userAgent: session.userAgent ?? null,
          lastActiveAt: session.lastActiveAt,
          expiresAt: session.expiresAt,
          revokedAt: session.revokedAt ?? null,
          updatedAt: new Date(),
        },
      });
  }

  async update(session: AuthSession): Promise<void> {
    await this.db
      .update(sessions)
      .set({
        refreshTokenHash: session.refreshTokenHash,
        deviceName: session.deviceName ?? null,
        ipAddress: session.ipAddress ?? null,
        userAgent: session.userAgent ?? null,
        lastActiveAt: session.lastActiveAt,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt ?? null,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, session.id));
  }

  async findById(id: SessionId, userId?: UserId): Promise<AuthSession | null> {
    const conditions = [eq(sessions.id, id)];

    if (userId) {
      conditions.push(eq(sessions.userId, userId));
    }

    const result = await this.db
      .select()
      .from(sessions)
      .where(and(...conditions))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToDomain(result[0]);
  }

  async findByRefreshTokenHash(hash: string): Promise<AuthSession | null> {
    const result = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.refreshTokenHash, hash))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToDomain(result[0]);
  }

  async findActiveByUserId(userId: UserId): Promise<AuthSession[]> {
    const result = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));

    return result.map((row) => this.mapToDomain(row));
  }

  async revoke(
    sessionId: SessionId,
    userId: UserId,
    revokedAt: Date,
  ): Promise<void> {
    await this.db
      .update(sessions)
      .set({
        revokedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
  }

  async revokeAllForUser(userId: UserId, revokedAt: Date): Promise<void> {
    await this.db
      .update(sessions)
      .set({
        revokedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }

  private mapToDomain(row: typeof sessions.$inferSelect): AuthSession {
    return {
      id: row.id as SessionId,
      userId: row.userId as UserId,
      refreshTokenHash: row.refreshTokenHash,
      deviceName: row.deviceName ?? undefined,
      ipAddress: row.ipAddress ?? undefined,
      userAgent: row.userAgent ?? undefined,
      lastActiveAt: row.lastActiveAt,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapToDb(session: AuthSession) {
    return {
      id: session.id,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      deviceName: session.deviceName ?? null,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt ?? null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}

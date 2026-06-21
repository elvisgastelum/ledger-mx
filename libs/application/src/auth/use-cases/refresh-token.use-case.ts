import type { SessionRepository } from "@ledger-mx/domain";
import type { AuthAuditLog, AuthAuditLogRepository } from "@ledger-mx/domain";
import type { UserRepository } from "@ledger-mx/domain";
import type { TokenService } from "../ports/token-service.port";
import type { Clock } from "../ports/clock.port";
import type { IdGenerator } from "../ports/id-generator.port";
import type { AuthRequestContext } from "../dtos/auth-context.dto";
import type { AuthResult } from "../dtos/auth-result.dto";
import {
  InvalidCredentialsError,
  SessionExpiredError,
  TokenReuseDetectedError,
} from "@ledger-mx/domain";

export interface RefreshTokenInput {
  refreshToken: string;
  context?: AuthRequestContext;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly userRepository: UserRepository,
    private readonly auditLogRepository: AuthAuditLogRepository,
    private readonly tokenService: TokenService,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: RefreshTokenInput): Promise<AuthResult> {
    const now = this.clock.now();

    // Hash the raw refresh token to find the session
    const refreshTokenHash = await this.tokenService.hashRefreshToken(
      input.refreshToken,
    );

    const session =
      await this.sessionRepository.findByRefreshTokenHash(refreshTokenHash);

    // Session not found - potential token reuse
    if (!session) {
      await this.recordAudit({
        id: this.generateId(),
        userId: null,
        eventType: "token_reuse_detected",
        ipAddress: input.context?.ipAddress,
        userAgent: input.context?.userAgent,
        metadata: { reason: "session_not_found" },
        createdAt: now,
      });
      throw new TokenReuseDetectedError();
    }

    // Check if session is revoked - revoke all user sessions (reuse detection)
    if (session.revokedAt) {
      await this.sessionRepository.revokeAllForUser(session.userId, now);
      await this.recordAudit({
        id: this.generateId(),
        userId: session.userId,
        eventType: "token_reuse_detected",
        ipAddress: input.context?.ipAddress,
        userAgent: input.context?.userAgent,
        metadata: { sessionId: session.id, reason: "session_revoked" },
        createdAt: now,
      });
      throw new TokenReuseDetectedError();
    }

    // Check if session is expired
    if (session.expiresAt.getTime() < now.getTime()) {
      await this.recordAudit({
        id: this.generateId(),
        userId: session.userId,
        eventType: "token_reuse_detected",
        ipAddress: input.context?.ipAddress,
        userAgent: input.context?.userAgent,
        metadata: { sessionId: session.id, reason: "session_expired" },
        createdAt: now,
      });
      throw new SessionExpiredError();
    }

    // Session is active - rotate refresh token
    const user = await this.userRepository.findById(session.userId);
    if (!user || user.deletedAt) {
      throw new InvalidCredentialsError();
    }

    // Generate new tokens
    const newRefreshToken = await this.tokenService.generateRefreshToken();
    const newRefreshTokenHash =
      await this.tokenService.hashRefreshToken(newRefreshToken);
    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      sessionId: session.id as string,
    });

    // Update session with new refresh token hash and context
    session.refreshTokenHash = newRefreshTokenHash;
    session.lastActiveAt = now;
    session.updatedAt = now;
    // Extend session expiry by original duration
    const sessionDuration =
      session.expiresAt.getTime() - session.createdAt.getTime();
    session.expiresAt = new Date(now.getTime() + sessionDuration);
    if (input.context?.deviceName !== undefined) {
      session.deviceName = input.context.deviceName;
    }
    if (input.context?.ipAddress !== undefined) {
      session.ipAddress = input.context.ipAddress;
    }
    if (input.context?.userAgent !== undefined) {
      session.userAgent = input.context.userAgent;
    }
    await this.sessionRepository.update(session);

    // Record audit
    await this.recordAudit({
      id: this.generateId(),
      userId: user.id,
      eventType: "token_refreshed",
      ipAddress: input.context?.ipAddress,
      userAgent: input.context?.userAgent,
      metadata: { sessionId: session.id },
      createdAt: now,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      sessionId: session.id as string,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }

  private generateId(): string {
    return this.idGenerator.uuid();
  }

  private async recordAudit(event: AuthAuditLog): Promise<void> {
    await this.auditLogRepository.record(event);
  }
}

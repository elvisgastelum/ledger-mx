import type { SessionRepository } from "@ledger-mx/domain";
import type { AuthAuditLog, AuthAuditLogRepository } from "@ledger-mx/domain";
import type { UserId } from "@ledger-mx/domain";
import type { TokenService } from "../ports/token-service.port";
import type { Clock } from "../ports/clock.port";
import type { IdGenerator } from "../ports/id-generator.port";
import { InvalidCredentialsError } from "@ledger-mx/domain";
import type { AuthRequestContext } from "../dtos/auth-context.dto";

export interface LogoutInput {
  refreshToken: string;
  userId?: UserId;
  context?: AuthRequestContext;
}

export interface LogoutResult {
  success: boolean;
}

export class LogoutUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly auditLogRepository: AuthAuditLogRepository,
    private readonly tokenService: TokenService,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: LogoutInput): Promise<LogoutResult> {
    const now = this.clock.now();

    // Hash the raw refresh token to find the session
    const refreshTokenHash = await this.tokenService.hashRefreshToken(
      input.refreshToken,
    );

    const session =
      await this.sessionRepository.findByRefreshTokenHash(refreshTokenHash);

    // If not found, return success (idempotent logout)
    if (!session) {
      return { success: true };
    }

    // If userId provided, verify it matches
    if (input.userId && session.userId !== input.userId) {
      throw new InvalidCredentialsError();
    }

    // Revoke the session
    await this.sessionRepository.revoke(session.id, session.userId, now);

    // Record audit
    await this.recordAudit({
      id: this.generateId(),
      userId: session.userId,
      eventType: "logout",
      ipAddress: input.context?.ipAddress,
      userAgent: input.context?.userAgent,
      metadata: { sessionId: session.id },
      createdAt: now,
    });

    return { success: true };
  }

  private generateId(): string {
    return this.idGenerator.uuid();
  }

  private async recordAudit(event: AuthAuditLog): Promise<void> {
    await this.auditLogRepository.record(event);
  }
}

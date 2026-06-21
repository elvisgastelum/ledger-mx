import type { UserRepository } from "@ledger-mx/domain";
import type { AuthSession, SessionRepository } from "@ledger-mx/domain";
import type { AuthAuditLog, AuthAuditLogRepository } from "@ledger-mx/domain";
import type { PasswordHasher } from "../ports/password-hasher.port";
import type { TokenService } from "../ports/token-service.port";
import type { Clock } from "../ports/clock.port";
import type { IdGenerator } from "../ports/id-generator.port";
import type { AuthRequestContext } from "../dtos/auth-context.dto";
import type { AuthResult } from "../dtos/auth-result.dto";
import { InvalidCredentialsError } from "@ledger-mx/domain";
import { sessionIdFromString } from "@ledger-mx/domain";

export interface LoginUserInput {
  email: string;
  password: string;
  context?: AuthRequestContext;
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly auditLogRepository: AuthAuditLogRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: LoginUserInput): Promise<AuthResult> {
    const now = this.clock.now();
    const email = input.email.toLowerCase().trim();

    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.deletedAt) {
      await this.recordAudit({
        id: this.idGenerator.uuid(),
        userId: user?.id ?? null,
        eventType: "login_failed",
        ipAddress: input.context?.ipAddress,
        userAgent: input.context?.userAgent,
        metadata: { reason: "user_not_found_or_deleted", email },
        createdAt: now,
      });
      throw new InvalidCredentialsError();
    }

    // Verify password
    if (!user.passwordHash) {
      await this.recordAudit({
        id: this.idGenerator.uuid(),
        userId: user.id,
        eventType: "login_failed",
        ipAddress: input.context?.ipAddress,
        userAgent: input.context?.userAgent,
        metadata: { reason: "no_password_set" },
        createdAt: now,
      });
      throw new InvalidCredentialsError();
    }

    const passwordValid = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );
    if (!passwordValid) {
      await this.recordAudit({
        id: this.idGenerator.uuid(),
        userId: user.id,
        eventType: "login_failed",
        ipAddress: input.context?.ipAddress,
        userAgent: input.context?.userAgent,
        metadata: { reason: "invalid_password" },
        createdAt: now,
      });
      throw new InvalidCredentialsError();
    }

    // Create session (7 days default, 15 days with rememberMe)
    const sessionId = this.idGenerator.uuid();
    const sessionExpiryDays = input.context?.rememberMe ? 15 : 7;
    const expiresAt = new Date(
      now.getTime() + sessionExpiryDays * 24 * 60 * 60 * 1000,
    );

    // Generate tokens
    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      sessionId: sessionId,
    });
    const refreshToken = await this.tokenService.generateRefreshToken();
    const refreshTokenHash =
      await this.tokenService.hashRefreshToken(refreshToken);

    const session: AuthSession = {
      id: sessionIdFromString(sessionId),
      userId: user.id,
      refreshTokenHash,
      deviceName: input.context?.deviceName,
      ipAddress: input.context?.ipAddress,
      userAgent: input.context?.userAgent,
      lastActiveAt: now,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };
    await this.sessionRepository.save(session);

    // Record audit
    await this.recordAudit({
      id: this.idGenerator.uuid(),
      userId: user.id,
      eventType: "login_success",
      ipAddress: input.context?.ipAddress,
      userAgent: input.context?.userAgent,
      metadata: { sessionId },
      createdAt: now,
    });

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }

  private async recordAudit(event: AuthAuditLog): Promise<void> {
    await this.auditLogRepository.record(event);
  }
}

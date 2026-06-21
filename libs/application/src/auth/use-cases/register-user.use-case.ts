import type { NewAuthUser, UserRepository } from "@ledger-mx/domain";
import type { AuthSession, SessionRepository } from "@ledger-mx/domain";
import type { AuthAuditLog, AuthAuditLogRepository } from "@ledger-mx/domain";
import type { UserId } from "@ledger-mx/domain";
import type { PasswordHasher } from "../ports/password-hasher.port";
import type { TokenService } from "../ports/token-service.port";
import type { Clock } from "../ports/clock.port";
import type { IdGenerator } from "../ports/id-generator.port";
import type { AuthRequestContext } from "../dtos/auth-context.dto";
import type { AuthResult } from "../dtos/auth-result.dto";
import { DuplicateEmailError } from "@ledger-mx/domain";
import { sessionIdFromString } from "@ledger-mx/domain";

export interface RegisterUserInput {
  email: string;
  password: string;
  displayName?: string;
  context?: AuthRequestContext;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly auditLogRepository: AuthAuditLogRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: RegisterUserInput): Promise<AuthResult> {
    const now = this.clock.now();
    const email = input.email.toLowerCase().trim();

    // Check for existing user
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      await this.recordAudit({
        id: this.idGenerator.uuid(),
        userId: null,
        eventType: "login_failed",
        ipAddress: input.context?.ipAddress,
        userAgent: input.context?.userAgent,
        metadata: { reason: "email_already_exists", email },
        createdAt: now,
      });
      throw new DuplicateEmailError();
    }

    // Hash password
    const passwordHash = await this.passwordHasher.hash(input.password);

    // Create user
    const userId = this.idGenerator.uuid() as UserId;
    const newUser: NewAuthUser = {
      id: userId,
      email,
      displayName: input.displayName,
      passwordHash,
    };
    await this.userRepository.save(newUser);

    // Create session (7 days default, 15 days with rememberMe)
    const sessionId = this.idGenerator.uuid();
    const sessionExpiryDays = input.context?.rememberMe ? 15 : 7;
    const expiresAt = new Date(
      now.getTime() + sessionExpiryDays * 24 * 60 * 60 * 1000,
    );

    // Generate tokens
    const accessToken = await this.tokenService.signAccessToken({
      sub: userId,
      email,
    });
    const refreshToken = await this.tokenService.generateRefreshToken();
    const refreshTokenHash =
      await this.tokenService.hashRefreshToken(refreshToken);

    const session: AuthSession = {
      id: sessionIdFromString(sessionId),
      userId,
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
      userId,
      eventType: "user_registered",
      ipAddress: input.context?.ipAddress,
      userAgent: input.context?.userAgent,
      metadata: { email },
      createdAt: now,
    });

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: {
        id: userId,
        email,
        displayName: input.displayName,
      },
    };
  }

  private async recordAudit(event: AuthAuditLog): Promise<void> {
    await this.auditLogRepository.record(event);
  }
}

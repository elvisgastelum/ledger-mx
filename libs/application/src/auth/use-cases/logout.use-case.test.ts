import { describe, it, expect, beforeEach } from "vitest";
import { LogoutUseCase } from "./logout.use-case";
import type {
  SessionRepository,
  AuthSession,
  SessionId,
} from "@ledger-mx/domain";
import type { AuthAuditLogRepository, AuthAuditLog } from "@ledger-mx/domain";
import type { TokenService } from "../ports/token-service.port";
import type { Clock } from "../ports/clock.port";
import type { IdGenerator } from "../ports/id-generator.port";
import type { UserId } from "@ledger-mx/domain";
import { InvalidCredentialsError } from "@ledger-mx/domain";

// In-memory fakes
class FakeSessionRepository implements SessionRepository {
  private sessions: Map<string, AuthSession> = new Map();

  async save(session: AuthSession): Promise<void> {
    this.sessions.set(session.id as string, session);
  }

  async update(): Promise<void> {}

  async findById(): Promise<AuthSession | null> {
    return null;
  }

  async findByRefreshTokenHash(hash: string): Promise<AuthSession | null> {
    const session = Array.from(this.sessions.values()).find(
      (s) => s.refreshTokenHash === hash,
    );
    return session ?? null;
  }

  async findActiveByUserId(): Promise<AuthSession[]> {
    return [];
  }

  async revoke(
    sessionId: SessionId,
    userId: UserId,
    revokedAt: Date,
  ): Promise<void> {
    const session = this.sessions.get(sessionId as string);
    if (session) {
      session.revokedAt = revokedAt;
    }
  }

  async revokeAllForUser(): Promise<void> {}

  reset() {
    this.sessions.clear();
  }
}

class FakeAuditLogRepository implements AuthAuditLogRepository {
  logs: AuthAuditLog[] = [];

  async record(event: AuthAuditLog): Promise<void> {
    this.logs.push(event);
  }

  reset() {
    this.logs = [];
  }
}

class FakeTokenService implements TokenService {
  async signAccessToken(): Promise<string> {
    return "";
  }

  async generateRefreshToken(): Promise<string> {
    return "";
  }

  async hashRefreshToken(token: string): Promise<string> {
    return `hashed_${token}`;
  }
}

class FakeClock implements Clock {
  now(): Date {
    return new Date("2024-01-01T00:00:00Z");
  }
}

class FakeIdGenerator implements IdGenerator {
  private counter = 0;

  uuid(): string {
    return `00000000-0000-4000-8000-${String(++this.counter).padStart(12, "0")}`;
  }
}

describe("LogoutUseCase", () => {
  let useCase: LogoutUseCase;
  let sessionRepo: FakeSessionRepository;
  let auditRepo: FakeAuditLogRepository;
  let tokenService: FakeTokenService;
  let clock: FakeClock;
  let idGenerator: FakeIdGenerator;

  beforeEach(() => {
    sessionRepo = new FakeSessionRepository();
    auditRepo = new FakeAuditLogRepository();
    tokenService = new FakeTokenService();
    clock = new FakeClock();
    idGenerator = new FakeIdGenerator();

    useCase = new LogoutUseCase(
      sessionRepo,
      auditRepo,
      tokenService,
      idGenerator,
      clock,
    );
  });

  it("should revoke session on logout", async () => {
    const userId = "user-uuid" as UserId;
    const sessionId = "session-uuid" as SessionId;

    // Create active session
    const session: AuthSession = {
      id: sessionId,
      userId,
      refreshTokenHash: "hashed_refresh_token_1",
      lastActiveAt: new Date(),
      expiresAt: new Date("2024-01-08T00:00:00Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await sessionRepo.save(session);

    const result = await useCase.execute({
      refreshToken: "refresh_token_1",
      userId,
      context: { ipAddress: "127.0.0.1", userAgent: "test-agent" },
    });

    expect(result.success).toBe(true);

    // Verify session was revoked
    const revokedSession = sessionRepo.sessions.get("session-uuid");
    expect(revokedSession?.revokedAt).toBeDefined();

    // Verify audit log
    expect(auditRepo.logs).toHaveLength(1);
    expect(auditRepo.logs[0].eventType).toBe("logout");
    expect(auditRepo.logs[0].ipAddress).toBe("127.0.0.1");
    expect(auditRepo.logs[0].userAgent).toBe("test-agent");
  });

  it("should return success for missing token (idempotent)", async () => {
    const result = await useCase.execute({
      refreshToken: "nonexistent_token",
    });

    expect(result.success).toBe(true);
    expect(auditRepo.logs).toHaveLength(0); // No audit log for missing token
  });

  it("should throw InvalidCredentialsError if userId mismatches", async () => {
    const userId = "user-uuid" as UserId;
    const sessionId = "session-uuid" as SessionId;

    // Create session for different user
    const session: AuthSession = {
      id: sessionId,
      userId,
      refreshTokenHash: "hashed_refresh_token_1",
      lastActiveAt: new Date(),
      expiresAt: new Date("2024-01-08T00:00:00Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await sessionRepo.save(session);

    await expect(
      useCase.execute({
        refreshToken: "refresh_token_1",
        userId: "different-user-uuid" as UserId,
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("should revoke session without userId", async () => {
    const userId = "user-uuid" as UserId;
    const sessionId = "session-uuid" as SessionId;

    const session: AuthSession = {
      id: sessionId,
      userId,
      refreshTokenHash: "hashed_refresh_token_1",
      lastActiveAt: new Date(),
      expiresAt: new Date("2024-01-08T00:00:00Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await sessionRepo.save(session);

    const result = await useCase.execute({
      refreshToken: "refresh_token_1",
    });

    expect(result.success).toBe(true);
    const revokedSession = sessionRepo.sessions.get("session-uuid");
    expect(revokedSession?.revokedAt).toBeDefined();
  });
});

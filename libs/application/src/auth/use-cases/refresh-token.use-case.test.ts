import { describe, it, expect, beforeEach } from "vitest";
import { RefreshTokenUseCase } from "./refresh-token.use-case";
import type {
  SessionRepository,
  AuthSession,
  SessionId,
} from "@ledger-mx/domain";
import type { UserRepository, AuthUser, UserId } from "@ledger-mx/domain";
import type { AuthAuditLogRepository, AuthAuditLog } from "@ledger-mx/domain";
import type { TokenService } from "../ports/token-service.port";
import type { Clock } from "../ports/clock.port";
import type { IdGenerator } from "../ports/id-generator.port";
import {
  TokenReuseDetectedError,
  SessionExpiredError,
  InvalidCredentialsError,
} from "@ledger-mx/domain";

// In-memory fakes
class FakeSessionRepository implements SessionRepository {
  private sessions: Map<string, AuthSession> = new Map();

  async save(session: AuthSession): Promise<void> {
    this.sessions.set(session.id as string, session);
  }

  async update(session: AuthSession): Promise<void> {
    this.sessions.set(session.id as string, { ...session });
  }

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

  async revoke(): Promise<void> {}
  async revokeAllForUser(): Promise<void> {}

  reset() {
    this.sessions.clear();
  }
}

class FakeUserRepository implements UserRepository {
  private users: Map<string, AuthUser> = new Map();

  async findByEmail(): Promise<AuthUser | null> {
    return null;
  }

  async findById(id: UserId): Promise<AuthUser | null> {
    return this.users.get(id as string) ?? null;
  }

  async save(user: AuthUser): Promise<void> {
    this.users.set(user.id as string, user);
  }

  reset() {
    this.users.clear();
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
  private refreshTokenCounter = 1;

  async signAccessToken(): Promise<string> {
    return "fake_access_token";
  }

  async generateRefreshToken(): Promise<string> {
    return `refresh_token_${++this.refreshTokenCounter}`;
  }

  async hashRefreshToken(token: string): Promise<string> {
    return `hashed_${token}`;
  }
}

class FakeClock implements Clock {
  private currentTime = new Date("2024-01-01T00:00:00Z");

  now(): Date {
    return this.currentTime;
  }

  setNow(date: Date) {
    this.currentTime = date;
  }
}

class FakeIdGenerator implements IdGenerator {
  private counter = 0;

  uuid(): string {
    return `00000000-0000-4000-8000-${String(++this.counter).padStart(12, "0")}`;
  }
}

describe("RefreshTokenUseCase", () => {
  let useCase: RefreshTokenUseCase;
  let sessionRepo: FakeSessionRepository;
  let userRepo: FakeUserRepository;
  let auditRepo: FakeAuditLogRepository;
  let tokenService: FakeTokenService;
  let clock: FakeClock;
  let idGenerator: FakeIdGenerator;

  beforeEach(() => {
    sessionRepo = new FakeSessionRepository();
    userRepo = new FakeUserRepository();
    auditRepo = new FakeAuditLogRepository();
    tokenService = new FakeTokenService();
    clock = new FakeClock();
    idGenerator = new FakeIdGenerator();

    useCase = new RefreshTokenUseCase(
      sessionRepo,
      userRepo,
      auditRepo,
      tokenService,
      idGenerator,
      clock,
    );
  });

  it("should rotate refresh token and update session for active session", async () => {
    const userId = "user-uuid" as UserId;
    const sessionId = "session-uuid" as SessionId;

    // Create user
    await userRepo.save({
      id: userId,
      email: "test@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create active session
    const session: AuthSession = {
      id: sessionId,
      userId,
      refreshTokenHash: "hashed_refresh_token_1",
      lastActiveAt: new Date("2024-01-01T00:00:00Z"),
      expiresAt: new Date("2024-01-08T00:00:00Z"), // 7 days
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };
    await sessionRepo.save(session);

    // Advance clock to simulate time passing
    clock.setNow(new Date("2024-01-02T00:00:00Z"));

    const result = await useCase.execute({
      refreshToken: "refresh_token_1",
    });

    expect(result.accessToken).toBe("fake_access_token");
    expect(result.refreshToken).toBe("refresh_token_2");
    expect(result.sessionId).toBe("session-uuid");

    // Verify session was updated with new refresh token hash
    const updatedSession = await sessionRepo.findByRefreshTokenHash(
      "hashed_refresh_token_2",
    );
    expect(updatedSession).toBeDefined();
    expect(updatedSession?.lastActiveAt).toEqual(clock.now());
    expect(updatedSession?.expiresAt).toEqual(new Date("2024-01-09T00:00:00Z")); // 7 days from now
  });

  it("should throw TokenReuseDetectedError for revoked session", async () => {
    const userId = "user-uuid" as UserId;
    const sessionId = "session-uuid" as SessionId;

    // Create user
    await userRepo.save({
      id: userId,
      email: "test@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create revoked session
    const session: AuthSession = {
      id: sessionId,
      userId,
      refreshTokenHash: "hashed_refresh_token_1",
      lastActiveAt: new Date("2024-01-01T00:00:00Z"),
      expiresAt: new Date("2024-01-08T00:00:00Z"),
      revokedAt: new Date("2024-01-02T00:00:00Z"),
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-02T00:00:00Z"),
    };
    await sessionRepo.save(session);

    await expect(
      useCase.execute({ refreshToken: "refresh_token_1" }),
    ).rejects.toThrow(TokenReuseDetectedError);

    // Verify audit log recorded token_reuse_detected
    expect(auditRepo.logs).toHaveLength(1);
    expect(auditRepo.logs[0].eventType).toBe("token_reuse_detected");
  });

  it("should throw SessionExpiredError for expired session", async () => {
    const userId = "user-uuid" as UserId;
    const sessionId = "session-uuid" as SessionId;

    // Create user
    await userRepo.save({
      id: userId,
      email: "test@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create expired session
    const session: AuthSession = {
      id: sessionId,
      userId,
      refreshTokenHash: "hashed_refresh_token_1",
      lastActiveAt: new Date("2024-01-01T00:00:00Z"),
      expiresAt: new Date("2024-01-02T00:00:00Z"), // Expired
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };
    await sessionRepo.save(session);

    clock.setNow(new Date("2024-01-03T00:00:00Z"));

    await expect(
      useCase.execute({ refreshToken: "refresh_token_1" }),
    ).rejects.toThrow(SessionExpiredError);
  });

  it("should throw InvalidCredentialsError for deleted user", async () => {
    const userId = "user-uuid" as UserId;
    const sessionId = "session-uuid" as SessionId;

    // Create deleted user
    await userRepo.save({
      id: userId,
      email: "test@example.com",
      deletedAt: new Date("2024-01-01T00:00:00Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create active session
    const session: AuthSession = {
      id: sessionId,
      userId,
      refreshTokenHash: "hashed_refresh_token_1",
      lastActiveAt: new Date("2024-01-01T00:00:00Z"),
      expiresAt: new Date("2024-01-08T00:00:00Z"),
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };
    await sessionRepo.save(session);

    await expect(
      useCase.execute({ refreshToken: "refresh_token_1" }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});

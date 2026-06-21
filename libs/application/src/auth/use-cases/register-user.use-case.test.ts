import { describe, it, expect, beforeEach } from "vitest";
import { RegisterUserUseCase } from "./register-user.use-case";
import type { UserRepository, AuthUser, NewAuthUser } from "@ledger-mx/domain";
import type { SessionRepository, AuthSession } from "@ledger-mx/domain";
import type { AuthAuditLogRepository, AuthAuditLog } from "@ledger-mx/domain";
import type { PasswordHasher } from "../ports/password-hasher.port";
import type { TokenService } from "../ports/token-service.port";
import type { Clock } from "../ports/clock.port";
import type { IdGenerator } from "../ports/id-generator.port";
import { DuplicateEmailError } from "@ledger-mx/domain";

// In-memory fakes
class FakeUserRepository implements UserRepository {
  private users: Map<string, AuthUser> = new Map();

  async findByEmail(email: string): Promise<AuthUser | null> {
    const user = Array.from(this.users.values()).find((u) => u.email === email);
    return user ?? null;
  }

  async findById(): Promise<AuthUser | null> {
    return null;
  }

  async save(user: NewAuthUser | AuthUser): Promise<void> {
    const authUser: AuthUser = {
      ...user,
      createdAt: user.createdAt ?? new Date(),
      updatedAt: user.updatedAt ?? new Date(),
    } as AuthUser;
    this.users.set(authUser.id as string, authUser);
  }

  reset() {
    this.users.clear();
  }
}

class FakeSessionRepository implements SessionRepository {
  private sessions: Map<string, AuthSession> = new Map();

  async save(session: AuthSession): Promise<void> {
    this.sessions.set(session.id as string, session);
  }

  async update(): Promise<void> {}
  async findById(): Promise<AuthSession | null> {
    return null;
  }
  async findByRefreshTokenHash(): Promise<AuthSession | null> {
    return null;
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

class FakeAuditLogRepository implements AuthAuditLogRepository {
  logs: AuthAuditLog[] = [];

  async record(event: AuthAuditLog): Promise<void> {
    this.logs.push(event);
  }

  reset() {
    this.logs = [];
  }
}

class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed_${password}`;
  }

  async compare(): Promise<boolean> {
    return false;
  }
}

class FakeTokenService implements TokenService {
  async signAccessToken(): Promise<string> {
    return "fake_access_token";
  }

  async generateRefreshToken(): Promise<string> {
    return "fake_refresh_token";
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

describe("RegisterUserUseCase", () => {
  let useCase: RegisterUserUseCase;
  let userRepo: FakeUserRepository;
  let sessionRepo: FakeSessionRepository;
  let auditRepo: FakeAuditLogRepository;
  let passwordHasher: FakePasswordHasher;
  let tokenService: FakeTokenService;
  let clock: FakeClock;
  let idGenerator: FakeIdGenerator;

  beforeEach(() => {
    userRepo = new FakeUserRepository();
    sessionRepo = new FakeSessionRepository();
    auditRepo = new FakeAuditLogRepository();
    passwordHasher = new FakePasswordHasher();
    tokenService = new FakeTokenService();
    clock = new FakeClock();
    idGenerator = new FakeIdGenerator();

    useCase = new RegisterUserUseCase(
      userRepo,
      sessionRepo,
      auditRepo,
      passwordHasher,
      tokenService,
      idGenerator,
      clock,
    );
  });

  it("should successfully register user and return auth result", async () => {
    const result = await useCase.execute({
      email: "test@example.com",
      password: "password123",
      displayName: "Test User",
    });

    expect(result.accessToken).toBe("fake_access_token");
    expect(result.refreshToken).toBe("fake_refresh_token");
    expect(result.user.email).toBe("test@example.com");
    expect(result.user.displayName).toBe("Test User");
    expect(result.sessionId).toBeDefined();

    // Verify user was saved
    const savedUser = await userRepo.findByEmail("test@example.com");
    expect(savedUser).toBeDefined();
    expect(savedUser?.passwordHash).toBe("hashed_password123");

    // Verify audit log
    expect(auditRepo.logs).toHaveLength(1);
    expect(auditRepo.logs[0].eventType).toBe("user_registered");
  });

  it("should throw DuplicateEmailError for existing email", async () => {
    // Register first user
    await useCase.execute({
      email: "test@example.com",
      password: "password123",
    });

    // Try to register again with same email
    await expect(
      useCase.execute({
        email: "test@example.com",
        password: "different_password",
      }),
    ).rejects.toThrow(DuplicateEmailError);

    // Verify audit log recorded failure
    expect(auditRepo.logs).toHaveLength(2);
    expect(auditRepo.logs[1].eventType).toBe("login_failed");
  });

  it("should lowercase and trim email", async () => {
    await useCase.execute({
      email: "  TEST@EXAMPLE.COM  ",
      password: "password123",
    });

    const savedUser = await userRepo.findByEmail("test@example.com");
    expect(savedUser).toBeDefined();
  });
});

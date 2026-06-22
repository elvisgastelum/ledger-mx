import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import cookieParser from "cookie-parser";
import supertest from "supertest";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "../config/env.validation";
import { AuthModule } from "../auth/auth.module";
import { AUTH_TOKENS } from "../auth/auth.tokens";
import type { UserRepository } from "@ledger-mx/domain";
import type { SessionRepository } from "@ledger-mx/domain";
import type { AuthAuditLogRepository } from "@ledger-mx/domain";
import type {
  AuthUser,
  AuthSession,
  UserId,
  SessionId,
} from "@ledger-mx/domain";

// Self-contained test setup: provide a safe test-only JWT_SECRET
// so tests don't depend on external environment variables.
// This is test-only and set here for fail-fast auth module initialization.
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.JWT_SECRET = "test-jwt-secret-for-unit-tests-only-minimum-32-chars";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  process.env.NODE_ENV = "test";
  process.env.JWT_ACCESS_TOKEN_TTL = "15m";
  process.env.AUTH_REFRESH_COOKIE_NAME = "ledger_mx_refresh_token";
  process.env.AUTH_REFRESH_COOKIE_SECURE = "false";
  process.env.AUTH_REFRESH_COOKIE_SAME_SITE = "lax";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

/**
 * In-memory fake UserRepository for testing
 */
class FakeUserRepository implements UserRepository {
  private users: Map<string, AuthUser> = new Map();

  async findByEmail(email: string): Promise<AuthUser | null> {
    const user = Array.from(this.users.values()).find(
      (u) => u.email === email.toLowerCase().trim(),
    );
    return user ?? null;
  }

  async findById(id: UserId): Promise<AuthUser | null> {
    return this.users.get(id as string) ?? null;
  }

  async save(user: AuthUser): Promise<void> {
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash ?? undefined,
      displayName: user.displayName ?? undefined,
      createdAt: user.createdAt ?? new Date(),
      updatedAt: user.updatedAt ?? new Date(),
      deletedAt: user.deletedAt ?? undefined,
    };
    this.users.set(user.id as string, authUser);
  }
}

/**
 * In-memory fake SessionRepository for testing
 */
class FakeSessionRepository implements SessionRepository {
  private sessions: Map<string, AuthSession> = new Map();

  async save(session: AuthSession): Promise<void> {
    this.sessions.set(session.id as string, { ...session });
  }

  async update(session: AuthSession): Promise<void> {
    this.sessions.set(session.id as string, { ...session });
  }

  async findById(id: SessionId, userId?: UserId): Promise<AuthSession | null> {
    const session = this.sessions.get(id as string);
    if (!session) return null;
    if (userId && session.userId !== userId) return null;
    return { ...session };
  }

  async findByRefreshTokenHash(hash: string): Promise<AuthSession | null> {
    const session = Array.from(this.sessions.values()).find(
      (s) => s.refreshTokenHash === hash,
    );
    return session ? { ...session } : null;
  }

  async findActiveByUserId(userId: UserId): Promise<AuthSession[]> {
    return Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId && !s.revokedAt,
    );
  }

  async revoke(
    sessionId: SessionId,
    userId: UserId,
    revokedAt: Date,
  ): Promise<void> {
    const session = this.sessions.get(sessionId as string);
    if (session && session.userId === userId) {
      session.revokedAt = revokedAt;
      this.sessions.set(sessionId as string, session);
    }
  }

  async revokeAllForUser(userId: UserId, revokedAt: Date): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        session.revokedAt = revokedAt;
        this.sessions.set(id, session);
      }
    }
  }
}

/**
 * In-memory fake AuthAuditLogRepository for testing
 */
class FakeAuthAuditLogRepository implements AuthAuditLogRepository {
  async record(): Promise<void> {
    // No-op for testing
  }
}

describe("AuthController (integration)", () => {
  let app: INestApplication;
  let userRepository: FakeUserRepository;
  let sessionRepository: FakeSessionRepository;

  beforeEach(async () => {
    userRepository = new FakeUserRepository();
    sessionRepository = new FakeSessionRepository();
    const auditLogRepository = new FakeAuthAuditLogRepository();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate: validateEnv,
          envFilePath: [],
        }),
        AuthModule.forRoot({
          userRepository: {
            provide: AUTH_TOKENS.USER_REPOSITORY,
            useValue: userRepository,
          },
          sessionRepository: {
            provide: AUTH_TOKENS.SESSION_REPOSITORY,
            useValue: sessionRepository,
          },
          auditLogRepository: {
            provide: AUTH_TOKENS.AUTH_AUDIT_LOG_REPOSITORY,
            useValue: auditLogRepository,
          },
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Enable cookie parsing (same as main.ts)
    app.use(cookieParser());

    await app.init();
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user and set refresh token in cookie", async () => {
      const response = await supertest(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          email: "test@example.com",
          password: "Password123@",
          displayName: "Test User",
        })
        .expect(201);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("sessionId");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toMatchObject({
        email: "test@example.com",
        displayName: "Test User",
      });

      // refreshToken should NOT be in response body
      expect(response.body).not.toHaveProperty("refreshToken");

      // refreshToken should be in cookie
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes("ledger_mx_refresh_token"))).toBe(true);
    });

    it("should return 409 for duplicate email", async () => {
      await supertest(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          email: "test@example.com",
          password: "Password123@",
        })
        .expect(201);

      await supertest(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          email: "test@example.com",
          password: "Password123@",
        })
        .expect(409);
    });

    it("should return 400 for invalid email", async () => {
      await supertest(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          email: "invalid-email",
          password: "Password123@",
        })
        .expect(400);
    });

    it("should return 400 for weak password", async () => {
      await supertest(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          email: "test@example.com",
          password: "short",
        })
        .expect(400);
    });

    it("should return 400 for password without complexity", async () => {
      await supertest(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(400);
    });

    it("should return 400 for unrecognized fields", async () => {
      await supertest(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          email: "test@example.com",
          password: "Password123@",
          unknownField: "should fail",
        })
        .expect(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      // Register a user first
      await supertest(app.getHttpServer()).post("/api/v1/auth/register").send({
        email: "test@example.com",
        password: "Password123@",
      });
    });

    it("should login with valid credentials and set refresh token in cookie", async () => {
      const response = await supertest(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "Password123@",
        })
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("sessionId");
      expect(response.body).not.toHaveProperty("refreshToken");

      // refreshToken should be in cookie
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes("ledger_mx_refresh_token"))).toBe(true);
    });

    it("should return 401 for invalid credentials", async () => {
      await supertest(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "WrongPassword123@",
        })
        .expect(401);
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    let refreshToken: string;

    beforeEach(async () => {
      const response = await supertest(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          email: "test@example.com",
          password: "Password123@",
        });

      // Extract refresh token from cookie
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c: string) => c.includes("ledger_mx_refresh_token"));
      expect(refreshCookie).toBeDefined();
      refreshToken = refreshCookie!.split("=")[1].split(";")[0];
    });

    it("should refresh tokens with valid refresh token from cookie", async () => {
      const response = await supertest(app.getHttpServer())
        .post("/api/v1/auth/refresh")
        .set("Cookie", [`ledger_mx_refresh_token=${refreshToken}`])
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("sessionId");
      expect(response.body).not.toHaveProperty("refreshToken");

      // New refresh token should be in cookie
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
    });

    it("should return 401 for invalid refresh token", async () => {
      await supertest(app.getHttpServer())
        .post("/api/v1/auth/refresh")
        .set("Cookie", ["ledger_mx_refresh_token=invalid-token"])
        .expect(401);
    });

    it("should return 401 when no refresh token provided", async () => {
      await supertest(app.getHttpServer())
        .post("/api/v1/auth/refresh")
        .expect(401);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    let refreshToken: string;

    beforeEach(async () => {
      const response = await supertest(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          email: "test@example.com",
          password: "Password123@",
        });

      // Extract refresh token from cookie
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c: string) => c.includes("ledger_mx_refresh_token"));
      expect(refreshCookie).toBeDefined();
      refreshToken = refreshCookie!.split("=")[1].split(";")[0];
    });

    it("should logout successfully and clear cookie", async () => {
      const response = await supertest(app.getHttpServer())
        .post("/api/v1/auth/logout")
        .set("Cookie", [`ledger_mx_refresh_token=${refreshToken}`])
        .expect(200);

      expect(response.body).toEqual({ success: true });

      // Cookie should be cleared
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes("ledger_mx_refresh_token") && c.includes("Max-Age=0"))).toBe(true);
    });

    it("should invalidate refresh token after logout", async () => {
      await supertest(app.getHttpServer())
        .post("/api/v1/auth/logout")
        .set("Cookie", [`ledger_mx_refresh_token=${refreshToken}`])
        .expect(200);

      // Try to refresh with the logged-out token
      await supertest(app.getHttpServer())
        .post("/api/v1/auth/refresh")
        .set("Cookie", [`ledger_mx_refresh_token=${refreshToken}`])
        .expect(401);
    });
  });
});

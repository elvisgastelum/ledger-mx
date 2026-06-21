import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import supertest from "supertest";
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
    _userId: UserId,
    revokedAt: Date,
  ): Promise<void> {
    const session = this.sessions.get(sessionId as string);
    if (session) {
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
    await app.init();
  });

  describe("POST /auth/register", () => {
    it("should register a new user and return tokens", async () => {
      const response = await supertest(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "password123",
          displayName: "Test User",
        })
        .expect(201);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body).toHaveProperty("sessionId");
      expect(response.body.user).toMatchObject({
        email: "test@example.com",
        displayName: "Test User",
      });
    });

    it("should return 409 for duplicate email", async () => {
      await supertest(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(201);

      await supertest(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(409);
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      // Register a user first
      await supertest(app.getHttpServer()).post("/auth/register").send({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should login with valid credentials and return tokens", async () => {
      const response = await supertest(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body).toHaveProperty("sessionId");
    });

    it("should return 401 for invalid credentials", async () => {
      await supertest(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .expect(401);
    });
  });

  describe("POST /auth/refresh", () => {
    let refreshToken: string;

    beforeEach(async () => {
      const response = await supertest(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      refreshToken = response.body.refreshToken;
    });

    it("should refresh tokens with valid refresh token", async () => {
      const response = await supertest(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body.refreshToken).not.toBe(refreshToken);
    });

    it("should return 401 for invalid refresh token", async () => {
      await supertest(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: "invalid-token" })
        .expect(401);
    });
  });

  describe("POST /auth/logout", () => {
    let refreshToken: string;

    beforeEach(async () => {
      const response = await supertest(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      refreshToken = response.body.refreshToken;
    });

    it("should logout successfully", async () => {
      await supertest(app.getHttpServer())
        .post("/auth/logout")
        .send({ refreshToken })
        .expect(200);
    });

    it("should invalidate refresh token after logout", async () => {
      await supertest(app.getHttpServer())
        .post("/auth/logout")
        .send({ refreshToken })
        .expect(200);

      // Try to refresh with the logged-out token
      await supertest(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken })
        .expect(401);
    });
  });
});

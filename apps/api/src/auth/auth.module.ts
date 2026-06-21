import {
  Module,
  DynamicModule,
  Provider,
  FactoryProvider,
} from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { JwtTokenService } from "./infrastructure/jwt-token.service";
import { BcryptPasswordHasher } from "./infrastructure/bcrypt-password-hasher";
import { UuidIdGenerator } from "./infrastructure/uuid-id-generator";
import { RegisterUserUseCase } from "@ledger-mx/application";
import { LoginUserUseCase } from "@ledger-mx/application";
import { RefreshTokenUseCase } from "@ledger-mx/application";
import { LogoutUseCase } from "@ledger-mx/application";
import { SystemClock } from "@ledger-mx/application";
import type {
  PasswordHasher,
  TokenService,
  Clock,
  IdGenerator,
} from "@ledger-mx/application";
import { AUTH_TOKENS } from "./auth.tokens";
import type { UserRepository } from "@ledger-mx/domain";
import type { SessionRepository } from "@ledger-mx/domain";
import type { AuthAuditLogRepository } from "@ledger-mx/domain";
import {
  createDatabase,
  DrizzleUserRepository,
  DrizzleSessionRepository,
  DrizzleAuthAuditLogRepository,
} from "@ledger-mx/database";

// Internal token for shared database connection
const AUTH_DATABASE = Symbol("AUTH_DATABASE");

export interface AuthModuleOptions {
  userRepository?: Provider<UserRepository>;
  sessionRepository?: Provider<SessionRepository>;
  auditLogRepository?: Provider<AuthAuditLogRepository>;
}

function createDefaultDatabaseProvider(): FactoryProvider {
  return {
    provide: AUTH_DATABASE,
    useFactory: () => createDatabase(),
  };
}

function createDefaultUserRepoProvider(): FactoryProvider {
  return {
    provide: AUTH_TOKENS.USER_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleUserRepository(db);
    },
    inject: [AUTH_DATABASE],
  };
}

function createDefaultSessionRepoProvider(): FactoryProvider {
  return {
    provide: AUTH_TOKENS.SESSION_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleSessionRepository(db);
    },
    inject: [AUTH_DATABASE],
  };
}

function createDefaultAuditLogRepoProvider(): FactoryProvider {
  return {
    provide: AUTH_TOKENS.AUTH_AUDIT_LOG_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleAuthAuditLogRepository(db);
    },
    inject: [AUTH_DATABASE],
  };
}

@Module({})
export class AuthModule {
  static forRoot(options?: AuthModuleOptions): DynamicModule {
    const userRepoProvider =
      options?.userRepository ?? createDefaultUserRepoProvider();

    const sessionRepoProvider =
      options?.sessionRepository ?? createDefaultSessionRepoProvider();

    const auditLogRepoProvider =
      options?.auditLogRepository ?? createDefaultAuditLogRepoProvider();

    // Only provide shared database if at least one default repo provider is used
    const needsDatabase =
      !options?.userRepository ||
      !options?.sessionRepository ||
      !options?.auditLogRepository;

    const jwtSecret = process.env.JWT_SECRET;
    if (process.env.NODE_ENV === "production") {
      if (!jwtSecret) {
        throw new Error(
          "JWT_SECRET environment variable is required in production. " +
            "Set a strong secret value before starting the application.",
        );
      }
    }
    const finalJwtSecret =
      jwtSecret ?? "dev-only-insecure-secret-do-not-use-in-production";

    return {
      module: AuthModule,
      controllers: [AuthController],
      imports: [
        JwtModule.register({
          secret: finalJwtSecret,
        }),
      ],
      providers: [
        userRepoProvider,
        sessionRepoProvider,
        auditLogRepoProvider,
        ...(needsDatabase ? [createDefaultDatabaseProvider()] : []),
        // Infrastructure services
        {
          provide: AUTH_TOKENS.TOKEN_SERVICE,
          useClass: JwtTokenService,
        },
        {
          provide: AUTH_TOKENS.PASSWORD_HASHER,
          useClass: BcryptPasswordHasher,
        },
        {
          provide: AUTH_TOKENS.ID_GENERATOR,
          useClass: UuidIdGenerator,
        },
        {
          provide: AUTH_TOKENS.CLOCK,
          useClass: SystemClock,
        },
        // Use cases
        {
          provide: RegisterUserUseCase,
          useFactory: (
            userRepository: UserRepository,
            sessionRepository: SessionRepository,
            auditLogRepository: AuthAuditLogRepository,
            passwordHasher: PasswordHasher,
            tokenService: TokenService,
            idGenerator: IdGenerator,
            clock: Clock,
          ) => {
            return new RegisterUserUseCase(
              userRepository,
              sessionRepository,
              auditLogRepository,
              passwordHasher,
              tokenService,
              idGenerator,
              clock,
            );
          },
          inject: [
            AUTH_TOKENS.USER_REPOSITORY,
            AUTH_TOKENS.SESSION_REPOSITORY,
            AUTH_TOKENS.AUTH_AUDIT_LOG_REPOSITORY,
            AUTH_TOKENS.PASSWORD_HASHER,
            AUTH_TOKENS.TOKEN_SERVICE,
            AUTH_TOKENS.ID_GENERATOR,
            AUTH_TOKENS.CLOCK,
          ],
        },
        {
          provide: LoginUserUseCase,
          useFactory: (
            userRepository: UserRepository,
            sessionRepository: SessionRepository,
            auditLogRepository: AuthAuditLogRepository,
            passwordHasher: PasswordHasher,
            tokenService: TokenService,
            idGenerator: IdGenerator,
            clock: Clock,
          ) => {
            return new LoginUserUseCase(
              userRepository,
              sessionRepository,
              auditLogRepository,
              passwordHasher,
              tokenService,
              idGenerator,
              clock,
            );
          },
          inject: [
            AUTH_TOKENS.USER_REPOSITORY,
            AUTH_TOKENS.SESSION_REPOSITORY,
            AUTH_TOKENS.AUTH_AUDIT_LOG_REPOSITORY,
            AUTH_TOKENS.PASSWORD_HASHER,
            AUTH_TOKENS.TOKEN_SERVICE,
            AUTH_TOKENS.ID_GENERATOR,
            AUTH_TOKENS.CLOCK,
          ],
        },
        {
          provide: RefreshTokenUseCase,
          useFactory: (
            sessionRepository: SessionRepository,
            userRepository: UserRepository,
            auditLogRepository: AuthAuditLogRepository,
            tokenService: TokenService,
            idGenerator: IdGenerator,
            clock: Clock,
          ) => {
            return new RefreshTokenUseCase(
              sessionRepository,
              userRepository,
              auditLogRepository,
              tokenService,
              idGenerator,
              clock,
            );
          },
          inject: [
            AUTH_TOKENS.SESSION_REPOSITORY,
            AUTH_TOKENS.USER_REPOSITORY,
            AUTH_TOKENS.AUTH_AUDIT_LOG_REPOSITORY,
            AUTH_TOKENS.TOKEN_SERVICE,
            AUTH_TOKENS.ID_GENERATOR,
            AUTH_TOKENS.CLOCK,
          ],
        },
        {
          provide: LogoutUseCase,
          useFactory: (
            sessionRepository: SessionRepository,
            auditLogRepository: AuthAuditLogRepository,
            tokenService: TokenService,
            idGenerator: IdGenerator,
            clock: Clock,
          ) => {
            return new LogoutUseCase(
              sessionRepository,
              auditLogRepository,
              tokenService,
              idGenerator,
              clock,
            );
          },
          inject: [
            AUTH_TOKENS.SESSION_REPOSITORY,
            AUTH_TOKENS.AUTH_AUDIT_LOG_REPOSITORY,
            AUTH_TOKENS.TOKEN_SERVICE,
            AUTH_TOKENS.ID_GENERATOR,
            AUTH_TOKENS.CLOCK,
          ],
        },
      ],
      exports: [],
    };
  }
}

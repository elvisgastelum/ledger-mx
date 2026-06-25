# Story: Auth & Session Model

**Status**: Done
**Priority**: P0
**Estimated**: 3 days

## Goal

Implement JWT auth with refresh tokens and session/device management.

## Context

- Create `api/auth.md` with JWT strategy
- Create `api/sessions-devices.md` with session tracking
- Create `security/auth-sessions.md` with auth security
- Create `security/audit-log.md` with audit requirements

## Acceptance Criteria

- [x] JWT access + refresh token flow (implemented: `JwtTokenService`, `AuthController` endpoints, use cases)
- [x] Sessions track device, IP, last active (implemented: `sessions` table, `DrizzleSessionRepository`, `AuthSession` type)
- [x] Refresh token rotation on use (implemented: `RefreshTokenUseCase`)
- [x] Logout invalidates refresh token (implemented: `LogoutUseCase`, `revoke` scoped by userId)
- [x] Audit log for auth events (implemented: `DrizzleAuthAuditLogRepository`, `AuthAuditLog` types)

## Remaining (Blocking "Done" Status)

- [x] Cookie-based refresh token storage (httpOnly, secure, sameSite)
- [x] Request validation using Zod (via nestjs-zod)
- [x] Move `JWT_SECRET` and `DATABASE_URL` to proper config module (env fail-fast and `.env` loading added, ConfigModule pending)
- [x] Full E2E tests with real database and HTTP cookies

## Technical Notes

Use NestJS @nestjs/jwt and @nestjs/passport. Store refresh tokens in database with expiration.

## Tests Required

- Test JWT token generation and validation
- Test refresh token rotation
- Test session tracking
- Test audit log entries

## Dependencies

- 001-database-model.md

## Done Checklist

- [x] All remaining items in "Remaining (Blocking "Done" Status)" section completed
- [x] Auth flow tested end-to-end with cookies, validation, and config module
- [x] Story moved from `doing/` to `done/`

## Status

**Status**: Done

All acceptance criteria and remaining blockers have been implemented and verified:

1. ✅ Cookie-based refresh token storage (httpOnly, secure, sameSite)
2. ✅ Request validation using Zod-only validation (via nestjs-zod and explicit ZodValidationPipe)
3. ✅ ConfigModule with env validation (Zod-based) for JWT_SECRET, DATABASE_URL, and other vars
4. ✅ Full E2E tests with real database and HTTP cookies

**Verification notes:**

- Controller tests pass (`auth.controller.test.ts`)
- E2E tests with Testcontainers pass (`auth.e2e.test.ts`)
- Repository integration tests pass (`auth-repositories.integration.test.ts`)
- Typecheck passes

## Progress Notes

### Database Foundation (In Progress)

- [x] Add `password_hash` column to `users` table
- [x] Create `sessions` table with refresh token hash, device/IP/user agent tracking, expiry, and revocation support
- [x] Create `auth_audit_logs` table for authentication event auditing
- [x] Add Drizzle relations for sessions and auth_audit_logs
- [x] Export types and update schema tests
- [x] Update schema overview documentation

**Caveat:** The `password_hash` column is nullable at the DB schema level for migration safety and to support imported users, but application-level local auth flows (registration/login) must require a password hash.

### Infrastructure Layer (In Progress)

- [x] Add `@nestjs/jwt`, `bcrypt` dependencies to `apps/api/package.json`
- [x] Create database connection utility (`libs/database/src/connection.ts`)
- [x] Implement `DrizzleUserRepository` (implements `UserRepository`)
- [x] Implement `DrizzleSessionRepository` (implements `SessionRepository`)
- [x] Implement `DrizzleAuthAuditLogRepository` (implements `AuthAuditLogRepository`)
- [x] Update `libs/database/src/index.ts` to export new modules
- [x] Create `JwtTokenService` (implements `TokenService` using `@nestjs/jwt`)
- [x] Create `BcryptPasswordHasher` (implements `PasswordHasher` using `bcrypt`)
- [x] Create `UuidIdGenerator` (implements `IdGenerator` using `crypto.randomUUID()`)
- [x] Add DI tokens (`apps/api/src/auth/auth.tokens.ts`)
- [x] Create `AuthController` with endpoints: `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- [x] Create `AuthModule` with configurable repository providers for testing
- [x] Create `AppModule` importing `AuthModule`
- [x] Update `main.ts` with NestJS bootstrap
- [x] Add integration tests (`auth.controller.test.ts`) using fake in-memory repositories
- [x] Add `JwtTokenService` unit tests (`jwt-token.service.test.ts`)

**Design Decisions:**

- Controllers use NestJS `@Controller('auth')` rather than ts-rest for simplicity in this slice
- `AuthModule.forRoot()` accepts optional repository providers for testability
- Refresh tokens returned in response body (cookies deferred to later slice)
- Integration tests use fake repositories (no real database required)
- `createDatabase()` utility in `libs/database` supports connection string injection

  **Remaining:**

  - [x] Wire real Drizzle repositories to `AuthModule` when database is available
  - [x] Add cookie-based refresh token storage (httpOnly, secure, sameSite)
  - [x] Add request validation using Zod (via nestjs-zod)
  - [x] End-to-end tests with real database (Testcontainers) - **Repository integration tests added**
  - [x] Move `JWT_SECRET` and `DATABASE_URL` to proper config module (env fail-fast and `.env` loading added, ConfigModule pending)

### Repository Integration Tests (Completed)

- [x] Add testcontainers dependencies to `libs/database/package.json`
- [x] Create `auth-repositories.integration.test.ts` with Testcontainers PostgreSQL
- [x] Test `DrizzleUserRepository` (save, findByEmail, findById)
- [x] Test `DrizzleSessionRepository` (save, findByRefreshTokenHash, revoke scoped by userId, revokeAllForUser)
- [x] Test `DrizzleAuthAuditLogRepository` (record/insert verification)

  **Test Details:**

- Uses `@testcontainers/postgresql` to spin up isolated PostgreSQL 16 container
- Applies existing drizzle migrations before tests run
- Cleans up tables between tests (auth_audit_logs → sessions → users) to handle FK constraints
- Tests user scoping: verifies session revocation with wrong userId does NOT revoke
- Uses deterministic UUID literals and Date values for reproducibility

### Local Development Database (Added)

- [x] Create `docker-compose.dev.yml` for local PostgreSQL 16 development
- [x] Add `db:up`, `db:down`, `db:reset` scripts to root `package.json`
- [x] Document local database setup in `docs/mvp/stack/backend.md`
- [x] Add `.env.example` with development placeholders for environment variables
- [x] Update `docker-compose.dev.yml` to use environment variables from `.env` instead of hardcoded values
- [x] Update `drizzle.config.ts` to load `.env` and fail fast if `DATABASE_URL` is missing
- [x] Update `auth.module.ts` to require `JWT_SECRET` from environment with no insecure fallback

**Note:** The Docker Compose setup (`pnpm db:up`) provides a persistent local PostgreSQL instance for manual testing and development. It is separate from Testcontainers (used in integration tests) which creates ephemeral containers per test suite. Environment variables are now loaded from `.env` (copied from `.env.example`), with fail-fast checks for `DATABASE_URL` and `JWT_SECRET`. A proper NestJS ConfigModule is still pending (see remaining config module blocker).

### Application Layer (Completed)

- [x] Define auth error classes (`InvalidCredentialsError`, `SessionRevokedError`, `SessionExpiredError`, `TokenReuseDetectedError`, `DuplicateEmailError`)
- [x] Define `AuthSession` type, `SessionId` branded type, and session helper functions
- [x] Define `AuthAuditLog` and `AuthAuditEventType` types
- [x] Define repository interfaces: `UserRepository`, `SessionRepository`, `AuthAuditLogRepository`
- [x] Create application ports: `PasswordHasher`, `TokenService`, `Clock`/`SystemClock`, `IdGenerator`
- [x] Create shared DTOs: `AuthRequestContext`, `AuthResult`
- [x] Implement use cases: `RegisterUserUseCase`, `LoginUserUseCase`, `RefreshTokenUseCase`, `LogoutUseCase`
- [x] Add unit tests for use cases with in-memory fake repositories/ports

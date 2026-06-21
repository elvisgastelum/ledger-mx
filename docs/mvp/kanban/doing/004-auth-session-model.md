# Story: Auth & Session Model

**Status**: Doing
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

- [ ] JWT access + refresh token flow
- [ ] Sessions track device, IP, last active
- [ ] Refresh token rotation on use
- [ ] Logout invalidates refresh token
- [ ] Audit log for auth events

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

- [ ] All acceptance criteria met
- [ ] Auth flow tested end-to-end

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

- [ ] Wire real Drizzle repositories to `AuthModule` when database is available
- [ ] Add cookie-based refresh token storage (httpOnly, secure, sameSite)
- [ ] Add request validation using `class-validator` or Zod
- [ ] End-to-end tests with real database (Testcontainers)
- [ ] Move `JWT_SECRET` and `DATABASE_URL` to proper config module

### Application Layer (Completed)

- [x] Define auth error classes (`InvalidCredentialsError`, `SessionRevokedError`, `SessionExpiredError`, `TokenReuseDetectedError`, `DuplicateEmailError`)
- [x] Define `AuthSession` type, `SessionId` branded type, and session helper functions
- [x] Define `AuthAuditLog` and `AuthAuditEventType` types
- [x] Define repository interfaces: `UserRepository`, `SessionRepository`, `AuthAuditLogRepository`
- [x] Create application ports: `PasswordHasher`, `TokenService`, `Clock`/`SystemClock`, `IdGenerator`
- [x] Create shared DTOs: `AuthRequestContext`, `AuthResult`
- [x] Implement use cases: `RegisterUserUseCase`, `LoginUserUseCase`, `RefreshTokenUseCase`, `LogoutUseCase`
- [x] Add unit tests for use cases with in-memory fake repositories/ports

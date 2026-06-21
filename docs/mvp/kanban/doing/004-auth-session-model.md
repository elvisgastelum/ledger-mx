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

### Application Layer (In Progress)

- [x] Define auth error classes (`InvalidCredentialsError`, `SessionRevokedError`, `SessionExpiredError`, `TokenReuseDetectedError`, `DuplicateEmailError`)
- [x] Define `AuthSession` type, `SessionId` branded type, and session helper functions
- [x] Define `AuthAuditLog` and `AuthAuditEventType` types
- [x] Define repository interfaces: `UserRepository`, `SessionRepository`, `AuthAuditLogRepository`
- [x] Create application ports: `PasswordHasher`, `TokenService`, `Clock`/`SystemClock`, `IdGenerator`
- [x] Create shared DTOs: `AuthRequestContext`, `AuthResult`
- [x] Implement use cases: `RegisterUserUseCase`, `LoginUserUseCase`, `RefreshTokenUseCase`, `LogoutUseCase`
- [x] Add unit tests for use cases with in-memory fake repositories/ports

**Design Decisions:**

- JWT signing/verification and password hashing are represented as application ports (infrastructure concerns)
- Refresh tokens are stored by hash only; use cases accept raw refresh token and call `TokenService.hashRefreshToken()`
- Refresh token rotation updates existing session rather than creating new DB session
- Session expiry uses 7 days default, 15 days with `rememberMe`
- Audit metadata avoids storing raw tokens/passwords
- Logout is idempotent (missing token returns success)

**Remaining:**

- [ ] Infrastructure JWT adapter implementation (NestJS/JWT)
- [ ] Infrastructure password hasher implementation (bcrypt)
- [ ] API endpoints for auth flow
- [ ] End-to-end tests for auth flow

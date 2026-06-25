# Story: Auth Session Security Hardening

**Status**: Todo
**Priority**: P1
**Estimated**: 2 days

## Goal

Harden authentication and session security with refresh token rotation, rate limiting, secure cookies, CSRF/CORS validation, and sensitive log prevention.

## Context

- Current auth implementation may lack refresh token rotation metadata
- Rate limiting needed to prevent brute force attacks
- Cookie security settings need review (HttpOnly, Secure, SameSite)
- CSRF and CORS validation required for API endpoints
- Sensitive data (tokens, passwords) must not appear in logs
- Hashing strategy alignment with current best practices

## Acceptance Criteria

- [ ] Refresh token rotation implemented with metadata (issued at, expires at, family ID)
- [ ] Refresh token reuse detection (revoke family if reused - potential replay attack)
- [ ] Rate limiting on auth endpoints (login, refresh, register)
- [ ] Cookie security: HttpOnly, Secure, SameSite=Strict
- [ ] CSRF protection on state-changing endpoints
- [ ] CORS validation for API origins
- [ ] Sensitive data excluded from logs (tokens, passwords, personal info)
- [ ] Password hashing strategy documented and aligned (bcrypt/argon2)
- [ ] Session invalidation on password change

## Technical Notes

Refresh token rotation:
```typescript
interface RefreshTokenMetadata {
  tokenFamily: string; // Group of related tokens
  version: number; // Incremented on rotation
  issuedAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  revocationReason?: 'reuse_detected' | 'logout' | 'password_change';
}
```

Rate limiting strategy:
- Login: 5 attempts per 15 minutes per IP
- Refresh: 20 attempts per minute per user
- Register: 3 attempts per hour per IP

Cookie settings:
```typescript
res.cookie('refresh_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

CSRF protection:
- Use double-submit cookie pattern
- Or CSRF token in response header for SPA

Files/modules to touch:
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/guards/`
- `apps/api/src/auth/rate-limit.middleware.ts`
- `apps/api/src/common/csrf/`
- `apps/api/src/common/cors/`
- `apps/api/src/logger/` (sanitization)

## Tests Required

- [ ] Unit tests: refresh token rotation logic
- [ ] Unit tests: token reuse detection and family revocation
- [ ] Integration tests: rate limiting behavior
- [ ] Integration tests: cookie security settings
- [ ] Integration tests: CSRF protection
- [ ] Integration tests: CORS validation
- [ ] E2E tests: full auth flow with security checks
- [ ] Manual test: verify no sensitive data in logs

## Dependencies

- 004-auth-session-model.md

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Refresh token rotation tested end-to-end
- [ ] Rate limiting verified with load testing
- [ ] Cookie settings audited in browser dev tools
- [ ] CSRF attacks prevented (tested with curl/postman)
- [ ] Logs sanitized (no tokens/passwords visible)
- [ ] Security checklist documented in `docs/mvp/security/`

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

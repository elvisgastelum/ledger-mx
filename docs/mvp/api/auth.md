# Authentication

JWT access + refresh tokens with revocable sessions. Auth endpoints are defined as an `auth` router in `libs/contracts`.

## Contract Endpoints

All auth endpoints are part of the `auth` router in `libs/contracts`, with the following routes:

### POST /auth/register

Register new user. Returns user, access token, and session ID in response body. Refresh token is set as an httpOnly cookie.

### POST /auth/login

Login with email/password. Returns access token and session ID in response body. Refresh token is set as an httpOnly cookie.

### POST /auth/refresh

Refresh access token using refresh token from httpOnly cookie. Returns new access token and session ID in response body. New refresh token is set as an httpOnly cookie.

### POST /auth/logout

Revoke session. Reads refresh token from httpOnly cookie (body fallback is temporary backwards compatibility if implemented).

## Token Strategy

### Access Token

- 15 minutes expiry
- Stored in memory (React state)
- Sent as Bearer token

### Refresh Token

- 7 days (15 with rememberMe)
- Stored in httpOnly cookie (not in JSON response body)
- Single-use (rotating)
- Revocable via sessions table
- Read from httpOnly cookie on refresh/logout; body fallback is temporary backwards compatibility if implemented

## Password Security

- bcrypt hashing (salt rounds: 10)
- Min 8 chars, uppercase, lowercase, number, and special character
- No common passwords

## Session Management

Sessions table tracks active sessions. Logout revokes session.

## Protected Route Requirements

All non-auth endpoints must reference auth requirements consistently in their contracts, either via `headers` definitions for Bearer tokens or contract metadata. Auth guards in `apps/api` enforce these requirements, but contracts only define transport shapes (no JWT implementation details).

## Implementation

Auth endpoint handlers in `apps/api` implement the `auth` router contract defined in `libs/contracts`. The contract defines Zod schemas for request bodies (email, password, rememberMe). Handlers map contract inputs to application use cases without class-validator DTOs. Request validation uses Zod via nestjs-zod:

```typescript
// apps/api/src/auth/auth.controller.ts
@TsRestHandler(contract.auth.login)
async login() {
  return async ({ body }) => {
    const result = await this.authService.login(body.email, body.password, body.rememberMe);
    return { status: 200 as const, body: result };
  };
}
```

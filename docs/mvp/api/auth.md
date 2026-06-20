# Authentication

JWT access + refresh tokens with revocable sessions. Auth endpoints are defined as an `auth` router in `libs/contracts`.

## Contract Endpoints

All auth endpoints are part of the `auth` router in `libs/contracts`, with the following routes:

### POST /auth/register

Register new user. Returns user, access token, refresh token.

### POST /auth/login

Login with email/password. Returns tokens.

### POST /auth/refresh

Refresh access token using refresh token.

### POST /auth/logout

Revoke session.

## Token Strategy

### Access Token

- 15 minutes expiry
- Stored in memory (React state)
- Sent as Bearer token

### Refresh Token

- 7 days (15 with rememberMe)
- Stored in httpOnly cookie
- Single-use (rotating)
- Revocable via sessions table

## Password Security

- bcrypt hashing (salt rounds: 10)
- Min 8 chars, uppercase, lowercase, number
- No common passwords

## Session Management

Sessions table tracks active sessions. Logout revokes session.

## Protected Route Requirements

All non-auth endpoints must reference auth requirements consistently in their contracts, either via `headers` definitions for Bearer tokens or contract metadata. Auth guards in `apps/api` enforce these requirements, but contracts only define transport shapes (no JWT implementation details).

## Implementation

Auth endpoint handlers in `apps/api` implement the `auth` router contract defined in `libs/contracts`. The contract defines Zod schemas for request bodies (email, password, rememberMe). Handlers map contract inputs to application use cases without class-validator DTOs:

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

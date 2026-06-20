# Authentication

JWT access + refresh tokens with revocable sessions.

## Endpoints

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

## Implementation

```typescript
async login(dto: LoginDto) {
  const user = await this.userRepo.findByEmail(dto.email);
  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) throw new UnauthorizedException();
  
  const tokens = await this.generateTokens(user);
  await this.sessionRepo.create({ userId: user.id, ... });
  return tokens;
}
```

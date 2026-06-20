# Session Management

Detailed session management and implementation.

Overview: [Auth & Sessions](./auth-sessions.md)

## Rotation Limit / Session Invalidation

- Track `rotationCount` on session
- If `rotationCount > 10` in 24 hours: invalidate session (suspicious activity)
- If token reuse detected: invalidate ALL user sessions immediately
- Store `lastRotationAt` timestamp for rate limiting

## Session Record

```typescript
interface Session {
  id: string; // UUID v4
  user_id: string;
  refreshTokenHash: string; // bcrypt hash
  deviceInfo: string; // User agent
  ipAddress: string;
  lastActive: Date;
  expiresAt: Date;
}
```

## Session Tracking

- Create session on login
- Update lastActive on each request
- Invalidate on logout
- Auto-cleanup expired sessions

## Implementation

Use NestJS guards:

```typescript
@UseGuards(JwtAuthGuard)
@Get('transactions')
findAll() { ... }
```

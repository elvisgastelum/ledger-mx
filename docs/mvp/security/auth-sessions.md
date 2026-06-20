# Auth & Sessions

Session management implementation: [Session Management](./auth-session-mgmt.md)

## JWT Strategy

LedgerMx uses JWT access tokens + refresh tokens.

### Access Token

- Short-lived (15 minutes)
- Contains: user_id, email, roles
- Stored in memory (React state)

### Refresh Token

- Long-lived (7 days)
- Stored in httpOnly cookie
- Rotated on use
- Invalidated on logout

## Refresh Token Rotation

On each use of a refresh token, the server must:

1. **Validate token**: Verify signature, expiry, and token hash in database
2. **Check for replay**: If token hash already marked as used/rotated, reject and invalidate entire session (possible token theft)
3. **Invalidate old token**: Mark old token hash as rotated in session record
4. **Issue new token**: Generate new refresh token with +7 day expiry
5. **Store new token hash**: Save new bcrypt hash to session record, update `expiresAt`
6. **Set httpOnly cookie**: Return new refresh token in `Set-Cookie` header

### Rotation Logic Example

```typescript
async function rotateRefreshToken(oldToken: string, sessionId: string) {
  // 1. Validate
  const payload = verify(oldToken);
  const session = await db.findSession(sessionId);
  
  if (!session || session.refreshTokenHash !== hash(oldToken)) {
    throw new UnauthorizedException('Invalid refresh token');
  }
  
  // 2. Replay detection
  if (session.rotatedAt) {
    // Token already used! Possible theft.
    await db.invalidateAllUserSessions(session.userId);
    throw new UnauthorizedException('Token reuse detected - session invalidated');
  }
  
  // 3. Invalidate old
  await db.markTokenRotated(sessionId);
  
  // 4-6. Issue new
  const newToken = sign({ sub: payload.sub }, { expiresIn: '7d' });
  const newHash = await bcrypt.hash(newToken, 10);
  
  await db.updateSession(sessionId, {
    refreshTokenHash: newHash,
    expiresAt: addDays(new Date(), 7),
  });
  
  setCookie('refresh_token', newToken, { httpOnly: true, sameSite: 'strict' });
  return newToken;
}
```

See [Session Management](./auth-session-mgmt.md) for rotation limits and session tracking.

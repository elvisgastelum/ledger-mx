# Security

Security documentation for LedgerMx MVP.

## Topics

- [Auth & Sessions](./auth-sessions.md) - JWT, refresh tokens, session management
- [Audit Log](./audit-log.md) - Audit trail for security events
- [Data Isolation](./data-isolation.md) - User-scoped data access

## Security Principles

1. **User isolation**: All data scoped to user_id
2. **JWT auth**: Access + refresh token flow
3. **HTTPS only**: TLS in production
4. **Input validation**: Zod schemas on all inputs
5. **Audit trail**: Log auth and data access events
6. **No sensitive data in URLs**: Use POST bodies

## MVP Security Scope

- JWT authentication with refresh token rotation
- Session tracking (device, IP, last active)
- User-scoped queries (user_id on all tables)
- Audit log for auth events
- HTTPS via Traefik in homelab

## Future Security

- Passkey authentication
- Rate limiting
- CSRF protection
- Security headers (Helmet)
- Penetration testing

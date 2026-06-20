# Audit Log

## Purpose

Track security-relevant events for debugging and compliance.

## Events to Log

### Authentication Events

- User login (success/failure)
- User logout
- Refresh token used
- Failed login attempts

### Data Access Events

- Transaction created/updated/deleted
- Account created/updated
- Export requested

### Admin Events

- User registered
- Password changed

## Log Format

```typescript
interface AuditLogEntry {
  id: string;
  user_id: string;
  event: string; // 'login', 'transaction.create', etc.
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details: Record<string, any>; // Event-specific data
}
```

## Storage

- Store in `audit_logs` table
- User-scoped (user_id column)
- Retain for 1 year
- Queryable for security investigations

## Implementation

Use NestJS interceptor or middleware to auto-log events.

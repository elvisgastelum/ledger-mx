# Health Check

Endpoint: `GET /health` (no auth required).

## Response

### Healthy (200)

```json
{
  "status": "ok",
  "timestamp": "2026-06-19T12:00:00.000Z",
  "checks": {
    "database": { "status": "ok", "responseTimeMs": 5 }
  }
}
```

### Unhealthy (503)

```json
{
  "status": "error",
  "checks": {
    "database": { "status": "error", "message": "Timeout" }
  }
}
```

## Checks

- **Database**: `SELECT 1`, measure response time
- **Electric**: Connectivity check (future)

## Implementation

```typescript
@Get('health')
async check() {
  const dbCheck = await this.checkDatabase();
  const allHealthy = dbCheck.status === 'ok';
  
  return {
    status: allHealthy ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    checks: { database: dbCheck },
  };
}
```

## Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1
```

## Monitoring (Future)

Prometheus metrics at `/metrics`.

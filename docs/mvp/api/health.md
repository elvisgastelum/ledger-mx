# Health Check API

Planned endpoints for Kubernetes liveness and readiness probes. Defined in the `health` router of the ts-rest contract (`libs/contracts/src/contract.ts`), not yet implemented.

## Endpoints

### GET /health/liveness (Planned)

Kubernetes liveness probe: confirms the application process is running.

**Auth Required**: No
**Success Response (200)**:
```json
{ "status": "ok" }
```
**Error Response (503)**:
```json
{ "error": "SERVICE_UNAVAILABLE", "message": "Application process is unresponsive", "statusCode": 503 }
```

---

### GET /health/readiness (Planned)

Kubernetes readiness probe: confirms the application can handle traffic (dependent services are available).

**Auth Required**: No
**Success Response (200)**:
```json
{
  "status": "ok",
  "checks": {
    "database": true
  }
}
```
**Error Response (503)**:
```json
{
  "error": "SERVICE_UNAVAILABLE",
  "message": "Dependent services are unavailable",
  "statusCode": 503,
  "checks": {
    "database": false
  }
}
```

## Checks (Planned)

| Check       | Description                                  | Required for Readiness |
|-------------|----------------------------------------------|------------------------|
| Database    | Execute simple query (e.g., `SELECT 1`)      | Yes                    |
| Redis       | Ping Redis cache (if enabled)                 | No (optional)          |

## Implementation Notes

- Liveness probe should never fail unless the process is crashed (no dependency checks).
- Readiness probe fails if any required dependency is unavailable.
- No auth is required for either endpoint (Kubernetes probes cannot authenticate).

## Docker/Kubernetes Configuration

Once implemented, update Dockerfile and Kubernetes manifests to use the correct probe endpoints:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health/liveness || exit 1
```

## Monitoring (Future)

Prometheus metrics endpoint at `/metrics` (separate from health probes).

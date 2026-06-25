# Story: Operational Readiness & Health

**Status**: Todo
**Priority**: P2
**Estimated**: 1 day

## Goal

Implement health endpoints, migration drift checking, seed verification, Docker/env/deployment readiness validation, and backup strategy decision; cross-reference 009-deployment.md.

## Context

- Health endpoints needed for uptime monitoring (load balancer checks)
- Migration drift detection prevents schema mismatches
- Seed verification ensures test/initial data integrity
- Docker and environment configuration must be validated for deployment
- Backup strategy decision needed for production readiness
- This story complements 009-deployment.md with operational concerns

## Acceptance Criteria

- [ ] Health endpoint: `/health` returns 200 with status info
- [ ] Health endpoint: `/health/db` checks database connectivity
- [ ] Migration drift detection: compare DB schema with migration files
- [ ] Seed verification: script to validate seed data integrity
- [ ] Docker Compose validated for production-like deployment
- [ ] Environment variable validation on startup
- [ ] Backup strategy documented and decision logged
- [ ] Log rotation configuration (future-ready)
- [ ] Error tracking setup (future-ready: Sentry or similar)

## Technical Notes

Health endpoints:
```typescript
// apps/api/src/health/health.controller.ts
GET /health
{
  status: 'ok',
  timestamp: '2024-01-01T00:00:00Z',
  version: '1.0.0',
  services: {
    database: 'ok',
    api: 'ok'
  }
}

GET /health/db
{
  status: database.connected ? 'ok' : 'error',
  latency: 5 // ms
}
```

Migration drift detection:
```bash
# Script: scripts/check-migration-drift.sh
# Compares current DB schema with migration files
npm run db:check-drift
```

Seed verification:
```bash
# Script: scripts/verify-seeds.sh
# Validates seed data integrity
npm run seed:verify
```

Environment validation:
```typescript
// apps/api/src/config/validation.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  // ... other required vars
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Environment validation failed:', result.error);
    process.exit(1);
  }
  return result.data;
}
```

Backup strategy options:
1. **Automated pg_dump**: Daily cron job with S3 upload
2. **WAL-E / WAL-G**: Continuous archiving
3. **Managed backups**: If using cloud provider (RDS, etc.)
4. **Defer**: Document as post-MVP if homelab

Files/modules to create/update:
- `apps/api/src/health/health.controller.ts`
- `scripts/check-migration-drift.sh`
- `scripts/verify-seeds.sh`
- `apps/api/src/config/validation.ts`
- `docs/mvp/operations/backup-strategy.md` (new)
- `docker-compose.prod.yml` (if not exists)

## Tests Required

- [ ] Integration tests: health endpoint returns 200
- [ ] Integration tests: health/db endpoint detects DB issues
- [ ] Unit tests: environment validation rejects invalid config
- [ ] Manual test: migration drift detection works
- [ ] Manual test: seed verification script runs
- [ ] Manual test: Docker Compose production build

## Dependencies

- 009-deployment.md (deployment foundation)
- 007-seeds.md (seed data)

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Health endpoints functional and documented
- [ ] Migration drift script created and tested
- [ ] Seed verification script created
- [ ] Environment validation prevents bad startups
- [ ] Backup strategy decision documented with rationale
- [ ] Docker configuration validated for deployment
- [ ] Cross-reference added to 009-deployment.md
- [ ] Operations documentation updated

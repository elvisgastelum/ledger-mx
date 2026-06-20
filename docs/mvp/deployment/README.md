# Deployment

Deployment documentation for LedgerMx MVP.

## MVP Deployment: Homelab

- Docker Compose for all services
- Traefik for reverse proxy and TLS
- PostgreSQL for database
- Electric for sync

## Topics

- [Homelab](./homelab.md) - Homelab setup with Docker Compose
- [Environment](./env.md) - Environment variables
- [Backups](./backups.md) - Backup strategy and procedures

## Deployment Architecture

```
Internet
    ↓
Traefik (TLS termination)
    ↓
┌─────────────┬─────────────┬─────────────┐
│  Web (PWA)  │  API (NestJS) │  Electric   │
└─────────────┴─────────────┴─────────────┘
                    ↓
            PostgreSQL (persistent)
```

## MVP Constraints

- Single server (homelab)
- No clustering
- No auto-scaling
- Manual backups (future: automated pg_dump rotation)

## Future Deployment

- Cloud deployment (Fly.io, Railway, etc.)
- Managed PostgreSQL
- Automated backups
- Multi-region sync (future)

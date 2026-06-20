# Homelab Deployment

## Docker Compose Setup

### docker-compose.yml

```yaml
services:
  traefik:
    image: traefik:v3
    command:
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  web:
    build: ./apps/web
    labels:
      - "traefik.http.routers.web.rule=Host(`ledger-mx.local`)"
      - "traefik.http.routers.web.tls=true"

  api:
    build: ./apps/api
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    labels:
      - "traefik.http.routers.api.rule=Host(`api.ledger-mx.local`)"

  postgres:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data

  electric:
    image: electricsql/electric:latest
    environment:
      - DATABASE_URL=${DATABASE_URL}

volumes:
  postgres-data:
```

## Deploy Steps

1. Copy docker-compose.yml to homelab
2. Create .env file with secrets
3. Run `docker compose up -d`
4. Access at https://ledger-mx.local

## PWA Build

```bash
cd apps/web
pnpm build
# Output: dist/ (static files served by Nginx or Traefik)
```

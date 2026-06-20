# Environment Variables

## API (.env)

```
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/ledger_mx

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Electric
ELECTRIC_URL=http://electric:5133

# CORS
CORS_ORIGIN=https://ledger-mx.local
```

## Web (.env)

```
VITE_API_URL=https://api.ledger-mx.local
VITE_ELECTRIC_URL=ws://electric:5133
```

## Docker Secrets

Use Docker secrets for production:

```yaml
services:
  api:
    secrets:
      - jwt_secret
      - db_password

secrets:
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  db_password:
    file: ./secrets/db_password.txt
```

## Required Secrets

- `JWT_SECRET`: 32+ random characters
- `POSTGRES_PASSWORD`: Strong password
- `REFRESH_TOKEN_SECRET`: Separate from JWT_SECRET (optional)

## Generation

```bash
# Generate JWT secret
openssl rand -base64 32 > secrets/jwt_secret.txt
```

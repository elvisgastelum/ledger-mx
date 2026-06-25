# API Boundaries

Contract-first API design using `@ts-rest/core` for schema definitions and type safety. All endpoint shapes are defined as the single source of truth in `libs/contracts/src/contract.ts` before implementation.

## Contract Structure

Each endpoint contract defines:

- HTTP method (GET, POST, PATCH, DELETE, etc.)
- Absolute path (no global path prefix; routes use their actual deployed paths, e.g., `/auth/register`, `/api/v1/onboarding/layout`)
- Path parameters (using `pathParams` with Zod schemas)
- Query parameters (using `query` with Zod schemas)
- Request body (using `body` with Zod schemas)
- Success responses (status code to Zod schema mapping)
- Error responses (RFC 7807-compatible `ErrorResponseSchema` shape)
- Metadata: `implemented` (boolean), `auth` (boolean, requires JWT), `scopes` (array of required permissions), `planned` (boolean, for unimplemented endpoints)

## Schema Rules

All request/response schemas enforce MVP conventions:

- Money values: integer in cents (use `MoneySchema` from `libs/contracts`)
- IDs: UUID v4 strings (use `UuidSchema` from `libs/contracts`)
- Dates: ISO 8601 datetime strings (offset inclusive)
- User-scoped routes: all endpoints validate user ownership of resources via `user_id` scoping in controllers

## Implementation Alignment

- **Backend**: Current implementation uses NestJS controllers with `ZodValidationPipe` ( `@ts-rest/nest` is not yet installed). Controllers must align with `libs/contracts` schemas for request/response validation.
- **Frontend**: Client consumes contracts using `@ts-rest/core` ( `@ts-rest/react-query` is planned post-MVP).
- **OpenAPI**: Generation is planned using `@ts-rest/open-api` once the package is added as a dependency. No manual Swagger decorators are used.

## Error Handling

Contracts define standardized `ErrorResponseSchema` ( `{ error: string, message: string, statusCode: number}`). Global NestJS exception filters map application errors to contract-defined error shapes and status codes.

## Endpoint Status

| Router           | Endpoint                                 | Status      |
| ---------------- | ---------------------------------------- | ----------- |
| `auth`           | `register`, `login`, `refresh`, `logout` | Implemented |
| `categoryGroups` | `list`, `create`, `update`, `delete`     | Implemented |
| `onboarding`     | `applyLayout`                            | Implemented |
| `reports`        | All endpoints                            | Planned     |
| `export`         | `downloadCsv`                            | Planned     |
| `health`         | `liveness`, `readiness`                  | Planned     |

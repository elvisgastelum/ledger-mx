# API Boundaries

Contract-first API design using ts-rest. All endpoints are defined as ts-rest contracts in `libs/contracts` before implementation.

## Contract Structure

Each endpoint contract must define:

- HTTP method (GET, POST, PUT, DELETE, etc.)
- Path (with `pathPrefix: '/api/v1'` for versioning)
- Path parameters, query parameters, request body, headers
- Success response schema and status code
- Error response schemas (RFC 7807) and status codes
- Summary and description metadata for OpenAPI generation

## Schema Rules

All request/response schemas must enforce MVP conventions:

- Money values: integer `amountCents` (no floats)
- IDs: UUID v4 strings
- User-scoped routes: all endpoints must validate user ownership of resources

## Implementation Alignment

- **Backend**: Controllers implement contracts using `@ts-rest/nest`, mapping contract inputs to application use case inputs
- **Frontend**: Client consumes same contracts using `@ts-rest/react-query/v5`
- **OpenAPI**: Generated from contracts using `@ts-rest/open-api`, no manual Swagger decorators

## Error Handling

Contracts define standardized RFC 7807 error responses. Global exception filters map application errors to contract-defined error schemas.

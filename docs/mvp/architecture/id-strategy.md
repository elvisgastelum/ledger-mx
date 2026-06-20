# ID Strategy

## Decision: Client-Generated UUID v4

All entities use client-generated UUID v4 identifiers.

## Rules

1. **Client generates ID before persistence**
   - Client knows ID immediately
   - No round-trip to server for ID
   - Works offline

2. **No database-generated random IDs**
   - No SERIAL, no auto-increment
   - No DB-generated UUIDs
   - Database stores but does not generate

3. **IDs are non-optional**
   - Every entity has an ID
   - ID cannot be null or undefined
   - Required in all schemas

4. **UUID v4 format**
   - Random UUID per RFC 4122
   - Example: `550e8400-e29b-41d4-a716-446655440000`
   - String type in TypeScript and database

## Implementation Notes

### Client-Side Generation
- Use `uuid` library (v4)
- Generate in entity constructor if not provided
- Store as string in TypeScript and database

### Database Schema
- PostgreSQL: `uuid` column type, primary key
- PGlite: same schema, `uuid` type supported
- No auto-generation in database

### Value Object Validation
- UUID v4 format regex validation
- Non-empty string check
- Invalid UUID throws error

Example validation regex: `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`

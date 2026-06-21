# Electric Shapes

Shapes define what data to sync from PostgreSQL to client.

> **Note:** Code examples in this document are API/UX sketches and are not runtime implementation yet.

## User-Scoped Shapes

All shapes filter by user_id. Shape definition includes:
- `table`: PostgreSQL table name
- `where`: SQL WHERE clause filtering by user_id
- `include`: optional related tables to nest

Example:
- Table: `transactions`
- Where: `user_id = 'userId'`
- Include: `transaction_lines`

## Subscribing

- Use `db.useShape()` to subscribe to a shape
- Returns reactive data that updates on changes
- Component re-renders when shape data changes
- Unsubscribe on component unmount or logout

Example usage:
- Call `db.useShape()` with shape config
- Destructure `data` from result
- Render transaction list from `data`

## Shape Lifecycle

- **Subscribe**: On app launch, connect Electric
- **Unsubscribe**: On logout, disconnect

## Real-Time Updates

1. Electric detects PostgreSQL change
2. Pushes to subscribed clients
3. TanStack DB updates PGlite
4. UI re-renders

## Testing

Test that shapes only return user's data.

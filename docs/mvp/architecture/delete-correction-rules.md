# Delete and Correction Rules

Never hard-delete financial records. Use soft delete and reversals.

## Deletion Rules

### Pending/Draft (Local Only, Not Synced)

- May be edited or discarded before sync
- Status: `draft` or `pending`
- No audit log required (local-only)

### Cleared/Synced (Server Persistent)

- **Never hard-delete**
- Reversal required for corrections
- Audit trail preserved
- Status: `cleared` or `synced`

## Correction Process

Once synced, corrections use reversal + corrected transaction:

1. Create reversal transaction (negative of original amount, links to original via `reversal_of`)
2. Create corrected transaction (new correct amount)
3. Original transaction marked as `reversed_by`

Example: Correct $100 expense to $150:

1. Reversal: +$100 (type: reversal, note "Reversal for abc-123")
2. Corrected: -$150 (type: expense, links to reversal)

## Database Fields

- `id`: UUID
- `status`: draft | pending | cleared | synced
- `deleted_at`: timestamp or null (soft delete)
- `reversal_of`: UUID or null (points to original)
- `reversed_by`: UUID or null (points to reversal)

## Audit Log

Every mutation logs to `audit_log`:

- `action`: create | update | reversal | soft_delete
- `entity`: transaction | account | etc.
- `before`: JSON (state before)
- `after`: JSON (state after)
- `user_id`: who made the change
- `timestamp`: when

## Correction UI

1. User taps "Correct" on transaction
2. Enters corrected details
3. System creates reversal + corrected transaction
4. Shows both in list (strikethrough on original)

## Invariants

- Every reversal references original transaction
- Original + reversal nets to zero
- Audit log entry exists for every correction
- Synced records never removed from database

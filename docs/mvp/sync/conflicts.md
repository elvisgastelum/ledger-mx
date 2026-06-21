# Sync Conflicts

User-driven conflict resolution. Never auto-delete financial records.

UI implementation: [Conflict UI](./conflicts-ui.md)

> **Note:** Code examples in this document are API/UX sketches and are not runtime implementation yet.

## When Conflicts Happen

Same transaction edited on two devices offline → conflict on sync.

## Resolution Options

1. **Keep A**: Keep device A version
2. **Keep B**: Keep device B version
3. **Keep Both**: Duplicate as separate transactions (see safeguards below)

Default: Require user choice. Never auto-delete.

## Keep Both Safeguards

When user selects "Keep Both", show warning and confirmation:

### 1. Warning: Balance Impact

```
⚠️ Warning: Keeping both versions will duplicate this transaction.
Your account balances will reflect BOTH transactions.
```

### 2. Preview: Total/Resulting Transactions

Show comparison before confirming:

```typescript
function KeepBothPreview({ versionA, versionB }) {
  const impact = calculateBalanceImpact(versionA, versionB);
  
  return (
    <Alert variant="warning">
      <h4>Duplicate Transaction Impact</h4>
      <p>After keeping both:</p>
      <ul>
        <li>Account X: {impact.accountXDelta} (2 transactions)</li>
        <li>Account Y: {impact.accountYDelta} (2 transactions)</li>
      </ul>
      <p><strong>Total transactions after merge: {impact.totalCount}</strong></p>
    </Alert>
  );
}
```

### 3. Explicit Confirmation

Require user to type "KEEP BOTH" or check confirmation box:

```typescript
<Checkbox
  label="I understand this will create duplicate transactions"
  onChange={setConfirmed}
/>
<Button disabled={!confirmed} onClick={resolve}>Confirm Keep Both</Button>
```

### 4. Consider Merge for Field-Level Differences

If differences are field-level (not structural), offer merge:

```typescript
// Example: versionA has different description, versionB has different amount
function MergeOption({ versionA, versionB }) {
  if (hasFieldLevelDifferences(versionA, versionB)) {
    return (
      <Button onClick={() => resolve('merge')}>
        Merge Fields (keep newer values)
      </Button>
    );
  }
}
```

Merge logic:
- For each field, prefer the newer timestamp
- If same timestamp, prefer versionB (server wins tiebreak)
- Show merged preview before confirming


# Conflict UI Implementation

UI implementation details for sync conflict resolution.

Overview: [Sync Conflicts](./conflicts.md)

> **Note:** Code examples in this document are API/UX sketches and are not runtime implementation yet.

## Conflict UI

```typescript
function ConflictNotification({ conflict }) {
  const [confirmKeepBoth, setConfirmKeepBoth] = useState(false);
  
  return (
    <Card>
      <h3>Conflict Detected</h3>
      
      <ConflictDiff versionA={conflict.versionA} versionB={conflict.versionB} />
      
      <Button onClick={() => resolve('keep_a')}>Keep A</Button>
      <Button onClick={() => resolve('keep_b')}>Keep B</Button>
      
      {conflict.option === 'keep_both' && !confirmKeepBoth && (
        <KeepBothPreview versionA={conflict.versionA} versionB={conflict.versionB} />
      )}
      
      <Button onClick={() => setConfirmKeepBoth(true)}>Keep Both</Button>
      
      {hasFieldLevelDifferences(conflict.versionA, conflict.versionB) && (
        <Button onClick={() => resolve('merge')}>Merge Fields</Button>
      )}
    </Card>
  );
}
```

## Storage

Conflicts stored in `conflicts` table with versionA, versionB, resolution.

## Testing

Test all three resolution options.

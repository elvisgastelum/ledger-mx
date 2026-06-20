# Alpha Dependency Risk Mitigation

TanStack DB (^0.1) and Electric (^0.8) are alpha-stage. Mitigation strategy:

## Strict Pinning

```json
// pnpm-lock.yaml ensures exact versions
// package.json uses ~ not ^ for alpha deps
"dependencies": {
  "@tanstack/db": "~0.1.2",  // Exact minor, allow patches
  "electric-sql": "~0.8.4"
}
```

## Release Monitoring

- Subscribe to GitHub releases for both projects
- Weekly check for breaking changes / migration guides
- Test updates in feature branch before merging

## Adapter Abstraction

Wrap alpha APIs in internal adapters to limit blast radius:

```typescript
// libs/sync/adapters/electric.adapter.ts
export interface SyncAdapter {
  connect(url: string): Promise<void>;
  sync(shape: Shape): Promise<Subscription>;
  // ... stable interface
}

// Implementation can be swapped if needed
export class ElectricAdapter implements SyncAdapter { ... }
```

## Rollback Plan

1. **Freeze**: Pin to last working version in lockfile
2. **Patch**: Apply minimal fixes locally if needed (fork as last resort)
3. **Swap**: Replace adapter implementation (see abstraction above)
4. **Communication**: Document breaking changes in CHANGELOG

## Testing

- Integration tests MUST cover sync flows (catch regressions early)
- Snapshot tests for sync state shape
- E2E tests for offline→online sync scenarios

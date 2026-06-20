# UX Principles

Design guidelines for LedgerMx web app.

## 1. Offline-First Always

- App works without internet
- Local PGlite is source of truth
- Sync status visible but not blocking

## 2. Optimistic UI

- Save locally immediately
- Show success before sync confirms
- Handle sync errors gracefully

## 3. Biweekly Income Focus

- Calendar shows pay periods
- Paycheck plans prominent
- "Next paycheck" countdown

## 4. Spendable Balance Prominence

- Dashboard shows spendable balance FIRST
- Formula visible: Accounts - Envelopes - Upcoming
- Color coding: green/yellow/red

## 5. Quick Transaction Entry

- Floating action button (+)
- Recent templates list
- Manual entry as fallback

## 6. Envelope Visualization

- Progress bars for goals
- Color-coded allocations

## 7. Debt Payoff Motivation

- Progress bars on debt
- "Payoff date" estimates

## 8. No Finance Jargon

- "Spendable" not "Disposable Income"
- Tooltips for unfamiliar terms

## 9. Error Prevention

- Confirm before delete
- Warn on large transactions
- Undo for accidental actions

## 10. Theme Support (MVP Requirement)

- **Manual toggle required**: Light / Dark / System options in settings
- **Persisted preference**: Store user choice in `localStorage` (key: `theme-preference`)
- **Respect system preference**: Default to `system` on first visit, using `prefers-color-scheme` media query
- **shadcn/ui theming**: Via CSS custom properties
- **No flash**: Apply stored theme before first paint (inline script in `<head>`)

### Implementation

```typescript
type Theme = 'light' | 'dark' | 'system';

function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<Theme>('theme-preference', 'system');
  
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  
  return (
    <Select value={theme} onValueChange={setTheme}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System (auto)</option>
    </Select>
  );
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  if (theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', systemDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}
```

### Accessibility

- Theme toggle must be keyboard accessible
- Current selection must be announced to screen readers
- Contrast ratios must meet WCAG 2.1 AA in both light and dark themes

## 11. iPhone PWA Optimization

- Standalone display mode (no browser chrome)
- Safe area insets: `env(safe-area-inset-*)`
- Minimum 44px touch targets
- Web App Manifest for installability
- Offline shell via service worker
- Safari storage: PGlite/IndexedDB in OPFS when available
- Test on Safari iOS regularly

## Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support

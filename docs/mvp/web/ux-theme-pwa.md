# Theme, PWA, and Accessibility

Detailed implementation for theme support, iPhone PWA optimization, and accessibility.

Overview: [UX Principles](./ux-principles.md)

## Theme Support (MVP Requirement)

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

## iPhone PWA Optimization

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

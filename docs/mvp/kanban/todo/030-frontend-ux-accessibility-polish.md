# Story: Frontend UX & Accessibility Polish

**Status**: Todo
**Priority**: P2
**Estimated**: 2 days

## Goal

Audit and improve React Hook Form usage, centralize money/date formatting, enhance accessibility (aria-current, table responsiveness), fix user-scoped query keys, complete onboarding navigation, and improve export UX placement.

## Context

- React Hook Form should be used consistently per project instructions
- Money and date formatting currently scattered across components
- Accessibility improvements needed for screen readers and keyboard nav
- TanStack Query keys must be user-scoped to prevent cache leakage
- Onboarding flow needs navigation completion (back/next buttons)
- Export UX placement not optimal (should be in more visible location)

## Acceptance Criteria

- [ ] React Hook Form audit: all forms use useForm with register/handleSubmit
- [ ] Centralize money formatting: `formatMoney(amount, currency)` utility
- [ ] Centralize date formatting: `formatDate(date, format)` utility
- [ ] Add aria-current="page" to active navigation items
- [ ] Table responsiveness: horizontal scroll or card layout on mobile
- [ ] User-scoped TanStack Query keys: `['transactions', userId]` not `['transactions']`
- [ ] Onboarding navigation: back/next buttons, progress indicator
- [ ] Export UX: move to more visible location (header or dashboard)
- [ ] Keyboard navigation support for interactive elements
- [ ] Focus management in modals and forms

## Technical Notes

React Hook Form audit:
- Search for `useState.*form` patterns and replace with React Hook Form
- Ensure `register`, `handleSubmit`, `formState` used correctly
- Remove `FormEvent` handling patterns

Centralized formatting:
```typescript
// packages/application/src/utils/format.ts
export function formatMoney(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100); // Convert cents to dollars
}

export function formatDate(date: Date | string, format = 'medium'): string {
  const d = new Date(date);
  // Implementation with date-fns or Intl.DateTimeFormat
}
```

User-scoped query keys:
```typescript
// ❌ Wrong
useQuery({ queryKey: ['transactions'], ... });

// ✅ Correct
useQuery({ queryKey: ['transactions', user.id], ... });
```

Accessibility improvements:
- Add `aria-label` to icon-only buttons
- Add `aria-describedby` for form validation errors
- Use semantic HTML (`<nav>`, `<main>`, `<section>`)
- Add skip navigation link
- Ensure focus visible styles

Files/modules to update:
- `apps/web/src/utils/format.ts` (new)
- `apps/web/src/components/**/*.tsx` (formatting updates)
- `apps/web/src/hooks/useQueryKeys.ts` (new, user-scoped helpers)
- `apps/web/src/navigation/**/*.tsx` (aria-current)
- `apps/web/src/onboarding/**/*.tsx` (navigation)
- `apps/web/src/export/**/*.tsx` (UX placement)

## Tests Required

- [ ] Unit tests: formatMoney with various inputs (cents, negative, zero)
- [ ] Unit tests: formatDate with various formats
- [ ] Component tests: forms use React Hook Form correctly
- [ ] Component tests: aria attributes present
- [ ] Component tests: table responsive on mobile viewport
- [ ] E2E tests: keyboard navigation through forms
- [ ] E2E tests: onboarding navigation flows correctly
- [ ] Manual test: screen reader compatibility (VoiceOver/NVDA)

## Dependencies

- 010-product-foundations.md (for UX patterns)
- 013-web-ux-model.md (for UX guidelines)

## Done Checklist

- [ ] All acceptance criteria met
- [ ] No `useState` for form fields remains (except allowed cases)
- [ ] Money/date formatting centralized and used consistently
- [ ] aria-current added to navigation
- [ ] Tables responsive on mobile (tested at 375px width)
- [ ] Query keys user-scoped (verified with cross-user test)
- [ ] Onboarding flow complete with navigation
- [ ] Export accessible from dashboard or header
- [ ] Keyboard navigation works for main flows

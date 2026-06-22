# UX Principles

Design guidelines for LedgerMx web app.

Theme, PWA, and accessibility: [Theme, PWA, Accessibility](./ux-theme-pwa.md)

## 1. Manual-First (Primary Principle)

- Users control their data; manual entry is the default
- Import is secondary; does not replace manual tracking
- Users can edit/correct any automated data
- No "black box" calculations; formulas visible

## 2. Confidence & Safety

- Financial data integrity is non-negotiable
- Integer cents only (no floats) with clear display formatting
- Every financial record is user-scoped (isolated by `user_id`)
- Validation errors prevent invalid data at form level
- Clear error messages with actionable recovery steps
- Undo for accidental actions (delete confirmations, soft deletes for synced records)
- Transaction lines must balance to zero (double-entry invariant)

## 3. Progressive Disclosure

- Show essential fields first; advanced fields hidden behind expand/collapse
- Transaction form: Amount, Type, Account, Category visible; Note, Date, Envelope optional
- Dashboard: Spendable Balance prominent; details available on tap/expand
- Calendar: Month view default; tap to see day details
- Settings: Basic settings visible; advanced options in collapsible sections

## 4. Fast Entry

- Floating action button (+) always accessible
- Quick entry modal minimizes fields required
- Recent transactions and templates for one-tap entry
- Keyboard shortcuts for power users (future)
- Default values reduce typing (today's date, last used account)

## 5. Financial Correctness

- **Integer cents only**: All money stored/displayed as integer cents (e.g., $12.34 = 1234 cents)
- **UUID v4 client-generated IDs**: All records use client-generated UUID v4 (no DB-generated IDs)
- **Double-entry invariant**: Transaction lines must sum to zero
- **UTC timestamps internally**: All timestamps stored in UTC; display in user local time
- **No hard deletes for synced/cleared records**: Use reversal/correction transactions instead
- **User-scoped queries**: Every financial query filtered by `user_id`

## 6. Accessibility & Responsiveness

- Mobile-first responsive design (minimum 320px width)
- Keyboard navigation support (Tab, Enter, Escape)
- Screen reader friendly (ARIA labels, semantic HTML)
- Color contrast meets WCAG 2.1 AA standards
- Touch targets minimum 44x44px
- Focus visible indicators

## 7. Privacy & User-Scope

- All financial data isolated by `user_id`
- No cross-user data leakage in queries or API responses
- API calls use `credentials: 'include'` for authenticated requests
- API routes under `/api/v1` with user context from session
- Local storage (PGlite) is user-specific; cleared on logout
- No PII shared with third parties

## 8. Biweekly Income Focus

- Calendar shows pay periods
- Paycheck plans prominent
- "Next paycheck" countdown

## 9. Spendable Balance Prominence

- Dashboard shows spendable balance FIRST
- Formula visible: Accounts - Envelopes - Upcoming
- Color coding: green/yellow/red

## 10. Envelope Visualization

- Progress bars for goals
- Color-coded allocations

## 11. Debt Payoff Motivation

- Progress bars on debt
- "Payoff date" estimates

## 12. Error Prevention

- Confirm before delete (except drafts)
- Warn on large transactions (configurable threshold)
- Warn on unbalanced transactions (lines don't sum to zero)
- Validation on blur and submit

## Form Implementation Requirements

All forms in `apps/web/src` **MUST** use React Hook Form:

- Required: `useForm` with typed interface, `register`, `handleSubmit`, `formState` for errors/isSubmitting
- **NO**: `useState` for form fields, `FormEvent` handling, separate form state management
- Allowed `useState`: wizard steps, modal toggles, non-form UI state only

## Routing & Data Fetching Patterns

- Use TanStack Router for type-safe routing
- Use TanStack Query for server state (cache, fetch, mutate)
- Authenticated API calls: `fetch(url, { credentials: 'include' })`
- API routes: `/api/v1/*` (ts-rest contracts)

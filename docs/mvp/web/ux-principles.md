# UX Principles

Design guidelines for LedgerMx web app.

Theme, PWA, and accessibility: [Theme, PWA, Accessibility](./ux-theme-pwa.md)

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


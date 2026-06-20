# Financial Calendar

## Purpose

Show upcoming financial obligations on a calendar.

## Features

### Income Events

- Biweekly paycheck (every second Friday)
- Bonus (yearly)
- Tax refund (future)

### Expense Events

- Rent (monthly, 1st)
- Utilities (monthly, 15th)
- Credit card payment (monthly, due date)
- Subscriptions (monthly/annual)

### Envelope Allocations

- Paycheck allocation to envelopes
- Visual progress toward envelope goals

## Calendar View

### Month View

```
January 2024
Su Mo Tu We Th Fr Sa
    1  2  3  4  5  6
 7  8  9 10 11 12 13
14 15 16 17 18 19 20
21 22 23 24 25 26 27
28 29 30 31
```

Events shown as dots or bars.

### Event Types

- Green: Income
- Red: Expense
- Blue: Transfer
- Yellow: Envelope allocation

## Implementation

Use React Big Calendar or custom calendar component.

## Data Source

Generate events from:
- Recurring charges table
- Paycheck plans
- Income occurrences

## Future

- Drag-and-drop to reschedule
- Conflict detection (overallocated paycheck)
- Integration with Google Calendar (future)

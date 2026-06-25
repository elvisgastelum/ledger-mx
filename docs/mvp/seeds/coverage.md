# Seed Coverage

## Requirements

Seeds must cover all features for testing.

## Coverage Checklist

### Accounts

- [x] Debit account
- [x] Credit account
- [x] Cash account
- [x] Savings account
- [ ] Loan account (future)

### Transaction Types

- [x] Expense
- [x] Income
- [x] Transfer
- [x] Debt payment
- [ ] Envelope allocation (future)

### Scenarios

- [x] Biweekly paycheck
- [x] Credit card payment
- [x] Envelope allocation
- [x] Recurring expense
- [ ] Debt payoff plan (future)
- [ ] Paycheck plan (future)

### Edge Cases

- [x] Transaction with multiple lines
- [x] Transfer between accounts
- [x] Debt payment (not duplicate expense)
- [ ] Split transaction (future)
- [ ] Recurring transaction (future)

## Test Coverage

Every use case must have seed data for testing.

## E2E Coverage

E2E tests use demo seed. Must cover:

- Creating transaction
- Viewing balance
- Allocating to envelope
- Exporting CSV

## Future

Add seed data for future features as implemented.

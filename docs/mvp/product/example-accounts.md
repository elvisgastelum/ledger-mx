# Example Accounts

Initial account setup for LedgerMx MVP. Users can modify, add, or remove.

## Canonical MVP Accounts

The following four accounts are the core, required example accounts for the MVP:

- **BBVA Debit** - Primary checking account
- **BBVA Credit** - Primary credit card
- **Nu Credit** - Digital credit card
- **Cash** - Physical cash on hand

## Account Properties

Each account has:

- UUID v4 identifier
- Name (user-defined)
- Type: debit | credit | loan | savings | investment | cash
- Currency (MXN for MVP)
- Current balance (integer minor units)
- Active flag
- Credit limit (for credit accounts)
- Notes (optional)

## Default Account Configuration

```yaml
accounts:
  - name: BBVA Debit
    type: debit
    currency: MXN

  - name: BBVA Credit
    type: credit
    currency: MXN
    credit_limit_cents: 500000 # $5,000 MXN

  - name: Nu Credit
    type: credit
    currency: MXN
    credit_limit_cents: 300000 # $3,000 MXN

  - name: Cash
    type: cash
    currency: MXN
```

## Usage in Spendable Balance

Real account balance (debit accounts)

- Protected envelopes
- Upcoming required payments (credit cards, loans)
  = Real spendable balance

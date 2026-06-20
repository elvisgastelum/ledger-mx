# Example Accounts

Initial account setup for LedgerMx MVP. Users can modify, add, or remove.

## Required Initial Accounts

### Debit Accounts
- **BBVA Debit** - Primary checking account
- **Cash** - Physical cash on hand

### Credit Cards
- **BBVA Credit** - Primary credit card
- **Nu Credit** - Digital credit card
- **Plata Credit** - Additional credit line
- **Coppel** - Store credit card

### Loans
- **Long-term land loan** - Mortgage/land payment

### Savings and Investments
- **Emergency Fund** - Protected emergency savings
- **GBM Trading MX** - Investment account (future tracking)
- **CETES** - Government bonds (future tracking)

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
    credit_limit_cents: 500000  # $5,000 MXN
    
  - name: Nu Credit
    type: credit
    currency: MXN
    credit_limit_cents: 300000  # $3,000 MXN
    
  - name: Plata Credit
    type: credit
    currency: MXN
    credit_limit_cents: 200000  # $2,000 MXN
    
  - name: Coppel
    type: credit
    currency: MXN
    credit_limit_cents: 150000  # $1,500 MXN
    
  - name: Long-term land loan
    type: loan
    currency: MXN
    
  - name: Cash
    type: cash
    currency: MXN
    
  - name: Emergency Fund
    type: savings
    currency: MXN
    
  - name: GBM Trading MX
    type: investment
    currency: MXN
    
  - name: CETES
    type: investment
    currency: MXN
```

## Usage in Spendable Balance

Real account balance (debit accounts)
- Protected envelopes
- Upcoming required payments (credit cards, loans)
= Real spendable balance

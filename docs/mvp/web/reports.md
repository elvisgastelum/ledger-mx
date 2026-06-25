# Reports

MVP reports available via web UI. All reports read from local PGlite (offline-first).

## Required Reports

### Real Spendable Balance

Available cash after envelopes + upcoming payments. Calculation: `(accounts balance) - (envelopes allocated) - (confirmed upcoming payments before next income)`. Display prominent on dashboard.

### Expenses by Category

Pie/bar chart. Filters: date range, account, envelope. Data source: `transaction_lines` joined to `categories`.

### Expenses by Responsibility Group/Person

Similar to category report but grouped by `responsibility_group_id` or `person_id`. Shows who spent what. Useful for shared budgets.

### Total Debt

Sum of all active debts `current_balance`. List each debt with interest rate, minimum payment, and due date.

### Debt Payoff Progress

Track payments against debt. Show `initial_balance` vs `current_balance`. Progress bar per debt. Data source: transactions linked to `debt_id`.

### Upcoming Payments Before Next Income

Show recurring charges and debts due before next `income_occurrence`. Warn if insufficient balance.

### Protected Envelopes

List envelopes with allocated amount, spent amount, and remaining. Warn when overspent.

### Monthly Net Cashflow

Income minus expenses per month. Bar chart comparing months. Filter by year.

### Financial Calendar

Calendar view showing:

- Income occurrences (paydays)
- Recurring charge due dates
- Debt payment dates
- Envelope refill reminders

## Filters

All reports support:

- **Today** - Current day
- **This Week** - Monday to Sunday
- **This Month** - 1st to last day
- **This Year** - Jan 1 to Dec 31
- **Custom Range** - User picks start/end date

Filters apply to transaction `date` column. Store last filter per report (local storage).

## UX Notes

- Read from local PGlite (no server round-trip)
- Show last updated timestamp
- Export button (future) to CSV
- Drill-down: tap segment → transaction list
- Skeleton loader only on first load (not on filter change)

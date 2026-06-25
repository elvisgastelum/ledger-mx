# Responsibility Groups

Track spending by group or person. Supports shared budgets and dependents.

**Note**: Responsibility groups are different from _category groups_ (`category_groups`). See `category-groups.md` for category classification (Need/Want/Savings).

## Purpose

Responsibility groups let users assign transactions to:

- Themselves (default group)
- A partner or roommate
- A dependent (child, family member)
- A custom group (vacation, project)

Used in reports to show spending per person/group.

## Schema

### responsibility_groups Table

- `id`: UUID
- `user_id`: UUID (owner)
- `name`: text (e.g., "Myself", "Partner", "Kids")
- `color`: hex code for UI
- `created_at`: timestamp

### people Table

- `id`: UUID
- `user_id`: UUID (owner)
- `group_id`: UUID (links to responsibility_groups)
- `name`: text (person name)
- `relationship`: text (e.g., "self", "partner", "child", "dependent")
- `created_at`: timestamp

## User Scoping

All groups and people scoped to `user_id`:

- User only sees their own groups/people
- Electric shapes filter by `user_id`
- No cross-user leakage

## Usage in Reports

### Expenses by Responsibility Group

- Join `transaction_lines` to `categories` to `responsibility_groups`
- Group by `responsibility_groups.name`
- Sum `amount_cents` (absolute value for expenses)

### Expenses by Person

- Join `transaction_lines` to `people`
- Group by `people.name`
- Show per-person spending

## Relation to Categories and Transactions

- Categories have optional `responsibility_group_id`
- Transactions inherit group from category (or override)
- `transaction_lines` store `responsibility_group_id` and `person_id`
- Allows mixing groups in one transaction (split)

## Examples

### Scenario: Couple Budget

Groups:

- "Partner A" (user self)
- "Partner B" (partner)

Categories:

- "Groceries" → "Partner A"
- "Dining Out" → split or assigned to payer

### Scenario: Family Budget

Groups:

- "Dad" (self)
- "Mom" (partner)
- "Kids" (dependents)

Reports show spending per group.

## Default Groups

On user signup, create default group "Myself" with `relationship: "self"`.

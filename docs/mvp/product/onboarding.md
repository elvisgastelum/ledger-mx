# Onboarding Flow

New user setup wizard for LedgerMx, including category group layout selection.

## Purpose

Guide new users through initial setup with a streamlined wizard that:
- Creates default category groups based on selected layout
- Explains the 50/30/20 budgeting method (if selected)
- Minimizes setup friction while providing sensible defaults

## Onboarding Steps

### Step 1: Welcome

- Brief app introduction
- Value proposition (offline-first, double-entry, envelopes)
- "Get Started" call-to-action

### Step 2: Category Layout Selection

User chooses one of two layouts:

#### Option A: Blank Layout
- Description: "Start fresh with a clean slate"
- Creates single "General" category group
- User adds categories and groups manually later
- Ideal for: Users who want full customization

#### Option B: 50/30/20 Layout
- Description: "Popular budgeting method: 50% Needs, 30% Wants, 20% Savings"
- Creates three category groups:
  - **Need** (50%): Essentials like rent, groceries, utilities
  - **Want** (30%): Dining out, entertainment, hobbies
  - **Savings** (20%): Emergency fund, investments, goals
- User can customize group names and percentages later
- Ideal for: Users new to budgeting or wanting proven structure

### Step 3: Income Group (Optional)

- Explain income categories are separate from expense categories
- Option to create "Income" group (kind: `income`, no percentage target)
- Examples: Salary, Freelance, Investments

### Step 4: Summary

- Review created groups
- "Add your first account" or "Take me to dashboard"
- Link to detailed settings for further customization

## Data Created

### Blank Layout
```json
{
  "category_groups": [
    {
      "name": "General",
      "kind": "general",
      "ideal_percentage_basis_points": null,
      "is_system": true
    }
  ]
}
```

### 50/30/20 Layout
```json
{
  "category_groups": [
    {
      "name": "Need",
      "kind": "expense",
      "ideal_percentage_basis_points": 5000,
      "is_system": true
    },
    {
      "name": "Want",
      "kind": "expense",
      "ideal_percentage_basis_points": 3000,
      "is_system": true
    },
    {
      "name": "Savings",
      "kind": "savings",
      "ideal_percentage_basis_points": 2000,
      "is_system": true
    }
  ]
}
```

## Future Enhancements

- Custom layout (user defines own groups and percentages)
- Import from CSV template
- Guided first transaction
- Connect bank account (post-MVP)

## Technical Notes

- Onboarding state persisted in `localStorage` or DB (if user created account)
- Wizard can be re-triggered from settings if user wants to reset layout
- All groups user-scoped via `user_id`
- Validation using Zod schemas (no Joi/class-validator)

## Route

`/onboarding` - Main onboarding wizard route

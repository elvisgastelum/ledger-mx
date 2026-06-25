# Category Groups

Organize categories into logical groups (Need, Want, Savings) for budget planning and reporting.

## Purpose

Category groups provide a way to classify categories for budget planning and analysis:

- **Expense groups**: Need (50%), Want (30%), Savings (20%) for 50/30/20 layout
- **Savings groups**: Classify planned savings allocation categories; do not replace envelopes or ledger allocation mechanics.
- **Income groups**: Separate income categories from expenses conceptually
- **General groups**: Blank layout with single "General" group

Groups support future snapshots, summaries, and projections by preserving historical group assignments.

## Terminology Distinction

**Category Groups** (`category_groups`) are different from **Responsibility Groups** (`responsibility_groups`):

| Aspect   | Category Groups                    | Responsibility Groups              |
| -------- | ---------------------------------- | ---------------------------------- |
| Purpose  | Classify categories by budget type | Assign spending to people/groups   |
| Examples | Need, Want, Savings, Income        | Myself, Partner, Kids              |
| Used in  | Budget planning, spending analysis | Shared budgets, dependent tracking |
| Reports  | Spending by category group         | Spending by person/group           |

## Schema

### category_groups Table

| Column                        | Type        | Notes                                          |
| ----------------------------- | ----------- | ---------------------------------------------- |
| id                            | UUID PK     |                                                |
| user_id                       | UUID FK     | User scoping                                   |
| name                          | text        | "Need", "Want", "Savings", "General", "Income" |
| kind                          | enum        | `income \| expense \| savings \| general`      |
| ideal_percentage_basis_points | integer     | Nullable; 5000 = 50%, 3000 = 30%, 2000 = 20%   |
| sort_order                    | integer     | Display order                                  |
| is_system                     | boolean     | Default groups (not user-deletable)            |
| created_at                    | timestamptz |                                                |
| updated_at                    | timestamptz |                                                |
| deleted_at                    | timestamptz | Nullable; soft delete                          |

**Basis Points Convention**: Percentages stored as basis points (integer) to avoid floats:

- 5000 basis points = 50%
- 3000 basis points = 30%
- 2000 basis points = 20%
- NULL = no target percentage (e.g., Income groups)

### categories Table Changes

Add to existing `categories` table:

| Column            | Type    | Notes                                             |
| ----------------- | ------- | ------------------------------------------------- |
| category_group_id | UUID FK | Required; links to `category_groups`              |
| parent_id         | UUID FK | Optional; hierarchy (kept separate from grouping) |

**Constraint**: Every category MUST have a `category_group_id`. The `parent_id` remains optional for subcategory hierarchy only.

## Default Layouts

### Blank Layout

Creates a single default group:

- Name: "General"
- Kind: `general`
- `ideal_percentage_basis_points`: NULL
- `is_system`: true

### 50/30/20 Layout

Creates three default groups:

| Name    | Kind    | Basis Points | Percentage |
| ------- | ------- | ------------ | ---------- |
| Need    | expense | 5000         | 50%        |
| Want    | expense | 3000         | 30%        |
| Savings | savings | 2000         | 20%        |

**Income Group**: Users may also create an "Income" group (kind: `income`, percentage: NULL) to conceptually separate income categories from expense categories.

## User Scoping

All category groups scoped to `user_id`:

- User only sees their own groups
- Electric shapes filter by `user_id`
- No cross-user leakage

## Soft Delete Rules

- Groups have `deleted_at` timestamp
- **Cannot delete** a group with active categories unless:
  - Categories reassigned to another group first, OR
  - Group soft-deleted with documented reassign rules
- Soft-deleted groups excluded from active UI lists
- Historical transactions preserve group via snapshot denormalization

## Future: Snapshots and Summaries

When creating snapshots/summaries/projections:

- **Denormalize** group `name`, `kind`, `ideal_percentage_basis_points` at snapshot creation time
- Preserves historical meaning if group is later renamed or deleted
- Supports historical budget variance analysis

## Enum Definition

```sql
CREATE TYPE category_group_kind AS ENUM ('income', 'expense', 'savings', 'general');
```

## Indexes

- `user_id` on `category_groups`
- `category_group_id` on `categories`
- `deleted_at` on `category_groups` (for filtering active groups)
- `sort_order` on `category_groups` (for display ordering)

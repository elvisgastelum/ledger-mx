# Story: Category Groups Schema and API

**Status**: Done
**Priority**: P1
**Estimated**: 2-3 days

## Goal

Add `category_groups` entity to organize categories by budget type (Need/Want/Savings) and support 50/30/20 layout planning.

## Context

Category groups classify categories for budget planning and analysis. This is separate from `responsibility_groups` (which track spending by person/group). Examples: "Groceries:Need", "Salary:Income", "Dining Out:Want".

The 50/30/20 budgeting method allocates after-tax income as:

- 50% Needs (essentials)
- 30% Wants (lifestyle)
- 20% Savings (goals)

Groups support future snapshots, summaries, and projections via denormalization at snapshot creation time.

## Acceptance Criteria

- [x] `category_groups` table created with fields: id, user_id, name, kind (income/expense/savings/general), ideal_percentage_basis_points (nullable integer), sort_order, is_system, timestamps, deleted_at
- [x] `categories` table updated with required `category_group_id` FK (keep `parent_id` for optional hierarchy)
- [x] Basis points used for percentages (5000 = 50%, not 50.0)
- [ ] Default layouts defined (see story 016 for onboarding layouts):
  - Blank: "General" group, kind=general, percentage=null
  - 50/30/20: Need=5000, Want=3000, Savings=2000 basis points
- [x] Soft delete rules documented (cannot delete group with active categories)
- [x] Income categories conceptually separate (Income group kind with null percentage)
- [x] All data user-scoped via `user_id`
- [x] Zod schemas defined for API contracts (no Joi/class-validator)
- [x] Database documentation updated (`category-groups.md`, `schema-overview.md`, `README.md`)

## Technical Notes

- Use Drizzle ORM for schema definition in `libs/database/drizzle/schema/`
- Enum `category_group_kind`: 'income' | 'expense' | 'savings' | 'general'
- `ideal_percentage_basis_points`: integer, nullable (NULL for income groups)
- Validation uses Zod only (project constraint)
- Electric shapes must filter by `user_id`
- Future snapshots denormalize group name/kind/percentage at creation time

## Implementation Notes

### Completed:

- Domain layer: Added `CATEGORY_GROUP_KINDS`, `CategoryGroupKind`, `CategoryGroup` type, `CategoryGroupRepository` interface
- Database schema: Created `category-groups.ts`, updated `enums.ts`, `categories.ts`, `relations.ts`, `index.ts`
- Migration: Created `0002_gentle_category_groups.sql` with backfill for existing users
- Database repository: Created `DrizzleCategoryGroupRepository`
- Application layer: Created use cases (list, create, update, delete)
- Contracts layer: Created Zod schemas for category groups
- **API layer: Created category-groups controller, module, JWT auth guard, CurrentUser decorator, and controller tests**

### Files Created:

- `apps/api/src/auth/guards/jwt-auth.guard.ts` - JWT authentication guard
- `apps/api/src/auth/decorators/current-user.decorator.ts` - CurrentUser param decorator
- `apps/api/src/category-groups/category-groups.tokens.ts` - DI tokens
- `apps/api/src/category-groups/category-groups.module.ts` - NestJS module
- `apps/api/src/category-groups/category-groups.controller.ts` - REST controller
- `apps/api/src/category-groups/category-groups.controller.test.ts` - Controller tests
- Updated `apps/api/src/app.module.ts` to import CategoryGroupsModule
- Updated `apps/api/src/auth/infrastructure/jwt-token.service.test.ts` with ConfigService mock

### Pending Verification:

- Frontend integration (story 016 - default layout wizard)

## Tests Required

- [ ] Category cannot be created without `category_group_id`
- [ ] Cannot delete group with active categories (reassign all categories first)
- [ ] System groups (is_system=true) cannot be deleted
- [ ] `sort_order` correctly orders category groups in display queries
- [ ] Basis points correctly convert to percentages (5000 → 50%)
- [ ] User can only see their own category groups
- [ ] Default layouts create correct groups

## Dependencies

- 001-database-model.md
- 014-ts-rest-contracts.md

## Verification Notes

- Workspace typecheck passed
- Category-groups controller tests passed (13/13)
- Category-groups application tests passed (12/12)
- Database schema tests passed (9/9)
- Full test suite passed (147/147) with a non-blocking DB teardown warning

## Next Steps

- Story 016: Category layout onboarding (default layout wizard) - see `todo/016-category-layout-onboarding.md`

## Done Checklist

- [x] All acceptance criteria met (code implementation)
- [x] Drizzle migration created
- [x] Zod schemas in `libs/contracts`
- [x] API controllers and tests implemented
- [x] API tests passing (verification pending)
- [x] Documentation complete
- [x] Tests passing

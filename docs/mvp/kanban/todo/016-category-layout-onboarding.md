# Story: Onboarding Wizard with Category Layout Selection

**Status**: Todo
**Priority**: P1
**Estimated**: 2-3 days

## Goal

Create new-user setup wizard allowing category layout selection (blank or 50/30/20) with automatic category group creation.

## Context

New users need a streamlined onboarding flow to set up their budget structure. The wizard offers two layouts:

1. **Blank**: Single "General" group for full customization
2. **50/30/20**: Three groups (Need/Want/Savings) with ideal percentages for popular budgeting method

The wizard also explains that income categories are separate from expense categories (Income group with null percentage).

This story focuses on the frontend wizard and API endpoint to create default groups. The underlying `category_groups` schema (story 015) must be implemented first.

## Acceptance Criteria

- [ ] `/onboarding` route created with TanStack Router
- [ ] Step 1: Welcome screen with app introduction
- [ ] Step 2: Layout selection (Blank vs 50/30/20 with descriptions)
- [ ] Step 3: Optional Income group creation explanation
- [ ] Step 4: Summary screen showing groups to be created
- [ ] API endpoint `POST /api/v1/onboarding/layout` creates default groups by layout type
- [ ] Blank layout creates "General" group (kind=general, percentage=null)
- [ ] 50/30/20 layout creates Need (5000bp), Want (3000bp), Savings (2000bp) groups
- [ ] Wizard state persisted (localStorage or DB)
- [ ] User can re-trigger wizard from settings
- [ ] Onboarding flow is responsive and accessible
- [ ] Zod validation for layout selection (no Joi/class-validator)

## Technical Notes

- Use TanStack Router for `/onboarding` route
- Wizard state: consider `localStorage` for pre-auth, DB for post-auth users
- API contract in `libs/contracts` using ts-rest and Zod
- Layout type enum: `blank | 50-30-20`
- All groups user-scoped via `user_id`
- Frontend uses `@ts-rest/react-query/v5` to call API

## Tests Required

- [ ] Onboarding route renders correctly
- [ ] Layout selection works (blank and 50/30/20)
- [ ] API creates correct groups for each layout
- [ ] Validation prevents invalid layout types
- [ ] User can navigate wizard steps forward/backward
- [ ] Wizard completion redirects to dashboard or account setup

## Dependencies

- 015-category-groups.md (category groups schema must exist)
- 014-ts-rest-contracts.md (ts-rest contracts)

## Done Checklist

- [ ] All acceptance criteria met
- [ ] API endpoint implemented and tested
- [ ] Frontend wizard implemented and tested
- [ ] Zod schemas in `libs/contracts`
- [ ] Documentation updated (`onboarding.md`, `routes.md`)
- [ ] Responsive and accessible
- [ ] Tests passing

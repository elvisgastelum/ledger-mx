import type {
  UserId,
  OwnershipType,
  CategoryGroupId,
  CategoryId,
} from "@ledger-mx/domain";
import type { CategoryGroupRepository } from "@ledger-mx/domain";
import type { CategoryRepository } from "@ledger-mx/domain";
import type { CategoryGroupKind } from "@ledger-mx/domain";
import type { IdGenerator } from "../../auth/ports/id-generator.port";
import type { Clock } from "../../auth/ports/clock.port";
import {
  categoryGroupIdFromString,
  categoryIdFromString,
} from "@ledger-mx/domain";
import { CategoryGroupLayoutConflictError } from "../onboarding.errors";

/**
 * Layout type for onboarding category group layout selection.
 */
export type LayoutType = "blank" | "50-30-20";

/**
 * Default category group definitions for each layout type.
 */
interface DefaultCategoryGroupDef {
  name: string;
  kind: CategoryGroupKind;
  idealPercentageBasisPoints: number | null;
}

/**
 * Default category definition for seeding.
 */
interface DefaultCategoryDef {
  name: string;
  parentName?: string; // If defined, this is a child category
}

const BLANK_LAYOUT_GROUPS: DefaultCategoryGroupDef[] = [
  {
    name: "General",
    kind: "general",
    idealPercentageBasisPoints: null,
  },
];

const FIFTY_THIRTY_TWENTY_LAYOUT_GROUPS: DefaultCategoryGroupDef[] = [
  {
    name: "Needs",
    kind: "expense",
    idealPercentageBasisPoints: 5000,
  },
  {
    name: "Wants",
    kind: "expense",
    idealPercentageBasisPoints: 3000,
  },
  {
    name: "Savings",
    kind: "savings",
    idealPercentageBasisPoints: 2000,
  },
];

/**
 * Default categories for blank layout (under General group).
 */
const BLANK_LAYOUT_CATEGORIES: Record<string, DefaultCategoryDef[]> = {
  General: [{ name: "Uncategorized" }],
};

/**
 * Default categories for 50-30-20 layout.
 * Organized by category group name.
 */
const FIFTY_THIRTY_TWENTY_LAYOUT_CATEGORIES: Record<
  string,
  DefaultCategoryDef[]
> = {
  Needs: [
    { name: "Housing", parentName: undefined },
    { name: "Rent/Mortgage", parentName: "Housing" },
    { name: "Property Tax", parentName: "Housing" },
    { name: "Home Insurance", parentName: "Housing" },
    { name: "Maintenance", parentName: "Housing" },
    { name: "Transportation", parentName: undefined },
    { name: "Fuel", parentName: "Transportation" },
    { name: "Public Transit", parentName: "Transportation" },
    { name: "Car Payment", parentName: "Transportation" },
    { name: "Insurance", parentName: "Transportation" },
    { name: "Maintenance", parentName: "Transportation" },
    { name: "Food", parentName: undefined },
    { name: "Groceries", parentName: "Food" },
    { name: "Utilities", parentName: undefined },
    { name: "Electricity", parentName: "Utilities" },
    { name: "Water", parentName: "Utilities" },
    { name: "Gas", parentName: "Utilities" },
    { name: "Internet", parentName: "Utilities" },
    { name: "Phone", parentName: "Utilities" },
    { name: "Healthcare", parentName: undefined },
    { name: "Insurance", parentName: "Healthcare" },
    { name: "Prescriptions", parentName: "Healthcare" },
    { name: "Doctor Visits", parentName: "Healthcare" },
    { name: "Debt", parentName: undefined },
    { name: "Credit Card Payments", parentName: "Debt" },
    { name: "Loan Payments", parentName: "Debt" },
  ],
  Wants: [
    { name: "Food", parentName: undefined },
    { name: "Dining Out", parentName: "Food" },
    { name: "Coffee/Snacks", parentName: "Food" },
    { name: "Personal", parentName: undefined },
    { name: "Clothing", parentName: "Personal" },
    { name: "Grooming", parentName: "Personal" },
    { name: "Entertainment", parentName: "Personal" },
  ],
  Savings: [
    { name: "Savings", parentName: undefined },
    { name: "Emergency Fund", parentName: "Savings" },
    { name: "Goals", parentName: "Savings" },
  ],
};

/**
 * Input for applying a default category group layout.
 */
export interface ApplyDefaultCategoryGroupLayoutInput {
  userId: UserId;
  layout: LayoutType;
}

/**
 * Result from applying a default category group layout.
 */
export interface ApplyDefaultCategoryGroupLayoutResult {
  categoryGroups: Array<{
    id: string;
    name: string;
    kind: string;
    idealPercentageBasisPoints: number | null;
    sortOrder: number;
    ownership: OwnershipType;
    createdAt: Date;
    updatedAt: Date;
  }>;
  created: boolean;
}

/**
 * Use case for applying default category group layouts during onboarding.
 *
 * Behavior:
 * - If no active category groups exist for the user, creates the default groups for the requested layout.
 * - If active system groups already exist that match the requested layout exactly, returns them (idempotent, created=false).
 * - If active category groups exist that don't match the requested layout, throws CategoryGroupLayoutConflictError (409).
 * - All operations are scoped by userId.
 * - After creating category groups, also seeds default system categories for the layout.
 */
export class ApplyDefaultCategoryGroupLayoutUseCase {
  constructor(
    private readonly categoryGroupRepository: CategoryGroupRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: ApplyDefaultCategoryGroupLayoutInput,
  ): Promise<ApplyDefaultCategoryGroupLayoutResult> {
    const { userId, layout } = input;

    // Get existing active category groups for the user
    const existingGroups =
      await this.categoryGroupRepository.listByUserId(userId);

    // Get the default group definitions for the requested layout
    const defaultDefs = this.getDefaultGroupDefs(layout);

    // Check for conflicts or idempotency
    const result = await this.checkAndApplyLayout(
      userId,
      existingGroups,
      defaultDefs,
      layout,
    );

    return result;
  }

  private getDefaultGroupDefs(layout: LayoutType): DefaultCategoryGroupDef[] {
    switch (layout) {
      case "blank":
        return BLANK_LAYOUT_GROUPS;
      case "50-30-20":
        return FIFTY_THIRTY_TWENTY_LAYOUT_GROUPS;
    }
  }

  private getDefaultCategories(
    layout: LayoutType,
  ): Record<string, DefaultCategoryDef[]> {
    switch (layout) {
      case "blank":
        return BLANK_LAYOUT_CATEGORIES;
      case "50-30-20":
        return FIFTY_THIRTY_TWENTY_LAYOUT_CATEGORIES;
    }
  }

  private async checkAndApplyLayout(
    userId: UserId,
    existingGroups: Array<{
      id: string;
      userId: string;
      name: string;
      kind: string;
      idealPercentageBasisPoints: number | null;
      sortOrder: number;
      ownership: OwnershipType;
      createdAt: Date;
      updatedAt: Date;
      deletedAt?: Date | null;
    }>,
    defaultDefs: DefaultCategoryGroupDef[],
    layout: LayoutType,
  ): Promise<ApplyDefaultCategoryGroupLayoutResult> {
    // If no existing groups, create all default groups and categories
    if (existingGroups.length === 0) {
      return this.createDefaultGroupsAndCategories(userId, defaultDefs, layout);
    }

    // Check if existing groups match the requested layout exactly
    const matchingGroups = this.findMatchingGroups(existingGroups, defaultDefs);

    // Idempotency check: all default groups exist and match, AND no extra groups
    // Extra active groups (system or non-system) should cause a conflict
    if (
      matchingGroups.length === defaultDefs.length &&
      existingGroups.length === defaultDefs.length
    ) {
      // Check if default categories already exist, if not, create them
      await this.ensureDefaultCategoriesExist(userId, matchingGroups, layout);

      return {
        categoryGroups: matchingGroups.map((group) => ({
          id: group.id,
          name: group.name,
          kind: group.kind,
          idealPercentageBasisPoints: group.idealPercentageBasisPoints,
          sortOrder: group.sortOrder,
          ownership: group.ownership,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
        })),
        created: false,
      };
    }

    // Existing groups don't match the requested layout - conflict
    const existingGroupNames = existingGroups.map((g) => g.name);
    throw new CategoryGroupLayoutConflictError(existingGroupNames);
  }

  private findMatchingGroups(
    existingGroups: Array<{
      id: string;
      name: string;
      kind: string;
      idealPercentageBasisPoints: number | null;
      sortOrder: number;
      ownership: OwnershipType;
      createdAt: Date;
      updatedAt: Date;
    }>,
    defaultDefs: DefaultCategoryGroupDef[],
  ): Array<{
    id: string;
    name: string;
    kind: string;
    idealPercentageBasisPoints: number | null;
    sortOrder: number;
    ownership: OwnershipType;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const matches: Array<{
      id: string;
      name: string;
      kind: string;
      idealPercentageBasisPoints: number | null;
      sortOrder: number;
      ownership: OwnershipType;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    for (const def of defaultDefs) {
      const match = existingGroups.find(
        (group) =>
          group.name === def.name &&
          group.kind === def.kind &&
          group.idealPercentageBasisPoints === def.idealPercentageBasisPoints &&
          group.ownership === "system",
      );

      if (match) {
        matches.push(match);
      }
    }

    return matches;
  }

  private async createDefaultGroupsAndCategories(
    userId: UserId,
    defaultDefs: DefaultCategoryGroupDef[],
    layout: LayoutType,
  ): Promise<ApplyDefaultCategoryGroupLayoutResult> {
    const now = this.clock.now();
    const createdGroups: Array<{
      id: string;
      name: string;
      kind: string;
      idealPercentageBasisPoints: number | null;
      sortOrder: number;
      ownership: OwnershipType;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    // Create category groups
    for (let i = 0; i < defaultDefs.length; i++) {
      const def = defaultDefs[i];
      const groupId = categoryGroupIdFromString(this.idGenerator.uuid());

      const group = {
        id: groupId,
        userId,
        name: def.name,
        kind: def.kind,
        idealPercentageBasisPoints: def.idealPercentageBasisPoints,
        sortOrder: i,
        ownership: "system" as OwnershipType,
        createdAt: now,
        updatedAt: now,
      };

      await this.categoryGroupRepository.save(group);

      createdGroups.push({
        id: group.id,
        name: group.name,
        kind: group.kind,
        idealPercentageBasisPoints: group.idealPercentageBasisPoints,
        sortOrder: group.sortOrder,
        ownership: group.ownership,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      });
    }

    // Create default categories for the created groups
    await this.createDefaultCategories(userId, createdGroups, layout);

    return {
      categoryGroups: createdGroups,
      created: true,
    };
  }

  private async ensureDefaultCategoriesExist(
    userId: UserId,
    groups: Array<{
      id: string;
      name: string;
    }>,
    layout: LayoutType,
  ): Promise<void> {
    const defaultCategories = this.getDefaultCategories(layout);

    for (const group of groups) {
      const groupCategories = defaultCategories[group.name];
      if (!groupCategories) {
        continue;
      }

      // Get existing categories for this group (including newly created ones)
      const existingCategories = await this.categoryRepository.listByUserId(
        userId,
        group.id as CategoryGroupId,
      );

      // Build maps for existing categories by (parentId, name)
      // parentId can be null for top-level categories
      const existingCategoryMap = new Map<
        string,
        { id: CategoryId; name: string; parentId: CategoryId | null }
      >();
      for (const cat of existingCategories) {
        const key = `${cat.parentId ?? "null"}:${cat.name}`;
        existingCategoryMap.set(key, {
          id: cat.id,
          name: cat.name,
          parentId: cat.parentId,
        });
      }

      // Create parent categories first (those without parentName)
      const parentCategories = groupCategories.filter((def) => !def.parentName);
      const childCategories = groupCategories.filter((def) => def.parentName);

      // Track created parents (both existing and newly created)
      const parentMap = new Map<string, CategoryId>();

      // First, check existing parents
      for (const def of parentCategories) {
        const key = `null:${def.name}`;
        const existing = existingCategoryMap.get(key);
        if (existing) {
          parentMap.set(def.name, existing.id);
        }
      }

      // Create missing parent categories
      for (const def of parentCategories) {
        if (!parentMap.has(def.name)) {
          const categoryId = categoryIdFromString(this.idGenerator.uuid());
          const now = this.clock.now();

          await this.categoryRepository.save({
            id: categoryId,
            userId,
            name: def.name,
            parentId: null,
            categoryGroupId: group.id as CategoryGroupId,
            ownership: "system" as OwnershipType,
            createdAt: now,
            updatedAt: now,
          });

          parentMap.set(def.name, categoryId);
        }
      }

      // Create child categories
      for (const def of childCategories) {
        if (!def.parentName) {
          continue;
        }

        // Check if child already exists
        const parentId = parentMap.get(def.parentName);
        if (!parentId) {
          // Parent doesn't exist, skip
          continue;
        }

        const key = `${parentId}:${def.name}`;
        const existing = existingCategoryMap.get(key);
        if (!existing) {
          // Create missing child
          const categoryId = categoryIdFromString(this.idGenerator.uuid());
          const now = this.clock.now();

          await this.categoryRepository.save({
            id: categoryId,
            userId,
            name: def.name,
            parentId,
            categoryGroupId: group.id as CategoryGroupId,
            ownership: "system" as OwnershipType,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }
  }

  private async createDefaultCategories(
    userId: UserId,
    groups: Array<{
      id: string;
      name: string;
    }>,
    layout: LayoutType,
  ): Promise<void> {
    const defaultCategories = this.getDefaultCategories(layout);

    for (const group of groups) {
      const groupCategories = defaultCategories[group.name];
      if (!groupCategories) {
        continue;
      }

      // Create parent categories first
      const parentCategories = groupCategories.filter((def) => !def.parentName);
      const childCategories = groupCategories.filter((def) => def.parentName);

      // Create parent categories
      const createdParents = new Map<string, CategoryId>();
      for (const def of parentCategories) {
        const categoryId = categoryIdFromString(this.idGenerator.uuid());
        const now = this.clock.now();

        await this.categoryRepository.save({
          id: categoryId,
          userId,
          name: def.name,
          parentId: null,
          categoryGroupId: group.id as CategoryGroupId,
          ownership: "system" as OwnershipType,
          createdAt: now,
          updatedAt: now,
        });

        createdParents.set(def.name, categoryId);
      }

      // Create child categories
      for (const def of childCategories) {
        let parentId: CategoryId | null = null;
        if (def.parentName) {
          const parent = createdParents.get(def.parentName);
          if (parent) {
            parentId = parent;
          }
        }

        const categoryId = categoryIdFromString(this.idGenerator.uuid());
        const now = this.clock.now();

        await this.categoryRepository.save({
          id: categoryId,
          userId,
          name: def.name,
          parentId,
          categoryGroupId: group.id as CategoryGroupId,
          ownership: "system" as OwnershipType,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }
}

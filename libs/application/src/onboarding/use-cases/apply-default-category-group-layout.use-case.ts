import type { UserId } from "@ledger-mx/domain";
import type { CategoryGroupRepository } from "@ledger-mx/domain";
import type { CategoryGroupKind } from "@ledger-mx/domain";
import type { IdGenerator } from "../../auth/ports/id-generator.port";
import type { Clock } from "../../auth/ports/clock.port";
import { categoryGroupIdFromString } from "@ledger-mx/domain";
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

const BLANK_LAYOUT_GROUPS: DefaultCategoryGroupDef[] = [
  {
    name: "General",
    kind: "general",
    idealPercentageBasisPoints: null,
  },
];

const FIFTY_THIRTY_TWENTY_LAYOUT_GROUPS: DefaultCategoryGroupDef[] = [
  {
    name: "Need",
    kind: "expense",
    idealPercentageBasisPoints: 5000,
  },
  {
    name: "Want",
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
    isSystem: boolean;
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
 */
export class ApplyDefaultCategoryGroupLayoutUseCase {
  constructor(
    private readonly categoryGroupRepository: CategoryGroupRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: ApplyDefaultCategoryGroupLayoutInput): Promise<ApplyDefaultCategoryGroupLayoutResult> {
    const { userId, layout } = input;

    // Get existing active category groups for the user
    const existingGroups = await this.categoryGroupRepository.listByUserId(userId);

    // Get the default group definitions for the requested layout
    const defaultDefs = this.getDefaultGroupDefs(layout);

    // Check for conflicts or idempotency
    const result = await this.checkAndApplyLayout(userId, existingGroups, defaultDefs);

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

  private async checkAndApplyLayout(
    userId: UserId,
    existingGroups: Array<{
      id: string;
      userId: string;
      name: string;
      kind: string;
      idealPercentageBasisPoints: number | null;
      sortOrder: number;
      isSystem: boolean;
      createdAt: Date;
      updatedAt: Date;
      deletedAt?: Date | null;
    }>,
    defaultDefs: DefaultCategoryGroupDef[],
  ): Promise<ApplyDefaultCategoryGroupLayoutResult> {
    // If no existing groups, create all default groups
    if (existingGroups.length === 0) {
      return this.createDefaultGroups(userId, defaultDefs);
    }

    // Check if existing groups match the requested layout exactly
    const matchingGroups = this.findMatchingGroups(existingGroups, defaultDefs);

    // Idempotency check: all default groups exist and match, AND no extra groups
    // Extra active groups (system or non-system) should cause a conflict
    if (
      matchingGroups.length === defaultDefs.length &&
      existingGroups.length === defaultDefs.length
    ) {
      return {
        categoryGroups: matchingGroups.map((group) => ({
          id: group.id,
          name: group.name,
          kind: group.kind,
          idealPercentageBasisPoints: group.idealPercentageBasisPoints,
          sortOrder: group.sortOrder,
          isSystem: group.isSystem,
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
      isSystem: boolean;
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
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const matches: Array<{
      id: string;
      name: string;
      kind: string;
      idealPercentageBasisPoints: number | null;
      sortOrder: number;
      isSystem: boolean;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    for (const def of defaultDefs) {
      const match = existingGroups.find(
        (group) =>
          group.name === def.name &&
          group.kind === def.kind &&
          group.idealPercentageBasisPoints === def.idealPercentageBasisPoints &&
          group.isSystem === true,
      );

      if (match) {
        matches.push(match);
      }
    }

    return matches;
  }

  private async createDefaultGroups(
    userId: UserId,
    defaultDefs: DefaultCategoryGroupDef[],
  ): Promise<ApplyDefaultCategoryGroupLayoutResult> {
    const now = this.clock.now();
    const createdGroups: Array<{
      id: string;
      name: string;
      kind: string;
      idealPercentageBasisPoints: number | null;
      sortOrder: number;
      isSystem: boolean;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

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
        isSystem: true,
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
        isSystem: group.isSystem,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      });
    }

    return {
      categoryGroups: createdGroups,
      created: true,
    };
  }
}

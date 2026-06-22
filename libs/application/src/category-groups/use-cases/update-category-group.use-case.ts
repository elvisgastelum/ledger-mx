import type { CategoryGroupId } from "@ledger-mx/domain";
import type { CategoryGroupRepository } from "@ledger-mx/domain";
import type { CategoryGroupKind } from "@ledger-mx/domain";
import type { Clock } from "../../auth/ports/clock.port";
import type { UpdateCategoryGroupInput } from "../category-group.types";
import {
  CategoryGroupNotFoundError,
  SystemCategoryGroupModificationError,
} from "../category-group.errors";

export class UpdateCategoryGroupUseCase {
  constructor(
    private readonly categoryGroupRepository: CategoryGroupRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateCategoryGroupInput): Promise<{
    id: CategoryGroupId;
    name: string;
    kind: CategoryGroupKind;
    idealPercentageBasisPoints: number | null;
    sortOrder: number;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    // Find existing group
    const existing = await this.categoryGroupRepository.findById(
      input.userId,
      input.id,
    );

    if (!existing) {
      throw new CategoryGroupNotFoundError(input.id);
    }

    if (existing.isSystem) {
      throw new SystemCategoryGroupModificationError("update");
    }

    const now = this.clock.now();
    const updated = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      kind: input.kind ?? existing.kind,
      idealPercentageBasisPoints:
        input.idealPercentageBasisPoints !== undefined
          ? input.idealPercentageBasisPoints
          : existing.idealPercentageBasisPoints,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      updatedAt: now,
    };

    await this.categoryGroupRepository.save(updated);

    return {
      id: updated.id,
      name: updated.name,
      kind: updated.kind,
      idealPercentageBasisPoints: updated.idealPercentageBasisPoints,
      sortOrder: updated.sortOrder,
      isSystem: updated.isSystem,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}

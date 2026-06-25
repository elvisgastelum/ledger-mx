import type { CategoryGroupId, OwnershipType } from "@ledger-mx/domain";
import type { CategoryGroupRepository } from "@ledger-mx/domain";
import type { CategoryGroupKind } from "@ledger-mx/domain";
import type { IdGenerator } from "../../auth/ports/id-generator.port";
import type { Clock } from "../../auth/ports/clock.port";
import type { CreateCategoryGroupInput } from "../category-group.types";
import { categoryGroupIdFromString } from "@ledger-mx/domain";

export class CreateCategoryGroupUseCase {
  constructor(
    private readonly categoryGroupRepository: CategoryGroupRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateCategoryGroupInput): Promise<{
    id: CategoryGroupId;
    name: string;
    kind: CategoryGroupKind;
    idealPercentageBasisPoints: number | null;
    sortOrder: number;
    ownership: OwnershipType;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const now = this.clock.now();
    const groupId = categoryGroupIdFromString(this.idGenerator.uuid());

    const group = {
      id: groupId,
      userId: input.userId,
      name: input.name.trim(),
      kind: input.kind,
      idealPercentageBasisPoints: input.idealPercentageBasisPoints ?? null,
      sortOrder: input.sortOrder ?? 0,
      ownership: "user" as OwnershipType,
      createdAt: now,
      updatedAt: now,
    };

    await this.categoryGroupRepository.save(group);

    return {
      id: group.id,
      name: group.name,
      kind: group.kind,
      idealPercentageBasisPoints: group.idealPercentageBasisPoints,
      sortOrder: group.sortOrder,
      ownership: group.ownership,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }
}

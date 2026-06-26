import { CategoryGroupBuilder } from "@ledger-mx/domain";
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

    const group = new CategoryGroupBuilder()
      .withId(groupId)
      .withUserId(input.userId)
      .withName(input.name.trim())
      .withKind(input.kind)
      .withIdealPercentageBasisPoints(input.idealPercentageBasisPoints ?? null)
      .withSortOrder(input.sortOrder ?? 0)
      .withOwnership("user" as OwnershipType)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

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

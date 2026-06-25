import type { CategoryGroupRepository, OwnershipType } from "@ledger-mx/domain";
import type { ListCategoryGroupsInput } from "../category-group.types";

export class ListCategoryGroupsUseCase {
  constructor(
    private readonly categoryGroupRepository: CategoryGroupRepository,
  ) {}

  async execute(input: ListCategoryGroupsInput): Promise<{
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
  }> {
    const groups = await this.categoryGroupRepository.listByUserId(
      input.userId,
    );

    return {
      categoryGroups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        kind: group.kind,
        idealPercentageBasisPoints: group.idealPercentageBasisPoints,
        sortOrder: group.sortOrder,
        ownership: group.ownership,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      })),
    };
  }
}

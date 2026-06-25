// UserId and CategoryGroupId removed - unused
import type { CategoryGroupRepository } from "@ledger-mx/domain";
import type { Clock } from "../../auth/ports/clock.port";
import type { DeleteCategoryGroupInput } from "../category-group.types";
import {
  CategoryGroupNotFoundError,
  SystemCategoryGroupModificationError,
  CategoryGroupHasActiveCategoriesError,
} from "../category-group.errors";

export class DeleteCategoryGroupUseCase {
  constructor(
    private readonly categoryGroupRepository: CategoryGroupRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: DeleteCategoryGroupInput): Promise<void> {
    // Find existing group
    const existing = await this.categoryGroupRepository.findById(
      input.userId,
      input.id,
    );

    if (!existing) {
      throw new CategoryGroupNotFoundError(input.id);
    }

    // Cannot delete system groups
    if (existing.ownership === "system") {
      throw new SystemCategoryGroupModificationError("delete");
    }

    // Check if group has active categories
    const hasActiveCategories =
      await this.categoryGroupRepository.hasActiveCategories(
        input.userId,
        input.id,
      );

    if (hasActiveCategories) {
      throw new CategoryGroupHasActiveCategoriesError();
    }

    // Soft delete
    const now = this.clock.now();
    await this.categoryGroupRepository.softDelete(input.userId, input.id, now);
  }
}

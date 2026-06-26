import type { CategoryRepository } from "@ledger-mx/domain";
import type { Clock } from "../../auth/ports/clock.port";
import type { ArchiveCategoryInput } from "../category.types";
import { CategoryNotFoundError } from "../category.errors";
import { SystemCategoryModificationError } from "../category.errors";
import { CategoryInUseError } from "../category.errors";
import { CategoryHasActiveChildrenError } from "../category.errors";

export class ArchiveCategoryUseCase {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ArchiveCategoryInput): Promise<void> {
    const now = this.clock.now();

    // Find existing category
    const existingCategory = await this.categoryRepository.findById(
      input.userId,
      input.id,
    );

    if (!existingCategory) {
      throw new CategoryNotFoundError(input.id as string);
    }

    // Prevent archiving system categories
    if (existingCategory.ownership === "system") {
      throw new SystemCategoryModificationError("archive");
    }

    // Check if category has active children
    const hasChildren = await this.categoryRepository.hasActiveChildren(
      input.userId,
      input.id,
    );

    if (hasChildren) {
      throw new CategoryHasActiveChildrenError();
    }

    // Check if category has transaction lines
    const hasTransactions = await this.categoryRepository.hasTransactionLines(
      input.userId,
      input.id,
    );

    if (hasTransactions) {
      throw new CategoryInUseError();
    }

    // Soft delete
    await this.categoryRepository.softDelete(input.userId, input.id, now);
  }
}

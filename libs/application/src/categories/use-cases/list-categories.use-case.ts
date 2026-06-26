import type { CategoryId } from "@ledger-mx/domain";
import type { CategoryRepository } from "@ledger-mx/domain";
import type { CategoryWithUsageOutput } from "../category.types";
import type { ListCategoriesInput } from "../category.types";

export class ListCategoriesUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: ListCategoriesInput): Promise<{
    categories: CategoryWithUsageOutput[];
  }> {
    // Get categories
    const categories = await this.categoryRepository.listByUserId(
      input.userId,
      input.categoryGroupId,
    );

    // Get usage counts
    const categoryIds = categories.map((cat) => cat.id);
    const usageCounts =
      categoryIds.length > 0
        ? await this.categoryRepository.countTransactionLines(
            input.userId,
            categoryIds,
          )
        : new Map<CategoryId, number>();

    // Build output with usage counts
    const categoriesWithUsage = categories.map((category) => ({
      id: category.id,
      name: category.name,
      parentId: category.parentId,
      categoryGroupId: category.categoryGroupId,
      ownership: category.ownership,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      usageCount: usageCounts.get(category.id) ?? 0,
    }));

    return { categories: categoriesWithUsage };
  }
}

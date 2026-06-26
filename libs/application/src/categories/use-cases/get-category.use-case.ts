import type { CategoryRepository } from "@ledger-mx/domain";
import type { CategoryWithUsageOutput } from "../category.types";
import type { GetCategoryInput } from "../category.types";
import { CategoryNotFoundError } from "../category.errors";

export class GetCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: GetCategoryInput): Promise<{
    category: CategoryWithUsageOutput;
  }> {
    const category = await this.categoryRepository.findById(
      input.userId,
      input.id,
    );

    if (!category) {
      throw new CategoryNotFoundError(input.id as string);
    }

    // Get usage count
    const usageCounts = await this.categoryRepository.countTransactionLines(
      input.userId,
      [input.id],
    );

    const categoryWithUsage: CategoryWithUsageOutput = {
      id: category.id,
      name: category.name,
      parentId: category.parentId,
      categoryGroupId: category.categoryGroupId,
      ownership: category.ownership,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      usageCount: usageCounts.get(input.id) ?? 0,
    };

    return { category: categoryWithUsage };
  }
}

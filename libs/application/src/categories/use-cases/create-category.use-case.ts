import type { CategoryId, CategoryGroupId } from "@ledger-mx/domain";
import type { CategoryRepository } from "@ledger-mx/domain";
import type { CategoryGroupRepository } from "@ledger-mx/domain";
import type { Category } from "@ledger-mx/domain";
import type { IdGenerator } from "../../auth/ports/id-generator.port";
import type { Clock } from "../../auth/ports/clock.port";
import type { CreateCategoryInput } from "../category.types";
import { categoryIdFromString } from "@ledger-mx/domain";
import { CategoryGroupNotFoundError } from "../../category-groups/category-group.errors";
import { InvalidParentCategoryError } from "../category.errors";
import { DuplicateCategoryNameError } from "../category.errors";

export class CreateCategoryUseCase {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly categoryGroupRepository: CategoryGroupRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateCategoryInput): Promise<{
    id: CategoryId;
    name: string;
    parentId: CategoryId | null;
    categoryGroupId: CategoryGroupId;
    ownership: "user" | "system";
    createdAt: Date;
    updatedAt: Date;
  }> {
    const now = this.clock.now();
    const categoryId = categoryIdFromString(this.idGenerator.uuid());

    // Validate category name
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error("Category name cannot be empty");
    }
    if (trimmedName.length > 100) {
      throw new Error("Category name cannot exceed 100 characters");
    }

    // Validate category group exists and belongs to user
    const categoryGroup = await this.categoryGroupRepository.findById(
      input.userId,
      input.categoryGroupId,
    );

    if (!categoryGroup) {
      throw new CategoryGroupNotFoundError(input.categoryGroupId as string);
    }

    // Validate parent category if provided
    if (input.parentId) {
      const parentCategory = await this.categoryRepository.findById(
        input.userId,
        input.parentId,
      );

      if (!parentCategory) {
        throw new InvalidParentCategoryError(
          `Parent category not found: ${input.parentId}`,
        );
      }

      if (parentCategory.deletedAt) {
        throw new InvalidParentCategoryError(
          `Parent category is archived: ${input.parentId}`,
        );
      }

      if (parentCategory.categoryGroupId !== input.categoryGroupId) {
        throw new InvalidParentCategoryError(
          "Parent category must be in the same category group",
        );
      }
    }

    // Check for duplicate active category with same name (case-insensitive), group, and parent
    const existingCategories = await this.categoryRepository.listByUserId(
      input.userId,
    );
    const duplicateExists = existingCategories.some(
      (cat) =>
        cat.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        cat.categoryGroupId === input.categoryGroupId &&
        cat.parentId === (input.parentId ?? null) &&
        !cat.deletedAt,
    );

    if (duplicateExists) {
      throw new DuplicateCategoryNameError(trimmedName);
    }

    const category: Category = {
      id: categoryId,
      userId: input.userId,
      name: input.name.trim(),
      parentId: input.parentId ?? null,
      categoryGroupId: input.categoryGroupId,
      ownership: "user",
      createdAt: now,
      updatedAt: now,
    };

    await this.categoryRepository.save(category);

    return {
      id: category.id,
      name: category.name,
      parentId: category.parentId,
      categoryGroupId: category.categoryGroupId,
      ownership: category.ownership,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}

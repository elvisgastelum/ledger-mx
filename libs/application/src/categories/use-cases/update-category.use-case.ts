import type { CategoryId, CategoryGroupId } from "@ledger-mx/domain";
import type { CategoryRepository } from "@ledger-mx/domain";
import type { CategoryGroupRepository } from "@ledger-mx/domain";
import type { Category } from "@ledger-mx/domain";
import type { Clock } from "../../auth/ports/clock.port";
import type { UpdateCategoryInput } from "../category.types";
import { CategoryNotFoundError } from "../category.errors";
import { SystemCategoryModificationError } from "../category.errors";
import { InvalidParentCategoryError } from "../category.errors";
import { DuplicateCategoryNameError } from "../category.errors";

export class UpdateCategoryUseCase {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly categoryGroupRepository: CategoryGroupRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateCategoryInput): Promise<{
    id: CategoryId;
    name: string;
    parentId: CategoryId | null;
    categoryGroupId: CategoryGroupId;
    ownership: "user" | "system";
    createdAt: Date;
    updatedAt: Date;
  }> {
    const now = this.clock.now();

    // Validate category name if provided
    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        throw new Error("Category name cannot be empty");
      }
      if (trimmedName.length > 100) {
        throw new Error("Category name cannot exceed 100 characters");
      }
    }

    // Find existing category
    const existingCategory = await this.categoryRepository.findById(
      input.userId,
      input.id,
    );

    if (!existingCategory) {
      throw new CategoryNotFoundError(input.id as string);
    }

    // Prevent modification of system categories
    if (existingCategory.ownership === "system") {
      throw new SystemCategoryModificationError("update");
    }

    // Check for duplicate active category with same name (case-insensitive), group, and parent
    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      // Skip check if name hasn't changed (case-insensitive comparison)
      if (
        trimmedName.toLowerCase() !== existingCategory.name.trim().toLowerCase()
      ) {
        const existingCategories = await this.categoryRepository.listByUserId(
          input.userId,
        );
        const duplicateExists = existingCategories.some(
          (cat) =>
            cat.id !== existingCategory.id && // Exclude current category
            cat.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
            cat.categoryGroupId === existingCategory.categoryGroupId &&
            cat.parentId ===
              (input.parentId !== undefined
                ? input.parentId
                : existingCategory.parentId) &&
            !cat.deletedAt,
        );

        if (duplicateExists) {
          throw new DuplicateCategoryNameError(trimmedName);
        }
      }
    }

    // Validate parent category if provided
    if (input.parentId !== undefined) {
      const newParentId = input.parentId;

      if (newParentId) {
        // Cannot set parent to self
        if (newParentId === input.id) {
          throw new InvalidParentCategoryError(
            "Category cannot be its own parent",
          );
        }

        const parentCategory = await this.categoryRepository.findById(
          input.userId,
          newParentId,
        );

        if (!parentCategory) {
          throw new InvalidParentCategoryError(
            `Parent category not found: ${newParentId}`,
          );
        }

        if (parentCategory.deletedAt) {
          throw new InvalidParentCategoryError(
            `Parent category is archived: ${newParentId}`,
          );
        }

        if (
          parentCategory.categoryGroupId !== existingCategory.categoryGroupId
        ) {
          throw new InvalidParentCategoryError(
            "Parent category must be in the same category group",
          );
        }

        // Check for cycles (simplified - would need full traversal for complete check)
        let currentParent = parentCategory.parentId;
        while (currentParent) {
          if (currentParent === input.id) {
            throw new InvalidParentCategoryError(
              "Cyclic parent relationship detected",
            );
          }
          const parent = await this.categoryRepository.findById(
            input.userId,
            currentParent,
          );
          currentParent = parent?.parentId ?? null;
        }
      }
    }

    // Update category
    const updatedCategory: Category = {
      ...existingCategory,
      name: input.name?.trim() ?? existingCategory.name,
      parentId:
        input.parentId !== undefined
          ? input.parentId
          : existingCategory.parentId,
      updatedAt: now,
    };

    await this.categoryRepository.save(updatedCategory);

    return {
      id: updatedCategory.id,
      name: updatedCategory.name,
      parentId: updatedCategory.parentId,
      categoryGroupId: updatedCategory.categoryGroupId,
      ownership: updatedCategory.ownership,
      createdAt: updatedCategory.createdAt,
      updatedAt: updatedCategory.updatedAt,
    };
  }
}

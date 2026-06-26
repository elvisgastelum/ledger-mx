import type { UserId, CategoryId, CategoryGroupId } from "@ledger-mx/domain";
import type { OwnershipType } from "@ledger-mx/domain";

export interface CreateCategoryInput {
  userId: UserId;
  name: string;
  categoryGroupId: CategoryGroupId;
  parentId?: CategoryId | null;
}

export interface UpdateCategoryInput {
  userId: UserId;
  id: CategoryId;
  name?: string;
  parentId?: CategoryId | null;
}

export interface ListCategoriesInput {
  userId: UserId;
  categoryGroupId?: CategoryGroupId;
}

export interface GetCategoryInput {
  userId: UserId;
  id: CategoryId;
}

export interface ArchiveCategoryInput {
  userId: UserId;
  id: CategoryId;
}

export interface CategoryOutput {
  id: CategoryId;
  name: string;
  parentId: CategoryId | null;
  categoryGroupId: CategoryGroupId;
  ownership: OwnershipType;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryWithUsageOutput extends CategoryOutput {
  usageCount: number;
}

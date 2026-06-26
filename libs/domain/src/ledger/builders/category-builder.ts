import type { Category } from "../category";
import type { CategoryId, UserId, CategoryGroupId } from "../../value-objects/uuid";
import type { OwnershipType } from "../../index";

export class CategoryBuilder {
  private _id?: CategoryId;
  private _userId?: UserId;
  private _name?: string;
  private _parentId?: CategoryId | null;
  private _parentIdSet = false;
  private _categoryGroupId?: CategoryGroupId;
  private _createdAt?: Date;
  private _updatedAt?: Date;
  private _deletedAt?: Date | null;
  private _ownership?: OwnershipType;

  withId(id: CategoryId): this {
    this._id = id;
    return this;
  }

  withUserId(userId: UserId): this {
    this._userId = userId;
    return this;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withParentId(parentId: CategoryId | null): this {
    this._parentId = parentId;
    this._parentIdSet = true;
    return this;
  }

  withCategoryGroupId(categoryGroupId: CategoryGroupId): this {
    this._categoryGroupId = categoryGroupId;
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this._createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this._updatedAt = updatedAt;
    return this;
  }

  withDeletedAt(deletedAt: Date | null): this {
    this._deletedAt = deletedAt;
    return this;
  }

  withOwnership(ownership: OwnershipType): this {
    this._ownership = ownership;
    return this;
  }

  build(): Category {
    if (!this._id) {
      throw new Error("CategoryBuilder: id is required");
    }
    if (!this._userId) {
      throw new Error("CategoryBuilder: userId is required");
    }
    if (this._name === undefined) {
      throw new Error("CategoryBuilder: name is required");
    }
    if (!this._parentIdSet) {
      throw new Error("CategoryBuilder: parentId is required");
    }
    if (!this._categoryGroupId) {
      throw new Error("CategoryBuilder: categoryGroupId is required");
    }
    if (!this._createdAt) {
      throw new Error("CategoryBuilder: createdAt is required");
    }
    if (!this._updatedAt) {
      throw new Error("CategoryBuilder: updatedAt is required");
    }
    if (!this._ownership) {
      throw new Error("CategoryBuilder: ownership is required");
    }

    // At this point, parentId is guaranteed to be set (could be null)
    const parentId: CategoryId | null = this._parentId!;

    const category: Category = {
      id: this._id,
      userId: this._userId,
      name: this._name,
      parentId,
      categoryGroupId: this._categoryGroupId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      ownership: this._ownership,
    };

    if (this._deletedAt !== undefined) {
      category.deletedAt = this._deletedAt;
    }

    return category;
  }
}

import type { CategoryGroup } from "../category-group";
import type { CategoryGroupId, UserId } from "../../value-objects/uuid";
import type { CategoryGroupKind, OwnershipType } from "../../index";

export class CategoryGroupBuilder {
  private _id?: CategoryGroupId;
  private _userId?: UserId;
  private _name?: string;
  private _kind?: CategoryGroupKind;
  private _idealPercentageBasisPoints?: number | null;
  private _idealPercentageBasisPointsSet = false;
  private _sortOrder?: number;
  private _sortOrderSet = false;
  private _createdAt?: Date;
  private _updatedAt?: Date;
  private _deletedAt?: Date | null;
  private _ownership?: OwnershipType;

  withId(id: CategoryGroupId): this {
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

  withKind(kind: CategoryGroupKind): this {
    this._kind = kind;
    return this;
  }

  withIdealPercentageBasisPoints(idealPercentageBasisPoints: number | null): this {
    this._idealPercentageBasisPoints = idealPercentageBasisPoints;
    this._idealPercentageBasisPointsSet = true;
    return this;
  }

  withSortOrder(sortOrder: number): this {
    this._sortOrder = sortOrder;
    this._sortOrderSet = true;
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

  build(): CategoryGroup {
    if (!this._id) {
      throw new Error("CategoryGroupBuilder: id is required");
    }
    if (!this._userId) {
      throw new Error("CategoryGroupBuilder: userId is required");
    }
    if (this._name === undefined) {
      throw new Error("CategoryGroupBuilder: name is required");
    }
    if (!this._kind) {
      throw new Error("CategoryGroupBuilder: kind is required");
    }
    if (!this._idealPercentageBasisPointsSet) {
      throw new Error("CategoryGroupBuilder: idealPercentageBasisPoints is required");
    }
    if (!this._sortOrderSet) {
      throw new Error("CategoryGroupBuilder: sortOrder is required");
    }
    if (!this._createdAt) {
      throw new Error("CategoryGroupBuilder: createdAt is required");
    }
    if (!this._updatedAt) {
      throw new Error("CategoryGroupBuilder: updatedAt is required");
    }
    if (!this._ownership) {
      throw new Error("CategoryGroupBuilder: ownership is required");
    }

    // At this point, all fields are guaranteed to be set
    const idealPercentageBasisPoints: number | null = this._idealPercentageBasisPoints!;
    const sortOrder: number = this._sortOrder!;

    const categoryGroup: CategoryGroup = {
      id: this._id,
      userId: this._userId,
      name: this._name,
      kind: this._kind,
      idealPercentageBasisPoints,
      sortOrder,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      ownership: this._ownership,
    };

    if (this._deletedAt !== undefined) {
      categoryGroup.deletedAt = this._deletedAt;
    }

    return categoryGroup;
  }
}

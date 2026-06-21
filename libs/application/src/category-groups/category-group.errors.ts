/**
 * Base error class for category group application errors.
 */
export abstract class CategoryGroupApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when a category group is not found.
 */
export class CategoryGroupNotFoundError extends CategoryGroupApplicationError {
  constructor(id: string) {
    super(`Category group not found: ${id}`);
  }
}

/**
 * Thrown when attempting to modify a system category group.
 */
export class SystemCategoryGroupModificationError extends CategoryGroupApplicationError {
  constructor(operation: string) {
    super(`Cannot ${operation} system category group`);
  }
}

/**
 * Thrown when attempting to delete a category group that has active categories.
 */
export class CategoryGroupHasActiveCategoriesError extends CategoryGroupApplicationError {
  constructor() {
    super(
      "Cannot delete category group with active categories. Reassign or delete all categories first.",
    );
  }
}

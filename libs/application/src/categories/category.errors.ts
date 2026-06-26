/**
 * Base error class for category application errors.
 */
export abstract class CategoryApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when a category is not found.
 */
export class CategoryNotFoundError extends CategoryApplicationError {
  constructor(id: string) {
    super(`Category not found: ${id}`);
  }
}

/**
 * Thrown when attempting to modify a system category.
 */
export class SystemCategoryModificationError extends CategoryApplicationError {
  constructor(operation: string) {
    super(`Cannot ${operation} system category`);
  }
}

/**
 * Thrown when a parent category is not found, doesn't belong to the user,
 * is not active, or is not in the same category group.
 */
export class InvalidParentCategoryError extends CategoryApplicationError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when attempting to archive a category that has transaction lines.
 */
export class CategoryInUseError extends CategoryApplicationError {
  constructor() {
    super(
      "Cannot archive category that has transactions. Reassign or delete all transactions first.",
    );
  }
}

/**
 * Thrown when attempting to archive a category that has active children.
 */
export class CategoryHasActiveChildrenError extends CategoryApplicationError {
  constructor() {
    super("Cannot archive category with active children");
  }
}

/**
 * Thrown when attempting to create a category with a duplicate name
 * under the same parent and category group.
 */
export class DuplicateCategoryNameError extends CategoryApplicationError {
  constructor(name: string) {
    super(`Category with name "${name}" already exists in this group/parent`);
  }
}

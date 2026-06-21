import type { UserId, CategoryGroupId } from "@ledger-mx/domain";
import type { CategoryGroupKind } from "@ledger-mx/domain";

export interface ListCategoryGroupsInput {
  userId: UserId;
}

export interface CreateCategoryGroupInput {
  userId: UserId;
  name: string;
  kind: CategoryGroupKind;
  idealPercentageBasisPoints?: number | null;
  sortOrder?: number;
}

export interface UpdateCategoryGroupInput {
  userId: UserId;
  id: CategoryGroupId;
  name?: string;
  kind?: CategoryGroupKind;
  idealPercentageBasisPoints?: number | null;
  sortOrder?: number;
}

export interface DeleteCategoryGroupInput {
  userId: UserId;
  id: CategoryGroupId;
}

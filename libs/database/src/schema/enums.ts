import { pgEnum } from "drizzle-orm/pg-core";
import {
  ACCOUNT_TYPES,
  TRANSACTION_TYPES,
  TRANSACTION_LINE_TARGET_TYPES,
  CATEGORY_GROUP_KINDS,
  ACCOUNT_STATUSES,
  OWNERSHIP_TYPES,
} from "@ledger-mx/domain";

export const accountTypeEnum = pgEnum("account_type", [...ACCOUNT_TYPES]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  ...TRANSACTION_TYPES,
]);
export const transactionLineTargetTypeEnum = pgEnum(
  "transaction_line_target_type",
  [...TRANSACTION_LINE_TARGET_TYPES],
);
export const categoryGroupKindEnum = pgEnum("category_group_kind", [
  ...CATEGORY_GROUP_KINDS,
]);
export const accountStatusEnum = pgEnum("account_status", [
  ...ACCOUNT_STATUSES,
]);
export const ownershipTypeEnum = pgEnum("ownership_type", [...OWNERSHIP_TYPES]);

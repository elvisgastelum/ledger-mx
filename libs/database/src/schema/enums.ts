import { pgEnum } from "drizzle-orm/pg-core";
import {
  ACCOUNT_TYPES,
  TRANSACTION_TYPES,
  TRANSACTION_LINE_TARGET_TYPES,
} from "@ledger-mx/domain";

export const accountTypeEnum = pgEnum("account_type", [...ACCOUNT_TYPES]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  ...TRANSACTION_TYPES,
]);
export const transactionLineTargetTypeEnum = pgEnum(
  "transaction_line_target_type",
  [...TRANSACTION_LINE_TARGET_TYPES],
);

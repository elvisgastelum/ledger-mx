import { expect, test } from "vitest";
import { PACKAGE_NAME } from "./index";

test("domain package exports PACKAGE_NAME", () => {
  expect(PACKAGE_NAME).toBe("@ledger-mx/domain");
});

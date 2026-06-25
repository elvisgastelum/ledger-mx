import { describe, it, beforeEach, expect, vi } from "vitest";
import type { BalanceRepository, AccountId, UserId } from "@ledger-mx/domain";
import { GetAccountBalancesUseCase } from "./get-account-balances.use-case";

describe("GetAccountBalancesUseCase", () => {
  let mockBalanceRepository: BalanceRepository;
  let useCase: GetAccountBalancesUseCase;

  beforeEach(() => {
    mockBalanceRepository = {
      getAccountBalance: vi.fn(),
      getAccountBalances: vi.fn(),
      getBalancesByAccountType: vi.fn(),
      getLiabilityBalances: vi.fn(),
    } as unknown as BalanceRepository;

    useCase = new GetAccountBalancesUseCase(mockBalanceRepository);
  });

  it("should return balances for all accounts when no accountIds provided", async () => {
    const userId = "223e4567-e89b-12d3-a456-426614174000" as UserId;

    vi.mocked(mockBalanceRepository.getAccountBalances).mockResolvedValue([
      {
        accountId: "111e4567-e89b-12d3-a456-426614174000" as AccountId,
        balanceCents: 5000,
      },
      {
        accountId: "222e4567-e89b-12d3-a456-426614174000" as AccountId,
        balanceCents: -3000,
      },
    ]);

    const result = await useCase.execute({
      userId,
    });

    expect(result).toHaveLength(2);
    expect(result[0].balanceCents).toBe(5000);
    expect(result[1].balanceCents).toBe(-3000);
  });

  it("should return 0 for accounts with no balances when specific accountIds provided", async () => {
    const userId = "223e4567-e89b-12d3-a456-426614174000" as UserId;
    const accountId1 = "111e4567-e89b-12d3-a456-426614174000" as AccountId;
    const accountId2 = "222e4567-e89b-12d3-a456-426614174000" as AccountId;

    vi.mocked(mockBalanceRepository.getAccountBalances).mockResolvedValue([
      { accountId: accountId1, balanceCents: 5000 },
      // accountId2 has no balance, so it won't be in the result
    ]);

    const result = await useCase.execute({
      userId,
      accountIds: [accountId1, accountId2],
    });

    expect(result).toHaveLength(2);
    expect(result[0].balanceCents).toBe(5000);
    expect(result[1].balanceCents).toBe(0); // Default to 0
  });
});

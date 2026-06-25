import { describe, it, beforeEach, expect, vi } from "vitest";
import type { BalanceRepository, AccountId, UserId } from "@ledger-mx/domain";
import { GetAccountBalanceUseCase } from "./get-account-balance.use-case";
import { AccountBalanceNotFoundError } from "../balance.errors";

describe("GetAccountBalanceUseCase", () => {
  let mockBalanceRepository: BalanceRepository;
  let useCase: GetAccountBalanceUseCase;

  beforeEach(() => {
    mockBalanceRepository = {
      getAccountBalance: vi.fn(),
      getAccountBalances: vi.fn(),
      getBalancesByAccountType: vi.fn(),
      getLiabilityBalances: vi.fn(),
    } as unknown as BalanceRepository;

    useCase = new GetAccountBalanceUseCase(mockBalanceRepository);
  });

  it("should return account balance when account exists", async () => {
    const accountId = "123e4567-e89b-12d3-a456-426614174000" as AccountId;
    const userId = "223e4567-e89b-12d3-a456-426614174000" as UserId;

    vi.mocked(mockBalanceRepository.getAccountBalance).mockResolvedValue({
      accountId,
      balanceCents: 5000,
    });

    const result = await useCase.execute({
      userId,
      accountId,
    });

    expect(result.accountId).toBe(accountId);
    expect(result.balanceCents).toBe(5000);
  });

  it("should throw AccountBalanceNotFoundError when account not found", async () => {
    const accountId = "123e4567-e89b-12d3-a456-426614174000" as AccountId;
    const userId = "223e4567-e89b-12d3-a456-426614174000" as UserId;

    vi.mocked(mockBalanceRepository.getAccountBalance).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId,
        accountId,
      }),
    ).rejects.toThrow(AccountBalanceNotFoundError);
  });
});

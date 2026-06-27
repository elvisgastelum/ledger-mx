import { describe, it, expect, beforeEach } from "vitest";
import { ApplyDefaultEnvelopesUseCase } from "./apply-default-envelopes.use-case";
import type { EnvelopeRepository } from "@ledger-mx/domain";
import type { IdGenerator, Clock } from "@ledger-mx/application";
import { EnvelopeBuilder } from "@ledger-mx/domain";
import { envelopeIdFromString, userIdFromString } from "@ledger-mx/domain";
import { EnvelopeOnboardingConflictError } from "../envelope.errors";

// In-memory fake repository
class FakeEnvelopeRepository implements EnvelopeRepository {
  private envelopes: Map<string, import("@ledger-mx/domain").Envelope> = new Map();

  async save(envelope: import("@ledger-mx/domain").Envelope): Promise<void> {
    this.envelopes.set(`${envelope.userId}:${envelope.id}`, envelope);
  }

  async findById(
    userId: import("@ledger-mx/domain").UserId,
    id: import("@ledger-mx/domain").EnvelopeId,
  ): Promise<import("@ledger-mx/domain").Envelope | null> {
    return this.envelopes.get(`${userId}:${id}`) ?? null;
  }

  async listByUserId(
    userId: import("@ledger-mx/domain").UserId,
  ): Promise<import("@ledger-mx/domain").Envelope[]> {
    return Array.from(this.envelopes.values()).filter(
      (e) => e.userId === userId && !e.deletedAt,
    );
  }

  async archive(
    userId: import("@ledger-mx/domain").UserId,
    id: import("@ledger-mx/domain").EnvelopeId,
    deletedAt: Date,
  ): Promise<void> {
    const key = `${userId}:${id}`;
    const envelope = this.envelopes.get(key);
    if (envelope) {
      (envelope as { deletedAt: Date | null }).deletedAt = deletedAt;
    }
  }

  async getBalance(
    userId: import("@ledger-mx/domain").UserId,
    id: import("@ledger-mx/domain").EnvelopeId,
  ): Promise<number> {
    return 0;
  }

  async getBalances(
    userId: import("@ledger-mx/domain").UserId,
    ids: import("@ledger-mx/domain").EnvelopeId[],
  ): Promise<Map<string, number>> {
    return new Map();
  }

  async findDefaultEnvelopes(
    userId: import("@ledger-mx/domain").UserId,
  ): Promise<import("@ledger-mx/domain").Envelope[]> {
    return [];
  }

  reset() {
    this.envelopes.clear();
  }
}

class FakeIdGenerator implements IdGenerator {
  private count = 0;

  uuid(): string {
    return `test-id-${++this.count}`;
  }
}

class FakeClock implements Clock {
  private fixedNow = new Date("2024-01-15T00:00:00.000Z");

  now(): Date {
    return this.fixedNow;
  }

  setNow(date: Date): void {
    this.fixedNow = date;
  }
}

describe("ApplyDefaultEnvelopesUseCase", () => {
  let repository: FakeEnvelopeRepository;
  let idGenerator: FakeIdGenerator;
  let clock: FakeClock;
  let useCase: ApplyDefaultEnvelopesUseCase;

  beforeEach(() => {
    repository = new FakeEnvelopeRepository();
    idGenerator = new FakeIdGenerator();
    clock = new FakeClock();
    useCase = new ApplyDefaultEnvelopesUseCase(
      repository,
      idGenerator,
      clock,
    );
  });

  it("creates default envelopes when user has no envelopes", async () => {
    const userId = userIdFromString("9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a");

    const result = await useCase.execute({
      userId,
    });

    expect(result.created).toBe(true);
    expect(result.envelopes).toHaveLength(6); // 6 default envelopes
    expect(result.envelopes[0].name).toBe("Groceries");
    expect(result.envelopes[1].name).toBe("Dining Out");
    expect(result.envelopes[5].name).toBe("Goals");
  });

  it("is idempotent - returns existing defaults on second call", async () => {
    const userId = userIdFromString("9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a");

    // First call - creates defaults
    const result1 = await useCase.execute({ userId });
    expect(result1.created).toBe(true);
    expect(result1.envelopes).toHaveLength(6);

    // Second call - should be idempotent
    const result2 = await useCase.execute({ userId });
    expect(result2.created).toBe(false);
    expect(result2.envelopes).toHaveLength(6);
  });

  it("throws conflict error when user has non-default envelopes", async () => {
    const userId = userIdFromString("9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a");

    // Create a non-default envelope
    const existingEnvelope = new EnvelopeBuilder()
      .withId(envelopeIdFromString("123e4567-e89b-42d3-a456-426614174000"))
      .withUserId(userId)
      .withName("Custom Envelope")
      .withTargetAmountCents(null)
      .withIsProtected(true)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withDeletedAt(null)
      .build();

    await repository.save(existingEnvelope);

    // Should throw conflict error
    await expect(useCase.execute({ userId }))
      .rejects.toThrow(EnvelopeOnboardingConflictError);
  });

  it("preserves isProtected flag from defaults", async () => {
    const userId = userIdFromString("9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a");

    const result = await useCase.execute({ userId });

    // Most envelopes should be protected
    expect(result.envelopes[0].isProtected).toBe(true); // Groceries
    expect(result.envelopes[5].isProtected).toBe(false); // Goals is not protected
  });
});

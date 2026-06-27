import { describe, it, expect, beforeEach } from "vitest";
import { CreateEnvelopeUseCase } from "./create-envelope.use-case";
import type { EnvelopeRepository } from "@ledger-mx/domain";
import type { IdGenerator, Clock } from "@ledger-mx/application";
import { EnvelopeBuilder } from "@ledger-mx/domain";
import { envelopeIdFromString, userIdFromString } from "@ledger-mx/domain";

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
    return 0; // Simplified for unit test
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

describe("CreateEnvelopeUseCase", () => {
  let repository: FakeEnvelopeRepository;
  let idGenerator: FakeIdGenerator;
  let clock: FakeClock;
  let useCase: CreateEnvelopeUseCase;

  beforeEach(() => {
    repository = new FakeEnvelopeRepository();
    idGenerator = new FakeIdGenerator();
    clock = new FakeClock();
    useCase = new CreateEnvelopeUseCase(
      repository,
      idGenerator,
      clock,
    );
  });

  it("creates an envelope with required fields", async () => {
    const userId = userIdFromString("9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a");

    const result = await useCase.execute({
      userId,
      name: "Groceries",
      targetAmountCents: 500000,
      isProtected: true,
    });

    expect(result.name).toBe("Groceries");
    expect(result.targetAmountCents).toBe(500000);
    expect(result.isProtected).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.userId).toBe(userId);
  });

  it("creates an envelope with null targetAmountCents", async () => {
    const userId = userIdFromString("9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a");

    const result = await useCase.execute({
      userId,
      name: "Dining Out",
      targetAmountCents: null,
      isProtected: true,
    });

    expect(result.targetAmountCents).toBeNull();
  });

  it("defaults isProtected to true when not specified", async () => {
    const userId = userIdFromString("9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a");

    const result = await useCase.execute({
      userId,
      name: "Emergency Fund",
      targetAmountCents: 1000000,
      // isProtected not specified - should default to true
    } as { userId: string; name: string; targetAmountCents: number | null });

    expect(result.isProtected).toBe(true);
  });

  it("saves the envelope to the repository", async () => {
    const userId = userIdFromString("9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a");

    const result = await useCase.execute({
      userId,
      name: "Test Envelope",
      targetAmountCents: null,
      isProtected: true,
    });

    const saved = await repository.findById(userId, result.id);
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe("Test Envelope");
  });
});

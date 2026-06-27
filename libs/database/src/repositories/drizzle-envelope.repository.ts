import { eq, and, isNull, sql } from "drizzle-orm";
import type {
  Envelope,
  EnvelopeRepository,
  UserId,
  EnvelopeId,
} from "@ledger-mx/domain";
import type { Database } from "../connection";
import { envelopes } from "../schema/envelopes";
import { transactionLines } from "../schema/transaction-lines";

/**
 * Drizzle ORM implementation of EnvelopeRepository.
 */
export class DrizzleEnvelopeRepository implements EnvelopeRepository {
  constructor(private readonly db: Database) {}

  async save(envelope: Envelope): Promise<void> {
    const data = this.mapToDb(envelope);

    await this.db
      .insert(envelopes)
      .values(data)
      .onConflictDoUpdate({
        target: envelopes.id,
        set: {
          name: data.name,
          targetAmountCents: data.targetAmountCents,
          isProtected: data.isProtected,
          sortOrder: data.sortOrder,
          updatedAt: new Date(),
          deletedAt: data.deletedAt,
        },
        where: eq(envelopes.userId, envelope.userId),
      });
  }

  async findById(userId: UserId, id: EnvelopeId): Promise<Envelope | null> {
    const result = await this.db
      .select()
      .from(envelopes)
      .where(
        and(
          eq(envelopes.id, id),
          eq(envelopes.userId, userId),
          isNull(envelopes.deletedAt),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToDomain(result[0]);
  }

  async listByUserId(userId: UserId): Promise<Envelope[]> {
    const result = await this.db
      .select()
      .from(envelopes)
      .where(and(eq(envelopes.userId, userId), isNull(envelopes.deletedAt)))
      .orderBy(envelopes.sortOrder, envelopes.createdAt);

    return result.map((row) => this.mapToDomain(row));
  }

  async archive(userId: UserId, id: EnvelopeId, deletedAt: Date): Promise<void> {
    await this.db
      .update(envelopes)
      .set({
        isProtected: false, // Unprotect before archiving to allow any final spending
        updatedAt: new Date(),
        deletedAt: deletedAt,
      })
      .where(and(eq(envelopes.id, id), eq(envelopes.userId, userId)));
  }

  async getBalance(userId: UserId, envelopeId: EnvelopeId): Promise<number> {
    // Derive balance from transaction lines where targetType is 'envelope'
    const result = await this.db
      .select({
        balance: sql<number>`COALESCE(SUM(${transactionLines.amountCents}), 0)`,
      })
      .from(transactionLines)
      .where(
        and(
          eq(transactionLines.userId, userId),
          eq(transactionLines.targetType, "envelope"),
          eq(transactionLines.envelopeId, envelopeId),
          isNull(transactionLines.deletedAt),
        ),
      );

    const balance = result[0]?.balance ?? 0;
    return typeof balance === "string" ? parseInt(balance, 10) : balance;
  }

  async getBalances(
    userId: UserId,
    envelopeIds: EnvelopeId[],
  ): Promise<Map<string, number>> {
    if (envelopeIds.length === 0) {
      return new Map();
    }

    const result = await this.db
      .select({
        envelopeId: transactionLines.envelopeId,
        balance: sql<number>`COALESCE(SUM(${transactionLines.amountCents}), 0)`,
      })
      .from(transactionLines)
      .where(
        and(
          eq(transactionLines.userId, userId),
          eq(transactionLines.targetType, "envelope"),
          sql`${transactionLines.envelopeId} IN ${envelopeIds}`,
          isNull(transactionLines.deletedAt),
        ),
      )
      .groupBy(transactionLines.envelopeId);

    const balanceMap = new Map<string, number>();
    for (const row of result) {
      if (row.envelopeId) {
        const balance =
          typeof row.balance === "string"
            ? parseInt(row.balance, 10)
            : row.balance ?? 0;
        balanceMap.set(row.envelopeId, balance);
      }
    }

    return balanceMap;
  }

  async findDefaultEnvelopes(userId: UserId): Promise<Envelope[]> {
    // Match by exact default envelope names
    // This is more robust than using sortOrder < 100, which could incorrectly
    // match user-created envelopes
    const defaultNames = [
      "Groceries",
      "Dining Out",
      "Transportation",
      "Utilities",
      "Emergency Fund",
      "Goals",
    ];

    const result = await this.db
      .select()
      .from(envelopes)
      .where(
        and(
          eq(envelopes.userId, userId),
          sql`${envelopes.name} IN ${defaultNames}`,
          isNull(envelopes.deletedAt),
        ),
      )
      .orderBy(envelopes.sortOrder);

    return result.map((row) => this.mapToDomain(row));
  }

  private mapToDomain(row: typeof envelopes.$inferSelect): Envelope {
    return {
      id: row.id as EnvelopeId,
      userId: row.userId as UserId,
      name: row.name,
      targetAmountCents: row.targetAmountCents,
      isProtected: row.isProtected,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? undefined,
    };
  }

  private mapToDb(envelope: Envelope) {
    return {
      id: envelope.id,
      userId: envelope.userId,
      name: envelope.name,
      targetAmountCents: envelope.targetAmountCents,
      isProtected: envelope.isProtected,
      sortOrder: envelope.sortOrder,
      createdAt: envelope.createdAt,
      updatedAt: envelope.updatedAt,
      deletedAt: envelope.deletedAt ?? null,
    };
  }
}

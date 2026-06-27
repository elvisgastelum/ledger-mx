import type { Envelope } from "../envelope";
import type { EnvelopeId, UserId } from "../../value-objects/uuid";

export class EnvelopeBuilder {
  private _id?: EnvelopeId;
  private _userId?: UserId;
  private _name?: string;
  private _targetAmountCents?: number | null;
  private _isProtected?: boolean;
  private _sortOrder?: number;
  private _createdAt?: Date;
  private _updatedAt?: Date;
  private _deletedAt?: Date | null;

  withId(id: EnvelopeId): this {
    this._id = id;
    return this;
  }

  withUserId(userId: UserId): this {
    this._userId = userId;
    return this;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withTargetAmountCents(targetAmountCents: number | null): this {
    if (targetAmountCents !== null && targetAmountCents < 0) {
      throw new Error("EnvelopeBuilder: targetAmountCents must be non-negative");
    }
    this._targetAmountCents = targetAmountCents;
    return this;
  }

  withIsProtected(isProtected: boolean): this {
    this._isProtected = isProtected;
    return this;
  }

  withSortOrder(sortOrder: number): this {
    this._sortOrder = sortOrder;
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this._createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this._updatedAt = updatedAt;
    return this;
  }

  withDeletedAt(deletedAt: Date | null): this {
    this._deletedAt = deletedAt;
    return this;
  }

  build(): Envelope {
    if (!this._id) {
      throw new Error("EnvelopeBuilder: id is required");
    }
    if (!this._userId) {
      throw new Error("EnvelopeBuilder: userId is required");
    }
    if (this._name === undefined) {
      throw new Error("EnvelopeBuilder: name is required");
    }
    if (this._isProtected === undefined) {
      throw new Error("EnvelopeBuilder: isProtected is required");
    }
    if (this._sortOrder === undefined) {
      throw new Error("EnvelopeBuilder: sortOrder is required");
    }
    if (!this._createdAt) {
      throw new Error("EnvelopeBuilder: createdAt is required");
    }
    if (!this._updatedAt) {
      throw new Error("EnvelopeBuilder: updatedAt is required");
    }

    const envelope: Envelope = {
      id: this._id,
      userId: this._userId,
      name: this._name,
      targetAmountCents: this._targetAmountCents ?? null,
      isProtected: this._isProtected,
      sortOrder: this._sortOrder,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };

    if (this._deletedAt !== undefined) {
      envelope.deletedAt = this._deletedAt;
    }

    return envelope;
  }
}

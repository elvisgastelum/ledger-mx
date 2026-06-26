import { Transaction } from "../transaction";
import { TransactionLine } from "../transaction-line";
import { TransactionLineBuilder } from "./transaction-line-builder";
import { TransactionType } from "../../index";
import {
  TransactionId,
  UserId,
  TransactionLineId,
} from "../../value-objects/uuid";

export class TransactionBuilder {
  private _id?: TransactionId;
  private _userId?: UserId;
  private _type?: TransactionType;
  private _occurredAt?: Date;
  private _description?: string;
  private _createdAt?: Date;
  private _updatedAt?: Date;
  private _reversalOfTransactionId?: TransactionId;
  private _lines: TransactionLine[] = [];

  withId(id: TransactionId): this {
    this._id = id;
    return this;
  }

  withUserId(userId: UserId): this {
    this._userId = userId;
    return this;
  }

  withType(type: TransactionType): this {
    this._type = type;
    return this;
  }

  withOccurredAt(occurredAt: Date): this {
    this._occurredAt = occurredAt;
    return this;
  }

  withDescription(description: string): this {
    this._description = description;
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

  withReversalOfTransactionId(
    reversalOfTransactionId: TransactionId,
  ): this {
    this._reversalOfTransactionId = reversalOfTransactionId;
    return this;
  }

  /**
   * Adds a transaction line to this transaction.
   * @param line - A TransactionLine object to add directly.
   * @param builderCallback - A callback that receives a pre-configured TransactionLineBuilder
   *   with the transaction ID already set. The callback can further configure the builder
   *   (e.g., setting target, amount) and must return it.
   * @throws {Error} If using callback overload and withId() has not been called first.
   */
  withTransactionLine(line: TransactionLine): this;
  withTransactionLine(
    builderCallback: (builder: TransactionLineBuilder) => TransactionLineBuilder,
  ): this;
  withTransactionLine(
    lineOrCallback: TransactionLine | ((builder: TransactionLineBuilder) => TransactionLineBuilder),
  ): this {
    if (typeof lineOrCallback === "function") {
      // Callback overload requires transaction ID to pre-configure the line builder
      if (this._id === undefined) {
        throw new Error(
          "TransactionBuilder: Cannot use callback overload of withTransactionLine() because transaction ID is not set. " +
          "Call withId() before withTransactionLine(callback) so the line builder can be pre-configured with the correct transactionId.",
        );
      }

      // The callback receives a line builder with transactionId already set
      const lineBuilder = new TransactionLineBuilder().withTransactionId(
        this._id,
      );
      const configuredBuilder = lineOrCallback(lineBuilder);
      const line = configuredBuilder.build();
      this._lines.push(line);
    } else {
      // Pre-built TransactionLine - can be added without transaction ID being set
      this._lines.push(lineOrCallback);
    }
    return this;
  }

  withTransactionLines(lines: TransactionLine[]): this {
    this._lines.push(...lines);
    return this;
  }

  build(): Transaction {
    if (!this._id) {
      throw new Error("TransactionBuilder: id is required");
    }
    if (!this._userId) {
      throw new Error("TransactionBuilder: userId is required");
    }
    if (!this._type) {
      throw new Error("TransactionBuilder: type is required");
    }
    if (!this._occurredAt) {
      throw new Error("TransactionBuilder: occurredAt is required");
    }
    if (this._lines.length < 2) {
      throw new Error(
        "TransactionBuilder: at least 2 lines are required",
      );
    }

    return new Transaction({
      id: this._id,
      userId: this._userId,
      type: this._type,
      occurredAt: this._occurredAt,
      description: this._description,
      lines: this._lines,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      reversalOfTransactionId: this._reversalOfTransactionId,
    });
  }
}

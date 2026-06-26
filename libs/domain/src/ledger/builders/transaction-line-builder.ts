import { TransactionLine } from "../transaction-line";
import { TransactionLineTargetType } from "../../index";
import {
  TransactionLineId,
  TransactionId,
  AccountId,
  EnvelopeId,
  CategoryId,
  TransactionLineTargetId,
} from "../../value-objects/uuid";

export class TransactionLineBuilder {
  private _id?: TransactionLineId;
  private _transactionId?: TransactionId;
  private _targetType?: TransactionLineTargetType;
  private _targetId?: TransactionLineTargetId;
  private _amountCents?: number;

  withId(id: TransactionLineId): this {
    this._id = id;
    return this;
  }

  withTransactionId(transactionId: TransactionId): this {
    this._transactionId = transactionId;
    return this;
  }

  withTarget(
    targetType: TransactionLineTargetType,
    targetId: TransactionLineTargetId,
  ): this {
    this._targetType = targetType;
    this._targetId = targetId;
    return this;
  }

  withAccountTarget(accountId: AccountId): this {
    this._targetType = "account";
    this._targetId = accountId;
    return this;
  }

  withEnvelopeTarget(envelopeId: EnvelopeId): this {
    this._targetType = "envelope";
    this._targetId = envelopeId;
    return this;
  }

  withCategoryTarget(categoryId: CategoryId): this {
    this._targetType = "category";
    this._targetId = categoryId;
    return this;
  }

  withAmountCents(amountCents: number): this {
    this._amountCents = amountCents;
    return this;
  }

  build(): TransactionLine {
    if (!this._id) {
      throw new Error("TransactionLineBuilder: id is required");
    }
    if (!this._transactionId) {
      throw new Error("TransactionLineBuilder: transactionId is required");
    }
    if (!this._targetType) {
      throw new Error("TransactionLineBuilder: targetType is required");
    }
    if (!this._targetId) {
      throw new Error("TransactionLineBuilder: targetId is required");
    }
    if (this._amountCents === undefined) {
      throw new Error("TransactionLineBuilder: amountCents is required");
    }

    return new TransactionLine({
      id: this._id,
      transactionId: this._transactionId,
      targetType: this._targetType,
      targetId: this._targetId,
      amountCents: this._amountCents,
    });
  }
}

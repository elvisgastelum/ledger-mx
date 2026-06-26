import type { Account } from "../account";
import type { AccountId, UserId } from "../../value-objects/uuid";
import type { AccountType, AccountStatus, OwnershipType, SystemRole } from "../../index";

export class AccountBuilder {
  private _id?: AccountId;
  private _userId?: UserId;
  private _name?: string;
  private _type?: AccountType;
  private _currencyCode?: string;
  private _status?: AccountStatus;
  private _createdAt?: Date;
  private _updatedAt?: Date;
  private _deletedAt?: Date | null;
  private _ownership?: OwnershipType;
  private _systemRole?: "expense" | "income" | "salary" | null;
  private _systemRoleSet = false;

  withId(id: AccountId): this {
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

  withType(type: AccountType): this {
    this._type = type;
    return this;
  }

  withCurrencyCode(currencyCode: string): this {
    this._currencyCode = currencyCode;
    return this;
  }

  withStatus(status: AccountStatus): this {
    this._status = status;
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

  withOwnership(ownership: OwnershipType): this {
    this._ownership = ownership;
    return this;
  }

  withSystemRole(systemRole: "expense" | "income" | "salary" | null): this {
    this._systemRole = systemRole;
    this._systemRoleSet = true;
    return this;
  }

  build(): Account {
    if (!this._id) {
      throw new Error("AccountBuilder: id is required");
    }
    if (!this._userId) {
      throw new Error("AccountBuilder: userId is required");
    }
    if (this._name === undefined) {
      throw new Error("AccountBuilder: name is required");
    }
    if (!this._type) {
      throw new Error("AccountBuilder: type is required");
    }
    if (this._currencyCode === undefined) {
      throw new Error("AccountBuilder: currencyCode is required");
    }
    if (!this._status) {
      throw new Error("AccountBuilder: status is required");
    }
    if (!this._createdAt) {
      throw new Error("AccountBuilder: createdAt is required");
    }
    if (!this._updatedAt) {
      throw new Error("AccountBuilder: updatedAt is required");
    }
    if (!this._ownership) {
      throw new Error("AccountBuilder: ownership is required");
    }
    if (!this._systemRoleSet) {
      throw new Error("AccountBuilder: systemRole is required");
    }

    // At this point, all fields are guaranteed to be set
    const systemRole: SystemRole = this._systemRole!;

    const account: Account = {
      id: this._id,
      userId: this._userId,
      name: this._name,
      type: this._type,
      currencyCode: this._currencyCode,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      ownership: this._ownership,
      systemRole,
    };

    if (this._deletedAt !== undefined) {
      account.deletedAt = this._deletedAt;
    }

    return account;
  }
}

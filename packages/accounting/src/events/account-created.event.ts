import type { DomainEvent } from '@aibos/eventsourcing';

import { AccountType } from '../domain/account.domain';
import { randomUUID } from 'node:crypto';
import { isNonEmpty } from '../utils';

export class AccountCreatedEvent implements DomainEvent {
  public static readonly TYPE = 'AccountCreated' as const;
  /** Event schema version for future migrations */
  public static readonly EVENT_SCHEMA_VERSION = 1;
  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;
  public readonly eventType = AccountCreatedEvent.TYPE;
  public readonly schemaVersion = AccountCreatedEvent.EVENT_SCHEMA_VERSION;

  public readonly accountCode: string;
  public readonly accountName: string;
  public readonly accountType: AccountType;
  public readonly parentAccountCode?: string;

  constructor(
    accountCode: string,
    accountName: string,
    accountType: AccountType,
    parentAccountCode: string | undefined,
    tenantId: string,
    version: number,
    correlationId?: string,
    causationId?: string,
    options?: { id?: string }, // optional: allow ULID/UUID injection for idempotency
  ) {
    // Use conditional spreads to handle exactOptionalPropertyTypes safely
    const payload = {
      id: options?.id ?? randomUUID(),
      ...(correlationId ? { correlationId } : {}),
      ...(causationId ? { causationId } : {}),
      ...(parentAccountCode ? { parentAccountCode } : {}),
    };

    this.id = payload.id;
    this.aggregateId = AccountCreatedEvent.buildAggregateId(tenantId);
    this.version = version;
    this.occurredAt = new Date();
    this.tenantId = tenantId;
    if (payload.correlationId !== undefined) this.correlationId = payload.correlationId;
    if (payload.causationId !== undefined) this.causationId = payload.causationId;

    this.accountCode = accountCode;
    this.accountName = accountName;
    this.accountType = accountType;
    if (payload.parentAccountCode !== undefined) this.parentAccountCode = payload.parentAccountCode;
    this.validate();
    Object.freeze(this);
  }

  /** Helper for creating new events (better than direct constructor) */
  public static create(
    accountCode: string,
    accountName: string,
    accountType: AccountType,
    tenantId: string,
    parentAccountCode?: string,
    correlationId?: string,
    causationId?: string,
    options?: { id?: string }, // optional: allow ULID/UUID injection for idempotency
  ): AccountCreatedEvent {
    return new AccountCreatedEvent(
      accountCode,
      accountName,
      accountType,
      parentAccountCode,
      tenantId,
      1, // initial version
      correlationId,
      causationId,
      options,
    );
  }

  /** Build aggregate ID consistently */
  private static buildAggregateId(tenantId: string): string {
    return `chart-of-accounts-${tenantId}`;
  }

  /** Utility method for debugging */
  public toString(): string {
    return `AccountCreatedEvent[${this.accountCode}, v${this.version}, tenant:${this.tenantId}]`;
  }

  /** Method to check if this is the initial event */
  public isInitialEvent(): boolean {
    return this.version === 1;
  }

  public toJSON(): Record<string, unknown> {
    const out: Record<string, unknown> = {
      id: this.id,
      aggregateId: this.aggregateId,
      version: this.version,
      occurredAt: this.occurredAt.toISOString(),
      tenantId: this.tenantId,
      eventType: this.eventType,
      schemaVersion: this.schemaVersion,
      accountCode: this.accountCode,
      accountName: this.accountName,
      accountType: this.accountType,
    };
    if (this.correlationId !== undefined) out.correlationId = this.correlationId;
    if (this.causationId !== undefined) out.causationId = this.causationId;
    if (this.parentAccountCode !== undefined) out.parentAccountCode = this.parentAccountCode;
    return out;
  }

  public serialize(): Record<string, unknown> {
    return this.toJSON();
  }

  public static deserialize(data: Record<string, unknown>): AccountCreatedEvent {
    // Validate event type FIRST
    if (data.eventType !== AccountCreatedEvent.TYPE) {
      throw new TypeError(
        `Expected eventType "${AccountCreatedEvent.TYPE}", got "${data.eventType}"`,
      );
    }

    // Schema version (lenient): default 1; require integer >=1 if provided
    const rawSchema = (data as Record<string, unknown>).schemaVersion;
    const schemaVersion =
      rawSchema === undefined
        ? 1
        : Number.isInteger(rawSchema as number) && (rawSchema as number) >= 1
          ? (rawSchema as number)
          : (() => {
              throw new TypeError(`schemaVersion must be a positive integer`);
            })();

    // Basic presence checks (throwing with clear messages helps debugging bad events)
    const id = expectString(data.id, 'id');
    const aggregateId = expectString(data.aggregateId, 'aggregateId');
    const version = expectNumber(data.version, 'version');
    const occurredAtIso = expectString(data.occurredAt, 'occurredAt');
    const occurredAt = new Date(occurredAtIso);
    if (Number.isNaN(occurredAt.getTime())) {
      throw new TypeError(`occurredAt is not a valid ISO date: ${occurredAtIso}`);
    }
    const tenantId = expectString(data.tenantId, 'tenantId');
    const accountCode = expectString(data.accountCode, 'accountCode');
    const accountName = expectString(data.accountName, 'accountName');
    const accountType = data.accountType as AccountType;
    const parentAccountCode = optionalString(data.parentAccountCode);
    const correlationId = optionalString(data.correlationId);
    const causationId = optionalString(data.causationId);

    // Hydrate without calling constructor (so we preserve id/occurredAt/aggregateId exactly)
    const event = Object.create(AccountCreatedEvent.prototype) as AccountCreatedEvent;
    Object.assign(event, {
      id,
      aggregateId,
      version,
      occurredAt,
      tenantId,
      correlationId,
      causationId,
      eventType: AccountCreatedEvent.TYPE,
      schemaVersion,
      accountCode,
      accountName,
      accountType,
      parentAccountCode,
    });
    event.validate();
    Object.freeze(event);
    return event;
  }

  private validate(): void {
    // Basic account code constraints (tweak as needed)
    const code = this.accountCode.trim();
    const CODE = /^[A-Z0-9._-]{1,64}$/i;
    if (!CODE.test(code)) {
      throw new TypeError(
        `accountCode has invalid characters/length (allowed A-Z 0-9 . _ -, max 64): ${this.accountCode}`,
      );
    }

    // Validate account type
    if (!this.isValidAccountType(this.accountType)) {
      throw new TypeError(`Invalid accountType: ${this.accountType}`);
    }

    if (this.parentAccountCode) {
      const parent = this.parentAccountCode.trim();
      if (!CODE.test(parent)) {
        throw new TypeError(`parentAccountCode invalid: ${this.parentAccountCode}`);
      }
      if (parent === code) {
        throw new TypeError(
          `AccountCreatedEvent: accountCode (${this.accountCode}) cannot be the same as parentAccountCode`,
        );
      }
      this.validateParentChildRelationship(code, parent);
    }

    if (!Number.isInteger(this.version) || this.version < 1) {
      throw new TypeError(`version must be a positive integer, got: ${this.version}`);
    }
    if (!(this.occurredAt instanceof Date) || Number.isNaN(this.occurredAt.getTime())) {
      throw new TypeError('occurredAt must be a valid Date');
    }

    // Validate tenant consistency
    this.validateTenantConsistency();
  }

  /** Validate account type */
  private isValidAccountType(type: unknown): type is AccountType {
    const validTypes = Object.values(AccountType);
    return validTypes.includes(type as AccountType);
  }

  /** Validate parent-child relationship */
  private validateParentChildRelationship(accountCode: string, parentCode: string): void {
    // Example: parent must be shorter than child (hierarchical structure)
    if (parentCode.length >= accountCode.length) {
      throw new TypeError(
        `Parent account code (${parentCode}) should be shorter than child account code (${accountCode})`,
      );
    }
  }

  /** Ensure tenantId consistency between aggregateId and tenantId */
  private validateTenantConsistency(): void {
    const expectedAggregateId = AccountCreatedEvent.buildAggregateId(this.tenantId);
    if (this.aggregateId !== expectedAggregateId) {
      throw new TypeError(
        `aggregateId ${this.aggregateId} doesn't match tenantId ${this.tenantId}`,
      );
    }
  }
}

// ---------- helpers ----------
function expectString(v: unknown, label: string): string {
  if (typeof v !== 'string' || !isNonEmpty(v)) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return v.trim();
}
function expectNumber(v: unknown, label: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new TypeError(`${label} must be a finite number`);
  }
  return v;
}
function optionalString(v: unknown): string | undefined {
  return isNonEmpty(v) ? v.trim() : undefined;
}

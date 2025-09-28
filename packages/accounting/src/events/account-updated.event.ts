import type { AccountType } from '../domain/account.domain';
import type { DomainEvent } from '@aibos/eventsourcing';

import { Money } from '../domain/Money';
import { assertAggregateMatchesTenant, moneyFromCentsShim } from './common.utility';
import { omitUndefined } from '../utils';
import { randomUUID } from 'node:crypto';

const CODE = /^[A-Z0-9._-]{1,64}$/i;
const CHART_OF_ACCOUNTS_PREFIX = 'chart-of-accounts-';
const nonEmpty = (v: unknown, label: string): string => {
  if (typeof v !== 'string' || v.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return v.trim();
};
const okCode = (v: unknown, label: string): string => {
  const t = nonEmpty(v, label);
  if (!CODE.test(t)) throw new Error(`${label} invalid (A-Z 0-9 . _ -, max 64): ${v as string}`);
  return t;
};

export class AccountBalanceUpdatedEvent implements DomainEvent {
  public static readonly TYPE = 'AccountBalanceUpdated' as const;
  /** Event schema version for future migrations */
  public static readonly EVENT_SCHEMA_VERSION = 1;
  public readonly eventType = AccountBalanceUpdatedEvent.TYPE;
  public readonly schemaVersion = AccountBalanceUpdatedEvent.EVENT_SCHEMA_VERSION;

  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;

  public readonly accountCode: string;
  /** Back-compat numeric view (major units). */
  public readonly balance: number;
  /** Bank-grade internal storage */
  private readonly _balance: Money;

  constructor(
    accountCode: string,
    balance: number | Money, // Accept Money directly for precision
    aggregateId: string,
    version: number,
    tenantId: string,
    id?: string,
    occurredAt?: Date,
    correlationId?: string,
    causationId?: string,
  ) {
    // Use omitUndefined to handle exactOptionalPropertyTypes safely
    const cleanOptions = omitUndefined({
      id: id ?? randomUUID(),
      occurredAt: occurredAt ?? new Date(),
      correlationId,
      causationId,
    });

    this.id = cleanOptions.id;
    this.aggregateId = aggregateId;
    this.version = version;
    this.occurredAt = cleanOptions.occurredAt;
    this.tenantId = tenantId;
    this.correlationId = cleanOptions.correlationId;
    this.causationId = cleanOptions.causationId;

    this.accountCode = accountCode;

    // Handle both number and Money inputs for precision
    if (balance instanceof Money) {
      this._balance = balance;
      this.balance = balance.toNumber(); // May still lose precision for display
    } else {
      this.balance = balance;
      this._balance = Money.fromNumber(balance);
    }

    this.validate();
    Object.freeze(this);
  }

  /** Factory from plain payload and meta */
  public static from(
    payload: { accountCode: string; balance: number | Money },
    meta: {
      aggregateId: string;
      version: number;
      tenantId: string;
      correlationId?: string;
      causationId?: string;
    },
  ): AccountBalanceUpdatedEvent {
    return new AccountBalanceUpdatedEvent(
      payload.accountCode,
      payload.balance,
      meta.aggregateId,
      meta.version,
      meta.tenantId,
      undefined, // id - auto-generate
      undefined, // occurredAt - set to now
      meta.correlationId,
      meta.causationId,
    );
  }

  /** Deserialize from stored data */
  public static deserialize(data: Record<string, unknown>): AccountBalanceUpdatedEvent {
    // Validate event type first
    if (data.eventType !== AccountBalanceUpdatedEvent.TYPE) {
      throw new TypeError(
        `Expected eventType "${AccountBalanceUpdatedEvent.TYPE}", got "${data.eventType}"`,
      );
    }

    // Schema version (strict but forward-lenient): default 1; require integer ≥ 1 if provided
    const rawSchema = (data as Record<string, unknown>).schemaVersion;
    const schemaVersion =
      rawSchema === undefined
        ? 1
        : Number.isInteger(rawSchema as number) && (rawSchema as number) >= 1
          ? (rawSchema as number)
          : (() => {
              throw new TypeError('schemaVersion must be a positive integer');
            })();

    // occurredAt ISO validity
    const occurredAtIso = expectString(data.occurredAt, 'occurredAt');
    const occurredAt = new Date(occurredAtIso);
    if (Number.isNaN(occurredAt.getTime())) {
      throw new TypeError(`occurredAt is not a valid ISO date: ${occurredAtIso}`);
    }

    // Prefer lossless cents if provided; fallback to legacy number
    const balanceCentsString = optionalString((data as Record<string, unknown>).balanceCents);
    const balance: Money =
      balanceCentsString !== undefined
        ? (moneyFromCentsShim(Money, BigInt(balanceCentsString)) as Money) // precise
        : Money.fromNumber(expectNumber(data.balance, 'balance')); // legacy number

    // Hydrate without constructor to preserve schemaVersion exactly
    const event = Object.create(AccountBalanceUpdatedEvent.prototype) as AccountBalanceUpdatedEvent;
    Object.assign(event, {
      eventType: AccountBalanceUpdatedEvent.TYPE,
      schemaVersion,
      id: expectString(data.id, 'id'),
      aggregateId: expectString(data.aggregateId, 'aggregateId'),
      version: expectNumber(data.version, 'version'),
      occurredAt,
      tenantId: expectString(data.tenantId, 'tenantId'),
      correlationId: optionalString(data.correlationId),
      causationId: optionalString(data.causationId),
      accountCode: expectString(data.accountCode, 'accountCode'),
      // Dual representation
      balance: balance.toNumber(),
      _balance: balance,
    });
    // Convention guard (adjust prefix if your stream differs)
    assertAggregateMatchesTenant(event.aggregateId, event.tenantId, {
      prefix: CHART_OF_ACCOUNTS_PREFIX,
    });
    event.validate();
    Object.freeze(event);
    return event;
  }

  /** Access the precise Money value (minor units). */
  public getBalance(): Money {
    return this._balance;
  }

  /** Helper for handlers to avoid redundant events */
  public isNoop(previousBalance: number | Money): boolean {
    const previous =
      typeof previousBalance === 'number' ? Money.fromNumber(previousBalance) : previousBalance;
    return this._balance.equals(previous);
  }

  /** Utility method for debugging */
  public toString(): string {
    return `AccountBalanceUpdatedEvent[${this.accountCode}, ${this.balance}, v${this.version}, tenant:${this.tenantId}]`;
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      aggregateId: this.aggregateId,
      version: this.version,
      occurredAt: this.occurredAt.toISOString(),
      tenantId: this.tenantId,
      eventType: this.eventType,
      schemaVersion: this.schemaVersion,
      accountCode: this.accountCode,
      balance: this.balance, // backward compatibility for readers expecting number
      balanceCents: this._balance.toCents().toString(), // precise field for new readers
      ...(this.correlationId && { correlationId: this.correlationId }),
      ...(this.causationId && { causationId: this.causationId }),
    };
  }

  private validate(): void {
    okCode(this.accountCode, 'accountCode');

    if (typeof this.balance !== 'number' || !Number.isFinite(this.balance)) {
      throw new TypeError(`balance must be a finite number, got: ${this.balance}`);
    }

    // Validate event metadata
    validateEventMetadata(this.id, this.occurredAt, this.version);
    // Convention guard on new instances too
    assertAggregateMatchesTenant(this.aggregateId, this.tenantId, {
      prefix: CHART_OF_ACCOUNTS_PREFIX,
    });
  }
}

// ---------- shared helpers ----------
function validateEventMetadata(id: string, occurredAt: Date, version: number): void {
  if (!id || typeof id !== 'string') {
    throw new TypeError('id must be a non-empty string');
  }
  if (!(occurredAt instanceof Date) || Number.isNaN(occurredAt.getTime())) {
    throw new TypeError('occurredAt must be a valid Date');
  }
  if (!Number.isInteger(version) || version < 1) {
    throw new TypeError('version must be a positive integer');
  }
}

export class AccountStateUpdatedEvent implements DomainEvent {
  public static readonly TYPE = 'AccountStateUpdated' as const;
  /** Event schema version for future migrations */
  public static readonly EVENT_SCHEMA_VERSION = 1;
  public readonly eventType = AccountStateUpdatedEvent.TYPE;
  public readonly schemaVersion = AccountStateUpdatedEvent.EVENT_SCHEMA_VERSION;

  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;

  public readonly accountCode: string;
  public readonly accountName: string;
  public readonly accountType: AccountType;
  public readonly parentAccountCode: string | undefined;
  public readonly isActive: boolean;

  constructor(
    accountCode: string,
    accountName: string,
    accountType: AccountType,
    parentAccountCode: string | undefined,
    isActive: boolean,
    aggregateId: string,
    version: number,
    tenantId: string,
    id?: string,
    occurredAt?: Date,
    correlationId?: string,
    causationId?: string,
  ) {
    // Use omitUndefined to handle exactOptionalPropertyTypes safely
    const cleanOptions = omitUndefined({
      id: id ?? randomUUID(),
      occurredAt: occurredAt ?? new Date(),
      correlationId,
      causationId,
    });

    this.id = cleanOptions.id;
    this.aggregateId = aggregateId;
    this.version = version;
    this.occurredAt = cleanOptions.occurredAt;
    this.tenantId = tenantId;
    this.correlationId = cleanOptions.correlationId;
    this.causationId = cleanOptions.causationId;

    this.accountCode = accountCode;
    this.accountName = accountName;
    this.accountType = accountType;
    this.parentAccountCode = parentAccountCode;
    this.isActive = isActive;
    this.validate();
    Object.freeze(this);
  }

  /** Factory for convenience */
  public static from(
    payload: {
      accountCode: string;
      accountName: string;
      accountType: AccountType;
      parentAccountCode?: string | undefined;
      isActive: boolean;
    },
    meta: {
      aggregateId: string;
      version: number;
      tenantId: string;
      correlationId?: string;
      causationId?: string;
    },
  ): AccountStateUpdatedEvent {
    return new AccountStateUpdatedEvent(
      payload.accountCode,
      payload.accountName,
      payload.accountType,
      payload.parentAccountCode,
      payload.isActive,
      meta.aggregateId,
      meta.version,
      meta.tenantId,
      undefined, // id
      undefined, // occurredAt
      meta.correlationId,
      meta.causationId,
    );
  }

  /** Deserialize from stored data */
  public static deserialize(data: Record<string, unknown>): AccountStateUpdatedEvent {
    // Validate event type first
    if (data.eventType !== AccountStateUpdatedEvent.TYPE) {
      throw new TypeError(
        `Expected eventType "${AccountStateUpdatedEvent.TYPE}", got "${data.eventType}"`,
      );
    }

    // Schema version (strict, forward-lenient)
    const rawSchema = (data as Record<string, unknown>).schemaVersion;
    const schemaVersion =
      rawSchema === undefined
        ? 1
        : Number.isInteger(rawSchema as number) && (rawSchema as number) >= 1
          ? (rawSchema as number)
          : (() => {
              throw new TypeError('schemaVersion must be a positive integer');
            })();

    const occurredAtIso = expectString(data.occurredAt, 'occurredAt');
    const occurredAt = new Date(occurredAtIso);
    if (Number.isNaN(occurredAt.getTime())) {
      throw new TypeError(`occurredAt is not a valid ISO date: ${occurredAtIso}`);
    }

    // Hydrate without constructor so we keep schemaVersion/date/id identical
    const event = Object.create(AccountStateUpdatedEvent.prototype) as AccountStateUpdatedEvent;
    Object.assign(event, {
      eventType: AccountStateUpdatedEvent.TYPE,
      schemaVersion,
      id: expectString(data.id, 'id'),
      aggregateId: expectString(data.aggregateId, 'aggregateId'),
      version: expectNumber(data.version, 'version'),
      occurredAt,
      tenantId: expectString(data.tenantId, 'tenantId'),
      correlationId: optionalString(data.correlationId),
      causationId: optionalString(data.causationId),
      accountCode: expectString(data.accountCode, 'accountCode'),
      accountName: expectString(data.accountName, 'accountName'),
      accountType: data.accountType as AccountType,
      parentAccountCode: optionalString(data.parentAccountCode),
      isActive: expectBoolean(data.isActive, 'isActive'),
    });
    assertAggregateMatchesTenant(event.aggregateId, event.tenantId, {
      prefix: CHART_OF_ACCOUNTS_PREFIX,
    });
    event.validate();
    Object.freeze(event);
    return event;
  }

  /** Diff helper for handlers/UI — which fields changed vs previous state */
  public changedFields(previous: {
    accountName: string;
    accountType: AccountType;
    parentAccountCode?: string | undefined;
    isActive: boolean;
  }): Array<'accountName' | 'accountType' | 'parentAccountCode' | 'isActive'> {
    const out: Array<'accountName' | 'accountType' | 'parentAccountCode' | 'isActive'> = [];
    if (previous.accountName !== this.accountName) out.push('accountName');
    if (previous.accountType !== this.accountType) out.push('accountType');
    if ((previous.parentAccountCode ?? undefined) !== (this.parentAccountCode ?? undefined))
      out.push('parentAccountCode');
    if (previous.isActive !== this.isActive) out.push('isActive');
    return out;
  }

  public isActivation(previousIsActive: boolean): boolean {
    return previousIsActive === false && this.isActive === true;
  }
  public isDeactivation(previousIsActive: boolean): boolean {
    return previousIsActive === true && this.isActive === false;
  }
  public isNoop(previous: {
    accountName: string;
    accountType: AccountType;
    parentAccountCode?: string | undefined;
    isActive: boolean;
  }): boolean {
    return this.changedFields(previous).length === 0;
  }

  /** Utility method for debugging */
  public toString(): string {
    return `AccountStateUpdatedEvent[${this.accountCode}, ${this.accountName}, ${this.accountType}, ${this.isActive}, v${this.version}, tenant:${this.tenantId}]`;
  }

  serialize(): Record<string, unknown> {
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
      isActive: this.isActive,
    };
    if (this.parentAccountCode !== undefined) out.parentAccountCode = this.parentAccountCode;
    if (this.correlationId !== undefined) out.correlationId = this.correlationId;
    if (this.causationId !== undefined) out.causationId = this.causationId;
    return out;
  }

  private validate(): void {
    const code = okCode(this.accountCode, 'accountCode');
    nonEmpty(this.accountName, 'accountName');

    // Critical: Validate AccountType
    if (!this.isValidAccountType(this.accountType)) {
      throw new TypeError(`Invalid accountType: ${this.accountType}`);
    }

    if (typeof this.isActive !== 'boolean') {
      throw new TypeError('isActive must be boolean');
    }
    if (this.parentAccountCode !== undefined) {
      const parent = okCode(this.parentAccountCode, 'parentAccountCode');
      if (parent === code) {
        throw new Error('parentAccountCode must differ from accountCode');
      }
    }

    // Validate event metadata
    validateEventMetadata(this.id, this.occurredAt, this.version);
    assertAggregateMatchesTenant(this.aggregateId, this.tenantId, {
      prefix: CHART_OF_ACCOUNTS_PREFIX,
    });

    // Business rule validation
    this.validateBusinessRules();
  }

  private isValidAccountType(type: unknown): type is AccountType {
    // Define valid account types based on your domain
    const validTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] as const;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return validTypes.includes(type as any);
  }

  private validateBusinessRules(): void {
    // Example: System accounts cannot be deactivated
    if (this.accountCode.startsWith('SYS-') && !this.isActive) {
      throw new Error('System accounts cannot be deactivated');
    }
  }
}

// ---------- helpers ----------
function expectString(v: unknown, label: string): string {
  if (typeof v !== 'string' || v.trim().length === 0) {
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

function expectBoolean(v: unknown, label: string): boolean {
  if (typeof v !== 'boolean') {
    throw new TypeError(`${label} must be a boolean`);
  }
  return v;
}

function optionalString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

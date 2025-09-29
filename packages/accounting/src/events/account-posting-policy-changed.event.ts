import type { DomainEvent } from '@aibos/eventsourcing';

import { randomUUID } from 'node:crypto';
import { omitUndefined, isNonEmpty } from '../utils';
import { createBusinessError } from '../utils/error-utilities';

export class AccountPostingPolicyChangedEvent implements DomainEvent {
  public static readonly TYPE = 'AccountPostingPolicyChanged' as const;
  /** Event schema version for future migrations */
  public static readonly EVENT_SCHEMA_VERSION = 1;
  public readonly eventType = AccountPostingPolicyChangedEvent.TYPE;
  public readonly schemaVersion = AccountPostingPolicyChangedEvent.EVENT_SCHEMA_VERSION;

  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;

  public readonly accountCode: string;
  public readonly postingAllowed: boolean;

  constructor(
    accountCode: string,
    postingAllowed: boolean,
    aggregateId: string,
    version: number,
    tenantId: string,
    id?: string, // Allow passing ID for deserialization
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
    this.postingAllowed = postingAllowed;
    this.validate();
    Object.freeze(this);
  }

  /** Factory from plain payload and meta (handy in handlers/upcasters) */
  public static from(
    payload: { accountCode: string; postingAllowed: boolean },
    meta: {
      aggregateId: string;
      version: number;
      tenantId: string;
      correlationId?: string;
      causationId?: string;
    },
  ): AccountPostingPolicyChangedEvent {
    return new AccountPostingPolicyChangedEvent(
      payload.accountCode,
      payload.postingAllowed,
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
  public static deserialize(data: Record<string, unknown>): AccountPostingPolicyChangedEvent {
    // Validate event type first
    if (data.eventType !== AccountPostingPolicyChangedEvent.TYPE) {
      throw new TypeError(
        `Expected eventType "${AccountPostingPolicyChangedEvent.TYPE}", got "${data.eventType}"`,
      );
    }

    // schemaVersion: default 1; require integer >= 1 if provided
    const rawSchema = (data as Record<string, unknown>).schemaVersion;
    const schemaVersion =
      rawSchema === undefined
        ? 1
        : Number.isInteger(rawSchema as number) && (rawSchema as number) >= 1
          ? (rawSchema as number)
          : (() => {
              throw new TypeError('schemaVersion must be a positive integer');
            })();

    // occurredAt must be a valid ISO string
    const occurredAtIso = expectString(data.occurredAt, 'occurredAt');
    const occurredAt = new Date(occurredAtIso);
    if (Number.isNaN(occurredAt.getTime())) {
      throw new TypeError(`occurredAt is not a valid ISO date: ${occurredAtIso}`);
    }

    // Hydrate without calling constructor to preserve exact fields (incl. schemaVersion)
    const event = Object.create(
      AccountPostingPolicyChangedEvent.prototype,
    ) as AccountPostingPolicyChangedEvent;
    Object.assign(event, {
      eventType: AccountPostingPolicyChangedEvent.TYPE,
      schemaVersion,
      id: expectString(data.id, 'id'),
      aggregateId: expectString(data.aggregateId, 'aggregateId'),
      version: expectNumber(data.version, 'version'),
      occurredAt,
      tenantId: expectString(data.tenantId, 'tenantId'),
      correlationId: optionalString(data.correlationId),
      causationId: optionalString(data.causationId),
      accountCode: expectString(data.accountCode, 'accountCode'),
      postingAllowed: expectBoolean(data.postingAllowed, 'postingAllowed'),
    });
    event.validate();
    Object.freeze(event);
    return event;
  }

  /** True if this change enables posting (was false -> true). Provide previous state. */
  public isEnabling(previousPostingAllowed: boolean): boolean {
    return previousPostingAllowed === false && this.postingAllowed === true;
  }

  /** True if this change disables posting (was true -> false). Provide previous state. */
  public isDisabling(previousPostingAllowed: boolean): boolean {
    return previousPostingAllowed === true && this.postingAllowed === false;
  }

  /** No-op detector for handlers to avoid storing redundant events */
  public isNoop(previousPostingAllowed: boolean): boolean {
    return previousPostingAllowed === this.postingAllowed;
  }

  /** Get the direction of change (useful for analytics/auditing) */
  public getChangeDirection(previousPostingAllowed: boolean): 'enable' | 'disable' | 'no-change' {
    if (previousPostingAllowed === this.postingAllowed) return 'no-change';
    return this.postingAllowed ? 'enable' : 'disable';
  }

  /** Check if this change has significant business impact */
  public hasSignificantImpact(previousPostingAllowed: boolean): boolean {
    // Disabling posting on an active account is usually significant
    return this.isDisabling(previousPostingAllowed);
  }

  /** Get human-readable description */
  public getDescription(previousPostingAllowed?: boolean): string {
    const action = this.postingAllowed ? 'enabled' : 'disabled';
    if (previousPostingAllowed !== undefined) {
      return `Posting ${action} for account ${this.accountCode} (was ${previousPostingAllowed ? 'enabled' : 'disabled'})`;
    }
    return `Posting ${action} for account ${this.accountCode}`;
  }

  /** Utility method for debugging */
  public toString(): string {
    return `AccountPostingPolicyChangedEvent[${this.accountCode}, ${this.postingAllowed}, v${this.version}, tenant:${this.tenantId}]`;
  }

  serialize(): Record<string, unknown> {
    // Include all event metadata
    return {
      id: this.id,
      aggregateId: this.aggregateId,
      version: this.version,
      occurredAt: this.occurredAt.toISOString(),
      tenantId: this.tenantId,
      eventType: this.eventType,
      schemaVersion: this.schemaVersion,
      accountCode: this.accountCode,
      postingAllowed: this.postingAllowed,
      ...(this.correlationId && { correlationId: this.correlationId }),
      ...(this.causationId && { causationId: this.causationId }),
    };
  }

  private validate(): void {
    // Validate base event properties
    if (!this.id || typeof this.id !== 'string') {
      throw new TypeError('id must be a non-empty string');
    }

    if (!(this.occurredAt instanceof Date) || Number.isNaN(this.occurredAt.getTime())) {
      throw new TypeError('occurredAt must be a valid Date');
    }

    if (!Number.isInteger(this.version) || this.version < 1) {
      throw new TypeError('version must be a positive integer');
    }
    if (typeof this.aggregateId !== 'string' || !isNonEmpty(this.aggregateId)) {
      throw new TypeError('aggregateId must be a non-empty string');
    }
    if (typeof this.tenantId !== 'string' || !isNonEmpty(this.tenantId)) {
      throw new TypeError('tenantId must be a non-empty string');
    }

    // accountCode must be non-empty and well-formed
    if (typeof this.accountCode !== 'string' || !isNonEmpty(this.accountCode)) {
      throw new TypeError(
        'AccountPostingPolicyChangedEvent: accountCode must be a non-empty string.',
      );
    }
    const CODE = /^[A-Z0-9._-]{1,64}$/i;
    if (!CODE.test(this.accountCode.trim())) {
      throw new TypeError(
        `AccountPostingPolicyChangedEvent: accountCode invalid (allowed A-Z 0-9 . _ -, max 64): ${this.accountCode}`,
      );
    }
    if (typeof this.postingAllowed !== 'boolean') {
      throw new TypeError('AccountPostingPolicyChangedEvent: postingAllowed must be boolean.');
    }

    // Business rule validation
    this.validateNotTrivialNoop();
  }

  private validateNotTrivialNoop(): void {
    // Note: We can't check against previous state here, but we can validate business rules
    // For example, if there are certain accounts that should never change posting policy
    if (this.accountCode.startsWith('SYSTEM-')) {
      throw createBusinessError(
        'SYSTEM_ACCOUNT_POLICY_CHANGE_FORBIDDEN',
        'Cannot change posting policy for system accounts',
        this.accountCode,
        { operation: 'validate-posting-policy-change' }
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
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) {
    throw new TypeError(`${label} must be a positive integer`);
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
  return isNonEmpty(v) ? v.trim() : undefined;
}

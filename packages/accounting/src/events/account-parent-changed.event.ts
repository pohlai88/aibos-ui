import type { DomainEvent } from '@aibos/eventsourcing';

import { omitUndefined } from '../utils';
import { randomUUID } from 'node:crypto';

export class AccountParentChangedEvent implements DomainEvent {
  public static readonly TYPE = 'AccountParentChanged' as const;
  /** Event schema version for future migrations */
  public static readonly EVENT_SCHEMA_VERSION = 1;
  public readonly eventType = AccountParentChangedEvent.TYPE;
  public readonly schemaVersion = AccountParentChangedEvent.EVENT_SCHEMA_VERSION;

  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;

  public readonly accountCode: string;
  public readonly oldParentAccountCode: string | undefined;
  public readonly newParentAccountCode: string | undefined;

  constructor(
    accountCode: string,
    oldParentAccountCode: string | undefined,
    newParentAccountCode: string | undefined,
    aggregateId: string,
    version: number,
    tenantId: string,
    id?: string, // Add optional ID parameter
    occurredAt?: Date, // Add optional timestamp
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
    this.oldParentAccountCode = oldParentAccountCode;
    this.newParentAccountCode = newParentAccountCode;
    this.validate();
    Object.freeze(this);
  }

  /** Factory from plain payload + meta */
  public static from(
    payload: {
      accountCode: string;
      oldParentAccountCode?: string | undefined;
      newParentAccountCode?: string | undefined;
    },
    meta: {
      aggregateId: string;
      version: number;
      tenantId: string;
      correlationId?: string;
      causationId?: string;
    },
  ): AccountParentChangedEvent {
    // Meta validation for better error locality
    if (!expectString(meta.aggregateId, 'meta.aggregateId')) {
      /* type guard */
    }
    if (!expectString(meta.tenantId, 'meta.tenantId')) {
      /* type guard */
    }
    if (!Number.isInteger(meta.version) || meta.version < 1) {
      throw new TypeError('meta.version must be a positive integer');
    }
    return new AccountParentChangedEvent(
      payload.accountCode,
      payload.oldParentAccountCode,
      payload.newParentAccountCode,
      meta.aggregateId,
      meta.version,
      meta.tenantId,
      undefined, // id - will be generated
      undefined, // occurredAt - will be set to now
      meta.correlationId,
      meta.causationId,
    );
  }

  /** Deserialize from stored data */
  public static deserialize(data: Record<string, unknown>): AccountParentChangedEvent {
    // Validate event type first
    if (data.eventType !== AccountParentChangedEvent.TYPE) {
      throw new TypeError(
        `Expected eventType "${AccountParentChangedEvent.TYPE}", got "${data.eventType}"`,
      );
    }

    // Schema version (lenient): default 1; require integer >=1 if provided
    const rawSchema = (data as Record<string, unknown>).schemaVersion;
    const _schemaVersion =
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

    return new AccountParentChangedEvent(
      expectString(data.accountCode, 'accountCode'),
      optionalString(data.oldParentAccountCode),
      optionalString(data.newParentAccountCode),
      expectString(data.aggregateId, 'aggregateId'),
      expectNumber(data.version, 'version'),
      expectString(data.tenantId, 'tenantId'),
      expectString(data.id, 'id'), // id
      occurredAt, // timestamp (validated above)
      optionalString(data.correlationId),
      optionalString(data.causationId),
    );
  }

  /** Rooting if new parent is undefined; reparenting otherwise */
  public isRooting(): boolean {
    return this.newParentAccountCode === undefined;
  }
  public isReparenting(): boolean {
    return this.newParentAccountCode !== undefined;
  }

  /** Check if this event represents making the account a root account */
  public isMakingRoot(): boolean {
    return this.oldParentAccountCode !== undefined && this.newParentAccountCode === undefined;
  }

  /** Check if this event represents removing from root */
  public isMakingChild(): boolean {
    return this.oldParentAccountCode === undefined && this.newParentAccountCode !== undefined;
  }

  /** Get a human-readable description of the change */
  public getChangeDescription(): string {
    if (this.isMakingRoot()) {
      return `Account ${this.accountCode} moved to root level`;
    } else if (this.isMakingChild()) {
      return `Account ${this.accountCode} became child of ${this.newParentAccountCode}`;
    } else {
      return `Account ${this.accountCode} reparented from ${this.oldParentAccountCode} to ${this.newParentAccountCode}`;
    }
  }

  /** Utility method for debugging */
  public toString(): string {
    return `AccountParentChangedEvent[${this.accountCode}, v${this.version}, tenant:${this.tenantId}]`;
  }

  serialize(): Record<string, unknown> {
    // Include all essential event properties
    const out: Record<string, unknown> = {
      id: this.id,
      aggregateId: this.aggregateId,
      version: this.version,
      occurredAt: this.occurredAt.toISOString(),
      tenantId: this.tenantId,
      eventType: this.eventType,
      schemaVersion: this.schemaVersion,
      accountCode: this.accountCode,
    };

    // Add correlation/causation IDs if present
    if (this.correlationId !== undefined) out.correlationId = this.correlationId;
    if (this.causationId !== undefined) out.causationId = this.causationId;

    // Add parent codes if defined
    if (this.oldParentAccountCode !== undefined)
      out.oldParentAccountCode = this.oldParentAccountCode;
    if (this.newParentAccountCode !== undefined)
      out.newParentAccountCode = this.newParentAccountCode;

    return out;
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
      throw new Error('version must be a positive integer');
    }

    const nonEmpty = (v: string, label: string) => {
      if (typeof v !== 'string' || v.trim().length === 0) {
        throw new Error(label + ' must be a non-empty string');
      }
      return v.trim();
    };
    const CODE = /^[A-Z0-9._-]{1,64}$/i;
    const okCode = (v: string, label: string) => {
      const t = nonEmpty(v, label);
      if (!CODE.test(t)) {
        throw new Error(label + ' has invalid format (allowed A-Z 0-9 . _ -, max 64): ' + v);
      }
      return t;
    };

    const acct = okCode(this.accountCode, 'accountCode');
    const old =
      this.oldParentAccountCode === undefined
        ? undefined
        : okCode(this.oldParentAccountCode, 'oldParentAccountCode');
    const neu =
      this.newParentAccountCode === undefined
        ? undefined
        : okCode(this.newParentAccountCode, 'newParentAccountCode');

    // Enhanced no-op detection that considers undefined meanings
    const isTrueNoop =
      (old === undefined && neu === undefined) ||
      (old !== undefined && neu !== undefined && old === neu);

    if (isTrueNoop) {
      throw new Error('AccountParentChangedEvent would cause no effective change');
    }

    // Self-parent guards
    if (old !== undefined && old === acct) {
      throw new Error('oldParentAccountCode must not equal accountCode.');
    }
    if (neu !== undefined && neu === acct) {
      throw new Error('newParentAccountCode must not equal accountCode.');
    }

    // Prevent circular parent references (basic check)
    if (neu !== undefined) {
      this.validateNoCircularReference(acct, neu);
    }
  }

  private validateNoCircularReference(accountCode: string, potentialParentCode: string): void {
    // Basic check - in practice, you might need to check against current hierarchy state
    if (accountCode === potentialParentCode) {
      throw new Error('Account cannot be its own parent');
    }

    // Note: Full circular reference detection requires checking the entire parent chain
    // This would typically be done in the aggregate, not the event
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
function optionalString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

import type { DomainEvent } from '@aibos/eventsourcing';

import { JournalEntryLine } from '../domain/journal-entry-line';
import { omitUndefined, isNonEmpty, toMinorUnits, fromMinorUnits, isEmpty } from '../utils';
import { randomUUID } from 'node:crypto';
import { createBusinessError } from '../utils/error-utilities';

// Constants for error messages
const PERIOD_CLOSED_MESSAGE = 'Cannot post to closed period {period}. Use adjusting entry flag if authorized.';
const PERIOD_LOCKED_MESSAGE = 'Period {period} is locked and cannot accept new entries.';
const VALIDATE_PERIOD_STATUS_OPERATION = 'validate-period-status';

export class JournalEntryPostedEvent implements DomainEvent {
  public static readonly TYPE = 'JournalEntryPosted' as const;
  /** Event schema version for future migrations */
  public static readonly EVENT_SCHEMA_VERSION = 1;
  public readonly eventType = JournalEntryPostedEvent.TYPE;

  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;

  public readonly journalEntryId: string;
  public readonly entries: ReadonlyArray<JournalEntryLine>;
  public readonly reference: string;
  public readonly description: string;
  public readonly postedBy: string;

  /** Event payload schema version (for safe evolution) */
  public readonly schemaVersion: number = JournalEntryPostedEvent.EVENT_SCHEMA_VERSION;
  /** GL posting date (may differ from occurredAt/event time) */
  public readonly postingDate?: Date;
  /** Ledger/book identifier (e.g., PRIMARY, TAX, STAT) */
  public readonly book?: string;

  // Accounting Period Management (MFRS Compliance)
  /** Accounting period for this entry (e.g., "2024-01") */
  public readonly accountingPeriod: string;
  /** Period status at time of posting */
  public readonly periodStatus: 'OPEN' | 'CLOSED' | 'LOCKED' | 'FINALIZED';
  /** Whether this is an adjusting entry */
  public readonly isAdjustingEntry: boolean;
  /** Whether this is a closing entry */
  public readonly isClosingEntry: boolean;
  /** Whether this is a reversing entry */
  public readonly isReversingEntry: boolean;

  // Multi-Currency Support (SEA Markets)
  /** Transaction currency code (e.g., "MYR", "SGD", "USD") */
  public readonly currencyCode: string;
  /** Base/reporting currency code */
  public readonly baseCurrencyCode: string;
  /** Exchange rate used for conversion */
  public readonly exchangeRate?: number;
  /** Exchange rate date */
  public readonly exchangeRateDate?: Date;
  /** Whether this is an FX revaluation entry */
  public readonly isFXRevaluation: boolean;

  // Tax Compliance (Malaysian SST & SEA Markets)
  /** Tax lines for this entry */
  public readonly taxLines: Array<{
    taxCode: string; // "SST-6%", "GST-7%", "VAT-10%"
    taxAmount: number;
    jurisdiction: string; // "MY", "SG", "VN", "ID", "TH", "PH"
    isRecoverable: boolean;
    taxType: 'INPUT' | 'OUTPUT' | 'REVERSE_CHARGE';
  }>;
  /** Total tax amount across all lines */
  public readonly totalTaxAmount: number;

  // MFRS Compliance Metadata
  /** Reporting standard used (default: MFRS) */
  public readonly reportingStandard: 'MFRS' | 'IFRS' | 'GAAP' | 'LOCAL';
  /** Country code for compliance */
  public readonly countryCode: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH';
  /** Industry type for specialized accounting */
  public readonly industryType:
    | 'GENERAL'
    | 'MANUFACTURING'
    | 'RETAIL'
    | 'SERVICES'
    | 'NON_PROFIT'
    | 'REAL_ESTATE';
  /** Fiscal year for this entry */
  public readonly fiscalYear: number;

  // Approval & Compliance
  /** Approval workflow information */
  public readonly approval: {
    required: boolean;
    approvedBy?: string;
    approvalDate?: Date;
    approvalLevel: 'AUTO' | 'MANAGER' | 'CONTROLLER' | 'CFO' | 'AUDIT_COMMITTEE';
    approvalLimit: number;
    requiresExplanation: boolean;
    explanation?: string;
  };
  /** Supporting documentation references */
  public readonly supportingDocuments: Array<{
    documentId: string;
    documentType: 'INVOICE' | 'RECEIPT' | 'CONTRACT' | 'BANK_STATEMENT' | 'PAYMENT_VOUCHER';
    documentNumber: string;
    amount: number;
    currency: string;
    issueDate: Date;
    isVerified: boolean;
  }>;

  // NOTE: Removed unused `eventId` to prevent confusion; `id` is the event id.

  /** Optional creation options for forward-compat and idempotency */
  public static CreateOpts = {} as {
    /** Override auto-generated id (e.g., supply ULID for idempotency) */
    id?: string;
    /** Payload schema version; defaults to 1 */
    schemaVersion?: number;
    /** GL posting date */
    postingDate?: Date;
    /** Ledger/book code */
    book?: string;
  };

  // Cached totals to avoid recomputation
  private readonly _totalDebitCents: bigint;
  private readonly _totalCreditCents: bigint;

  constructor(
    journalEntryId: string,
    entries: JournalEntryLine[],
    reference: string,
    description: string,
    postedBy: string,
    tenantId: string,
    version: number,
    correlationId?: string,
    causationId?: string,
    options?: {
      id?: string;
      schemaVersion?: number;
      postingDate?: Date;
      book?: string;
      // Accounting Period Management
      accountingPeriod?: string;
      periodStatus?: 'OPEN' | 'CLOSED' | 'LOCKED' | 'FINALIZED';
      isAdjustingEntry?: boolean;
      isClosingEntry?: boolean;
      isReversingEntry?: boolean;
      // Multi-Currency Support
      currencyCode?: string;
      baseCurrencyCode?: string;
      exchangeRate?: number;
      exchangeRateDate?: Date;
      isFXRevaluation?: boolean;
      // Tax Compliance
      taxLines?: Array<{
        taxCode: string;
        taxAmount: number;
        jurisdiction: string;
        isRecoverable: boolean;
        taxType: 'INPUT' | 'OUTPUT' | 'REVERSE_CHARGE';
      }>;
      // MFRS Compliance
      reportingStandard?: 'MFRS' | 'IFRS' | 'GAAP' | 'LOCAL';
      countryCode?: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH';
      industryType?:
        | 'GENERAL'
        | 'MANUFACTURING'
        | 'RETAIL'
        | 'SERVICES'
        | 'NON_PROFIT'
        | 'REAL_ESTATE';
      fiscalYear?: number;
      // Approval & Compliance
      approval?: {
        required: boolean;
        approvedBy?: string;
        approvalDate?: Date;
        approvalLevel: 'AUTO' | 'MANAGER' | 'CONTROLLER' | 'CFO' | 'AUDIT_COMMITTEE';
        approvalLimit: number;
        requiresExplanation: boolean;
        explanation?: string;
      };
      supportingDocuments?: Array<{
        documentId: string;
        documentType: 'INVOICE' | 'RECEIPT' | 'CONTRACT' | 'BANK_STATEMENT' | 'PAYMENT_VOUCHER';
        documentNumber: string;
        amount: number;
        currency: string;
        issueDate: Date;
        isVerified: boolean;
      }>;
    },
  ) {
    // Use omitUndefined to handle exactOptionalPropertyTypes safely
    const cleanOptions = omitUndefined({
      id: options?.id ?? randomUUID(),
      correlationId,
      causationId,
      schemaVersion: options?.schemaVersion,
    });

    this.id = cleanOptions.id;
    this.aggregateId = `journal-entry-${journalEntryId}`;
    this.version = version;
    this.occurredAt = new Date();
    this.tenantId = tenantId;
    this.correlationId = cleanOptions.correlationId;
    this.causationId = cleanOptions.causationId;
    if (cleanOptions.schemaVersion !== undefined) this.schemaVersion = cleanOptions.schemaVersion;
    if (options?.postingDate) this.postingDate = new Date(options.postingDate);
    if (options?.book) this.book = options.book;

    this.journalEntryId = journalEntryId;
    this.entries = entries;
    // Normalize strings to keep store clean
    this.reference = reference.trim();
    this.description = description.trim();
    this.postedBy = postedBy.trim();

    // Accounting Period Management (MFRS Compliance)
    this.accountingPeriod = options?.accountingPeriod ?? this.getDefaultAccountingPeriod();
    this.periodStatus = options?.periodStatus ?? 'OPEN';
    this.isAdjustingEntry = options?.isAdjustingEntry ?? false;
    this.isClosingEntry = options?.isClosingEntry ?? false;
    this.isReversingEntry = options?.isReversingEntry ?? false;

    // Multi-Currency Support (SEA Markets)
    this.currencyCode = options?.currencyCode ?? 'MYR'; // Default to Malaysian Ringgit
    this.baseCurrencyCode = options?.baseCurrencyCode ?? 'MYR';

    // Use omitUndefined to handle exactOptionalPropertyTypes safely
    const cleanExchangeOptions = omitUndefined({
      exchangeRate: options?.exchangeRate,
      exchangeRateDate: options?.exchangeRateDate,
    });

    this.exchangeRate = cleanExchangeOptions.exchangeRate;
    this.exchangeRateDate = cleanExchangeOptions.exchangeRateDate;
    this.isFXRevaluation = options?.isFXRevaluation ?? false;

    // Tax Compliance (Malaysian SST & SEA Markets)
    this.taxLines = options?.taxLines ?? [];
    this.totalTaxAmount = this.taxLines.reduce((sum, line) => sum + line.taxAmount, 0);

    // MFRS Compliance Metadata
    this.reportingStandard = options?.reportingStandard ?? 'MFRS';
    this.countryCode = options?.countryCode ?? 'MY';
    this.industryType = options?.industryType ?? 'GENERAL';
    this.fiscalYear = options?.fiscalYear ?? new Date().getFullYear();

    // Approval & Compliance
    this.approval = options?.approval ?? {
      required: false,
      approvalLevel: 'AUTO',
      approvalLimit: 0,
      requiresExplanation: false,
    };
    this.supportingDocuments = options?.supportingDocuments ?? [];

    // Convention guard (constructor path is always consistent, but keep it explicit)
    assertJournalAggregateId(this.aggregateId, this.journalEntryId);

    // Cache totals on construction
    this._totalDebitCents = this.entries.reduce(
      (accumulator, entry) => accumulator + toCents(entry.debitAmount),
      0n,
    );
    this._totalCreditCents = this.entries.reduce(
      (accumulator, entry) => accumulator + toCents(entry.creditAmount),
      0n,
    );

    this.validate();
    // Freeze shallow + entries array (assumes JournalEntryLine is already immutable)
    Object.freeze(this.entries);
    Object.freeze(this);
  }

  public serialize(): Record<string, unknown> {
    return {
      id: this.id,
      aggregateId: this.aggregateId,
      version: this.version,
      occurredAt: this.occurredAt.toISOString(),
      tenantId: this.tenantId,
      eventType: this.eventType,
      schemaVersion: this.schemaVersion,
      ...(this.correlationId ? { correlationId: this.correlationId } : {}),
      ...(this.causationId ? { causationId: this.causationId } : {}),
      journalEntryId: this.journalEntryId,
      entries: this.entries.map((entry) => ({
        accountCode: entry.accountCode,
        description: entry.description,
        debitAmount: entry.debitAmount, // legacy major units
        creditAmount: entry.creditAmount, // legacy major units
        // precision-safe cents for new readers
        debitCents: toCents(entry.debitAmount).toString(),
        creditCents: toCents(entry.creditAmount).toString(),
        ...(entry.reference ? { reference: entry.reference } : {}),
      })),
      reference: this.reference,
      description: this.description,
      postedBy: this.postedBy,
      // Totals in both representations for quick auditing
      totalDebit: this.totalDebit(), // number
      totalCredit: this.totalCredit(), // number
      totalDebitCents: this.totalDebitCents().toString(),
      totalCreditCents: this.totalCreditCents().toString(),
      ...(this.postingDate ? { postingDate: this.postingDate.toISOString().slice(0, 10) } : {}),
      ...(this.book ? { book: this.book } : {}),
    };
  }

  public static deserialize(data: Record<string, unknown>): JournalEntryPostedEvent {
    // Validate event type first
    if (data.eventType !== JournalEntryPostedEvent.TYPE) {
      throw new TypeError(
        `Expected eventType "${JournalEntryPostedEvent.TYPE}", got "${data.eventType}"`,
      );
    }

    // schemaVersion: default 1; require integer >= 1 if provided (forward-lenient)
    const rawSchema = (data as Record<string, unknown>).schemaVersion;
    const schemaVersion =
      rawSchema === undefined
        ? 1
        : Number.isInteger(rawSchema as number) && (rawSchema as number) >= 1
          ? (rawSchema as number)
          : (() => {
              throw new TypeError('schemaVersion must be a positive integer');
            })();

    const id = expectString(data.id, 'id');
    const aggregateId = expectString(data.aggregateId, 'aggregateId');
    const version = expectNumber(data.version, 'version');
    const occurredAtIso = expectString(data.occurredAt, 'occurredAt');
    const occurredAt = new Date(occurredAtIso);
    if (Number.isNaN(occurredAt.getTime()))
      throw new TypeError(`occurredAt invalid ISO: ${occurredAtIso}`);
    const tenantId = expectString(data.tenantId, 'tenantId');
    const eventSchemaVersion = schemaVersion;
    const postingDateString = optionalString((data as Record<string, unknown>).postingDate);
    const postingDate = postingDateString ? new Date(postingDateString) : undefined;
    if (postingDate && Number.isNaN(postingDate.getTime()))
      throw new TypeError(`postingDate invalid: ${postingDateString}`);
    const book = optionalString((data as Record<string, unknown>).book);

    const journalEntryId = expectString(data.journalEntryId, 'journalEntryId');
    const reference = expectString(data.reference, 'reference');
    const description = expectString(data.description, 'description');
    const postedBy = expectString(data.postedBy, 'postedBy');
    const correlationId = optionalString(data.correlationId);
    const causationId = optionalString(data.causationId);

    const rawEntries = Array.isArray(data.entries) ? (data.entries as unknown[]) : [];
    if (isEmpty(rawEntries)) throw new TypeError('entries must be a non-empty array');
    const entries = rawEntries.map((row) => {
      const r = row as Record<string, unknown>;
      // Prefer cents if provided (precision-safe); else fall back to numbers.
      const debitCentsString = optionalString(r.debitCents);
      const creditCentsString = optionalString(r.creditCents);
      const debitAmount =
        debitCentsString !== undefined
          ? centsToNumber(BigInt(debitCentsString))
          : expectNumber(r.debitAmount ?? 0, 'entries[].debitAmount');
      const creditAmount =
        creditCentsString !== undefined
          ? centsToNumber(BigInt(creditCentsString))
          : expectNumber(r.creditAmount ?? 0, 'entries[].creditAmount');
      return new JournalEntryLine(
        omitUndefined({
          accountCode: expectString(r.accountCode, 'entries[].accountCode'),
          description: expectString(r.description, 'entries[].description'),
          debitAmount,
          creditAmount,
          reference: optionalString(r.reference),
        }),
      );
    });

    // Hydrate without constructor so we preserve id/aggregateId/occurredAt exactly
    const event = Object.create(JournalEntryPostedEvent.prototype) as JournalEntryPostedEvent;

    // Cache totals for deserialized events
    const totalDebitCents = entries.reduce(
      (accumulator, entry) => accumulator + toCents(entry.debitAmount),
      0n,
    );
    const totalCreditCents = entries.reduce(
      (accumulator, entry) => accumulator + toCents(entry.creditAmount),
      0n,
    );

    // Extract new MFRS compliance fields
    const accountingPeriod = expectString(data.accountingPeriod, 'accountingPeriod');
    const periodStatus = expectString(data.periodStatus, 'periodStatus') as
      | 'OPEN'
      | 'CLOSED'
      | 'LOCKED'
      | 'FINALIZED';
    const isAdjustingEntry = expectBoolean(data.isAdjustingEntry, 'isAdjustingEntry');
    const isClosingEntry = expectBoolean(data.isClosingEntry, 'isClosingEntry');
    const isReversingEntry = expectBoolean(data.isReversingEntry, 'isReversingEntry');

    const currencyCode = expectString(data.currencyCode, 'currencyCode');
    const baseCurrencyCode = expectString(data.baseCurrencyCode, 'baseCurrencyCode');
    const exchangeRate = optionalNumber(data.exchangeRate);
    const exchangeRateDate = optionalString(data.exchangeRateDate)
      ? new Date(optionalString(data.exchangeRateDate)!)
      : undefined;
    const isFXRevaluation = expectBoolean(data.isFXRevaluation, 'isFXRevaluation');

    const taxLines = Array.isArray(data.taxLines)
      ? (data.taxLines as unknown[]).map((line: unknown) => {
          const l = line as Record<string, unknown>;
          return {
            taxCode: expectString(l.taxCode, 'taxLine.taxCode'),
            taxAmount: expectNumber(l.taxAmount, 'taxLine.taxAmount'),
            jurisdiction: expectString(l.jurisdiction, 'taxLine.jurisdiction'),
            isRecoverable: expectBoolean(l.isRecoverable, 'taxLine.isRecoverable'),
            taxType: expectString(l.taxType, 'taxLine.taxType') as
              | 'INPUT'
              | 'OUTPUT'
              | 'REVERSE_CHARGE',
          };
        })
      : [];
    const totalTaxAmount = expectNumber(data.totalTaxAmount, 'totalTaxAmount');

    const reportingStandard = expectString(data.reportingStandard, 'reportingStandard') as
      | 'MFRS'
      | 'IFRS'
      | 'GAAP'
      | 'LOCAL';
    const countryCode = expectString(data.countryCode, 'countryCode') as
      | 'MY'
      | 'SG'
      | 'VN'
      | 'ID'
      | 'TH'
      | 'PH';
    const industryType = expectString(data.industryType, 'industryType') as
      | 'GENERAL'
      | 'MANUFACTURING'
      | 'RETAIL'
      | 'SERVICES'
      | 'NON_PROFIT'
      | 'REAL_ESTATE';
    const fiscalYear = expectNumber(data.fiscalYear, 'fiscalYear');

    const approval = data.approval as {
      required: boolean;
      approvedBy?: string;
      approvalDate?: Date;
      approvalLevel: 'AUTO' | 'MANAGER' | 'CONTROLLER' | 'CFO' | 'AUDIT_COMMITTEE';
      approvalLimit: number;
      requiresExplanation: boolean;
      explanation?: string;
    };

    const supportingDocuments = Array.isArray(data.supportingDocuments)
      ? (data.supportingDocuments as unknown[]).map((document_: unknown) => {
          const d = document_ as Record<string, unknown>;
          return {
            documentId: expectString(d.documentId, 'supportingDocument.documentId'),
            documentType: expectString(d.documentType, 'supportingDocument.documentType') as
              | 'INVOICE'
              | 'RECEIPT'
              | 'CONTRACT'
              | 'BANK_STATEMENT'
              | 'PAYMENT_VOUCHER',
            documentNumber: expectString(d.documentNumber, 'supportingDocument.documentNumber'),
            amount: expectNumber(d.amount, 'supportingDocument.amount'),
            currency: expectString(d.currency, 'supportingDocument.currency'),
            issueDate: new Date(expectString(d.issueDate, 'supportingDocument.issueDate')),
            isVerified: expectBoolean(d.isVerified, 'supportingDocument.isVerified'),
          };
        })
      : [];

    Object.assign(event, {
      id,
      aggregateId,
      version,
      occurredAt,
      tenantId,
      correlationId,
      causationId,
      eventType: JournalEntryPostedEvent.TYPE,
      schemaVersion: eventSchemaVersion,
      postingDate,
      book,
      journalEntryId,
      entries,
      reference,
      description,
      postedBy,
      // Accounting Period Management
      accountingPeriod,
      periodStatus,
      isAdjustingEntry,
      isClosingEntry,
      isReversingEntry,
      // Multi-Currency Support
      currencyCode,
      baseCurrencyCode,
      exchangeRate,
      exchangeRateDate,
      isFXRevaluation,
      // Tax Compliance
      taxLines,
      totalTaxAmount,
      // MFRS Compliance
      reportingStandard,
      countryCode,
      industryType,
      fiscalYear,
      // Approval & Compliance
      approval,
      supportingDocuments,
      _totalDebitCents: totalDebitCents,
      _totalCreditCents: totalCreditCents,
    });
    // Convention guard before validate()
    assertJournalAggregateId(event.aggregateId, event.journalEntryId);
    event.validate();
    // Freeze shallow + entries array (assumes JournalEntryLine is already immutable)
    Object.freeze(event.entries);
    Object.freeze(event);
    return event;
  }

  /** Sum helpers (major units) */
  public totalDebit(): number {
    return centsToNumber(this.totalDebitCents());
  }
  public totalCredit(): number {
    return centsToNumber(this.totalCreditCents());
  }
  /** Precision-safe sums in cents (bigint) - uses cached values */
  public totalDebitCents(): bigint {
    return this._totalDebitCents;
  }
  public totalCreditCents(): bigint {
    return this._totalCreditCents;
  }

  private validate(): void {
    const nonEmpty = (v: string, label: string) => {
      if (typeof v !== 'string' || !isNonEmpty(v))
        throw new TypeError(`${label} must be a non-empty string`);
    };
    nonEmpty(this.tenantId, 'tenantId');
    nonEmpty(this.journalEntryId, 'journalEntryId');
    nonEmpty(this.reference, 'reference');
    nonEmpty(this.description, 'description');
    nonEmpty(this.postedBy, 'postedBy');
    if (!Array.isArray(this.entries) || isEmpty(this.entries)) {
      throw new TypeError('entries must be a non-empty array');
    }

    // Balanced check: exact equality in cents
    const deb = this.totalDebitCents();
    const cre = this.totalCreditCents();
    if (deb !== cre) {
      throw new TypeError(
        `journal entry not balanced: totalDebitCents=${deb} totalCreditCents=${cre}`,
      );
    }

    // Non-zero journal total
    if (deb === 0n) {
      throw new TypeError('journal entry total must be > 0');
    }

    // Per-line constraint: at most one side positive
    for (const [index, entry] of this.entries.entries()) {
      const debitCents = toCents(entry.debitAmount);
      const creditCents = toCents(entry.creditAmount);
      if (debitCents > 0n && creditCents > 0n) {
        throw new TypeError(`entries[${index}] cannot have both debit and credit > 0`);
      }
    }

    // AggregateId convention check (strict equality)
    assertJournalAggregateId(this.aggregateId, this.journalEntryId);
    // Version rules
    if (!Number.isInteger(this.version) || this.version < 1) {
      throw new TypeError(`version must be a positive integer, got: ${this.version}`);
    }
    // schemaVersion rules
    if (!Number.isInteger(this.schemaVersion) || this.schemaVersion < 1) {
      throw new TypeError(`schemaVersion must be a positive integer, got: ${this.schemaVersion}`);
    }
    // postingDate sanity (if present): ISO date (YYYY-MM-DD) semantics are caller's job;
    // here we only validate Date-ness; advanced rules can be added (period locks, etc.)
    if (this.postingDate && Number.isNaN(this.postingDate.getTime())) {
      throw new TypeError('postingDate must be a valid Date when provided');
    }
    if (this.book !== undefined) {
      if (typeof this.book !== 'string' || !isNonEmpty(this.book)) {
        throw new TypeError('book must be a non-empty string when provided');
      }
    }
    // occurredAt sanity
    if (!(this.occurredAt instanceof Date) || Number.isNaN(this.occurredAt.getTime())) {
      throw new TypeError('occurredAt must be a valid Date');
    }

    // Additional MFRS compliance validations
    this.validateAccountingPeriod();
    this.validateCurrency();
    this.validateTaxCompliance();
  }

  /**
   * Get default accounting period based on posting date
   */
  private getDefaultAccountingPeriod(): string {
    const date = this.postingDate ?? this.occurredAt;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-${month.toString().padStart(2, '0')}`;
  }

  /**
   * Validate accounting period compliance
   */
  private validateAccountingPeriod(): void {
    if (!this.accountingPeriod || typeof this.accountingPeriod !== 'string') {
      throw new TypeError('accountingPeriod must be a non-empty string');
    }

    // Validate period format (YYYY-MM)
    const periodPattern = /^\d{4}-\d{2}$/;
    if (!periodPattern.test(this.accountingPeriod)) {
      throw new TypeError('accountingPeriod must be in YYYY-MM format');
    }

    // Validate period status
    const validStatuses = ['OPEN', 'CLOSED', 'LOCKED', 'FINALIZED'];
    if (!validStatuses.includes(this.periodStatus)) {
      throw new TypeError(`periodStatus must be one of: ${validStatuses.join(', ')}`);
    }

    // MFRS compliance: Check if posting to closed period is allowed
    if (this.periodStatus === 'CLOSED' && !this.isAdjustingEntry) {
      throw createBusinessError(
        'PERIOD_CLOSED',
        PERIOD_CLOSED_MESSAGE.replace('{period}', this.accountingPeriod),
        this.accountingPeriod,
        { operation: VALIDATE_PERIOD_STATUS_OPERATION }
      );
    }

    if (this.periodStatus === 'LOCKED') {
      throw createBusinessError(
        'PERIOD_LOCKED',
        PERIOD_LOCKED_MESSAGE.replace('{period}', this.accountingPeriod),
        this.accountingPeriod,
        { operation: VALIDATE_PERIOD_STATUS_OPERATION }
      );
    }

    if (this.periodStatus === 'FINALIZED') {
      throw createBusinessError(
        'PERIOD_FINALIZED',
        `Period ${this.accountingPeriod} is finalized and cannot accept any entries.`,
        this.accountingPeriod,
        { operation: VALIDATE_PERIOD_STATUS_OPERATION }
      );
    }
  }

  /**
   * Validate currency compliance
   */
  private validateCurrency(): void {
    if (!this.currencyCode || typeof this.currencyCode !== 'string') {
      throw new TypeError('currencyCode must be a non-empty string');
    }

    if (!this.baseCurrencyCode || typeof this.baseCurrencyCode !== 'string') {
      throw new TypeError('baseCurrencyCode must be a non-empty string');
    }

    // Validate currency codes (3-letter ISO codes)
    const currencyPattern = /^[A-Z]{3}$/;
    if (!currencyPattern.test(this.currencyCode)) {
      throw new TypeError('currencyCode must be a valid 3-letter ISO currency code');
    }

    if (!currencyPattern.test(this.baseCurrencyCode)) {
      throw new TypeError('baseCurrencyCode must be a valid 3-letter ISO currency code');
    }

    // Validate exchange rate for foreign currency
    if (this.currencyCode !== this.baseCurrencyCode) {
      if (!this.exchangeRate || this.exchangeRate <= 0) {
        throw new TypeError('Exchange rate required for foreign currency entries');
      }
      if (!this.exchangeRateDate) {
        throw new TypeError('Exchange rate date required for foreign currency entries');
      }
    }
  }

  /**
   * Validate tax compliance
   */
  private validateTaxCompliance(): void {
    // Validate tax lines
    if (!Array.isArray(this.taxLines)) {
      throw new TypeError('taxLines must be an array');
    }

    for (const taxLine of this.taxLines) {
      if (!taxLine.taxCode || typeof taxLine.taxCode !== 'string') {
        throw new TypeError('taxLine.taxCode must be a non-empty string');
      }
      if (typeof taxLine.taxAmount !== 'number' || taxLine.taxAmount < 0) {
        throw new TypeError('taxLine.taxAmount must be a non-negative number');
      }
      if (!taxLine.jurisdiction || typeof taxLine.jurisdiction !== 'string') {
        throw new TypeError('taxLine.jurisdiction must be a non-empty string');
      }
      if (typeof taxLine.isRecoverable !== 'boolean') {
        throw new TypeError('taxLine.isRecoverable must be a boolean');
      }
      if (!['INPUT', 'OUTPUT', 'REVERSE_CHARGE'].includes(taxLine.taxType)) {
        throw new TypeError('taxLine.taxType must be INPUT, OUTPUT, or REVERSE_CHARGE');
      }
    }

    // Validate total tax amount matches sum of tax lines
    const calculatedTotal = this.taxLines.reduce((sum, line) => sum + line.taxAmount, 0);
    if (Math.abs(this.totalTaxAmount - calculatedTotal) > 0.01) {
      throw new TypeError('totalTaxAmount must match sum of tax lines');
    }
  }
}

// -------- helpers ----------
function assertJournalAggregateId(aggregateId: string, journalEntryId: string): void {
  const expected = `journal-entry-${journalEntryId}`;
  if (aggregateId !== expected) {
    throw new TypeError(
      `aggregateId "${aggregateId}" must equal "${expected}" (journalEntryId bound)`,
    );
  }
}

function expectString(v: unknown, label: string): string {
  if (typeof v !== 'string' || !isNonEmpty(v))
    throw new TypeError(`${label} must be a non-empty string`);
  return v.trim();
}
function expectNumber(v: unknown, label: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v))
    throw new TypeError(`${label} must be a finite number`);
  return v;
}
function optionalString(v: unknown): string | undefined {
  return isNonEmpty(v) ? v.trim() : undefined;
}

function expectBoolean(v: unknown, label: string): boolean {
  if (typeof v !== 'boolean') {
    throw new TypeError(`${label} must be a boolean`);
  }
  return v;
}

function optionalNumber(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  throw new TypeError('Value must be a finite number or undefined');
}
function toCents(amount: number): bigint {
  // enforce <= 2dp by construction; JournalEntryLine already validates.
  return BigInt(toMinorUnits(amount, 2));
}
function centsToNumber(cents: bigint): number {
  return fromMinorUnits(Number(cents), 2);
}

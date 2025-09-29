import type { DomainEvent } from '@aibos/eventsourcing';

import { type PostJournalEntryCommand } from '../commands/post-journal-entry.command';
import { JournalEntryPostedEvent } from '../events/journal-entry-posted.event';
import { JournalEntryLine } from './journal-entry-line';
import { JournalEntryStatus, JournalEntryStatusValidator } from './journal-entry-status.domain';
import { AggregateRoot } from '@aibos/eventsourcing';
import { isNonEmpty } from '../utils';
import { validateJournalEntry, validateAmount, type JournalEntryInput, type JournalLineInput } from '../utils/validation-utilities';
import { 
  createBusinessError,
  createValidationError,
  type ErrorContext 
} from '../utils/error-utilities';

export class JournalEntry extends AggregateRoot {
  private entries: JournalEntryLine[] = [];
  private status: JournalEntryStatus = JournalEntryStatus.DRAFT;
  private reference: string = '';
  private description: string = '';
  private postedAt?: Date;
  private postedBy?: string;

  constructor(
    id: string,
    public readonly _journalEntryId: string = '',
    public readonly _tenantId: string = '',
    public readonly _userId: string = '',
    version: number = 0,
  ) {
    super(id, version);
  }

  public approve(): void {
    const context: ErrorContext = {
      operation: 'approve-journal-entry',
      userId: this._userId,
      tenantId: this._tenantId,
      data: { journalEntryId: this._journalEntryId, currentStatus: this.status }
    };

    if (this.status !== JournalEntryStatus.DRAFT) {
      throw createBusinessError(
        'INVALID_APPROVAL_STATUS',
        `Cannot approve journal entry in ${this.status} status`,
        'JournalEntry',
        context
      );
    }
    this.status = JournalEntryStatus.APPROVED;
  }

  public postEntry(command: PostJournalEntryCommand): void {
    this.validatePosting(command);

    // Convert command entries to JournalEntryLine objects
    this.entries = command.entries.map(
      (entry) =>
        new JournalEntryLine({
          accountCode: entry.accountCode,
          debitAmount: entry.debitAmount,
          creditAmount: entry.creditAmount,
          description: entry.description || command.description || 'Journal entry line',
        }),
    );
    this.reference = command.reference || '';
    this.description = command.description || '';
    this.status = JournalEntryStatus.POSTED;
    this.postedAt = new Date();
    this.postedBy = command.userId;

    this.addEvent(
      new JournalEntryPostedEvent(
        this._journalEntryId,
        this.entries,
        this.reference,
        this.description,
        this.postedBy,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public reverse(reason: string, reversedBy: string): void {
    const context: ErrorContext = {
      operation: 'reverse-journal-entry',
      userId: reversedBy,
      tenantId: this._tenantId,
      data: { journalEntryId: this._journalEntryId, currentStatus: this.status, reason }
    };

    if (!JournalEntryStatusValidator.canReverse(this.status)) {
      throw createBusinessError(
        'INVALID_REVERSAL_STATUS',
        `Cannot reverse journal entry in ${this.status} status`,
        'JournalEntry',
        context
      );
    }

    if (!isNonEmpty(reason)) {
      throw createValidationError(
        'reason',
        'Reversal reason is required',
        reason,
        context
      );
    }

    this.status = JournalEntryStatus.REVERSED;

    // Create reversal entries (opposite of original entries)
    const reversalEntries = this.entries.map(
      (entry) =>
        new JournalEntryLine({
          accountCode: entry.accountCode,
          description: `Reversal: ${entry.description}`,
          debitAmount: entry.creditAmount, // Swap debit/credit
          creditAmount: entry.debitAmount,
          reference: `REV-${this.reference}`,
        }),
    );

    this.addEvent(
      new JournalEntryPostedEvent(
        `REV-${this._journalEntryId}`,
        reversalEntries,
        `REV-${this.reference}`,
        `Reversal: ${this.description} - ${reason}`,
        reversedBy,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public getEntries(): JournalEntryLine[] {
    return [...this.entries];
  }

  public getStatus(): JournalEntryStatus {
    return this.status;
  }

  public getReference(): string {
    return this.reference;
  }

  public getDescription(): string {
    return this.description;
  }

  public getPostedAt(): Date | undefined {
    return this.postedAt;
  }

  public getPostedBy(): string | undefined {
    return this.postedBy;
  }

  public getTotalDebit(): number {
    return this.entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
  }

  public getTotalCredit(): number {
    return this.entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
  }

  public getAccountCodes(): string[] {
    return this.entries.map((entry) => entry.accountCode);
  }

  public isPosted(): boolean {
    return this.status === JournalEntryStatus.POSTED;
  }

  public isReversed(): boolean {
    return this.status === JournalEntryStatus.REVERSED;
  }

  public isDraft(): boolean {
    return this.status === JournalEntryStatus.DRAFT;
  }

  private validatePosting(command: PostJournalEntryCommand): void {
    const context: ErrorContext = {
      operation: 'validate-posting',
      userId: this._userId,
      tenantId: this._tenantId,
      data: { journalEntryId: this._journalEntryId, currentStatus: this.status }
    };

    if (!JournalEntryStatusValidator.canPost(this.status)) {
      throw createBusinessError(
        'INVALID_POSTING_STATUS',
        `Cannot post journal entry in ${this.status} status`,
        'JournalEntry',
        context
      );
    }

    // Additional business validations
    this.validateBusinessRules(command);
  }

  private validateBusinessRules(command: PostJournalEntryCommand): void {
    // Convert command to JournalEntryInput format for Phase 2 utility validation
    const journalEntryInput: JournalEntryInput = {
      date: command.postingDate?.toISOString() || new Date().toISOString(),
      description: command.description || 'Journal Entry',
      entries: command.entries.map(entry => {
        const line: JournalLineInput = {
          account: entry.accountCode,
          currency: entry.currency || command.baseCurrency || 'MYR'
        };
        if (entry.debitAmount > 0) {
          line.debit = entry.debitAmount;
        }
        if (entry.creditAmount > 0) {
          line.credit = entry.creditAmount;
        }
        return line;
      }),
      currency: command.baseCurrency || 'MYR'
    };

    // Use Phase 2 utility for comprehensive validation
    const validationResult = validateJournalEntry(journalEntryInput, { strict: true });
    
    if (!validationResult.isValid) {
      const context: ErrorContext = {
        operation: 'validate-business-rules',
        userId: this._userId,
        tenantId: this._tenantId,
        data: { journalEntryId: this._journalEntryId, validationErrors: validationResult.errors }
      };

      const errorMessages = validationResult.errors.join(', ');
      throw createBusinessError(
        'JOURNAL_ENTRY_VALIDATION_FAILED',
        `Journal entry validation failed: ${errorMessages}`,
        'JournalEntry',
        context
      );
    }

    // Additional business-specific validations
    const maxAmount = 1_000_000; // $1M limit per entry
    for (const entry of command.entries) {
      // Use Phase 2 utility for amount validation
      const amountValidation = validateAmount(entry.debitAmount || entry.creditAmount || 0, 0, maxAmount);
      if (!amountValidation.isValid) {
        const context: ErrorContext = {
          operation: 'validate-entry-amount',
          userId: this._userId,
          tenantId: this._tenantId,
          data: { journalEntryId: this._journalEntryId, entry, amountErrors: amountValidation.errors }
        };

        throw createBusinessError(
          'ENTRY_AMOUNT_VALIDATION_FAILED',
          `Entry amount validation failed: ${amountValidation.errors.join(', ')}`,
          'JournalEntry',
          context
        );
      }
    }

    // Validate reference format (business rule) - only if reference is provided
    if (command.reference && !/^[A-Z0-9-]{3,20}$/.test(command.reference)) {
      const context: ErrorContext = {
        operation: 'validate-reference-format',
        userId: this._userId,
        tenantId: this._tenantId,
        data: { journalEntryId: this._journalEntryId, reference: command.reference }
      };

      throw createValidationError(
        'reference',
        'Reference must be 3-20 alphanumeric characters with hyphens',
        command.reference,
        context
      );
    }
  }

  protected apply(event: DomainEvent): void {
    this.applyEvent(event);
  }

  public static fromEventsStream(streamId: string, events: DomainEvent[]): JournalEntry {
    const journalEntryId = streamId.replace('journal-entry-', '');
    const journalEntry = new JournalEntry(journalEntryId, journalEntryId, 'unknown', 'system');

    for (const event of events) {
      journalEntry.applyEvent(event);
    }

    return journalEntry;
  }

  private applyEvent(event: DomainEvent): void {
    switch (event.constructor.name) {
      case 'JournalEntryPostedEvent':
        this.applyJournalEntryPosted(event as JournalEntryPostedEvent);
        break;
    }
  }

  private applyJournalEntryPosted(event: JournalEntryPostedEvent): void {
    this.entries = [...event.entries];
    this.reference = event.reference;
    this.description = event.description;
    this.status = JournalEntryStatus.POSTED;
    this.postedAt = event.occurredAt;
    this.postedBy = event.postedBy;
  }
}

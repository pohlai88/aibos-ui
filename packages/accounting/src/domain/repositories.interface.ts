import type { Account } from './account.domain';
import type { JournalEntry } from './journal-entry';
import type { GeneralLedgerEntry } from './accounting-entities';
import type { DomainEvent } from '@aibos/eventsourcing';
import type { EntityManager } from 'typeorm';

export interface EventStore {
  append(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number,
    tenantId: string,
    idempotencyKey?: string,
  ): Promise<void>;
  appendWithTransaction(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number,
    tenantId: string,
    idempotencyKey?: string,
  ): Promise<EntityManager>;
  getEvents(streamId: string, fromVersion?: number, tenantId?: string): Promise<DomainEvent[]>;
}

export interface AccountRepository {
  findByCode(accountCode: string, tenantId: string): Promise<Account | null>;
  /**
   * Bulk lookup to avoid N+1 queries during JE validation.
   * Implementers MUST return only accounts for the provided tenant.
   */
  findAllByCodes(codes: ReadonlyArray<string>, tenantId: string): Promise<ReadonlyArray<Account>>;
  findByTenant(tenantId: string): Promise<Account[]>;
  save(account: Account): Promise<void>;
  updateBalance(accountCode: string, amount: number, tenantId: string): Promise<void>;
}

export interface JournalEntryRepository {
  findById(id: string, tenantId: string): Promise<JournalEntry | null>;
  findByTenant(tenantId: string, limit?: number, offset?: number): Promise<JournalEntry[]>;
  save(journalEntry: JournalEntry): Promise<void>;
}

export interface GeneralLedgerRepository {
  findByAccount(
    accountCode: string,
    tenantId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<GeneralLedgerEntry[]>;
  findByJournal(journalId: string, tenantId: string): Promise<GeneralLedgerEntry[]>;
  save(entry: GeneralLedgerEntry): Promise<void>;
  getTrialBalance(
    tenantId: string,
    asOfDate: Date,
  ): Promise<
    Array<{
      accountCode: string;
      accountName: string;
      debitBalance: number;
      creditBalance: number;
    }>
  >;
}

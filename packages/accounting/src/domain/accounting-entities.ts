// This file contains legacy interfaces that are being phased out
// Use domain objects from their respective files instead:
// - Account: Use from './account.domain'
// - JournalEntry: Use from './journal-entry'
// - JournalEntryLine: Use from './journal-entry-line'

export interface GeneralLedgerEntry {
  id: string;
  tenantId: string;
  journalId: string;
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  currency: string;
  postingTs: Date;
  reference?: string;
  description?: string;
}

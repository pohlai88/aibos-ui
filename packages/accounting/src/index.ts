// Public API for @aibos/accounting
// This file exports only stable, well-typed APIs to prevent leaking internal implementation details

// Basic type definitions that don't depend on problematic imports
export type AccountType = 
  | 'ASSET'
  | 'LIABILITY' 
  | 'EQUITY'
  | 'REVENUE'
  | 'EXPENSE';

export type JournalEntryStatus = 
  | 'DRAFT'
  | 'POSTED'
  | 'CANCELLED';

// Basic domain types
export interface Account {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  parentAccountCode?: string;
  tenantId: string;
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntry {
  id: string;
  tenantId: string;
  entryNumber: string;
  description: string;
  postingDate: Date;
  status: JournalEntryStatus;
  totalDebit: number;
  totalCredit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountCode: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  createdAt: Date;
}

export interface Money {
  amount: number;
  currency: string;
}

// Repository interfaces
export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
  findByCode(code: string): Promise<Account | null>;
  save(account: Account): Promise<Account>;
  delete(id: string): Promise<void>;
}

export interface JournalEntryRepository {
  findById(id: string): Promise<JournalEntry | null>;
  save(entry: JournalEntry): Promise<JournalEntry>;
  findByDateRange(startDate: Date, endDate: Date): Promise<JournalEntry[]>;
}

// Basic utility types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface AccountingPeriod {
  startDate: Date;
  endDate: Date;
  periodName: string;
}

// API request/response types
export interface CreateAccountRequest {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  parentAccountCode?: string;
}

export interface AccountResponse {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  balance: number;
  isActive: boolean;
}

export interface CreateJournalEntryRequest {
  description: string;
  postingDate: string;
  lines: {
    accountCode: string;
    description: string;
    debitAmount?: number;
    creditAmount?: number;
  }[];
}

export interface JournalEntryResponse {
  id: string;
  entryNumber: string;
  description: string;
  postingDate: string;
  status: JournalEntryStatus;
  totalDebit: number;
  totalCredit: number;
}

// Error response type
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

// Success response type
export interface SuccessResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Validation exports (facade-safe)
export {
  ValidationPipeline,
  CommandValidator,
  AccountValidator,
  JournalEntryValidator,
  InvoiceValidator,
  compose
} from './utils/validation-pipeline-utilities';
export { validationError } from './utils/api-response-utilities';
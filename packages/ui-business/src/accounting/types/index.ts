// Essential Accounting UI Types
// Direct integration with backend types - no adapters needed

import type {
  Account,
  AccountType,
  JournalEntry,
  JournalEntryStatus,
  CreateAccountCommand,
  PostJournalEntryCommand,
} from '@aibos/accounting';

// Re-export backend types for UI usage
export type {
  Account,
  AccountType,
  JournalEntry,
  JournalEntryStatus,
  CreateAccountCommand,
  PostJournalEntryCommand,
};

// UI-specific types that extend backend types
export interface AccountHierarchyNode {
  account: Account;
  children: AccountHierarchyNode[];
  level: number;
  isExpanded: boolean;
}

export interface AccountHierarchy {
  rootNodes: AccountHierarchyNode[];
  totalAccounts: number;
  totalLevels: number;
}

export interface AccountBalanceSummary {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
  currency: string;
}

// Journal Entry types
export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  currency: string;
  exchangeRate?: number;
}

export interface JournalEntryFormData {
  reference: string;
  description: string;
  date: string;
  lines: JournalEntryLine[];
  status: JournalEntryStatus;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

// Trial Balance types
export interface TrialBalanceData {
  period: string;
  accounts: AccountBalanceSummary[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  lastUpdated: string;
}

export interface TrialBalanceFilters {
  period: string;
  accountTypes?: AccountType[];
  includeZeroBalances: boolean;
  currency?: string;
}

// Financial Reports types
export interface FinancialReportData {
  reportType: 'P&L' | 'Balance Sheet' | 'Cash Flow';
  period: string;
  currency: string;
  data: Record<string, unknown>;
  generatedAt: string;
}

export interface ReportParameters {
  reportType: 'P&L' | 'Balance Sheet' | 'Cash Flow';
  startDate: string;
  endDate: string;
  currency: string;
  includeSubAccounts: boolean;
  format: 'PDF' | 'Excel' | 'CSV';
}

// Component Props types
export interface AccountSelectorProperties {
  accounts: Account[];
  selectedAccountId?: string;
  onSelect: (account: Account | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface AmountInputProperties {
  value: number;
  onChange: (value: number) => void;
  currency: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface BalanceDisplayProperties {
  balance: number;
  currency: string;
  accountType: AccountType;
  showSign?: boolean;
  className?: string;
}

export interface StatusIndicatorProperties {
  status: JournalEntryStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

// Hook return types
export interface UseAccountingDataReturn {
  accounts: Account[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseJournalEntryReturn {
  journalEntry: JournalEntryFormData | null;
  loading: boolean;
  error: Error | null;
  createEntry: (data: JournalEntryFormData) => Promise<void>;
  updateEntry: (id: string, data: Partial<JournalEntryFormData>) => Promise<void>;
  postEntry: (id: string) => Promise<void>;
  validateEntry: (data: JournalEntryFormData) => ValidationResult;
}

export interface UseTrialBalanceReturn {
  trialBalance: TrialBalanceData | null;
  loading: boolean;
  error: Error | null;
  loadTrialBalance: (filters: TrialBalanceFilters) => Promise<void>;
  exportTrialBalance: (format: 'PDF' | 'Excel' | 'CSV') => Promise<void>;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Store types
export interface AccountingStore {
  // Chart of Accounts
  accounts: Account[];
  accountHierarchy: AccountHierarchy | null;

  // Journal Entries
  journalEntries: JournalEntryFormData[];
  currentEntry: JournalEntryFormData | null;

  // Trial Balance
  trialBalance: TrialBalanceData | null;

  // Loading states
  loading: {
    accounts: boolean;
    journalEntries: boolean;
    trialBalance: boolean;
  };

  // Error states
  errors: {
    accounts: Error | null;
    journalEntries: Error | null;
    trialBalance: Error | null;
  };

  // Actions
  loadAccounts: () => Promise<void>;
  createAccount: (command: CreateAccountCommand) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;

  loadJournalEntries: () => Promise<void>;
  createJournalEntry: (data: JournalEntryFormData) => Promise<void>;
  updateJournalEntry: (id: string, data: Partial<JournalEntryFormData>) => Promise<void>;
  postJournalEntry: (id: string) => Promise<void>;

  loadTrialBalance: (filters: TrialBalanceFilters) => Promise<void>;
  exportTrialBalance: (format: 'PDF' | 'Excel' | 'CSV') => Promise<void>;

  // Utility actions
  clearErrors: () => void;
  resetStore: () => void;
}

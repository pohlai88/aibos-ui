// Essential Accounting UI Constants
// Centralized constants for accounting components

// Account Types
export const ACCOUNT_TYPES = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  REVENUE: 'REVENUE',
  EXPENSE: 'EXPENSE',
} as const;

// Special Account Types
export const SPECIAL_ACCOUNT_TYPES = {
  CASH: 'CASH',
  BANK: 'BANK',
  ACCOUNTS_RECEIVABLE: 'ACCOUNTS_RECEIVABLE',
  ACCOUNTS_PAYABLE: 'ACCOUNTS_PAYABLE',
  INVENTORY: 'INVENTORY',
  FIXED_ASSET: 'FIXED_ASSET',
  ACCUMULATED_DEPRECIATION: 'ACCUMULATED_DEPRECIATION',
  PREPAID_EXPENSE: 'PREPAID_EXPENSE',
  ACCRUED_EXPENSE: 'ACCRUED_EXPENSE',
  SALES_REVENUE: 'SALES_REVENUE',
  COST_OF_GOODS_SOLD: 'COST_OF_GOODS_SOLD',
  OPERATING_EXPENSE: 'OPERATING_EXPENSE',
  ADMINISTRATIVE_EXPENSE: 'ADMINISTRATIVE_EXPENSE',
  MARKETING_EXPENSE: 'MARKETING_EXPENSE',
  DEPRECIATION_EXPENSE: 'DEPRECIATION_EXPENSE',
  INTEREST_EXPENSE: 'INTEREST_EXPENSE',
  TAX_EXPENSE: 'TAX_EXPENSE',
  OTHER_INCOME: 'OTHER_INCOME',
  OTHER_EXPENSE: 'OTHER_EXPENSE',
  RETAINED_EARNINGS: 'RETAINED_EARNINGS',
  COMMON_STOCK: 'COMMON_STOCK',
  PREFERRED_STOCK: 'PREFERRED_STOCK',
} as const;

// Journal Entry Status
export const JOURNAL_ENTRY_STATUS = {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  POSTED: 'POSTED',
  REVERSED: 'REVERSED',
} as const;

// Currency Codes
export const CURRENCY_CODES = {
  MYR: 'MYR', // Malaysian Ringgit
  USD: 'USD', // US Dollar
  EUR: 'EUR', // Euro
  GBP: 'GBP', // British Pound
  SGD: 'SGD', // Singapore Dollar
  JPY: 'JPY', // Japanese Yen
  CNY: 'CNY', // Chinese Yuan
  AUD: 'AUD', // Australian Dollar
  CAD: 'CAD', // Canadian Dollar
  CHF: 'CHF', // Swiss Franc
} as const;

// Financial Report Types
export const FINANCIAL_REPORT_TYPES = {
  PROFIT_LOSS: 'P&L',
  BALANCE_SHEET: 'Balance Sheet',
  CASH_FLOW: 'Cash Flow',
  TRIAL_BALANCE: 'Trial Balance',
  GENERAL_LEDGER: 'General Ledger',
} as const;

// Export Formats
export const EXPORT_FORMATS = {
  PDF: 'PDF',
  EXCEL: 'Excel',
  CSV: 'CSV',
  JSON: 'JSON',
} as const;

// Validation Messages
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_AMOUNT: 'Please enter a valid amount',
  DEBITS_CREDITS_MUST_BALANCE: 'Total debits must equal total credits',
  ACCOUNT_REQUIRED: 'Please select an account',
  DESCRIPTION_REQUIRED: 'Description is required',
  REFERENCE_REQUIRED: 'Reference is required',
  DATE_REQUIRED: 'Date is required',
  INVALID_DATE: 'Please enter a valid date',
  FUTURE_DATE_NOT_ALLOWED: 'Future dates are not allowed',
  PAST_DATE_NOT_ALLOWED: 'Past dates are not allowed',
  INVALID_CURRENCY: 'Please select a valid currency',
  EXCHANGE_RATE_REQUIRED: 'Exchange rate is required for foreign currency',
  INVALID_EXCHANGE_RATE: 'Please enter a valid exchange rate',
} as const;

// Error Codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  JOURNAL_ENTRY_NOT_FOUND: 'JOURNAL_ENTRY_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_ALREADY_EXISTS: 'ACCOUNT_ALREADY_EXISTS',
  JOURNAL_ENTRY_ALREADY_POSTED: 'JOURNAL_ENTRY_ALREADY_POSTED',
  INVALID_ACCOUNT_TYPE: 'INVALID_ACCOUNT_TYPE',
  INVALID_JOURNAL_ENTRY_STATUS: 'INVALID_JOURNAL_ENTRY_STATUS',
} as const;

// UI Constants
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  MAX_ACCOUNTS_PER_PAGE: 50,
  MAX_JOURNAL_ENTRIES_PER_PAGE: 25,
  DEFAULT_CURRENCY: 'MYR',
  DEFAULT_DATE_FORMAT: 'YYYY-MM-DD',
  DEFAULT_NUMBER_FORMAT: '#,##0.00',
  MAX_DESCRIPTION_LENGTH: 255,
  MAX_REFERENCE_LENGTH: 50,
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 999999999.99,
} as const;

// Color Themes for Account Types
export const ACCOUNT_TYPE_COLORS = {
  ASSET: 'text-green-600 bg-green-50',
  LIABILITY: 'text-red-600 bg-red-50',
  EQUITY: 'text-blue-600 bg-blue-50',
  REVENUE: 'text-purple-600 bg-purple-50',
  EXPENSE: 'text-orange-600 bg-orange-50',
} as const;

// Status Colors
export const STATUS_COLORS = {
  DRAFT: 'text-gray-600 bg-gray-50',
  APPROVED: 'text-yellow-600 bg-yellow-50',
  POSTED: 'text-green-600 bg-green-50',
  REVERSED: 'text-red-600 bg-red-50',
} as const;

// Icon Mappings
export const ACCOUNT_TYPE_ICONS = {
  ASSET: 'trending-up',
  LIABILITY: 'trending-down',
  EQUITY: 'shield',
  REVENUE: 'dollar-sign',
  EXPENSE: 'minus-circle',
} as const;

export const STATUS_ICONS = {
  DRAFT: 'edit',
  APPROVED: 'check-circle',
  POSTED: 'check',
  REVERSED: 'rotate-ccw',
} as const;

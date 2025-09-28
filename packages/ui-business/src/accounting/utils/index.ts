// Essential Accounting UI Utilities
// Helper functions for accounting components

import type { Account, AccountType, JournalEntryLine } from '@aibos/accounting';
import { safeGet } from '../../utils/safeGet';
import type { AccountHierarchyNode, ValidationResult, ValidationError } from '../types';
import { VALIDATION_MESSAGES, ERROR_CODES, UI_CONSTANTS } from '../constants';

// Currency formatting utilities
export function formatCurrency(
  amount: number,
  currency: string = UI_CONSTANTS.DEFAULT_CURRENCY,
  showSign: boolean = false,
): string {
  const formatter = new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let formatted = formatter.format(Math.abs(amount));

  if (showSign && amount !== 0) {
    formatted = amount < 0 ? `-${formatted}` : `+${formatted}`;
  }

  return formatted;
}

// Number formatting utilities
export function formatNumber(
  value: number,
  decimals: number = 2,
  showThousandsSeparator: boolean = true,
): string {
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  };

  if (showThousandsSeparator) {
    options.useGrouping = true;
  }

  return new Intl.NumberFormat('en-MY', options).format(value);
}

// Date formatting utilities
export function formatDate(
  date: string | Date,
  format: string = UI_CONSTANTS.DEFAULT_DATE_FORMAT,
): string {
  const dateObject = typeof date === 'string' ? new Date(date) : date;

  if (format === 'YYYY-MM-DD') {
    return dateObject.toISOString().split('T')[0] || '';
  }

  return dateObject.toLocaleDateString('en-MY');
}

// Account hierarchy utilities
export function buildAccountHierarchy(accounts: Account[]): AccountHierarchyNode[] {
  const accountMap = new Map<string, AccountHierarchyNode>();
  const rootNodes: AccountHierarchyNode[] = [];

  // Create nodes for all accounts
  accounts.forEach((account) => {
    accountMap.set(account.accountCode, {
      account,
      children: [],
      level: 0,
      isExpanded: false,
    });
  });

  // Build hierarchy
  accounts.forEach((account) => {
    const node = accountMap.get(account.accountCode)!;

    if (account.parentAccountCode) {
      const parentNode = accountMap.get(account.parentAccountCode);
      if (parentNode) {
        parentNode.children.push(node);
        node.level = parentNode.level + 1;
      }
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

export function flattenAccountHierarchy(nodes: AccountHierarchyNode[]): Account[] {
  const flattened: Account[] = [];

  function traverse(node: AccountHierarchyNode) {
    flattened.push(node.account);
    node.children.forEach((child) => traverse(child));
  }

  nodes.forEach((node) => traverse(node));
  return flattened;
}

// Journal entry validation utilities
export function validateJournalEntryLines(lines: JournalEntryLine[]): ValidationResult {
  const errors: ValidationError[] = [];

  // Check minimum lines
  if (lines.length < 2) {
    errors.push({
      field: 'lines',
      message: 'At least two lines are required',
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  // Check for empty lines
  const emptyLines = lines.filter(
    (line) =>
      !line.accountCode ||
      (!line.debitAmount && !line.creditAmount) ||
      (line.debitAmount === 0 && line.creditAmount === 0),
  );

  if (emptyLines.length > 0) {
    errors.push({
      field: 'lines',
      message: 'All lines must have an account and amount',
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  // Check balance
  const totalDebits = lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
  const totalCredits = lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
  const difference = Math.abs(totalDebits - totalCredits);

  if (difference > 0.01) {
    // Allow for small rounding differences
    errors.push({
      field: 'balance',
      message: VALIDATION_MESSAGES.DEBITS_CREDITS_MUST_BALANCE,
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Account type utilities
export function getAccountTypeColor(accountType: AccountType): string {
  const colorMap = {
    Asset: 'text-green-600 bg-green-50',
    Liability: 'text-red-600 bg-red-50',
    Equity: 'text-blue-600 bg-blue-50',
    Revenue: 'text-purple-600 bg-purple-50',
    Expense: 'text-orange-600 bg-orange-50',
  };

  return safeGet(colorMap, accountType, 'text-gray-600 bg-gray-50') as string;
}

export function getAccountTypeIcon(accountType: AccountType): string {
  const iconMap = {
    Asset: 'trending-up',
    Liability: 'trending-down',
    Equity: 'shield',
    Revenue: 'dollar-sign',
    Expense: 'minus-circle',
  };

  return safeGet(iconMap, accountType, 'circle') as string;
}

// Balance calculation utilities
export function calculateAccountBalance(
  debitAmount: number,
  creditAmount: number,
  accountType: AccountType,
): number {
  const netAmount = debitAmount - creditAmount;

  // For liability, equity, and revenue accounts, reverse the sign
  if (['LIABILITY', 'EQUITY', 'REVENUE'].includes(accountType)) {
    return -netAmount;
  }

  return netAmount;
}

export function formatAccountBalance(
  balance: number,
  currency: string = UI_CONSTANTS.DEFAULT_CURRENCY,
): string {
  return formatCurrency(balance, currency, true);
}

// Search and filter utilities
export function searchAccounts(accounts: Account[], searchTerm: string): Account[] {
  if (!searchTerm.trim()) {
    return accounts;
  }

  const term = searchTerm.toLowerCase();

  return accounts.filter(
    (account) =>
      account.accountCode.toLowerCase().includes(term) ||
      account.accountName.toLowerCase().includes(term) ||
      account.accountName?.toLowerCase().includes(term),
  );
}

export function filterAccountsByType(accounts: Account[], accountTypes: AccountType[]): Account[] {
  if (accountTypes.length === 0) {
    return accounts;
  }

  return accounts.filter((account) => accountTypes.includes(account.accountType));
}

// Validation utilities
export function validateRequired(value: unknown, fieldName: string): ValidationError | null {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      code: ERROR_CODES.VALIDATION_ERROR,
    };
  }
  return null;
}

export function validateAmount(value: number, fieldName: string): ValidationError | null {
  if (isNaN(value) || value < UI_CONSTANTS.MIN_AMOUNT || value > UI_CONSTANTS.MAX_AMOUNT) {
    return {
      field: fieldName,
      message: VALIDATION_MESSAGES.INVALID_AMOUNT,
      code: ERROR_CODES.VALIDATION_ERROR,
    };
  }
  return null;
}

export function validateDate(value: string, fieldName: string): ValidationError | null {
  const date = new Date(value);
  const today = new Date();

  if (isNaN(date.getTime())) {
    return {
      field: fieldName,
      message: VALIDATION_MESSAGES.INVALID_DATE,
      code: ERROR_CODES.VALIDATION_ERROR,
    };
  }

  if (date > today) {
    return {
      field: fieldName,
      message: VALIDATION_MESSAGES.FUTURE_DATE_NOT_ALLOWED,
      code: ERROR_CODES.VALIDATION_ERROR,
    };
  }

  return null;
}

// Debounce utility
export function debounce<T extends (...args: unknown[]) => unknown>(
  function_: T,
  delay: number = UI_CONSTANTS.DEBOUNCE_DELAY,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => function_(...args), delay);
  };
}

// Error handling utilities
export function getErrorMessage(error: Error): string {
  const errorMap = {
    [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again',
    [ERROR_CODES.NETWORK_ERROR]:
      'Unable to connect to the server. Please check your internet connection',
    [ERROR_CODES.AUTHENTICATION_ERROR]: 'Your session has expired. Please log in again',
    [ERROR_CODES.PERMISSION_ERROR]: "You don't have permission to perform this action",
    [ERROR_CODES.BUSINESS_LOGIC_ERROR]: 'This operation cannot be completed at this time',
  };

  return (
    errorMap[error.name as keyof typeof errorMap] ||
    'An unexpected error occurred. Please try again'
  );
}

// Export utilities
export function generateCSV(data: unknown[], headers: string[]): string {
  return [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = safeGet(row as Record<string, unknown>, header, '');
          return typeof value === 'string' ? `"${value}"` : value;
        })
        .join(','),
    ),
  ].join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

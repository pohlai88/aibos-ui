/**
 * Core Types - SSOT (Single Source of Truth)
 * 
 * Centralized type definitions used across all accounting utilities.
 * This ensures consistency and prevents type duplication across the codebase.
 * 
 * All utilities should import types from here rather than defining their own.
 */

import { type SupportedCurrency, AccountType } from './accounting-utilities';

// Re-export for external use
export { type SupportedCurrency, AccountType };

// ============================================================================
// BASE ENTITY TYPES
// ============================================================================

export interface BaseAccount {
  code: string;
  name: string;
  type: AccountType;
  parentCode?: string;
  isActive: boolean;
  currency: SupportedCurrency;
}

export interface BaseTransaction {
  id: string;
  amount: number;
  currency: SupportedCurrency;
  date: Date;
  description: string;
  reference?: string;
}

export interface BaseJournalEntry {
  id: string;
  date: Date;
  description: string;
  reference?: string;
  totalDebits: number;
  totalCredits: number;
  currency: SupportedCurrency;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface BaseValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  path?: string;
  value?: unknown;
}

export interface BusinessValidationResult extends BaseValidationResult {
  issues: ValidationIssue[];
  context?: Record<string, unknown>;
}

// ============================================================================
// FINANCIAL TYPES
// ============================================================================

export interface BaseFinancialStatement {
  id: string;
  name: string;
  period: {
    start: Date;
    end: Date;
  };
  currency: SupportedCurrency;
  totalAmount: number;
}

export interface BaseTaxCalculation {
  id: string;
  amount: number;
  rate: number;
  currency: SupportedCurrency;
  calculationDate: Date;
  taxType: string;
}

// ============================================================================
// CURRENCY TYPES
// ============================================================================

export interface CurrencyConversion {
  from: SupportedCurrency;
  to: SupportedCurrency;
  rate: number;
  amount: number;
  convertedAmount: number;
  conversionDate: Date;
}

export interface ExchangeRate {
  from: SupportedCurrency;
  to: SupportedCurrency;
  rate: number;
  effectiveDate: Date;
  expiryDate?: Date;
}

// ============================================================================
// DATE TYPES
// ============================================================================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface FiscalPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isClosed: boolean;
  year: number;
  period: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ErrorContext {
  entity?: string;
  operation?: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

export interface AccountingError extends Error {
  code: string;
  context: ErrorContext;
  timestamp: Date;
}

// ============================================================================
// POLICY TYPES
// ============================================================================

export interface BasePolicy {
  id: string;
  name: string;
  description: string;
  active: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
  priority: number;
}

export interface ValidationPolicy extends BasePolicy {
  maxRetries: number;
  timeoutMs: number;
  errorCodes: Record<string, string>;
  rules: ValidationRule[];
}

export interface ValidationRule {
  name: string;
  condition: string;
  severity: 'error' | 'warning';
  message: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: Date;
  expiry?: Date;
  accessCount: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

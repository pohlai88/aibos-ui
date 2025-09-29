/**
 * Accounting Utilities - Internal Barrel Export
 * 
 * This is the internal barrel export for all accounting utilities.
 * Used exclusively within the accounting package for organized utility access.
 * 
 * All utilities are organized by category for better maintainability and discoverability.
 * This barrel provides a clean import path for all utilities within the accounting package.
 * 
 * SYSTEMATIC NAMING CONVENTION:
 * - All exports are prefixed with their utility name: [utility-name].[function/type]
 * - This completely eliminates naming conflicts
 * - Makes it crystal clear which utility each export comes from
 * - Maintains backward compatibility through aliases
 * 
 * @example
 * ```typescript
 * import { 
 *   // Core accounting utilities
 *   accounting.normalizeAccountCode,
 *   accounting.isValidAccountCode,
 *   
 *   // Date utilities
 *   date.formatDate,
 *   date.parseDate,
 *   
 *   // Financial calculations
 *   financial.calculateTax,
 *   financial.calculateDiscount,
 *   
 *   // Validation
 *   validation.validateEmail,
 *   validation.validateTaxId,
 *   
 *   // Formatting
 *   formatting.formatCurrency,
 *   formatting.formatPercentage,
 *   
 *   // Prefixed exports for backward compatibility
 *   transactionWithTimeout,  // From transaction-utilities
 *   errorWithTimeout,        // From error-utilities
 *   PerformanceCache,        // From performance-utilities
 *   CachingCache,            // From caching-utilities
 * } from './utils';
 * ```
 */

// ============================================================================
// CORE ACCOUNTING UTILITIES
// ============================================================================
// Essential accounting operations, account codes, currency handling, and core business logic
export * as accounting from './accounting-utilities';

// ============================================================================
// SAFETY & OBJECT UTILITIES  
// ============================================================================
// Safe object access, type guards, and object manipulation utilities
export * as safeObject from './safe-object-utilities';
export { omitUndefined } from './omit-undefined-utilities';

// ============================================================================
// DATE & TIME UTILITIES
// ============================================================================
// Comprehensive date/time operations for accounting periods, fiscal years, and reporting
export * as date from './date-utilities';

// ============================================================================
// COLLECTION & ARRAY UTILITIES
// ============================================================================
// Array operations, sorting, filtering, and collection management
export * as collection from './collection-utilities';

// ============================================================================
// OBJECT MANIPULATION UTILITIES
// ============================================================================
// Deep cloning, merging, object transformation, and immutable operations
export * as object from './object-utilities';

// ============================================================================
// FINANCIAL CALCULATION UTILITIES
// ============================================================================
// Tax calculations, discounts, margins, depreciation, and financial analysis
export * as financial from './financial-utilities';

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================
// Data validation for emails, tax IDs, bank accounts, and business entities
export * as validation from './validation-utilities';

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================
// Currency, percentage, number, and text formatting with locale support
export * as formatting from './formatting-utilities';

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================
// Structured error handling, custom error classes, and error context management
export * as error from './error-utilities';

// ============================================================================
// ASYNC & PROMISE UTILITIES
// ============================================================================
// Promise utilities, rate limiting, throttling, debouncing, and async patterns
export * as async from './async-utilities';

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================
// Performance monitoring, caching, profiling, and optimization tools
export * as performance from './performance-utilities';

// ============================================================================
// SERVICE PATTERN UTILITIES
// ============================================================================
// Standardized service base classes and patterns for consistent error handling
export * as servicePattern from './service-pattern-utilities';

// ============================================================================
// VALIDATION PIPELINE UTILITIES
// ============================================================================
// Flexible validation pipeline system for complex validation scenarios
export * as validationPipeline from './validation-pipeline-utilities';

// ============================================================================
// API RESPONSE UTILITIES
// ============================================================================
// Standardized API response building and handling for consistent response formats
export * as apiResponse from './api-response-utilities';

// ============================================================================
// REPOSITORY PATTERN UTILITIES
// ============================================================================
// Standardized repository base classes and patterns for consistent data access
export * as repositoryPattern from './repository-pattern-utilities';
export * as orderAdapter from './order-adapter-utilities';

// ============================================================================
// DOMAIN EVENT UTILITIES
// ============================================================================
// Standardized domain event creation, handling, and management
export * as domainEvent from './domain-event-utilities';

// ============================================================================
// TRANSACTION UTILITIES
// ============================================================================
// Standardized transaction management, retry logic, and rollback strategies
export * as transaction from './transaction-utilities';

// ============================================================================
// EVENT SOURCING UTILITIES
// ============================================================================
// Advanced event sourcing patterns and utilities for aggregate reconstruction
export * as eventSourcing from './event-sourcing-utilities';

// ============================================================================
// CACHING UTILITIES
// ============================================================================
// Comprehensive caching mechanisms and strategies for performance optimization
export * as caching from './caching-utilities';

// ============================================================================
// MONITORING UTILITIES
// ============================================================================
// Comprehensive monitoring, metrics collection, and observability utilities
export * as monitoring from './monitoring-utilities';

// ============================================================================
// PHASE 3 UTILITIES - ASSETS & INVENTORY
// ============================================================================
// Fixed asset depreciation, inventory costing, and manufacturing overhead utilities
export * as fixedAsset from './fixed-asset-utilities';
export * as inventoryCosting from './inventory-costing-utilities';
export * as manufacturingOverhead from './manufacturing-overhead-utilities';

// ============================================================================
// PHASE 3 UTILITIES - CONSOLIDATION
// ============================================================================
// Intercompany eliminations, consolidation adjustments, and mapping utilities
export * as consolidation from './consolidation-utilities';
export * as consolidationMapping from './consolidation-mapping-utilities';

// ============================================================================
// PHASE 3 UTILITIES - ADVANCED ACCOUNTING (MFRS COMPLIANCE)
// ============================================================================
// Ownership changes, deferred tax, hedge accounting, lease accounting, provisions, government grants, and budget variance
export * as ownershipChanges from './ownership-changes-utilities';
export * as deferredTax from './deferred-tax-utilities';
export * as hedgeAccounting from './hedge-accounting-utilities';
export * as leaseAccounting from './lease-accounting-utilities';
export * as provisionsContingencies from './provisions-contingencies-utilities';
export * as governmentGrants from './government-grants-utilities';
export * as budgetVariance from './budget-variance-utilities';

// ============================================================================
// PHASE 3 UTILITIES - CASH & RECONCILIATION
// ============================================================================
// Bank reconciliation, cash flow mapping, and matching utilities
export * as bankReconciliation from './bank-reconciliation-utilities';
export * as cashflowMapping from './cashflow-mapping-utilities';

// ============================================================================
// PHASE 3 UTILITIES - DOCUMENT MANAGEMENT
// ============================================================================
// Document numbering, number-to-words conversion, and formatting utilities
export * as documentNumbering from './document-numbering-utilities';
export * as numberToWords from './number-to-words-utilities';

// ============================================================================
// PHASE 4 UTILITIES - ESSENTIAL BUILDING BLOCKS
// ============================================================================
// Chart of Accounts governance, financial statements, ECL allowance, rounding policy, landed cost, and TB-CF mapping
export * as coaGovernance from './coa-governance-utilities';
export * as financialStatements from './financial-statements-utilities';
export * as eclAllowance from './ecl-allowance-utilities';
export * as roundingPolicyUtilities from './rounding-policy-utilities';
export * as landedCost from './landed-cost-utilities';
export * as tbCfMapping from './tb-cf-mapping-utilities';

// ============================================================================
// ADDITIONAL UTILITIES - TAX & COMPLIANCE
// ============================================================================
// Tax core utilities, reconciliation, and withholding tax management
export * as taxCore from './tax-core-utilities';
export * as taxReconciliation from './tax-reconciliation-utilities';
export * as withholdingTax from './withholding-tax-utilities';

// ============================================================================
// ADDITIONAL UTILITIES - MULTI-CURRENCY & FX
// ============================================================================
// Foreign exchange ledger, revaluation, and multi-currency rules
export * as fxLedger from './fx-ledger-utilities';
export * as fxLedgerSchemas from './fx-ledger-schemas';
export * as fxRevaluation from './fx-revaluation-utilities';
export * as multiCurrencyRules from './multi-currency-rules-utilities';

// ============================================================================
// ADDITIONAL UTILITIES - JOURNAL & TRIAL BALANCE
// ============================================================================
// Journal entry management and trial balance operations
export * as journalEntry from './journal-entry-utilities';
export * as trialBalance from './trial-balance-utilities';

// ============================================================================
// ADDITIONAL UTILITIES - POSTING & RULES
// ============================================================================
// Posting rules management and enforcement
export * as postingRules from './posting-rules-utilities';

// ============================================================================
// ADDITIONAL UTILITIES - DUNNING & AGING
// ============================================================================
// Dunning management and account aging
export * as dunning from './dunning-utilities';
export * as aging from './aging-utilities';

// ============================================================================
// ADDITIONAL UTILITIES - ALLOCATION & RECONCILIATION
// ============================================================================
// Cost allocation and reconciliation utilities
export * as allocation from './allocation-utilities';

// ============================================================================
// ADDITIONAL UTILITIES - OPENING BALANCE & REVENUE
// ============================================================================
// Opening balance management and revenue recognition
export * as openingBalance from './opening-balance-utilities';
export * as revenueRecognition from './revenue-recognition-utilities';

// ============================================================================
// ADDITIONAL UTILITIES - ACCRUAL & DEFERRAL
// ============================================================================
// Accrual and deferral accounting utilities
export * as accrualDeferral from './accrual-deferral-utilities';

// ============================================================================
// ADDITIONAL UTILITIES - FISCAL PERIOD
// ============================================================================
// Fiscal period management and utilities
export * as fiscalPeriod from './fiscal-period-utilities';

// ============================================================================
// SSOT MODULES (Single Source of Truth)
// ============================================================================
// Centralized policies and shared operators for consistent behavior across all utilities
export * as sharedOperators from './shared-operators-utilities';
export * as currencyPolicy from './policies/currency-policy';
export * as roundingPolicy from './policies/rounding-policy';
export * as validationPolicy from './policies/validation-policy';

// ============================================================================
// CORE TYPES (Single Source of Truth)
// ============================================================================
// Centralized type definitions for consistent behavior across all utilities
export * as coreTypes from './core-types-utilities';
export * as moneyHelpers from './money-helpers-utilities';

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================
// Maintain backward compatibility for critical functions and types
// These aliases provide the old import style for existing code

// Critical function aliases
export {
  normalizeAccountCode,
  isValidAccountCode,
  calculateTax,
  toMinorUnits,
  fromMinorUnits,
  toMinor,
  fromMinor,
  roundToCurrency,
  type SupportedCurrency,
  getCurrencyDecimalsStrict,
  normalizeCurrency,
  AccountType,
  ACCOUNT_TYPES,
  assert,
  round2,
  isNonEmpty,
  safeGet,
  roundAmount,
  hasItems,
  isValidCurrency,
  round2HalfUp
} from './accounting-utilities';

export {
  isEmpty
} from './collection-utilities';

export {
  hasKey
} from './safe-object-utilities';

export {
  toPairs
} from './object-utilities';


export {
  addMonthsToDate,
  isDateInRange,
  getEndOfMonth
} from './date-utilities';

export {
  validateEmail,
  validateTaxId
} from './validation-utilities';

export {
  formatCurrency,
  formatPercentage
} from './formatting-utilities';

export {
  formatDate,
  parseDate
} from './date-utilities';

// Critical type aliases
export {
  DEFAULT_CURRENCY,
  RoundingMethod,
  type ConditionOperator,
  type LogicalOperator
} from './accounting-utilities';

export {
  DEFAULT_ROUNDING_METHOD
} from './policies/rounding-policy';

// Critical conflict resolution aliases
export {
  withTimeout as transactionWithTimeout,
  type TransactionOptions,
  type TransactionContext
} from './transaction-utilities';

export {
  withTimeout as errorWithTimeout,
  type ErrorContext
} from './error-utilities';

export {
  Cache as PerformanceCache,
  createCache as createPerformanceCache
} from './performance-utilities';

export {
  Cache as CachingCache,
  type CacheOptions as CachingCacheOptions
} from './caching-utilities';

export type {
  ValidationOptions as ValidationUtilitiesOptions
} from './validation-utilities';

export type {
  ServiceOptions as ServicePatternOptions
} from './service-pattern-utilities';

export type {
  RepositoryOptions as RepositoryPatternOptions,
  QueryOptions as RepositoryQueryOptions
} from './repository-pattern-utilities';
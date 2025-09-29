/**
 * Accounting Utilities - Internal Barrel Export
 * 
 * This is the internal barrel export for all accounting utilities.
 * Used exclusively within the accounting package for organized utility access.
 * 
 * All utilities are organized by category for better maintainability and discoverability.
 * This barrel provides a clean import path for all utilities within the accounting package.
 * 
 * @example
 * ```typescript
 * import { 
 *   // Core accounting utilities
 *   normalizeAccountCode,
 *   isValidAccountCode,
 *   
 *   // Date utilities
 *   formatDate,
 *   parseDate,
 *   
 *   // Financial calculations
 *   calculateTax,
 *   calculateDiscount,
 *   
 *   // Validation
 *   validateEmail,
 *   validateTaxId,
 *   
 *   // Formatting
 *   formatCurrency,
 *   formatPercentage
 * } from './utils';
 * ```
 */

// ============================================================================
// CORE ACCOUNTING UTILITIES
// ============================================================================
// Essential accounting operations, account codes, currency handling, and core business logic
export * from './accounting-utilities';

// ============================================================================
// SAFETY & OBJECT UTILITIES  
// ============================================================================
// Safe object access, type guards, and object manipulation utilities
export * from './safe-object';
export * from './omitUndefined';

// ============================================================================
// DATE & TIME UTILITIES
// ============================================================================
// Comprehensive date/time operations for accounting periods, fiscal years, and reporting
export * from './date-utilities';

// ============================================================================
// COLLECTION & ARRAY UTILITIES
// ============================================================================
// Array operations, sorting, filtering, and collection management
export * from './collection-utilities';

// ============================================================================
// OBJECT MANIPULATION UTILITIES
// ============================================================================
// Deep cloning, merging, object transformation, and immutable operations
export * from './object-utilities';

// ============================================================================
// FINANCIAL CALCULATION UTILITIES
// ============================================================================
// Tax calculations, discounts, margins, depreciation, and financial analysis
export * from './financial-utilities';

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================
// Data validation for emails, tax IDs, bank accounts, and business entities
export * from './validation-utilities';

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================
// Currency, percentage, number, and text formatting with locale support
export * from './formatting-utilities';

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================
// Structured error handling, custom error classes, and error context management
export * from './error-utilities';

// ============================================================================
// ASYNC & PROMISE UTILITIES
// ============================================================================
// Promise utilities, rate limiting, throttling, debouncing, and async patterns
export * from './async-utilities';

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================
// Performance monitoring, caching, profiling, and optimization tools
export * from './performance-utilities';

// ============================================================================
// SERVICE PATTERN UTILITIES
// ============================================================================
// Standardized service base classes and patterns for consistent error handling
export * from './service-pattern-utilities';

// ============================================================================
// VALIDATION PIPELINE UTILITIES
// ============================================================================
// Flexible validation pipeline system for complex validation scenarios
export * from './validation-pipeline-utilities';

// ============================================================================
// API RESPONSE UTILITIES
// ============================================================================
// Standardized API response building and handling for consistent response formats
export * from './api-response-utilities';

// ============================================================================
// REPOSITORY PATTERN UTILITIES
// ============================================================================
// Standardized repository base classes and patterns for consistent data access
export * from './repository-pattern-utilities';

// ============================================================================
// DOMAIN EVENT UTILITIES
// ============================================================================
// Standardized domain event creation, handling, and management
export * from './domain-event-utilities';

// ============================================================================
// TRANSACTION UTILITIES
// ============================================================================
// Standardized transaction management, retry logic, and rollback strategies
// Note: Re-exports withTimeout as transactionWithTimeout to avoid conflicts with error-utilities
export {
  TransactionManager,
  TransactionHelpers,
  TransactionMonitor,
  RollbackStrategies,
  withRetry,
  delayAsync,
  withAbort,
  withTimeout as transactionWithTimeout,
  type TransactionOptions,
  type TransactionContext,
  type TransactionOperation,
  type TransactionResult,
  type TransactionMetrics,
  type RetryOptions,
  type RollbackStrategy,
  type RollbackOperation,
  TransactionOptionsSchema,
  type TransactionOptionsInput
} from './transaction-utilities';

// ============================================================================
// EVENT SOURCING UTILITIES
// ============================================================================
// Advanced event sourcing patterns and utilities for aggregate reconstruction
export * from './event-sourcing-utilities';

// ============================================================================
// CACHING UTILITIES
// ============================================================================
// Comprehensive caching mechanisms and strategies for performance optimization
// Note: Re-exports Cache types with prefixed names to avoid conflicts with performance-utilities
export {
  CacheManager,
  CacheInvalidationUtilities,
  CacheWarmingUtilities,
  DistributedCacheUtilities,
  CacheHelpers,
  ScopedCache,
  type CacheEntry,
  type CacheMetrics,
  type CacheMetricHooks,
  type CacheInvalidationOptions,
  type CacheWarmingOptions,
  type DistributedCacheOptions,
  // Prefixed exports to avoid conflicts
  Cache as CachingCache,
  CacheOptions as CachingCacheOptions,
  CacheStats as CachingCacheStats
} from './caching-utilities';

// ============================================================================
// MONITORING UTILITIES
// ============================================================================
// Comprehensive monitoring, metrics collection, and observability utilities
export * from './monitoring-utilities';

// ============================================================================
// PHASE 3 UTILITIES - ASSETS & INVENTORY
// ============================================================================
// Fixed asset depreciation, inventory costing, and manufacturing overhead utilities
export * from './fixed-asset-utilities';
export * from './inventory-costing-utilities';
export * from './manufacturing-overhead-utilities';

// ============================================================================
// PHASE 3 UTILITIES - CONSOLIDATION
// ============================================================================
// Intercompany eliminations, consolidation adjustments, and mapping utilities
export * from './consolidation-utilities';
export * from './consolidation-mapping-utilities';

// ============================================================================
// PHASE 3 UTILITIES - CASH & RECONCILIATION
// ============================================================================
// Bank reconciliation, cash flow mapping, and matching utilities
export * from './bank-reconciliation-utilities';
export * from './cashflow-mapping-utilities';

// ============================================================================
// PHASE 3 UTILITIES - DOCUMENT MANAGEMENT
// ============================================================================
// Document numbering, number-to-words conversion, and formatting utilities
export * from './document-numbering-utilities';
export * from './number-to-words-utilities';

// ============================================================================
// PHASE 4 UTILITIES - ESSENTIAL BUILDING BLOCKS
// ============================================================================
// Chart of Accounts governance, financial statements, ECL allowance, rounding policy, landed cost, and TB-CF mapping
export * from './coa-governance-utilities';
export * from './financial-statements-utilities';
export * from './ecl-allowance-utilities';
export * from './rounding-policy-utilities';
export * from './landed-cost-utilities';
export * from './tb-cf-mapping-utilities';
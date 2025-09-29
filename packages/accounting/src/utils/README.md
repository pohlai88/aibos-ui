# Accounting Utilities

A comprehensive collection of utilities for the AIBOS ERP accounting system. This directory contains **57+ utility modules** providing essential functionality for accounting operations, data validation, performance monitoring, enterprise patterns, and **Single Source of Truth (SSOT) policies**.

## 🏗️ Architecture Overview

The utilities are organized with a **Single Source of Truth (SSOT)** architecture to prevent duplication, ensure consistency, and maintain type safety across all accounting operations.

### 🎯 SSOT Modules

- **`shared-operators.ts`** - Centralized `ConditionOperator` and `LogicalOperator` types
- **`policies/currency-policy.ts`** - Currency defaults, decimal precision, and validation
- **`policies/rounding-policy.ts`** - Rounding methods, defaults, and backward compatibility
- **`money-helpers.ts`** - Currency conversion utilities with policy integration

## 📁 Directory Structure

```
utils/
├── README.md                           # This documentation
├── index.ts                           # Barrel export (single entry point)
├── __tests__/                         # Comprehensive test suite
│   ├── policies-enhanced.spec.ts      # SSOT policy validation tests
│   └── [30+ test files]               # Individual utility tests
│
├── 🎯 SSOT MODULES (Single Source of Truth)
├── shared-operators.ts                # ConditionOperator, LogicalOperator types
├── policies/
│   ├── currency-policy.ts             # MYR default, currency decimals
│   └── rounding-policy.ts             # HALF_EVEN default, rounding methods
├── money-helpers.ts                   # Currency conversion utilities
│
├── 🏦 CORE ACCOUNTING UTILITIES
├── accounting-utilities.ts            # Core accounting operations
├── financial-utilities.ts             # Financial calculations
├── journal-entry-utilities.ts         # Journal entry management
├── trial-balance-utilities.ts         # Trial balance operations
├── transaction-utilities.ts           # Transaction management
│
├── 📊 FINANCIAL STATEMENTS & REPORTING
├── financial-statements-utilities.ts  # P&L, Balance Sheet, Cash Flow
├── tb-cf-mapping-utilities.ts         # Trial Balance to Cash Flow mapping
├── cashflow-mapping-utilities.ts      # Cash flow categorization
├── fiscal-period-utilities.ts         # Fiscal period management
│
├── 💰 TAX & COMPLIANCE UTILITIES
├── tax-core-utilities.ts              # Tax calculation engine
├── tax-reconciliation-utilities.ts     # Tax reconciliation
├── withholding-tax-utilities.ts       # Withholding tax management
├── ecl-allowance-utilities.ts         # Expected Credit Loss allowance
│
├── 🏭 ASSETS & INVENTORY UTILITIES
├── fixed-asset-utilities.ts           # Fixed asset depreciation
├── inventory-costing-utilities.ts     # Inventory costing methods
├── manufacturing-overhead-utilities.ts # Manufacturing overhead allocation
├── landed-cost-utilities.ts           # Landed cost allocation
│
├── 🌍 MULTI-CURRENCY & FX UTILITIES
├── fx-ledger-utilities.ts             # Foreign exchange ledger
├── fx-revaluation-utilities.ts        # FX revaluation
├── multi-currency-rules-utilities.ts   # Multi-currency rules
│
├── 🏢 CONSOLIDATION & GOVERNANCE
├── consolidation-utilities.ts         # Intercompany eliminations
├── consolidation-mapping-utilities.ts  # Consolidation mapping
├── coa-governance-utilities.ts        # Chart of Accounts governance
├── posting-rules-utilities.ts         # Posting rules management
│
├── 📊 ADVANCED ACCOUNTING (MFRS COMPLIANCE)
├── ownership-changes-utilities.ts      # NCI utilities (MFRS 10)
├── deferred-tax-utilities.ts          # Deferred tax calculations (MFRS 112)
├── hedge-accounting-utilities.ts      # Hedge accounting (MFRS 9)
├── lease-accounting-utilities.ts      # Lease accounting (MFRS 16)
├── provisions-contingencies-utilities.ts # Provisions & contingencies (MFRS 137)
├── government-grants-utilities.ts     # Government grants (MFRS 120)
├── budget-variance-utilities.ts       # Budget/forecast variance analysis
│
├── 🔄 RECONCILIATION & MATCHING
├── bank-reconciliation-utilities.ts   # Bank reconciliation
├── dunning-utilities.ts               # Dunning management
├── aging-utilities.ts                 # Account aging
├── allocation-utilities.ts            # Cost allocation
│
├── 📄 DOCUMENT & NUMBERING UTILITIES
├── document-numbering-utilities.ts    # Document numbering
├── number-to-words-utilities.ts       # Number to words conversion
├── opening-balance-utilities.ts       # Opening balance management
├── revenue-recognition-utilities.ts    # Revenue recognition
├── accrual-deferral-utilities.ts      # Accrual and deferral
│
├── 🔧 FOUNDATION UTILITIES
├── validation-utilities.ts            # Data validation
├── validation-pipeline-utilities.ts   # Validation pipeline
├── error-utilities.ts                 # Error handling
├── formatting-utilities.ts            # Data formatting
├── date-utilities.ts                  # Date/time operations
├── collection-utilities.ts            # Array operations
├── object-utilities.ts                 # Object manipulation
├── safe-object.ts                     # Safe object access
├── omitUndefined.ts                   # Object cleaning
│
├── ⚡ PERFORMANCE & INFRASTRUCTURE
├── async-utilities.ts                  # Async operations
├── performance-utilities.ts           # Performance monitoring
├── caching-utilities.ts               # Caching mechanisms
├── monitoring-utilities.ts            # Monitoring and metrics
├── api-response-utilities.ts          # API response handling
│
├── 🏗️ ENTERPRISE PATTERNS
├── service-pattern-utilities.ts        # Service layer patterns
├── repository-pattern-utilities.ts    # Repository patterns
├── domain-event-utilities.ts          # Domain events
├── event-sourcing-utilities.ts        # Event sourcing
│
└── 📚 DOCUMENTATION
    ├── UTILITIES_EXTENSION_DEVELOPMENT_PLAN_PART1.md
    ├── UTILITIES_EXTENSION_DEVELOPMENT_PLAN_PART2.md
    ├── UTILITIES_EXTENSION_DEVELOPMENT_PLAN_PART3.md
    ├── UTILITIES_EXTENSION_DEVELOPMENT_PLAN_PART4.md
    └── UTILITIES_EXTENSION_DEVELOPMENT_PLAN_PART5.md
```

## 🚀 Quick Start

### Import from Barrel Export

```typescript
// Import everything you need from the single entry point
import { 
  // SSOT Policies
  DEFAULT_CURRENCY,
  DEFAULT_ROUNDING_METHOD,
  RoundingMethod,
  ConditionOperator,
  LogicalOperator,
  
  // Core accounting
  normalizeAccountCode,
  isValidAccountCode,
  calculateTax,
  
  // Money operations
  toMinorUnits,
  fromMinorUnits,
  roundToCurrency,
  
  // Date operations
  formatDate,
  parseDate,
  
  // Validation
  validateEmail,
  validateTaxId,
  
  // Formatting
  formatCurrency,
  formatPercentage,
  
  // Prefixed exports to avoid conflicts
  transactionWithTimeout,  // From transaction-utilities
  errorWithTimeout,        // From error-utilities
  PerformanceCache,        // From performance-utilities
  CachingCache,            // From caching-utilities
  ValidationUtilitiesOptions,  // From validation-utilities
  ServicePatternOptions,       // From service-pattern-utilities
  RepositoryPatternOptions     // From repository-pattern-utilities
} from './utils';
```

### ⚠️ Important: Naming Conflicts

Some utilities export types with the same names (e.g., `Transaction`, `ValidationResult`, etc.). When conflicts occur, use specific imports or aliases:

```typescript
// ✅ Good: Use aliased imports for conflicting types
import { 
  Transaction as BankTransaction,
  ValidationResult as BankValidationResult 
} from './bank-reconciliation-utilities';

import { 
  Transaction as ConsolidationTransaction,
  ValidationResult as ConsolidationValidationResult 
} from './consolidation-utilities';

// ✅ Good: Import directly from specific modules
import { Transaction } from './bank-reconciliation-utilities';
import { ValidationResult } from './consolidation-mapping-utilities';
```

See [BARREL_EXPORT_CONFLICTS_RESOLUTION.md](./BARREL_EXPORT_CONFLICTS_RESOLUTION.md) for detailed conflict resolution strategies.

### Import SSOT Modules Directly

```typescript
// Import SSOT policies for type safety
import { 
  DEFAULT_CURRENCY, 
  currencyDecimals,
  isSupportedCurrency 
} from './policies/currency-policy';

import { 
  RoundingMethod, 
  DEFAULT_ROUNDING_METHOD,
  roundNumber,
  normalizeRoundingMethod 
} from './policies/rounding-policy';

import { 
  ConditionOperator, 
  LogicalOperator,
  isConditionOperator,
  isLogicalOperator 
} from './shared-operators';

import { 
  toMinorUnits, 
  fromMinorUnits,
  addAmounts,
  subtractAmounts 
} from './money-helpers';
```

## 🎯 SSOT (Single Source of Truth) Architecture

### Currency Policy (`policies/currency-policy.ts`)

Centralized currency definitions and defaults:

```typescript
import { DEFAULT_CURRENCY, currencyDecimals, isSupportedCurrency } from './policies/currency-policy';

// Default currency
console.log(DEFAULT_CURRENCY); // 'MYR'

// Currency decimal precision
console.log(currencyDecimals('MYR')); // 2
console.log(currencyDecimals('JPY')); // 0
console.log(currencyDecimals('VND')); // 0

// Currency validation
console.log(isSupportedCurrency('USD')); // true
console.log(isSupportedCurrency('INVALID')); // false
```

### Rounding Policy (`policies/rounding-policy.ts`)

Centralized rounding methods with bankers rounding default:

```typescript
import { RoundingMethod, DEFAULT_ROUNDING_METHOD, roundNumber } from './policies/rounding-policy';

// Default rounding method
console.log(DEFAULT_ROUNDING_METHOD); // RoundingMethod.HALF_EVEN

// Rounding operations
const amount = 12.345;
console.log(roundNumber(amount, 2, RoundingMethod.HALF_EVEN)); // 12.34 (bankers rounding)
console.log(roundNumber(amount, 2, RoundingMethod.HALF_UP));   // 12.35 (round up)

// Backward compatibility
import { normalizeRoundingMethod } from './policies/rounding-policy';
console.log(normalizeRoundingMethod('round_half_up')); // RoundingMethod.HALF_UP
```

### Shared Operators (`shared-operators.ts`)

Centralized operator types for consistent filtering and validation:

```typescript
import { ConditionOperator, LogicalOperator, isConditionOperator } from './shared-operators';

// Type-safe operator usage
const condition: ConditionOperator = 'equals';
const logical: LogicalOperator = 'and';

// Runtime validation
if (isConditionOperator(userInput)) {
  // Safe to use as ConditionOperator
}
```

### Money Helpers (`money-helpers.ts`)

Currency conversion utilities with policy integration:

```typescript
import { toMinorUnits, fromMinorUnits, roundToCurrency, addAmounts } from './money-helpers';

// Currency conversion
const minor = toMinorUnits(12.34, 'MYR'); // 1234
const major = fromMinorUnits(1234, 'MYR'); // 12.34

// Currency arithmetic
const sum = addAmounts(10.50, 5.25, 'MYR'); // 15.75

// Currency rounding
const rounded = roundToCurrency(12.345, 'MYR'); // 12.34 (HALF_EVEN)
```

## 📚 Utility Categories

### 🏦 Core Accounting Utilities

**Files:** `accounting-utilities.ts`, `financial-utilities.ts`, `journal-entry-utilities.ts`

Essential accounting operations and business logic with SSOT integration.

```typescript
import { 
  normalizeAccountCode,
  isValidAccountCode,
  calculateTax,
  roundToCurrency,
  DEFAULT_CURRENCY
} from './utils';

// Account code operations
const code = normalizeAccountCode('1000-001');
const isValid = isValidAccountCode(code);

// Currency operations with SSOT defaults
const rounded = roundToCurrency(123.456, DEFAULT_CURRENCY); // Uses MYR + HALF_EVEN
```

### 💰 Tax & Compliance Utilities

**Files:** `tax-core-utilities.ts`, `tax-reconciliation-utilities.ts`, `withholding-tax-utilities.ts`

Comprehensive tax calculation and compliance management.

```typescript
import { 
  calculateTax,
  applyTaxRounding,
  RoundingMethod,
  DEFAULT_ROUNDING_METHOD
} from './utils';

// Tax calculations with SSOT rounding
const tax = calculateTax(1000, 0.1, 'inclusive');
const roundedTax = applyTaxRounding(tax, DEFAULT_ROUNDING_METHOD, 2);
```

### 🏭 Assets & Inventory Utilities

**Files:** `fixed-asset-utilities.ts`, `inventory-costing-utilities.ts`, `manufacturing-overhead-utilities.ts`

Fixed asset depreciation, inventory costing, and manufacturing overhead allocation.

```typescript
import { 
  calculateDepreciation,
  calculateInventoryCost,
  allocateManufacturingOverhead,
  RoundingMethod
} from './utils';

// Depreciation with consistent rounding
const depreciation = calculateDepreciation(10000, 5, 'straight-line', RoundingMethod.HALF_EVEN);
```

### 🌍 Multi-Currency & FX Utilities

**Files:** `fx-ledger-utilities.ts`, `fx-revaluation-utilities.ts`, `multi-currency-rules-utilities.ts`

Foreign exchange management and multi-currency operations.

```typescript
import { 
  convertCurrency,
  applyCurrencyPrecision,
  RoundingMethod,
  DEFAULT_CURRENCY
} from './utils';

// FX operations with SSOT policies
const converted = convertCurrency(1000, 'USD', 'MYR', 4.2);
const precise = applyCurrencyPrecision(converted, DEFAULT_CURRENCY, RoundingMethod.HALF_EVEN);
```

### 🔄 Reconciliation & Matching

**Files:** `bank-reconciliation-utilities.ts`, `dunning-utilities.ts`, `aging-utilities.ts`

Bank reconciliation, dunning management, and account aging.

```typescript
import { 
  matchBankTransactions,
  calculateDunningFees,
  calculateAccountAging,
  ConditionOperator,
  LogicalOperator
} from './utils';

// Reconciliation with SSOT operators
const matches = matchBankTransactions(transactions, glEntries, {
  conditions: [
    { field: 'amount', operator: 'equals' as ConditionOperator, value: 100 },
    { logicalOperator: 'and' as LogicalOperator }
  ]
});
```

### 📊 Financial Statements & Reporting

**Files:** `financial-statements-utilities.ts`, `tb-cf-mapping-utilities.ts`, `cashflow-mapping-utilities.ts`

Financial statement generation and mapping utilities.

```typescript
import { 
  generateIncomeStatement,
  mapTrialBalanceToCashFlow,
  categorizeCashFlow,
  DEFAULT_CURRENCY,
  RoundingMethod
} from './utils';

// Statement generation with SSOT defaults
const statement = generateIncomeStatement(trialBalance, {
  currency: DEFAULT_CURRENCY,
  roundingMethod: RoundingMethod.HALF_EVEN
});
```

### 🏢 Consolidation & Governance

**Files:** `consolidation-utilities.ts`, `coa-governance-utilities.ts`, `posting-rules-utilities.ts`

Intercompany eliminations, Chart of Accounts governance, and posting rules.

```typescript
import { 
  performIntercompanyElimination,
  validateChartOfAccounts,
  applyPostingRules,
  ConditionOperator
} from './utils';

// Consolidation with SSOT operators
const elimination = performIntercompanyElimination(entities, {
  conditions: [
    { field: 'entityType', operator: 'equals' as ConditionOperator, value: 'subsidiary' }
  ]
});
```

### 📄 Document & Numbering Utilities

**Files:** `document-numbering-utilities.ts`, `number-to-words-utilities.ts`, `opening-balance-utilities.ts`

Document numbering, number-to-words conversion, and opening balance management.

```typescript
import { 
  generateDocumentNumber,
  convertNumberToWords,
  processOpeningBalance,
  DEFAULT_CURRENCY
} from './utils';

// Document operations with SSOT currency
const docNumber = generateDocumentNumber('INV', 2024, 1);
const words = convertNumberToWords(1234.56, DEFAULT_CURRENCY);
```

### 🔧 Foundation Utilities

**Files:** `validation-utilities.ts`, `error-utilities.ts`, `formatting-utilities.ts`, `date-utilities.ts`

Core validation, error handling, formatting, and date operations.

```typescript
import { 
  validateEmail,
  validateTaxId,
  createValidationError,
  formatCurrency,
  formatDate,
  DEFAULT_CURRENCY
} from './utils';

// Validation and formatting with SSOT defaults
const emailValid = validateEmail('user@example.com');
const formatted = formatCurrency(1234.56, DEFAULT_CURRENCY, 'en-US');
```

### ⚡ Performance & Infrastructure

**Files:** `async-utilities.ts`, `performance-utilities.ts`, `caching-utilities.ts`, `monitoring-utilities.ts`

Async operations, performance monitoring, caching, and observability.

```typescript
import { 
  delay,
  retry,
  measureTime,
  PerformanceTimer,
  CacheManager
} from './utils';

// Performance monitoring
const result = await measureTime(async () => {
  return await expensiveOperation();
});

// Caching with performance tracking
const cache = new CacheManager<string, Account>({
  maxSize: 1000,
  ttl: 300000
});
```

### 🏗️ Enterprise Patterns

**Files:** `service-pattern-utilities.ts`, `repository-pattern-utilities.ts`, `domain-event-utilities.ts`

Service layer patterns, repository patterns, and domain event management.

```typescript
import { 
  ServiceBase,
  DomainServiceBase,
  BaseRepository,
  DomainEventFactory
} from './utils';

// Service pattern with error handling
class AccountService extends DomainServiceBase {
  async createAccount(data: AccountData): Promise<Account> {
    return this.executeOperation('createAccount', async () => {
      return await this.repository.save(account);
    });
  }
}
```

## 🧪 Testing

### SSOT Policy Tests

The comprehensive test suite validates SSOT implementation:

```bash
# Run SSOT policy tests
npm test -- --testPathPattern=policies-enhanced

# Run all utility tests
npm test -- --testPathPattern=utils
```

### Test Coverage

```bash
# Generate coverage report
npm run test:coverage -- --testPathPattern=utils
```

## 🔧 Configuration

### Environment Variables

```bash
# SSOT Policy Configuration
DEFAULT_CURRENCY=MYR
DEFAULT_ROUNDING_METHOD=HALF_EVEN

# Performance monitoring
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_SAMPLE_RATE=0.1

# Caching
CACHE_TTL=300000
CACHE_MAX_SIZE=1000

# Validation
VALIDATION_STRICT_MODE=true
VALIDATION_LOCALE=en-US
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## 🚀 Best Practices

### SSOT Usage

```typescript
// ✅ Good: Use SSOT imports
import { DEFAULT_CURRENCY, RoundingMethod } from './policies/currency-policy';
import { ConditionOperator } from './shared-operators';

// ✅ Good: Use SSOT defaults
const amount = roundToCurrency(123.456, DEFAULT_CURRENCY);

// ❌ Avoid: Hardcoded values
const amount = roundToCurrency(123.456, 'MYR');
```

### Import Strategy

```typescript
// ✅ Good: Import from barrel for convenience
import { validateEmail, formatCurrency, DEFAULT_CURRENCY } from './utils';

// ✅ Good: Import SSOT modules directly for type safety
import { RoundingMethod, DEFAULT_ROUNDING_METHOD } from './policies/rounding-policy';

// ✅ Good: Import specific modules for tree-shaking
import { validateEmail } from './validation-utilities';
```

### Error Handling

```typescript
// ✅ Good: Use structured error handling
try {
  const result = await operation();
  return result;
} catch (error) {
  throw createValidationError('field', 'Invalid value', value, context);
}
```

### Performance Monitoring

```typescript
// ✅ Good: Monitor critical operations
const result = await measureTime(async () => {
  return await expensiveOperation();
});

// ✅ Good: Use SSOT defaults for consistency
const rounded = roundToCurrency(amount, DEFAULT_CURRENCY);
```

## 🔒 Security

### Input Validation

- All user inputs are validated using the validation utilities
- SSOT operators provide type-safe filtering
- Currency validation prevents invalid currency codes

### Error Handling

- Sensitive information is not exposed in error messages
- Structured error logging for security monitoring
- Context-aware error handling with SSOT policies

## 📊 Performance Considerations

### Memory Usage

- SSOT modules minimize memory footprint through centralized definitions
- Caching utilities include automatic cleanup
- Performance monitoring includes memory tracking

### Execution Time

- SSOT policies eliminate duplicate type checking
- Critical paths are optimized for performance
- Async operations use efficient patterns

### Bundle Size

- Tree-shakable exports for optimal bundle size
- SSOT modules prevent duplicate code
- Modular imports for better code splitting

## 🎯 Anti-Drift Guarantees

The SSOT architecture provides comprehensive anti-drift protection:

### Type Safety

- Centralized type definitions prevent inconsistencies
- Type guards provide runtime validation
- ESLint rules prevent redefinition of SSOT types

### Policy Consistency

- MYR default currency enforced across all utilities
- HALF_EVEN bankers rounding as standard
- Consistent operator types for filtering and validation

### Testing Coverage

- Comprehensive test suite validates SSOT implementation
- Integration tests ensure cross-utility consistency
- Backward compatibility tests maintain existing behavior

## 🔧 Barrel Export Conflicts Resolution

### Current Status

✅ **Resolved Critical Conflicts:**
- `withTimeout` conflict between `transaction-utilities` and `error-utilities`
- `Cache` conflict between `performance-utilities` and `caching-utilities`
- `ValidationOptions` conflict between `validation-utilities` and `validation-pipeline-utilities`
- `ServiceOptions` conflict in `service-pattern-utilities`
- `RepositoryOptions` and `QueryOptions` conflicts in `repository-pattern-utilities`

⚠️ **Remaining Conflicts:**
Some utilities export types with the same names (e.g., `Transaction`, `ValidationResult`, `DateRange`, etc.). These are documented with clear warnings and resolution strategies.

### Resolution Strategy

1. **Critical conflicts** are resolved with explicit re-exports and prefixed names
2. **Common conflicts** are documented with clear warnings and import examples
3. **Developer guidance** is provided for handling conflicts in their code

### Import Best Practices

```typescript
// ✅ Best: Use specific imports
import { normalizeAccountCode, validateEmail } from './utils';

// ✅ Good: Use aliased imports for conflicts
import { Transaction as BankTransaction } from './bank-reconciliation-utilities';

// ✅ Good: Import directly from modules
import { ValidationResult } from './consolidation-mapping-utilities';
```

See [BARREL_EXPORT_CONFLICTS_RESOLUTION.md](./BARREL_EXPORT_CONFLICTS_RESOLUTION.md) for comprehensive conflict resolution strategies.

## 📝 Contributing

### Adding New Utilities

1. Create the utility file in the appropriate category
2. Add exports to `index.ts`
3. Use SSOT modules for consistent types and policies
4. Write comprehensive tests including SSOT validation
5. Update this README
6. Follow the established patterns

### Code Style

- Use TypeScript strict mode
- Import from SSOT modules for consistency
- Follow the established naming conventions
- Include JSDoc comments for public APIs
- Use consistent error handling patterns

## 📄 License

This utilities package is part of the AIBOS ERP system and follows the same licensing terms.

---

**Last Updated:** December 2024  
**Version:** 2.0.0 (SSOT Architecture)  
**Maintainer:** AIBOS ERP Development Team  
**SSOT Status:** ✅ Fully Implemented and Tested
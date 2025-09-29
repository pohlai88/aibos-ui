# Accounting Utilities

A comprehensive collection of utilities for the AIBOS ERP accounting system. This directory contains 23 utility modules providing essential functionality for accounting operations, data validation, performance monitoring, and enterprise patterns.

## 📁 Directory Structure

```
utils/
├── README.md                           # This documentation
├── index.ts                           # Barrel export (single entry point)
├── accounting-utilities.ts            # Core accounting operations
├── api-response-utilities.ts          # Standardized API responses
├── async-utilities.ts                 # Async operations & promises
├── caching-utilities.ts               # Caching mechanisms
├── collection-utilities.ts            # Array & collection operations
├── date-utilities.ts                  # Date/time operations
├── domain-event-utilities.ts          # Domain event management
├── error-utilities.ts                 # Error handling & types
├── event-sourcing-utilities.ts        # Event sourcing patterns
├── financial-utilities.ts             # Financial calculations
├── formatting-utilities.ts            # Data formatting
├── monitoring-utilities.ts            # Performance monitoring
├── object-utilities.ts                # Object manipulation
├── omitUndefined.ts                   # Object cleaning utilities
├── performance-utilities.ts           # Performance measurement
├── repository-pattern-utilities.ts    # Data access patterns
├── safe-object.ts                     # Safe object access
├── service-pattern-utilities.ts       # Service layer patterns
├── transaction-utilities.ts           # Transaction management
├── validation-pipeline-utilities.ts   # Validation pipeline
├── validation-utilities.ts            # Data validation
└── __tests__/                         # Test files
```

## 🚀 Quick Start

### Import from Barrel Export

```typescript
// Import everything you need from the single entry point
import { 
  // Core accounting
  normalizeAccountCode,
  isValidAccountCode,
  calculateTax,
  
  // Date operations
  formatDate,
  parseDate,
  
  // Validation
  validateEmail,
  validateTaxId,
  
  // Formatting
  formatCurrency,
  formatPercentage,
  
  // Error handling
  createValidationError,
  ErrorContext,
  
  // Performance
  measureTime,
  PerformanceTimer
} from './utils';
```

### Import Specific Modules

```typescript
// Import from specific modules for better tree-shaking
import { formatCurrency } from './formatting-utilities';
import { validateEmail } from './validation-utilities';
import { measureTime } from './performance-utilities';
```

## 📚 Utility Categories

### 🏦 Core Accounting Utilities
**File:** `accounting-utilities.ts`

Essential accounting operations and business logic.

```typescript
import { 
  normalizeAccountCode,
  isValidAccountCode,
  validateAccountCode,
  SUPPORTED_CURRENCIES,
  CURRENCY_DECIMALS,
  roundToCurrency,
  toMinor,
  fromMinor
} from './utils';

// Account code operations
const code = normalizeAccountCode('1000-001');
const isValid = isValidAccountCode(code);

// Currency operations
const minor = toMinor(123.45, 'USD'); // 12345
const major = fromMinor(12345, 'USD'); // 123.45
```

### 📅 Date & Time Utilities
**File:** `date-utilities.ts`

Comprehensive date/time operations for accounting periods, fiscal years, and reporting.

```typescript
import { 
  formatDate,
  parseDate,
  addBusinessDays,
  getFiscalYear,
  getFiscalQuarter,
  ACCOUNTING_TIMEZONES,
  ACCOUNTING_LOCALES
} from './utils';

// Date formatting
const formatted = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');

// Fiscal year operations
const fy = getFiscalYear(new Date(), 'US');
const quarter = getFiscalQuarter(new Date(), 'US');
```

### 💰 Financial Calculation Utilities
**File:** `financial-utilities.ts`

Tax calculations, discounts, margins, depreciation, and financial analysis.

```typescript
import { 
  calculateTax,
  calculateDiscount,
  calculateDepreciation,
  calculateNPV,
  calculateIRR,
  calculateCompoundInterest
} from './utils';

// Tax calculations
const tax = calculateTax(1000, 0.1, 'inclusive');

// Depreciation
const depreciation = calculateDepreciation(10000, 5, 'straight-line');
```

### ✅ Validation Utilities
**File:** `validation-utilities.ts`

Data validation for emails, tax IDs, bank accounts, and business entities.

```typescript
import { 
  validateEmail,
  validateTaxId,
  validateCreditCard,
  validateBankAccount,
  validateAmount,
  validatePercentage,
  validateCurrencyCode
} from './utils';

// Email validation
const emailValid = validateEmail('user@example.com');

// Tax ID validation (supports multiple countries)
const taxIdValid = validateTaxId('123456789', 'US');
```

### 🎨 Formatting Utilities
**File:** `formatting-utilities.ts`

Currency, percentage, number, and text formatting with locale support.

```typescript
import { 
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatAccountCode,
  formatPhoneNumber
} from './utils';

// Currency formatting
const currency = formatCurrency(1234.56, 'USD', 'en-US');

// Percentage formatting
const percentage = formatPercentage(0.1234, 'en-US');
```

### ⚠️ Error Handling Utilities
**File:** `error-utilities.ts`

Structured error handling, custom error classes, and error context management.

```typescript
import { 
  createValidationError,
  createBusinessError,
  ValidationError,
  BusinessError,
  ErrorContext
} from './utils';

// Create validation errors
throw createValidationError('email', 'Invalid email format', email);

// Create business errors
throw createBusinessError('INSUFFICIENT_FUNDS', 'Account balance too low', context);
```

### 🔄 Async & Promise Utilities
**File:** `async-utilities.ts`

Promise utilities, rate limiting, throttling, debouncing, and async patterns.

```typescript
import { 
  delay,
  retry,
  timeout,
  debounce,
  throttle,
  batchProcess
} from './utils';

// Retry with exponential backoff
const result = await retry(fetchData, { maxAttempts: 3, delay: 1000 });

// Debounce function calls
const debouncedSearch = debounce(searchFunction, 300);
```

### 📊 Performance Utilities
**File:** `performance-utilities.ts`

Performance monitoring, caching, profiling, and optimization tools.

```typescript
import { 
  measureTime,
  PerformanceTimer,
  MemoryMonitor,
  getMemoryUsage,
  forceGarbageCollection
} from './utils';

// Measure execution time
const result = await measureTime(async () => {
  return await expensiveOperation();
});

// Memory monitoring
const memory = getMemoryUsage();
console.log(`Heap used: ${memory.heapUsed} bytes`);
```

### 🏗️ Service Pattern Utilities
**File:** `service-pattern-utilities.ts`

Standardized service base classes and patterns for consistent error handling.

```typescript
import { 
  ServiceBase,
  DomainServiceBase,
  ApplicationServiceBase,
  InfrastructureServiceBase
} from './utils';

class AccountService extends DomainServiceBase {
  async createAccount(data: AccountData): Promise<Account> {
    return this.executeOperation('createAccount', async () => {
      // Business logic here
      return await this.repository.save(account);
    });
  }
}
```

### 🗄️ Repository Pattern Utilities
**File:** `repository-pattern-utilities.ts`

Standardized repository base classes and patterns for consistent data access.

```typescript
import { 
  BaseRepository,
  DomainRepositoryBase,
  InfrastructureRepositoryBase,
  FindOptions,
  SaveOptions
} from './utils';

class AccountRepository extends DomainRepositoryBase<Account, string> {
  async findByCode(code: string): Promise<Account | null> {
    return this.findOne({ code });
  }
}
```

### 🔄 Transaction Utilities
**File:** `transaction-utilities.ts`

Standardized transaction management, retry logic, and rollback strategies.

```typescript
import { 
  TransactionManager,
  withRetry,
  withTimeout,
  withAbort,
  delayAsync
} from './utils';

// Transaction management
const result = await TransactionManager.execute([
  { name: 'createAccount', execute: () => createAccount(data) },
  { name: 'updateBalance', execute: () => updateBalance(accountId, amount) }
], { enableRollback: true });

// Retry with timeout
const data = await withRetry(
  () => withTimeout(fetchData(), 5000),
  { maxAttempts: 3, delay: 1000 }
);
```

### 📡 API Response Utilities
**File:** `api-response-utilities.ts`

Standardized API response building and handling for consistent response formats.

```typescript
import { 
  ApiResponseBuilder,
  ControllerBase,
  SuccessResponse,
  ErrorResponse,
  createPaginationMetadata
} from './utils';

class AccountController extends ControllerBase {
  async getAccounts(req: Request): Promise<SuccessResponse<Account[]>> {
    return this.success(accounts, {
      pagination: createPaginationMetadata(page, limit, total)
    });
  }
}
```

### 📈 Monitoring Utilities
**File:** `monitoring-utilities.ts`

Comprehensive monitoring, metrics collection, and observability utilities.

```typescript
import { 
  MonitoringHelper,
  createTrace,
  createSpan,
  recordMetric,
  createAlert
} from './utils';

// Tracing
const trace = createTrace('account-creation');
const span = trace.createSpan('validate-account');

// Metrics
recordMetric('accounts.created', 1, { type: 'business' });

// Alerts
createAlert('HIGH_ERROR_RATE', 'Error rate exceeded threshold', {
  severity: 'high',
  threshold: 0.05
});
```

### 🎯 Validation Pipeline Utilities
**File:** `validation-pipeline-utilities.ts`

Flexible validation pipeline system for complex validation scenarios.

```typescript
import { 
  ValidationPipeline,
  each,
  every,
  custom,
  required,
  minLength,
  maxLength
} from './utils';

const pipeline = new ValidationPipeline<AccountData>()
  .add(required('name'))
  .add(minLength('name', 2))
  .add(custom('email', validateEmail))
  .add(every('lines', required('amount')));

const result = await pipeline.validate(accountData);
```

### 🏛️ Domain Event Utilities
**File:** `domain-event-utilities.ts`

Standardized domain event creation, handling, and management.

```typescript
import { 
  DomainEventFactory,
  createDomainEvent,
  EventHandler,
  EventStore
} from './utils';

// Create domain events
const event = DomainEventFactory.createDomainEvent('AccountCreated', {
  accountId: 'acc-123',
  name: 'Test Account'
});

// Event handling
class AccountEventHandler extends EventHandler {
  async handle(event: DomainEvent): Promise<void> {
    // Handle event
  }
}
```

### 🗂️ Collection Utilities
**File:** `collection-utilities.ts`

Array operations, sorting, filtering, and collection management.

```typescript
import { 
  groupBy,
  sortBy,
  filterBy,
  unique,
  chunk,
  flatten,
  topK
} from './utils';

// Collection operations
const grouped = groupBy(accounts, 'type');
const sorted = sortBy(accounts, ['name', 'createdAt']);
const uniqueAccounts = unique(accounts, 'id');
```

### 🔧 Object Utilities
**File:** `object-utilities.ts`

Deep cloning, merging, object transformation, and immutable operations.

```typescript
import { 
  deepClone,
  deepMerge,
  pick,
  omit,
  transform,
  validateObjectSchema
} from './utils';

// Object operations
const cloned = deepClone(account);
const merged = deepMerge(account, updates);
const picked = pick(account, ['id', 'name', 'balance']);
```

### 💾 Caching Utilities
**File:** `caching-utilities.ts`

Comprehensive caching mechanisms and strategies for performance optimization.

```typescript
import { 
  CacheManager,
  ScopedCache,
  CacheHelpers,
  DistributedCacheUtilities
} from './utils';

// Cache management
const cache = new CacheManager<string, Account>({
  maxSize: 1000,
  ttl: 300000 // 5 minutes
});

const account = await cache.get('acc-123');
```

### 🎭 Event Sourcing Utilities
**File:** `event-sourcing-utilities.ts`

Advanced event sourcing patterns and utilities for aggregate reconstruction.

```typescript
import { 
  BaseAggregateRoot,
  EventStore,
  Snapshot,
  AggregateRepository
} from './utils';

class AccountAggregate extends BaseAggregateRoot<AccountState> {
  createAccount(data: AccountData): void {
    this.apply(new AccountCreatedEvent(data));
  }
}
```

### 🛡️ Safe Object Utilities
**File:** `safe-object.ts`

Safe object access, type guards, and object manipulation utilities.

```typescript
import { 
  safeGet,
  safeSet,
  safeDelete,
  isDefined,
  isNotNull
} from './utils';

// Safe object access
const value = safeGet(account, 'balance.amount', 0);
const updated = safeSet(account, 'balance.amount', 1000);
```

### 🧹 Omit Undefined Utilities
**File:** `omitUndefined.ts`

Object cleaning utilities to remove undefined values.

```typescript
import { omitUndefined } from './utils';

// Remove undefined values
const clean = omitUndefined({
  name: 'Account',
  balance: undefined,
  type: 'asset'
});
// Result: { name: 'Account', type: 'asset' }
```

## 🔧 Configuration

### Environment Variables

```bash
# Performance monitoring
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_SAMPLE_RATE=0.1

# Caching
CACHE_TTL=300000
CACHE_MAX_SIZE=1000

# Validation
VALIDATION_STRICT_MODE=true
VALIDATION_LOCALE=en-US

# Monitoring
MONITORING_ENABLED=true
METRICS_EXPORT_INTERVAL=60000
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

## 🧪 Testing

### Running Tests

```bash
# Run all utility tests
npm test -- --testPathPattern=utils

# Run specific utility tests
npm test -- --testPathPattern=validation-utilities
npm test -- --testPathPattern=financial-utilities
```

### Test Coverage

```bash
# Generate coverage report
npm run test:coverage -- --testPathPattern=utils
```

## 📊 Performance Considerations

### Memory Usage
- All utilities are designed for minimal memory footprint
- Caching utilities include automatic cleanup
- Performance monitoring includes memory tracking

### Execution Time
- Critical paths are optimized for performance
- Async operations use efficient patterns
- Validation pipelines are optimized for speed

### Bundle Size
- Tree-shakable exports for optimal bundle size
- Minimal external dependencies
- Modular imports for better code splitting

## 🔒 Security

### Input Validation
- All user inputs are validated using the validation utilities
- SQL injection prevention in repository patterns
- XSS protection in formatting utilities

### Error Handling
- Sensitive information is not exposed in error messages
- Structured error logging for security monitoring
- Context-aware error handling

## 🚀 Best Practices

### Import Strategy
```typescript
// ✅ Good: Import from barrel for convenience
import { validateEmail, formatCurrency } from './utils';

// ✅ Good: Import specific modules for tree-shaking
import { validateEmail } from './validation-utilities';
import { formatCurrency } from './formatting-utilities';

// ❌ Avoid: Importing from individual files when barrel exists
import { validateEmail } from './validation-utilities';
import { formatCurrency } from './formatting-utilities';
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

// ❌ Avoid: Generic error throwing
throw new Error('Something went wrong');
```

### Performance Monitoring
```typescript
// ✅ Good: Monitor critical operations
const result = await measureTime(async () => {
  return await expensiveOperation();
});

// ✅ Good: Use performance timers for long operations
const timer = new PerformanceTimer();
// ... operation
const metrics = timer.getMetrics();
```

## 📝 Contributing

### Adding New Utilities

1. Create the utility file in the appropriate category
2. Add exports to `index.ts`
3. Write comprehensive tests
4. Update this README
5. Follow the established patterns

### Code Style

- Use TypeScript strict mode
- Follow the established naming conventions
- Include JSDoc comments for public APIs
- Use consistent error handling patterns

## 📄 License

This utilities package is part of the AIBOS ERP system and follows the same licensing terms.

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** AIBOS ERP Development Team

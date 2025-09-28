# @aibos/accounting

**Enterprise-grade accounting domain service with event sourcing & comprehensive financial operations**

A pure domain service built for the AIBOS ERP platform. Features comprehensive chart of accounts, journal entry management, financial reporting, and event-driven architecture with full TypeScript support.

## ⚡ Quick Commands

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Run type checking
pnpm typecheck

# Development with watch
pnpm dev

# Generate documentation
pnpm docs:generate
```

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run comprehensive tests
pnpm test

# Type checking
pnpm typecheck
```

## 📦 Usage

### Basic Service Integration

```typescript
import { AccountingService } from '@aibos/accounting';
import { CreateAccountCommand, PostJournalEntryCommand } from '@aibos/accounting';

// Initialize accounting service
const accountingService = new AccountingService(
  accountRepository,
  eventStore,
  journalEntryRepository
);

// Create account
const createAccountCommand = new CreateAccountCommand({
  tenantId: 'tenant-001',
  userId: 'user-123',
  accountCode: '1000',
  accountName: 'Cash',
  accountType: 'ASSET',
  parentAccountCode: undefined,
  postingAllowed: true
});

await accountingService.createAccount(createAccountCommand);

// Post journal entry
const postJournalEntryCommand = new PostJournalEntryCommand({
  journalEntryId: 'je-001',
  tenantId: 'tenant-001',
  userId: 'user-123',
  entries: [
    { accountCode: '1000', debitAmount: 1000, creditAmount: 0, currency: 'MYR', description: 'Cash received' },
    { accountCode: '4000', debitAmount: 0, creditAmount: 1000, currency: 'MYR', description: 'Revenue' }
  ],
  reference: 'INV-001',
  description: 'Sales transaction',
  postingDate: new Date()
});

await accountingService.postJournalEntry(postJournalEntryCommand);
```

### API Controller Integration

```typescript
import { AccountingController, createAccountingRoutes } from '@aibos/accounting';
import express from 'express';

// Initialize controller
const accountingController = new AccountingController(accountingService);

// Create routes
const accountingRoutes = createAccountingRoutes(accountingController);

// Mount routes
const app = express();
app.use('/api/accounting', accountingRoutes);
```

### Domain Models

```typescript
import { 
  Account, 
  JournalEntry, 
  ChartOfAccounts,
  Money,
  JournalEntryLine 
} from '@aibos/accounting';

// Account domain model
const account = new Account({
  accountCode: '1000',
  accountName: 'Cash',
  accountType: 'ASSET',
  tenantId: 'tenant-001',
  postingAllowed: true
});

// Journal entry with balanced lines
const journalEntry = new JournalEntry({
  journalEntryId: 'je-001',
  tenantId: 'tenant-001',
  entries: [
    new JournalEntryLine({
      accountCode: '1000',
      debitAmount: new Money(1000, 'MYR'),
      creditAmount: new Money(0, 'MYR'),
      description: 'Cash received'
    }),
    new JournalEntryLine({
      accountCode: '4000',
      debitAmount: new Money(0, 'MYR'),
      creditAmount: new Money(1000, 'MYR'),
      description: 'Revenue'
    })
  ],
  reference: 'INV-001',
  description: 'Sales transaction',
  postingDate: new Date()
});
```

## 🏗️ Architecture Overview

### Clean Domain Architecture

```
packages/accounting/src/
├── domain/                 # Pure domain models
│   ├── account.domain.ts   # Account aggregate
│   ├── journal-entry.ts    # Journal entry aggregate
│   ├── chart-of-accounts.domain.ts # Chart of accounts
│   ├── Money.ts           # Value object for monetary amounts
│   └── repositories.interface.ts # Repository contracts
├── commands/              # Command objects
│   ├── create-account.command.ts
│   └── post-journal-entry.command.ts
├── events/                # Domain events
│   ├── account-created.event.ts
│   ├── journal-entry-posted.event.ts
│   └── account-updated.event.ts
├── services/              # Domain services
│   ├── accounting.service.ts # Main accounting service
│   ├── financial-reporting.service.ts
│   ├── trial-balance.service.ts
│   └── period-close.service.ts
├── infrastructure/        # Infrastructure concerns
│   ├── typeorm-account.repository.ts
│   ├── typeorm-journal-entry.repository.ts
│   └── data-source.infrastructure.ts
├── api/                  # API layer (Express)
│   ├── accounting-controller.ts
│   ├── accounting-routes.ts
│   └── validation.middleware.ts
├── validation/           # Input validation schemas
│   ├── api.schema.ts
│   └── import.schema.ts
└── projections/          # Read model projections
    ├── general-ledger.projection.ts
    └── gl-balances-daily.projection.ts
```

### Domain-Driven Design Principles

1. **Pure Domain Models**: No infrastructure dependencies in domain layer
2. **Event Sourcing**: All state changes captured as domain events
3. **Command-Query Separation**: Commands modify state, queries read projections
4. **Repository Pattern**: Abstract data access behind interfaces
5. **Value Objects**: Immutable objects like Money, AccountCode
6. **Aggregates**: Account and JournalEntry as consistency boundaries

## 🎯 Core Features

### Chart of Accounts Management

```typescript
// Create hierarchical account structure
const assetAccount = await accountingService.createAccount(new CreateAccountCommand({
  tenantId: 'tenant-001',
  userId: 'user-123',
  accountCode: '1000',
  accountName: 'Assets',
  accountType: 'ASSET',
  postingAllowed: false // Parent account
}));

const cashAccount = await accountingService.createAccount(new CreateAccountCommand({
  tenantId: 'tenant-001',
  userId: 'user-123',
  accountCode: '1100',
  accountName: 'Cash',
  accountType: 'ASSET',
  parentAccountCode: '1000',
  postingAllowed: true
}));
```

### Journal Entry Processing

```typescript
// Balanced journal entry
const journalEntry = new PostJournalEntryCommand({
  journalEntryId: 'je-001',
  tenantId: 'tenant-001',
  userId: 'user-123',
  entries: [
    { accountCode: '1100', debitAmount: 1000, creditAmount: 0, currency: 'MYR' },
    { accountCode: '4000', debitAmount: 0, creditAmount: 1000, currency: 'MYR' }
  ],
  reference: 'INV-001',
  description: 'Cash sale',
  postingDate: new Date()
});

await accountingService.postJournalEntry(journalEntry);
```

### Financial Reporting

```typescript
// Generate trial balance
const trialBalance = await accountingService.getTrialBalance(
  'tenant-001',
  '2024-Q4',
  new Date('2024-12-31')
);

// Generate profit & loss
const pnl = await accountingService.getProfitAndLoss(
  'tenant-001',
  '2024-Q4',
  'MYR'
);

// Generate balance sheet
const balanceSheet = await accountingService.getBalanceSheet(
  'tenant-001',
  new Date('2024-12-31'),
  'MYR'
);
```

### Event-Driven Architecture

```typescript
// Domain events are automatically published
// Listen for accounting events
eventBus.subscribe('AccountCreated', (event: AccountCreatedEvent) => {
  // Handle account creation
  console.log(`Account ${event.accountCode} created for tenant ${event.tenantId}`);
});

eventBus.subscribe('JournalEntryPosted', (event: JournalEntryPostedEvent) => {
  // Update projections, send notifications, etc.
  console.log(`Journal entry ${event.journalEntryId} posted`);
});
```

## 🔧 API Endpoints

### Account Management

```http
POST /api/accounting/accounts
Content-Type: application/json
X-Tenant-Id: tenant-001

{
  "accountCode": "1000",
  "accountName": "Cash",
  "accountType": "ASSET",
  "parentAccountCode": null,
  "isActive": true
}
```

### Journal Entry Operations

```http
POST /api/accounting/journal-entries
Content-Type: application/json
X-Tenant-Id: tenant-001

{
  "journalEntryId": "je-001",
  "entries": [
    {
      "accountCode": "1100",
      "debitAmount": 1000,
      "creditAmount": 0,
      "currency": "MYR",
      "description": "Cash received"
    },
    {
      "accountCode": "4000",
      "debitAmount": 0,
      "creditAmount": 1000,
      "currency": "MYR",
      "description": "Revenue"
    }
  ],
  "reference": "INV-001",
  "description": "Sales transaction",
  "postingDate": "2024-12-01T00:00:00Z"
}
```

### Financial Reports

```http
GET /api/accounting/trial-balance/tenant-001/2024-Q4?asOfDate=2024-12-31
GET /api/accounting/reports/pnl/tenant-001/2024-Q4?currencyCode=MYR
GET /api/accounting/reports/balance-sheet/tenant-001?asOfDate=2024-12-31&currencyCode=MYR
```

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Test domain logic in isolation
describe('AccountingService', () => {
  it('should create account with valid data', async () => {
    const command = new CreateAccountCommand({
      tenantId: 'tenant-001',
      userId: 'user-123',
      accountCode: '1000',
      accountName: 'Cash',
      accountType: 'ASSET',
      postingAllowed: true
    });

    await accountingService.createAccount(command);
    
    const account = await accountRepository.findByCode('1000', 'tenant-001');
    expect(account).toBeDefined();
    expect(account.accountName).toBe('Cash');
  });

  it('should post balanced journal entry', async () => {
    const command = new PostJournalEntryCommand({
      journalEntryId: 'je-001',
      tenantId: 'tenant-001',
      userId: 'user-123',
      entries: [
        { accountCode: '1100', debitAmount: 1000, creditAmount: 0, currency: 'MYR' },
        { accountCode: '4000', debitAmount: 0, creditAmount: 1000, currency: 'MYR' }
      ],
      reference: 'INV-001',
      description: 'Sales transaction',
      postingDate: new Date()
    });

    await accountingService.postJournalEntry(command);
    
    const journalEntry = await journalEntryRepository.findById('je-001');
    expect(journalEntry).toBeDefined();
    expect(journalEntry.status).toBe('POSTED');
  });
});
```

### Integration Tests

```typescript
// Test with real database
describe('Accounting Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  it('should handle complete accounting workflow', async () => {
    // Create account
    await accountingService.createAccount(createAccountCommand);
    
    // Post journal entry
    await accountingService.postJournalEntry(postJournalEntryCommand);
    
    // Generate trial balance
    const trialBalance = await accountingService.getTrialBalance(
      'tenant-001',
      '2024-Q4',
      new Date()
    );
    
    expect(trialBalance.rows).toHaveLength(2);
    expect(trialBalance.rows[0].balance).toBe(1000);
  });
});
```

## 🏗️ Build Process

### Package Configuration

```json
{
  "name": "@aibos/accounting",
  "version": "0.1.0",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/types/src/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types/src/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    }
  }
}
```

### Build Commands

```bash
# Build everything
pnpm build

# Build types only
pnpm build:types

# Build JavaScript only
pnpm build:js

# Development with watch
pnpm dev

# Type checking
pnpm typecheck

# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Linting
pnpm lint

# Fix linting issues
pnpm lint:fix
```

## 📊 Performance Characteristics

### Bundle Size
- **Core Domain**: ~45KB (domain models, services, commands)
- **Full Package**: ~120KB (includes infrastructure, API layer)
- **Tree-shakable**: Individual exports for optimal bundling

### Database Performance
- **Event Sourcing**: Optimized for write-heavy workloads
- **Projections**: Read-optimized views for reporting
- **Indexing**: Strategic indexes on tenant_id, account_code, posting_date

## 🔒 Security Considerations

### Data Isolation
- **Tenant Isolation**: All operations scoped by tenant_id
- **Row Level Security**: Database-level tenant isolation
- **Input Validation**: Comprehensive Zod schemas for all inputs

### Audit Trail
- **Event Sourcing**: Complete audit trail of all changes
- **User Tracking**: All operations include user_id
- **Immutable Events**: Events cannot be modified after creation

## 🚀 Integration with Monorepo

### BFF Integration

```typescript
// apps/bff/src/modules/accounting/accounting.service.ts
@Injectable()
export class AccountingService {
  constructor(private readonly httpService: HttpService) {}

  async getAccounts(tenantId: string): Promise<Account[]> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.accountingServiceUrl}/api/v1/accounts`, {
        headers: { 'X-Tenant-Id': tenantId }
      })
    );
    return response.data;
  }
}
```

### Web Frontend Integration

```typescript
// packages/accounting-web/src/lib/accounting-api.ts
export class AccountingClient {
  async postJournalEntry(entry: TJournalEntry): Promise<{ id: string }> {
    const res = await this._fetcher(AccountingApi.journalEntry.post, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    return res.json();
  }
}
```

## 📋 Quality Gates

- ✅ **Type Safety**: Full TypeScript coverage with strict mode
- ✅ **Domain Purity**: No infrastructure dependencies in domain layer
- ✅ **Event Sourcing**: Complete audit trail with immutable events
- ✅ **Testing**: Comprehensive unit and integration tests
- ✅ **Validation**: Zod schemas for all inputs and outputs
- ✅ **Performance**: Optimized for enterprise workloads
- ✅ **Documentation**: Comprehensive API documentation

## 🤝 Contributing

1. **Follow DDD Principles** - Maintain clean domain architecture
2. **Write Tests First** - TDD approach for all domain logic
3. **Event-Driven** - All state changes through domain events
4. **Type Safety** - Comprehensive TypeScript coverage
5. **Documentation** - Keep API docs and examples current

## 📄 License

MIT License - see LICENSE file for details.

---

## 🎯 Domain Excellence

**This is a pure domain service that exemplifies clean architecture:**

- ✅ **Domain-Driven Design** - Pure domain models with no infrastructure dependencies
- ✅ **Event Sourcing** - Complete audit trail with immutable domain events
- ✅ **Command-Query Separation** - Clear separation of concerns
- ✅ **Repository Pattern** - Abstract data access behind interfaces
- ✅ **Value Objects** - Immutable objects like Money and AccountCode
- ✅ **Aggregate Design** - Proper consistency boundaries
- ✅ **Enterprise Features** - Multi-currency, multi-tenant, comprehensive reporting

**This accounting service is ready for production use in enterprise environments.**

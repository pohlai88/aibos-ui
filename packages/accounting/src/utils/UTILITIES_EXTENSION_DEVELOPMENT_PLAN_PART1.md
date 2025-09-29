# Accounting Utilities Extension Development Plan - Part 1
## Core GL & Posting + Periods, Closing, Controls

**Version:** 1.0.0  
**Date:** December 2024  
**Scope:** Priority 1 & 2 Utilities (7 modules)  
**Estimated Timeline:** 4-6 weeks  

---

## 📋 Overview

This document outlines the development plan for the first phase of pure accounting utilities extensions. Part 1 focuses on the foundational GL operations and period management that form the core of any accounting system.

### **Part 1 Scope**
- **Priority 1:** Core GL & Posting (4 utilities)
- **Priority 2:** Periods, Closing, Controls (3 utilities)
- **Total:** 7 utility modules

---

## 🎯 Priority 1: Core GL & Posting

### **1.1 journal-entry-utilities.ts**

#### **Purpose**
Build, validate, and balance journal entries with automatic suspense account handling.

#### **Key Features**
- **Entry Building**: Construct journal entries from business transactions
- **Balance Validation**: Ensure debit = credit with configurable tolerance
- **Auto-Plug to Suspense**: Automatically create balancing entries
- **Entry Normalization**: Standardize entry formats and line ordering
- **Multi-Currency Support**: Handle entries in different currencies
- **Line Item Validation**: Validate individual line items

#### **Core Functions**
```typescript
// Entry Building
buildJournalEntry(transaction: BusinessTransaction): JournalEntry
buildBalancedEntry(lines: JournalLine[], options?: BalanceOptions): JournalEntry
normalizeJournalEntry(entry: JournalEntry): JournalEntry

// Balance Validation
validateEntryBalance(entry: JournalEntry, tolerance?: number): BalanceValidationResult
isEntryBalanced(entry: JournalEntry, tolerance?: number): boolean

// Auto-Plug to Suspense
createSuspenseEntry(unbalancedLines: JournalLine[], suspenseAccount: string): JournalLine
autoBalanceEntry(entry: JournalEntry, suspenseAccount: string): JournalEntry

// Line Item Operations
addLineToEntry(entry: JournalEntry, line: JournalLine): JournalEntry
removeLineFromEntry(entry: JournalEntry, lineId: string): JournalEntry
updateLineAmount(entry: JournalEntry, lineId: string, amount: number): JournalEntry
```

#### **Types & Interfaces**
```typescript
interface JournalEntry {
  id: string;
  date: Date;
  reference: string;
  description: string;
  lines: JournalLine[];
  totalDebits: number;
  totalCredits: number;
  currency: SupportedCurrency;
  status: 'draft' | 'posted' | 'cancelled';
}

interface JournalLine {
  id: string;
  accountCode: string;
  description: string;
  debit: number;
  credit: number;
  currency: SupportedCurrency;
  dimensions?: Record<string, string>;
}

interface BalanceValidationResult {
  isBalanced: boolean;
  difference: number;
  tolerance: number;
  withinTolerance: boolean;
  issues: ValidationIssue[];
}
```

#### **Implementation Notes**
- Leverage existing `validateJournalEntry()` from validation-utilities
- Use `SupportedCurrency` from accounting-utilities
- Integrate with `createValidationError()` for error handling
- Support both minor units and decimal precision

---

### **1.2 posting-rules-utilities.ts**

#### **Purpose**
Map business intents to standardized double-entry templates for consistent posting.

#### **Key Features**
- **Rule Engine**: Define and execute posting rules
- **Template Management**: Manage double-entry templates
- **Business Intent Mapping**: Map business events to accounting entries
- **Rule Validation**: Validate posting rules and templates
- **Dynamic Posting**: Generate entries based on business context

#### **Core Functions**
```typescript
// Rule Management
definePostingRule(intent: BusinessIntent, template: PostingTemplate): PostingRule
validatePostingRule(rule: PostingRule): ValidationResult
executePostingRule(rule: PostingRule, context: BusinessContext): JournalEntry

// Template Operations
createPostingTemplate(name: string, lines: TemplateLine[]): PostingTemplate
validateTemplate(template: PostingTemplate): ValidationResult
applyTemplate(template: PostingTemplate, context: BusinessContext): JournalEntry

// Business Intent Mapping
mapIntentToRule(intent: BusinessIntent): PostingRule[]
findRulesByIntent(intent: BusinessIntent): PostingRule[]
```

#### **Types & Interfaces**
```typescript
interface PostingRule {
  id: string;
  name: string;
  businessIntent: BusinessIntent;
  template: PostingTemplate;
  conditions: RuleCondition[];
  priority: number;
  active: boolean;
}

interface PostingTemplate {
  id: string;
  name: string;
  description: string;
  lines: TemplateLine[];
  validationRules: TemplateValidationRule[];
}

interface TemplateLine {
  accountCode: string;
  description: string;
  debitFormula: string;
  creditFormula: string;
  conditions?: LineCondition[];
}

interface BusinessIntent {
  type: 'invoice_posted' | 'payment_received' | 'expense_incurred' | 'asset_purchased';
  context: Record<string, any>;
}
```

#### **Implementation Notes**
- Use expression parser for formula evaluation
- Integrate with validation-utilities for rule validation
- Support conditional posting based on business context
- Maintain rule versioning and audit trail

---

### **1.3 trial-balance-utilities.ts**

#### **Purpose**
Build trial balances with period filters and perform hard accounting checks.

#### **Key Features**
- **Trial Balance Builder**: Generate trial balances for any period
- **Period Filtering**: Filter by date ranges, fiscal periods
- **Hard Checks**: Validate accounting equation (Assets = Liabilities + Equity)
- **Account Grouping**: Group accounts by type and category
- **Variance Analysis**: Compare periods and identify variances
- **Export Capabilities**: Export to various formats

#### **Core Functions**
```typescript
// Trial Balance Generation
buildTrialBalance(accounts: Account[], entries: JournalEntry[], period: DateRange): TrialBalance
buildTrialBalanceByPeriod(accounts: Account[], entries: JournalEntry[], period: FiscalPeriod): TrialBalance
buildComparativeTrialBalance(current: TrialBalance, prior: TrialBalance): ComparativeTrialBalance

// Hard Checks
validateAccountingEquation(trialBalance: TrialBalance): EquationValidationResult
validateJournalEntrySums(entries: JournalEntry[]): SumValidationResult
checkTrialBalanceIntegrity(trialBalance: TrialBalance): IntegrityCheckResult

// Analysis
calculateVariances(current: TrialBalance, prior: TrialBalance): VarianceAnalysis
identifySignificantVariances(trialBalance: TrialBalance, threshold: number): SignificantVariance[]
```

#### **Types & Interfaces**
```typescript
interface TrialBalance {
  period: DateRange;
  accounts: TrialBalanceAccount[];
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
  generatedAt: Date;
}

interface TrialBalanceAccount {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  openingBalance: number;
  periodDebits: number;
  periodCredits: number;
  closingBalance: number;
  balanceType: 'debit' | 'credit';
}

interface EquationValidationResult {
  isValid: boolean;
  assets: number;
  liabilities: number;
  equity: number;
  difference: number;
  withinTolerance: boolean;
}
```

#### **Implementation Notes**
- Use existing `AccountType` from accounting-utilities
- Integrate with date-utilities for period handling
- Support multiple currencies and conversion
- Implement efficient aggregation algorithms

---

### **1.4 opening-balance-utilities.ts**

#### **Purpose**
Handle opening balance imports, retained earnings carry-forward, and period 0 checks.

#### **Key Features**
- **Opening Balance Import**: Import and validate opening balances
- **Retained Earnings Calculation**: Calculate and post retained earnings
- **Period 0 Validation**: Validate opening period data
- **Balance Carry-Forward**: Carry forward balances between periods
- **Import Validation**: Validate imported balance data

#### **Core Functions**
```typescript
// Opening Balance Management
importOpeningBalances(balances: OpeningBalance[], period: FiscalPeriod): ImportResult
validateOpeningBalances(balances: OpeningBalance[]): ValidationResult
postOpeningBalances(balances: OpeningBalance[], period: FiscalPeriod): JournalEntry

// Retained Earnings
calculateRetainedEarnings(priorPeriod: FiscalPeriod, currentPeriod: FiscalPeriod): RetainedEarningsCalculation
postRetainedEarnings(calculation: RetainedEarningsCalculation): JournalEntry
validateRetainedEarnings(calculation: RetainedEarningsCalculation): ValidationResult

// Period 0 Operations
validatePeriod0Data(period: FiscalPeriod, balances: OpeningBalance[]): ValidationResult
createPeriod0Entries(balances: OpeningBalance[]): JournalEntry[]
```

#### **Types & Interfaces**
```typescript
interface OpeningBalance {
  accountCode: string;
  accountName: string;
  balance: number;
  balanceType: 'debit' | 'credit';
  currency: SupportedCurrency;
  dimensions?: Record<string, string>;
}

interface RetainedEarningsCalculation {
  priorPeriodEnd: number;
  currentPeriodNetIncome: number;
  dividends: number;
  adjustments: number;
  calculatedRetainedEarnings: number;
  period: FiscalPeriod;
}

interface ImportResult {
  success: boolean;
  importedCount: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  journalEntry?: JournalEntry;
}
```

#### **Implementation Notes**
- Integrate with fiscal-period-utilities for period handling
- Use existing currency utilities for multi-currency support
- Implement robust validation for imported data
- Support batch processing for large imports

---

## 🎯 Priority 2: Periods, Closing, Controls

### **2.1 fiscal-period-utilities.ts**

#### **Purpose**
Manage configurable fiscal periods (4-4-5, monthly) with open/close rules and backdate windows.

#### **Key Features**
- **Period Configuration**: Define fiscal year structures (4-4-5, monthly, custom)
- **Period Status Management**: Track open/close/soft-lock status
- **Backdate Windows**: Control backdating within defined windows
- **Period Validation**: Validate period configurations and status
- **Period Calculations**: Calculate period ranges and boundaries

#### **Core Functions**
```typescript
// Period Configuration
createFiscalYear(year: number, structure: PeriodStructure): FiscalYear
validatePeriodStructure(structure: PeriodStructure): ValidationResult
calculatePeriodBoundaries(year: number, structure: PeriodStructure): PeriodBoundary[]

// Status Management
openPeriod(period: FiscalPeriod): PeriodStatusChange
closePeriod(period: FiscalPeriod): PeriodStatusChange
softLockPeriod(period: FiscalPeriod): PeriodStatusChange
getPeriodStatus(period: FiscalPeriod): PeriodStatus

// Backdate Control
validateBackdateWindow(period: FiscalPeriod, transactionDate: Date): BackdateValidationResult
calculateBackdateWindow(period: FiscalPeriod): DateRange
isWithinBackdateWindow(period: FiscalPeriod, date: Date): boolean
```

#### **Types & Interfaces**
```typescript
interface FiscalYear {
  year: number;
  structure: PeriodStructure;
  periods: FiscalPeriod[];
  startDate: Date;
  endDate: Date;
}

interface FiscalPeriod {
  id: string;
  year: number;
  period: number;
  name: string;
  startDate: Date;
  endDate: Date;
  status: PeriodStatus;
  backdateWindow: number; // days
}

interface PeriodStructure {
  type: 'monthly' | 'quarterly' | '4-4-5' | 'custom';
  periods: number;
  customPeriods?: CustomPeriodDefinition[];
}

interface PeriodStatus {
  status: 'open' | 'closed' | 'soft-locked';
  openedAt?: Date;
  closedAt?: Date;
  openedBy?: string;
  closedBy?: string;
}
```

#### **Implementation Notes**
- Extend existing date-utilities for period calculations
- Integrate with validation-utilities for status validation
- Support multiple fiscal year structures
- Implement audit trail for status changes

---

### **2.2 accrual-deferral-utilities.ts**

#### **Purpose**
Generate accrual and deferral schedules with reversing entry assistance.

#### **Key Features**
- **Schedule Generation**: Create accrual/deferral schedules
- **Reversing Entries**: Generate automatic reversing entries
- **Schedule Management**: Manage and track accrual schedules
- **Calculation Engine**: Calculate accrual amounts and timing
- **Validation**: Validate accrual schedules and entries

#### **Core Functions**
```typescript
// Schedule Generation
createAccrualSchedule(transaction: AccrualTransaction, options: AccrualOptions): AccrualSchedule
createDeferralSchedule(transaction: DeferralTransaction, options: DeferralOptions): DeferralSchedule
generateReversingEntries(schedule: AccrualSchedule): JournalEntry[]

// Schedule Management
updateAccrualSchedule(schedule: AccrualSchedule, updates: Partial<AccrualSchedule>): AccrualSchedule
validateAccrualSchedule(schedule: AccrualSchedule): ValidationResult
calculateAccrualAmount(schedule: AccrualSchedule, asOfDate: Date): number

// Entry Generation
generateAccrualEntry(schedule: AccrualSchedule, period: FiscalPeriod): JournalEntry
generateDeferralEntry(schedule: DeferralSchedule, period: FiscalPeriod): JournalEntry
generateReversingEntry(originalEntry: JournalEntry, reverseDate: Date): JournalEntry
```

#### **Types & Interfaces**
```typescript
interface AccrualSchedule {
  id: string;
  transactionId: string;
  description: string;
  totalAmount: number;
  currency: SupportedCurrency;
  startDate: Date;
  endDate: Date;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  entries: AccrualEntry[];
  status: 'active' | 'completed' | 'cancelled';
}

interface AccrualEntry {
  period: FiscalPeriod;
  amount: number;
  posted: boolean;
  postedAt?: Date;
  journalEntryId?: string;
}

interface AccrualOptions {
  method: 'straight-line' | 'pro-rata' | 'custom';
  includeReversingEntries: boolean;
  reversalDelay: number; // days
  autoPost: boolean;
}
```

#### **Implementation Notes**
- Integrate with fiscal-period-utilities for period handling
- Use existing journal-entry-utilities for entry generation
- Support multiple accrual methods and frequencies
- Implement automatic posting capabilities

---

### **2.3 allocation-utilities.ts**

#### **Purpose**
Handle cost center and dimension allocations with rounding governance.

#### **Key Features**
- **Allocation Rules**: Define allocation rules for cost centers and dimensions
- **Allocation Engine**: Execute allocations based on defined rules
- **Rounding Governance**: Handle rounding differences and adjustments
- **Allocation Validation**: Validate allocation rules and results
- **Multi-Dimension Support**: Support complex multi-dimensional allocations

#### **Core Functions**
```typescript
// Rule Management
defineAllocationRule(source: AllocationSource, targets: AllocationTarget[], method: AllocationMethod): AllocationRule
validateAllocationRule(rule: AllocationRule): ValidationResult
executeAllocation(rule: AllocationRule, amount: number, context: AllocationContext): AllocationResult

// Allocation Engine
allocateByPercentage(amount: number, percentages: AllocationPercentage[]): AllocationResult
allocateByDriver(amount: number, drivers: AllocationDriver[]): AllocationResult
allocateByFixedAmount(amount: number, fixedAmounts: AllocationFixed[]): AllocationResult

// Rounding Governance
applyRoundingGovernance(result: AllocationResult, method: RoundingMethod): AllocationResult
distributeRoundingDifference(result: AllocationResult, method: RoundingDistributionMethod): AllocationResult
validateAllocationBalance(result: AllocationResult, tolerance: number): ValidationResult
```

#### **Types & Interfaces**
```typescript
interface AllocationRule {
  id: string;
  name: string;
  description: string;
  source: AllocationSource;
  targets: AllocationTarget[];
  method: AllocationMethod;
  roundingMethod: RoundingMethod;
  active: boolean;
}

interface AllocationSource {
  accountCode: string;
  dimension: string;
  value: string;
}

interface AllocationTarget {
  accountCode: string;
  dimension: string;
  value: string;
  percentage?: number;
  driver?: string;
  fixedAmount?: number;
}

interface AllocationResult {
  sourceAmount: number;
  allocatedAmount: number;
  allocations: Allocation[];
  roundingDifference: number;
  isBalanced: boolean;
}

interface Allocation {
  target: AllocationTarget;
  amount: number;
  percentage: number;
  driverValue?: number;
}
```

#### **Implementation Notes**
- Integrate with existing rounding utilities from accounting-utilities
- Support multiple allocation methods and drivers
- Implement robust rounding difference handling
- Provide audit trail for allocation executions

---

## 📅 Implementation Timeline

### **Week 1-2: Core GL & Posting**
- **Day 1-3:** journal-entry-utilities.ts
- **Day 4-6:** posting-rules-utilities.ts
- **Day 7-10:** trial-balance-utilities.ts
- **Day 11-14:** opening-balance-utilities.ts

### **Week 3-4: Periods, Closing, Controls**
- **Day 15-18:** fiscal-period-utilities.ts
- **Day 19-22:** accrual-deferral-utilities.ts
- **Day 23-28:** allocation-utilities.ts

### **Week 5-6: Integration & Testing**
- **Day 29-35:** Integration testing
- **Day 36-42:** Documentation and refinement

---

## 🔧 Technical Requirements

### **Dependencies**
- Existing utilities: accounting-utilities, validation-utilities, date-utilities
- External: None (pure domain logic)
- TypeScript: Strict mode, full type safety

### **Testing Strategy**
- Unit tests for each utility function
- Integration tests with existing utilities
- Performance tests for large datasets
- Validation tests for edge cases

### **Documentation**
- JSDoc comments for all public functions
- Usage examples and best practices
- Integration guides with existing utilities
- Performance considerations and limitations

---

## 📊 Success Metrics

### **Functional Metrics**
- ✅ All 7 utilities implemented and tested
- ✅ 100% TypeScript type coverage
- ✅ Integration with existing utilities
- ✅ Comprehensive validation and error handling

### **Quality Metrics**
- ✅ Zero linting errors
- ✅ 90%+ test coverage
- ✅ Performance benchmarks met
- ✅ Documentation completeness

### **Business Metrics**
- ✅ Core GL operations supported
- ✅ Period management capabilities
- ✅ Allocation and accrual functionality
- ✅ Foundation for advanced features

---

**Next:** Part 2 will cover Priority 3 & 4 utilities (Multi-currency & FX, Tax domain-pure)

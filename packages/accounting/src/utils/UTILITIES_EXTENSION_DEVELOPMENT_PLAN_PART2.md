# Accounting Utilities Extension Development Plan - Part 2
## Multi-currency & FX + Tax (Domain-Pure) + Revenue, AR/AP

**Version:** 1.0.0  
**Date:** December 2024  
**Scope:** Priority 3, 4 & 5 Utilities (9 modules)  
**Estimated Timeline:** 6-8 weeks  

---

## 📋 Overview

This document outlines the development plan for the second phase of pure accounting utilities extensions. Part 2 focuses on multi-currency operations, tax calculations, and revenue/AR/AP management.

### **Part 2 Scope**
- **Priority 3:** Multi-currency & FX (3 utilities)
- **Priority 4:** Tax (domain-pure) (3 utilities)
- **Priority 5:** Revenue, AR/AP (3 utilities)
- **Total:** 9 utility modules

---

## 🎯 Priority 3: Multi-currency & FX

### **3.1 fx-ledger-utilities.ts**

#### **Purpose**
Handle FX conversions with mid/buy/sell rates, triangulation, and precision per currency.

#### **Key Features**
- **Rate Management**: Manage exchange rates (mid, buy, sell)
- **Triangulation**: Calculate rates through intermediate currencies
- **Precision Control**: Currency-specific precision handling
- **Rate Validation**: Validate exchange rates and conversions
- **Historical Rates**: Support historical rate lookups

#### **Core Functions**
```typescript
// Rate Management
getExchangeRate(fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency, rateType: RateType, date: Date): ExchangeRate
setExchangeRate(fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency, rate: ExchangeRate): void
validateExchangeRate(rate: ExchangeRate): ValidationResult

// Conversion Operations
convertAmount(amount: number, fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency, rate: ExchangeRate): ConversionResult
convertWithTriangulation(amount: number, fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency, baseCurrency: SupportedCurrency): ConversionResult
convertMultipleAmounts(amounts: CurrencyAmount[], toCurrency: SupportedCurrency, date: Date): ConversionResult[]

// Precision Handling
applyCurrencyPrecision(amount: number, currency: SupportedCurrency, method: RoundingMethod): number
calculatePrecisionDifference(original: number, converted: number, currency: SupportedCurrency): number
```

#### **Types & Interfaces**
```typescript
interface ExchangeRate {
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  rateType: RateType;
  rate: number;
  date: Date;
  source: string;
  valid: boolean;
}

interface ConversionResult {
  originalAmount: number;
  convertedAmount: number;
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  rate: number;
  rateType: RateType;
  precisionDifference: number;
  conversionDate: Date;
}

interface CurrencyAmount {
  amount: number;
  currency: SupportedCurrency;
  precision: number;
}

type RateType = 'mid' | 'buy' | 'sell' | 'spot' | 'forward';
```

#### **Implementation Notes**
- Leverage existing `SupportedCurrency` and rounding utilities
- Implement efficient rate lookup and caching
- Support multiple rate sources and validation
- Handle edge cases for currency precision

---

### **3.2 fx-revaluation-utilities.ts**

#### **Purpose**
Handle realized/unrealized GL revaluations and period-end adjustments.

#### **Key Features**
- **Revaluation Engine**: Calculate revaluation gains/losses
- **Realized vs Unrealized**: Distinguish between realized and unrealized FX
- **Period-End Adjustments**: Generate period-end revaluation entries
- **Revaluation History**: Track revaluation history and changes
- **Validation**: Validate revaluation calculations and entries

#### **Core Functions**
```typescript
// Revaluation Calculations
calculateRevaluationGainLoss(account: FXAccount, currentRate: ExchangeRate, historicalRate: ExchangeRate): RevaluationResult
calculateRealizedGainLoss(transaction: FXTransaction, settlementRate: ExchangeRate): RealizedResult
calculateUnrealizedGainLoss(account: FXAccount, currentRate: ExchangeRate): UnrealizedResult

// Period-End Operations
generatePeriodEndRevaluation(accounts: FXAccount[], period: FiscalPeriod): RevaluationEntry[]
postRevaluationEntries(entries: RevaluationEntry[]): JournalEntry[]
validateRevaluationEntries(entries: RevaluationEntry[]): ValidationResult

// History and Tracking
trackRevaluationHistory(account: FXAccount, revaluation: RevaluationResult): void
getRevaluationHistory(account: FXAccount, period: DateRange): RevaluationHistory[]
calculateCumulativeRevaluation(account: FXAccount, asOfDate: Date): number
```

#### **Types & Interfaces**
```typescript
interface FXAccount {
  accountCode: string;
  currency: SupportedCurrency;
  baseCurrency: SupportedCurrency;
  balance: number;
  lastRevaluationDate: Date;
  lastRevaluationRate: number;
  revaluationMethod: RevaluationMethod;
}

interface RevaluationResult {
  account: FXAccount;
  currentRate: number;
  historicalRate: number;
  revaluationAmount: number;
  revaluationType: 'gain' | 'loss';
  isRealized: boolean;
  period: FiscalPeriod;
}

interface RevaluationEntry {
  accountCode: string;
  revaluationAmount: number;
  revaluationType: 'gain' | 'loss';
  isRealized: boolean;
  rate: number;
  period: FiscalPeriod;
}

type RevaluationMethod = 'current_rate' | 'historical_rate' | 'average_rate';
```

#### **Implementation Notes**
- Integrate with fx-ledger-utilities for rate management
- Use existing journal-entry-utilities for entry generation
- Support multiple revaluation methods and policies
- Implement comprehensive audit trail

---

### **3.3 multi-currency-rules-utilities.ts**

#### **Purpose**
Handle base vs transaction vs reporting currency math and validation.

#### **Key Features**
- **Currency Hierarchy**: Manage base, transaction, and reporting currencies
- **Conversion Rules**: Define conversion rules and priorities
- **Validation Engine**: Validate multi-currency transactions
- **Reporting Currency**: Handle reporting currency conversions
- **Rule Management**: Manage and validate currency rules

#### **Core Functions**
```typescript
// Currency Hierarchy
setBaseCurrency(currency: SupportedCurrency): void
setReportingCurrency(currency: SupportedCurrency): void
getCurrencyHierarchy(): CurrencyHierarchy
validateCurrencyHierarchy(hierarchy: CurrencyHierarchy): ValidationResult

// Conversion Rules
defineConversionRule(fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency, rule: ConversionRule): void
executeConversionRule(amount: number, rule: ConversionRule, context: ConversionContext): ConversionResult
validateConversionRule(rule: ConversionRule): ValidationResult

// Multi-Currency Validation
validateMultiCurrencyTransaction(transaction: MultiCurrencyTransaction): ValidationResult
validateCurrencyConsistency(accounts: MultiCurrencyAccount[]): ValidationResult
checkCurrencyBalance(account: MultiCurrencyAccount, currency: SupportedCurrency): BalanceCheckResult
```

#### **Types & Interfaces**
```typescript
interface CurrencyHierarchy {
  baseCurrency: SupportedCurrency;
  reportingCurrency: SupportedCurrency;
  transactionCurrencies: SupportedCurrency[];
  conversionRules: ConversionRule[];
}

interface ConversionRule {
  id: string;
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  method: ConversionMethod;
  rateSource: RateSource;
  priority: number;
  active: boolean;
}

interface MultiCurrencyTransaction {
  id: string;
  baseCurrency: SupportedCurrency;
  transactionCurrency: SupportedCurrency;
  reportingCurrency: SupportedCurrency;
  amounts: CurrencyAmount[];
  conversionRates: ExchangeRate[];
}

interface MultiCurrencyAccount {
  accountCode: string;
  baseCurrency: SupportedCurrency;
  balances: Record<SupportedCurrency, number>;
  lastConversionDate: Date;
  conversionRules: ConversionRule[];
}

type ConversionMethod = 'direct' | 'triangulation' | 'cross_rate';
type RateSource = 'central_bank' | 'market' | 'internal' | 'external';
```

#### **Implementation Notes**
- Integrate with fx-ledger-utilities for rate management
- Use existing validation-utilities for rule validation
- Support complex currency hierarchies and rules
- Implement efficient conversion rule execution

---

## 🎯 Priority 4: Tax (Domain-Pure)

### **4.1 tax-core-utilities.ts**

#### **Purpose**
Indirect tax engine with inclusive/exclusive calculations, rounding steps, and reconciliation.

#### **Key Features**
- **Tax Calculation Engine**: Calculate indirect taxes (VAT, GST, Sales Tax)
- **Inclusive/Exclusive Logic**: Handle both inclusive and exclusive tax calculations
- **Rounding Steps**: Manage rounding at each calculation step
- **Line/Summary Reconciliation**: Reconcile line-level and summary-level taxes
- **Zero-Rated/Exempt Logic**: Handle zero-rated and exempt transactions

#### **Core Functions**
```typescript
// Tax Calculations
calculateTax(amount: number, taxRate: number, method: TaxCalculationMethod, options?: TaxOptions): TaxCalculationResult
calculateInclusiveTax(grossAmount: number, taxRate: number, options?: TaxOptions): TaxCalculationResult
calculateExclusiveTax(netAmount: number, taxRate: number, options?: TaxOptions): TaxCalculationResult

// Rounding Management
applyTaxRounding(amount: number, method: TaxRoundingMethod): number
calculateRoundingDifference(original: number, rounded: number): number
distributeRoundingDifference(amounts: number[], difference: number, method: RoundingDistributionMethod): number[]

// Reconciliation
reconcileTaxLines(lines: TaxLine[], summary: TaxSummary): ReconciliationResult
validateTaxReconciliation(lines: TaxLine[], summary: TaxSummary, tolerance: number): ValidationResult
calculateTaxVariance(lines: TaxLine[], summary: TaxSummary): TaxVariance

// Zero-Rated/Exempt
applyZeroRatedTax(amount: number, taxRate: number): TaxCalculationResult
applyExemptTax(amount: number, taxRate: number): TaxCalculationResult
validateTaxExemption(exemption: TaxExemption, transaction: TaxTransaction): ValidationResult
```

#### **Types & Interfaces**
```typescript
interface TaxCalculationResult {
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  taxRate: number;
  method: TaxCalculationMethod;
  roundingSteps: RoundingStep[];
  isZeroRated: boolean;
  isExempt: boolean;
}

interface TaxLine {
  lineNumber: number;
  description: string;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  grossAmount: number;
  taxType: TaxType;
  isZeroRated: boolean;
  isExempt: boolean;
}

interface TaxSummary {
  totalNetAmount: number;
  totalTaxAmount: number;
  totalGrossAmount: number;
  taxBreakdown: TaxBreakdown[];
  roundingDifference: number;
}

interface TaxBreakdown {
  taxRate: number;
  netAmount: number;
  taxAmount: number;
  lineCount: number;
}

type TaxCalculationMethod = 'inclusive' | 'exclusive' | 'mixed';
type TaxRoundingMethod = 'round_up' | 'round_down' | 'round_half_up' | 'round_half_even';
type TaxType = 'vat' | 'gst' | 'sales_tax' | 'service_tax';
```

#### **Implementation Notes**
- Integrate with existing rounding utilities from accounting-utilities
- Use existing validation-utilities for tax validation
- Support multiple tax types and calculation methods
- Implement comprehensive rounding step tracking

---

### **4.2 withholding-tax-utilities.ts**

#### **Purpose**
Withholding tax base definition, gross-up helpers, and separate payable mapping.

#### **Key Features**
- **Withholding Tax Rules**: Define withholding tax rules and rates
- **Gross-Up Calculations**: Calculate gross amounts including withholding tax
- **Payable Mapping**: Map withholding tax to separate payables
- **Rate Management**: Manage withholding tax rates by jurisdiction
- **Validation**: Validate withholding tax calculations and compliance

#### **Core Functions**
```typescript
// Rule Management
defineWithholdingTaxRule(jurisdiction: string, taxType: WithholdingTaxType, rate: number, conditions: TaxCondition[]): WithholdingTaxRule
validateWithholdingTaxRule(rule: WithholdingTaxRule): ValidationResult
findApplicableRule(transaction: WithholdingTransaction, jurisdiction: string): WithholdingTaxRule[]

// Gross-Up Calculations
calculateGrossUp(netAmount: number, withholdingRate: number, options?: GrossUpOptions): GrossUpResult
calculateWithholdingTax(grossAmount: number, withholdingRate: number, options?: WithholdingOptions): WithholdingResult
validateGrossUpCalculation(result: GrossUpResult): ValidationResult

// Payable Mapping
mapWithholdingPayable(withholding: WithholdingTax, payableAccount: string): PayableMapping
createWithholdingPayable(withholding: WithholdingTax, vendor: string, period: FiscalPeriod): WithholdingPayable
validatePayableMapping(mapping: PayableMapping): ValidationResult
```

#### **Types & Interfaces**
```typescript
interface WithholdingTaxRule {
  id: string;
  jurisdiction: string;
  taxType: WithholdingTaxType;
  rate: number;
  minimumAmount: number;
  maximumAmount: number;
  conditions: TaxCondition[];
  active: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
}

interface GrossUpResult {
  netAmount: number;
  withholdingTax: number;
  grossAmount: number;
  withholdingRate: number;
  grossUpFactor: number;
  calculationMethod: GrossUpMethod;
}

interface WithholdingResult {
  grossAmount: number;
  withholdingTax: number;
  netAmount: number;
  withholdingRate: number;
  applicableRule: WithholdingTaxRule;
  jurisdiction: string;
}

interface WithholdingPayable {
  id: string;
  vendor: string;
  period: FiscalPeriod;
  totalWithholding: number;
  currency: SupportedCurrency;
  status: PayableStatus;
  dueDate: Date;
  paidDate?: Date;
}

type WithholdingTaxType = 'income_tax' | 'vat' | 'gst' | 'service_tax' | 'royalty';
type GrossUpMethod = 'simple' | 'compound' | 'reverse';
type PayableStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
```

#### **Implementation Notes**
- Integrate with existing tax-core-utilities for tax calculations
- Use existing validation-utilities for rule validation
- Support multiple jurisdictions and tax types
- Implement comprehensive compliance tracking

---

### **4.3 tax-reconciliation-utilities.ts**

#### **Purpose**
Line vs header reconciliation, tolerance checks, and tax variance analysis.

#### **Key Features**
- **Reconciliation Engine**: Reconcile line-level and header-level taxes
- **Tolerance Management**: Define and apply tolerance rules
- **Variance Analysis**: Analyze and explain tax variances
- **Exception Handling**: Handle reconciliation exceptions and discrepancies
- **Reporting**: Generate reconciliation reports and summaries

#### **Core Functions**
```typescript
// Reconciliation Operations
reconcileTaxLines(lines: TaxLine[], header: TaxHeader, tolerance: number): ReconciliationResult
reconcileTaxPeriods(currentPeriod: TaxPeriod, priorPeriod: TaxPeriod, tolerance: number): PeriodReconciliationResult
reconcileTaxAccounts(accounts: TaxAccount[], period: FiscalPeriod, tolerance: number): AccountReconciliationResult

// Tolerance Management
defineToleranceRule(taxType: TaxType, toleranceType: ToleranceType, value: number, method: ToleranceMethod): ToleranceRule
applyTolerance(amount: number, tolerance: ToleranceRule): ToleranceResult
validateTolerance(amount: number, expected: number, tolerance: ToleranceRule): ValidationResult

// Variance Analysis
analyzeTaxVariance(variance: TaxVariance, context: VarianceContext): VarianceAnalysis
identifyVarianceCauses(variance: TaxVariance, historicalData: TaxHistory[]): VarianceCause[]
calculateVarianceImpact(variance: TaxVariance, financialImpact: boolean): ImpactAnalysis
```

#### **Types & Interfaces**
```typescript
interface ReconciliationResult {
  isReconciled: boolean;
  lineTotal: number;
  headerTotal: number;
  difference: number;
  withinTolerance: boolean;
  tolerance: number;
  variances: TaxVariance[];
  exceptions: ReconciliationException[];
}

interface TaxVariance {
  id: string;
  type: VarianceType;
  amount: number;
  percentage: number;
  cause: string;
  impact: VarianceImpact;
  period: FiscalPeriod;
  account: string;
}

interface ToleranceRule {
  id: string;
  taxType: TaxType;
  toleranceType: ToleranceType;
  value: number;
  method: ToleranceMethod;
  active: boolean;
  effectiveDate: Date;
}

interface VarianceAnalysis {
  variance: TaxVariance;
  rootCause: string;
  impact: ImpactAnalysis;
  recommendations: string[];
  historicalTrend: VarianceTrend[];
}

type VarianceType = 'calculation' | 'rounding' | 'timing' | 'classification' | 'rate';
type ToleranceType = 'absolute' | 'percentage' | 'relative';
type ToleranceMethod = 'fixed' | 'sliding' | 'progressive';
type VarianceImpact = 'low' | 'medium' | 'high' | 'critical';
```

#### **Implementation Notes**
- Integrate with existing tax-core-utilities for tax calculations
- Use existing validation-utilities for reconciliation validation
- Support multiple tolerance types and methods
- Implement comprehensive variance analysis and reporting

---

## 🎯 Priority 5: Revenue, AR/AP

### **5.1 revenue-recognition-utilities.ts**

#### **Purpose**
Revenue recognition with straight-line, milestone, and percentage complete schedules.

#### **Key Features**
- **Recognition Methods**: Support multiple revenue recognition methods
- **Schedule Generation**: Generate recognition schedules based on contracts
- **Milestone Tracking**: Track and validate milestone achievements
- **Percentage Complete**: Calculate percentage completion for projects
- **Posting Integration**: Generate journal entries for recognized revenue

#### **Core Functions**
```typescript
// Recognition Methods
createStraightLineSchedule(contract: RevenueContract, options: StraightLineOptions): RecognitionSchedule
createMilestoneSchedule(contract: RevenueContract, milestones: Milestone[]): RecognitionSchedule
createPercentageCompleteSchedule(contract: RevenueContract, progress: ProgressTracking): RecognitionSchedule

// Schedule Management
updateRecognitionSchedule(schedule: RecognitionSchedule, updates: ScheduleUpdates): RecognitionSchedule
validateRecognitionSchedule(schedule: RecognitionSchedule): ValidationResult
calculateRecognizedRevenue(schedule: RecognitionSchedule, asOfDate: Date): RecognizedRevenue

// Milestone Operations
validateMilestoneAchievement(milestone: Milestone, evidence: MilestoneEvidence): ValidationResult
updateMilestoneProgress(milestone: Milestone, progress: number): Milestone
calculateMilestoneRevenue(milestone: Milestone, totalContractValue: number): number

// Percentage Complete
calculatePercentageComplete(project: Project, asOfDate: Date): PercentageComplete
updateProjectProgress(project: Project, progress: ProgressUpdate): Project
validateProgressUpdate(update: ProgressUpdate, project: Project): ValidationResult
```

#### **Types & Interfaces**
```typescript
interface RevenueContract {
  id: string;
  customer: string;
  totalValue: number;
  currency: SupportedCurrency;
  startDate: Date;
  endDate: Date;
  recognitionMethod: RecognitionMethod;
  milestones?: Milestone[];
  progressTracking?: ProgressTracking;
}

interface RecognitionSchedule {
  id: string;
  contract: RevenueContract;
  method: RecognitionMethod;
  periods: RecognitionPeriod[];
  totalRecognized: number;
  remainingUnrecognized: number;
  status: ScheduleStatus;
}

interface RecognitionPeriod {
  period: FiscalPeriod;
  recognizedAmount: number;
  cumulativeAmount: number;
  percentage: number;
  posted: boolean;
  postedDate?: Date;
  journalEntryId?: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  achievedDate?: Date;
  value: number;
  percentage: number;
  status: MilestoneStatus;
  evidence?: MilestoneEvidence;
}

interface PercentageComplete {
  project: Project;
  asOfDate: Date;
  percentage: number;
  method: ProgressMethod;
  evidence: ProgressEvidence;
  validated: boolean;
}

type RecognitionMethod = 'straight_line' | 'milestone' | 'percentage_complete' | 'delivery' | 'usage';
type ScheduleStatus = 'draft' | 'active' | 'completed' | 'cancelled';
type MilestoneStatus = 'pending' | 'achieved' | 'overdue' | 'cancelled';
type ProgressMethod = 'cost' | 'effort' | 'deliverables' | 'time' | 'mixed';
```

#### **Implementation Notes**
- Integrate with existing journal-entry-utilities for entry generation
- Use existing fiscal-period-utilities for period handling
- Support multiple recognition methods and progress tracking
- Implement comprehensive validation and audit trail

---

### **5.2 aging-utilities.ts**

#### **Purpose**
AR/AP aging buckets, as-of logic, and credit-limit checks.

#### **Key Features**
- **Aging Buckets**: Generate aging buckets (0-30, 31-60, etc.)
- **As-Of Logic**: Calculate aging as of specific dates
- **Credit Limit Management**: Check and validate credit limits
- **Aging Analysis**: Analyze aging patterns and trends
- **Collection Management**: Support collection and payment tracking

#### **Core Functions**
```typescript
// Aging Calculations
calculateAging(transactions: AgingTransaction[], asOfDate: Date, buckets: AgingBucket[]): AgingResult
calculateCustomerAging(customer: string, asOfDate: Date, buckets: AgingBucket[]): CustomerAging
calculateVendorAging(vendor: string, asOfDate: Date, buckets: AgingBucket[]): VendorAging

// Bucket Management
defineAgingBuckets(definition: AgingBucketDefinition): AgingBucket[]
validateAgingBuckets(buckets: AgingBucket[]): ValidationResult
updateAgingBuckets(buckets: AgingBucket[], updates: BucketUpdates): AgingBucket[]

// Credit Limit Operations
checkCreditLimit(customer: string, requestedAmount: number, currentBalance: number): CreditLimitResult
updateCreditLimit(customer: string, newLimit: number, effectiveDate: Date): CreditLimit
validateCreditLimit(limit: CreditLimit): ValidationResult
calculateCreditUtilization(customer: string, asOfDate: Date): CreditUtilization

// Collection Management
trackCollectionActivity(customer: string, activity: CollectionActivity): void
calculateCollectionEfficiency(customer: string, period: DateRange): CollectionEfficiency
generateCollectionReport(customers: string[], period: DateRange): CollectionReport
```

#### **Types & Interfaces**
```typescript
interface AgingTransaction {
  id: string;
  customer: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  currency: SupportedCurrency;
  status: TransactionStatus;
  paidAmount: number;
  remainingAmount: number;
}

interface AgingBucket {
  id: string;
  name: string;
  minDays: number;
  maxDays: number;
  description: string;
  color?: string;
}

interface AgingResult {
  customer: string;
  asOfDate: Date;
  buckets: AgingBucketResult[];
  totalAmount: number;
  totalOverdue: number;
  averageDays: number;
}

interface AgingBucketResult {
  bucket: AgingBucket;
  amount: number;
  percentage: number;
  transactionCount: number;
  averageDays: number;
}

interface CreditLimit {
  customer: string;
  limit: number;
  currency: SupportedCurrency;
  effectiveDate: Date;
  expiryDate?: Date;
  status: LimitStatus;
  lastUpdated: Date;
}

interface CreditLimitResult {
  customer: string;
  currentBalance: number;
  creditLimit: number;
  availableCredit: number;
  utilizationPercentage: number;
  isWithinLimit: boolean;
  excessAmount: number;
}

type TransactionStatus = 'open' | 'paid' | 'partial' | 'overdue' | 'cancelled';
type LimitStatus = 'active' | 'suspended' | 'expired' | 'cancelled';
```

#### **Implementation Notes**
- Integrate with existing date-utilities for date calculations
- Use existing validation-utilities for limit validation
- Support multiple currencies and aging methods
- Implement efficient aging calculations for large datasets

---

### **5.3 dunning-utilities.ts**

#### **Purpose**
Dunning rule evaluation, fee/interest calculation helpers, and collection management.

#### **Key Features**
- **Dunning Rules**: Define and manage dunning rules and escalation
- **Fee Calculations**: Calculate late payment fees and interest
- **Rule Evaluation**: Evaluate dunning rules against customer accounts
- **Escalation Management**: Manage dunning escalation levels
- **Collection Integration**: Integrate with collection processes

#### **Core Functions**
```typescript
// Rule Management
defineDunningRule(level: DunningLevel, conditions: DunningCondition[], actions: DunningAction[]): DunningRule
validateDunningRule(rule: DunningRule): ValidationResult
evaluateDunningRules(customer: string, asOfDate: Date): DunningEvaluation

// Fee Calculations
calculateLatePaymentFee(amount: number, daysOverdue: number, feeRate: number, method: FeeMethod): FeeCalculation
calculateInterest(principal: number, rate: number, days: number, method: InterestMethod): InterestCalculation
calculateCompoundInterest(principal: number, rate: number, periods: number, frequency: InterestFrequency): CompoundInterestResult

// Escalation Management
escalateDunningLevel(customer: string, currentLevel: DunningLevel, escalationRule: EscalationRule): EscalationResult
validateEscalation(escalation: EscalationResult): ValidationResult
trackEscalationHistory(customer: string, escalation: EscalationResult): void

// Collection Integration
generateDunningLetter(customer: string, level: DunningLevel, template: DunningTemplate): DunningLetter
trackDunningActivity(customer: string, activity: DunningActivity): void
calculateDunningEffectiveness(customer: string, period: DateRange): DunningEffectiveness
```

#### **Types & Interfaces**
```typescript
interface DunningRule {
  id: string;
  level: DunningLevel;
  name: string;
  description: string;
  conditions: DunningCondition[];
  actions: DunningAction[];
  active: boolean;
  priority: number;
}

interface DunningCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: LogicalOperator;
}

interface DunningAction {
  type: ActionType;
  parameters: Record<string, any>;
  delay?: number; // days
}

interface DunningEvaluation {
  customer: string;
  asOfDate: Date;
  applicableRules: DunningRule[];
  recommendedActions: DunningAction[];
  escalationLevel: DunningLevel;
  totalFees: number;
  totalInterest: number;
}

interface FeeCalculation {
  principal: number;
  feeRate: number;
  daysOverdue: number;
  feeAmount: number;
  method: FeeMethod;
  calculationDate: Date;
}

interface InterestCalculation {
  principal: number;
  rate: number;
  days: number;
  interestAmount: number;
  method: InterestMethod;
  calculationDate: Date;
}

type DunningLevel = 'reminder' | 'warning' | 'final_notice' | 'collection' | 'legal';
type ConditionOperator = 'equals' | 'greater_than' | 'less_than' | 'between' | 'contains';
type LogicalOperator = 'and' | 'or' | 'not';
type ActionType = 'send_letter' | 'charge_fee' | 'calculate_interest' | 'escalate' | 'suspend_account';
type FeeMethod = 'fixed' | 'percentage' | 'tiered' | 'progressive';
type InterestMethod = 'simple' | 'compound' | 'daily' | 'monthly';
type InterestFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
```

#### **Implementation Notes**
- Integrate with existing aging-utilities for overdue calculations
- Use existing validation-utilities for rule validation
- Support multiple fee and interest calculation methods
- Implement comprehensive escalation and tracking

---

## 📅 Implementation Timeline

### **Week 1-2: Multi-currency & FX**
- **Day 1-4:** fx-ledger-utilities.ts
- **Day 5-8:** fx-revaluation-utilities.ts
- **Day 9-14:** multi-currency-rules-utilities.ts

### **Week 3-4: Tax (Domain-Pure)**
- **Day 15-18:** tax-core-utilities.ts
- **Day 19-22:** withholding-tax-utilities.ts
- **Day 23-28:** tax-reconciliation-utilities.ts

### **Week 5-6: Revenue, AR/AP**
- **Day 29-32:** revenue-recognition-utilities.ts
- **Day 33-36:** aging-utilities.ts
- **Day 37-42:** dunning-utilities.ts

### **Week 7-8: Integration & Testing**
- **Day 43-49:** Integration testing
- **Day 50-56:** Documentation and refinement

---

## 🔧 Technical Requirements

### **Dependencies**
- Existing utilities: accounting-utilities, validation-utilities, date-utilities, financial-utilities
- External: None (pure domain logic)
- TypeScript: Strict mode, full type safety

### **Testing Strategy**
- Unit tests for each utility function
- Integration tests with existing utilities
- Performance tests for large datasets
- Validation tests for edge cases
- Currency conversion accuracy tests

### **Documentation**
- JSDoc comments for all public functions
- Usage examples and best practices
- Integration guides with existing utilities
- Performance considerations and limitations
- Currency and tax compliance notes

---

## 📊 Success Metrics

### **Functional Metrics**
- ✅ All 9 utilities implemented and tested
- ✅ 100% TypeScript type coverage
- ✅ Integration with existing utilities
- ✅ Comprehensive validation and error handling
- ✅ Multi-currency and tax compliance

### **Quality Metrics**
- ✅ Zero linting errors
- ✅ 90%+ test coverage
- ✅ Performance benchmarks met
- ✅ Documentation completeness
- ✅ Currency conversion accuracy

### **Business Metrics**
- ✅ Multi-currency operations supported
- ✅ Tax calculation and compliance
- ✅ Revenue recognition capabilities
- ✅ AR/AP management features
- ✅ Foundation for advanced financial operations

---

**Next:** Part 3 will cover Priority 6, 7, 8 & 9 utilities (Assets & Inventory, Consolidation, Cash & Reconciliation, Document Management)

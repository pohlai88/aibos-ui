# Accounting Utilities Extension Development Plan - Part 3
## Assets & Inventory + Consolidation + Cash & Reconciliation + Document Management

**Version:** 1.0.0  
**Date:** December 2024  
**Scope:** Priority 6, 7, 8 & 9 Utilities (9 modules)  
**Estimated Timeline:** 6-8 weeks  

---

## 📋 Overview

This document outlines the development plan for the third and final phase of pure accounting utilities extensions. Part 3 focuses on assets & inventory management, consolidation, cash & reconciliation, and document management.

### **Part 3 Scope**
- **Priority 6:** Assets & Inventory (3 utilities)
- **Priority 7:** Consolidation (2 utilities)
- **Priority 8:** Cash & Reconciliation (2 utilities)
- **Priority 9:** Document Management (2 utilities)
- **Total:** 9 utility modules

---

## 🎯 Priority 6: Assets & Inventory

### **6.1 fixed-asset-utilities.ts**

#### **Purpose**
Fixed asset depreciation schedules, partial periods, disposals, and gain/loss calculations.

#### **Key Features**
- **Depreciation Schedules**: Generate comprehensive depreciation schedules
- **Partial Period Handling**: Handle assets acquired/disposed mid-period
- **Disposal Calculations**: Calculate gain/loss on asset disposals
- **Method Support**: Support multiple depreciation methods
- **Asset Tracking**: Track asset lifecycle and changes

#### **Core Functions**
```typescript
// Depreciation Schedules
generateDepreciationSchedule(asset: FixedAsset, method: DepreciationMethod, options?: DepreciationOptions): DepreciationSchedule
calculatePartialPeriodDepreciation(asset: FixedAsset, period: FiscalPeriod, method: DepreciationMethod): PartialPeriodDepreciation
updateDepreciationSchedule(schedule: DepreciationSchedule, changes: AssetChanges): DepreciationSchedule

// Disposal Operations
calculateDisposalGainLoss(asset: FixedAsset, disposalDate: Date, disposalProceeds: number): DisposalResult
generateDisposalEntry(disposal: DisposalResult): JournalEntry
validateDisposalCalculation(disposal: DisposalResult): ValidationResult

// Asset Management
trackAssetChanges(asset: FixedAsset, changes: AssetChange[]): AssetHistory
calculateAssetValue(asset: FixedAsset, asOfDate: Date, method: ValuationMethod): AssetValuation
validateAssetData(asset: FixedAsset): ValidationResult
```

#### **Types & Interfaces**
```typescript
interface FixedAsset {
  id: string;
  assetNumber: string;
  description: string;
  category: AssetCategory;
  cost: number;
  currency: SupportedCurrency;
  acquisitionDate: Date;
  usefulLife: number; // years
  salvageValue: number;
  depreciationMethod: DepreciationMethod;
  status: AssetStatus;
  location: string;
  custodian: string;
}

interface DepreciationSchedule {
  asset: FixedAsset;
  method: DepreciationMethod;
  periods: DepreciationPeriod[];
  totalDepreciation: number;
  remainingValue: number;
  status: ScheduleStatus;
}

interface DepreciationPeriod {
  period: FiscalPeriod;
  beginningValue: number;
  depreciation: number;
  endingValue: number;
  accumulatedDepreciation: number;
  isPartialPeriod: boolean;
  partialPeriodFactor: number;
}

interface DisposalResult {
  asset: FixedAsset;
  disposalDate: Date;
  disposalProceeds: number;
  bookValue: number;
  gainLoss: number;
  gainLossType: 'gain' | 'loss';
  journalEntry: JournalEntry;
}

interface AssetValuation {
  asset: FixedAsset;
  asOfDate: Date;
  cost: number;
  accumulatedDepreciation: number;
  bookValue: number;
  marketValue?: number;
  impairmentLoss?: number;
  method: ValuationMethod;
}

type DepreciationMethod = 'straight_line' | 'declining_balance' | 'sum_of_years_digits' | 'units_of_production';
type AssetCategory = 'land' | 'buildings' | 'equipment' | 'vehicles' | 'furniture' | 'intangible';
type AssetStatus = 'active' | 'disposed' | 'transferred' | 'impairment';
type ScheduleStatus = 'active' | 'completed' | 'cancelled';
type ValuationMethod = 'cost' | 'market' | 'replacement' | 'net_realizable';
```

#### **Implementation Notes**
- Extend existing depreciation functions from financial-utilities
- Integrate with journal-entry-utilities for disposal entries
- Use existing fiscal-period-utilities for period handling
- Support multiple depreciation methods and partial periods

---

### **6.2 inventory-costing-utilities.ts**

#### **Purpose**
FIFO/weighted-average layers, COGS extraction, and write-down rules.

#### **Key Features**
- **Costing Methods**: Support FIFO, LIFO, weighted average, and specific identification
- **Layer Management**: Manage inventory layers and cost flows
- **COGS Calculation**: Calculate cost of goods sold
- **Write-Down Rules**: Handle inventory write-downs and impairments
- **Valuation Methods**: Support multiple inventory valuation methods

#### **Core Functions**
```typescript
// Costing Methods
calculateFIFOCost(inventory: InventoryItem, quantity: number, asOfDate: Date): CostingResult
calculateWeightedAverageCost(inventory: InventoryItem, quantity: number, asOfDate: Date): CostingResult
calculateLIFOCost(inventory: InventoryItem, quantity: number, asOfDate: Date): CostingResult
calculateSpecificIdentification(inventory: InventoryItem, layers: InventoryLayer[]): CostingResult

// Layer Management
createInventoryLayer(item: InventoryItem, quantity: number, cost: number, date: Date): InventoryLayer
updateInventoryLayers(item: InventoryItem, transaction: InventoryTransaction): InventoryLayer[]
validateInventoryLayers(layers: InventoryLayer[]): ValidationResult

// COGS Operations
calculateCOGS(sale: InventorySale, costingMethod: CostingMethod): COGSResult
extractCOGSFromLayers(layers: InventoryLayer[], quantity: number, method: CostingMethod): COGSResult
validateCOGSCalculation(cogs: COGSResult): ValidationResult

// Write-Down Management
calculateWriteDown(item: InventoryItem, currentValue: number, marketValue: number): WriteDownResult
applyWriteDown(item: InventoryItem, writeDown: WriteDownResult): InventoryAdjustment
validateWriteDown(writeDown: WriteDownResult): ValidationResult
```

#### **Types & Interfaces**
```typescript
interface InventoryItem {
  id: string;
  itemNumber: string;
  description: string;
  category: InventoryCategory;
  unitOfMeasure: string;
  costingMethod: CostingMethod;
  layers: InventoryLayer[];
  totalQuantity: number;
  totalValue: number;
  currency: SupportedCurrency;
}

interface InventoryLayer {
  id: string;
  item: InventoryItem;
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: Date;
  batchNumber?: string;
  expiryDate?: Date;
  status: LayerStatus;
}

interface CostingResult {
  item: InventoryItem;
  quantity: number;
  unitCost: number;
  totalCost: number;
  method: CostingMethod;
  layersUsed: InventoryLayer[];
  calculationDate: Date;
}

interface COGSResult {
  sale: InventorySale;
  quantity: number;
  unitCost: number;
  totalCOGS: number;
  method: CostingMethod;
  layersUsed: InventoryLayer[];
  calculationDate: Date;
}

interface WriteDownResult {
  item: InventoryItem;
  currentValue: number;
  marketValue: number;
  writeDownAmount: number;
  writeDownPercentage: number;
  reason: WriteDownReason;
  calculationDate: Date;
}

interface InventorySale {
  id: string;
  item: InventoryItem;
  quantity: number;
  saleDate: Date;
  customer: string;
  unitPrice: number;
  totalAmount: number;
  currency: SupportedCurrency;
}

type CostingMethod = 'fifo' | 'lifo' | 'weighted_average' | 'specific_identification';
type InventoryCategory = 'raw_materials' | 'work_in_progress' | 'finished_goods' | 'supplies';
type LayerStatus = 'active' | 'consumed' | 'expired' | 'written_off';
type WriteDownReason = 'obsolescence' | 'damage' | 'market_decline' | 'expiry' | 'other';
```

#### **Implementation Notes**
- Integrate with existing financial-utilities for cost calculations
- Use existing validation-utilities for inventory validation
- Support multiple costing methods and layer management
- Implement efficient COGS calculations for large inventories

---

### **6.3 manufacturing-overhead-utilities.ts**

#### **Purpose**
Manufacturing overhead absorption rules, variance postings, and cost allocation.

#### **Key Features**
- **Overhead Absorption**: Calculate and apply overhead absorption rates
- **Variance Analysis**: Analyze overhead variances and post adjustments
- **Cost Allocation**: Allocate overhead costs to products and cost centers
- **Rate Calculations**: Calculate predetermined overhead rates
- **Variance Posting**: Generate variance posting entries

#### **Core Functions**
```typescript
// Overhead Absorption
calculateOverheadRate(overhead: ManufacturingOverhead, base: AbsorptionBase, period: FiscalPeriod): OverheadRate
applyOverheadAbsorption(production: ProductionOrder, rate: OverheadRate): AbsorptionResult
validateOverheadAbsorption(absorption: AbsorptionResult): ValidationResult

// Variance Analysis
calculateOverheadVariance(actual: ActualOverhead, absorbed: AbsorbedOverhead, period: FiscalPeriod): OverheadVariance
analyzeVarianceComponents(variance: OverheadVariance): VarianceAnalysis
postVarianceAdjustments(variance: OverheadVariance): JournalEntry[]

// Cost Allocation
allocateOverheadCosts(overhead: ManufacturingOverhead, allocation: AllocationRule): AllocationResult
calculateAllocationRates(overhead: ManufacturingOverhead, bases: AllocationBase[]): AllocationRate[]
validateAllocation(allocation: AllocationResult): ValidationResult

// Rate Management
updateOverheadRate(rate: OverheadRate, updates: RateUpdates): OverheadRate
validateOverheadRate(rate: OverheadRate): ValidationResult
calculateRateVariance(actual: OverheadRate, standard: OverheadRate): RateVariance
```

#### **Types & Interfaces**
```typescript
interface ManufacturingOverhead {
  id: string;
  name: string;
  category: OverheadCategory;
  totalCost: number;
  currency: SupportedCurrency;
  period: FiscalPeriod;
  costCenter: string;
  allocationMethod: AllocationMethod;
}

interface OverheadRate {
  id: string;
  overhead: ManufacturingOverhead;
  rate: number;
  base: AbsorptionBase;
  period: FiscalPeriod;
  calculationMethod: RateCalculationMethod;
  status: RateStatus;
}

interface AbsorptionResult {
  production: ProductionOrder;
  overhead: ManufacturingOverhead;
  rate: OverheadRate;
  absorbedAmount: number;
  baseQuantity: number;
  calculationDate: Date;
}

interface OverheadVariance {
  id: string;
  overhead: ManufacturingOverhead;
  period: FiscalPeriod;
  actualCost: number;
  absorbedCost: number;
  varianceAmount: number;
  varianceType: VarianceType;
  variancePercentage: number;
}

interface AllocationResult {
  overhead: ManufacturingOverhead;
  allocation: AllocationRule;
  allocatedAmounts: AllocatedAmount[];
  totalAllocated: number;
  unallocatedAmount: number;
  calculationDate: Date;
}

interface ProductionOrder {
  id: string;
  product: string;
  quantity: number;
  startDate: Date;
  endDate: Date;
  status: ProductionStatus;
  costCenter: string;
  absorptionBase: number;
}

type OverheadCategory = 'indirect_materials' | 'indirect_labor' | 'utilities' | 'depreciation' | 'other';
type AbsorptionBase = 'direct_labor_hours' | 'direct_labor_cost' | 'machine_hours' | 'units_produced';
type AllocationMethod = 'direct_labor' | 'machine_hours' | 'square_footage' | 'number_of_employees';
type RateCalculationMethod = 'predetermined' | 'actual' | 'normal' | 'standard';
type RateStatus = 'draft' | 'approved' | 'active' | 'cancelled';
type VarianceType = 'favorable' | 'unfavorable';
type ProductionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
```

#### **Implementation Notes**
- Integrate with existing allocation-utilities for cost allocation
- Use existing journal-entry-utilities for variance postings
- Support multiple absorption methods and rate calculations
- Implement comprehensive variance analysis and reporting

---

## 🎯 Priority 7: Consolidation

### **7.1 consolidation-utilities.ts**

#### **Purpose**
Intercompany tagging, elimination proposals, and consolidation adjustments.

#### **Key Features**
- **Intercompany Tagging**: Tag and identify intercompany transactions
- **Elimination Rules**: Define and apply elimination rules
- **Consolidation Adjustments**: Generate consolidation adjustment entries
- **Entity Management**: Manage consolidation entity relationships
- **Elimination Validation**: Validate elimination calculations

#### **Core Functions**
```typescript
// Intercompany Operations
tagIntercompanyTransaction(transaction: Transaction, entities: ConsolidationEntity[]): IntercompanyTag
validateIntercompanyTag(tag: IntercompanyTag): ValidationResult
findIntercompanyMatches(transactions: Transaction[], entities: ConsolidationEntity[]): IntercompanyMatch[]

// Elimination Rules
defineEliminationRule(rule: EliminationRule): void
applyEliminationRule(rule: EliminationRule, transactions: Transaction[]): EliminationResult
validateEliminationRule(rule: EliminationRule): ValidationResult

// Consolidation Adjustments
generateConsolidationAdjustments(entities: ConsolidationEntity[], period: FiscalPeriod): ConsolidationAdjustment[]
postConsolidationAdjustments(adjustments: ConsolidationAdjustment[]): JournalEntry[]
validateConsolidationAdjustments(adjustments: ConsolidationAdjustment[]): ValidationResult

// Entity Management
defineConsolidationEntity(entity: ConsolidationEntity): void
validateConsolidationEntity(entity: ConsolidationEntity): ValidationResult
calculateEntityOwnership(parent: ConsolidationEntity, subsidiary: ConsolidationEntity): OwnershipPercentage
```

#### **Types & Interfaces**
```typescript
interface ConsolidationEntity {
  id: string;
  name: string;
  type: EntityType;
  parent?: string;
  ownership: OwnershipPercentage;
  currency: SupportedCurrency;
  reportingCurrency: SupportedCurrency;
  consolidationMethod: ConsolidationMethod;
  status: EntityStatus;
}

interface IntercompanyTag {
  transaction: Transaction;
  entities: ConsolidationEntity[];
  isIntercompany: boolean;
  counterparty: string;
  amount: number;
  currency: SupportedCurrency;
  tagDate: Date;
}

interface EliminationRule {
  id: string;
  name: string;
  description: string;
  accountPatterns: AccountPattern[];
  entityPatterns: EntityPattern[];
  eliminationMethod: EliminationMethod;
  active: boolean;
}

interface EliminationResult {
  rule: EliminationRule;
  transactions: Transaction[];
  eliminatedAmount: number;
  eliminationEntries: JournalEntry[];
  calculationDate: Date;
}

interface ConsolidationAdjustment {
  id: string;
  entity: ConsolidationEntity;
  adjustmentType: AdjustmentType;
  amount: number;
  currency: SupportedCurrency;
  period: FiscalPeriod;
  description: string;
  journalEntry: JournalEntry;
}

interface OwnershipPercentage {
  entity: string;
  percentage: number;
  effectiveDate: Date;
  expiryDate?: Date;
  status: OwnershipStatus;
}

type EntityType = 'parent' | 'subsidiary' | 'associate' | 'joint_venture';
type ConsolidationMethod = 'full_consolidation' | 'equity_method' | 'proportional_consolidation';
type EntityStatus = 'active' | 'inactive' | 'disposed' | 'acquired';
type EliminationMethod = 'automatic' | 'manual' | 'semi_automatic';
type AdjustmentType = 'elimination' | 'currency_translation' | 'fair_value' | 'other';
type OwnershipStatus = 'active' | 'pending' | 'expired' | 'cancelled';
```

#### **Implementation Notes**
- Integrate with existing journal-entry-utilities for elimination entries
- Use existing validation-utilities for consolidation validation
- Support multiple consolidation methods and entity types
- Implement comprehensive intercompany matching and elimination

---

### **7.2 consolidation-mapping-utilities.ts**

#### **Purpose**
Local→group COA mapping, currency translation, and CTA calculations.

#### **Key Features**
- **COA Mapping**: Map local chart of accounts to group COA
- **Currency Translation**: Translate local currencies to reporting currency
- **CTA Calculations**: Calculate currency translation adjustments
- **Mapping Validation**: Validate COA mappings and translations
- **Translation Rules**: Define and apply translation rules

#### **Core Functions**
```typescript
// COA Mapping
defineCOAMapping(localAccount: string, groupAccount: string, entity: string): COAMapping
validateCOAMapping(mapping: COAMapping): ValidationResult
applyCOAMapping(transactions: Transaction[], mappings: COAMapping[]): MappedTransaction[]

// Currency Translation
translateCurrency(amount: number, fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency, rate: ExchangeRate): TranslationResult
translateTransaction(transaction: Transaction, targetCurrency: SupportedCurrency, rate: ExchangeRate): TranslatedTransaction
validateCurrencyTranslation(translation: TranslationResult): ValidationResult

// CTA Calculations
calculateCTA(entity: ConsolidationEntity, period: FiscalPeriod, rates: ExchangeRate[]): CTAResult
generateCTAEntries(cta: CTAResult): JournalEntry[]
validateCTACalculation(cta: CTAResult): ValidationResult

// Translation Rules
defineTranslationRule(rule: TranslationRule): void
applyTranslationRule(rule: TranslationRule, data: TranslationData): TranslationResult
validateTranslationRule(rule: TranslationRule): ValidationResult
```

#### **Types & Interfaces**
```typescript
interface COAMapping {
  id: string;
  localAccount: string;
  groupAccount: string;
  entity: string;
  mappingType: MappingType;
  active: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
}

interface TranslationResult {
  originalAmount: number;
  translatedAmount: number;
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  rate: number;
  translationDate: Date;
  translationMethod: TranslationMethod;
}

interface CTAResult {
  entity: ConsolidationEntity;
  period: FiscalPeriod;
  openingCTA: number;
  periodCTA: number;
  closingCTA: number;
  translationRates: ExchangeRate[];
  calculationDate: Date;
}

interface TranslationRule {
  id: string;
  name: string;
  description: string;
  sourceCurrency: SupportedCurrency;
  targetCurrency: SupportedCurrency;
  rateSource: RateSource;
  translationMethod: TranslationMethod;
  active: boolean;
}

interface TranslatedTransaction {
  original: Transaction;
  translated: Transaction;
  translation: TranslationResult;
  cta: number;
}

type MappingType = 'direct' | 'aggregated' | 'split' | 'conditional';
type TranslationMethod = 'current_rate' | 'historical_rate' | 'average_rate' | 'closing_rate';
type RateSource = 'central_bank' | 'market' | 'internal' | 'external';
```

#### **Implementation Notes**
- Integrate with existing fx-ledger-utilities for exchange rates
- Use existing journal-entry-utilities for CTA entries
- Support multiple translation methods and rate sources
- Implement comprehensive COA mapping and validation

---

## 🎯 Priority 8: Cash & Reconciliation

### **8.1 bank-reconciliation-utilities.ts**

#### **Purpose**
Bank reconciliation matching heuristics, tolerance rules, and adjustments.

#### **Key Features**
- **Matching Engine**: Match bank transactions with GL entries
- **Tolerance Rules**: Define and apply tolerance rules for matching
- **Adjustment Management**: Handle reconciliation adjustments
- **Exception Handling**: Manage reconciliation exceptions
- **Reconciliation Reports**: Generate reconciliation reports

#### **Core Functions**
```typescript
// Matching Operations
matchBankTransactions(bankTransactions: BankTransaction[], glEntries: GLEntry[], rules: MatchingRule[]): MatchingResult
validateMatching(matching: MatchingResult): ValidationResult
autoMatchTransactions(transactions: BankTransaction[], entries: GLEntry[], tolerance: number): AutoMatchResult

// Tolerance Management
defineToleranceRule(rule: ToleranceRule): void
applyToleranceRule(amount1: number, amount2: number, rule: ToleranceRule): ToleranceResult
validateToleranceRule(rule: ToleranceRule): ValidationResult

// Adjustment Management
createReconciliationAdjustment(adjustment: ReconciliationAdjustment): void
postReconciliationAdjustments(adjustments: ReconciliationAdjustment[]): JournalEntry[]
validateReconciliationAdjustments(adjustments: ReconciliationAdjustment[]): ValidationResult

// Exception Handling
identifyReconciliationExceptions(reconciliation: BankReconciliation): ReconciliationException[]
resolveReconciliationException(exception: ReconciliationException, resolution: ExceptionResolution): void
trackExceptionHistory(exception: ReconciliationException): void
```

#### **Types & Interfaces**
```typescript
interface BankTransaction {
  id: string;
  bankAccount: string;
  transactionDate: Date;
  valueDate: Date;
  description: string;
  amount: number;
  currency: SupportedCurrency;
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
}

interface GLEntry {
  id: string;
  account: string;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  currency: SupportedCurrency;
  reference: string;
  status: EntryStatus;
}

interface MatchingResult {
  bankTransaction: BankTransaction;
  glEntry: GLEntry;
  matchType: MatchType;
  confidence: number;
  tolerance: number;
  matchDate: Date;
}

interface ReconciliationAdjustment {
  id: string;
  type: AdjustmentType;
  amount: number;
  currency: SupportedCurrency;
  description: string;
  account: string;
  date: Date;
  reason: AdjustmentReason;
}

interface BankReconciliation {
  id: string;
  bankAccount: string;
  period: DateRange;
  openingBalance: number;
  closingBalance: number;
  bankStatementBalance: number;
  glBalance: number;
  adjustments: ReconciliationAdjustment[];
  exceptions: ReconciliationException[];
  status: ReconciliationStatus;
}

type TransactionType = 'debit' | 'credit' | 'transfer' | 'fee' | 'interest';
type TransactionStatus = 'pending' | 'cleared' | 'reconciled' | 'exception';
type EntryStatus = 'draft' | 'posted' | 'reconciled' | 'cancelled';
type MatchType = 'exact' | 'tolerance' | 'manual' | 'partial';
type AdjustmentType = 'bank_fee' | 'interest' | 'error_correction' | 'timing_difference';
type AdjustmentReason = 'bank_error' | 'gl_error' | 'timing' | 'fee' | 'interest';
type ReconciliationStatus = 'draft' | 'in_progress' | 'completed' | 'exception';
```

#### **Implementation Notes**
- Integrate with existing validation-utilities for reconciliation validation
- Use existing journal-entry-utilities for adjustment entries
- Support multiple matching algorithms and tolerance rules
- Implement comprehensive exception handling and reporting

---

### **8.2 cashflow-mapping-utilities.ts**

#### **Purpose**
GL→CF categories mapping, indirect method helpers, and cash flow classification.

#### **Key Features**
- **Category Mapping**: Map GL accounts to cash flow categories
- **Indirect Method**: Generate indirect method cash flow statements
- **Classification Rules**: Define and apply cash flow classification rules
- **Reconciliation**: Reconcile cash flow with bank statements
- **Analysis**: Analyze cash flow patterns and trends

#### **Core Functions**
```typescript
// Category Mapping
defineCashFlowMapping(account: string, category: CashFlowCategory, subcategory: string): CashFlowMapping
validateCashFlowMapping(mapping: CashFlowMapping): ValidationResult
applyCashFlowMapping(transactions: Transaction[], mappings: CashFlowMapping[]): MappedCashFlowTransaction[]

// Indirect Method
generateIndirectCashFlow(glData: GLData, period: DateRange, mappings: CashFlowMapping[]): IndirectCashFlow
calculateOperatingCashFlow(glData: GLData, period: DateRange): OperatingCashFlow
validateIndirectCashFlow(cashFlow: IndirectCashFlow): ValidationResult

// Classification Rules
defineClassificationRule(rule: ClassificationRule): void
applyClassificationRule(rule: ClassificationRule, transaction: Transaction): ClassificationResult
validateClassificationRule(rule: ClassificationRule): ValidationResult

// Analysis
analyzeCashFlowPatterns(cashFlow: CashFlowStatement, periods: DateRange[]): CashFlowAnalysis
calculateCashFlowRatios(cashFlow: CashFlowStatement): CashFlowRatios
identifyCashFlowTrends(cashFlow: CashFlowStatement[], period: DateRange): CashFlowTrends
```

#### **Types & Interfaces**
```typescript
interface CashFlowMapping {
  id: string;
  account: string;
  category: CashFlowCategory;
  subcategory: string;
  mappingType: MappingType;
  active: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
}

interface IndirectCashFlow {
  period: DateRange;
  operating: OperatingCashFlow;
  investing: InvestingCashFlow;
  financing: FinancingCashFlow;
  netCashFlow: number;
  openingCash: number;
  closingCash: number;
}

interface OperatingCashFlow {
  netIncome: number;
  adjustments: OperatingAdjustment[];
  workingCapitalChanges: WorkingCapitalChange[];
  operatingCashFlow: number;
}

interface InvestingCashFlow {
  capitalExpenditures: number;
  assetSales: number;
  investments: number;
  investingCashFlow: number;
}

interface FinancingCashFlow {
  debtIssuance: number;
  debtRepayment: number;
  equityIssuance: number;
  dividends: number;
  financingCashFlow: number;
}

interface CashFlowAnalysis {
  period: DateRange;
  operatingMargin: number;
  cashConversionCycle: number;
  freeCashFlow: number;
  cashFlowQuality: number;
  trends: CashFlowTrend[];
}

interface ClassificationRule {
  id: string;
  name: string;
  description: string;
  conditions: ClassificationCondition[];
  category: CashFlowCategory;
  subcategory: string;
  priority: number;
  active: boolean;
}

type CashFlowCategory = 'operating' | 'investing' | 'financing';
type MappingType = 'direct' | 'calculated' | 'conditional' | 'excluded';
type ClassificationCondition = {
  field: string;
  operator: string;
  value: any;
};
```

#### **Implementation Notes**
- Integrate with existing validation-utilities for classification validation
- Use existing financial-utilities for ratio calculations
- Support multiple classification methods and mapping types
- Implement comprehensive cash flow analysis and reporting

---

## 🎯 Priority 9: Document Management

### **9.1 document-numbering-utilities.ts**

#### **Purpose**
Document numbering series/sequence, gap policies, and check-digit validation.

#### **Key Features**
- **Numbering Series**: Define and manage document numbering series
- **Sequence Management**: Generate sequential document numbers
- **Gap Policies**: Handle numbering gaps and policies
- **Check-Digit Validation**: Implement check-digit validation
- **Numbering Rules**: Define and apply numbering rules

#### **Core Functions**
```typescript
// Series Management
defineNumberingSeries(series: NumberingSeries): void
validateNumberingSeries(series: NumberingSeries): ValidationResult
getNextNumber(series: string, context: NumberingContext): NextNumberResult

// Sequence Operations
generateSequenceNumber(series: string, options: SequenceOptions): SequenceNumber
validateSequenceNumber(number: string, series: string): ValidationResult
reserveSequenceNumber(series: string, context: NumberingContext): ReservedNumber

// Gap Management
identifyNumberingGaps(series: string, period: DateRange): NumberingGap[]
applyGapPolicy(gaps: NumberingGap[], policy: GapPolicy): GapResolution
validateGapPolicy(policy: GapPolicy): ValidationResult

// Check-Digit Operations
calculateCheckDigit(number: string, algorithm: CheckDigitAlgorithm): string
validateCheckDigit(number: string, algorithm: CheckDigitAlgorithm): ValidationResult
generateCheckDigitNumber(baseNumber: string, algorithm: CheckDigitAlgorithm): string
```

#### **Types & Interfaces**
```typescript
interface NumberingSeries {
  id: string;
  name: string;
  description: string;
  prefix: string;
  suffix: string;
  format: string;
  startNumber: number;
  currentNumber: number;
  increment: number;
  checkDigit: boolean;
  checkDigitAlgorithm: CheckDigitAlgorithm;
  gapPolicy: GapPolicy;
  active: boolean;
}

interface NextNumberResult {
  series: string;
  nextNumber: string;
  reserved: boolean;
  reservationId?: string;
  expiryDate?: Date;
}

interface SequenceNumber {
  series: string;
  number: string;
  fullNumber: string;
  generatedDate: Date;
  checkDigit?: string;
}

interface NumberingGap {
  series: string;
  startNumber: number;
  endNumber: number;
  gapSize: number;
  period: DateRange;
  status: GapStatus;
}

interface GapPolicy {
  id: string;
  name: string;
  description: string;
  policyType: GapPolicyType;
  maxGapSize: number;
  autoFill: boolean;
  requireApproval: boolean;
  active: boolean;
}

interface CheckDigitAlgorithm {
  id: string;
  name: string;
  description: string;
  algorithm: string;
  weight: number[];
  modulus: number;
  active: boolean;
}

type GapPolicyType = 'allow' | 'prevent' | 'auto_fill' | 'require_approval';
type GapStatus = 'identified' | 'resolved' | 'approved' | 'rejected';
type CheckDigitAlgorithm = 'mod10' | 'mod11' | 'luhn' | 'custom';
```

#### **Implementation Notes**
- Integrate with existing validation-utilities for numbering validation
- Support multiple numbering formats and algorithms
- Implement comprehensive gap management and policies
- Provide audit trail for numbering operations

---

### **9.2 number-to-words-utilities.ts**

#### **Purpose**
Multi-locale number-to-words conversion for cheques and invoices.

#### **Key Features**
- **Multi-Locale Support**: Support multiple languages and locales
- **Currency Formatting**: Format numbers with currency names
- **Cheque Formatting**: Special formatting for cheques
- **Invoice Formatting**: Special formatting for invoices
- **Validation**: Validate number-to-words conversions

#### **Core Functions**
```typescript
// Number Conversion
convertNumberToWords(number: number, locale: string, options?: ConversionOptions): WordsResult
convertCurrencyToWords(amount: number, currency: SupportedCurrency, locale: string): CurrencyWordsResult
validateNumberToWords(number: number, words: string, locale: string): ValidationResult

// Locale Support
getSupportedLocales(): SupportedLocale[]
validateLocale(locale: string): ValidationResult
getLocaleConfiguration(locale: string): LocaleConfiguration

// Special Formatting
formatForCheque(amount: number, currency: SupportedCurrency, locale: string): ChequeFormatResult
formatForInvoice(amount: number, currency: SupportedCurrency, locale: string): InvoiceFormatResult
validateSpecialFormatting(result: SpecialFormatResult): ValidationResult

// Currency Names
getCurrencyName(currency: SupportedCurrency, locale: string): string
getCurrencyPluralName(currency: SupportedCurrency, locale: string): string
validateCurrencyName(currency: SupportedCurrency, locale: string): ValidationResult
```

#### **Types & Interfaces**
```typescript
interface WordsResult {
  number: number;
  words: string;
  locale: string;
  format: string;
  conversionDate: Date;
}

interface CurrencyWordsResult {
  amount: number;
  currency: SupportedCurrency;
  words: string;
  currencyName: string;
  locale: string;
  format: string;
}

interface ConversionOptions {
  includeCurrency: boolean;
  includeCents: boolean;
  format: ConversionFormat;
  case: TextCase;
  separator: string;
}

interface LocaleConfiguration {
  locale: string;
  language: string;
  country: string;
  currency: SupportedCurrency;
  numberFormat: NumberFormat;
  textFormat: TextFormat;
}

interface ChequeFormatResult {
  amount: number;
  currency: SupportedCurrency;
  words: string;
  format: string;
  locale: string;
  chequeFormat: string;
}

interface InvoiceFormatResult {
  amount: number;
  currency: SupportedCurrency;
  words: string;
  format: string;
  locale: string;
  invoiceFormat: string;
}

interface SupportedLocale {
  code: string;
  name: string;
  language: string;
  country: string;
  currency: SupportedCurrency;
  active: boolean;
}

type ConversionFormat = 'standard' | 'cheque' | 'invoice' | 'legal';
type TextCase = 'lowercase' | 'uppercase' | 'title_case' | 'sentence_case';
type NumberFormat = 'decimal' | 'fraction' | 'percentage' | 'currency';
type TextFormat = 'plain' | 'formatted' | 'structured';
```

#### **Implementation Notes**
- Support multiple languages and number systems
- Integrate with existing formatting-utilities for text formatting
- Implement comprehensive locale validation and configuration
- Provide special formatting for cheques and invoices

---

## 📅 Implementation Timeline

### **Week 1-2: Assets & Inventory**
- **Day 1-4:** fixed-asset-utilities.ts
- **Day 5-8:** inventory-costing-utilities.ts
- **Day 9-14:** manufacturing-overhead-utilities.ts

### **Week 3-4: Consolidation**
- **Day 15-18:** consolidation-utilities.ts
- **Day 19-28:** consolidation-mapping-utilities.ts

### **Week 5-6: Cash & Reconciliation**
- **Day 29-32:** bank-reconciliation-utilities.ts
- **Day 33-42:** cashflow-mapping-utilities.ts

### **Week 7-8: Document Management**
- **Day 43-46:** document-numbering-utilities.ts
- **Day 47-56:** number-to-words-utilities.ts

### **Week 9-10: Integration & Testing**
- **Day 57-63:** Integration testing
- **Day 64-70:** Documentation and refinement

---

## 🔧 Technical Requirements

### **Dependencies**
- Existing utilities: All previous utilities from Parts 1 & 2
- External: None (pure domain logic)
- TypeScript: Strict mode, full type safety

### **Testing Strategy**
- Unit tests for each utility function
- Integration tests with existing utilities
- Performance tests for large datasets
- Validation tests for edge cases
- Multi-currency and multi-locale tests

### **Documentation**
- JSDoc comments for all public functions
- Usage examples and best practices
- Integration guides with existing utilities
- Performance considerations and limitations
- Compliance and regulatory notes

---

## 📊 Success Metrics

### **Functional Metrics**
- ✅ All 9 utilities implemented and tested
- ✅ 100% TypeScript type coverage
- ✅ Integration with existing utilities
- ✅ Comprehensive validation and error handling
- ✅ Multi-currency and multi-locale support

### **Quality Metrics**
- ✅ Zero linting errors
- ✅ 90%+ test coverage
- ✅ Performance benchmarks met
- ✅ Documentation completeness
- ✅ Compliance with accounting standards

### **Business Metrics**
- ✅ Complete asset and inventory management
- ✅ Full consolidation capabilities
- ✅ Comprehensive cash flow management
- ✅ Professional document management
- ✅ Enterprise-grade accounting system

---

## 🎯 Final Summary

### **Complete Utility Suite (25 modules)**
- **Part 1:** 7 utilities (Core GL, Periods, Controls)
- **Part 2:** 9 utilities (Multi-currency, Tax, Revenue)
- **Part 3:** 9 utilities (Assets, Consolidation, Cash, Documents)

### **Total Implementation Timeline**
- **Part 1:** 4-6 weeks
- **Part 2:** 6-8 weeks  
- **Part 3:** 6-8 weeks
- **Total:** 16-22 weeks

### **Final Architecture**
- **25 pure accounting utilities**
- **Comprehensive domain coverage**
- **Enterprise-grade functionality**
- **Full TypeScript type safety**
- **Zero external dependencies**
- **Production-ready implementation**

---

**Status:** Complete Development Plan  
**Next Phase:** Implementation of Part 1 utilities  
**Target:** Enterprise-grade accounting system with full GL, multi-currency, tax, and consolidation capabilities

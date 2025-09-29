# Accounting Utilities Extension Development Plan - Part 4
## Essential Building Blocks & Missing Core Utilities

**Version:** 1.0.0  
**Date:** December 2024  
**Scope:** Essential Building Blocks (6 modules)  
**Estimated Timeline:** 4-6 weeks  

---

## 📋 Overview

This document outlines the development plan for the fourth phase of pure accounting utilities extensions. Part 4 focuses on the essential building blocks that were identified as missing from the core accounting system. These utilities form the foundation for proper accounting operations and are critical for day-one functionality.

### **Part 4 Scope**
- **Essential Building Blocks:** 6 utility modules
- **Priority:** High (day-one requirements)
- **Dependencies:** Minimal (builds on existing utilities)

---

## 🎯 Essential Building Blocks

### **4.1 coa-governance-utilities.ts**

#### **Purpose**
Chart of Accounts governance helpers for tree operations, rollups, normal balance checks, and posting flags.

#### **Key Features**
- **COA Tree Operations**: Build and manage hierarchical account structures
- **Rollup Calculations**: Calculate account rollups and parent-child relationships
- **Normal Balance Validation**: Validate accounts against their normal balance types
- **Posting Flag Management**: Control posting permissions and restrictions
- **Account Class Validation**: Validate account classifications and hierarchies
- **Reporting Category Mapping**: Map accounts to reporting categories

#### **Core Functions**
```typescript
// COA Tree Operations
buildCOATree(accounts: Account[]): COATree
validateCOAHierarchy(tree: COATree): ValidationResult
findAccountPath(tree: COATree, accountCode: string): AccountPath
getAccountChildren(tree: COATree, parentCode: string): Account[]
getAccountParents(tree: COATree, accountCode: string): Account[]

// Rollup Calculations
calculateAccountRollups(tree: COATree, balances: AccountBalance[]): RollupResult
rollupAccountBalances(account: Account, children: Account[]): RollupBalance
validateRollupCalculation(rollup: RollupResult): ValidationResult
calculateParentBalances(tree: COATree, balances: AccountBalance[]): ParentBalance[]

// Normal Balance Checks
validateNormalBalance(account: Account, balance: number): BalanceValidationResult
checkAccountBalanceType(account: Account, balance: number): BalanceTypeResult
validateBalanceAgainstNormal(account: Account, debit: number, credit: number): BalanceValidationResult
correctBalanceSign(account: Account, balance: number): number

// Posting Flag Management
validatePostingFlags(account: Account, transaction: Transaction): PostingValidationResult
checkPostingPermissions(account: Account, user: User, transaction: Transaction): PermissionResult
updatePostingFlags(account: Account, flags: PostingFlags): Account
validatePostingRestrictions(account: Account, transaction: Transaction): RestrictionResult

// Account Class Validation
validateAccountClass(account: Account, expectedClass: AccountClass): ValidationResult
checkAccountClassification(account: Account): ClassificationResult
validateAccountHierarchy(account: Account, parent: Account): ValidationResult
enforceAccountRules(account: Account, rules: AccountRule[]): ValidationResult

// Reporting Category Mapping
mapAccountToReportingCategory(account: Account, rules: MappingRule[]): ReportingCategory
defineReportingMapping(account: Account, category: ReportingCategory): MappingRule
validateReportingMapping(mapping: MappingRule): ValidationResult
getReportingCategoryPath(account: Account, mappings: MappingRule[]): ReportingPath
```

#### **Types & Interfaces**
```typescript
interface COATree {
  root: Account;
  children: Map<string, Account[]>;
  parents: Map<string, Account>;
  depth: number;
  maxDepth: number;
  totalAccounts: number;
}

interface Account {
  code: string;
  name: string;
  type: AccountType;
  class: AccountClass;
  parentCode?: string;
  normalBalance: 'debit' | 'credit';
  postingFlags: PostingFlags;
  reportingCategory: string;
  active: boolean;
  description: string;
}

interface PostingFlags {
  allowPosting: boolean;
  requireApproval: boolean;
  allowNegativeBalance: boolean;
  allowZeroBalance: boolean;
  postingRestrictions: PostingRestriction[];
  userPermissions: UserPermission[];
}

interface RollupResult {
  account: Account;
  children: Account[];
  childBalances: AccountBalance[];
  rolledUpBalance: number;
  rollupMethod: RollupMethod;
  calculationDate: Date;
  isValid: boolean;
  issues: ValidationIssue[];
}

interface BalanceValidationResult {
  account: Account;
  balance: number;
  normalBalance: 'debit' | 'credit';
  isValid: boolean;
  expectedSign: 'positive' | 'negative';
  actualSign: 'positive' | 'negative';
  issues: ValidationIssue[];
}

interface ReportingCategory {
  id: string;
  name: string;
  type: ReportingType;
  parentCategory?: string;
  accounts: string[];
  mappingRules: MappingRule[];
}

interface MappingRule {
  id: string;
  accountPattern: string;
  reportingCategory: string;
  priority: number;
  active: boolean;
  conditions: MappingCondition[];
}

type AccountClass = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
type RollupMethod = 'sum' | 'average' | 'weighted_average' | 'first' | 'last';
type ReportingType = 'balance_sheet' | 'income_statement' | 'cash_flow' | 'equity' | 'notes';
type PostingRestriction = 'debit_only' | 'credit_only' | 'no_posting' | 'approval_required';
```

#### **Implementation Notes**
- Integrate with existing `accounting-utilities.ts` for account code validation
- Use existing `validation-utilities.ts` for validation patterns
- Support multiple account hierarchies and reporting structures
- Implement efficient tree traversal algorithms for large COAs

---

### **4.2 financial-statements-utilities.ts**

#### **Purpose**
Financial statements builder for P&L, Balance Sheet, and Cash Flow from trial balance with mapping rules.

#### **Key Features**
- **Statement Generation**: Build P&L, Balance Sheet, and Cash Flow statements
- **Mapping Rules**: Define and apply account-to-statement-line mappings
- **Sign Conventions**: Apply proper sign conventions for different account types
- **Subtotal Ordering**: Manage statement line ordering and subtotals
- **Notes Integration**: Hook for disclosure notes and supporting information
- **Statement Validation**: Validate statement completeness and accuracy

#### **Core Functions**
```typescript
// Statement Generation
buildProfitLossStatement(trialBalance: TrialBalance, mapping: StatementMapping): P&LStatement
buildBalanceSheet(trialBalance: TrialBalance, mapping: StatementMapping): BalanceSheet
buildCashFlowStatement(trialBalance: TrialBalance, mapping: StatementMapping): CashFlowStatement
buildStatementOfEquity(trialBalance: TrialBalance, mapping: StatementMapping): EquityStatement

// Mapping and Rules
defineStatementMapping(account: Account, statementLine: StatementLine): StatementMapping
validateStatementMapping(mapping: StatementMapping): ValidationResult
applySignConventions(amount: number, accountType: AccountType): number
calculateStatementTotals(statement: FinancialStatement): StatementTotals

// Subtotal Management
defineSubtotalGroup(lines: StatementLine[], groupName: string): SubtotalGroup
calculateSubtotals(statement: FinancialStatement, groups: SubtotalGroup[]): SubtotalResult[]
validateSubtotalCalculation(subtotal: SubtotalResult): ValidationResult
orderStatementLines(lines: StatementLine[], ordering: LineOrdering): StatementLine[]

// Notes Integration
attachStatementNote(statement: FinancialStatement, note: StatementNote): FinancialStatement
validateStatementNotes(notes: StatementNote[]): ValidationResult
generateDisclosureNotes(statement: FinancialStatement, requirements: DisclosureRequirement[]): DisclosureNote[]

// Statement Validation
validateStatementCompleteness(statement: FinancialStatement): ValidationResult
validateStatementAccuracy(statement: FinancialStatement, trialBalance: TrialBalance): ValidationResult
checkStatementBalances(statement: FinancialStatement): BalanceCheckResult
validateStatementFormat(statement: FinancialStatement, format: StatementFormat): ValidationResult
```

#### **Types & Interfaces**
```typescript
interface FinancialStatement {
  id: string;
  type: StatementType;
  period: DateRange;
  entity: string;
  currency: SupportedCurrency;
  lines: StatementLine[];
  subtotals: SubtotalGroup[];
  notes: StatementNote[];
  generatedAt: Date;
  status: StatementStatus;
}

interface StatementLine {
  id: string;
  lineNumber: number;
  description: string;
  accountCode: string;
  amount: number;
  sign: 'positive' | 'negative';
  level: number;
  isSubtotal: boolean;
  parentLine?: string;
  children: string[];
  notes: string[];
}

interface StatementMapping {
  id: string;
  accountCode: string;
  statementType: StatementType;
  lineNumber: number;
  lineDescription: string;
  signConvention: SignConvention;
  subtotalGroup?: string;
  priority: number;
  active: boolean;
  conditions: MappingCondition[];
}

interface P&LStatement extends FinancialStatement {
  type: 'profit_loss';
  revenue: StatementLine[];
  expenses: StatementLine[];
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  ebitda: number;
}

interface BalanceSheet extends FinancialStatement {
  type: 'balance_sheet';
  assets: StatementLine[];
  liabilities: StatementLine[];
  equity: StatementLine[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  workingCapital: number;
}

interface CashFlowStatement extends FinancialStatement {
  type: 'cash_flow';
  operating: StatementLine[];
  investing: StatementLine[];
  financing: StatementLine[];
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  openingCash: number;
  closingCash: number;
}

interface SubtotalGroup {
  id: string;
  name: string;
  description: string;
  lineNumbers: number[];
  calculationMethod: SubtotalMethod;
  displayOrder: number;
  level: number;
  parentGroup?: string;
}

interface StatementNote {
  id: string;
  lineNumber: number;
  noteType: NoteType;
  content: string;
  references: string[];
  disclosureLevel: DisclosureLevel;
  required: boolean;
}

type StatementType = 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'equity' | 'notes';
type SignConvention = 'natural' | 'inverted' | 'absolute' | 'conditional';
type SubtotalMethod = 'sum' | 'difference' | 'ratio' | 'percentage';
type NoteType = 'disclosure' | 'explanation' | 'reconciliation' | 'policy' | 'contingency';
type DisclosureLevel = 'basic' | 'detailed' | 'comprehensive' | 'regulatory';
type StatementStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';
```

#### **Implementation Notes**
- Integrate with existing `trial-balance-utilities.ts` for data source
- Use existing `validation-utilities.ts` for statement validation
- Support multiple statement formats and reporting standards
- Implement efficient mapping and calculation algorithms

---

### **4.3 ecl-allowance-utilities.ts**

#### **Purpose**
Expected Credit Loss (ECL) calculators with matrix, PD×LGD, write-off & recovery flows.

#### **Key Features**
- **ECL Calculations**: Calculate expected credit losses using various methods
- **PD×LGD Matrix**: Manage probability of default and loss given default matrices
- **Write-off Management**: Handle account receivable write-offs
- **Recovery Tracking**: Track and manage recovery of written-off amounts
- **Aging Integration**: Integrate with aging utilities for ECL calculations
- **Compliance Reporting**: Generate ECL compliance reports

#### **Core Functions**
```typescript
// ECL Calculations
calculateECL(customer: Customer, aging: AgingResult, matrix: ECLMatrix): ECLResult
calculatePDxLGD(exposure: number, pd: number, lgd: number): ECLAmount
calculateStageBasedECL(portfolio: ARPortfolio, stages: ECLStage[]): StageBasedECLResult
calculateLifetimeECL(portfolio: ARPortfolio, matrix: ECLMatrix): LifetimeECLResult

// Matrix Management
createECLMatrix(name: string, segments: ECLSegment[]): ECLMatrix
updateECLMatrix(matrix: ECLMatrix, newData: ECLData): ECLMatrix
validateECLMatrix(matrix: ECLMatrix): ValidationResult
getECLParameters(customer: Customer, matrix: ECLMatrix): ECLParameters

// Write-off and Recovery
processWriteOff(ar: AccountReceivable, amount: number, reason: WriteOffReason): WriteOffEntry
processRecovery(writeOff: WriteOffEntry, amount: number): RecoveryEntry
calculateRecoveryRate(customer: Customer, period: DateRange): RecoveryRate
trackWriteOffHistory(customer: Customer): WriteOffHistory

// Portfolio Management
calculatePortfolioECL(portfolio: ARPortfolio, matrix: ECLMatrix): PortfolioECLResult
segmentPortfolio(portfolio: ARPortfolio, criteria: SegmentationCriteria): PortfolioSegment[]
validatePortfolioSegmentation(segments: PortfolioSegment[]): ValidationResult

// Compliance and Reporting
generateECLReport(portfolio: ARPortfolio, matrix: ECLMatrix, period: DateRange): ECLReport
validateECLCompliance(report: ECLReport, requirements: ComplianceRequirement[]): ComplianceResult
calculateECLProvision(portfolio: ARPortfolio, matrix: ECLMatrix): ECLProvision
```

#### **Types & Interfaces**
```typescript
interface ECLMatrix {
  id: string;
  name: string;
  description: string;
  segments: ECLSegment[];
  pdRates: Map<string, number>;
  lgdRates: Map<string, number>;
  effectiveDate: Date;
  expiryDate?: Date;
  status: MatrixStatus;
}

interface ECLSegment {
  id: string;
  name: string;
  criteria: SegmentationCriteria;
  pd: number;
  lgd: number;
  ead: number;
  description: string;
}

interface ECLResult {
  customer: Customer;
  exposure: number;
  pd: number;
  lgd: number;
  ecl: number;
  stage: ECLStage;
  calculationDate: Date;
  matrix: ECLMatrix;
  confidence: number;
}

interface WriteOffEntry {
  id: string;
  customer: Customer;
  originalAmount: number;
  writeOffAmount: number;
  writeOffDate: Date;
  reason: WriteOffReason;
  approval: WriteOffApproval;
  journalEntry: JournalEntry;
  status: WriteOffStatus;
}

interface RecoveryEntry {
  id: string;
  writeOff: WriteOffEntry;
  recoveryAmount: number;
  recoveryDate: Date;
  recoveryMethod: RecoveryMethod;
  journalEntry: JournalEntry;
  status: RecoveryStatus;
}

interface ARPortfolio {
  id: string;
  name: string;
  customers: Customer[];
  totalExposure: number;
  totalECL: number;
  segments: PortfolioSegment[];
  lastUpdated: Date;
}

interface PortfolioSegment {
  id: string;
  name: string;
  customers: Customer[];
  exposure: number;
  ecl: number;
  pd: number;
  lgd: number;
  criteria: SegmentationCriteria;
}

interface ECLReport {
  id: string;
  portfolio: ARPortfolio;
  period: DateRange;
  totalExposure: number;
  totalECL: number;
  eclByStage: Map<ECLStage, number>;
  eclBySegment: Map<string, number>;
  writeOffs: WriteOffEntry[];
  recoveries: RecoveryEntry[];
  generatedAt: Date;
}

type ECLStage = 'stage1' | 'stage2' | 'stage3';
type WriteOffReason = 'bankruptcy' | 'insolvency' | 'dispute' | 'fraud' | 'other';
type RecoveryMethod = 'cash' | 'goods' | 'services' | 'settlement' | 'other';
type WriteOffStatus = 'pending' | 'approved' | 'processed' | 'reversed';
type RecoveryStatus = 'pending' | 'confirmed' | 'processed' | 'disputed';
type MatrixStatus = 'draft' | 'active' | 'superseded' | 'archived';
```

#### **Implementation Notes**
- Integrate with existing `aging-utilities.ts` for aging data
- Use existing `journal-entry-utilities.ts` for write-off entries
- Support multiple ECL calculation methods and compliance frameworks
- Implement efficient matrix operations and portfolio calculations

---

### **4.4 rounding-policy-utilities.ts**

#### **Purpose**
Central registry for currency, tax, and report rounding steps to keep reconciliations consistent.

#### **Key Features**
- **Policy Registry**: Central management of rounding policies
- **Context-Aware Rounding**: Different rounding rules for different contexts
- **Consistency Validation**: Ensure rounding consistency across operations
- **Policy Application**: Apply rounding policies to calculations
- **Audit Trail**: Track rounding decisions and changes
- **Compliance Support**: Support regulatory rounding requirements

#### **Core Functions**
```typescript
// Policy Management
defineRoundingPolicy(context: RoundingContext, method: RoundingMethod): RoundingPolicy
getRoundingPolicy(context: RoundingContext): RoundingPolicy
updateRoundingPolicy(policy: RoundingPolicy, updates: PolicyUpdates): RoundingPolicy
validateRoundingPolicy(policy: RoundingPolicy): ValidationResult

// Policy Application
applyRoundingPolicy(amount: number, context: RoundingContext): RoundedAmount
applyRoundingToArray(amounts: number[], context: RoundingContext): RoundedAmount[]
validateRoundingConsistency(amounts: number[], context: RoundingContext): ValidationResult
calculateRoundingDifference(original: number, rounded: number): RoundingDifference

// Context Management
defineRoundingContext(name: string, type: ContextType, rules: ContextRules): RoundingContext
validateRoundingContext(context: RoundingContext): ValidationResult
getContextHierarchy(context: RoundingContext): ContextHierarchy
mergeRoundingContexts(contexts: RoundingContext[]): RoundingContext

// Consistency and Validation
validateRoundingConsistency(amounts: number[], context: RoundingContext): ValidationResult
checkRoundingCompliance(amount: number, policy: RoundingPolicy, requirements: ComplianceRequirement[]): ComplianceResult
auditRoundingDecision(amount: number, context: RoundingContext, decision: RoundingDecision): AuditEntry
```

#### **Types & Interfaces**
```typescript
interface RoundingPolicy {
  id: string;
  name: string;
  description: string;
  context: RoundingContext;
  method: RoundingMethod;
  precision: number;
  rules: RoundingRule[];
  active: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
}

interface RoundingContext {
  id: string;
  name: string;
  type: ContextType;
  description: string;
  rules: ContextRules;
  parentContext?: string;
  childContexts: string[];
  priority: number;
}

interface RoundedAmount {
  original: number;
  rounded: number;
  difference: number;
  method: RoundingMethod;
  precision: number;
  context: RoundingContext;
  roundedAt: Date;
}

interface RoundingRule {
  id: string;
  name: string;
  condition: RoundingCondition;
  action: RoundingAction;
  priority: number;
  active: boolean;
}

interface RoundingDecision {
  amount: number;
  context: RoundingContext;
  method: RoundingMethod;
  precision: number;
  result: number;
  difference: number;
  timestamp: Date;
  user: string;
  reason: string;
}

interface AuditEntry {
  id: string;
  amount: number;
  context: RoundingContext;
  decision: RoundingDecision;
  timestamp: Date;
  user: string;
  action: AuditAction;
  details: string;
}

type ContextType = 'currency' | 'tax' | 'reporting' | 'calculation' | 'display';
type RoundingMethod = 'round_half_up' | 'round_half_down' | 'round_half_even' | 'round_up' | 'round_down' | 'truncate';
type RoundingCondition = 'amount_range' | 'currency' | 'tax_type' | 'report_type' | 'user_role';
type RoundingAction = 'round' | 'truncate' | 'ceiling' | 'floor' | 'no_action';
type AuditAction = 'create' | 'update' | 'delete' | 'apply' | 'validate';
```

#### **Implementation Notes**
- Integrate with existing `accounting-utilities.ts` for currency precision
- Use existing `validation-utilities.ts` for policy validation
- Support multiple rounding methods and regulatory requirements
- Implement efficient policy lookup and application algorithms

---

### **4.5 landed-cost-utilities.ts**

#### **Purpose**
Freight/duty allocation to inventory receipts by weight/volume/value with rounding governance.

#### **Key Features**
- **Cost Allocation**: Allocate landed costs to inventory items
- **Allocation Methods**: Support weight, volume, and value-based allocation
- **Rounding Governance**: Handle rounding differences in allocations
- **Receipt Management**: Manage inventory receipts and associated costs
- **Cost Tracking**: Track allocated costs and adjustments
- **Validation**: Validate allocation calculations and results

#### **Core Functions**
```typescript
// Cost Allocation
allocateLandedCosts(receipt: InventoryReceipt, costs: LandedCost[]): AllocationResult
calculateAllocationByWeight(items: InventoryItem[], totalCost: number): WeightAllocation
calculateAllocationByVolume(items: InventoryItem[], totalCost: number): VolumeAllocation
calculateAllocationByValue(items: InventoryItem[], totalCost: number): ValueAllocation
calculateAllocationByQuantity(items: InventoryItem[], totalCost: number): QuantityAllocation

// Receipt Management
createInventoryReceipt(receipt: ReceiptData): InventoryReceipt
addLandedCosts(receipt: InventoryReceipt, costs: LandedCost[]): InventoryReceipt
validateReceipt(receipt: InventoryReceipt): ValidationResult
processReceipt(receipt: InventoryReceipt): ProcessedReceipt

// Rounding Governance
applyRoundingGovernance(allocation: AllocationResult, method: RoundingMethod): AllocationResult
distributeRoundingDifference(allocation: AllocationResult): AllocationResult
validateAllocationBalance(allocation: AllocationResult, tolerance: number): ValidationResult
calculateRoundingAdjustment(allocation: AllocationResult): RoundingAdjustment

// Cost Tracking
trackAllocatedCosts(item: InventoryItem, allocation: AllocationResult): CostTracking
updateCostTracking(tracking: CostTracking, adjustment: CostAdjustment): CostTracking
validateCostTracking(tracking: CostTracking): ValidationResult
generateCostReport(receipts: InventoryReceipt[], period: DateRange): CostReport
```

#### **Types & Interfaces**
```typescript
interface InventoryReceipt {
  id: string;
  receiptNumber: string;
  receiptDate: Date;
  vendor: string;
  items: InventoryItem[];
  landedCosts: LandedCost[];
  totalCost: number;
  currency: SupportedCurrency;
  status: ReceiptStatus;
}

interface LandedCost {
  id: string;
  type: CostType;
  description: string;
  amount: number;
  currency: SupportedCurrency;
  allocationMethod: AllocationMethod;
  allocated: boolean;
  allocationDate?: Date;
}

interface AllocationResult {
  receipt: InventoryReceipt;
  method: AllocationMethod;
  items: AllocationItem[];
  totalAllocated: number;
  roundingDifference: number;
  isBalanced: boolean;
  calculationDate: Date;
}

interface AllocationItem {
  item: InventoryItem;
  baseAmount: number;
  allocationFactor: number;
  allocatedCost: number;
  roundingAdjustment: number;
  finalCost: number;
}

interface WeightAllocation extends AllocationResult {
  method: 'weight';
  totalWeight: number;
  weightFactors: Map<string, number>;
}

interface VolumeAllocation extends AllocationResult {
  method: 'volume';
  totalVolume: number;
  volumeFactors: Map<string, number>;
}

interface ValueAllocation extends AllocationResult {
  method: 'value';
  totalValue: number;
  valueFactors: Map<string, number>;
}

interface CostTracking {
  item: InventoryItem;
  originalCost: number;
  allocatedCosts: number;
  totalCost: number;
  adjustments: CostAdjustment[];
  lastUpdated: Date;
}

interface CostAdjustment {
  id: string;
  type: AdjustmentType;
  amount: number;
  reason: string;
  date: Date;
  approvedBy: string;
  journalEntry?: JournalEntry;
}

type CostType = 'freight' | 'duty' | 'insurance' | 'handling' | 'storage' | 'other';
type AllocationMethod = 'weight' | 'volume' | 'value' | 'quantity' | 'equal' | 'custom';
type ReceiptStatus = 'draft' | 'received' | 'allocated' | 'posted' | 'cancelled';
type AdjustmentType = 'allocation' | 'rounding' | 'correction' | 'write_off' | 'other';
```

#### **Implementation Notes**
- Integrate with existing `inventory-costing-utilities.ts` for cost calculations
- Use existing `rounding-policy-utilities.ts` for rounding governance
- Support multiple allocation methods and cost types
- Implement efficient allocation algorithms for large receipts

---

### **4.6 tb-cf-mapping-utilities.ts**

#### **Purpose**
Trial Balance to Cash Flow mapping adapter to keep statements consistent.

#### **Key Features**
- **TB to CF Mapping**: Map trial balance accounts to cash flow categories
- **Mapping Rules**: Define and manage mapping rules and exceptions
- **Statement Consistency**: Ensure consistency between TB and CF statements
- **Validation**: Validate mapping completeness and accuracy
- **Reconciliation**: Reconcile TB totals with CF statement totals
- **Reporting**: Generate mapping reports and analysis

#### **Core Functions**
```typescript
// TB to CF Mapping
mapTrialBalanceToCashFlow(trialBalance: TrialBalance, mapping: CFMapping): CashFlowData
defineCFMapping(account: Account, cfCategory: CFCategory, rules: MappingRules): CFMapping
validateCFMapping(mapping: CFMapping): ValidationResult
applyCFMapping(trialBalance: TrialBalance, mappings: CFMapping[]): MappedCashFlowData

// Statement Generation
generateCFStatementFromTB(trialBalance: TrialBalance, mapping: CFMapping): CashFlowStatement
validateCFStatement(statement: CashFlowStatement, trialBalance: TrialBalance): ValidationResult
reconcileCFWithTB(cfStatement: CashFlowStatement, trialBalance: TrialBalance): ReconciliationResult

// Mapping Management
createMappingRule(account: Account, cfCategory: CFCategory, conditions: MappingCondition[]): MappingRule
updateMappingRule(rule: MappingRule, updates: RuleUpdates): MappingRule
validateMappingRule(rule: MappingRule): ValidationResult
getMappingRules(account: Account): MappingRule[]

// Consistency and Validation
validateMappingConsistency(mappings: CFMapping[]): ValidationResult
checkMappingCompleteness(trialBalance: TrialBalance, mappings: CFMapping[]): CompletenessResult
validateCFTotals(cfStatement: CashFlowStatement, trialBalance: TrialBalance): ValidationResult
```

#### **Types & Interfaces**
```typescript
interface CFMapping {
  id: string;
  account: Account;
  cfCategory: CFCategory;
  subcategory: string;
  mappingRules: MappingRule[];
  priority: number;
  active: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
}

interface CFCategory {
  id: string;
  name: string;
  type: CFCategoryType;
  description: string;
  parentCategory?: string;
  childCategories: string[];
  accounts: string[];
  displayOrder: number;
}

interface MappingRule {
  id: string;
  account: Account;
  cfCategory: CFCategory;
  conditions: MappingCondition[];
  transformation: TransformationRule;
  priority: number;
  active: boolean;
}

interface MappingCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: LogicalOperator;
}

interface TransformationRule {
  type: TransformationType;
  parameters: TransformationParameters;
  description: string;
}

interface MappedCashFlowData {
  trialBalance: TrialBalance;
  mappings: CFMapping[];
  cfData: CashFlowData;
  unmappedAccounts: Account[];
  mappingIssues: MappingIssue[];
  generatedAt: Date;
}

interface CashFlowData {
  operating: CFCategoryData;
  investing: CFCategoryData;
  financing: CFCategoryData;
  totalCashFlow: number;
  openingCash: number;
  closingCash: number;
}

interface CFCategoryData {
  category: CFCategory;
  accounts: Account[];
  totalAmount: number;
  subtotals: CFSubtotal[];
  notes: string[];
}

interface ReconciliationResult {
  cfStatement: CashFlowStatement;
  trialBalance: TrialBalance;
  isReconciled: boolean;
  differences: ReconciliationDifference[];
  unmappedAmounts: number;
  mappingIssues: MappingIssue[];
  reconciliationDate: Date;
}

type CFCategoryType = 'operating' | 'investing' | 'financing';
type TransformationType = 'direct' | 'calculated' | 'conditional' | 'excluded';
type ConditionOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with';
type LogicalOperator = 'and' | 'or' | 'not';
type TransformationParameters = Record<string, any>;
```

#### **Implementation Notes**
- Integrate with existing `trial-balance-utilities.ts` for TB data
- Use existing `cashflow-mapping-utilities.ts` for CF mapping logic
- Support multiple mapping methods and transformation rules
- Implement efficient mapping and reconciliation algorithms

---

## 📅 Implementation Timeline

### **Week 1-2: Core Governance**
- **Day 1-4:** coa-governance-utilities.ts
- **Day 5-8:** financial-statements-utilities.ts
- **Day 9-14:** ecl-allowance-utilities.ts

### **Week 3-4: Policy and Allocation**
- **Day 15-18:** rounding-policy-utilities.ts
- **Day 19-22:** landed-cost-utilities.ts
- **Day 23-28:** tb-cf-mapping-utilities.ts

### **Week 5-6: Integration & Testing**
- **Day 29-35:** Integration testing
- **Day 36-42:** Documentation and refinement

---

## 🔧 Technical Requirements

### **Dependencies**
- Existing utilities: All previous utilities from Parts 1, 2 & 3
- External: None (pure domain logic)
- TypeScript: Strict mode, full type safety

### **Testing Strategy**
- Unit tests for each utility function
- Integration tests with existing utilities
- Performance tests for large datasets
- Validation tests for edge cases
- Compliance and regulatory tests

### **Documentation**
- JSDoc comments for all public functions
- Usage examples and best practices
- Integration guides with existing utilities
- Performance considerations and limitations
- Compliance and regulatory notes

---

## 📊 Success Metrics

### **Functional Metrics**
- ✅ All 6 utilities implemented and tested
- ✅ 100% TypeScript type coverage
- ✅ Integration with existing utilities
- ✅ Comprehensive validation and error handling
- ✅ Essential building blocks complete

### **Quality Metrics**
- ✅ Zero linting errors
- ✅ 90%+ test coverage
- ✅ Performance benchmarks met
- ✅ Documentation completeness
- ✅ Compliance with accounting standards

### **Business Metrics**
- ✅ Complete COA governance
- ✅ Full financial statement generation
- ✅ ECL and allowance management
- ✅ Centralized rounding policies
- ✅ Landed cost allocation
- ✅ TB to CF mapping consistency

---

## 🎯 Final Summary

### **Complete Utility Suite (54 modules)**
- **Existing:** 23 utilities
- **Part 1:** 7 utilities (Core GL, Periods, Controls)
- **Part 2:** 9 utilities (Multi-currency, Tax, Revenue)
- **Part 3:** 9 utilities (Assets, Consolidation, Cash, Documents)
- **Part 4:** 6 utilities (Essential Building Blocks)

### **Total Implementation Timeline**
- **Part 1:** 4-6 weeks
- **Part 2:** 6-8 weeks  
- **Part 3:** 6-8 weeks
- **Part 4:** 4-6 weeks
- **Total:** 20-28 weeks

### **Final Architecture**
- **54 pure accounting utilities**
- **Comprehensive domain coverage**
- **Enterprise-grade functionality**
- **Full TypeScript type safety**
- **Zero external dependencies**
- **Production-ready implementation**
- **Essential building blocks complete**

---

**Status:** Complete Development Plan  
**Next Phase:** Implementation of Part 4 utilities  
**Target:** Enterprise-grade accounting system with complete essential building blocks and full GL, multi-currency, tax, and consolidation capabilities

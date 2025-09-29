/**
 * Expected Credit Loss (ECL) Allowance Utilities
 * 
 * Expected Credit Loss calculators with matrix, PD×LGD, write-off & recovery flows.
 * Provides comprehensive ECL management, portfolio analysis, and compliance reporting.
 * 
 * @fileoverview ECL calculations, PD×LGD matrix, write-off and recovery management
 */

import type {
  SupportedCurrency,
} from './accounting-utilities';
import { roundToCurrency } from './accounting-utilities';
import type { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import type { DateRange } from './date-utilities';
import type { AgingResult } from './aging-utilities';
import type { JournalEntry } from './journal-entry-utilities';
import type { ConditionOperator, LogicalOperator } from './shared-operators-utilities';
import { z } from 'zod';

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

/**
 * Zod schema for SegmentationCriteria
 */
export const SegmentationCriteriaSchema = z.object({
  field: z.string().min(1, 'Field name is required'),
  operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'starts_with', 'ends_with', 'between', 'regex']),
  value: z.unknown(), // Can be any type depending on operator
  logicalOperator: z.enum(['and', 'or', 'not']).optional(),
});

/**
 * Zod schema for ECLSegment
 */
export const ECLSegmentSchema = z.object({
  id: z.string().min(1, 'Segment ID is required'),
  name: z.string().min(1, 'Segment name is required'),
  criteria: z.array(SegmentationCriteriaSchema).min(1, 'At least one criteria is required'),
  pd: z.number().min(0).max(1, 'PD must be between 0 and 1'),
  lgd: z.number().min(0).max(1, 'LGD must be between 0 and 1'),
  ead: z.number().min(0, 'EAD must be non-negative'),
  description: z.string().min(1, 'Description is required'),
});

/**
 * Zod schema for ECLMatrix
 */
export const ECLMatrixSchema = z.object({
  id: z.string().min(1, 'Matrix ID is required'),
  name: z.string().min(1, 'Matrix name is required'),
  description: z.string().min(1, 'Description is required'),
  segments: z.array(ECLSegmentSchema).min(1, 'At least one segment is required'),
  pdRates: z.instanceof(Map).optional(),
  lgdRates: z.instanceof(Map).optional(),
  effectiveDate: z.date(),
  expiryDate: z.date().optional(),
  status: z.enum(['draft', 'active', 'superseded', 'archived']),
});

/**
 * Zod schema for Customer
 */
export const CustomerSchema = z.object({
  id: z.string().min(1, 'Customer ID is required'),
  name: z.string().min(1, 'Customer name is required'),
  creditRating: z.string().min(1, 'Credit rating is required'),
  industry: z.string().min(1, 'Industry is required'),
  country: z.string().min(1, 'Country is required'),
  riskCategory: z.enum(['low', 'medium', 'high', 'critical']),
  creditLimit: z.number().min(0, 'Credit limit must be non-negative'),
  currency: z.string().min(1, 'Currency is required'),
});

/**
 * Zod schema for ARPortfolio
 */
export const ARPortfolioSchema = z.object({
  id: z.string().min(1, 'Portfolio ID is required'),
  name: z.string().min(1, 'Portfolio name is required'),
  customers: z.array(CustomerSchema).min(1, 'At least one customer is required'),
  totalExposure: z.number().min(0, 'Total exposure must be non-negative'),
  totalECL: z.number().min(0, 'Total ECL must be non-negative'),
  segments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    customers: z.array(CustomerSchema),
    exposure: z.number().min(0),
    ecl: z.number().min(0),
    pd: z.number().min(0).max(1),
    lgd: z.number().min(0).max(1),
    criteria: z.array(SegmentationCriteriaSchema),
  })).optional(),
  lastUpdated: z.date(),
});

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ECLMatrix {
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

export interface ECLSegment {
  id: string;
  name: string;
  criteria: SegmentationCriteria[];
  pd: number;
  lgd: number;
  ead: number;
  description: string;
}

export interface ECLResult {
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

export interface WriteOffEntry {
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

export interface RecoveryEntry {
  id: string;
  writeOff: WriteOffEntry;
  recoveryAmount: number;
  recoveryDate: Date;
  recoveryMethod: RecoveryMethod;
  journalEntry: JournalEntry;
  status: RecoveryStatus;
}

export interface ARPortfolio {
  id: string;
  name: string;
  customers: Customer[];
  totalExposure: number;
  totalECL: number;
  segments: PortfolioSegment[];
  lastUpdated: Date;
}

export interface PortfolioSegment {
  id: string;
  name: string;
  customers: Customer[];
  exposure: number;
  ecl: number;
  pd: number;
  lgd: number;
  criteria: SegmentationCriteria[];
}

export interface ECLReport {
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

export interface Customer {
  id: string;
  name: string;
  creditRating: string;
  industry: string;
  country: string;
  riskCategory: RiskCategory;
  creditLimit: number;
  currency: SupportedCurrency;
}

export interface SegmentationCriteria {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logicalOperator?: LogicalOperator;
}

export interface WriteOffApproval {
  approvedBy: string;
  approvedAt: Date;
  approvalLevel: ApprovalLevel;
  comments: string;
}

export interface ECLData {
  customer: Customer;
  exposure: number;
  pd: number;
  lgd: number;
  stage: ECLStage;
  date: Date;
}

export interface ECLParameters {
  pd: number;
  lgd: number;
  ead: number;
  stage: ECLStage;
  confidence: number;
}

export interface StageBasedECLResult {
  portfolio: ARPortfolio;
  stages: ECLStage[];
  stageResults: Map<ECLStage, ECLResult[]>;
  totalECL: number;
  calculationDate: Date;
}

export interface LifetimeECLResult {
  portfolio: ARPortfolio;
  lifetimeECL: number;
  stage1ECL: number;
  stage2ECL: number;
  stage3ECL: number;
  calculationDate: Date;
}

export interface RecoveryRate {
  customer: Customer;
  period: DateRange;
  totalWriteOffs: number;
  totalRecoveries: number;
  recoveryRate: number;
  averageRecoveryTime: number;
}

export interface WriteOffHistory {
  customer: Customer;
  writeOffs: WriteOffEntry[];
  totalWriteOffAmount: number;
  totalRecoveryAmount: number;
  netWriteOffAmount: number;
  recoveryRate: number;
}

export interface PortfolioECLResult {
  portfolio: ARPortfolio;
  totalECL: number;
  eclByCustomer: Map<string, ECLResult>;
  eclBySegment: Map<string, number>;
  calculationDate: Date;
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  framework: ComplianceFramework;
  requirements: string[];
  active: boolean;
}

export interface ComplianceResult {
  requirement: ComplianceRequirement;
  isCompliant: boolean;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface ECLProvision {
  id: string;
  portfolio: ARPortfolio;
  totalProvision: number;
  stage1Provision: number;
  stage2Provision: number;
  stage3Provision: number;
  calculationDate: Date;
  journalEntry: JournalEntry;
}

export type ECLStage = 'stage1' | 'stage2' | 'stage3';
export type WriteOffReason = 'bankruptcy' | 'insolvency' | 'dispute' | 'fraud' | 'other';
export type RecoveryMethod = 'cash' | 'goods' | 'services' | 'settlement' | 'other';
export type WriteOffStatus = 'pending' | 'approved' | 'processed' | 'reversed';
export type RecoveryStatus = 'pending' | 'confirmed' | 'processed' | 'disputed';
export type MatrixStatus = 'draft' | 'active' | 'superseded' | 'archived';
export type RiskCategory = 'low' | 'medium' | 'high' | 'critical';
// ConditionOperator and LogicalOperator imported from shared-operators.ts (SSOT)
export type ApprovalLevel = 'manager' | 'director' | 'cfo' | 'ceo';
export type ComplianceFramework = 'ifrs9' | 'basel' | 'gaap' | 'local';

// ============================================================================
// ECL Calculations
// ============================================================================

/**
 * Calculate Expected Credit Loss for a customer
 */
export function calculateECL(
  customer: Customer,
  aging: AgingResult,
  matrix: ECLMatrix,
  /**
   * Optional currency override for rounding (defaults to customer's currency).
   */
  currency?: SupportedCurrency
): ECLResult {
  // Determine ECL stage based on aging
  const stage = determineECLStage(aging);
  
  // Get PD and LGD from matrix
  const segment = findApplicableSegment(customer, matrix);
  const pd = segment?.pd || 0.01; // Default 1% PD
  const lgd = segment?.lgd || 0.4; // Default 40% LGD
  
  // Calculate exposure (total outstanding amount)
  const exposure = aging.totalAmount;
  
  // Calculate ECL: ECL = EAD × PD × LGD
  const ccy = currency ?? customer.currency;
  const rawEcl = exposure * pd * lgd;
  const ecl = roundToCurrency(rawEcl, ccy);
  
  // Calculate confidence based on data quality
  const confidence = calculateConfidence(customer, aging);
  
  return {
    customer,
    exposure,
    pd,
    lgd,
    ecl,
    stage,
    calculationDate: new Date(),
    matrix,
    confidence,
  };
}

/**
 * Calculate PD × LGD for ECL calculation
 */
export function calculatePDxLGD(
  exposure: number,
  pd: number,
  lgd: number,
  /**
   * Optional currency for rounding the result. If omitted, returns the raw numeric product.
   */
  currency?: SupportedCurrency
): number {
  if (pd < 0 || pd > 1) {
    throw new Error('PD must be between 0 and 1');
  }
  
  if (lgd < 0 || lgd > 1) {
    throw new Error('LGD must be between 0 and 1');
  }
  
  if (exposure < 0) {
    throw new Error('Exposure cannot be negative');
  }
  
  const val = exposure * pd * lgd;
  return currency ? roundToCurrency(val, currency) : val;
}

/**
 * Calculate stage-based ECL for a portfolio
 */
export function calculateStageBasedECL(portfolio: ARPortfolio, stages: ECLStage[]): StageBasedECLResult {
  const stageResults = new Map<ECLStage, ECLResult[]>();
  let totalECL = 0;
  
  stages.forEach(stage => {
    const stageCustomers = portfolio.customers.filter(customer => {
      // In practice, you'd determine stage based on customer risk assessment
      return customer.riskCategory === getRiskCategoryForStage(stage);
    });
    
    const stageECLResults: ECLResult[] = stageCustomers.map(customer => {
      // Simplified ECL calculation - in practice, you'd use actual aging data
      const exposure = customer.creditLimit * 0.8; // Assume 80% utilization
      const pd = getPDForStage(stage);
      const lgd = getLGDForStage(stage);
      const ecl = calculatePDxLGD(exposure, pd, lgd, customer.currency);
      
      return {
        customer,
        exposure,
        pd,
        lgd,
        ecl,
        stage,
        calculationDate: new Date(),
        matrix: {} as ECLMatrix, // Would be populated from actual matrix
        confidence: 0.8,
      };
    });
    
    stageResults.set(stage, stageECLResults);
    totalECL += stageECLResults.reduce((sum, result) => sum + result.ecl, 0);
  });
  
  return {
    portfolio,
    stages,
    stageResults,
    totalECL,
    calculationDate: new Date(),
  };
}

/**
 * Calculate lifetime ECL for a portfolio
 */
export function calculateLifetimeECL(portfolio: ARPortfolio, matrix: ECLMatrix): LifetimeECLResult {
  let stage1ECL = 0;
  let stage2ECL = 0;
  let stage3ECL = 0;
  
  portfolio.customers.forEach(customer => {
    // Simplified calculation - in practice, you'd use actual aging and risk data
    const exposure = customer.creditLimit * 0.8;
    const stage = determineECLStageFromCustomer(customer);
    const segment = findApplicableSegment(customer, matrix);
    const pd = segment?.pd || 0.01;
    const lgd = segment?.lgd || 0.4;
    const ecl = calculatePDxLGD(exposure, pd, lgd, customer.currency);
    
    switch (stage) {
      case 'stage1':
        stage1ECL += ecl;
        break;
      case 'stage2':
        stage2ECL += ecl;
        break;
      case 'stage3':
        stage3ECL += ecl;
        break;
    }
  });
  
  const lifetimeECL = stage1ECL + stage2ECL + stage3ECL;
  
  return {
    portfolio,
    lifetimeECL,
    stage1ECL,
    stage2ECL,
    stage3ECL,
    calculationDate: new Date(),
  };
}

// ============================================================================
// Matrix Management
// ============================================================================

/**
 * Create ECL matrix with segments
 */
export function createECLMatrix(name: string, segments: ECLSegment[]): ECLMatrix {
  const pdRates = new Map<string, number>();
  const lgdRates = new Map<string, number>();
  
  segments.forEach(segment => {
    pdRates.set(segment.id, segment.pd);
    lgdRates.set(segment.id, segment.lgd);
  });
  
  return {
    id: `matrix_${name}_${Date.now()}`,
    name,
    description: `ECL Matrix for ${name}`,
    segments,
    pdRates,
    lgdRates,
    effectiveDate: new Date(),
    status: 'draft',
  };
}

/**
 * Update ECL matrix with new data
 */
export function updateECLMatrix(matrix: ECLMatrix, newData: ECLData): ECLMatrix {
  // Find applicable segment
  const segment = findApplicableSegment(newData.customer, matrix);
  if (!segment) {
    throw new Error(`No applicable segment found for customer ${newData.customer.id}`);
  }
  
  // Update segment with new data
  const updatedSegments = matrix.segments.map(seg => {
    if (seg.id === segment.id) {
      return {
        ...seg,
        pd: newData.pd,
        lgd: newData.lgd,
        ead: newData.exposure,
      };
    }
    return seg;
  });
  
  // Update rates maps
  const updatedPdRates = new Map(matrix.pdRates);
  const updatedLgdRates = new Map(matrix.lgdRates);
  updatedPdRates.set(segment.id, newData.pd);
  updatedLgdRates.set(segment.id, newData.lgd);
  
  return {
    ...matrix,
    segments: updatedSegments,
    pdRates: updatedPdRates,
    lgdRates: updatedLgdRates,
  };
}

/**
 * Validate ECL matrix with Zod schema validation
 */
export function validateECLMatrix(matrix: ECLMatrix): BusinessValidationResult {
  const issues: ValidationIssue[] = [];

  // ---------------------------------------------------------------------------
  // Zod schema validation (adds guardrails without breaking existing API)
  // ---------------------------------------------------------------------------
  const zres = ECLMatrixSchema.safeParse(matrix);
  if (!zres.success) {
    for (const err of zres.error.issues) {
      issues.push({
        code: 'FORMAT' as unknown,
        message: `Schema: ${err.message}`,
        path: err.path.join('.') || 'matrix',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Business logic validation (existing logic)
  // ---------------------------------------------------------------------------
  
  // Validate matrix name
  if (!matrix.name || matrix.name.trim() === '') {
    issues.push({
      path: 'name',
      message: 'Matrix name is required',
      severity: 'error',
      code: 'REQUIRED',
    });
  }
  
  // Validate segments
  if (matrix.segments.length === 0) {
    issues.push({
      path: 'segments',
      message: 'Matrix must have at least one segment',
      severity: 'error',
      code: 'FORMAT',
    });
  }
  
  // Validate segment data
  matrix.segments.forEach((segment, index) => {
    if (segment.pd < 0 || segment.pd > 1) {
      issues.push({
        path: `segments[${index}].pd`,
        message: 'PD must be between 0 and 1',
        severity: 'error',
        code: 'RANGE',
      });
    }
    
    if (segment.lgd < 0 || segment.lgd > 1) {
      issues.push({
        path: `segments[${index}].lgd`,
        message: 'LGD must be between 0 and 1',
        severity: 'error',
        code: 'RANGE',
      });
    }
  });
  
  // Validate effective date
  if (matrix.effectiveDate > new Date()) {
    issues.push({
      path: 'effectiveDate',
      message: 'Effective date cannot be in the future',
      severity: 'warning',
      code: 'RANGE',
    });
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

/**
 * Validate ECL segment using Zod schema
 */
export function validateECLSegment(segment: unknown): { isValid: boolean; errors: string[]; data?: unknown } {
  try {
    const validatedSegment = ECLSegmentSchema.parse(segment);
    return { isValid: true, errors: [], data: validatedSegment };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate customer using Zod schema
 */
export function validateCustomer(customer: unknown): { isValid: boolean; errors: string[]; data?: unknown } {
  try {
    const validatedCustomer = CustomerSchema.parse(customer);
    return { isValid: true, errors: [], data: validatedCustomer };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate AR portfolio using Zod schema
 */
export function validateARPortfolio(portfolio: unknown): { isValid: boolean; errors: string[]; data?: unknown } {
  try {
    const validatedPortfolio = ARPortfolioSchema.parse(portfolio);
    return { isValid: true, errors: [], data: validatedPortfolio };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate segmentation criteria using Zod schema
 */
export function validateSegmentationCriteria(criteria: unknown): { isValid: boolean; errors: string[]; data?: unknown } {
  try {
    const validatedCriteria = SegmentationCriteriaSchema.parse(criteria);
    return { isValid: true, errors: [], data: validatedCriteria };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Get ECL parameters for a customer
 */
export function getECLParameters(customer: Customer, matrix: ECLMatrix): ECLParameters {
  const segment = findApplicableSegment(customer, matrix);
  
  return {
    pd: segment?.pd || 0.01,
    lgd: segment?.lgd || 0.4,
    ead: customer.creditLimit * 0.8, // Simplified
    stage: determineECLStageFromCustomer(customer),
    confidence: 0.8,
  };
}

// ============================================================================
// Write-off and Recovery
// ============================================================================

/**
 * Process write-off for an account receivable
 */
export function processWriteOff(ar: AccountReceivable, amount: number, reason: WriteOffReason): WriteOffEntry {
  if (amount <= 0) {
    throw new Error('Write-off amount must be positive');
  }
  
  if (amount > ar.outstandingAmount) {
    throw new Error('Write-off amount cannot exceed outstanding amount');
  }
  
  // Create journal entry for write-off
  const journalEntry: JournalEntry = {
    id: `wo_${ar.id}_${Date.now()}`,
    date: new Date(),
    reference: `WO-${ar.id}`,
    description: `Write-off for ${ar.customer.name}`,
    lines: [
      {
        id: `wo_line_1_${Date.now()}`,
        accountCode: '6900', // Bad debt expense
        description: `Write-off ${ar.customer.name}`,
        debit: amount,
        credit: 0,
        currency: ar.currency,
      },
      {
        id: `wo_line_2_${Date.now()}`,
        accountCode: '1200', // Accounts receivable
        description: `Write-off ${ar.customer.name}`,
        debit: 0,
        credit: amount,
        currency: ar.currency,
      },
    ],
    totalDebits: amount,
    totalCredits: amount,
    currency: ar.currency,
    status: 'draft',
  };
  
  return {
    id: `writeoff_${ar.id}_${Date.now()}`,
    customer: ar.customer,
    originalAmount: ar.outstandingAmount,
    writeOffAmount: amount,
    writeOffDate: new Date(),
    reason,
    approval: {
      approvedBy: 'system',
      approvedAt: new Date(),
      approvalLevel: 'manager',
      comments: `Write-off processed for reason: ${reason}`,
    },
    journalEntry,
    status: 'processed',
  };
}

/**
 * Process recovery of a written-off amount
 */
export function processRecovery(writeOff: WriteOffEntry, amount: number): RecoveryEntry {
  if (amount <= 0) {
    throw new Error('Recovery amount must be positive');
  }
  
  if (amount > writeOff.writeOffAmount) {
    throw new Error('Recovery amount cannot exceed write-off amount');
  }
  
  // Create journal entry for recovery
  const journalEntry: JournalEntry = {
    id: `rec_${writeOff.id}_${Date.now()}`,
    date: new Date(),
    reference: `REC-${writeOff.id}`,
    description: `Recovery for ${writeOff.customer.name}`,
    lines: [
      {
        id: `rec_line_1_${Date.now()}`,
        accountCode: '1200', // Accounts receivable
        description: `Recovery ${writeOff.customer.name}`,
        debit: amount,
        credit: 0,
        currency: writeOff.customer.currency,
      },
      {
        id: `rec_line_2_${Date.now()}`,
        accountCode: '6900', // Bad debt expense (reversal)
        description: `Recovery ${writeOff.customer.name}`,
        debit: 0,
        credit: amount,
        currency: writeOff.customer.currency,
      },
    ],
    totalDebits: amount,
    totalCredits: amount,
    currency: writeOff.customer.currency,
    status: 'draft',
  };
  
  return {
    id: `recovery_${writeOff.id}_${Date.now()}`,
    writeOff,
    recoveryAmount: amount,
    recoveryDate: new Date(),
    recoveryMethod: 'cash',
    journalEntry,
    status: 'processed',
  };
}

/**
 * Calculate recovery rate for a customer
 */
export function calculateRecoveryRate(customer: Customer, period: DateRange): RecoveryRate {
  // In practice, you'd query actual write-off and recovery data
  const totalWriteOffs = 10000; // Placeholder
  const totalRecoveries = 2000; // Placeholder
  const recoveryRate = totalRecoveries / totalWriteOffs;
  const averageRecoveryTime = 90; // days
  
  return {
    customer,
    period,
    totalWriteOffs,
    totalRecoveries,
    recoveryRate,
    averageRecoveryTime,
  };
}

/**
 * Track write-off history for a customer
 */
export function trackWriteOffHistory(customer: Customer): WriteOffHistory {
  // In practice, you'd query actual write-off and recovery data
  const writeOffs: WriteOffEntry[] = []; // Placeholder
  const totalWriteOffAmount = writeOffs.reduce((sum, wo) => sum + wo.writeOffAmount, 0);
  const totalRecoveryAmount = writeOffs.reduce((sum, wo) => {
    // In practice, you'd query recovery entries
    return sum + (wo.writeOffAmount * 0.2); // Assume 20% recovery rate
  }, 0);
  const netWriteOffAmount = totalWriteOffAmount - totalRecoveryAmount;
  const recoveryRate = totalWriteOffAmount > 0 ? totalRecoveryAmount / totalWriteOffAmount : 0;
  
  return {
    customer,
    writeOffs,
    totalWriteOffAmount,
    totalRecoveryAmount,
    netWriteOffAmount,
    recoveryRate,
  };
}

// ============================================================================
// Portfolio Management
// ============================================================================

/**
 * Calculate portfolio ECL
 */
export function calculatePortfolioECL(portfolio: ARPortfolio, matrix: ECLMatrix): PortfolioECLResult {
  const eclByCustomer = new Map<string, ECLResult>();
  const eclBySegment = new Map<string, number>();
  let totalECL = 0;
  
  portfolio.customers.forEach(customer => {
    // Simplified ECL calculation
    const exposure = customer.creditLimit * 0.8;
    const segment = findApplicableSegment(customer, matrix);
    const pd = segment?.pd || 0.01;
    const lgd = segment?.lgd || 0.4;
    const ecl = calculatePDxLGD(exposure, pd, lgd, customer.currency);
    
    const eclResult: ECLResult = {
      customer,
      exposure,
      pd,
      lgd,
      ecl,
      stage: determineECLStageFromCustomer(customer),
      calculationDate: new Date(),
      matrix,
      confidence: 0.8,
    };
    
    eclByCustomer.set(customer.id, eclResult);
    totalECL += ecl;
    
    // Aggregate by segment
    if (segment) {
      const currentSegmentECL = eclBySegment.get(segment.id) || 0;
      eclBySegment.set(segment.id, currentSegmentECL + ecl);
    }
  });
  
  return {
    portfolio,
    totalECL,
    eclByCustomer,
    eclBySegment,
    calculationDate: new Date(),
  };
}

/**
 * Segment portfolio based on criteria
 */
export function segmentPortfolio(portfolio: ARPortfolio, criteria: SegmentationCriteria[]): PortfolioSegment[] {
  const segments = new Map<string, PortfolioSegment>();
  
  portfolio.customers.forEach(customer => {
    // Find applicable segment based on criteria
    const segmentId = findSegmentForCustomer(customer);
    
    if (!segments.has(segmentId)) {
      segments.set(segmentId, {
        id: segmentId,
        name: `Segment ${segmentId}`,
        customers: [],
        exposure: 0,
        ecl: 0,
        pd: 0.01,
        lgd: 0.4,
        criteria,
      });
    }
    
    const segment = segments.get(segmentId)!;
    segment.customers.push(customer);
    segment.exposure += customer.creditLimit * 0.8; // Simplified
  });
  
  return Array.from(segments.values());
}

/**
 * Validate portfolio segmentation
 */
export function validatePortfolioSegmentation(segments: PortfolioSegment[]): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check if all customers are assigned to segments
  const totalCustomers = segments.reduce((sum, segment) => sum + segment.customers.length, 0);
  if (totalCustomers === 0) {
    issues.push({
      path: 'segments',
      message: 'No customers assigned to segments',
      severity: 'error',
      code: 'FORMAT',
    });
  }
  
  // Validate segment data
  segments.forEach((segment, index) => {
    if (segment.customers.length === 0) {
      issues.push({
        path: `segments[${index}].customers`,
        message: `Segment ${segment.name} has no customers`,
        severity: 'warning',
        code: 'FORMAT',
      });
    }
    
    if (segment.exposure < 0) {
      issues.push({
        path: `segments[${index}].exposure`,
        message: `Segment ${segment.name} has negative exposure`,
        severity: 'error',
        code: 'RANGE',
      });
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: issues.filter(i => i.severity === 'error').map(i => i.message),
  };
}

// ============================================================================
// Compliance and Reporting
// ============================================================================

/**
 * Generate ECL report
 */
export function generateECLReport(portfolio: ARPortfolio, matrix: ECLMatrix, period: DateRange): ECLReport {
  const portfolioECL = calculatePortfolioECL(portfolio, matrix);
  const eclByStage = new Map<ECLStage, number>();
  const eclBySegment = new Map<string, number>();
  
  // Aggregate ECL by stage
  portfolioECL.eclByCustomer.forEach(result => {
    const currentStageECL = eclByStage.get(result.stage) || 0;
    eclByStage.set(result.stage, currentStageECL + result.ecl);
  });
  
  // Copy segment ECL
  portfolioECL.eclBySegment.forEach((ecl, segmentId) => {
    eclBySegment.set(segmentId, ecl);
  });
  
  return {
    id: `ecl_report_${period.start.getFullYear()}_${period.start.getMonth() + 1}`,
    portfolio,
    period,
    totalExposure: portfolio.totalExposure,
    totalECL: portfolioECL.totalECL,
    eclByStage,
    eclBySegment,
    writeOffs: [], // Would be populated from actual data
    recoveries: [], // Would be populated from actual data
    generatedAt: new Date(),
  };
}

/**
 * Validate ECL compliance
 */
export function validateECLCompliance(report: ECLReport, requirements: ComplianceRequirement[]): ComplianceResult[] {
  return requirements.map(requirement => {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    
    // Check IFRS 9 compliance
    if (requirement.framework === 'ifrs9') {
      // Validate stage classification
      if (!report.eclByStage.has('stage1') || !report.eclByStage.has('stage2') || !report.eclByStage.has('stage3')) {
        issues.push({
          path: 'stages',
          message: 'IFRS 9 requires all three stages to be present',
          severity: 'error',
          code: 'REQUIRED',
        });
      }
      
      // Validate ECL calculation methodology
      if (report.totalECL <= 0) {
        issues.push({
          path: 'ecl',
          message: 'ECL must be positive for IFRS 9 compliance',
          severity: 'error',
          code: 'RANGE',
        });
      }
    }
    
    // Check Basel compliance
    if (requirement.framework === 'basel') {
      // Validate risk-weighted assets calculation
      if (report.totalExposure <= 0) {
        issues.push({
          path: 'exposure',
          message: 'Exposure must be positive for Basel compliance',
          severity: 'error',
          code: 'RANGE',
        });
      }
    }
    
    return {
      requirement,
      isCompliant: issues.length === 0,
      issues,
      recommendations,
    };
  });
}

/**
 * Calculate ECL provision
 */
export function calculateECLProvision(portfolio: ARPortfolio, matrix: ECLMatrix): ECLProvision {
  const lifetimeECL = calculateLifetimeECL(portfolio, matrix);
  // Choose a base currency for the provision entry:
  // prefer the first customer's currency if available, fallback to 'USD'
  const baseCurrency = (portfolio.customers[0]?.currency ?? ('USD' as SupportedCurrency)) as SupportedCurrency;
  const provTotal = roundToCurrency(lifetimeECL.lifetimeECL, baseCurrency);
  const provS1 = roundToCurrency(lifetimeECL.stage1ECL, baseCurrency);
  const provS2 = roundToCurrency(lifetimeECL.stage2ECL, baseCurrency);
  const provS3 = roundToCurrency(lifetimeECL.stage3ECL, baseCurrency);
  
  // Create journal entry for ECL provision
  const journalEntry: JournalEntry = {
    id: `ecl_provision_${Date.now()}`,
    date: new Date(),
    reference: `ECL-PROV-${Date.now()}`,
    description: 'ECL Provision',
    lines: [
      {
        id: `ecl_line_1_${Date.now()}`,
        accountCode: '6901', // ECL Expense
        description: 'ECL Provision',
        debit: provTotal,
        credit: 0,
        currency: baseCurrency,
      },
      {
        id: `ecl_line_2_${Date.now()}`,
        accountCode: '1900', // ECL Allowance
        description: 'ECL Provision',
        debit: 0,
        credit: provTotal,
        currency: baseCurrency,
      },
    ],
    totalDebits: provTotal,
    totalCredits: provTotal,
    currency: baseCurrency,
    status: 'draft',
  };
  
  return {
    id: `provision_${Date.now()}`,
    portfolio,
    totalProvision: provTotal,
    stage1Provision: provS1,
    stage2Provision: provS2,
    stage3Provision: provS3,
    calculationDate: new Date(),
    journalEntry,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function determineECLStage(aging: AgingResult): ECLStage {
  // Simplified stage determination based on aging
  if (aging.totalOverdue > 0) {
    return 'stage3'; // Significant increase in credit risk
  } else if (aging.averageDays > 30) {
    return 'stage2'; // Significant increase in credit risk
  } else {
    return 'stage1'; // 12-month ECL
  }
}

function determineECLStageFromCustomer(customer: Customer): ECLStage {
  // Simplified stage determination based on customer risk
  switch (customer.riskCategory) {
    case 'critical':
      return 'stage3';
    case 'high':
      return 'stage2';
    case 'medium':
    case 'low':
    default:
      return 'stage1';
  }
}

function findApplicableSegment(customer: Customer, matrix: ECLMatrix): ECLSegment | undefined {
  return matrix.segments.find(segment => {
    return segment.criteria.every(criteria => {
      return evaluateCriteria(customer, criteria);
    });
  });
}

function evaluateCriteria(customer: Customer, criteria: SegmentationCriteria): boolean {
  const value = getCustomerFieldValue(customer, criteria.field);
  
  switch (criteria.operator) {
    case 'equals':
      return value === criteria.value;
    case 'not_equals':
      return value !== criteria.value;
    case 'greater_than':
      return typeof value === 'number' && typeof criteria.value === 'number' && value > criteria.value;
    case 'less_than':
      return typeof value === 'number' && typeof criteria.value === 'number' && value < criteria.value;
    case 'contains':
      return typeof value === 'string' && typeof criteria.value === 'string' && value.includes(criteria.value);
    case 'starts_with':
      return typeof value === 'string' && typeof criteria.value === 'string' && value.startsWith(criteria.value);
    default:
      return false;
  }
}

function getCustomerFieldValue(customer: Customer, field: string): unknown {
  switch (field) {
    case 'creditRating':
      return customer.creditRating;
    case 'industry':
      return customer.industry;
    case 'country':
      return customer.country;
    case 'riskCategory':
      return customer.riskCategory;
    case 'creditLimit':
      return customer.creditLimit;
    default:
      return undefined;
  }
}

function calculateConfidence(customer: Customer, aging: AgingResult): number {
  // Simplified confidence calculation
  let confidence = 0.8; // Base confidence
  
  // Adjust based on data quality
  if (aging.totalAmount > 0) {
    confidence += 0.1;
  }
  
  // Adjust based on customer risk
  switch (customer.riskCategory) {
    case 'low':
      confidence += 0.1;
      break;
    case 'medium':
      confidence += 0.05;
      break;
    case 'high':
      confidence -= 0.05;
      break;
    case 'critical':
      confidence -= 0.1;
      break;
  }
  
  return Math.max(0, Math.min(1, confidence));
}

function getRiskCategoryForStage(stage: ECLStage): RiskCategory {
  switch (stage) {
    case 'stage1':
      return 'low';
    case 'stage2':
      return 'medium';
    case 'stage3':
      return 'high';
    default:
      return 'low';
  }
}

function getPDForStage(stage: ECLStage): number {
  switch (stage) {
    case 'stage1':
      return 0.01; // 1%
    case 'stage2':
      return 0.05; // 5%
    case 'stage3':
      return 0.15; // 15%
    default:
      return 0.01;
  }
}

function getLGDForStage(stage: ECLStage): number {
  switch (stage) {
    case 'stage1':
      return 0.4; // 40%
    case 'stage2':
      return 0.5; // 50%
    case 'stage3':
      return 0.6; // 60%
    default:
      return 0.4;
  }
}

function findSegmentForCustomer(customer: Customer): string {
  // Simplified segment assignment
  if (customer.riskCategory === 'critical') {
    return 'critical_risk';
  } else if (customer.riskCategory === 'high') {
    return 'high_risk';
  } else if (customer.riskCategory === 'medium') {
    return 'medium_risk';
  } else {
    return 'low_risk';
  }
}

// ============================================================================
// Additional Types
// ============================================================================

export interface AccountReceivable {
  id: string;
  customer: Customer;
  outstandingAmount: number;
  currency: SupportedCurrency;
  dueDate: Date;
  invoiceDate: Date;
  status: 'open' | 'overdue' | 'paid' | 'written_off';
}

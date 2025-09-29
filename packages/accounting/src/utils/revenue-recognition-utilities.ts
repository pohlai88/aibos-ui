/**
 * Revenue Recognition Utilities
 * 
 * Revenue recognition with straight-line, milestone, and percentage complete schedules.
 * Provides comprehensive revenue recognition management and schedule generation.
 * 
 * @fileoverview Revenue recognition methods, schedule management, and milestone operations
 */

import type {
  SupportedCurrency,
} from './accounting-utilities';
import { roundToCurrency } from './accounting-utilities';
import type { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import type { FiscalPeriod } from './fiscal-period-utilities';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface RevenueContract {
  id: string;
  customer: string;
  totalValue: number;
  currency: SupportedCurrency;
  startDate: Date;
  endDate: Date;
  recognitionMethod: RecognitionMethod;
  milestones?: Milestone[];
  progressTracking?: ProgressTracking;
  /** MFRS 15: distinct performance obligations with allocation */
  performanceObligations?: PerformanceObligation[];
  /** MFRS 15: variable consideration estimate + constraint */
  variableConsideration?: VariableConsideration;
  /** MFRS 15: significant financing component terms (optional) */
  financing?: FinancingTerms;
  /** Contract modifications (prospective or retrospective) */
  modifications?: ContractModification[];
}

export interface RecognitionSchedule {
  id: string;
  contract: RevenueContract;
  method: RecognitionMethod;
  periods: RecognitionPeriod[];
  totalRecognized: number;
  remainingUnrecognized: number;
  status: ScheduleStatus;
}

export interface RecognitionPeriod {
  period: FiscalPeriod;
  recognizedAmount: number;
  cumulativeAmount: number;
  percentage: number;
  posted: boolean;
  postedDate?: Date;
  journalEntryId?: string;
  /** Optional breakdown by Performance Obligation for auditability */
  breakdown?: Array<{ poId: string; amount: number }>;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  achievedDate?: Date;
  value: number;
  percentage: number;
  status: MilestoneStatus;
  evidence?: MilestoneEvidence;
  /** Map milestone revenue to a specific PO when applicable */
  poId?: string;
}

export interface PercentageComplete {
  project: Project;
  asOfDate: Date;
  percentage: number;
  method: ProgressMethod;
  evidence: ProgressEvidence;
  validated: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  totalValue: number;
  currency: SupportedCurrency;
  progressMethod: ProgressMethod;
}

export interface ProgressTracking {
  method: ProgressMethod;
  milestones: Milestone[];
  progressUpdates: ProgressUpdate[];
  lastUpdateDate: Date;
}

export interface ProgressUpdate {
  id: string;
  date: Date;
  percentage: number;
  method: ProgressMethod;
  evidence: ProgressEvidence;
  validated: boolean;
  validatedBy?: string;
  validatedDate?: Date;
}

export interface MilestoneEvidence {
  type: EvidenceType;
  description: string;
  documentId?: string;
  validated: boolean;
  validatedBy?: string;
  validatedDate?: Date;
}

export interface ProgressEvidence {
  type: EvidenceType;
  description: string;
  documentId?: string;
  validated: boolean;
  validatedBy?: string;
  validatedDate?: Date;
}

export interface StraightLineOptions {
  periods?: number;
  startDate?: Date;
  endDate?: Date;
  includeWeekends?: boolean;
  customPeriods?: FiscalPeriod[];
}

export interface ScheduleUpdates {
  periods?: RecognitionPeriod[];
  status?: ScheduleStatus;
  totalRecognized?: number;
  remainingUnrecognized?: number;
}

export interface RecognizedRevenue {
  contract: RevenueContract;
  asOfDate: Date;
  totalRecognized: number;
  remainingUnrecognized: number;
  percentage: number;
  periods: RecognitionPeriod[];
}

export type RecognitionMethod = 'straight_line' | 'milestone' | 'percentage_complete' | 'delivery' | 'usage';
export type ScheduleStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type MilestoneStatus = 'pending' | 'achieved' | 'overdue' | 'cancelled';
export type ProgressMethod = 'cost' | 'effort' | 'deliverables' | 'time' | 'mixed';
export type EvidenceType = 'document' | 'certification' | 'inspection' | 'approval' | 'delivery';

// =========================
// MFRS 15 – New Types
// =========================
export interface PerformanceObligation {
  id: string;
  description: string;
  standaloneSellingPrice?: number;
  allocatedAmount?: number; // if absent, allocate by SSP ratio
  pattern: 'point_in_time' | 'over_time';
}

export interface VariableConsideration {
  method: 'expected_value' | 'most_likely';
  estimate: number; // positive or negative
  constraintCap?: number; // max includable amount to avoid significant reversal
}

export interface FinancingTerms {
  hasSignificantFinancing: boolean;
  discountRateAnnual?: number; // effective annual rate (e.g., 0.06 for 6%)
  financingDirection?: 'advance_from_customer' | 'deferred_payment_by_customer';
}

export interface ContractModification {
  id: string;
  date: Date;
  type: 'prospective' | 'retrospective';
  deltaValue: number; // positive or negative
}

// ============================================================================
// Recognition Methods
// ============================================================================

/**
 * Create straight-line schedule
 */
export function createStraightLineSchedule(
  contract: RevenueContract,
  options: StraightLineOptions = {}
): RecognitionSchedule {
  if (!contract.startDate || !contract.endDate) {
    throw new Error('Contract start and end dates must be valid');
  }
  
  if (contract.startDate > contract.endDate) {
    throw new Error('Contract start date must be before end date');
  }
  
  const periods = options.customPeriods || generateStraightLinePeriods(contract, options);
  const recognitionPeriods: RecognitionPeriod[] = [];
  
  const consideration = getConstrainedConsideration(contract);
  let cumulativeAmount = 0;
  const rawPeriodAmount = consideration / periods.length;
  let runningSum = 0;
  
  for (let i = 0; i < periods.length; i++) {
    const period = periods[i]!;
    // Round each period, plug residual on the final period to eliminate drift.
    const isLast = i === periods.length - 1;
    const recognizedAmount = isLast
      ? roundToCurrency(consideration - runningSum, contract.currency)
      : roundToCurrency(rawPeriodAmount, contract.currency);
    runningSum += recognizedAmount;
    cumulativeAmount += recognizedAmount;

    // Optional PO breakdown: allocate period amount across POs (by allocatedAmount or SSP ratio)
    let breakdown: Array<{ poId: string; amount: number }> | undefined;
    if (contract.performanceObligations && contract.performanceObligations.length > 0) {
      const allocations = computePOAllocations(contract, consideration);
      // Evenly spread each PO allocation across all periods with per-PO rounding + final residual plug
      breakdown = allocatePeriodAcrossPOs(allocations, contract.currency, periods.length, i);
      // Reconcile minor rounding differences by plugging to this period if needed
      const sumPO = breakdown.reduce((s, b) => s + b.amount, 0);
      const drift = roundToCurrency(recognizedAmount - sumPO, contract.currency);
      if (Math.abs(drift) > 0) {
        breakdown[breakdown.length - 1]!.amount = roundToCurrency(breakdown[breakdown.length - 1]!.amount + drift, contract.currency);
      }
    }
    
    recognitionPeriods.push({
      period,
      recognizedAmount,
      cumulativeAmount,
      percentage: ((i + 1) / periods.length) * 100,
      posted: false,
      ...(breakdown && { breakdown }),
    });
  }
  
  return {
    id: `SCH-${contract.id}-${Date.now()}`,
    contract,
    method: 'straight_line',
    periods: recognitionPeriods,
    totalRecognized: cumulativeAmount,
    remainingUnrecognized: consideration - cumulativeAmount,
    status: 'draft',
  };
}

/**
 * Create milestone schedule
 */
export function createMilestoneSchedule(
  contract: RevenueContract,
  milestones: Milestone[]
): RecognitionSchedule {
  if (!milestones || milestones.length === 0) {
    throw new Error('Milestones are required for milestone-based recognition');
  }
  
  // Validate milestones
  for (const milestone of milestones) {
    const validation = validateMilestone(milestone);
    if (!validation.isValid) {
      throw new Error('Invalid milestone provided');
    }
  }
  
  const consideration = getConstrainedConsideration(contract);
  const recognitionPeriods: RecognitionPeriod[] = [];
  let cumulativeAmount = 0;
  
  for (const milestone of milestones) {
    // Enforce evidence if milestone is marked achieved
    if (milestone.status === 'achieved') {
      if (!milestone.evidence || !milestone.evidence.validated) {
        throw new Error(`Milestone "${milestone.name}" cannot be recognized without validated evidence`);
      }
    }
    const recognizedAmount = roundToCurrency(milestone.value, contract.currency);
    cumulativeAmount += recognizedAmount;
    
    const period: FiscalPeriod = {
      id: `P-${milestone.id}`,
      name: milestone.name,
      startDate: milestone.targetDate,
      endDate: milestone.targetDate,
      status: { status: 'open' },
      period: 1,
      backdateWindow: 0,
      year: milestone.targetDate.getFullYear(),
    };
    
    recognitionPeriods.push({
      period,
      recognizedAmount,
      cumulativeAmount,
      percentage: (cumulativeAmount / consideration) * 100,
      posted: false,
      ...(milestone.poId && { breakdown: [{ poId: milestone.poId, amount: recognizedAmount }] }),
    });
  }
  
  return {
    id: `SCH-${contract.id}-${Date.now()}`,
    contract,
    method: 'milestone',
    periods: recognitionPeriods,
    totalRecognized: cumulativeAmount,
    remainingUnrecognized: consideration - cumulativeAmount,
    status: 'draft',
  };
}

/**
 * Create percentage complete schedule
 */
export function createPercentageCompleteSchedule(
  contract: RevenueContract,
  progress: ProgressTracking
): RecognitionSchedule {
  if (!progress || !progress.progressUpdates || progress.progressUpdates.length === 0) {
    throw new Error('Progress tracking with updates is required');
  }
  
  const consideration = getConstrainedConsideration(contract);
  const recognitionPeriods: RecognitionPeriod[] = [];
  let cumulativeAmount = 0;
  // Treat updates as cumulative snapshots; recognize only the delta since the last snapshot.
  const updates = [...progress.progressUpdates].sort((a, b) => a.date.getTime() - b.date.getTime());
  let prevPct = 0;

  updates.forEach((update, idx) => {
    const deltaPct = Math.max(0, Math.min(100, update.percentage) - prevPct);
    prevPct = Math.max(prevPct, Math.min(100, update.percentage));
    // For the last update, plug rounding residual if any.
    const isLast = idx === updates.length - 1;
    const nominal = (consideration * deltaPct) / 100;
    const recognizedAmount = isLast
      ? roundToCurrency(consideration * (prevPct / 100) - cumulativeAmount, contract.currency)
      : roundToCurrency(nominal, contract.currency);
    cumulativeAmount += recognizedAmount;
    
    const period: FiscalPeriod = {
      id: `P-${update.id}`,
      name: `Progress Update ${update.date.toISOString()}`,
      startDate: update.date,
      endDate: update.date,
      status: { status: 'open' },
      period: 1,
      backdateWindow: 0,
      year: update.date.getFullYear(),
    };
    
    recognitionPeriods.push({
      period,
      recognizedAmount,
      cumulativeAmount,
      percentage: prevPct,
      posted: false,
    });
  });
  
  return {
    id: `SCH-${contract.id}-${Date.now()}`,
    contract,
    method: 'percentage_complete',
    periods: recognitionPeriods,
    totalRecognized: cumulativeAmount,
    remainingUnrecognized: consideration - cumulativeAmount,
    status: 'draft',
  };
}

// ============================================================================
// Schedule Management
// ============================================================================

/**
 * Update recognition schedule
 */
export function updateRecognitionSchedule(
  schedule: RecognitionSchedule,
  updates: ScheduleUpdates
): RecognitionSchedule {
  const updatedSchedule = { ...schedule };
  
  if (updates.periods) {
    updatedSchedule.periods = updates.periods;
  }
  
  if (updates.status) {
    updatedSchedule.status = updates.status;
  }
  
  if (updates.totalRecognized !== undefined) {
    updatedSchedule.totalRecognized = updates.totalRecognized;
  }
  
  if (updates.remainingUnrecognized !== undefined) {
    updatedSchedule.remainingUnrecognized = updates.remainingUnrecognized;
  }
  
  // Recalculate totals if periods were updated
  if (updates.periods) {
    const totalRecognized = updates.periods.reduce((sum, period) => sum + period.recognizedAmount, 0);
    updatedSchedule.totalRecognized = totalRecognized;
    updatedSchedule.remainingUnrecognized = schedule.contract.totalValue - totalRecognized;
  }
  
  return updatedSchedule;
}

/**
 * Validate recognition schedule
 */
export function validateRecognitionSchedule(schedule: RecognitionSchedule): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!schedule.id) {
    issues.push({
      code: 'REQUIRED',
      path: 'schedule.id',
      message: 'Schedule ID is required',
      severity: 'error'
    });
  }
  
  if (!schedule.contract) {
    issues.push({
      code: 'REQUIRED',
      message: 'Contract is required',
      path: 'schedule.contract',
      severity: 'error'
    });
  }
  
  if (!schedule.method) {
    issues.push({
      code: 'REQUIRED',
      message: 'Recognition method is required',
      path: 'schedule.method',
      severity: 'error'
    });
  }
  
  if (!schedule.periods || schedule.periods.length === 0) {
    issues.push({
      code: 'REQUIRED',
      message: 'Recognition periods are required',
      path: 'schedule.periods',
      severity: 'error'
    });
  }
  
  // Validate totals against constrained consideration
  const constrained = getConstrainedConsideration(schedule.contract);
  const totalRecognized = schedule.periods.reduce((sum, p) => sum + p.recognizedAmount, 0);
  const tolerance = 0.01;
  if (totalRecognized - constrained > tolerance) {
    issues.push({
      code: 'BALANCE',
      message: `Total recognized (${totalRecognized}) exceeds constrained consideration (${constrained})`,
      path: 'schedule.totalRecognized',
      severity: 'error'
    });
  } else if (schedule.method !== 'straight_line' && schedule.status !== 'completed' && constrained - totalRecognized > tolerance) {
    issues.push({
      code: 'CONSISTENCY',
      message: `Schedule recognizes ${totalRecognized} of ${constrained}. Remaining will be recognized later.`,
      path: 'schedule.totalRecognized',
      severity: 'warning'
    });
  }
  // PO caps: ensure breakdown never exceeds allocated per PO
  if (schedule.contract.performanceObligations?.length && schedule.periods.some(p => p.breakdown?.length)) {
    const allocations = computePOAllocations(schedule.contract, constrained);
    const totalsByPO: Record<string, number> = {};
    for (const p of schedule.periods) {
      for (const b of p.breakdown ?? []) {
        totalsByPO[b.poId] = (totalsByPO[b.poId] ?? 0) + b.amount;
      }
    }
    for (const a of allocations) {
      if ((totalsByPO[a.poId] ?? 0) - a.allocatedAmount > tolerance) {
        issues.push({
          code: 'BALANCE',
          message: `PO ${a.poId} recognized ${totalsByPO[a.poId] ?? 0} > allocated ${a.allocatedAmount}`,
          path: `schedule.poBreakdown.${a.poId}`,
          severity: 'error'
        });
      }
    }
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(issue => issue.severity === 'error').map(issue => issue.message),
    warnings: issues.filter(issue => issue.severity === 'warning').map(issue => issue.message),
    issues,
  };
}

/**
 * Calculate recognized revenue
 */
export function calculateRecognizedRevenue(
  schedule: RecognitionSchedule,
  asOfDate: Date
): RecognizedRevenue {
  // Include periods earned up to asOfDate (endDate <= asOfDate).
  const relevantPeriods = schedule.periods.filter(p => p.period.endDate <= asOfDate);
  const totalRecognized = relevantPeriods.reduce((sum, p) => sum + p.recognizedAmount, 0);
  const constrained = getConstrainedConsideration(schedule.contract);
  const remainingUnrecognized = constrained - totalRecognized;
  const percentage = (totalRecognized / constrained) * 100;
  
  return {
    contract: schedule.contract,
    asOfDate,
    totalRecognized,
    remainingUnrecognized,
    percentage,
    periods: relevantPeriods,
  };
}

// ============================================================================
// Milestone Operations
// ============================================================================

/**
 * Validate milestone achievement
 */
export function validateMilestoneAchievement(
  milestone: Milestone,
  evidence: MilestoneEvidence
): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!milestone.id) {
    issues.push({
      code: 'REQUIRED',
      message: 'Milestone ID is required',
      path: 'milestone.id',
      severity: 'error'
    });
  }
  
  if (!evidence.type) {
    issues.push({
      code: 'REQUIRED',
      message: 'Evidence type is required',
      path: 'evidence.type',
      severity: 'error'
    });
  }
  
  if (!evidence.description) {
    issues.push({
      code: 'REQUIRED',
      message: 'Evidence description is required',
      path: 'evidence.description',
      severity: 'error'
    });
  }
  
  if (!evidence.validated) {
    issues.push({
      code: 'CONSISTENCY',
      message: 'Evidence must be validated',
      path: 'evidence.validated',
      severity: 'error'
    });
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(issue => issue.severity === 'error').map(issue => issue.message),
    warnings: issues.filter(issue => issue.severity === 'warning').map(issue => issue.message),
    issues,
  };
}

/**
 * Update milestone progress
 */
export function updateMilestoneProgress(milestone: Milestone, progress: number): Milestone {
  if (progress < 0 || progress > 100) {
    throw new Error('Progress percentage must be between 0 and 100');
  }
  
  const updatedMilestone = { ...milestone };
  updatedMilestone.percentage = progress;
  
  if (progress >= 100) {
    updatedMilestone.status = 'achieved';
    updatedMilestone.achievedDate = new Date();
  } else if (progress > 0) {
    updatedMilestone.status = 'pending';
  }
  
  return updatedMilestone;
}

/**
 * Calculate milestone revenue
 */
export function calculateMilestoneRevenue(
  milestone: Milestone,
  totalContractValue: number,
  currency?: SupportedCurrency
): number {
  return roundToCurrency((totalContractValue * milestone.percentage) / 100, currency ?? 'USD');
}

// ============================================================================
// Percentage Complete
// ============================================================================

/**
 * Calculate percentage complete
 */
export function calculatePercentageComplete(
  project: Project,
  asOfDate: Date
): PercentageComplete {
  if (!project.startDate || !project.endDate) {
    throw new Error('Project start and end dates must be valid');
  }
  
  if (asOfDate > project.endDate) {
    return {
      project,
      asOfDate,
      percentage: 100,
      method: project.progressMethod,
      evidence: {
        type: 'document',
        description: 'Project completed',
        validated: true,
        validatedBy: 'system',
        validatedDate: new Date(),
      },
      validated: true,
    };
  }
  
  if (asOfDate < project.startDate) {
    return {
      project,
      asOfDate,
      percentage: 0,
      method: project.progressMethod,
      evidence: {
        type: 'document',
        description: 'Project not started',
        validated: true,
        validatedBy: 'system',
        validatedDate: new Date(),
      },
      validated: true,
    };
  }
  
  // Calculate percentage based on time elapsed
  const totalDuration = project.endDate.getTime() - project.startDate.getTime();
  const elapsedDuration = asOfDate.getTime() - project.startDate.getTime();
  const percentage = Math.min((elapsedDuration / totalDuration) * 100, 100);
  
  return {
    project,
    asOfDate,
    // Keep percentage as a numeric percentage (rounded to 2 dp), not a currency.
    percentage: Math.round(percentage * 100) / 100,
    method: project.progressMethod,
    evidence: {
      type: 'document',
      description: 'Time-based calculation',
      validated: true,
      validatedBy: 'system',
      validatedDate: new Date(),
    },
    validated: true,
  };
}

/**
 * Update project progress
 */
export function updateProjectProgress(
  project: Project,
  progress: ProgressUpdate
): Project {
  const validation = validateProgressUpdate(progress, project);
  if (!validation.isValid) {
    throw new Error('Invalid progress update provided');
  }
  
  return project; // In a real implementation, this would update the project
}

/**
 * Validate progress update
 */
export function validateProgressUpdate(
  update: ProgressUpdate,
  _project: Project
): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!update.id) {
    issues.push({
      code: 'REQUIRED',
      message: 'Update ID is required',
      path: 'update.id',
      severity: 'error'
    });
  }
  
  if (!update.date) {
    issues.push({
      code: 'FORMAT',
      path: 'update.date',
      message: 'Update date must be valid',
      severity: 'error'
    });
  }
  
  if (update.percentage < 0 || update.percentage > 100) {
    issues.push({
      code: 'RANGE',
      message: 'Percentage must be between 0 and 100',
      path: 'update.percentage',
      severity: 'error'
    });
  }
  
  if (!update.method) {
    issues.push({
      code: 'REQUIRED',
      message: 'Progress method is required',
      path: 'update.method',
      severity: 'error'
    });
  }
  
  if (!update.evidence) {
    issues.push({
      code: 'REQUIRED',
      message: 'Evidence is required',
      path: 'update.evidence',
      severity: 'error'
    });
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(issue => issue.severity === 'error').map(issue => issue.message),
    warnings: issues.filter(issue => issue.severity === 'warning').map(issue => issue.message),
    issues,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate straight-line periods
 */
function generateStraightLinePeriods(
  contract: RevenueContract,
  options: StraightLineOptions
): FiscalPeriod[] {
  const periods: FiscalPeriod[] = [];
  const startDate = options.startDate || contract.startDate;
  const endDate = options.endDate || contract.endDate;
  // If periods not provided, infer monthly buckets between start/end (fallback 12).
  const inferredMonths = Math.max(
    1,
    ((endDate.getFullYear() - startDate.getFullYear()) * 12) + (endDate.getMonth() - startDate.getMonth()) + 1
  );
  const numberOfPeriods = options.periods || inferredMonths || 12; // Default to 12 periods
  
  const duration = endDate.getTime() - startDate.getTime();
  const periodDuration = duration / numberOfPeriods;
  
  for (let i = 0; i < numberOfPeriods; i++) {
    const periodStart = new Date(startDate.getTime() + (i * periodDuration));
    const periodEnd = new Date(startDate.getTime() + ((i + 1) * periodDuration));
    
    periods.push({
      id: `P-${i + 1}`,
      name: `Period ${i + 1}`,
      startDate: periodStart,
      endDate: periodEnd,
      status: { status: 'open' },
      period: i + 1,
      backdateWindow: 0,
      year: periodStart.getFullYear(),
    });
  }
  
  return periods;
}

// =========================
// MFRS 15 – Helpers
// =========================
function getConstrainedConsideration(contract: RevenueContract): number {
  const base = contract.totalValue;
  const vc = contract.variableConsideration;
  if (!vc) return base;
  const est = vc.estimate;
  if (vc.constraintCap === undefined) return base + est;
  const constrained = Math.sign(est) >= 0 ? Math.min(est, vc.constraintCap) : Math.max(est, -vc.constraintCap);
  return base + constrained;
}

function computePOAllocations(contract: RevenueContract, consideration: number): Array<{ poId: string; allocatedAmount: number }> {
  const pos = contract.performanceObligations ?? [];
  if (pos.length === 0) return [];
  const hasExplicit = pos.every(p => typeof p.allocatedAmount === 'number');
  if (hasExplicit) {
    const total = pos.reduce((s, p) => s + (p.allocatedAmount ?? 0), 0);
    // If explicit sums differ from consideration, scale proportionally
    return pos.map(p => ({
      poId: p.id,
      allocatedAmount: (p.allocatedAmount ?? 0) * (total ? (consideration / total) : 0),
    }));
  }
  // Allocate by SSP ratio
  const sspTotal = pos.reduce((s, p) => s + (p.standaloneSellingPrice ?? 0), 0);
  return pos.map(p => ({
    poId: p.id,
    allocatedAmount: sspTotal ? consideration * ((p.standaloneSellingPrice ?? 0) / sspTotal) : 0,
  }));
}

// Spread each PO allocation evenly across N periods with per-PO rounding and final residual plug.
function allocatePeriodAcrossPOs(
  allocations: Array<{ poId: string; allocatedAmount: number }>,
  currency: SupportedCurrency,
  totalPeriods: number,
  periodIndex: number
): Array<{ poId: string; amount: number }> {
  return allocations.map((a) => {
    const isFinalPeriod = periodIndex === totalPeriods - 1;
    const nominal = a.allocatedAmount / totalPeriods;
    if (!isFinalPeriod) {
      return { poId: a.poId, amount: roundToCurrency(nominal, currency) };
    }
    // On final period, plug residual for this PO
    const prior = roundToCurrency(a.allocatedAmount - (roundToCurrency(nominal, currency) * (totalPeriods - 1)), currency);
    return { poId: a.poId, amount: prior };
  });
}

/** Compute interest accretion for SFC up to asOfDate (finance income/expense; not added to revenue) */
export function computeFinancingAccretion(contract: RevenueContract, asOfDate: Date, openingLiability: number): number {
  const f = contract.financing;
  if (!f?.hasSignificantFinancing || !f.discountRateAnnual) return 0;
  const days = Math.max(0, Math.floor((asOfDate.getTime() - contract.startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const dailyRate = f.discountRateAnnual / 365;
  return openingLiability * dailyRate * days;
}

/** Apply a prospective contract modification to a schedule: reallocate remaining consideration over remaining periods */
export function applyProspectiveModification(schedule: RecognitionSchedule, modification: ContractModification): RecognitionSchedule {
  if (modification.type !== 'prospective') return schedule;
  const updated = { ...schedule, periods: [...schedule.periods] };
  const remainingIdx = updated.periods.findIndex(p => p.period.startDate >= modification.date);
  if (remainingIdx < 0) return schedule;
  const constrained = getConstrainedConsideration(schedule.contract) + modification.deltaValue;
  const recognizedToDate = updated.periods.slice(0, remainingIdx).reduce((s, p) => s + p.recognizedAmount, 0);
  const remaining = constrained - recognizedToDate;
  const remainingPeriods = updated.periods.length - remainingIdx;
  let run = 0;
  for (let i = remainingIdx; i < updated.periods.length; i++) {
    const isLast = i === updated.periods.length - 1;
    const nominal = remaining / remainingPeriods;
    const amt = isLast
      ? roundToCurrency(remaining - run, schedule.contract.currency)
      : roundToCurrency(nominal, schedule.contract.currency);
    run += amt;
    const prevCum = i > 0 ? updated.periods[i - 1]!.cumulativeAmount : 0;
    updated.periods[i] = {
      ...updated.periods[i]!,
      recognizedAmount: amt,
      cumulativeAmount: prevCum + amt,
      percentage: ((i + 1) / updated.periods.length) * 100,
    };
  }
  updated.totalRecognized = updated.periods.reduce((s, p) => s + p.recognizedAmount, 0);
  updated.remainingUnrecognized = constrained - updated.totalRecognized;
  return updated;
}

/**
 * Validate milestone
 */
function validateMilestone(milestone: Milestone): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!milestone.id) {
    issues.push({
      code: 'REQUIRED',
      message: 'Milestone ID is required',
      path: 'milestone.id',
      severity: 'error'
    });
  }
  
  if (!milestone.name) {
    issues.push({
      code: 'REQUIRED',
      message: 'Milestone name is required',
      path: 'milestone.name',
      severity: 'error'
    });
  }
  
  if (!milestone.targetDate) {
    issues.push({
      code: 'FORMAT',
      message: 'Target date must be valid',
      path: 'milestone.targetDate',
      severity: 'error'
    });
  }
  
  if (milestone.value < 0) {
    issues.push({
      code: 'RANGE',
      message: 'Milestone value cannot be negative',
      path: 'milestone.value',
      severity: 'error'
    });
  }
  
  if (milestone.percentage < 0 || milestone.percentage > 100) {
    issues.push({
      code: 'RANGE',
      message: 'Milestone percentage must be between 0 and 100',
      path: 'milestone.percentage',
      severity: 'error'
    });
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(issue => issue.severity === 'error').map(issue => issue.message),
    warnings: issues.filter(issue => issue.severity === 'warning').map(issue => issue.message),
    issues,
  };
}

/**
 * Get revenue recognition summary
 */
export function getRevenueRecognitionSummary(
  schedules: RecognitionSchedule[]
): {
  totalSchedules: number;
  totalContractValue: number;
  totalRecognized: number;
  totalRemaining: number;
  averageRecognitionPercentage: number;
  methodBreakdown: Record<RecognitionMethod, number>;
} {
  const totalSchedules = schedules.length;
  const totalContractValue = schedules.reduce((sum, schedule) => sum + schedule.contract.totalValue, 0);
  const totalRecognized = schedules.reduce((sum, schedule) => sum + schedule.totalRecognized, 0);
  const totalRemaining = schedules.reduce((sum, schedule) => sum + schedule.remainingUnrecognized, 0);
  
  const averageRecognitionPercentage = totalContractValue > 0 
    ? (totalRecognized / totalContractValue) * 100 
    : 0;
  
  const methodBreakdown: Record<RecognitionMethod, number> = {
    straight_line: 0,
    milestone: 0,
    percentage_complete: 0,
    delivery: 0,
    usage: 0,
  };
  
  for (const schedule of schedules) {
    methodBreakdown[schedule.method]++;
  }
  
  return {
    totalSchedules,
    totalContractValue,
    totalRecognized,
    totalRemaining,
    averageRecognitionPercentage,
    methodBreakdown,
  };
}

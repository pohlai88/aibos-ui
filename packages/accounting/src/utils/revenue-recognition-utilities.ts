/**
 * Revenue Recognition Utilities
 * 
 * Revenue recognition with straight-line, milestone, and percentage complete schedules.
 * Provides comprehensive revenue recognition management and schedule generation.
 * 
 * @fileoverview Revenue recognition methods, schedule management, and milestone operations
 */

import {
  SupportedCurrency,
  roundToCurrency,
} from './accounting-utilities';
import { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import { FiscalPeriod } from './fiscal-period-utilities';

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
  
  let cumulativeAmount = 0;
  const periodAmount = contract.totalValue / periods.length;
  
  for (let i = 0; i < periods.length; i++) {
    const period = periods[i]!;
    const recognizedAmount = roundToCurrency(periodAmount, contract.currency);
    cumulativeAmount += recognizedAmount;
    
    recognitionPeriods.push({
      period,
      recognizedAmount,
      cumulativeAmount,
      percentage: ((i + 1) / periods.length) * 100,
      posted: false,
    });
  }
  
  return {
    id: `SCH-${contract.id}-${Date.now()}`,
    contract,
    method: 'straight_line',
    periods: recognitionPeriods,
    totalRecognized: cumulativeAmount,
    remainingUnrecognized: contract.totalValue - cumulativeAmount,
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
  
  const recognitionPeriods: RecognitionPeriod[] = [];
  let cumulativeAmount = 0;
  
  for (const milestone of milestones) {
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
      percentage: (cumulativeAmount / contract.totalValue) * 100,
      posted: false,
    });
  }
  
  return {
    id: `SCH-${contract.id}-${Date.now()}`,
    contract,
    method: 'milestone',
    periods: recognitionPeriods,
    totalRecognized: cumulativeAmount,
    remainingUnrecognized: contract.totalValue - cumulativeAmount,
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
  
  const recognitionPeriods: RecognitionPeriod[] = [];
  let cumulativeAmount = 0;
  
  for (const update of progress.progressUpdates) {
    const recognizedAmount = roundToCurrency(
      (contract.totalValue * update.percentage) / 100,
      contract.currency
    );
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
      percentage: update.percentage,
      posted: false,
    });
  }
  
  return {
    id: `SCH-${contract.id}-${Date.now()}`,
    contract,
    method: 'percentage_complete',
    periods: recognitionPeriods,
    totalRecognized: cumulativeAmount,
    remainingUnrecognized: contract.totalValue - cumulativeAmount,
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
  
  // Validate contract total
  const totalRecognized = schedule.periods.reduce((sum, period) => sum + period.recognizedAmount, 0);
  const tolerance = 0.01;
  if (Math.abs(totalRecognized - schedule.contract.totalValue) > tolerance) {
    issues.push({
      code: 'BALANCE',
      message: `Total recognized amount (${totalRecognized}) does not match contract value (${schedule.contract.totalValue})`,
      path: 'schedule.totalRecognized',
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
 * Calculate recognized revenue
 */
export function calculateRecognizedRevenue(
  schedule: RecognitionSchedule,
  asOfDate: Date
): RecognizedRevenue {
  const relevantPeriods = schedule.periods.filter(period => 
    period.period.endDate > asOfDate
  );
  
  const totalRecognized = relevantPeriods.reduce((sum, period) => sum + period.recognizedAmount, 0);
  const remainingUnrecognized = schedule.contract.totalValue - totalRecognized;
  const percentage = (totalRecognized / schedule.contract.totalValue) * 100;
  
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
  totalContractValue: number
): number {
  return roundToCurrency((totalContractValue * milestone.percentage) / 100, 'USD');
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
    percentage: roundToCurrency(percentage, 'USD'),
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
  const numberOfPeriods = options.periods || 12; // Default to 12 periods
  
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

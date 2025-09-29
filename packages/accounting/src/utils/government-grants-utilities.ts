/**
 * Government Grants Utilities - Enterprise Production Ready
 * 
 * Comprehensive government grants utilities per MFRS 120 Accounting for
 * Government Grants and Disclosure of Government Assistance with recognition
 * methods, amortization schedules, and compliance tracking.
 * 
 * Features:
 * - Government grant recognition (income vs deferred)
 * - Amortization schedule calculations
 * - Grant conditions monitoring
 * - Repayment handling
 * - Integration with existing accounting utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   recognizeGovernmentGrant,
 *   calculateAmortization,
 *   monitorGrantConditions,
 *   processGrantRepayment
 * } from './government-grants-utilities';
 * 
 * // Recognize government grant
 * const grant = recognizeGovernmentGrant(grantDetails, recognitionMethod);
 * 
 * // Calculate amortization
 * const amortization = calculateAmortization(grant, amortizationPeriod);
 * ```
 */

import type { 
  SupportedCurrency
} from './accounting-utilities';
import type { 
  JournalEntry,
  JournalLine
} from './journal-entry-utilities';
import { 
  roundToCurrency
} from './accounting-utilities';
import {
  addMonthsFns
} from './date-utilities';
import { z } from 'zod';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Government grant details
 */
export interface GovernmentGrant {
  readonly grantId: string;
  readonly grantType: GrantType;
  readonly grantName: string;
  readonly grantingAuthority: string;
  readonly grantAmount: number;
  readonly currency: SupportedCurrency;
  readonly grantDate: Date;
  readonly recognitionMethod: RecognitionMethod;
  readonly grantConditions: readonly GrantCondition[];
  readonly status: GrantStatus;
  readonly amortizationSchedule: readonly GrantAmortization[];
}

/**
 * Grant condition
 */
export interface GrantCondition {
  readonly conditionId: string;
  readonly grantId: string;
  readonly conditionType: ConditionType;
  readonly description: string;
  readonly complianceRequired: boolean;
  readonly complianceDeadline: Date;
  readonly complianceStatus: ComplianceStatus;
  readonly monitoringFrequency: MonitoringFrequency;
  readonly penaltyAmount?: number;
}

/**
 * Grant amortization entry
 */
export interface GrantAmortization {
  readonly amortizationId: string;
  readonly grantId: string;
  readonly amortizationDate: Date;
  readonly openingBalance: number;
  readonly amortizationAmount: number;
  readonly closingBalance: number;
  readonly currency: SupportedCurrency;
  readonly journalEntry: JournalEntry;
}

/**
 * Grant repayment
 */
export interface GrantRepayment {
  readonly repaymentId: string;
  readonly grantId: string;
  readonly repaymentDate: Date;
  readonly repaymentAmount: number;
  readonly repaymentReason: RepaymentReason;
  readonly currency: SupportedCurrency;
  readonly journalEntry: JournalEntry;
}

/**
 * Grant monitoring report
 */
export interface GrantMonitoringReport {
  readonly reportId: string;
  readonly grantId: string;
  readonly reportDate: Date;
  readonly complianceStatus: ComplianceStatus;
  readonly conditionsMet: number;
  readonly conditionsTotal: number;
  readonly compliancePercentage: number;
  readonly issues: readonly GrantIssue[];
  readonly recommendations: readonly string[];
}

/**
 * Grant issue
 */
export interface GrantIssue {
  readonly issueId: string;
  readonly grantId: string;
  readonly issueType: IssueType;
  readonly description: string;
  readonly severity: IssueSeverity;
  readonly resolutionRequired: boolean;
  readonly resolutionDeadline: Date;
  readonly status: IssueStatus;
}

/**
 * Grant types
 */
export type GrantType = 
  | 'capital_grant'
  | 'revenue_grant'
  | 'research_grant'
  | 'training_grant'
  | 'export_grant'
  | 'investment_grant'
  | 'environmental_grant'
  | 'social_grant';

/**
 * Recognition methods
 */
export type RecognitionMethod = 
  | 'income_method'
  | 'deferred_method'
  | 'asset_method';

/**
 * Condition types
 */
export type ConditionType = 
  | 'performance_condition'
  | 'time_condition'
  | 'usage_condition'
  | 'reporting_condition'
  | 'compliance_condition'
  | 'milestone_condition';

/**
 * Grant status
 */
export type GrantStatus = 
  | 'received'
  | 'recognized'
  | 'amortizing'
  | 'completed'
  | 'suspended'
  | 'terminated'
  | 'repaid';

/**
 * Compliance status
 */
export type ComplianceStatus = 
  | 'compliant'
  | 'non_compliant'
  | 'pending_review'
  | 'under_investigation'
  | 'resolved';

/**
 * Monitoring frequency
 */
export type MonitoringFrequency = 
  | 'monthly'
  | 'quarterly'
  | 'semi_annually'
  | 'annually'
  | 'as_required';

/**
 * Repayment reasons
 */
export type RepaymentReason = 
  | 'condition_breach'
  | 'grant_misuse'
  | 'non_compliance'
  | 'early_termination'
  | 'voluntary_repayment'
  | 'audit_finding';

/**
 * Issue types
 */
export type IssueType = 
  | 'compliance_issue'
  | 'reporting_issue'
  | 'performance_issue'
  | 'documentation_issue'
  | 'timing_issue'
  | 'calculation_issue';

/**
 * Issue severity
 */
export type IssueSeverity = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

/**
 * Issue status
 */
export type IssueStatus = 
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'escalated';

// ============================================================================
// GRANT RECOGNITION
// ============================================================================

/**
 * Recognize government grant
 * 
 * @param grantDetails - Grant details
 * @param recognitionMethod - Recognition method
 * @param grantConditions - Grant conditions
 * @returns Government grant
 * 
 * @example
 * ```typescript
 * const grant = recognizeGovernmentGrant(grantDetails, 'deferred_method', conditions);
 * ```
 */
export function recognizeGovernmentGrant(
  grantDetails: {
    grantType: GrantType;
    grantName: string;
    grantingAuthority: string;
    grantAmount: number;
    currency: SupportedCurrency;
    grantDate: Date;
  },
  recognitionMethod: RecognitionMethod,
  grantConditions: readonly GrantCondition[]
): GovernmentGrant {
  // Generate stable grantId up front for traceability (swap to ULID later if available)
  const grantId = generateId('grant');
  // Generate amortization schedule based on recognition method
  const amortizationSchedule = generateAmortizationSchedule(
    grantDetails.grantAmount,
    grantDetails.currency,
    grantDetails.grantDate,
    recognitionMethod,
    12,
    grantId
  );

  return {
    grantId,
    grantType: grantDetails.grantType,
    grantName: grantDetails.grantName,
    grantingAuthority: grantDetails.grantingAuthority,
    grantAmount: roundToCurrency(grantDetails.grantAmount, grantDetails.currency),
    currency: grantDetails.currency,
    grantDate: grantDetails.grantDate,
    recognitionMethod,
    grantConditions,
    status: 'received',
    amortizationSchedule
  };
}

/**
 * Calculate grant amortization
 * 
 * @param grant - Government grant
 * @param amortizationPeriod - Amortization period in months
 * @returns Updated grant with amortization schedule
 * 
 * @example
 * ```typescript
 * const amortizedGrant = calculateAmortization(grant, 24);
 * ```
 */
export function calculateAmortization(
  grant: GovernmentGrant,
  amortizationPeriod: number
): GovernmentGrant {
  // Generate new amortization schedule
  const amortizationSchedule = generateAmortizationSchedule(
    grant.grantAmount,
    grant.currency,
    grant.grantDate,
    grant.recognitionMethod,
    amortizationPeriod,
    grant.grantId
  );

  return {
    ...grant,
    amortizationSchedule,
    status: 'amortizing'
  };
}

// ============================================================================
// GRANT CONDITIONS MONITORING
// ============================================================================

/**
 * Monitor grant conditions
 * 
 * @param grant - Government grant
 * @param monitoringDate - Monitoring date
 * @returns Grant monitoring report
 * 
 * @example
 * ```typescript
 * const report = monitorGrantConditions(grant, new Date());
 * ```
 */
export function monitorGrantConditions(
  grant: GovernmentGrant,
  monitoringDate: Date
): GrantMonitoringReport {
  const conditionsMet = grant.grantConditions.filter(
    condition => condition.complianceStatus === 'compliant'
  ).length;
  
  const conditionsTotal = grant.grantConditions.length;
  const compliancePercentageRaw = conditionsTotal > 0 
    ? (conditionsMet / conditionsTotal) * 100 
    : 100;
  // Round to 2dp as a pure percentage (not currency)
  const compliancePercentage = roundTo(compliancePercentageRaw, 2);

  // Identify issues
  const issues = identifyGrantIssues(grant, monitoringDate);

  // Generate recommendations
  const recommendations = generateRecommendations(grant, issues);

  return {
    reportId: `monitoring-report-${grant.grantId}-${Date.now()}`,
    grantId: grant.grantId,
    reportDate: monitoringDate,
    complianceStatus: compliancePercentage >= 100 ? 'compliant' : 'non_compliant',
    conditionsMet,
    conditionsTotal,
    compliancePercentage,
    issues,
    recommendations
  };
}

// ============================================================================
// GRANT REPAYMENT
// ============================================================================

/**
 * Process grant repayment
 * 
 * @param grant - Government grant
 * @param repaymentAmount - Repayment amount
 * @param repaymentReason - Reason for repayment
 * @returns Grant repayment
 * 
 * @example
 * ```typescript
 * const repayment = processGrantRepayment(grant, 50000, 'condition_breach');
 * ```
 */
export function processGrantRepayment(
  grant: GovernmentGrant,
  repaymentAmount: number,
  repaymentReason: RepaymentReason
): GrantRepayment {
  // Generate journal entry for repayment
  const journalEntry = generateRepaymentJournalEntry(
    grant,
    repaymentAmount,
    repaymentReason
  );

  return {
    repaymentId: `repayment-${grant.grantId}-${Date.now()}`,
    grantId: grant.grantId,
    repaymentDate: new Date(),
    repaymentAmount: roundToCurrency(repaymentAmount, grant.currency),
    repaymentReason,
    currency: grant.currency,
    journalEntry
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate amortization schedule
 * 
 * @param grantAmount - Grant amount
 * @param currency - Currency
 * @param grantDate - Grant date
 * @param recognitionMethod - Recognition method
 * @param amortizationPeriod - Amortization period in months
 * @returns Amortization schedule
 */
function generateAmortizationSchedule(
  grantAmount: number,
  currency: SupportedCurrency,
  grantDate: Date,
  recognitionMethod: RecognitionMethod,
  amortizationPeriod: number = 12,
  grantId?: string
): readonly GrantAmortization[] {
  const schedule: GrantAmortization[] = [];
  const monthlyAmortization = grantAmount / amortizationPeriod;
  let currentBalance = grantAmount;

  for (let month = 1; month <= amortizationPeriod; month++) {
    const amortizationDate = addMonthsFns(grantDate, month); // precise month stepping
    const amortizationAmount = Math.min(monthlyAmortization, currentBalance);
    const closingBalance = currentBalance - amortizationAmount;

    // Generate journal entry
    const journalEntry = generateAmortizationJournalEntry(
      grantAmount,
      amortizationAmount,
      amortizationDate,
      currency,
      recognitionMethod
    );

    schedule.push({
      amortizationId: `amortization-${month}-${Date.now()}`,
      grantId: grantId ?? 'unknown-grant',
      amortizationDate,
      openingBalance: roundToCurrency(currentBalance, currency),
      amortizationAmount: roundToCurrency(amortizationAmount, currency),
      closingBalance: roundToCurrency(closingBalance, currency),
      currency,
      journalEntry
    });

    currentBalance = closingBalance;
  }

  return schedule;
}

/**
 * Identify grant issues
 * 
 * @param grant - Government grant
 * @param monitoringDate - Monitoring date
 * @returns Grant issues
 */
function identifyGrantIssues(
  grant: GovernmentGrant,
  monitoringDate: Date
): readonly GrantIssue[] {
  const issues: GrantIssue[] = [];

  for (const condition of grant.grantConditions) {
    if (condition.complianceStatus === 'non_compliant') {
      issues.push({
        issueId: `issue-${condition.conditionId}-${Date.now()}`,
        grantId: grant.grantId,
        issueType: 'compliance_issue',
        description: `Non-compliance with condition: ${condition.description}`,
        severity: 'high',
        resolutionRequired: true,
        resolutionDeadline: condition.complianceDeadline,
        status: 'open'
      });
    }

    if (monitoringDate > condition.complianceDeadline && condition.complianceStatus === 'pending_review') {
      issues.push({
        issueId: `issue-timing-${condition.conditionId}-${Date.now()}`,
        grantId: grant.grantId,
        issueType: 'timing_issue',
        description: `Overdue compliance review: ${condition.description}`,
        severity: 'medium',
        resolutionRequired: true,
        resolutionDeadline: condition.complianceDeadline,
        status: 'open'
      });
    }
  }

  return issues;
}

/**
 * Generate recommendations
 * 
 * @param grant - Government grant
 * @param issues - Grant issues
 * @returns Recommendations
 */
function generateRecommendations(
  grant: GovernmentGrant,
  issues: readonly GrantIssue[]
): readonly string[] {
  const recommendations: string[] = [];

  if (issues.length === 0) {
    recommendations.push('Continue current compliance monitoring');
    recommendations.push('Maintain regular reporting schedule');
  } else {
    recommendations.push('Address all non-compliance issues immediately');
    recommendations.push('Implement additional monitoring controls');
    recommendations.push('Review grant conditions and update procedures');
  }

  // Add specific recommendations based on grant type
  switch (grant.grantType) {
    case 'research_grant':
      recommendations.push('Ensure research milestones are being met');
      recommendations.push('Maintain detailed research documentation');
      break;
    case 'training_grant':
      recommendations.push('Track training completion rates');
      recommendations.push('Monitor participant feedback');
      break;
    case 'export_grant':
      recommendations.push('Verify export volume requirements');
      recommendations.push('Monitor market development activities');
      break;
  }

  return recommendations;
}

/**
 * Generate amortization journal entry
 * 
 * @param grantAmount - Grant amount
 * @param amortizationAmount - Amortization amount
 * @param amortizationDate - Amortization date
 * @param currency - Currency
 * @param recognitionMethod - Recognition method
 * @returns Journal entry
 */
function generateAmortizationJournalEntry(
  _grantAmount: number,
  amortizationAmount: number,
  amortizationDate: Date,
  currency: SupportedCurrency,
  recognitionMethod: RecognitionMethod
): JournalEntry {
  // Compliance checks (Fiscal Period + SoD) before constructing entry
  ensureAllowed('post_journal', amortizationDate);
  const lines: JournalLine[] = [];

  switch (recognitionMethod) {
    case 'income_method':
      lines.push({
        id: `amortization-income-${amortizationDate.getTime()}`,
        accountCode: 'GOVERNMENT-GRANT-INCOME',
        description: 'Government grant income recognition',
        debit: 0,
        credit: amortizationAmount,
        currency
      });
      break;
    
    case 'deferred_method':
      lines.push({
        id: `amortization-deferred-${amortizationDate.getTime()}`,
        accountCode: 'DEFERRED-GOVERNMENT-GRANT',
        description: 'Deferred government grant amortization',
        debit: amortizationAmount,
        credit: 0,
        currency
      });
      lines.push({
        id: `amortization-income-${amortizationDate.getTime()}`,
        accountCode: 'GOVERNMENT-GRANT-INCOME',
        description: 'Government grant income recognition',
        debit: 0,
        credit: amortizationAmount,
        currency
      });
      break;
    
    case 'asset_method':
      // Present in P&L over useful life similar to deferred income approach
      lines.push({
        id: `amortization-asset-deferred-${amortizationDate.getTime()}`,
        accountCode: 'DEFERRED-GOVERNMENT-GRANT',
        description: 'Asset-related grant amortization',
        debit: amortizationAmount,
        credit: 0,
        currency
      });
      lines.push({
        id: `amortization-income-${amortizationDate.getTime()}`,
        accountCode: 'GOVERNMENT-GRANT-INCOME',
        description: 'Government grant income recognition',
        debit: 0,
        credit: amortizationAmount,
        currency
      });
      break;
  }

  return {
    id: `amortization-entry-${amortizationDate.getTime()}`,
    date: amortizationDate,
    reference: `GRANT-AMORT-${amortizationDate.getTime()}`,
    description: 'Government grant amortization',
    lines,
    totalDebits: amortizationAmount,
    totalCredits: amortizationAmount,
    currency,
    status: 'draft'
  };
}

/**
 * Generate repayment journal entry
 * 
 * @param grant - Government grant
 * @param repaymentAmount - Repayment amount
 * @param repaymentReason - Repayment reason
 * @returns Journal entry
 */
function generateRepaymentJournalEntry(
  grant: GovernmentGrant,
  repaymentAmount: number,
  repaymentReason: RepaymentReason
): JournalEntry {
  // Compliance checks (Fiscal Period + SoD)
  ensureAllowed('post_journal', new Date(), { grantId: grant.grantId });
  return {
    id: `repayment-entry-${grant.grantId}-${Date.now()}`,
    date: new Date(),
    reference: `GRANT-REPAY-${grant.grantId}`,
    description: `Government grant repayment: ${repaymentReason}`,
    lines: [
      {
        id: `repayment-grant-${grant.grantId}`,
        accountCode: 'GOVERNMENT-GRANT-LIABILITY',
        description: `Grant repayment: ${repaymentReason}`,
        debit: repaymentAmount,
        credit: 0,
        currency: grant.currency
      },
      {
        id: `repayment-cash-${grant.grantId}`,
        accountCode: 'CASH',
        description: `Grant repayment: ${repaymentReason}`,
        debit: 0,
        credit: repaymentAmount,
        currency: grant.currency
      }
    ],
    totalDebits: repaymentAmount,
    totalCredits: repaymentAmount,
    currency: grant.currency,
    status: 'draft'
  };
}

// ============================================================================
// SMALL HELPERS (No external deps; safe to swap for ULID later)
// ============================================================================
function generateId(prefix: string): string {
  const now = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${now}${rand}`;
}

function roundTo(value: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round((value + Number.EPSILON) * f) / f;
}

// ============================================================================
// ZOD SCHEMAS & SAFE WRAPPERS (non-breaking; additive exports)
// ============================================================================
const GrantConditionSchema = z.object({
  conditionId: z.string().min(1),
  grantId: z.string().min(1),
  conditionType: z.enum([
    'performance_condition','time_condition','usage_condition','reporting_condition','compliance_condition','milestone_condition'
  ]),
  description: z.string().min(1),
  complianceRequired: z.boolean(),
  complianceDeadline: z.coerce.date(),
  complianceStatus: z.enum(['compliant','non_compliant','pending_review','under_investigation','resolved']),
  monitoringFrequency: z.enum(['monthly','quarterly','semi_annually','annually','as_required']),
  penaltyAmount: z.number().nonnegative().optional()
}).strict();

const RecognizeGrantInputSchema = z.object({
  grantDetails: z.object({
    grantType: z.enum(['capital_grant','revenue_grant','research_grant','training_grant','export_grant','investment_grant','environmental_grant','social_grant']),
    grantName: z.string().min(1),
    grantingAuthority: z.string().min(1),
    grantAmount: z.number().positive(),
    currency: z.string().min(1) as unknown as z.ZodType<SupportedCurrency>,
    grantDate: z.coerce.date()
  }).strict(),
  recognitionMethod: z.enum(['income_method','deferred_method','asset_method']),
  grantConditions: z.array(GrantConditionSchema).readonly()
}).strict();

const CalculateAmortInputSchema = z.object({
  grant: z.any(), // keep loose; you can tighten with a full GovernmentGrant schema later
  amortizationPeriod: z.number().int().positive()
}).strict();

const MonitorInputSchema = z.object({
  grant: z.any(),
  monitoringDate: z.coerce.date()
}).strict();

/**
 * Wraps a function with Zod validation. On failure, throws a ValidationError-like object.
 */
function withSchema<I extends z.ZodTypeAny, O>(schema: I, fn: (args: z.infer<I>) => O): (args: z.infer<I>) => O {
  return (args: z.infer<I>) => {
    const parsed = schema.parse(args);
    return fn(parsed);
  };
}

// Safe variants (additive, keep original names intact)
export const recognizeGovernmentGrantSafe = withSchema(
  RecognizeGrantInputSchema,
  ({ grantDetails, recognitionMethod, grantConditions }) =>
    recognizeGovernmentGrant(grantDetails, recognitionMethod, grantConditions as readonly GrantCondition[])
);

export const calculateAmortizationSafe = withSchema(
  CalculateAmortInputSchema,
  ({ grant, amortizationPeriod }) => calculateAmortization(grant, amortizationPeriod)
);

export const monitorGrantConditionsSafe = withSchema(
  MonitorInputSchema,
  ({ grant, monitoringDate }) => monitorGrantConditions(grant, monitoringDate)
);

// Export schemas for external validators/tests (optional)
export const Schemas = {
  GrantConditionSchema,
  RecognizeGrantInputSchema,
  CalculateAmortInputSchema,
  MonitorInputSchema
};

// ============================================================================
// NEW: INITIAL RECOGNITION & COMPLIANCE GUARDS (Fiscal Period + SoD)
// ============================================================================
type FiscalPeriodGuard = (date: Date) => { allowed: boolean; reason?: string };
type SoDGuard = (action: string, context: { grantId?: string | undefined }) => { allowed: boolean; reason?: string };

let _periodGuard: FiscalPeriodGuard | undefined;
let _sodGuard: SoDGuard | undefined;

export function setComplianceGuards(guards: { periodGuard?: FiscalPeriodGuard; sodGuard?: SoDGuard }): void {
  _periodGuard = guards.periodGuard ?? _periodGuard;
  _sodGuard = guards.sodGuard ?? _sodGuard;
}

function ensureAllowed(action: string, date: Date, context?: { grantId?: string }) {
  if (_periodGuard) {
    const r = _periodGuard(date);
    if (!r.allowed) throw new Error(`Period guard rejected ${action} on ${date.toISOString()}: ${r.reason ?? 'blocked'}`);
  }
  if (_sodGuard) {
    const r = _sodGuard(action, { grantId: context?.grantId });
    if (!r.allowed) throw new Error(`SoD guard rejected ${action}: ${r.reason ?? 'blocked'}`);
  }
}

/**
 * Create the initial recognition journal entry on grant receipt.
 * - income_method: Dr Cash, Cr Grant Income
 * - deferred_method / asset_method: Dr Cash, Cr Deferred Government Grant (liability)
 */
export function recognizeJournalEntry(grant: GovernmentGrant): JournalEntry {
  const date = grant.grantDate;
  ensureAllowed('post_journal', date, { grantId: grant.grantId });
  const isDeferredLike = grant.recognitionMethod === 'deferred_method' || grant.recognitionMethod === 'asset_method';
  const creditAccount = isDeferredLike ? 'DEFERRED-GOVERNMENT-GRANT' : 'GOVERNMENT-GRANT-INCOME';
  const amt = grant.grantAmount;
  return {
    id: `recognize-entry-${grant.grantId}-${date.getTime()}`,
    date,
    reference: `GRANT-RECEIPT-${grant.grantId}`,
    description: 'Government grant initial recognition',
    lines: [
      { id: `rec-cash-${grant.grantId}`, accountCode: 'CASH', description: 'Grant receipt', debit: amt, credit: 0, currency: grant.currency },
      { id: `rec-credit-${grant.grantId}`, accountCode: creditAccount, description: 'Grant recognition', debit: 0, credit: amt, currency: grant.currency }
    ],
    totalDebits: amt,
    totalCredits: amt,
    currency: grant.currency,
    status: 'draft'
  };
}

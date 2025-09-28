import { z } from 'zod';

// Core types for the financial intelligence dashboard
export const MetricIdSchema = z.string().min(1);
export const CompanyIdSchema = z.string().min(1);
export const PeriodSchema = z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);

// KPI Schema
export const KPISchema = z.object({
  id: MetricIdSchema,
  title: z.string().min(1),
  value: z.string().min(1), // formatted (respect locale/currency)
  raw: z.number().optional(), // machine value
  delta: z
    .object({
      pct: z.number(),
      direction: z.enum(['up', 'down']),
    })
    .optional(),
  lineage: z
    .object({
      reportId: z.string(),
      journalIds: z.array(z.string()),
      sourceRefs: z.array(z.string()),
    })
    .optional(),
  disclosure: z.string().optional(), // MFRS/IFRS code
  sparkline: z.array(z.number()).optional(), // tiny spark chart data
  category: z.enum(['revenue', 'expense', 'profit', 'cash', 'assets', 'liabilities', 'ratios']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  collapsible: z.boolean().optional(),
  pinned: z.boolean().optional(),
});

// Company Schema
export const CompanySchema = z.object({
  id: CompanyIdSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  currency: z.string().min(3).max(3), // ISO currency code
  status: z.enum(['active', 'inactive', 'consolidated']),
  eliminations: z.boolean().optional(),
});

// Close Readiness Schema
export const BottleneckSchema = z.object({
  type: z.enum(['journal', 'reconciliation', 'adjustment']),
  description: z.string().min(1),
  urgency: z.enum(['critical', 'high', 'medium']),
});

export const CloseReadinessSchema = z.object({
  periodId: z.string().min(1),
  journalsApproved: z.number().min(0),
  totalJournals: z.number().min(0),
  lateAdjustments: z.number().min(0),
  periodLocked: z.boolean(),
  owner: z.string().min(1),
  lastUpdated: z.date(),
  bottlenecks: z.array(BottleneckSchema),
});

// Cash Forecast Schema
export const CashScenarioSchema = z.object({
  name: z.string().min(1),
  cashRunway: z.number().min(0), // days
  probability: z.number().min(0).max(1),
});

export const WhatIfSchema = z.object({
  slowReceipts: z.number(), // +days
  pushPayables: z.number(), // -days
});

export const CashForecastSchema = z.object({
  period: z.string().min(1),
  cashRunway: z.number().min(0), // days
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  scenarios: z.array(CashScenarioSchema),
  whatIf: WhatIfSchema,
});

// Variance Storyline Schema
export const VarianceDriverSchema = z.object({
  type: z.enum(['mix', 'price', 'volume', 'fx', 'operational']),
  impact: z.number(),
  description: z.string().min(1),
  owner: z.string().min(1),
});

export const AttachmentSchema = z.object({
  type: z.enum(['document', 'note', 'calculation']),
  name: z.string().min(1),
  url: z.string().url(),
});

export const VarianceStorylineSchema = z.object({
  metricId: MetricIdSchema,
  change: z.number(),
  drivers: z.array(VarianceDriverSchema),
  attachments: z.array(AttachmentSchema),
});

// Dashboard Properties Schema
export const FinancialIntelligenceDashboardPropertiesSchema = z.object({
  tenantId: z.string().min(1),
  period: PeriodSchema.optional(),
  companies: z.array(CompanySchema).optional(),
  onOpenDrill: z.function().optional(),
  onExportBoardPack: z.function().optional(),
  onToggleEliminations: z.function().optional(),
  onVarianceClick: z.function().optional(),
  className: z.string().optional(),
});

// API Request/Response Schemas
export const CFODrillDownRequestSchema = z.object({
  metricId: MetricIdSchema,
  companyId: CompanyIdSchema,
  tenantId: z.string().min(1),
  period: PeriodSchema,
});

export const CFOBoardPackExportRequestSchema = z.object({
  companyIds: z.array(CompanyIdSchema),
  period: z.string().min(1),
  format: z.enum(['pdf', 'excel', 'json']).optional(),
  includeDisclosures: z.boolean().optional(),
});

export const CFOVarianceAnalysisRequestSchema = z.object({
  metricId: MetricIdSchema,
  tenantId: z.string().min(1),
  period: PeriodSchema,
  companyIds: z.array(CompanyIdSchema).optional(),
});

// Export types
export type MetricId = z.infer<typeof MetricIdSchema>;
export type CompanyId = z.infer<typeof CompanyIdSchema>;
export type Period = z.infer<typeof PeriodSchema>;
export type KPI = z.infer<typeof KPISchema>;
export type Company = z.infer<typeof CompanySchema>;
export type CloseReadiness = z.infer<typeof CloseReadinessSchema>;
export type CashForecast = z.infer<typeof CashForecastSchema>;
export type VarianceStoryline = z.infer<typeof VarianceStorylineSchema>;
export type FinancialIntelligenceDashboardProperties = z.infer<
  typeof FinancialIntelligenceDashboardPropertiesSchema
>;
export type CFODrillDownRequest = z.infer<typeof CFODrillDownRequestSchema>;
export type CFOBoardPackExportRequest = z.infer<typeof CFOBoardPackExportRequestSchema>;
export type CFOVarianceAnalysisRequest = z.infer<typeof CFOVarianceAnalysisRequestSchema>;

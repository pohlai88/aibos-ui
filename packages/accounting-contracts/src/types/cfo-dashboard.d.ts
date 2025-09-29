import { z } from 'zod';
export declare const MetricIdSchema: z.ZodString;
export declare const CompanyIdSchema: z.ZodString;
export declare const PeriodSchema: z.ZodEnum<["daily", "weekly", "monthly", "quarterly", "yearly"]>;
export declare const KPISchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    value: z.ZodString;
    raw: z.ZodOptional<z.ZodNumber>;
    delta: z.ZodOptional<z.ZodObject<{
        pct: z.ZodNumber;
        direction: z.ZodEnum<["up", "down"]>;
    }, "strip", z.ZodTypeAny, {
        pct: number;
        direction: "up" | "down";
    }, {
        pct: number;
        direction: "up" | "down";
    }>>;
    lineage: z.ZodOptional<z.ZodObject<{
        reportId: z.ZodString;
        journalIds: z.ZodArray<z.ZodString, "many">;
        sourceRefs: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        reportId: string;
        journalIds: string[];
        sourceRefs: string[];
    }, {
        reportId: string;
        journalIds: string[];
        sourceRefs: string[];
    }>>;
    disclosure: z.ZodOptional<z.ZodString>;
    sparkline: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    category: z.ZodEnum<["revenue", "expense", "profit", "cash", "assets", "liabilities", "ratios"]>;
    priority: z.ZodEnum<["critical", "high", "medium", "low"]>;
    collapsible: z.ZodOptional<z.ZodBoolean>;
    pinned: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    value: string;
    id: string;
    title: string;
    category: "revenue" | "expense" | "profit" | "cash" | "assets" | "liabilities" | "ratios";
    priority: "critical" | "high" | "medium" | "low";
    raw?: number | undefined;
    delta?: {
        pct: number;
        direction: "up" | "down";
    } | undefined;
    lineage?: {
        reportId: string;
        journalIds: string[];
        sourceRefs: string[];
    } | undefined;
    disclosure?: string | undefined;
    sparkline?: number[] | undefined;
    collapsible?: boolean | undefined;
    pinned?: boolean | undefined;
}, {
    value: string;
    id: string;
    title: string;
    category: "revenue" | "expense" | "profit" | "cash" | "assets" | "liabilities" | "ratios";
    priority: "critical" | "high" | "medium" | "low";
    raw?: number | undefined;
    delta?: {
        pct: number;
        direction: "up" | "down";
    } | undefined;
    lineage?: {
        reportId: string;
        journalIds: string[];
        sourceRefs: string[];
    } | undefined;
    disclosure?: string | undefined;
    sparkline?: number[] | undefined;
    collapsible?: boolean | undefined;
    pinned?: boolean | undefined;
}>;
export declare const CompanySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    code: z.ZodString;
    currency: z.ZodString;
    status: z.ZodEnum<["active", "inactive", "consolidated"]>;
    eliminations: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    currency: string;
    code: string;
    status: "active" | "inactive" | "consolidated";
    id: string;
    name: string;
    eliminations?: boolean | undefined;
}, {
    currency: string;
    code: string;
    status: "active" | "inactive" | "consolidated";
    id: string;
    name: string;
    eliminations?: boolean | undefined;
}>;
export declare const BottleneckSchema: z.ZodObject<{
    type: z.ZodEnum<["journal", "reconciliation", "adjustment"]>;
    description: z.ZodString;
    urgency: z.ZodEnum<["critical", "high", "medium"]>;
}, "strip", z.ZodTypeAny, {
    type: "journal" | "reconciliation" | "adjustment";
    description: string;
    urgency: "critical" | "high" | "medium";
}, {
    type: "journal" | "reconciliation" | "adjustment";
    description: string;
    urgency: "critical" | "high" | "medium";
}>;
export declare const CloseReadinessSchema: z.ZodObject<{
    periodId: z.ZodString;
    journalsApproved: z.ZodNumber;
    totalJournals: z.ZodNumber;
    lateAdjustments: z.ZodNumber;
    periodLocked: z.ZodBoolean;
    owner: z.ZodString;
    lastUpdated: z.ZodDate;
    bottlenecks: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["journal", "reconciliation", "adjustment"]>;
        description: z.ZodString;
        urgency: z.ZodEnum<["critical", "high", "medium"]>;
    }, "strip", z.ZodTypeAny, {
        type: "journal" | "reconciliation" | "adjustment";
        description: string;
        urgency: "critical" | "high" | "medium";
    }, {
        type: "journal" | "reconciliation" | "adjustment";
        description: string;
        urgency: "critical" | "high" | "medium";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    periodId: string;
    journalsApproved: number;
    totalJournals: number;
    lateAdjustments: number;
    periodLocked: boolean;
    owner: string;
    lastUpdated: Date;
    bottlenecks: {
        type: "journal" | "reconciliation" | "adjustment";
        description: string;
        urgency: "critical" | "high" | "medium";
    }[];
}, {
    periodId: string;
    journalsApproved: number;
    totalJournals: number;
    lateAdjustments: number;
    periodLocked: boolean;
    owner: string;
    lastUpdated: Date;
    bottlenecks: {
        type: "journal" | "reconciliation" | "adjustment";
        description: string;
        urgency: "critical" | "high" | "medium";
    }[];
}>;
export declare const CashScenarioSchema: z.ZodObject<{
    name: z.ZodString;
    cashRunway: z.ZodNumber;
    probability: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    cashRunway: number;
    probability: number;
}, {
    name: string;
    cashRunway: number;
    probability: number;
}>;
export declare const WhatIfSchema: z.ZodObject<{
    slowReceipts: z.ZodNumber;
    pushPayables: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    slowReceipts: number;
    pushPayables: number;
}, {
    slowReceipts: number;
    pushPayables: number;
}>;
export declare const CashForecastSchema: z.ZodObject<{
    period: z.ZodString;
    cashRunway: z.ZodNumber;
    riskLevel: z.ZodEnum<["low", "medium", "high", "critical"]>;
    scenarios: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        cashRunway: z.ZodNumber;
        probability: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        cashRunway: number;
        probability: number;
    }, {
        name: string;
        cashRunway: number;
        probability: number;
    }>, "many">;
    whatIf: z.ZodObject<{
        slowReceipts: z.ZodNumber;
        pushPayables: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        slowReceipts: number;
        pushPayables: number;
    }, {
        slowReceipts: number;
        pushPayables: number;
    }>;
}, "strip", z.ZodTypeAny, {
    period: string;
    cashRunway: number;
    riskLevel: "critical" | "high" | "medium" | "low";
    scenarios: {
        name: string;
        cashRunway: number;
        probability: number;
    }[];
    whatIf: {
        slowReceipts: number;
        pushPayables: number;
    };
}, {
    period: string;
    cashRunway: number;
    riskLevel: "critical" | "high" | "medium" | "low";
    scenarios: {
        name: string;
        cashRunway: number;
        probability: number;
    }[];
    whatIf: {
        slowReceipts: number;
        pushPayables: number;
    };
}>;
export declare const VarianceDriverSchema: z.ZodObject<{
    type: z.ZodEnum<["mix", "price", "volume", "fx", "operational"]>;
    impact: z.ZodNumber;
    description: z.ZodString;
    owner: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "mix" | "price" | "volume" | "fx" | "operational";
    description: string;
    owner: string;
    impact: number;
}, {
    type: "mix" | "price" | "volume" | "fx" | "operational";
    description: string;
    owner: string;
    impact: number;
}>;
export declare const AttachmentSchema: z.ZodObject<{
    type: z.ZodEnum<["document", "note", "calculation"]>;
    name: z.ZodString;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "document" | "note" | "calculation";
    name: string;
    url: string;
}, {
    type: "document" | "note" | "calculation";
    name: string;
    url: string;
}>;
export declare const VarianceStorylineSchema: z.ZodObject<{
    metricId: z.ZodString;
    change: z.ZodNumber;
    drivers: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["mix", "price", "volume", "fx", "operational"]>;
        impact: z.ZodNumber;
        description: z.ZodString;
        owner: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "mix" | "price" | "volume" | "fx" | "operational";
        description: string;
        owner: string;
        impact: number;
    }, {
        type: "mix" | "price" | "volume" | "fx" | "operational";
        description: string;
        owner: string;
        impact: number;
    }>, "many">;
    attachments: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["document", "note", "calculation"]>;
        name: z.ZodString;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "document" | "note" | "calculation";
        name: string;
        url: string;
    }, {
        type: "document" | "note" | "calculation";
        name: string;
        url: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    metricId: string;
    change: number;
    drivers: {
        type: "mix" | "price" | "volume" | "fx" | "operational";
        description: string;
        owner: string;
        impact: number;
    }[];
    attachments: {
        type: "document" | "note" | "calculation";
        name: string;
        url: string;
    }[];
}, {
    metricId: string;
    change: number;
    drivers: {
        type: "mix" | "price" | "volume" | "fx" | "operational";
        description: string;
        owner: string;
        impact: number;
    }[];
    attachments: {
        type: "document" | "note" | "calculation";
        name: string;
        url: string;
    }[];
}>;
export declare const FinancialIntelligenceDashboardPropertiesSchema: z.ZodObject<{
    tenantId: z.ZodString;
    period: z.ZodOptional<z.ZodEnum<["daily", "weekly", "monthly", "quarterly", "yearly"]>>;
    companies: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodString;
        currency: z.ZodString;
        status: z.ZodEnum<["active", "inactive", "consolidated"]>;
        eliminations: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        code: string;
        status: "active" | "inactive" | "consolidated";
        id: string;
        name: string;
        eliminations?: boolean | undefined;
    }, {
        currency: string;
        code: string;
        status: "active" | "inactive" | "consolidated";
        id: string;
        name: string;
        eliminations?: boolean | undefined;
    }>, "many">>;
    onOpenDrill: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    onExportBoardPack: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    onToggleEliminations: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    onVarianceClick: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    className: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    period?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | undefined;
    companies?: {
        currency: string;
        code: string;
        status: "active" | "inactive" | "consolidated";
        id: string;
        name: string;
        eliminations?: boolean | undefined;
    }[] | undefined;
    onOpenDrill?: ((...args: unknown[]) => unknown) | undefined;
    onExportBoardPack?: ((...args: unknown[]) => unknown) | undefined;
    onToggleEliminations?: ((...args: unknown[]) => unknown) | undefined;
    onVarianceClick?: ((...args: unknown[]) => unknown) | undefined;
    className?: string | undefined;
}, {
    tenantId: string;
    period?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | undefined;
    companies?: {
        currency: string;
        code: string;
        status: "active" | "inactive" | "consolidated";
        id: string;
        name: string;
        eliminations?: boolean | undefined;
    }[] | undefined;
    onOpenDrill?: ((...args: unknown[]) => unknown) | undefined;
    onExportBoardPack?: ((...args: unknown[]) => unknown) | undefined;
    onToggleEliminations?: ((...args: unknown[]) => unknown) | undefined;
    onVarianceClick?: ((...args: unknown[]) => unknown) | undefined;
    className?: string | undefined;
}>;
export declare const CFODrillDownRequestSchema: z.ZodObject<{
    metricId: z.ZodString;
    companyId: z.ZodString;
    tenantId: z.ZodString;
    period: z.ZodEnum<["daily", "weekly", "monthly", "quarterly", "yearly"]>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
    metricId: string;
    companyId: string;
}, {
    tenantId: string;
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
    metricId: string;
    companyId: string;
}>;
export declare const CFOBoardPackExportRequestSchema: z.ZodObject<{
    companyIds: z.ZodArray<z.ZodString, "many">;
    period: z.ZodString;
    format: z.ZodOptional<z.ZodEnum<["pdf", "excel", "json"]>>;
    includeDisclosures: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    period: string;
    companyIds: string[];
    format?: "pdf" | "excel" | "json" | undefined;
    includeDisclosures?: boolean | undefined;
}, {
    period: string;
    companyIds: string[];
    format?: "pdf" | "excel" | "json" | undefined;
    includeDisclosures?: boolean | undefined;
}>;
export declare const CFOVarianceAnalysisRequestSchema: z.ZodObject<{
    metricId: z.ZodString;
    tenantId: z.ZodString;
    period: z.ZodEnum<["daily", "weekly", "monthly", "quarterly", "yearly"]>;
    companyIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
    metricId: string;
    companyIds?: string[] | undefined;
}, {
    tenantId: string;
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
    metricId: string;
    companyIds?: string[] | undefined;
}>;
export type MetricId = z.infer<typeof MetricIdSchema>;
export type CompanyId = z.infer<typeof CompanyIdSchema>;
export type Period = z.infer<typeof PeriodSchema>;
export type KPI = z.infer<typeof KPISchema>;
export type Company = z.infer<typeof CompanySchema>;
export type CloseReadiness = z.infer<typeof CloseReadinessSchema>;
export type CashForecast = z.infer<typeof CashForecastSchema>;
export type VarianceStoryline = z.infer<typeof VarianceStorylineSchema>;
export type FinancialIntelligenceDashboardProperties = z.infer<typeof FinancialIntelligenceDashboardPropertiesSchema>;
export type CFODrillDownRequest = z.infer<typeof CFODrillDownRequestSchema>;
export type CFOBoardPackExportRequest = z.infer<typeof CFOBoardPackExportRequestSchema>;
export type CFOVarianceAnalysisRequest = z.infer<typeof CFOVarianceAnalysisRequestSchema>;
//# sourceMappingURL=cfo-dashboard.d.ts.map
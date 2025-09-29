import { z } from 'zod';
export declare const TrialBalanceQuery: z.ZodObject<{
    asOf: z.ZodString;
    tenantId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    asOf: string;
}, {
    tenantId: string;
    asOf: string;
}>;
export declare const TrialBalanceRow: z.ZodObject<{
    accountCode: z.ZodString;
    accountName: z.ZodString;
    debit: z.ZodDefault<z.ZodNumber>;
    credit: z.ZodDefault<z.ZodNumber>;
    balance: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    balance: number;
}, {
    accountCode: string;
    accountName: string;
    debit?: number | undefined;
    credit?: number | undefined;
    balance?: number | undefined;
}>;
export declare const TrialBalance: z.ZodObject<{
    asOf: z.ZodString;
    rows: z.ZodArray<z.ZodObject<{
        accountCode: z.ZodString;
        accountName: z.ZodString;
        debit: z.ZodDefault<z.ZodNumber>;
        credit: z.ZodDefault<z.ZodNumber>;
        balance: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        accountCode: string;
        accountName: string;
        debit: number;
        credit: number;
        balance: number;
    }, {
        accountCode: string;
        accountName: string;
        debit?: number | undefined;
        credit?: number | undefined;
        balance?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    asOf: string;
    rows: {
        accountCode: string;
        accountName: string;
        debit: number;
        credit: number;
        balance: number;
    }[];
}, {
    asOf: string;
    rows: {
        accountCode: string;
        accountName: string;
        debit?: number | undefined;
        credit?: number | undefined;
        balance?: number | undefined;
    }[];
}>;
export type TTrialBalanceQuery = z.infer<typeof TrialBalanceQuery>;
export type TTrialBalance = z.infer<typeof TrialBalance>;
export type TTrialBalanceRow = z.infer<typeof TrialBalanceRow>;
export declare const DrillDownRequestSchema: z.ZodObject<{
    accountCode: z.ZodString;
    period: z.ZodOptional<z.ZodString>;
    tenantId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    accountCode: string;
    period?: string | undefined;
}, {
    tenantId: string;
    accountCode: string;
    period?: string | undefined;
}>;
export declare const BoardPackExportRequestSchema: z.ZodObject<{
    format: z.ZodDefault<z.ZodEnum<["pdf", "excel", "csv"]>>;
    period: z.ZodOptional<z.ZodString>;
    tenantId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    format: "pdf" | "excel" | "csv";
    period?: string | undefined;
}, {
    tenantId: string;
    period?: string | undefined;
    format?: "pdf" | "excel" | "csv" | undefined;
}>;
export declare const VarianceAnalysisRequestSchema: z.ZodObject<{
    accountCode: z.ZodString;
    baselinePeriod: z.ZodString;
    comparisonPeriod: z.ZodString;
    tenantId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    accountCode: string;
    baselinePeriod: string;
    comparisonPeriod: string;
}, {
    tenantId: string;
    accountCode: string;
    baselinePeriod: string;
    comparisonPeriod: string;
}>;
export type TDrillDownRequest = z.infer<typeof DrillDownRequestSchema>;
export type TBoardPackExportRequest = z.infer<typeof BoardPackExportRequestSchema>;
export type TVarianceAnalysisRequest = z.infer<typeof VarianceAnalysisRequestSchema>;
//# sourceMappingURL=financial-reports.d.ts.map
import { z } from 'zod';
export declare const AccountType: z.ZodEnum<["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE", "CONTRA_ASSET", "CONTRA_LIABILITY", "CONTRA_EQUITY"]>;
export declare const NormalBalance: z.ZodEnum<["DEBIT", "CREDIT"]>;
export declare const Account: z.ZodObject<{
    id: z.ZodString;
    code: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE", "CONTRA_ASSET", "CONTRA_LIABILITY", "CONTRA_EQUITY"]>;
    normalBalance: z.ZodEnum<["DEBIT", "CREDIT"]>;
    parentId: z.ZodOptional<z.ZodString>;
    isPostingAllowed: z.ZodDefault<z.ZodBoolean>;
    mfrsSection: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["ACTIVE", "INACTIVE"]>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE" | "CONTRA_ASSET" | "CONTRA_LIABILITY" | "CONTRA_EQUITY";
    status: "ACTIVE" | "INACTIVE";
    id: string;
    name: string;
    normalBalance: "DEBIT" | "CREDIT";
    isPostingAllowed: boolean;
    parentId?: string | undefined;
    mfrsSection?: string | undefined;
}, {
    code: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE" | "CONTRA_ASSET" | "CONTRA_LIABILITY" | "CONTRA_EQUITY";
    id: string;
    name: string;
    normalBalance: "DEBIT" | "CREDIT";
    status?: "ACTIVE" | "INACTIVE" | undefined;
    parentId?: string | undefined;
    isPostingAllowed?: boolean | undefined;
    mfrsSection?: string | undefined;
}>;
export type TAccount = z.infer<typeof Account>;
//# sourceMappingURL=chart-of-accounts.d.ts.map
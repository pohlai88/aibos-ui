import { z } from 'zod';
/** ULIDs/UUIDs allowed */
export declare const Id: z.ZodString;
export declare const Money: z.ZodObject<{
    currency: z.ZodString;
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    currency: string;
    amount: number;
}, {
    currency: string;
    amount: number;
}>;
export declare const JournalEntryLine: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    accountId: z.ZodString;
    /** + for debit, - for credit (store sign-safe) */
    amount: z.ZodObject<{
        currency: z.ZodString;
        amount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        amount: number;
    }, {
        currency: string;
        amount: number;
    }>;
    memo: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    segment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: {
        currency: string;
        amount: number;
    };
    accountId: string;
    id?: string | undefined;
    memo?: string | undefined;
    departmentId?: string | undefined;
    projectId?: string | undefined;
    segment?: string | undefined;
}, {
    amount: {
        currency: string;
        amount: number;
    };
    accountId: string;
    id?: string | undefined;
    memo?: string | undefined;
    departmentId?: string | undefined;
    projectId?: string | undefined;
    segment?: string | undefined;
}>;
export declare const JournalEntry: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    reference: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    postedBy: z.ZodString;
    postingDate: z.ZodString;
    tenantId: z.ZodString;
    lines: z.ZodEffects<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        accountId: z.ZodString;
        /** + for debit, - for credit (store sign-safe) */
        amount: z.ZodObject<{
            currency: z.ZodString;
            amount: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            currency: string;
            amount: number;
        }, {
            currency: string;
            amount: number;
        }>;
        memo: z.ZodOptional<z.ZodString>;
        departmentId: z.ZodOptional<z.ZodString>;
        projectId: z.ZodOptional<z.ZodString>;
        segment: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        amount: {
            currency: string;
            amount: number;
        };
        accountId: string;
        id?: string | undefined;
        memo?: string | undefined;
        departmentId?: string | undefined;
        projectId?: string | undefined;
        segment?: string | undefined;
    }, {
        amount: {
            currency: string;
            amount: number;
        };
        accountId: string;
        id?: string | undefined;
        memo?: string | undefined;
        departmentId?: string | undefined;
        projectId?: string | undefined;
        segment?: string | undefined;
    }>, "many">, {
        amount: {
            currency: string;
            amount: number;
        };
        accountId: string;
        id?: string | undefined;
        memo?: string | undefined;
        departmentId?: string | undefined;
        projectId?: string | undefined;
        segment?: string | undefined;
    }[], {
        amount: {
            currency: string;
            amount: number;
        };
        accountId: string;
        id?: string | undefined;
        memo?: string | undefined;
        departmentId?: string | undefined;
        projectId?: string | undefined;
        segment?: string | undefined;
    }[]>;
}, "strip", z.ZodTypeAny, {
    postedBy: string;
    postingDate: string;
    tenantId: string;
    lines: {
        amount: {
            currency: string;
            amount: number;
        };
        accountId: string;
        id?: string | undefined;
        memo?: string | undefined;
        departmentId?: string | undefined;
        projectId?: string | undefined;
        segment?: string | undefined;
    }[];
    id?: string | undefined;
    reference?: string | undefined;
    description?: string | undefined;
}, {
    postedBy: string;
    postingDate: string;
    tenantId: string;
    lines: {
        amount: {
            currency: string;
            amount: number;
        };
        accountId: string;
        id?: string | undefined;
        memo?: string | undefined;
        departmentId?: string | undefined;
        projectId?: string | undefined;
        segment?: string | undefined;
    }[];
    id?: string | undefined;
    reference?: string | undefined;
    description?: string | undefined;
}>;
export type TJournalEntry = z.infer<typeof JournalEntry>;
export type TJournalEntryLine = z.infer<typeof JournalEntryLine>;
//# sourceMappingURL=journal-entry.d.ts.map
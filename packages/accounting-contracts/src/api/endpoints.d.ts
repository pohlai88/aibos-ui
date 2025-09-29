/** Centralized paths (BFF or Next route handlers can implement these) */
export declare const AccountingApi: {
    readonly journalEntry: {
        readonly post: "/api/accounting/journal-entries";
    };
    readonly reports: {
        readonly trialBalance: "/api/accounting/reports/trial-balance";
    };
    readonly chartOfAccounts: {
        readonly list: "/api/accounting/chart-of-accounts";
    };
};
//# sourceMappingURL=endpoints.d.ts.map
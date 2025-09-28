import type { TJournalEntry, TTrialBalance } from '@aibos/accounting-contracts';

import { AccountingApi, TrialBalance } from '@aibos/accounting-contracts';

const FAILED_TO_LOAD_PREFIX = 'Failed to load';
const DEFAULT_LOCALHOST_URL = 'http://localhost';

type FetcherInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

type FetcherResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

type Fetcher = (_input: string, _init?: FetcherInit) => Promise<FetcherResponse>;

const defaultFetcher: Fetcher = (_input, _init) => fetch(_input, _init) as Promise<FetcherResponse>;

/** Thin, dependency-free API client. */
export class AccountingClient {
  constructor(private readonly _fetcher: Fetcher = defaultFetcher) {}

  async postJournalEntry(entry: TJournalEntry): Promise<{ id: string }> {
    const res = await this._fetcher(AccountingApi.journalEntry.post, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error(`Failed to post journal entry: ${res.status}`);
    return res.json() as Promise<{ id: string }>;
  }

  async getTrialBalance(q: { asOf: string; tenantId: string }): Promise<TTrialBalance> {
    const url = new URL(
      AccountingApi.reports.trialBalance,
      globalThis.location?.origin ?? DEFAULT_LOCALHOST_URL,
    );
    url.searchParams.set('asOf', q.asOf);
    url.searchParams.set('tenantId', q.tenantId);
    const res = await this._fetcher(url.toString());
    if (!res.ok) throw new Error(`${FAILED_TO_LOAD_PREFIX} trial balance: ${res.status}`);
    const data = await res.json();
    return TrialBalance.parse(data);
  }

  async listAccounts(options?: {
    companyId?: string;
  }): Promise<Array<{ id: string; code: string; name: string }>> {
    const url = new URL(
      AccountingApi.chartOfAccounts.list,
      globalThis.location?.origin ?? DEFAULT_LOCALHOST_URL,
    );
    if (options?.companyId) {
      url.searchParams.set('companyId', options.companyId);
    }
    const res = await this._fetcher(url.toString());
    if (!res.ok) throw new Error(`${FAILED_TO_LOAD_PREFIX} chart of accounts: ${res.status}`);
    return res.json() as Promise<Array<{ id: string; code: string; name: string }>>;
  }

  // Financial Chart Data APIs
  async getProfitLossData(options: {
    period: string;
    companyId?: string;
    tenantId: string;
    periods?: number; // Number of periods to include
  }): Promise<
    Array<{
      period: string;
      revenue: number;
      costOfGoodsSold: number;
      grossProfit: number;
      operatingExpenses: number;
      operatingIncome: number;
      netIncome: number;
    }>
  > {
    const url = new URL(
      '/api/financial/profit-loss',
      globalThis.location?.origin ?? DEFAULT_LOCALHOST_URL,
    );
    url.searchParams.set('period', options.period);
    url.searchParams.set('tenantId', options.tenantId);
    if (options.companyId) url.searchParams.set('companyId', options.companyId);
    if (options.periods) url.searchParams.set('periods', options.periods.toString());

    const res = await this._fetcher(url.toString());
    if (!res.ok) throw new Error(`${FAILED_TO_LOAD_PREFIX} P&L data: ${res.status}`);
    return res.json() as Promise<
      Array<{
        period: string;
        revenue: number;
        costOfGoodsSold: number;
        grossProfit: number;
        operatingExpenses: number;
        operatingIncome: number;
        netIncome: number;
      }>
    >;
  }

  async getBalanceSheetData(options: {
    period: string;
    companyId?: string;
    tenantId: string;
    periods?: number;
  }): Promise<
    Array<{
      period: string;
      assets: {
        currentAssets: number;
        fixedAssets: number;
        totalAssets: number;
      };
      liabilities: {
        currentLiabilities: number;
        longTermDebt: number;
        totalLiabilities: number;
      };
      equity: {
        retainedEarnings: number;
        shareCapital: number;
        totalEquity: number;
      };
    }>
  > {
    const url = new URL(
      '/api/financial/balance-sheet',
      globalThis.location?.origin ?? DEFAULT_LOCALHOST_URL,
    );
    url.searchParams.set('period', options.period);
    url.searchParams.set('tenantId', options.tenantId);
    if (options.companyId) url.searchParams.set('companyId', options.companyId);
    if (options.periods) url.searchParams.set('periods', options.periods.toString());

    const res = await this._fetcher(url.toString());
    if (!res.ok) throw new Error(`${FAILED_TO_LOAD_PREFIX} balance sheet data: ${res.status}`);
    return res.json() as Promise<
      Array<{
        period: string;
        assets: {
          currentAssets: number;
          fixedAssets: number;
          totalAssets: number;
        };
        liabilities: {
          currentLiabilities: number;
          longTermDebt: number;
          totalLiabilities: number;
        };
        equity: {
          retainedEarnings: number;
          shareCapital: number;
          totalEquity: number;
        };
      }>
    >;
  }

  async getCashFlowData(options: {
    period: string;
    companyId?: string;
    tenantId: string;
    periods?: number;
  }): Promise<
    Array<{
      period: string;
      operating: {
        netIncome: number;
        depreciation: number;
        workingCapitalChanges: number;
        operatingCashFlow: number;
      };
      investing: {
        capex: number;
        assetSales: number;
        investingCashFlow: number;
      };
      financing: {
        debtIssuance: number;
        debtRepayment: number;
        dividends: number;
        financingCashFlow: number;
      };
      netCashFlow: number;
      beginningCash: number;
      endingCash: number;
    }>
  > {
    const url = new URL(
      '/api/financial/cash-flow',
      globalThis.location?.origin ?? DEFAULT_LOCALHOST_URL,
    );
    url.searchParams.set('period', options.period);
    url.searchParams.set('tenantId', options.tenantId);
    if (options.companyId) url.searchParams.set('companyId', options.companyId);
    if (options.periods) url.searchParams.set('periods', options.periods.toString());

    const res = await this._fetcher(url.toString());
    if (!res.ok) throw new Error(`${FAILED_TO_LOAD_PREFIX} cash flow data: ${res.status}`);
    return res.json() as Promise<
      Array<{
        period: string;
        operating: {
          netIncome: number;
          depreciation: number;
          workingCapitalChanges: number;
          operatingCashFlow: number;
        };
        investing: {
          capex: number;
          assetSales: number;
          investingCashFlow: number;
        };
        financing: {
          debtIssuance: number;
          debtRepayment: number;
          dividends: number;
          financingCashFlow: number;
        };
        netCashFlow: number;
        beginningCash: number;
        endingCash: number;
      }>
    >;
  }

  async getTrendData(options: {
    period: string;
    companyId?: string;
    tenantId: string;
    metrics: string[];
    periods?: number;
  }): Promise<
    Array<{
      period: string;
      metrics: Record<string, number>;
    }>
  > {
    const url = new URL(
      '/api/financial/trends',
      globalThis.location?.origin ?? DEFAULT_LOCALHOST_URL,
    );
    url.searchParams.set('period', options.period);
    url.searchParams.set('tenantId', options.tenantId);
    url.searchParams.set('metrics', options.metrics.join(','));
    if (options.companyId) url.searchParams.set('companyId', options.companyId);
    if (options.periods) url.searchParams.set('periods', options.periods.toString());

    const res = await this._fetcher(url.toString());
    if (!res.ok) throw new Error(`${FAILED_TO_LOAD_PREFIX} trend data: ${res.status}`);
    return res.json() as Promise<
      Array<{
        period: string;
        metrics: Record<string, number>;
      }>
    >;
  }

  async getVarianceData(options: {
    period: string;
    companyId?: string;
    tenantId: string;
    metric: string;
    periods?: number;
  }): Promise<
    Array<{
      period: string;
      budget: number;
      actual: number;
      variance: number;
      variancePercentage: number;
    }>
  > {
    const url = new URL(
      '/api/financial/variance',
      globalThis.location?.origin ?? DEFAULT_LOCALHOST_URL,
    );
    url.searchParams.set('period', options.period);
    url.searchParams.set('tenantId', options.tenantId);
    url.searchParams.set('metric', options.metric);
    if (options.companyId) url.searchParams.set('companyId', options.companyId);
    if (options.periods) url.searchParams.set('periods', options.periods.toString());

    const res = await this._fetcher(url.toString());
    if (!res.ok) throw new Error(`${FAILED_TO_LOAD_PREFIX} variance data: ${res.status}`);
    return res.json() as Promise<
      Array<{
        period: string;
        budget: number;
        actual: number;
        variance: number;
        variancePercentage: number;
      }>
    >;
  }
}

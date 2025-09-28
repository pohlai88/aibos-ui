import type { TJournalEntry } from '@aibos/accounting-contracts';

import { AccountingClient } from '../lib/accounting-api';
import { TrialBalance, type TTrialBalance } from '@aibos/accounting-contracts';
import * as React from 'react';

const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

/**
 * Lightweight hook without extra deps (no SWR/React Query).
 * It exposes imperative methods + simple state.
 */
export function useAccounting(client = new AccountingClient()): {
  loading: boolean;
  error: string | null;
  trialBalance: TTrialBalance | null;
  postJournalEntry: (_entry: TJournalEntry) => Promise<{ id: string }>;
  loadTrialBalance: (_q: { asOf: string; tenantId: string }) => Promise<TTrialBalance>;
  // Financial Chart Data Methods
  getProfitLossData: (options: {
    period: string;
    companyId?: string;
    tenantId: string;
    periods?: number;
  }) => Promise<unknown>;
  getBalanceSheetData: (options: {
    period: string;
    companyId?: string;
    tenantId: string;
    periods?: number;
  }) => Promise<unknown>;
  getCashFlowData: (options: {
    period: string;
    companyId?: string;
    tenantId: string;
    periods?: number;
  }) => Promise<unknown>;
  getTrendData: (options: {
    period: string;
    companyId?: string;
    tenantId: string;
    metrics: string[];
    periods?: number;
  }) => Promise<unknown>;
  getVarianceData: (options: {
    period: string;
    companyId?: string;
    tenantId: string;
    metric: string;
    periods?: number;
  }) => Promise<unknown>;
} {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [trialBalance, setTrialBalance] = React.useState<TTrialBalance | null>(null);

  const postJournalEntry = React.useCallback(
    async (entry: TJournalEntry) => {
      setLoading(true);
      setError(null);
      try {
        return await client.postJournalEntry(entry);
      } catch (error_: unknown) {
        setError((error_ as Error)?.message ?? UNKNOWN_ERROR_MESSAGE);
        throw error_;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const loadTrialBalance = React.useCallback(
    async (q: { asOf: string; tenantId: string }) => {
      setLoading(true);
      setError(null);
      try {
        const data = await client.getTrialBalance(q);
        setTrialBalance(TrialBalance.parse(data));
        return data;
      } catch (error_: unknown) {
        setError((error_ as Error)?.message ?? UNKNOWN_ERROR_MESSAGE);
        throw error_;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  // Financial Chart Data Methods
  const getProfitLossData = React.useCallback(
    async (options: { period: string; companyId?: string; tenantId: string; periods?: number }) => {
      setLoading(true);
      setError(null);
      try {
        return await client.getProfitLossData(options);
      } catch (error_: unknown) {
        setError((error_ as Error)?.message ?? UNKNOWN_ERROR_MESSAGE);
        throw error_;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const getBalanceSheetData = React.useCallback(
    async (options: { period: string; companyId?: string; tenantId: string; periods?: number }) => {
      setLoading(true);
      setError(null);
      try {
        return await client.getBalanceSheetData(options);
      } catch (error_: unknown) {
        setError((error_ as Error)?.message ?? UNKNOWN_ERROR_MESSAGE);
        throw error_;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const getCashFlowData = React.useCallback(
    async (options: { period: string; companyId?: string; tenantId: string; periods?: number }) => {
      setLoading(true);
      setError(null);
      try {
        return await client.getCashFlowData(options);
      } catch (error_: unknown) {
        setError((error_ as Error)?.message ?? UNKNOWN_ERROR_MESSAGE);
        throw error_;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const getTrendData = React.useCallback(
    async (options: {
      period: string;
      companyId?: string;
      tenantId: string;
      metrics: string[];
      periods?: number;
    }) => {
      setLoading(true);
      setError(null);
      try {
        return await client.getTrendData(options);
      } catch (error_: unknown) {
        setError((error_ as Error)?.message ?? UNKNOWN_ERROR_MESSAGE);
        throw error_;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const getVarianceData = React.useCallback(
    async (options: {
      period: string;
      companyId?: string;
      tenantId: string;
      metric: string;
      periods?: number;
    }) => {
      setLoading(true);
      setError(null);
      try {
        return await client.getVarianceData(options);
      } catch (error_: unknown) {
        setError((error_ as Error)?.message ?? UNKNOWN_ERROR_MESSAGE);
        throw error_;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  return {
    loading,
    error,
    trialBalance,
    postJournalEntry,
    loadTrialBalance,
    getProfitLossData,
    getBalanceSheetData,
    getCashFlowData,
    getTrendData,
    getVarianceData,
  };
}

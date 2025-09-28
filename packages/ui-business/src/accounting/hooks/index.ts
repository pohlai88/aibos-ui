// Essential Accounting UI Custom Hooks
// React hooks for accounting functionality

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  UseAccountingDataReturn,
  UseJournalEntryReturn,
  UseTrialBalanceReturn,
  JournalEntryFormData,
  TrialBalanceFilters,
  ValidationResult,
  AccountHierarchyNode,
  JournalEntryLine,
  AccountHierarchy,
} from '../types';
import { JournalEntryStatus } from '@aibos/accounting';
import type { AccountType, Account } from '@aibos/accounting';
import {
  useAccounts,
  useJournalEntries,
  useCurrentEntry,
  useTrialBalance,
  useAccountHierarchy,
  useLoading,
  useErrors,
  useAccountActions,
  useJournalEntryActions,
  useTrialBalanceActions,
} from '../services';
import { searchAccounts, filterAccountsByType } from '../utils';

// Hook for accounting data management
export function useAccountingData(): UseAccountingDataReturn {
  const accounts = useAccounts();
  const loading = useLoading();
  const errors = useErrors();
  const { loadAccounts } = useAccountActions();

  const refetch = useCallback(async () => {
    await loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (accounts.length === 0 && !loading.accounts) {
      refetch();
    }
  }, [accounts.length, loading.accounts, refetch]);

  return {
    accounts,
    loading: loading.accounts,
    error: errors.accounts,
    refetch,
  };
}

// Hook for journal entry management
export function useJournalEntry(): UseJournalEntryReturn {
  const journalEntries = useJournalEntries();
  const currentEntry = useCurrentEntry();
  const loading = useLoading();
  const errors = useErrors();
  const { loadJournalEntries, createJournalEntry, updateJournalEntry, postJournalEntry } =
    useJournalEntryActions();

  const validateEntry = useCallback((data: JournalEntryFormData): ValidationResult => {
    // Create a simple validation for UI JournalEntryLine type
    const errors: Array<{ field: string; message: string; code: string }> = [];

    // Check minimum lines
    if (data.lines.length < 2) {
      errors.push({
        field: 'lines',
        message: 'At least two lines are required',
        code: 'VALIDATION_ERROR',
      });
    }

    // Check for empty lines
    const emptyLines = data.lines.filter(
      (line) =>
        !line.accountCode ||
        (!line.debitAmount && !line.creditAmount) ||
        (line.debitAmount === 0 && line.creditAmount === 0),
    );

    if (emptyLines.length > 0) {
      errors.push({
        field: 'lines',
        message: 'All lines must have an account and amount',
        code: 'VALIDATION_ERROR',
      });
    }

    // Check balance
    const totalDebits = data.lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
    const totalCredits = data.lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.push({
        field: 'balance',
        message: 'Total debits must equal total credits',
        code: 'VALIDATION_ERROR',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  const createEntry = useCallback(
    async (data: JournalEntryFormData) => {
      await createJournalEntry(data);
    },
    [createJournalEntry],
  );

  const updateEntry = useCallback(
    async (id: string, data: Partial<JournalEntryFormData>) => {
      await updateJournalEntry(id, data);
    },
    [updateJournalEntry],
  );

  const postEntry = useCallback(
    async (id: string) => {
      await postJournalEntry(id);
    },
    [postJournalEntry],
  );

  useEffect(() => {
    if (journalEntries.length === 0 && !loading.journalEntries) {
      loadJournalEntries();
    }
  }, [journalEntries.length, loading.journalEntries, loadJournalEntries]);

  return {
    journalEntry: currentEntry,
    loading: loading.journalEntries,
    error: errors.journalEntries,
    createEntry,
    updateEntry,
    postEntry,
    validateEntry,
  };
}

// Hook for trial balance management
export function useTrialBalanceManagement(): UseTrialBalanceReturn {
  const trialBalance = useTrialBalance();
  const loading = useLoading();
  const errors = useErrors();
  const { loadTrialBalance, exportTrialBalance } = useTrialBalanceActions();

  const loadTrialBalanceData = useCallback(
    async (filters: TrialBalanceFilters) => {
      await loadTrialBalance(filters);
    },
    [loadTrialBalance],
  );

  const exportTrialBalanceData = useCallback(
    async (format: 'PDF' | 'Excel' | 'CSV') => {
      await exportTrialBalance(format);
    },
    [exportTrialBalance],
  );

  return {
    trialBalance,
    loading: loading.trialBalance,
    error: errors.trialBalance,
    loadTrialBalance: loadTrialBalanceData,
    exportTrialBalance: exportTrialBalanceData,
  };
}

// Hook for account search and filtering
export function useAccountSearch(): {
  accounts: Account[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
  clearFilters: () => void;
} {
  const accounts = useAccounts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const filteredAccounts = useMemo(() => {
    let filtered = accounts;

    if (searchTerm) {
      filtered = searchAccounts(filtered, searchTerm);
    }

    if (selectedTypes.length > 0) {
      filtered = filterAccountsByType(filtered, selectedTypes as AccountType[]);
    }

    return filtered;
  }, [accounts, searchTerm, selectedTypes]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedTypes([]);
  }, []);

  return {
    accounts: filteredAccounts,
    searchTerm,
    setSearchTerm,
    selectedTypes,
    setSelectedTypes,
    clearFilters,
  };
}

// Hook for account hierarchy management
export function useAccountHierarchyManagement(): {
  accountHierarchy: AccountHierarchy | null;
  expandedNodes: Set<string>;
  toggleNode: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
} {
  const accountHierarchy = useAccountHierarchy();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((previous) => {
      const newSet = new Set(previous);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const expandAll = useCallback(() => {
    if (!accountHierarchy) return;

    const allNodeIds = new Set<string>();
    const traverse = (nodes: AccountHierarchyNode[]) => {
      nodes.forEach((node) => {
        allNodeIds.add(node.account.accountCode);
        if (node.children.length > 0) {
          traverse(node.children);
        }
      });
    };

    traverse(accountHierarchy.rootNodes);
    setExpandedNodes(allNodeIds);
  }, [accountHierarchy]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  return {
    accountHierarchy,
    expandedNodes,
    toggleNode,
    expandAll,
    collapseAll,
  };
}

// Hook for journal entry form management
export function useJournalEntryForm(): {
  formData: JournalEntryFormData;
  validationErrors: ValidationResult;
  updateFormData: (updates: Partial<JournalEntryFormData>) => void;
  addLine: () => void;
  updateLine: (lineId: string, updates: Partial<JournalEntryLine>) => void;
  removeLine: (lineId: string) => void;
  validateForm: () => ValidationResult;
  resetForm: () => void;
} {
  const [formData, setFormData] = useState<JournalEntryFormData>({
    reference: '',
    description: '',
    date: new Date().toISOString().split('T')[0] || '',
    lines: [],
    status: JournalEntryStatus.DRAFT,
    totalDebits: 0,
    totalCredits: 0,
    isBalanced: false,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationResult>({
    isValid: true,
    errors: [],
  });

  const updateFormData = useCallback((updates: Partial<JournalEntryFormData>) => {
    setFormData((previous) => ({ ...previous, ...updates }));
  }, []);

  const addLine = useCallback(() => {
    const newLine = {
      id: `line-${Date.now()}`,
      accountId: '',
      accountCode: '',
      accountName: '',
      description: '',
      debitAmount: 0,
      creditAmount: 0,
      currency: 'MYR',
    };

    setFormData((previous) => ({
      ...previous,
      lines: [...previous.lines, newLine],
    }));
  }, []);

  const updateLine = useCallback((lineId: string, updates: Partial<JournalEntryLine>) => {
    setFormData((previous) => ({
      ...previous,
      lines: previous.lines.map((line) => (line.id === lineId ? { ...line, ...updates } : line)),
    }));
  }, []);

  const removeLine = useCallback((lineId: string) => {
    setFormData((previous) => ({
      ...previous,
      lines: previous.lines.filter((line) => line.id !== lineId),
    }));
  }, []);

  const validateForm = useCallback(() => {
    // Create a simple validation for UI JournalEntryLine type
    const errors: Array<{ field: string; message: string; code: string }> = [];

    // Check minimum lines
    if (formData.lines.length < 2) {
      errors.push({
        field: 'lines',
        message: 'At least two lines are required',
        code: 'VALIDATION_ERROR',
      });
    }

    // Check for empty lines
    const emptyLines = formData.lines.filter(
      (line) =>
        !line.accountCode ||
        (!line.debitAmount && !line.creditAmount) ||
        (line.debitAmount === 0 && line.creditAmount === 0),
    );

    if (emptyLines.length > 0) {
      errors.push({
        field: 'lines',
        message: 'All lines must have an account and amount',
        code: 'VALIDATION_ERROR',
      });
    }

    // Check balance
    const totalDebits = formData.lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
    const totalCredits = formData.lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.push({
        field: 'balance',
        message: 'Total debits must equal total credits',
        code: 'VALIDATION_ERROR',
      });
    }

    const validation = {
      isValid: errors.length === 0,
      errors,
    };

    setValidationErrors(validation);
    return validation;
  }, [formData.lines]);

  const resetForm = useCallback(() => {
    setFormData({
      reference: '',
      description: '',
      date: new Date().toISOString().split('T')[0] || '',
      lines: [],
      status: JournalEntryStatus.DRAFT,
      totalDebits: 0,
      totalCredits: 0,
      isBalanced: false,
    });
    setValidationErrors({ isValid: true, errors: [] });
  }, []);

  // Calculate totals whenever lines change
  useEffect(() => {
    const totalDebits = formData.lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
    const totalCredits = formData.lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    setFormData((previous) => ({
      ...previous,
      totalDebits,
      totalCredits,
      isBalanced,
    }));
  }, [formData.lines]);

  return {
    formData,
    validationErrors,
    updateFormData,
    addLine,
    updateLine,
    removeLine,
    validateForm,
    resetForm,
  };
}

// Hook for financial reports
export function useFinancialReports(): {
  reportType: 'P&L' | 'Balance Sheet' | 'Cash Flow';
  setReportType: (type: 'P&L' | 'Balance Sheet' | 'Cash Flow') => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  loading: boolean;
  error: Error | null;
  generateReport: () => Promise<void>;
} {
  const [reportType, setReportType] = useState<'P&L' | 'Balance Sheet' | 'Cash Flow'>('P&L');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('MYR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // This would call the financial reporting service
      // const report = await financialReportingService.generateReport({
      //   reportType,
      //   startDate,
      //   endDate,
      //   currency
      // });

      // For now, just simulate
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [reportType, startDate, endDate, currency]);

  return {
    reportType,
    setReportType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    currency,
    setCurrency,
    loading,
    error,
    generateReport,
  };
}

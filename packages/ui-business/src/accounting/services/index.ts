// Essential Accounting UI State Management
// Zustand store for accounting data management

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  AccountingStore,
  JournalEntryFormData,
  TrialBalanceFilters,
  AccountHierarchy,
  TrialBalanceData,
} from '../types';
import type { Account, CreateAccountCommand, JournalEntryStatus } from '@aibos/accounting';
import { buildAccountHierarchy } from '../utils';

export const useAccountingStore = create<AccountingStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      accounts: [],
      accountHierarchy: null,
      journalEntries: [],
      currentEntry: null,
      trialBalance: null,

      loading: {
        accounts: false,
        journalEntries: false,
        trialBalance: false,
      },

      errors: {
        accounts: null,
        journalEntries: null,
        trialBalance: null,
      },

      // Account actions
      loadAccounts: async () => {
        set((state) => ({
          loading: { ...state.loading, accounts: true },
          errors: { ...state.errors, accounts: null },
        }));

        try {
          // Mock implementation - in a real app this would call the service
          const accounts: Account[] = [];
          const hierarchy = buildAccountHierarchy(accounts);

          set({
            accounts,
            accountHierarchy: {
              rootNodes: hierarchy,
              totalAccounts: accounts.length,
              totalLevels: Math.max(...hierarchy.map((node) => node.level)) + 1,
            },
            loading: { ...get().loading, accounts: false },
          });
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, accounts: false },
            errors: { ...state.errors, accounts: error as Error },
          }));
        }
      },

      createAccount: async (command: CreateAccountCommand) => {
        try {
          // Mock implementation - in a real app this would call the service
          const newAccount: Account = {
            accountCode: command.accountCode,
            accountName: command.accountName,
            accountType: command.accountType,
            parentAccountCode: command.parentAccountCode,
            isActive: true,
          } as Account;

          set((state) => {
            const updatedAccounts = [...state.accounts, newAccount];
            const hierarchy = buildAccountHierarchy(updatedAccounts);

            return {
              accounts: updatedAccounts,
              accountHierarchy: {
                rootNodes: hierarchy,
                totalAccounts: updatedAccounts.length,
                totalLevels: Math.max(...hierarchy.map((node) => node.level)) + 1,
              },
            };
          });
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, accounts: error as Error },
          }));
          throw error;
        }
      },

      updateAccount: async (id: string, updates: Partial<Account>) => {
        try {
          const state = get();
          // Mock implementation - in a real app this would call the service
          const updatedAccount: Account = {
            ...state.accounts.find((accumulator: Account) => accumulator.accountCode === id)!,
            ...updates,
          } as Account;

          set((state) => {
            const updatedAccounts = state.accounts.map((account) =>
              account.accountCode === id ? updatedAccount : account,
            );
            const hierarchy = buildAccountHierarchy(updatedAccounts);

            return {
              accounts: updatedAccounts,
              accountHierarchy: {
                rootNodes: hierarchy,
                totalAccounts: updatedAccounts.length,
                totalLevels: Math.max(...hierarchy.map((node) => node.level)) + 1,
              },
            };
          });
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, accounts: error as Error },
          }));
          throw error;
        }
      },

      // Journal Entry actions
      loadJournalEntries: async () => {
        set((state) => ({
          loading: { ...state.loading, journalEntries: true },
          errors: { ...state.errors, journalEntries: null },
        }));

        try {
          // Mock implementation - in a real app this would call the service
          const journalEntries: JournalEntryFormData[] = [];

          set({
            journalEntries,
            loading: { ...get().loading, journalEntries: false },
          });
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, journalEntries: false },
            errors: { ...state.errors, journalEntries: error as Error },
          }));
        }
      },

      createJournalEntry: async (data: JournalEntryFormData) => {
        try {
          // Validate the journal entry using UI-specific validation
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

          if (errors.length > 0) {
            throw new Error('Journal entry validation failed');
          }

          // Mock implementation - in a real app this would call the service
          const newEntry = data;

          set((state) => ({
            journalEntries: [...state.journalEntries, newEntry],
            currentEntry: null,
          }));
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, journalEntries: error as Error },
          }));
          throw error;
        }
      },

      updateJournalEntry: async (id: string, data: Partial<JournalEntryFormData>) => {
        try {
          // Mock implementation - in a real app this would call the service
          const updatedEntry: JournalEntryFormData = {
            reference: data.reference || '',
            description: data.description || '',
            date: data.date || new Date().toISOString().split('T')[0] || '',
            lines: data.lines || [],
            status: data.status || ('DRAFT' as JournalEntryStatus),
            totalDebits: data.totalDebits || 0,
            totalCredits: data.totalCredits || 0,
            isBalanced: data.isBalanced || false,
            ...data,
          };

          set((state) => ({
            journalEntries: state.journalEntries.map((entry) =>
              entry.reference === id ? updatedEntry : entry,
            ),
            currentEntry:
              state.currentEntry?.reference === data.reference
                ? ({ ...state.currentEntry, ...data } as JournalEntryFormData)
                : state.currentEntry,
          }));
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, journalEntries: error as Error },
          }));
          throw error;
        }
      },

      postJournalEntry: async (id: string) => {
        try {
          const state = get();
          // Mock implementation - in a real app this would call the service
          const postedEntry = {
            ...state.journalEntries.find((entry: JournalEntryFormData) => entry.reference === id)!,
          };

          set((state) => ({
            journalEntries: state.journalEntries.map((entry) =>
              entry.reference === id ? postedEntry : entry,
            ),
          }));
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, journalEntries: error as Error },
          }));
          throw error;
        }
      },

      // Trial Balance actions
      loadTrialBalance: async (_filters: TrialBalanceFilters) => {
        set((state) => ({
          loading: { ...state.loading, trialBalance: true },
          errors: { ...state.errors, trialBalance: null },
        }));

        try {
          // Mock implementation - in a real app this would call the service
          const trialBalance = null;

          set({
            trialBalance,
            loading: { ...get().loading, trialBalance: false },
          });
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, trialBalance: false },
            errors: { ...state.errors, trialBalance: error as Error },
          }));
        }
      },

      exportTrialBalance: async (format: 'PDF' | 'Excel' | 'CSV') => {
        const { trialBalance } = get();
        if (!trialBalance) {
          throw new Error('No trial balance data to export');
        }

        try {
          // For now, just simulate export - in a real app this would call the service
          console.log(`Exporting trial balance as ${format}`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, trialBalance: error as Error },
          }));
          throw error;
        }
      },

      // Utility actions
      clearErrors: () => {
        set({
          errors: {
            accounts: null,
            journalEntries: null,
            trialBalance: null,
          },
        });
      },

      resetStore: () => {
        set({
          accounts: [],
          accountHierarchy: null,
          journalEntries: [],
          currentEntry: null,
          trialBalance: null,
          loading: {
            accounts: false,
            journalEntries: false,
            trialBalance: false,
          },
          errors: {
            accounts: null,
            journalEntries: null,
            trialBalance: null,
          },
        });
      },
    }),
    {
      name: 'accounting-store',
      partialize: (state: AccountingStore) => ({
        accounts: state.accounts,
        accountHierarchy: state.accountHierarchy,
        journalEntries: state.journalEntries,
        currentEntry: state.currentEntry,
        trialBalance: state.trialBalance,
      }),
    },
  ),
);

// Selector hooks for better performance
export const useAccounts = (): Account[] => useAccountingStore((state) => state.accounts);
export const useAccountHierarchy = (): AccountHierarchy | null =>
  useAccountingStore((state) => state.accountHierarchy);
export const useJournalEntries = (): JournalEntryFormData[] =>
  useAccountingStore((state) => state.journalEntries);
export const useCurrentEntry = (): JournalEntryFormData | null =>
  useAccountingStore((state) => state.currentEntry);
export const useTrialBalance = (): TrialBalanceData | null =>
  useAccountingStore((state) => state.trialBalance);

export const useLoading = (): {
  accounts: boolean;
  journalEntries: boolean;
  trialBalance: boolean;
} => useAccountingStore((state) => state.loading);
export const useErrors = (): {
  accounts: Error | null;
  journalEntries: Error | null;
  trialBalance: Error | null;
} => useAccountingStore((state) => state.errors);

// Action hooks
export const useAccountActions = (): {
  loadAccounts: () => Promise<void>;
  createAccount: (command: CreateAccountCommand) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
} =>
  useAccountingStore((state) => ({
    loadAccounts: state.loadAccounts,
    createAccount: state.createAccount,
    updateAccount: state.updateAccount,
  }));

export const useJournalEntryActions = (): {
  loadJournalEntries: () => Promise<void>;
  createJournalEntry: (data: JournalEntryFormData) => Promise<void>;
  updateJournalEntry: (id: string, data: Partial<JournalEntryFormData>) => Promise<void>;
  postJournalEntry: (id: string) => Promise<void>;
} =>
  useAccountingStore((state) => ({
    loadJournalEntries: state.loadJournalEntries,
    createJournalEntry: state.createJournalEntry,
    updateJournalEntry: state.updateJournalEntry,
    postJournalEntry: state.postJournalEntry,
  }));

export const useTrialBalanceActions = (): {
  loadTrialBalance: (filters: TrialBalanceFilters) => Promise<void>;
  exportTrialBalance: (format: 'PDF' | 'Excel' | 'CSV') => Promise<void>;
} =>
  useAccountingStore((state) => ({
    loadTrialBalance: state.loadTrialBalance,
    exportTrialBalance: state.exportTrialBalance,
  }));

export const useUtilityActions = (): { clearErrors: () => void; resetStore: () => void } =>
  useAccountingStore((state) => ({
    clearErrors: state.clearErrors,
    resetStore: state.resetStore,
  }));

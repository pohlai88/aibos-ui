// Journal Entry Line Molecule Component
// Composite component for individual journal entry lines

import { useCallback } from 'react';
import { LucideIcon } from '@aibos/ui';
import type { JournalEntryLine as JournalEntryLineType } from '../../types';
import type { Account } from '@aibos/accounting';
import { AccountSelector } from '../primitives/account-selector';
import { AmountInput } from '../primitives/amount-input';
import { cn } from '@aibos/ui';

interface JournalEntryLineProperties {
  line: JournalEntryLineType;
  accounts: Account[];
  onUpdate: (lineId: string, updates: Partial<JournalEntryLineType>) => void;
  onRemove: (lineId: string) => void;
  onAddAccount: (line: JournalEntryLineType) => void;
  disabled?: boolean;
  className?: string;
}

export function JournalEntryLine({
  line,
  accounts,
  onUpdate,
  onRemove,
  onAddAccount,
  disabled = false,
  className,
}: JournalEntryLineProperties): JSX.Element {
  const handleAccountSelect = useCallback(
    (account: Account | null) => {
      if (account) {
        onUpdate(line.id, {
          accountId: account.accountCode,
          accountCode: account.accountCode,
          accountName: account.accountName,
        });
      } else {
        // Handle clearing the account selection
        onUpdate(line.id, {
          accountId: '',
          accountCode: '',
          accountName: '',
        });
      }
    },
    [line.id, onUpdate],
  );

  const handleDebitChange = useCallback(
    (value: number) => {
      onUpdate(line.id, {
        debitAmount: value,
        creditAmount: value > 0 ? 0 : line.creditAmount,
      });
    },
    [line.id, onUpdate, line.creditAmount],
  );

  const handleCreditChange = useCallback(
    (value: number) => {
      onUpdate(line.id, {
        creditAmount: value,
        debitAmount: value > 0 ? 0 : line.debitAmount,
      });
    },
    [line.id, onUpdate, line.debitAmount],
  );

  const handleDescriptionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(line.id, {
        description: event.target.value,
      });
    },
    [line.id, onUpdate],
  );

  const handleRemove = useCallback(() => {
    onRemove(line.id);
  }, [line.id, onRemove]);

  const handleAddAccount = useCallback(() => {
    onAddAccount(line);
  }, [line, onAddAccount]);

  const hasAmount = line.debitAmount > 0 || line.creditAmount > 0;
  const hasAccount = line.accountId && line.accountCode && line.accountName;

  return (
    <div
      className={cn(
        'grid grid-cols-12 gap-4 rounded-lg border border-gray-200 bg-white p-4',
        'transition-colors hover:border-gray-300',
        className,
      )}
    >
      {/* Account Selection */}
      <div className="col-span-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">Account</label>
        <AccountSelector
          accounts={accounts}
          selectedAccountId={line.accountId}
          onSelect={handleAccountSelect}
          placeholder="Select account..."
          disabled={disabled}
          className="w-full"
        />
      </div>

      {/* Description */}
      <div className="col-span-3">
        <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
        <input
          type="text"
          value={line.description}
          onChange={handleDescriptionChange}
          placeholder="Enter description..."
          disabled={disabled}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>

      {/* Debit Amount */}
      <div className="col-span-2">
        <label className="mb-1 block text-sm font-medium text-gray-700">Debit</label>
        <AmountInput
          value={line.debitAmount}
          onChange={handleDebitChange}
          currency={line.currency}
          placeholder="0.00"
          disabled={disabled}
          className="w-full"
        />
      </div>

      {/* Credit Amount */}
      <div className="col-span-2">
        <label className="mb-1 block text-sm font-medium text-gray-700">Credit</label>
        <AmountInput
          value={line.creditAmount}
          onChange={handleCreditChange}
          currency={line.currency}
          placeholder="0.00"
          disabled={disabled}
          className="w-full"
        />
      </div>

      {/* Actions */}
      <div className="col-span-1 flex items-end space-x-1">
        {!disabled && (
          <>
            <button
              type="button"
              onClick={handleAddAccount}
              className="p-2 text-gray-400 transition-colors hover:text-blue-600"
              title="Add account"
              aria-label="Add account"
            >
              <LucideIcon name="Plus" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 text-gray-400 transition-colors hover:text-red-600"
              title="Remove line"
              aria-label="Remove line"
            >
              <LucideIcon name="Trash" className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Validation Indicators */}
      <div className="col-span-12 mt-2">
        <div className="flex items-center space-x-4 text-xs">
          {!hasAccount && (
            <span className="flex items-center text-red-600">
              <span className="mr-1 h-2 w-2 rounded-full bg-red-600"></span>
              Account required
            </span>
          )}
          {!hasAmount && (
            <span className="flex items-center text-red-600">
              <span className="mr-1 h-2 w-2 rounded-full bg-red-600"></span>
              Amount required
            </span>
          )}
          {hasAccount && hasAmount && (
            <span className="flex items-center text-green-600">
              <span className="mr-1 h-2 w-2 rounded-full bg-green-600"></span>
              Complete
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

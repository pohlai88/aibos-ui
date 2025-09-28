// Account Selector Primitive Component
// Enterprise-grade account selection component with search and validation

import { useState, useMemo, useCallback } from 'react';
import { LucideIcon, cn } from '@aibos/ui';
import type { AccountSelectorProperties } from '../../types';
import type { Account } from '@aibos/accounting';
import { useAccountSearch } from '../../hooks';

export function AccountSelector({
  accounts,
  selectedAccountId,
  onSelect,
  placeholder = 'Select an account...',
  disabled = false,
  className,
}: AccountSelectorProperties): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { accounts: filteredAccounts, setSearchTerm: setSearch } = useAccountSearch();

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.accountCode === selectedAccountId),
    [accounts, selectedAccountId],
  );

  const handleSelect = useCallback(
    (account: Account) => {
      onSelect(account);
      setIsOpen(false);
      setSearchTerm('');
    },
    [onSelect, setSearchTerm],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      setSearch(value);
    },
    [setSearch],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!disabled) {
          setIsOpen(!isOpen);
        }
      } else if (event.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [disabled, isOpen],
  );

  const handleClear = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onSelect(null);
    },
    [onSelect],
  );

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') () => !disabled && setIsOpen(!isOpen)(e);
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="account-selector-listbox"
        aria-label="Account selector"
        tabIndex={disabled ? -1 : 0}
        className={cn(
          'flex w-full items-center justify-between rounded-md border border-gray-300 px-3 py-2',
          'cursor-pointer bg-white text-sm transition-colors',
          'hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
          disabled && 'cursor-not-allowed bg-gray-50 text-gray-500',
          isOpen && 'border-blue-500 ring-2 ring-blue-500',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center space-x-2">
          {selectedAccount ? (
            <>
              <span className="truncate font-medium text-gray-900">
                {selectedAccount.accountCode}
              </span>
              <span className="truncate text-gray-500">{selectedAccount.accountName}</span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>

        <div className="ml-2 flex items-center space-x-1">
          {selectedAccount && !disabled && (
            <button
              onClick={handleClear}
              type="button"
              aria-label="Clear selection"
              className="p-1 text-gray-400 transition-colors hover:text-gray-600"
            >
              <LucideIcon name="X" className="h-4 w-4" />
            </button>
          )}
          <LucideIcon
            name="ChevronDown"
            className={cn('h-4 w-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
          {/* Search Input */}
          <div className="border-b border-gray-200 p-2">
            <div className="relative">
              <LucideIcon
                name="Search"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search accounts..."
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Account List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredAccounts.length === 0 ? (
              <div className="px-3 py-2 text-center text-sm text-gray-500">
                {searchTerm ? 'No accounts found' : 'No accounts available'}
              </div>
            ) : (
              <div role="listbox" id="account-selector-listbox" className="py-1">
                {filteredAccounts.map((account) => (
                  <button
                    key={account.accountCode}
                    type="button"
                    onClick={() => handleSelect(account)}
                    role="option"
                    aria-selected={account.accountCode === selectedAccountId}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors',
                      'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                      account.accountCode === selectedAccountId && 'bg-blue-50 text-blue-900',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="truncate font-medium text-gray-900">
                          {account.accountCode}
                        </span>
                        <span className="truncate text-gray-500">{account.accountName}</span>
                      </div>
                      {account.accountName && (
                        <div className="mt-1 truncate text-xs text-gray-400">
                          {account.accountName}
                        </div>
                      )}
                    </div>

                    {account.accountCode === selectedAccountId && (
                      <LucideIcon
                        name="Check"
                        className="ml-2 h-4 w-4 flex-shrink-0 text-blue-600"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') () => setIsOpen(false)(e);
          }}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

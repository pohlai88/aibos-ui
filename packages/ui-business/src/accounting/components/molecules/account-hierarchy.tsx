// Account Hierarchy Molecule Component
// Composite component for displaying hierarchical account structure

import { useCallback } from 'react';
import { LucideIcon } from '@aibos/ui';
import type { AccountHierarchyNode } from '../../types';
import type { Account } from '@aibos/accounting';
import { BalanceDisplay } from '../primitives/balance-display';
import { cn } from '@aibos/ui';

interface AccountHierarchyProperties {
  nodes: AccountHierarchyNode[];
  expandedNodes: Set<string>;
  onToggleNode: (nodeId: string) => void;
  onSelectAccount?: (account: Account) => void;
  selectedAccountId?: string;
  showBalances?: boolean;
  className?: string;
}

export function AccountHierarchy({
  nodes,
  expandedNodes,
  onToggleNode,
  onSelectAccount,
  selectedAccountId,
  showBalances = true,
  className,
}: AccountHierarchyProperties): JSX.Element {
  const handleToggleNode = useCallback(
    (nodeId: string) => {
      onToggleNode(nodeId);
    },
    [onToggleNode],
  );

  const handleSelectAccount = useCallback(
    (account: Account) => {
      if (onSelectAccount) {
        onSelectAccount(account);
      }
    },
    [onSelectAccount],
  );

  const renderNode = useCallback(
    (node: AccountHierarchyNode, level: number = 0) => {
      const isExpanded = expandedNodes.has(node.account.accountCode);
      const hasChildren = node.children.length > 0;
      const isSelected = selectedAccountId === node.account.accountCode;

      return (
        <div key={node.account.accountCode} className="select-none">
          {/* Node Content */}
          <div
            className={cn(
              'flex cursor-pointer items-center space-x-2 rounded-md px-3 py-2 transition-colors',
              'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
              isSelected && 'bg-blue-50 text-blue-900',
              level > 0 && 'ml-4',
            )}
            style={{ paddingLeft: `${level * 1.5}rem` }}
            onClick={() => handleSelectAccount(node.account)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectAccount(node.account);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Account ${node.account.accountCode} - ${node.account.accountName}`}
          >
            {/* Expand/Collapse Button */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleNode(node.account.accountCode);
                }}
                className="rounded p-1 transition-colors hover:bg-gray-200"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <LucideIcon name="ChevronDown" className="h-4 w-4 text-gray-500" />
                ) : (
                  <LucideIcon name="ChevronRight" className="h-4 w-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center">
                <div className="h-1 w-1 rounded-full bg-gray-300"></div>
              </div>
            )}

            {/* Account Icon */}
            <div className="flex-shrink-0">
              {hasChildren ? (
                <LucideIcon name="Folder" className="h-4 w-4 text-gray-500" />
              ) : (
                <LucideIcon name="File" className="h-4 w-4 text-gray-400" />
              )}
            </div>

            {/* Account Information */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="truncate font-medium text-gray-900">
                  {node.account.accountCode}
                </span>
                <span className="truncate text-gray-500">{node.account.accountName}</span>
              </div>

              {node.account.accountName && (
                <div className="mt-1 truncate text-xs text-gray-400">
                  {node.account.accountName}
                </div>
              )}
            </div>

            {/* Balance Display */}
            {showBalances && (
              <div className="flex-shrink-0">
                <BalanceDisplay
                  balance={node.account.balance || 0}
                  currency="MYR"
                  accountType={node.account.accountType}
                  showSign={true}
                  className="text-sm"
                />
              </div>
            )}
          </div>

          {/* Children */}
          {hasChildren && isExpanded && (
            <div className="ml-2">{node.children.map((child) => renderNode(child, level + 1))}</div>
          )}
        </div>
      );
    },
    [expandedNodes, selectedAccountId, showBalances, handleToggleNode, handleSelectAccount],
  );

  return (
    <div className={cn('space-y-1', className)}>
      {nodes.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <LucideIcon name="Folder" className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-sm">No accounts found</p>
        </div>
      ) : (
        nodes.map((node) => renderNode(node))
      )}
    </div>
  );
}

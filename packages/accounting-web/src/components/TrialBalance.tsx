import type { TTrialBalanceQuery } from '@aibos/accounting-contracts';
import type { VirtualTableColumn } from '@aibos/ui';

import { useAccounting } from '../hooks/useAccounting';
import { AsyncLoading, SkeletonTable, VirtualTable } from '@aibos/ui';
import * as React from 'react';

const RIGHT_ALIGN_CLASS = 'text-right';

interface TrialBalanceProperties {
  query: TTrialBalanceQuery;
}

interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
}

export function TrialBalance({ query }: TrialBalanceProperties): JSX.Element {
  const { trialBalance, loadTrialBalance, loading, error } = useAccounting();

  React.useEffect(() => {
    void loadTrialBalance(query);
  }, [query, loadTrialBalance]);

  const formatCurrency = (value: number): string => value.toLocaleString();

  const columns: VirtualTableColumn<TrialBalanceRow>[] = React.useMemo(
    () => [
      {
        key: 'account',
        header: 'Account',
        width: 300,
        render: (_, row) => `${row.accountCode} — ${row.accountName}`,
      },
      {
        key: 'debit',
        header: 'Debit',
        width: 150,
        render: (value) => formatCurrency(value as number),
        className: RIGHT_ALIGN_CLASS,
      },
      {
        key: 'credit',
        header: 'Credit',
        width: 150,
        render: (value) => formatCurrency(value as number),
        className: RIGHT_ALIGN_CLASS,
      },
      {
        key: 'balance',
        header: 'Balance',
        width: 150,
        render: (value) => formatCurrency(value as number),
        className: RIGHT_ALIGN_CLASS,
      },
    ],
    [],
  );

  const handleRowClick = React.useCallback((row: TrialBalanceRow) => {
    // TODO: Implement account detail navigation

    console.log('Account clicked:', row.accountCode);
  }, []);

  return (
    <div className="w-full">
      <div className="text-semantic-muted-foreground mb-4 text-sm">
        {trialBalance ? `As of ${new Date(trialBalance.asOf).toLocaleDateString()}` : 'Loading...'}
      </div>

      <AsyncLoading
        isLoading={loading}
        error={error ? new Error(error) : undefined}
        loadingComponent={<SkeletonTable rows={10} columns={4} className="h-96" />}
        errorComponent={(error: Error) => (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-semantic-error mb-2">
                <svg
                  className="mx-auto h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="text-semantic-muted-foreground text-sm">{error.message}</p>
            </div>
          </div>
        )}
      >
        <VirtualTable
          data={trialBalance?.rows || []}
          columns={columns}
          height={600}
          rowHeight={40}
          onRowClick={(row: TrialBalanceRow) => handleRowClick(row)}
          emptyMessage="No trial balance data available"
          className="border-semantic-border rounded-lg border"
        />
      </AsyncLoading>
    </div>
  );
}

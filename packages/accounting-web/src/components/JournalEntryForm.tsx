import type { TJournalEntry, TJournalEntryLine } from '@aibos/accounting-contracts';

import { useAccounting } from '../hooks/useAccounting';
import { JournalEntry } from '@aibos/accounting-contracts';
import { cn, LoadingButton } from '@aibos/ui';
import * as React from 'react';

type Properties = {
  tenantId: string;
  className?: string;
  onPosted?: (_id: string) => void;
  /** Optional default currency (e.g., "MYR") */
  defaultCurrency?: string;
};

export function JournalEntryForm({
  tenantId,
  className,
  onPosted,
  defaultCurrency = 'MYR',
}: Properties): JSX.Element {
  const { loading, error, postJournalEntry } = useAccounting();

  const [lines, setLines] = React.useState<TJournalEntryLine[]>([
    { accountId: '', amount: { currency: defaultCurrency, amount: 0 } },
    { accountId: '', amount: { currency: defaultCurrency, amount: 0 } },
  ]);
  const [desc, setDesc] = React.useState('');
  const [ref, setReference] = React.useState('');

  const updateLine = (index: number, patch: Partial<TJournalEntryLine>): void => {
    setLines((ls) => ls.map((l, index_) => (index_ === index ? { ...l, ...patch } : l)));
  };

  const addLine = (): void =>
    setLines((ls) => [...ls, { accountId: '', amount: { currency: defaultCurrency, amount: 0 } }]);

  const removeLine = (index: number): void =>
    setLines((ls) => ls.filter((_, index_) => index_ !== index));

  const onSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    const payload: TJournalEntry = {
      tenantId,
      postedBy: 'current-user', // replace at integration
      postingDate: new Date().toISOString(),
      description: desc || undefined,
      reference: ref || undefined,
      lines,
    };

    const parsed = JournalEntry.safeParse(payload);
    if (!parsed.success) {
      console.error(parsed.error.issues.map((issue) => issue.message).join('\n'));
      return;
    }

    const { id } = await postJournalEntry(parsed.data);
    onPosted?.(id);
  };

  return (
    <form className={cn('w-full space-y-4', className)} onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Reference</label>
        <input
          className="border-semantic-border w-full rounded border p-2"
          value={ref}
          onChange={(event) => setReference(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Description</label>
        <textarea
          className="border-semantic-border w-full rounded border p-2"
          value={desc}
          onChange={(event) => setDesc(event.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold">Lines</div>
        {lines.map((l, index) => (
          <div key={index} className="grid grid-cols-12 gap-2">
            <input
              className="border-semantic-border col-span-5 rounded border p-2"
              placeholder="Account ID"
              value={l.accountId}
              onChange={(event) => updateLine(index, { accountId: event.target.value })}
            />
            <input
              className="border-semantic-border col-span-3 rounded border p-2"
              placeholder="Amount (use + for Debit, - for Credit)"
              type="number"
              value={l.amount.amount}
              onChange={(event) =>
                updateLine(index, {
                  amount: { ...l.amount, amount: Number(event.target.value) },
                })
              }
            />
            <input
              className="border-semantic-border col-span-2 rounded border p-2"
              placeholder="Currency"
              value={l.amount.currency}
              onChange={(event) =>
                updateLine(index, {
                  amount: { ...l.amount, currency: event.target.value.toUpperCase() },
                })
              }
            />
            <button
              type="button"
              className="border-semantic-border col-span-2 rounded border p-2"
              onClick={() => removeLine(index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="border-semantic-border rounded border p-2"
          onClick={addLine}
        >
          Add line
        </button>
      </div>

      {error && (
        <div className="bg-semantic-error/10 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="text-semantic-error h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-semantic-error text-sm font-medium">Error</h3>
              <div className="text-semantic-error mt-2 text-sm">{error}</div>
            </div>
          </div>
        </div>
      )}

      <LoadingButton
        type="submit"
        isLoading={loading}
        loadingText="Posting..."
        className="bg-semantic-primary text-semantic-primary-foreground hover:bg-semantic-primary/90 focus:ring-semantic-primary w-full rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
      >
        Post Journal Entry
      </LoadingButton>
    </form>
  );
}

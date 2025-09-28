// Journal Entry Workspace Organism Component
// Complex component for journal entry creation and management

import { useState, useCallback } from 'react';
import { LucideIcon, cn } from '@aibos/ui';
import type { JournalEntryLine } from '../../types';
import { JournalEntryLine as JournalEntryLineComponent } from '../molecules/journal-entry-line';
import { StatusIndicator } from '../primitives/status-indicator';
import { useJournalEntryForm, useAccountingData } from '../../hooks';

interface JournalEntryWorkspaceProperties {
  className?: string;
}

export function JournalEntryWorkspace({ className }: JournalEntryWorkspaceProperties): JSX.Element {
  const { accounts } = useAccountingData();
  const {
    formData,
    validationErrors,
    updateFormData,
    addLine,
    updateLine,
    removeLine,
    validateForm,
    resetForm,
  } = useJournalEntryForm();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleSave = useCallback(async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      // This would save the journal entry
      console.log('Saving journal entry:', formData);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  const handlePost = useCallback(async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      // This would post the journal entry
      console.log('Posting journal entry:', formData);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    } catch (error) {
      console.error('Error posting journal entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  const handleAddLine = useCallback(() => {
    addLine();
  }, [addLine]);

  const handleUpdateLine = useCallback(
    (lineId: string, updates: Partial<JournalEntryLine>) => {
      updateLine(lineId, updates);
    },
    [updateLine],
  );

  const handleRemoveLine = useCallback(
    (lineId: string) => {
      removeLine(lineId);
    },
    [removeLine],
  );

  const handleAddAccount = useCallback((line: JournalEntryLine) => {
    // This would open an account selection modal
    console.log('Add account for line:', line);
  }, []);

  const handleReset = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const canSave = formData.lines.length >= 2 && formData.isBalanced && !isSubmitting;
  const canPost = canSave && formData.reference && formData.description;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal Entry</h1>
          <p className="text-gray-600">
            Create and manage journal entries with double-entry bookkeeping
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-gray-400 transition-colors hover:text-gray-600"
            title="View History"
          >
            <LucideIcon name="History" className="h-5 w-5" />
          </button>

          <button
            onClick={handleReset}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-50"
          >
            Reset
          </button>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LucideIcon name="Save" className="h-4 w-4" />
            <span>Save</span>
          </button>

          <button
            onClick={handlePost}
            disabled={!canPost}
            className="flex items-center space-x-2 rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LucideIcon name="Send" className="h-4 w-4" />
            <span>Post</span>
          </button>
        </div>
      </div>

      {/* Entry Details */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-medium text-gray-900">Entry Details</h2>
        </div>

        <div className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Reference */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Reference *</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => updateFormData({ reference: e.target.value })}
                placeholder="Enter reference..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => updateFormData({ date: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <StatusIndicator status={formData.status} showLabel={true} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="Enter description..."
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Journal Entry Lines */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-medium text-gray-900">Entry Lines</h2>
          <button
            onClick={handleAddLine}
            className="flex items-center space-x-2 rounded-md bg-blue-600 px-3 py-1 text-white transition-colors hover:bg-blue-700"
          >
            <LucideIcon name="Plus" className="h-4 w-4" />
            <span>Add Line</span>
          </button>
        </div>

        <div className="space-y-4 p-4">
          {formData.lines.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>No entry lines. Click "Add Line" to get started.</p>
            </div>
          ) : (
            formData.lines.map((line) => (
              <JournalEntryLineComponent
                key={line.id}
                line={line}
                accounts={accounts}
                onUpdate={handleUpdateLine}
                onRemove={handleRemoveLine}
                onAddAccount={handleAddAccount}
              />
            ))
          )}
        </div>
      </div>

      {/* Validation Summary */}
      {validationErrors.errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="mb-2 flex items-center space-x-2">
            <LucideIcon name="AlertCircle" className="h-5 w-5 text-red-600" />
            <h3 className="font-medium text-red-800">Validation Errors</h3>
          </div>
          <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
            {validationErrors.errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Balance Summary */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-medium text-gray-900">Balance Summary</h2>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formData.totalDebits.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-600">Total Debits</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formData.totalCredits.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-600">Total Credits</div>
            </div>

            <div className="text-center">
              <div
                className={cn(
                  'text-2xl font-bold',
                  formData.isBalanced ? 'text-green-600' : 'text-red-600',
                )}
              >
                {formData.isBalanced ? (
                  <LucideIcon name="CheckCircle" className="mx-auto h-8 w-8" />
                ) : (
                  <LucideIcon name="AlertCircle" className="mx-auto h-8 w-8" />
                )}
              </div>
              <div className="text-sm text-gray-600">
                {formData.isBalanced ? 'Balanced' : 'Unbalanced'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-medium text-gray-900">Entry History</h2>
          </div>

          <div className="p-4">
            <div className="py-8 text-center text-gray-500">
              <p>Entry history will be displayed here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

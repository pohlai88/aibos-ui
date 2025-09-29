/**
 * Trial Balance Formatters - SSOT Implementation
 * 
 * Formatting logic for trial balance operations.
 * Imports from trial-balance-types.ts for consistency.
 */

import { 
  type TrialBalance,
  type TrialBalanceAccount,
  type TrialBalanceFormatOptions,
  type TrialBalanceExportOptions
} from './trial-balance-types-utilities';

// ============================================================================
// TRIAL BALANCE FORMATTER
// ============================================================================

export class TrialBalanceFormatter {
  /**
   * Format trial balance for display
   */
  static formatTrialBalance(
    trialBalance: TrialBalance,
    options: TrialBalanceFormatOptions = {}
  ): string {
    const defaultOptions: TrialBalanceFormatOptions = {
      includeInactive: false,
      groupByType: true,
      groupByCategory: false,
      sortByCode: true,
      sortByName: false,
      sortByBalance: false,
      includeVariances: false,
      includeMetadata: false,
      ...options
    };

    let accounts = [...trialBalance.accounts];

    // Filter accounts
    if (!defaultOptions.includeInactive) {
      accounts = accounts.filter(account => account.isActive);
    }

    // Sort accounts
    if (defaultOptions.sortByCode) {
      accounts = accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    } else if (defaultOptions.sortByName) {
      accounts = accounts.sort((a, b) => a.accountName.localeCompare(b.accountName));
    } else if (defaultOptions.sortByBalance) {
      accounts = accounts.sort((a, b) => Math.abs(b.closingBalance) - Math.abs(a.closingBalance));
    }

    // Group accounts
    if (defaultOptions.groupByType) {
      accounts = this.groupAccountsByType(accounts);
    } else if (defaultOptions.groupByCategory) {
      accounts = this.groupAccountsByCategory(accounts);
    }

    // Format output
    const lines: string[] = [];
    
    // Header
    lines.push(`Trial Balance - ${trialBalance.title}`);
    lines.push(`Period: ${this.formatDateRange(trialBalance.period)}`);
    lines.push(`Generated: ${trialBalance.generatedAt.toLocaleString()}`);
    lines.push('');

    // Account details
    lines.push('Account Code | Account Name | Type | Opening Balance | Debits | Credits | Closing Balance | Balance Type');
    lines.push('-'.repeat(120));

    accounts.forEach(account => {
      const line = [
        account.accountCode.padEnd(12),
        account.accountName.padEnd(20),
        account.accountType.padEnd(8),
        account.openingBalance.toFixed(2).padStart(15),
        account.periodDebits.toFixed(2).padStart(8),
        account.periodCredits.toFixed(2).padStart(8),
        account.closingBalance.toFixed(2).padStart(15),
        account.balanceType.padEnd(12)
      ].join(' | ');
      
      lines.push(line);
    });

    lines.push('-'.repeat(120));

    // Totals
    lines.push(`Total Debits: ${trialBalance.totalDebits.toFixed(2)}`);
    lines.push(`Total Credits: ${trialBalance.totalCredits.toFixed(2)}`);
    lines.push(`Net Balance: ${trialBalance.netBalance.toFixed(2)}`);

    // Metadata
    if (defaultOptions.includeMetadata) {
      lines.push('');
      lines.push('Metadata:');
      lines.push(`Total Accounts: ${trialBalance.metadata.totalAccounts}`);
      lines.push(`Active Accounts: ${trialBalance.metadata.activeAccounts}`);
      lines.push(`Inactive Accounts: ${trialBalance.metadata.inactiveAccounts}`);
      lines.push(`Multi-Currency Accounts: ${trialBalance.metadata.multiCurrencyAccounts}`);
      lines.push(`Generation Time: ${trialBalance.metadata.generationTime}ms`);
    }

    return lines.join('\n');
  }

  /**
   * Format trial balance as CSV
   */
  static formatAsCSV(
    trialBalance: TrialBalance,
    options: TrialBalanceFormatOptions = {}
  ): string {
    const defaultOptions: TrialBalanceFormatOptions = {
      includeInactive: false,
      groupByType: true,
      sortByCode: true,
      ...options
    };

    let accounts = [...trialBalance.accounts];

    // Filter and sort accounts
    if (!defaultOptions.includeInactive) {
      accounts = accounts.filter(account => account.isActive);
    }

    if (defaultOptions.sortByCode) {
      accounts = accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    }

    if (defaultOptions.groupByType) {
      accounts = this.groupAccountsByType(accounts);
    }

    // CSV header
    const headers = [
      'Account Code',
      'Account Name',
      'Account Type',
      'Opening Balance',
      'Period Debits',
      'Period Credits',
      'Closing Balance',
      'Balance Type',
      'Currency',
      'Parent Code',
      'Is Active'
    ];

    // CSV rows
    const rows = accounts.map(account => [
      account.accountCode,
      account.accountName,
      account.accountType,
      account.openingBalance.toFixed(2),
      account.periodDebits.toFixed(2),
      account.periodCredits.toFixed(2),
      account.closingBalance.toFixed(2),
      account.balanceType,
      account.currency,
      account.parentCode || '',
      account.isActive.toString()
    ]);

    // Combine headers and rows
    const csvLines = [headers.join(','), ...rows.map(row => row.join(','))];
    return csvLines.join('\n');
  }

  /**
   * Format trial balance as JSON
   */
  static formatAsJSON(
    trialBalance: TrialBalance,
    options: TrialBalanceFormatOptions = {}
  ): string {
    const defaultOptions: TrialBalanceFormatOptions = {
      includeInactive: false,
      groupByType: true,
      sortByCode: true,
      includeMetadata: true,
      ...options
    };

    let accounts = [...trialBalance.accounts];

    // Filter and sort accounts
    if (!defaultOptions.includeInactive) {
      accounts = accounts.filter(account => account.isActive);
    }

    if (defaultOptions.sortByCode) {
      accounts = accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    }

    if (defaultOptions.groupByType) {
      accounts = this.groupAccountsByType(accounts);
    }

    const output = {
      id: trialBalance.id,
      title: trialBalance.title,
      period: {
        start: trialBalance.period.start.toISOString(),
        end: trialBalance.period.end.toISOString()
      },
      accounts: accounts.map(account => ({
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        openingBalance: account.openingBalance,
        periodDebits: account.periodDebits,
        periodCredits: account.periodCredits,
        closingBalance: account.closingBalance,
        balanceType: account.balanceType,
        currency: account.currency,
        parentCode: account.parentCode,
        isActive: account.isActive
      })),
      totals: {
        totalDebits: trialBalance.totalDebits,
        totalCredits: trialBalance.totalCredits,
        netBalance: trialBalance.netBalance
      },
      generatedAt: trialBalance.generatedAt.toISOString(),
      generatedBy: trialBalance.generatedBy,
      status: trialBalance.status,
      reportingCurrency: trialBalance.reportingCurrency,
      ...(defaultOptions.includeMetadata && { metadata: trialBalance.metadata })
    };

    return JSON.stringify(output, null, 2);
  }

  /**
   * Format trial balance as HTML
   */
  static formatAsHTML(
    trialBalance: TrialBalance,
    options: TrialBalanceFormatOptions = {}
  ): string {
    const defaultOptions: TrialBalanceFormatOptions = {
      includeInactive: false,
      groupByType: true,
      sortByCode: true,
      includeMetadata: false,
      ...options
    };

    let accounts = [...trialBalance.accounts];

    // Filter and sort accounts
    if (!defaultOptions.includeInactive) {
      accounts = accounts.filter(account => account.isActive);
    }

    if (defaultOptions.sortByCode) {
      accounts = accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    }

    if (defaultOptions.groupByType) {
      accounts = this.groupAccountsByType(accounts);
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Trial Balance - ${trialBalance.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .header { text-align: center; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Trial Balance</h1>
        <h2>${trialBalance.title}</h2>
        <p>Period: ${this.formatDateRange(trialBalance.period)}</p>
        <p>Generated: ${trialBalance.generatedAt.toLocaleString()}</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Account Code</th>
                <th>Account Name</th>
                <th>Type</th>
                <th>Opening Balance</th>
                <th>Debits</th>
                <th>Credits</th>
                <th>Closing Balance</th>
                <th>Balance Type</th>
            </tr>
        </thead>
        <tbody>
            ${accounts.map(account => `
                <tr>
                    <td>${account.accountCode}</td>
                    <td>${account.accountName}</td>
                    <td>${account.accountType}</td>
                    <td>${account.openingBalance.toFixed(2)}</td>
                    <td>${account.periodDebits.toFixed(2)}</td>
                    <td>${account.periodCredits.toFixed(2)}</td>
                    <td>${account.closingBalance.toFixed(2)}</td>
                    <td>${account.balanceType}</td>
                </tr>
            `).join('')}
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="3">Totals</td>
                <td></td>
                <td>${trialBalance.totalDebits.toFixed(2)}</td>
                <td>${trialBalance.totalCredits.toFixed(2)}</td>
                <td>${trialBalance.netBalance.toFixed(2)}</td>
                <td></td>
            </tr>
        </tfoot>
    </table>
    
    ${defaultOptions.includeMetadata ? `
    <div style="margin-top: 20px;">
        <h3>Metadata</h3>
        <ul>
            <li>Total Accounts: ${trialBalance.metadata.totalAccounts}</li>
            <li>Active Accounts: ${trialBalance.metadata.activeAccounts}</li>
            <li>Inactive Accounts: ${trialBalance.metadata.inactiveAccounts}</li>
            <li>Multi-Currency Accounts: ${trialBalance.metadata.multiCurrencyAccounts}</li>
            <li>Generation Time: ${trialBalance.metadata.generationTime}ms</li>
        </ul>
    </div>
    ` : ''}
</body>
</html>
    `.trim();
  }

  /**
   * Group accounts by type
   */
  private static groupAccountsByType(accounts: TrialBalanceAccount[]): TrialBalanceAccount[] {
    const typeOrder = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
    return accounts.sort((a, b) => {
      const aIndex = typeOrder.indexOf(a.accountType);
      const bIndex = typeOrder.indexOf(b.accountType);
      return aIndex - bIndex;
    });
  }

  /**
   * Group accounts by category
   */
  private static groupAccountsByCategory(accounts: TrialBalanceAccount[]): TrialBalanceAccount[] {
    // This would be implemented based on account category structure
    return accounts;
  }

  /**
   * Format date range
   */
  private static formatDateRange(period: { start: Date; end: Date }): string {
    const start = period.start.toLocaleDateString();
    const end = period.end.toLocaleDateString();
    return `${start} - ${end}`;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format trial balance for display
 */
export function formatTrialBalance(
  trialBalance: TrialBalance,
  options: TrialBalanceFormatOptions = {}
): string {
  return TrialBalanceFormatter.formatTrialBalance(trialBalance, options);
}

/**
 * Format trial balance as CSV
 */
export function formatTrialBalanceAsCSV(
  trialBalance: TrialBalance,
  options: TrialBalanceFormatOptions = {}
): string {
  return TrialBalanceFormatter.formatAsCSV(trialBalance, options);
}

/**
 * Format trial balance as JSON
 */
export function formatTrialBalanceAsJSON(
  trialBalance: TrialBalance,
  options: TrialBalanceFormatOptions = {}
): string {
  return TrialBalanceFormatter.formatAsJSON(trialBalance, options);
}

/**
 * Format trial balance as HTML
 */
export function formatTrialBalanceAsHTML(
  trialBalance: TrialBalance,
  options: TrialBalanceFormatOptions = {}
): string {
  return TrialBalanceFormatter.formatAsHTML(trialBalance, options);
}

/**
 * Export trial balance
 */
export function exportTrialBalance(
  trialBalance: TrialBalance,
  options: TrialBalanceExportOptions
): string {
  switch (options.format) {
    case 'CSV':
      return TrialBalanceFormatter.formatAsCSV(trialBalance, options);
    case 'JSON':
      return TrialBalanceFormatter.formatAsJSON(trialBalance, options);
    case 'PDF':
      // PDF export would require additional libraries
      throw new Error('PDF export not implemented');
    case 'Excel':
      // Excel export would require additional libraries
      throw new Error('Excel export not implemented');
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

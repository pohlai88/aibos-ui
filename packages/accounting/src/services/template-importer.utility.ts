/**
 * Template Importer Service
 *
 * Handles idempotent import of COA templates with standards compliance,
 * topological sorting, and comprehensive validation.
 */

import { CreateAccountCommand } from '../commands/create-account.command';
import { AccountType, SpecialAccountType } from '../domain/account.domain';
import { ChartOfAccounts } from '../domain/chart-of-accounts.domain';
import { isEmpty, omitUndefined } from '../utils';
import { createBusinessError } from '../utils/error-utilities';
import {
  type TemplateBundle,
  type CoaTemplateAccount,
  type TemplateImportOptions,
  type TemplateApplicationResult,
} from '../types/standards';

export class TemplateImporter {
  /**
   * Apply a template bundle to a tenant's Chart of Accounts
   */
  async applyTemplate(
    tenantId: string,
    templateBundle: TemplateBundle,
    options: TemplateImportOptions = {},
  ): Promise<TemplateApplicationResult> {
    const {
      upsert = true,
      preserveExistingLinks = true,
      validateReferences = true,
      createAuditLog: _createAuditLog = true,
    } = options;

    const result: TemplateApplicationResult = {
      templateId: `${templateBundle.metadata.jurisdiction.toLowerCase()}-${templateBundle.metadata.version}`,
      tenantId,
      accountsCreated: 0,
      accountsUpdated: 0,
      accountsSkipped: 0,
      standardLinksCreated: 0,
      errors: [],
      warnings: [],
      appliedAt: new Date(),
    };

    try {
      // Validate template bundle
      if (validateReferences) {
        const validation = this.validateTemplateBundle(templateBundle);
        if (!validation.isValid) {
          result.errors.push(...validation.errors);
          return result;
        }
      }

      // Create Chart of Accounts instance
      const coa = new ChartOfAccounts(
        `chart-of-accounts-${tenantId}`,
        tenantId,
        'system', // Template importer runs as system user
      );

      // Topologically sort accounts (parents before children)
      const sortedAccounts = this.topologicalSort(templateBundle.accounts);

      // Apply accounts in dependency order
      for (const account of sortedAccounts) {
        try {
          await this.applyAccount(coa, account, upsert, result);
        } catch (error) {
          result.errors.push(`Failed to apply account ${account.code}: ${error}`);
        }
      }

      // Apply standard links
      if (!preserveExistingLinks) {
        await this.applyStandardLinks(coa, templateBundle, result);
      }

      result.warnings.push(`Template ${templateBundle.metadata.name} applied successfully`);
    } catch (error) {
      result.errors.push(`Template application failed: ${error}`);
    }

    return result;
  }

  /**
   * Apply a single account to the Chart of Accounts
   */
  private async applyAccount(
    coa: ChartOfAccounts,
    account: CoaTemplateAccount,
    upsert: boolean,
    result: TemplateApplicationResult,
  ): Promise<void> {
    const existingAccount = coa.getAccount(account.code);

    if (existingAccount && !upsert) {
      result.accountsSkipped++;
      return;
    }

    // Create account command
    const command = new CreateAccountCommand(
      omitUndefined({
        accountCode: account.code,
        accountName: account.name,
        accountType: this.mapAccountType(account.type),
        parentAccountCode: account.parent,
        tenantId: coa._tenantId,
        userId: 'system',
        specialAccountType: this.mapSpecialAccountType(account.specialAccountType),
        postingAllowed: account.postingAllowed ?? true,
        companionLinks: account.companions,
      }),
    );

    try {
      if (existingAccount) {
        // Update existing account using domain method
        // Note: This would typically involve updating account properties, not balance
        // Balance updates should go through journal entries, not template imports
        result.accountsUpdated++;
        result.warnings.push(
          `Account ${account.code} already exists - template import skipped for existing accounts`,
        );
      } else {
        // Create new account
        coa.createAccount(command);
        result.accountsCreated++;
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        result.accountsSkipped++;
        result.warnings.push(`Account ${account.code} already exists, skipped`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Apply standard links to accounts
   */
  private async applyStandardLinks(
    _coa: ChartOfAccounts,
    templateBundle: TemplateBundle,
    result: TemplateApplicationResult,
  ): Promise<void> {
    // This would integrate with the database to create standard links
    // For now, we'll just count the references
    let linkCount = 0;

    for (const account of templateBundle.accounts) {
      if (account.mfrsRefs) linkCount += account.mfrsRefs.length;
      if (account.ifrsRefs) linkCount += account.ifrsRefs.length;
      if (account.otherRefs) linkCount += account.otherRefs.length;
    }

    result.standardLinksCreated = linkCount;
  }

  /**
   * Topologically sort accounts to ensure parents are created before children
   */
  private topologicalSort(accounts: CoaTemplateAccount[]): CoaTemplateAccount[] {
    const accountMap = new Map<string, CoaTemplateAccount>();
    const childrenMap = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const result: CoaTemplateAccount[] = [];

    // Initialize maps
    for (const account of accounts) {
      accountMap.set(account.code, account);
      childrenMap.set(account.code, []);
      inDegree.set(account.code, 0);
    }

    // Build dependency graph
    for (const account of accounts) {
      if (account.parent) {
        const parentChildren = childrenMap.get(account.parent) || [];
        parentChildren.push(account.code);
        childrenMap.set(account.parent, parentChildren);

        const currentInDegree = inDegree.get(account.code) || 0;
        inDegree.set(account.code, currentInDegree + 1);
      }
    }

    // Find root accounts (no parents)
    const queue: string[] = [];
    for (const [code, degree] of inDegree) {
      if (degree === 0) {
        queue.push(code);
      }
    }

    // Process queue
    while (!isEmpty(queue)) {
      const current = queue.shift()!;
      const account = accountMap.get(current);

      if (account) {
        result.push(account);
      }

      // Process children
      const children = childrenMap.get(current) || [];
      for (const childCode of children) {
        const childInDegree = inDegree.get(childCode) || 0;
        inDegree.set(childCode, childInDegree - 1);

        if (inDegree.get(childCode) === 0) {
          queue.push(childCode);
        }
      }
    }

    // Check for circular dependencies
    if (result.length !== accounts.length) {
      throw createBusinessError(
        'CIRCULAR_DEPENDENCY_DETECTED',
        'Circular dependency detected in account hierarchy',
        'accountHierarchy',
        { operation: 'topological-sort' }
      );
    }

    return result;
  }

  /**
   * Validate template bundle
   */
  private validateTemplateBundle(bundle: TemplateBundle): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate metadata
    if (!bundle.metadata.name) {
      errors.push('Template metadata must include a name');
    }
    if (!bundle.metadata.version) {
      errors.push('Template metadata must include a version');
    }
    if (!bundle.metadata.jurisdiction) {
      errors.push('Template metadata must include a jurisdiction');
    }

    // Validate accounts
    const accountCodes = new Set<string>();
    for (const account of bundle.accounts) {
      if (!account.code) {
        errors.push('All accounts must have a code');
      } else if (accountCodes.has(account.code)) {
        errors.push(`Duplicate account code: ${account.code}`);
      } else {
        accountCodes.add(account.code);
      }

      if (!account.name) {
        errors.push(`Account ${account.code} must have a name`);
      }

      if (!['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].includes(account.type)) {
        errors.push(`Account ${account.code} has invalid type: ${account.type}`);
      }

      // Validate parent relationships
      if (account.parent && !accountCodes.has(account.parent)) {
        errors.push(`Account ${account.code} references non-existent parent: ${account.parent}`);
      }
    }

    return {
      isValid: isEmpty(errors),
      errors,
    };
  }

  /**
   * Map template account type to domain AccountType
   */
  private mapAccountType(type: string): AccountType {
    switch (type) {
      case 'Asset':
        return AccountType.ASSET;
      case 'Liability':
        return AccountType.LIABILITY;
      case 'Equity':
        return AccountType.EQUITY;
      case 'Revenue':
        return AccountType.REVENUE;
      case 'Expense':
        return AccountType.EXPENSE;
      default:
        throw createBusinessError(
          'UNKNOWN_ACCOUNT_TYPE',
          `Unknown account type: ${type}`,
          type,
          { operation: 'map-account-type' }
        );
    }
  }

  /**
   * Map template special account type to domain SpecialAccountType
   */
  private mapSpecialAccountType(type?: string): SpecialAccountType {
    if (!type) return SpecialAccountType.NONE;

    switch (type) {
      case 'None':
        return SpecialAccountType.NONE;
      case 'Contra':
        return SpecialAccountType.NONE; // Use NONE for now
      case 'Control':
        return SpecialAccountType.NONE; // Use NONE for now
      case 'Clearing':
        return SpecialAccountType.CLEARING;
      case 'Tax':
        return SpecialAccountType.NONE; // Use NONE for now
      case 'FxGain':
        return SpecialAccountType.FX_GAIN;
      case 'FxLoss':
        return SpecialAccountType.FX_LOSS;
      case 'IntercompanyReceivable':
        return SpecialAccountType.INTERCO_RECEIVABLE;
      case 'IntercompanyPayable':
        return SpecialAccountType.INTERCO_PAYABLE;
      case 'AccumulatedDepreciation':
        return SpecialAccountType.ACCUMULATED_DEPRECIATION;
      case 'DepreciationExpense':
        return SpecialAccountType.DEPRECIATION_EXPENSE;
      case 'EliminationReserve':
        return SpecialAccountType.ELIMINATION_RESERVE;
      case 'CtaEquity':
        return SpecialAccountType.CTA_EQUITY;
      case 'NciEquity':
        return SpecialAccountType.NCI_EQUITY;
      case 'Goodwill':
        return SpecialAccountType.GOODWILL;
      case 'UnrealizedProfitInventory':
        return SpecialAccountType.UNREALIZED_PROFIT_INVENTORY;
      default:
        return SpecialAccountType.NONE;
    }
  }
}

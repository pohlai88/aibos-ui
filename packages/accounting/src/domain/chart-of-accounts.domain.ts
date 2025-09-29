import type { DomainEvent } from '@aibos/eventsourcing';

import { type CreateAccountCommand } from '../commands/create-account.command';
import { AccountCompanionLinksSetEvent } from '../events/account-companion-links-set.event';
import { AccountCreatedEvent } from '../events/account-created.event';
import { AccountParentChangedEvent } from '../events/account-parent-changed.event';
import { AccountPostingPolicyChangedEvent } from '../events/account-posting-policy-changed.event';
import {
  AccountBalanceUpdatedEvent,
  AccountStateUpdatedEvent,
} from '../events/account-updated.event';
import { AccountType, SpecialAccountType } from './account.domain';
import { Account } from './account.domain';
import { AggregateRoot } from '@aibos/eventsourcing';
import { omitUndefined, hasItems } from '../utils';
import { 
  createBusinessError,
  type ErrorContext 
} from '../utils/error-utilities';

// Constants for error messages
const ACCOUNT_NOT_FOUND_MESSAGE = 'Account {accountCode} not found';
const ACCOUNT_INACTIVE_MESSAGE = 'Account {accountCode} is not active';
const UPDATE_ACCOUNT_BALANCE_OPERATION = 'update-account-balance';
const ACCOUNT_NOT_FOUND_OPERATION = 'account-not-found';
const ACCOUNT_NOT_FOUND_ERROR_CODE = 'ACCOUNT_NOT_FOUND';
const ACCOUNT_CODE_PARAM = 'accountCode';

// Helper functions to format messages
const formatAccountNotFoundMessage = (accountCode: string): string => 
  ACCOUNT_NOT_FOUND_MESSAGE.replace('{accountCode}', accountCode);

const formatAccountInactiveMessage = (accountCode: string): string =>
  ACCOUNT_INACTIVE_MESSAGE.replace('{accountCode}', accountCode);

export class ChartOfAccounts extends AggregateRoot {
  private accounts: Map<string, Account> = new Map();
  private accountHierarchy: Map<string, string[]> = new Map();
  private static readonly MAX_DEPTH = 5;

  constructor(
    id: string,
    public readonly _tenantId: string = '',
    public readonly _userId: string = '',
    version: number = 0,
  ) {
    super(id, version);
  }

  public createAccount(command: CreateAccountCommand): void {
    command.validate();
    
    const context: ErrorContext = {
      operation: 'create-account',
      userId: command.userId,
      tenantId: command.tenantId,
      data: { accountCode: command.accountCode, accountType: command.accountType }
    };

    // Guard: ensure the command matches this aggregate's tenant
    if (this._tenantId && command.tenantId !== this._tenantId) {
      throw createBusinessError(
        'TENANT_MISMATCH',
        `Tenant mismatch: aggregate=${this._tenantId}, command=${command.tenantId}`,
        'ChartOfAccounts',
        context
      );
    }
    this.validateAccountCreation(command);
    this.validateDepth(command.parentAccountCode);

    const account = new Account(
      omitUndefined({
        accountCode: command.accountCode,
        accountName: command.accountName,
        accountType: command.accountType,
        parentAccountCode: command.parentAccountCode,
        tenantId: command.tenantId,
        isActive: true,
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        specialAccountType: command.specialAccountType,
        postingAllowed: command.postingAllowed,
        companionLinks: command.companionLinks,
      }),
    );

    this.accounts.set(command.accountCode, account);
    this.updateHierarchy(command.accountCode, command.parentAccountCode);

    this.addEvent(
      new AccountCreatedEvent(
        command.accountCode,
        command.accountName,
        command.accountType,
        command.parentAccountCode,
        command.tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public updateAccountBalance(accountCode: string, amount: number): void {
    const account = this.accounts.get(accountCode);
    if (!account) {
      throw createBusinessError(
        ACCOUNT_NOT_FOUND_ERROR_CODE,
        formatAccountNotFoundMessage(accountCode),
        ACCOUNT_CODE_PARAM,
        { operation: UPDATE_ACCOUNT_BALANCE_OPERATION }
      );
    }

    if (!account.isActive) {
      throw createBusinessError(
        'ACCOUNT_INACTIVE',
        formatAccountInactiveMessage(accountCode),
        ACCOUNT_CODE_PARAM,
        { operation: UPDATE_ACCOUNT_BALANCE_OPERATION }
      );
    }

    // Posting rule: cannot post to accounts that have children (headers) or when posting is not allowed
    const hasChildren = hasItems(this.accountHierarchy.get(accountCode) || []);
    if (hasChildren) {
      throw createBusinessError(
        'POSTING_TO_HEADER_ACCOUNT',
        `Cannot post to header account ${accountCode} (has child accounts)`,
        ACCOUNT_CODE_PARAM,
        { operation: UPDATE_ACCOUNT_BALANCE_OPERATION }
      );
    }
    if (!account.postingAllowed) {
      throw createBusinessError(
        'POSTING_BLOCKED_BY_POLICY',
        `Posting is blocked by policy on account ${accountCode}`,
        ACCOUNT_CODE_PARAM,
        { operation: UPDATE_ACCOUNT_BALANCE_OPERATION }
      );
    }

    const updatedAccount = account.updateBalance(amount);
    updatedAccount.validateBalance();

    this.accounts.set(accountCode, updatedAccount);

    this.addEvent(
      new AccountBalanceUpdatedEvent(
        ACCOUNT_CODE_PARAM,
        updatedAccount.balance,
        this.id,
        this.getVersion() + 1,
        this._tenantId,
      ),
    );
  }

  public deactivateAccount(accountCode: string): void {
    const account = this.accounts.get(accountCode);
    if (!account) {
      throw createBusinessError(
        ACCOUNT_NOT_FOUND_ERROR_CODE,
        formatAccountNotFoundMessage(accountCode),
        ACCOUNT_CODE_PARAM,
        { operation: 'deactivate-account' }
      );
    }

    if (!account.isActive) {
      throw createBusinessError(
        'ACCOUNT_ALREADY_INACTIVE',
        `Account ${accountCode} is already inactive`,
        ACCOUNT_CODE_PARAM,
        { operation: 'account-already-inactive' }
      );
    }

    // Check if account has children
    const children = this.accountHierarchy.get(accountCode) || [];
    if (hasItems(children)) {
      throw createBusinessError(
        'CANNOT_DEACTIVATE_ACCOUNT_WITH_CHILDREN',
        `Cannot deactivate account ${accountCode} with active child accounts`,
        ACCOUNT_CODE_PARAM,
        { operation: 'cannot-deactivate-account-with-children' }
      );
    }

    const deactivatedAccount = account.deactivate();
    this.accounts.set(accountCode, deactivatedAccount);

    this.addEvent(
      new AccountStateUpdatedEvent(
        ACCOUNT_CODE_PARAM,
        deactivatedAccount.accountName,
        deactivatedAccount.accountType,
        deactivatedAccount.parentAccountCode,
        deactivatedAccount.isActive,
        this.id,
        this.getVersion() + 1,
        this._tenantId,
      ),
    );
  }

  /** Move an account to a new parent (or detach to root) */
  public changeAccountParent(accountCode: string, newParentAccountCode?: string): void {
    const account = this.accounts.get(accountCode);
    if (!account) {
      throw createBusinessError(
        ACCOUNT_NOT_FOUND_ERROR_CODE,
        formatAccountNotFoundMessage(accountCode),
        ACCOUNT_CODE_PARAM,
        { operation: ACCOUNT_NOT_FOUND_OPERATION }
      );
    }
    if (!account.isActive) {
      throw createBusinessError(
        'ACCOUNT_INACTIVE',
        formatAccountInactiveMessage(accountCode),
        ACCOUNT_CODE_PARAM,
        { operation: 'account-inactive' }
      );
    }

    const oldParent = account.parentAccountCode;
    if (oldParent === newParentAccountCode) return; // no-op

    if (newParentAccountCode) {
      const parent = this.accounts.get(newParentAccountCode);
      if (!parent) {
        throw createBusinessError(
        'PARENT_ACCOUNT_NOT_FOUND',
        `Parent account ${newParentAccountCode} does not exist`,
        ACCOUNT_CODE_PARAM,
        { operation: 'parent-account-not-found' }
      );
      }
      if (!parent.isActive) {
        throw createBusinessError(
        'PARENT_ACCOUNT_INACTIVE',
        `Parent account ${newParentAccountCode} is not active`,
        ACCOUNT_CODE_PARAM,
        { operation: 'parent-account-inactive' }
      );
      }
      // Type hierarchy check
      this.validateAccountTypeHierarchy(account.accountType, parent.accountType);
      // Cycle check
      this.guardNoCycle(accountCode, newParentAccountCode);
      // Depth check
      this.validateDepth(newParentAccountCode);
    }

    // Update in-memory hierarchy
    this.rewireHierarchy(accountCode, oldParent, newParentAccountCode);

    // Emit explicit parent-changed event
    this.addEvent(
      new AccountParentChangedEvent(
        ACCOUNT_CODE_PARAM,
        oldParent,
        newParentAccountCode,
        this.id,
        this.getVersion() + 1,
        this._tenantId,
      ),
    );
  }

  /** Governance: toggle posting policy (e.g., lock control accounts) */
  public setPostingPolicy(accountCode: string, postingAllowed: boolean): void {
    const account = this.accounts.get(accountCode);
    if (!account) {
      throw createBusinessError(
        ACCOUNT_NOT_FOUND_ERROR_CODE,
        formatAccountNotFoundMessage(accountCode),
        ACCOUNT_CODE_PARAM,
        { operation: ACCOUNT_NOT_FOUND_OPERATION }
      );
    }
    if (account.postingAllowed === postingAllowed) return; // no-op

    this.addEvent(
      new AccountPostingPolicyChangedEvent(
        ACCOUNT_CODE_PARAM,
        postingAllowed,
        this.id,
        this.getVersion() + 1,
        this._tenantId,
      ),
    );
  }

  /** Set/replace companion links (e.g., depreciation trio, AR allowance) */
  public setCompanionLinks(
    accountCode: string,
    links: NonNullable<Account['companionLinks']>,
  ): void {
    const accumulator = this.accounts.get(accountCode);
    if (!accumulator) {
      throw createBusinessError(
        ACCOUNT_NOT_FOUND_ERROR_CODE,
        formatAccountNotFoundMessage(accountCode),
        ACCOUNT_CODE_PARAM,
        { operation: ACCOUNT_NOT_FOUND_OPERATION }
      );
    }

    // Minimal shape check; deeper checks reuse creation rules
    if (!!links.accumulatedDepreciationCode !== !!links.depreciationExpenseCode) {
      throw createBusinessError(
        'INCOMPLETE_COMPANION_LINKS',
        'Both accumulatedDepreciationCode and depreciationExpenseCode must be provided together',
        ACCOUNT_CODE_PARAM,
        { operation: 'incomplete-companion-links' }
      );
    }

    // Emit event; on apply we'll re-validate existence and types
    this.addEvent(
      new AccountCompanionLinksSetEvent(
        ACCOUNT_CODE_PARAM,
        this.id,
        this.getVersion() + 1,
        this._tenantId,
        links.accumulatedDepreciationCode,
        links.depreciationExpenseCode,
        links.allowanceAccountCode,
      ),
    );
  }

  public getAccount(accountCode: string): Account | undefined {
    return this.accounts.get(accountCode);
  }

  public getAllAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  public getActiveAccounts(): Account[] {
    return this.getAllAccounts().filter((account) => account.isActive);
  }

  public getAccountsByType(accountType: AccountType): Account[] {
    return this.getAllAccounts().filter((account) => account.accountType === accountType);
  }

  public getChildAccounts(parentAccountCode: string): Account[] {
    const childCodes = this.accountHierarchy.get(parentAccountCode) || [];
    return childCodes.map((code) => this.accounts.get(code)).filter(Boolean) as Account[];
  }

  public validateAccountExists(accountCode: string): void {
    if (!this.accounts.has(accountCode)) {
      throw createBusinessError(
        ACCOUNT_NOT_FOUND_ERROR_CODE,
        `Account ${accountCode} does not exist`,
        ACCOUNT_CODE_PARAM,
        { operation: ACCOUNT_NOT_FOUND_OPERATION }
      );
    }
  }

  public validateAccountActive(accountCode: string): void {
    const account = this.accounts.get(accountCode);
    if (!account) {
      throw createBusinessError(
        ACCOUNT_NOT_FOUND_ERROR_CODE,
        `Account ${accountCode} does not exist`,
        ACCOUNT_CODE_PARAM,
        { operation: ACCOUNT_NOT_FOUND_OPERATION }
      );
    }

    if (!account.isActive) {
      throw createBusinessError(
        'ACCOUNT_INACTIVE',
        formatAccountInactiveMessage(accountCode),
        ACCOUNT_CODE_PARAM,
        { operation: 'account-inactive' }
      );
    }
  }

  private validateAccountCreation(command: CreateAccountCommand): void {
    const context: ErrorContext = {
      operation: 'validate-account-creation',
      userId: command.userId,
      tenantId: command.tenantId,
      data: { accountCode: command.accountCode, accountType: command.accountType }
    };

    if (this.accounts.has(command.accountCode)) {
      throw createBusinessError(
        'ACCOUNT_CODE_EXISTS',
        `Account code ${command.accountCode} already exists`,
        'ChartOfAccounts',
        context
      );
    }

    if (command.parentAccountCode) {
      const parentAccount = this.accounts.get(command.parentAccountCode);
      if (!parentAccount) {
        throw createBusinessError(
          'PARENT_ACCOUNT_NOT_FOUND',
          `Parent account ${command.parentAccountCode} does not exist`,
          'ChartOfAccounts',
          context
        );
      }

      if (!parentAccount.isActive) {
        throw createBusinessError(
          'PARENT_ACCOUNT_INACTIVE',
          `Parent account ${command.parentAccountCode} is not active`,
          'ChartOfAccounts',
          context
        );
      }

      // Validate account type hierarchy
      this.validateAccountTypeHierarchy(command.accountType, parentAccount.accountType);
    }

    // Optional companion enforcement (when provided at creation time)
    // If caller provides companion codes in AccountProperties, validate they exist and are compatible.
    const special = command.specialAccountType ?? SpecialAccountType.NONE;
    const links = command.companionLinks;

    // If creating an Accumulated Depreciation account
    if (special === SpecialAccountType.ACCUMULATED_DEPRECIATION) {
      if (command.accountType !== AccountType.ASSET) {
        throw createBusinessError(
        'INVALID_ACCOUNT_TYPE_FOR_ACCUMULATED_DEPRECIATION',
        'Accumulated Depreciation must be created as base type Asset (contra-asset).',
        command.accountCode,
        { operation: 'invalid-account-type-for-accumulated-depreciation' }
      );
      }
    }
    // If creating a Depreciation Expense account
    if (special === SpecialAccountType.DEPRECIATION_EXPENSE) {
      if (command.accountType !== AccountType.EXPENSE) {
        throw createBusinessError(
        'INVALID_ACCOUNT_TYPE_FOR_DEPRECIATION_EXPENSE',
        'Depreciation Expense must be created as an Expense.',
        command.accountCode,
        { operation: 'invalid-account-type-for-depreciation-expense' }
      );
      }
    }

    // If creating a depreciable asset (opt-in via links), both links must be present and valid
    if (links?.accumulatedDepreciationCode || links?.depreciationExpenseCode) {
      if (!links?.accumulatedDepreciationCode || !links?.depreciationExpenseCode) {
        throw createBusinessError(
        'INCOMPLETE_DEPRECIATION_LINKS',
        'Depreciable asset requires both accumulatedDepreciationCode and depreciationExpenseCode.',
        command.accountCode,
        { operation: 'incomplete-depreciation-links' }
      );
      }
      const accumulatorDep = this.accounts.get(links.accumulatedDepreciationCode);
      const depExp = this.accounts.get(links.depreciationExpenseCode);
      if (!accumulatorDep) {
        throw createBusinessError(
        'ACCUMULATED_DEPRECIATION_ACCOUNT_NOT_FOUND',
        `Accumulated Depreciation account ${links.accumulatedDepreciationCode} not found`,
        command.accountCode,
        { operation: 'accumulated-depreciation-account-not-found' }
      );
      }
      if (!depExp) {
        throw createBusinessError(
        'DEPRECIATION_EXPENSE_ACCOUNT_NOT_FOUND',
        `Depreciation Expense account ${links.depreciationExpenseCode} not found`,
        command.accountCode,
        { operation: 'depreciation-expense-account-not-found' }
      );
      }
      if (accumulatorDep.specialAccountType !== SpecialAccountType.ACCUMULATED_DEPRECIATION) {
        throw createBusinessError(
        'INVALID_ACCUMULATED_DEPRECIATION_TYPE',
        `Account ${accumulatorDep.accountCode} must be SpecialAccountType=AccumulatedDepreciation`,
        command.accountCode,
        { operation: 'invalid-accumulated-depreciation-type' }
      );
      }
      if (depExp.specialAccountType !== SpecialAccountType.DEPRECIATION_EXPENSE) {
        throw createBusinessError(
        'INVALID_DEPRECIATION_EXPENSE_TYPE',
        `Account ${depExp.accountCode} must be SpecialAccountType=DepreciationExpense`,
        command.accountCode,
        { operation: 'invalid-depreciation-expense-type' }
      );
      }
    }
  }

  private validateAccountTypeHierarchy(childType: AccountType, parentType: AccountType): void {
    // Basic validation - can be enhanced with more complex rules
    const validHierarchies = new Map<AccountType, AccountType[]>([
      [AccountType.ASSET, [AccountType.ASSET]],
      [AccountType.LIABILITY, [AccountType.LIABILITY]],
      [AccountType.EQUITY, [AccountType.EQUITY]],
      [AccountType.REVENUE, [AccountType.REVENUE]],
      [AccountType.EXPENSE, [AccountType.EXPENSE]],
    ]);

    const allowedTypes = validHierarchies.get(parentType);
    if (!allowedTypes?.includes(childType)) {
      throw createBusinessError(
        'INVALID_ACCOUNT_TYPE_HIERARCHY',
        `Account type ${childType} is not valid under parent type ${parentType}`,
        childType,
        { operation: 'invalid-account-type-hierarchy' }
      );
    }
  }

  private validateDepth(parentAccountCode?: string): void {
    const depth = this.computeDepth(parentAccountCode);
    if (depth >= ChartOfAccounts.MAX_DEPTH) {
      throw createBusinessError(
        'DEPTH_LIMIT_EXCEEDED',
        `Depth limit exceeded: parent depth=${depth}. Max allowed is ${ChartOfAccounts.MAX_DEPTH}`,
        parentAccountCode,
        { operation: 'depth-limit-exceeded' }
      );
    }
  }

  private computeDepth(accountCode?: string): number {
    let d = 0;
    let current = accountCode;
    while (current) {
      const parent = this.findParentOf(current);
      d += 1;
      current = parent ?? undefined;
      if (d > 64) {
        throw createBusinessError(
        'HIERARCHY_TOO_DEEP_OR_CYCLIC',
        'Hierarchy appears cyclic or too deep',
        ACCOUNT_CODE_PARAM,
        { operation: 'hierarchy-too-deep-or-cyclic' }
      );
      }
    }
    return d;
  }

  private findParentOf(childCode: string): string | undefined {
    for (const [parent, children] of this.accountHierarchy.entries()) {
      if ((children || []).includes(childCode)) return parent;
    }
    return undefined;
  }

  private guardNoCycle(movingCode: string, newParentCode: string): void {
    // Walk upward from newParent; if we hit movingCode, that would create a cycle
    let cursor: string | undefined = newParentCode;
    let hops = 0;
    while (cursor) {
      if (cursor === movingCode) {
        throw createBusinessError(
        'CYCLE_DETECTED',
        `Cycle detected: cannot make ${newParentCode} a parent of ${movingCode}`,
        movingCode,
        { operation: 'cycle-detected' }
      );
      }
      cursor = this.findParentOf(cursor);
      if (++hops > 64) {
        throw createBusinessError(
        'HIERARCHY_TOO_DEEP_OR_CYCLIC',
        'Hierarchy appears cyclic or too deep',
        movingCode,
        { operation: 'hierarchy-too-deep-or-cyclic' }
      );
      }
    }
  }

  private updateHierarchy(accountCode: string, parentAccountCode?: string): void {
    if (parentAccountCode) {
      const siblings = this.accountHierarchy.get(parentAccountCode) || [];
      if (!siblings.includes(accountCode)) {
        siblings.push(accountCode);
        this.accountHierarchy.set(parentAccountCode, siblings);
      }
    }
  }

  private rewireHierarchy(accountCode: string, oldParent?: string, newParent?: string): void {
    // remove from old parent
    if (oldParent) {
      const oldSiblings = this.accountHierarchy.get(oldParent) || [];
      this.accountHierarchy.set(
        oldParent,
        oldSiblings.filter((c) => c !== accountCode),
      );
    }
    // add to new parent
    if (newParent) {
      const newSiblings = this.accountHierarchy.get(newParent) || [];
      if (!newSiblings.includes(accountCode)) {
        newSiblings.push(accountCode);
        this.accountHierarchy.set(newParent, newSiblings);
      }
    }
    // Update the stored account instance to reflect parent
    const account = this.accounts.get(accountCode);
    if (account) {
      const updated = new Account(
        omitUndefined({
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          parentAccountCode: newParent,
          tenantId: account.tenantId,
          isActive: account.isActive,
          balance: account.balance,
          createdAt: account.createdAt,
          updatedAt: new Date(),
        }),
      );
      this.accounts.set(accountCode, updated);
    }
  }

  // Unify event application: AggregateRoot will call this for new events
  protected override apply(event: DomainEvent): void {
    if (event instanceof AccountCreatedEvent) {
      this.whenAccountCreated(event);
      return;
    }
    if (event instanceof AccountBalanceUpdatedEvent) {
      this.whenAccountBalanceUpdated(event);
      return;
    }
    if (event instanceof AccountStateUpdatedEvent) {
      this.whenAccountStateUpdated(event);
      return;
    }
    if (event instanceof AccountParentChangedEvent) {
      this.whenAccountParentChanged(event);
      return;
    }
    if (event instanceof AccountPostingPolicyChangedEvent) {
      this.whenAccountPostingPolicyChanged(event);
      return;
    }
    if (event instanceof AccountCompanionLinksSetEvent) {
      this.whenAccountCompanionLinksSet(event);
      return;
    }
    // Unknown events are ignored here by design (or throw if preferred)
  }

  public static fromEventsStream(streamId: string, events: DomainEvent[]): ChartOfAccounts {
    const tenantId = streamId.replace('chart-of-accounts-', '');
    const chartOfAccounts = new ChartOfAccounts(streamId, tenantId, 'system');
    // Replay using the same handlers (no event registration)
    for (const event of events) {
      chartOfAccounts.replay(event);
    }
    // Set the version to the number of events replayed
    (chartOfAccounts as unknown as { version: number }).version = events.length;
    return chartOfAccounts;
  }

  // Public-safe replay that doesn't raise new changes/version
  private replay(event: DomainEvent): void {
    if (event instanceof AccountCreatedEvent) {
      this.whenAccountCreated(event);
    } else if (event instanceof AccountBalanceUpdatedEvent) {
      this.whenAccountBalanceUpdated(event);
    } else if (event instanceof AccountStateUpdatedEvent) {
      this.whenAccountStateUpdated(event);
    } else if (event instanceof AccountParentChangedEvent) {
      this.whenAccountParentChanged(event);
    } else if (event instanceof AccountPostingPolicyChangedEvent) {
      this.whenAccountPostingPolicyChanged(event);
    } else if (event instanceof AccountCompanionLinksSetEvent) {
      this.whenAccountCompanionLinksSet(event);
    }
  }

  private whenAccountCreated(event: AccountCreatedEvent): void {
    const account = new Account(
      omitUndefined({
        accountCode: event.accountCode,
        accountName: event.accountName,
        accountType: event.accountType,
        parentAccountCode: event.parentAccountCode,
        tenantId: event.tenantId,
        isActive: true,
        balance: 0,
        createdAt: event.occurredAt,
        updatedAt: event.occurredAt,
      }),
    );

    this.accounts.set(event.accountCode, account);
    this.updateHierarchy(event.accountCode, event.parentAccountCode);
  }

  private whenAccountBalanceUpdated(event: AccountBalanceUpdatedEvent): void {
    const existing = this.accounts.get(event.accountCode);
    if (!existing) return;
    const updated = new Account(
      omitUndefined({
        ...{
          accountCode: existing.accountCode,
          accountName: existing.accountName,
          accountType: existing.accountType,
          parentAccountCode: existing.parentAccountCode,
          tenantId: existing.tenantId,
          isActive: existing.isActive,
          createdAt: existing.createdAt,
        },
        balance: event.balance,
        updatedAt: event.occurredAt,
      }),
    );
    this.accounts.set(event.accountCode, updated);
  }

  private whenAccountStateUpdated(event: AccountStateUpdatedEvent): void {
    const existing = this.accounts.get(event.accountCode);
    const createdAt = existing?.createdAt ?? event.occurredAt;
    const updated = new Account(
      omitUndefined({
        accountCode: event.accountCode,
        accountName: event.accountName,
        accountType: event.accountType,
        parentAccountCode: event.parentAccountCode,
        tenantId: event.tenantId,
        isActive: event.isActive,
        balance: existing?.balance ?? 0,
        createdAt,
        updatedAt: event.occurredAt,
      }),
    );
    this.accounts.set(event.accountCode, updated);
    // keep hierarchy in sync if parent was changed inside state update
    if (existing?.parentAccountCode !== event.parentAccountCode) {
      this.rewireHierarchy(event.accountCode, existing?.parentAccountCode, event.parentAccountCode);
    }
  }

  private whenAccountParentChanged(event: AccountParentChangedEvent): void {
    this.rewireHierarchy(event.accountCode, event.oldParentAccountCode, event.newParentAccountCode);
  }

  private whenAccountPostingPolicyChanged(event: AccountPostingPolicyChangedEvent): void {
    const accumulator = this.accounts.get(event.accountCode);
    if (!accumulator) return;
    const updated = new Account(
      omitUndefined({
        accountCode: accumulator.accountCode,
        accountName: accumulator.accountName,
        accountType: accumulator.accountType,
        parentAccountCode: accumulator.parentAccountCode,
        tenantId: accumulator.tenantId,
        isActive: accumulator.isActive,
        balance: accumulator.balance,
        createdAt: accumulator.createdAt,
        updatedAt: event.occurredAt,
        specialAccountType: accumulator.specialAccountType,
        postingAllowed: event.postingAllowed,
        companionLinks: accumulator.companionLinks,
      }),
    );
    this.accounts.set(event.accountCode, updated);
  }

  private whenAccountCompanionLinksSet(event: AccountCompanionLinksSetEvent): void {
    // Validate existence/types if provided
    const check = (code?: string | null) => (code ? this.accounts.get(code) : undefined);
    const accumulatorDep = check(event.accumulatedDepreciationCode);
    const depExp = check(event.depreciationExpenseCode);
    if (event.accumulatedDepreciationCode && !accumulatorDep) {
      throw createBusinessError(
        'ACCUMULATED_DEPRECIATION_ACCOUNT_NOT_FOUND',
        `Accumulated Depreciation account ${event.accumulatedDepreciationCode} not found`,
        event.accountCode,
        { operation: 'accumulated-depreciation-account-not-found' }
      );
    }
    if (event.depreciationExpenseCode && !depExp) {
      throw createBusinessError(
        'DEPRECIATION_EXPENSE_ACCOUNT_NOT_FOUND',
        `Depreciation Expense account ${event.depreciationExpenseCode} not found`,
        event.accountCode,
        { operation: 'depreciation-expense-account-not-found' }
      );
    }
    if (
      accumulatorDep &&
      accumulatorDep.specialAccountType !== SpecialAccountType.ACCUMULATED_DEPRECIATION
    ) {
      throw createBusinessError(
        'INVALID_ACCUMULATED_DEPRECIATION_TYPE',
        `Account ${accumulatorDep.accountCode} must be SpecialAccountType=AccumulatedDepreciation`,
        event.accountCode,
        { operation: 'invalid-accumulated-depreciation-type' }
      );
    }
    if (depExp && depExp.specialAccountType !== SpecialAccountType.DEPRECIATION_EXPENSE) {
      throw createBusinessError(
        'INVALID_DEPRECIATION_EXPENSE_TYPE',
        `Account ${depExp.accountCode} must be SpecialAccountType=DepreciationExpense`,
        event.accountCode,
        { operation: 'invalid-depreciation-expense-type' }
      );
    }

    const accumulator = this.accounts.get(event.accountCode);
    if (!accumulator) return;
    const updated = new Account(
      omitUndefined({
        accountCode: accumulator.accountCode,
        accountName: accumulator.accountName,
        accountType: accumulator.accountType,
        parentAccountCode: accumulator.parentAccountCode,
        tenantId: accumulator.tenantId,
        isActive: accumulator.isActive,
        balance: accumulator.balance,
        createdAt: accumulator.createdAt,
        updatedAt: event.occurredAt,
        specialAccountType: accumulator.specialAccountType,
        postingAllowed: accumulator.postingAllowed,
        companionLinks: omitUndefined({
          accumulatedDepreciationCode: event.accumulatedDepreciationCode || undefined,
          depreciationExpenseCode: event.depreciationExpenseCode || undefined,
          allowanceAccountCode: event.allowanceAccountCode || undefined,
        }),
      }),
    );
    this.accounts.set(event.accountCode, updated);
  }
}

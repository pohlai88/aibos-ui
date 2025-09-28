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
import { omitUndefined } from '../utils';

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
    // Guard: ensure the command matches this aggregate's tenant
    if (this._tenantId && command.tenantId !== this._tenantId) {
      throw new Error(`Tenant mismatch: aggregate=${this._tenantId}, command=${command.tenantId}`);
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
      throw new Error(`Account ${accountCode} not found`);
    }

    if (!account.isActive) {
      throw new Error(`Account ${accountCode} is not active`);
    }

    // Posting rule: cannot post to accounts that have children (headers) or when posting is not allowed
    const hasChildren = (this.accountHierarchy.get(accountCode) || []).length > 0;
    if (hasChildren) {
      throw new Error(`Cannot post to header account ${accountCode} (has child accounts)`);
    }
    if (!account.postingAllowed) {
      throw new Error(`Posting is blocked by policy on account ${accountCode}`);
    }

    const updatedAccount = account.updateBalance(amount);
    updatedAccount.validateBalance();

    this.accounts.set(accountCode, updatedAccount);

    this.addEvent(
      new AccountBalanceUpdatedEvent(
        accountCode,
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
      throw new Error(`Account ${accountCode} not found`);
    }

    if (!account.isActive) {
      throw new Error(`Account ${accountCode} is already inactive`);
    }

    // Check if account has children
    const children = this.accountHierarchy.get(accountCode) || [];
    if (children.length > 0) {
      throw new Error(`Cannot deactivate account ${accountCode} with active child accounts`);
    }

    const deactivatedAccount = account.deactivate();
    this.accounts.set(accountCode, deactivatedAccount);

    this.addEvent(
      new AccountStateUpdatedEvent(
        accountCode,
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
    if (!account) throw new Error(`Account ${accountCode} not found`);
    if (!account.isActive) throw new Error(`Account ${accountCode} is not active`);

    const oldParent = account.parentAccountCode;
    if (oldParent === newParentAccountCode) return; // no-op

    if (newParentAccountCode) {
      const parent = this.accounts.get(newParentAccountCode);
      if (!parent) throw new Error(`Parent account ${newParentAccountCode} does not exist`);
      if (!parent.isActive) throw new Error(`Parent account ${newParentAccountCode} is not active`);
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
        accountCode,
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
    if (!account) throw new Error(`Account ${accountCode} not found`);
    if (account.postingAllowed === postingAllowed) return; // no-op

    this.addEvent(
      new AccountPostingPolicyChangedEvent(
        accountCode,
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
    if (!accumulator) throw new Error(`Account ${accountCode} not found`);

    // Minimal shape check; deeper checks reuse creation rules
    if (!!links.accumulatedDepreciationCode !== !!links.depreciationExpenseCode) {
      throw new Error(
        'Both accumulatedDepreciationCode and depreciationExpenseCode must be provided together',
      );
    }

    // Emit event; on apply we'll re-validate existence and types
    this.addEvent(
      new AccountCompanionLinksSetEvent(
        accountCode,
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
      throw new Error(`Account ${accountCode} does not exist`);
    }
  }

  public validateAccountActive(accountCode: string): void {
    const account = this.accounts.get(accountCode);
    if (!account) {
      throw new Error(`Account ${accountCode} does not exist`);
    }

    if (!account.isActive) {
      throw new Error(`Account ${accountCode} is not active`);
    }
  }

  private validateAccountCreation(command: CreateAccountCommand): void {
    if (this.accounts.has(command.accountCode)) {
      throw new Error(`Account code ${command.accountCode} already exists`);
    }

    if (command.parentAccountCode) {
      const parentAccount = this.accounts.get(command.parentAccountCode);
      if (!parentAccount) {
        throw new Error(`Parent account ${command.parentAccountCode} does not exist`);
      }

      if (!parentAccount.isActive) {
        throw new Error(`Parent account ${command.parentAccountCode} is not active`);
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
        throw new Error(
          'Accumulated Depreciation must be created as base type Asset (contra-asset).',
        );
      }
    }
    // If creating a Depreciation Expense account
    if (special === SpecialAccountType.DEPRECIATION_EXPENSE) {
      if (command.accountType !== AccountType.EXPENSE) {
        throw new Error('Depreciation Expense must be created as an Expense.');
      }
    }

    // If creating a depreciable asset (opt-in via links), both links must be present and valid
    if (links?.accumulatedDepreciationCode || links?.depreciationExpenseCode) {
      if (!links?.accumulatedDepreciationCode || !links?.depreciationExpenseCode) {
        throw new Error(
          'Depreciable asset requires both accumulatedDepreciationCode and depreciationExpenseCode.',
        );
      }
      const accumulatorDep = this.accounts.get(links.accumulatedDepreciationCode);
      const depExp = this.accounts.get(links.depreciationExpenseCode);
      if (!accumulatorDep)
        throw new Error(
          `Accumulated Depreciation account ${links.accumulatedDepreciationCode} not found`,
        );
      if (!depExp)
        throw new Error(`Depreciation Expense account ${links.depreciationExpenseCode} not found`);
      if (accumulatorDep.specialAccountType !== SpecialAccountType.ACCUMULATED_DEPRECIATION) {
        throw new Error(
          `Account ${accumulatorDep.accountCode} must be SpecialAccountType=AccumulatedDepreciation`,
        );
      }
      if (depExp.specialAccountType !== SpecialAccountType.DEPRECIATION_EXPENSE) {
        throw new Error(
          `Account ${depExp.accountCode} must be SpecialAccountType=DepreciationExpense`,
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
      throw new Error(`Account type ${childType} is not valid under parent type ${parentType}`);
    }
  }

  private validateDepth(parentAccountCode?: string): void {
    const depth = this.computeDepth(parentAccountCode);
    if (depth >= ChartOfAccounts.MAX_DEPTH) {
      throw new Error(
        `Depth limit exceeded: parent depth=${depth}. Max allowed is ${ChartOfAccounts.MAX_DEPTH}`,
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
      if (d > 64) throw new Error('Hierarchy appears cyclic or too deep'); // safety cap
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
        throw new Error(`Cycle detected: cannot make ${newParentCode} a parent of ${movingCode}`);
      }
      cursor = this.findParentOf(cursor);
      if (++hops > 64) throw new Error('Hierarchy appears cyclic or too deep');
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
      throw new Error(
        `Accumulated Depreciation account ${event.accumulatedDepreciationCode} not found`,
      );
    }
    if (event.depreciationExpenseCode && !depExp) {
      throw new Error(`Depreciation Expense account ${event.depreciationExpenseCode} not found`);
    }
    if (
      accumulatorDep &&
      accumulatorDep.specialAccountType !== SpecialAccountType.ACCUMULATED_DEPRECIATION
    ) {
      throw new Error(
        `Account ${accumulatorDep.accountCode} must be SpecialAccountType=AccumulatedDepreciation`,
      );
    }
    if (depExp && depExp.specialAccountType !== SpecialAccountType.DEPRECIATION_EXPENSE) {
      throw new Error(
        `Account ${depExp.accountCode} must be SpecialAccountType=DepreciationExpense`,
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
        companionLinks: {
          accumulatedDepreciationCode: event.accumulatedDepreciationCode ?? undefined,
          depreciationExpenseCode: event.depreciationExpenseCode ?? undefined,
          allowanceAccountCode: event.allowanceAccountCode ?? undefined,
        },
      }),
    );
    this.accounts.set(event.accountCode, updated);
  }
}

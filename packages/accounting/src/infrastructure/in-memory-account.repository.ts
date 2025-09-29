import type { Account, AccountRepository } from '@aibos/accounting';

export class InMemoryAccountRepository implements AccountRepository {
  private accounts: Map<string, Account> = new Map();

  async findByCode(accountCode: string, tenantId: string): Promise<Account | null> {
    const key = `${tenantId}:${accountCode}`;
    return this.accounts.get(key) || null;
  }

  async findAllByCodes(
    codes: ReadonlyArray<string>,
    tenantId: string,
  ): Promise<ReadonlyArray<Account>> {
    const foundAccounts: Account[] = [];
    for (const code of codes) {
      const key = `${tenantId}:${code}`;
      const account = this.accounts.get(key);
      if (account) {
        foundAccounts.push(account);
      }
    }
    return foundAccounts;
  }

  async findByTenant(tenantId: string): Promise<Account[]> {
    const tenantAccounts: Account[] = [];
    for (const [key, account] of this.accounts) {
      if (key.startsWith(`${tenantId}:`)) {
        tenantAccounts.push(account);
      }
    }
    return tenantAccounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }

  async save(account: Account): Promise<void> {
    const key = `${account.tenantId}:${account.accountCode}`;
    this.accounts.set(key, account);
  }

  async updateBalance(accountCode: string, amount: number, tenantId: string): Promise<void> {
    const key = `${tenantId}:${accountCode}`;
    const account = this.accounts.get(key);
    if (account) {
      const updatedAccount = account.updateBalance(amount);
      this.accounts.set(key, updatedAccount);
    }
  }
}

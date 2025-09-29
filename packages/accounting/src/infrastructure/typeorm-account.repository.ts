import { AccountEntity } from './account.entity';
import { type Account, type AccountRepository } from '@aibos/accounting';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, type Repository } from 'typeorm';

@Injectable()
export class TypeormAccountRepository implements AccountRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repo: Repository<AccountEntity>,
  ) {}

  async findByCode(code: string, tenantId: string): Promise<Account | null> {
    const row = await this.repo.findOne({ where: { accountCode: code, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findAllByCodes(
    codes: ReadonlyArray<string>,
    tenantId: string,
  ): Promise<ReadonlyArray<Account>> {
    if (!codes.length) return [];
    const rows = await this.repo.find({
      where: { tenantId, accountCode: In([...new Set(codes)]) },
    });
    return rows.map(this.toDomain);
  }

  async findByTenant(tenantId: string): Promise<Account[]> {
    const rows = await this.repo.find({
      where: { tenantId },
      order: { accountCode: 'ASC' },
    });
    return rows.map(this.toDomain);
  }

  async save(account: Account): Promise<void> {
    const entity = this.toEntity(account);
    await this.repo.save(entity);
  }

  async updateBalance(code: string, delta: number, tenantId: string): Promise<void> {
    // Atomic in-DB increment to avoid race conditions
    await this.repo
      .createQueryBuilder()
      .update(AccountEntity)
      .set({ balance: () => `"balance" + ${Number(delta)}` })
      .where({ accountCode: code, tenantId })
      .execute();
  }

  private toDomain = (row: AccountEntity): Account => ({
    accountCode: row.accountCode,
    accountName: row.accountName,
    accountType: row.accountType,
    parentAccountCode: row.parentAccountCode,
    tenantId: row.tenantId,
    balance: Number(row.balance ?? 0),
    isActive: row.isActive ?? true,
  });

  private toEntity(account: Account): AccountEntity {
    const entity = new AccountEntity();
    entity.accountCode = account.accountCode;
    entity.accountName = account.accountName;
    entity.accountType = account.accountType;
    entity.parentAccountCode = account.parentAccountCode;
    entity.tenantId = account.tenantId;
    entity.balance = account.balance;
    entity.isActive = account.isActive;
    return entity;
  }
}

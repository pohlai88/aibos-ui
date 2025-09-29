import 'reflect-metadata';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { Entity, PrimaryColumn, Column, DataSource, Repository, EntityManager } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../utils/typeorm-base-repository';
import { paginateRepository } from '../../../utils/repository-pattern-utilities';

@Entity('customers')
class Customer {
  @PrimaryColumn('text') id!: string;
  @Column('text') name!: string;
  @Column('text', { nullable: true }) status!: string | null;
  @Column('datetime', { nullable: true }) deletedAt!: Date | null;
}

class CustomerRepository extends TypeOrmBaseRepository<Customer, string> {
  protected entityName = 'Customer';
  constructor(protected readonly ds: DataSource) { super('CustomerRepository'); }
  protected getRepo(manager?: EntityManager): Repository<Customer> {
    return (manager ?? this.ds.manager).getRepository(Customer);
  }
}

describe('TypeORM repository', () => {
  let ds: DataSource;
  let repo: CustomerRepository;

  beforeAll(async () => {
    ds = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      entities: [Customer],
    });
    await ds.initialize();
    repo = new CustomerRepository(ds);
  });

  afterAll(async () => { await ds.destroy(); });

  it('saves/finds/updates/deletes and paginates', async () => {
    await repo.saveWithValidation({ id: 'C1', name: 'Acme', status: 'ACTIVE', deletedAt: null });
    await repo.saveWithValidation({ id: 'C2', name: 'Bravo', status: 'INACTIVE', deletedAt: null });
    const found = await repo.findOneWithErrorHandling({ where: { name: 'Acme' } });
    expect(found?.id).toBe('C1');

    await repo.updateWithValidation('C2', { status: 'ACTIVE' });
    expect((await repo.findByIdWithErrorHandling('C2'))?.status).toBe('ACTIVE');

    const paged = await paginateRepository(repo, { page: 1, limit: 1, orderBy: 'id' });
    expect(paged.total).toBeGreaterThanOrEqual(2);
    expect(paged.data.length).toBe(1);

    await repo.deleteWithErrorHandling('C2', { softDelete: true });
    expect(await repo.existsWithErrorHandling('C2')).toBe(false);

    // transaction demo
    await repo.withTransaction(async (tx) => {
      await repo.saveWithValidation({ id: 'C3', name: 'Charlie', status: 'ACTIVE', deletedAt: null }, { tx });
    });
    expect(await repo.existsWithErrorHandling('C3')).toBe(true);
  });
});

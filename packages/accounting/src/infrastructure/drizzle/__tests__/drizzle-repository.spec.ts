import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { eq } from 'drizzle-orm';
import { DrizzleBaseRepository } from '../../../utils/drizzle-base-repository';
import { paginateRepository } from '../../../utils/repository-pattern-utilities';

const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status'),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
});

type Customer = {
  id: string;
  name: string;
  status: string | null;
  deletedAt: Date | null;
};

class CustomerRepositoryDrizzle extends DrizzleBaseRepository<Customer, string> {
  protected entityName = 'Customer';
  protected readonly db = drizzle(new Database(':memory:'));
  protected readonly table = customers;

  constructor() { super('CustomerRepositoryDrizzle'); }

  async init() {
    // schema
    this.db.run(`
      CREATE TABLE customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT,
        deleted_at INTEGER
      );
    `);
  }
}

describe('Drizzle repository', () => {
  let repo: CustomerRepositoryDrizzle;

  beforeAll(async () => {
    repo = new CustomerRepositoryDrizzle();
    await repo.init();
  });

  afterAll(async () => {
    // better-sqlite3 closes with GC; nothing required
  });

  it('saves/finds/updates/deletes and paginates', async () => {
    await repo.saveWithValidation({ id: 'C1', name: 'Acme', status: 'ACTIVE', deletedAt: null });
    await repo.saveWithValidation({ id: 'C2', name: 'Beta', status: 'INACTIVE', deletedAt: null });
    const one = await repo.findOneWithErrorHandling({ where: { name: 'Acme' } });
    expect(one?.id).toBe('C1');

    await repo.updateWithValidation('C2', { status: 'ACTIVE' });
    const two = await repo.findByIdWithErrorHandling('C2');
    expect(two?.status).toBe('ACTIVE');

    const paged = await paginateRepository(repo, { page: 1, limit: 1, orderBy: 'id' });
    expect(paged.total).toBeGreaterThanOrEqual(2);
    expect(paged.data.length).toBe(1);

    await repo.deleteWithErrorHandling('C2', { softDelete: true });
    const stillThere = await repo.find({ where: { id: 'C2' } });
    // soft-deleted rows are excluded by base findById implementation; our Drizzle impl uses a deletedAt flag.
    expect(stillThere.length).toBe(0);

    // tx demo
    await repo.withTransaction(async (tx) => {
      await repo.saveWithValidation({ id: 'C3', name: 'Charlie', status: 'ACTIVE', deletedAt: null }, { tx });
    });
    expect(await repo.existsWithErrorHandling('C3')).toBe(true);
  });
});

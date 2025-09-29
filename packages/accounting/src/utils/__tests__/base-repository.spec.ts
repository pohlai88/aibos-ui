import { describe, it, expect } from 'vitest';
import {
  BaseRepository,
  type FindOptions,
  type SaveOptions,
  type DeleteOptions,
  paginateRepository,
} from '../repository-pattern-utilities';

type PK = string;
type Row = { id: PK; name: string; deletedAt?: Date | null };

class InMemoryRepo extends BaseRepository<Row, PK> {
  protected entityName = 'Row';
  private rows: Row[] = [];

  // Public methods for testing
  public async saveWithValidation(entity: Row, options?: SaveOptions) {
    return super.saveWithValidation(entity, options);
  }
  public async findByIdWithErrorHandling(id: PK, options?: FindOptions) {
    return super.findByIdWithErrorHandling(id, options);
  }
  public async updateWithValidation(id: PK, updates: Partial<Row>, options?: SaveOptions) {
    return super.updateWithValidation(id, updates, options);
  }
  public async deleteWithErrorHandling(id: PK, options?: DeleteOptions) {
    return super.deleteWithErrorHandling(id, options);
  }
  public async countWithErrorHandling(options?: FindOptions) {
    return super.countWithErrorHandling(options);
  }
  public async existsWithErrorHandling(id: PK) {
    return super.existsWithErrorHandling(id);
  }

  protected async findById(id: PK): Promise<Row | null> {
    return this.rows.find(r => r.id === id && !r.deletedAt) ?? null;
  }
  protected async find(options: FindOptions = {}): Promise<Row[]> {
    const { where, limit, offset, orderBy, orderDirection } = options;
    let data = this.rows.filter(r => !r.deletedAt);
    if (where?.name) data = data.filter(r => r.name === where.name);
    if (orderBy) {
      data = data.sort((a: any, b: any) =>
        orderDirection === 'DESC'
          ? (b[orderBy] as any).localeCompare(a[orderBy] as any)
          : (a[orderBy] as any).localeCompare(b[orderBy] as any));
    }
    const start = offset ?? 0;
    const end = typeof limit === 'number' ? start + limit : undefined;
    return data.slice(start, end);
  }
  protected async findOne(options: FindOptions = {}) { return (await this.find({ ...options, limit: 1 }))[0] ?? null; }
  protected async save(entity: Row, _options?: SaveOptions) { 
    const existing = this.rows.findIndex(r => r.id === entity.id);
    if (existing >= 0) this.rows[existing] = { ...this.rows[existing], ...entity };
    else this.rows.push({ ...entity, deletedAt: null });
    return entity; 
  }
  protected async update(id: PK, updates: Partial<Row>) {
    const idx = this.rows.findIndex(r => r.id === id);
    if (idx < 0) throw this.createNotFoundError(id);
    this.rows[idx] = { ...this.rows[idx], ...updates };
    return this.rows[idx];
  }
  protected async delete(id: PK, options: DeleteOptions = {}) {
    const idx = this.rows.findIndex(r => r.id === id);
    if (idx < 0) throw this.createNotFoundError(id);
    if (options.softDelete) this.rows[idx].deletedAt = new Date();
    else this.rows.splice(idx, 1);
  }
  protected async count(options: FindOptions = {}) {
    return (await this.find({ ...options, limit: undefined, offset: undefined })).length;
  }
  protected async exists(id: PK) { return (await this.findById(id)) != null; }
}

describe('BaseRepository + paginate()', () => {
  const repo = new InMemoryRepo('InMemoryRepo');

  it('CRUD + count/exists', async () => {
    await repo.saveWithValidation({ id: 'A', name: 'Alpha' });
    await repo.saveWithValidation({ id: 'B', name: 'Beta' });
    expect(await repo.countWithErrorHandling()).toBe(2);
    expect(await repo.existsWithErrorHandling('A')).toBe(true);
    const a = await repo.findByIdWithErrorHandling('A');
    expect(a?.name).toBe('Alpha');
    await repo.updateWithValidation('A', { name: 'A1' });
    expect((await repo.findByIdWithErrorHandling('A'))?.name).toBe('A1');
    await repo.deleteWithErrorHandling('B', { softDelete: true });
    expect(await repo.existsWithErrorHandling('B')).toBe(false);
    expect(await repo.countWithErrorHandling()).toBe(1);
  });

  it('paginateRepository returns page data + totals', async () => {
    // seed more
    for (let i = 0; i < 25; i++) await repo.saveWithValidation({ id: `X${i}`, name: `N${i}` });
    const page2 = await paginateRepository(repo, { page: 2, limit: 10, orderBy: 'id', orderDirection: 'ASC' });
    expect(page2.page).toBe(2);
    expect(page2.limit).toBe(10);
    expect(page2.total).toBeGreaterThan(10);
    expect(page2.totalPages).toBeGreaterThan(2);
    expect(page2.data.length).toBe(10);
  });
});

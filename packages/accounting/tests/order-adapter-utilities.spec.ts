import { describe, it, expect } from 'vitest';
import {
  whereInputToFilterConditions,
  filterConditionsToSqlWhereParams,
  filterConditionToSqlParams,
  type FilterCondition,
} from '../src/utils/order-adapter-utilities';

describe('order-adapter parameterized SQL', () => {
  it('eq / gt / between (postgres placeholders)', () => {
    const conds: FilterCondition[] = [
      { field: 'user.id', operator: 'eq', value: 42 },
      { field: 'amount', operator: 'gt', value: 100 },
      { field: 'created_at', operator: 'between', values: ['2024-01-01', '2024-12-31'] },
    ];
    const { sql, params } = filterConditionsToSqlWhereParams(conds, 'postgres');
    expect(sql).toBe('WHERE "user"."id" = $1 AND "amount" > $2 AND "created_at" BETWEEN $3 AND $4');
    expect(params).toEqual([42, 100, '2024-01-01', '2024-12-31']);
  });

  it('IN / NOT IN empty guards', () => {
    const a: FilterCondition = { field: 'status', operator: 'in', values: [] };
    const b: FilterCondition = { field: 'status', operator: 'nin', values: [] };
    const A = filterConditionToSqlParams(a);
    const B = filterConditionToSqlParams(b);
    expect(A.sql).toBe('FALSE');
    expect(B.sql).toBe('TRUE');
    expect(A.params).toEqual([]);
    expect(B.params).toEqual([]);
  });

  it('jsonPath (legacy value object)', () => {
    const c: FilterCondition = {
      field: 'meta',
      operator: 'jsonPath',
      value: { path: 'preferences.theme', value: 'dark' }
    };
    const { sql, params } = filterConditionToSqlParams(c);
    // "meta"->"preferences"->>'theme' = $1 (but we keep -> for hops and ->> for last)
    expect(sql).toBe('"meta"->"preferences"->>"theme" = $1');
    expect(params).toEqual(['dark']);
  });

  it('question-mark dialect', () => {
    const conds: FilterCondition[] = [
      { field: 'total', operator: 'lte', value: 999 },
      { field: 'name', operator: 'ilike', value: '%jack%' },
    ];
    const { sql, params } = filterConditionsToSqlWhereParams(conds, 'question');
    expect(sql).toBe('WHERE "total" <= ? AND "name" ILIKE ?');
    expect(params).toEqual([999, '%jack%']);
  });

  it('whereInputToFilterConditions basic map', () => {
    const where = {
      status: ['open', 'closed'],
      amount: { gte: 10, lt: 50 },
      deleted_at: null,
    };
    const conds = whereInputToFilterConditions(where);
    expect(conds).toEqual(
      expect.arrayContaining([
        { field: 'status', operator: 'in', values: ['open', 'closed'] },
        { field: 'amount', operator: 'gte', value: 10 },
        { field: 'amount', operator: 'lt', value: 50 },
        { field: 'deleted_at', operator: 'isNull' },
      ])
    );
  });

  it('jsonPath with explicit path field', () => {
    const c: FilterCondition = {
      field: 'metadata',
      operator: 'jsonPath',
      path: 'user.preferences.language',
      value: 'en-US'
    };
    const { sql, params } = filterConditionToSqlParams(c);
    expect(sql).toBe('"metadata"->"user"->"preferences"->>"language" = $1');
    expect(params).toEqual(['en-US']);
  });

  it('jsonPath with array path', () => {
    const c: FilterCondition = {
      field: 'config',
      operator: 'jsonPath',
      path: ['settings', 'theme', 'color'],
      value: 'blue'
    };
    const { sql, params } = filterConditionToSqlParams(c);
    expect(sql).toBe('"config"->"settings"->"theme"->>"color" = $1');
    expect(params).toEqual(['blue']);
  });

  it('IN with multiple values', () => {
    const c: FilterCondition = {
      field: 'status',
      operator: 'in',
      values: ['active', 'pending', 'review']
    };
    const { sql, params } = filterConditionToSqlParams(c, 'postgres');
    expect(sql).toBe('"status" IN ($1, $2, $3)');
    expect(params).toEqual(['active', 'pending', 'review']);
  });

  it('NOT IN with multiple values', () => {
    const c: FilterCondition = {
      field: 'category',
      operator: 'nin',
      values: ['deleted', 'archived']
    };
    const { sql, params } = filterConditionToSqlParams(c, 'question');
    expect(sql).toBe('"category" NOT IN (?, ?)');
    expect(params).toEqual(['deleted', 'archived']);
  });

  it('raw expression passes through without params', () => {
    const c: FilterCondition = {
      field: 'custom',
      operator: 'raw',
      expression: 'EXISTS(SELECT 1 FROM related_table WHERE id = custom.id)'
    };
    const { sql, params } = filterConditionToSqlParams(c);
    expect(sql).toBe('EXISTS(SELECT 1 FROM related_table WHERE id = custom.id)');
    expect(params).toEqual([]);
  });

  it('empty conditions return empty result', () => {
    const { sql, params } = filterConditionsToSqlWhereParams([], 'postgres');
    expect(sql).toBe('');
    expect(params).toEqual([]);
  });

  it('null and isNotNull operators', () => {
    const conds: FilterCondition[] = [
      { field: 'deleted_at', operator: 'isNull' },
      { field: 'updated_at', operator: 'isNotNull' },
    ];
    const { sql, params } = filterConditionsToSqlWhereParams(conds);
    expect(sql).toBe('WHERE "deleted_at" IS NULL AND "updated_at" IS NOT NULL');
    expect(params).toEqual([]);
  });

  it('appendSqlOrderParams appends ORDER BY and preserves params', async () => {
    const { appendSqlOrderParams } = await import('../src/utils/order-adapter-utilities');
    const baseSql = 'SELECT * FROM "orders" WHERE "tenant_id" = $1';
    const baseParams = ['t_123'];
    const { sql, params } = appendSqlOrderParams(
      baseSql,
      { orderBy: 'created_at', orderDirection: 'DESC' as any },
      baseParams
    );
    expect(sql).toBe('SELECT * FROM "orders" WHERE "tenant_id" = $1 ORDER BY "created_at" DESC');
    expect(params).toEqual(['t_123']);
  });

  it('appendSqlOrderParams no-ops when no orderBy', async () => {
    const { appendSqlOrderParams } = await import('../src/utils/order-adapter-utilities');
    const { sql, params } = appendSqlOrderParams('SELECT 1', undefined, [1]);
    expect(sql).toBe('SELECT 1');
    expect(params).toEqual([1]);
  });

  it('buildQueryParams composes where + order (postgres)', async () => {
    const { buildQueryParams } = await import('../src/utils/order-adapter-utilities');
    const { sql, params } = buildQueryParams({
      baseSql: 'SELECT * FROM "orders" WHERE "tenant_id" = $1',
      baseParams: ['t_1'],
      where: {
        status: ['open', 'pending'],
        total: { gte: 100 },
      },
      order: { orderBy: 'created_at', orderDirection: 'DESC' as any },
      dialect: 'postgres',
    });
    expect(sql).toBe(
      'SELECT * FROM "orders" WHERE "tenant_id" = $1 AND "status" IN ($2, $3) AND "total" >= $4 ORDER BY "created_at" DESC'
    );
    expect(params).toEqual(['t_1', 'open', 'pending', 100]);
  });

  it('buildQueryParams works with question-mark dialect', async () => {
    const { buildQueryParams } = await import('../src/utils/order-adapter-utilities');
    const { sql, params } = buildQueryParams({
      baseSql: 'SELECT * FROM "users"',
      where: { name: { ilike: '%jack%' }, active: true },
      order: { orderBy: 'created_at', orderDirection: 'ASC' as any },
      dialect: 'question',
    });
    expect(sql).toBe('SELECT * FROM "users" WHERE "name" ILIKE ? AND "active" = ? ORDER BY "created_at" ASC');
    expect(params).toEqual(['%jack%', true]);
  });

  it('appendSqlPaginationParams adds LIMIT and OFFSET (postgres)', async () => {
    const { appendSqlPaginationParams } = await import('../src/utils/order-adapter-utilities');
    const base = 'SELECT * FROM "orders" WHERE "tenant_id" = $1';
    const baseParams = ['t_9'];
    const { sql, params } = appendSqlPaginationParams(base, { limit: 50, offset: 100 }, 'postgres', baseParams);
    expect(sql).toBe('SELECT * FROM "orders" WHERE "tenant_id" = $1 LIMIT $2 OFFSET $3');
    expect(params).toEqual(['t_9', 50, 100]);
  });

  it('appendSqlPaginationParams works with question-mark dialect', async () => {
    const { appendSqlPaginationParams } = await import('../src/utils/order-adapter-utilities');
    const { sql, params } = appendSqlPaginationParams('SELECT * FROM "logs"', { offset: 200 }, 'question', []);
    expect(sql).toBe('SELECT * FROM "logs" OFFSET ?');
    expect(params).toEqual([200]);
  });

  it('buildQueryParams composes pagination too', async () => {
    const { buildQueryParams } = await import('../src/utils/order-adapter-utilities');
    const { sql, params } = buildQueryParams({
      baseSql: 'SELECT * FROM "orders"',
      where: { status: 'open' },
      order: { orderBy: 'created_at', orderDirection: 'DESC' as any },
      pagination: { limit: 25, offset: 50 },
      dialect: 'postgres',
    });
    expect(sql).toBe('SELECT * FROM "orders" WHERE "status" = $1 ORDER BY "created_at" DESC LIMIT $2 OFFSET $3');
    expect(params).toEqual(['open', 25, 50]);
  });
});

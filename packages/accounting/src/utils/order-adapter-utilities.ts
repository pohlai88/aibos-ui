/**
 * Order Adapter Utilities
 * Convert repository QueryOptions order fields into SQL / Kysely / Drizzle / Prisma / Supabase usage.
 *
 * Non-breaking & dependency-free. Bring your own query builders.
 */

import {
  type FindOptions,
  type OrderDir,
  type NullsPlacement,
  OrderDirection,
  NullsOrder,
} from './repository-pattern-utilities';

// ============================================================================
// SANITIZATION HELPERS
// ============================================================================

/** true if identifier looks like a safe column or dotted path (e.g., "user.createdAt") */
export function isSafeIdentifier(id: string): boolean {
  // allow a..z A..Z 0..9 _ . and quotes for qualified names; no spaces, parens, commas, or operators
  // (You can relax this if you whitelist JSON path arrows -> / ->>)
  return /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(id);
}

/** very conservative quoting: "table"."column" from a dotted path */
export function quoteDottedIdentifier(id: string): string {
  return id
    .split('.')
    .map((p) => `"${p.replace(/"/g, '""')}"`)
    .join('.');
}

/** Best-effort: if safe, quote; otherwise return as-is (treat as expression — caller must ensure safety) */
export function toSqlIdentifierOrExpr(idOrExpr: string): string {
  return isSafeIdentifier(idOrExpr) ? quoteDottedIdentifier(idOrExpr) : idOrExpr;
}

// ============================================================================
// SQL ORDER FRAGMENTS
// ============================================================================

export function toSqlOrderFragment(opts?: {
  orderBy?: string;
  orderDirection?: OrderDir;
  orderNulls?: NullsPlacement;
}): string {
  if (!opts?.orderBy) return '';
  const dir = (opts.orderDirection ?? OrderDirection.ASC).toUpperCase() as OrderDir;
  const nulls =
    opts.orderNulls && (opts.orderNulls === NullsOrder.FIRST || opts.orderNulls === NullsOrder.LAST)
      ? ` NULLS ${opts.orderNulls}`
      : '';

  const col = toSqlIdentifierOrExpr(opts.orderBy);
  return `ORDER BY ${col} ${dir}${nulls}`;
}

// Convenience for a full SQL statement builder to append:
export function appendSqlOrder(baseSql: string, opts?: { orderBy?: string; orderDirection?: OrderDir; orderNulls?: NullsPlacement }): string {
  const frag = toSqlOrderFragment(opts);
  return frag ? `${baseSql.trim()} ${frag}` : baseSql;
}

/**
 * Append ORDER BY to an existing SQL statement and return `{ sql, params }`.
 * - Reuses `toSqlOrderFragment` (no new params are introduced).
 * - If no `orderBy` is provided (or fragment is empty), returns the base unchanged.
 * - Always preserves the incoming `baseParams` (order-by doesn't add any).
 * 
 * Usage:
 *   const base = 'SELECT * FROM "orders" WHERE "tenant_id" = $1';
 *   const baseParams = ['t_123'];
 *   const { sql, params } = appendSqlOrderParams(
 *     base,
 *     { orderBy: 'created_at', orderDirection: 'DESC' },
 *     baseParams
 *   );
 *   // sql: SELECT * FROM "orders" WHERE "tenant_id" = $1 ORDER BY "created_at" DESC
 *   // params: ['t_123']
 */
export function appendSqlOrderParams(
  baseSql: string,
  opts?: { orderBy?: string; orderDirection?: OrderDir; orderNulls?: NullsPlacement },
  baseParams: unknown[] = []
): { sql: string; params: unknown[] } {
  const frag = toSqlOrderFragment(opts);
  if (!frag) return { sql: baseSql, params: baseParams };
  return { sql: `${baseSql.trim()} ${frag}`, params: baseParams };
}

// ============================================================================
// HIGH-LEVEL COMPOSER
// ============================================================================
//
// One-liner API for building complete parameterized queries with WHERE + ORDER BY
//
// Usage:
//   const { sql, params } = buildQueryParams({
//     baseSql: 'SELECT * FROM "orders"',
//     where: {
//       status: ['open', 'pending'],
//       created_at: { between: ['2025-01-01', '2025-12-31'] },
//       meta: { path: 'flags.vip', value: true }, // jsonPath legacy shape
//     },
//     order: { orderBy: 'created_at', orderDirection: 'DESC' },
//     dialect: 'postgres',
//   });
//   // sql -> SELECT * FROM "orders" WHERE "status" IN ($1, $2) AND "created_at" BETWEEN $3 AND $4 AND "meta"->"flags"->>"vip" = $5 ORDER BY "created_at" DESC
//   // params -> ['open','pending','2025-01-01','2025-12-31',true]
//

export interface BuildQueryParamsInput {
  /** Base statement without WHERE/ORDER BY (e.g., `SELECT * FROM "orders"`). */
  baseSql: string;
  /** Initial params already referenced by baseSql (e.g., tenant id). */
  baseParams?: unknown[];
  /** A `where` object in your repo FindOptions<T> shape. */
  where?: Record<string, unknown>;
  /** Order options compatible with your existing adapters. */
  order?: { orderBy?: string; orderDirection?: OrderDir; orderNulls?: NullsPlacement };
  /** Pagination options (appends LIMIT/OFFSET as params). */
  pagination?: { limit?: number; offset?: number };
  /** Parameter dialect (default 'postgres' => $1, $2...). */
  dialect?: SqlDialect;
}

export function buildQueryParams({
  baseSql,
  baseParams = [],
  where,
  order,
  pagination,
  dialect = 'postgres',
}: BuildQueryParamsInput): { sql: string; params: unknown[] } {
  const conditions = whereInputToFilterConditions(where);
  
  // If we have conditions, we need to adjust parameter numbering
  let whereClause = '';
  let whereParams: unknown[] = [];
  
  if (conditions.length > 0) {
    // Create a parameter context that starts from the correct offset
    const ctx = createParamCtx(dialect);
    // Pre-populate with base params to get correct numbering
    ctx.params.push(...baseParams);
    
    const frags: string[] = [];
    for (const c of conditions) {
      const sql = buildConditionSql(c, ctx);
      if (sql) {
        frags.push(sql);
      }
    }
    
    if (frags.length > 0) {
      whereClause = `WHERE ${frags.join(' AND ')}`;
      // Extract only the new parameters (after baseParams)
      whereParams = ctx.params.slice(baseParams.length);
    }
  }
  
  // Combine base SQL with WHERE clause
  let combinedSql = baseSql.trim();
  if (whereClause) {
    // Check if base SQL already has WHERE clause
    if (baseSql.toUpperCase().includes(' WHERE ')) {
      // Replace WHERE with AND for additional conditions
      const whereFragment = whereClause.replace('WHERE ', 'AND ');
      combinedSql = `${combinedSql} ${whereFragment}`;
    } else {
      combinedSql = `${combinedSql} ${whereClause}`;
    }
  }
  
  const combinedParams = [...baseParams, ...whereParams];
  
  // Add ORDER BY
  const { sql: withOrder, params: p2 } = appendSqlOrderParams(combinedSql, order, combinedParams);
  
  // Add pagination
  const { sql: finalSql, params: finalParams } = appendSqlPaginationParams(withOrder, pagination, dialect, p2);
  
  return { sql: finalSql, params: finalParams };
}

// ============================================================================
// PAGINATION (LIMIT / OFFSET)
// ============================================================================
//
// Parameterized LIMIT/OFFSET support for safe pagination
//
// Usage:
//   const { sql, params } = appendSqlPaginationParams(
//     'SELECT * FROM "orders" WHERE "tenant_id" = $1',
//     { limit: 50, offset: 100 },
//     'postgres',
//     ['t_123']
//   );
//   // sql: SELECT * FROM "orders" WHERE "tenant_id" = $1 LIMIT $2 OFFSET $3
//   // params: ['t_123', 50, 100]
//

/**
 * Append LIMIT / OFFSET using parameter placeholders.
 * - Preserves incoming params; new placeholders continue from the count.
 * - Negative or non-finite values are ignored (no fragment added).
 * - Works independently: you can supply only limit or only offset.
 */
export function appendSqlPaginationParams(
  baseSql: string,
  pagination?: { limit?: number; offset?: number },
  dialect: SqlDialect = 'postgres',
  baseParams: unknown[] = []
): { sql: string; params: unknown[] } {
  if (!pagination) return { sql: baseSql, params: baseParams };
  const parts: string[] = [];
  const params = [...baseParams];
  const nextPlaceholder = () =>
    dialect === 'postgres' ? `$${params.length + 1}` : `?`;

  const addNum = (n: unknown): number | undefined => {
    const v = typeof n === 'string' ? Number(n) : (n as number);
    return Number.isFinite(v) && v >= 0 ? v : undefined;
  };

  const lim = addNum(pagination.limit);
  const off = addNum(pagination.offset);

  if (typeof lim === 'number') {
    parts.push(`LIMIT ${nextPlaceholder()}`);
    params.push(lim);
  }
  if (typeof off === 'number') {
    parts.push(`OFFSET ${nextPlaceholder()}`);
    params.push(off);
  }

  if (parts.length === 0) return { sql: baseSql, params: baseParams };
  return { sql: `${baseSql.trim()} ${parts.join(' ')}`, params };
}

// ============================================================================
// KYSELY ADAPTER
// ============================================================================

/**
 * Apply order to a Kysely-style query builder.
 * Expects qb.orderBy(ref, dir) and qb.orderBy(({ fn }) => ...) compat.
 *
 * Usage:
 *   qb = applyOrderToKysely(qb, opts)
 */
export function applyOrderToKysely<QB extends { orderBy: unknown }>(
  qb: QB,
  opts?: { orderBy?: string; orderDirection?: OrderDir; orderNulls?: NullsPlacement }
): QB {
  if (!opts?.orderBy) return qb;

  const dir = (opts.orderDirection ?? OrderDirection.ASC).toLowerCase() as 'asc' | 'desc';

  // Kysely doesn't support NULLS FIRST/LAST directly in orderBy; you can use raw if necessary.
  // Here we keep it simple; if caller passed an unsafe expression, we assume they know.
  const refOrExpr = opts.orderBy;

  try {
    // Try plain invocation first
    return qb.orderBy(refOrExpr as unknown, dir);
  } catch {
    try {
      // Try function form if builder exposes a ref helper
       
      return (qb as unknown).orderBy((eb: unknown) => (typeof eb?.ref === 'function' ? eb.ref(refOrExpr) : refOrExpr), dir);
    } catch {
      // As a last resort, no-op
      return qb;
    }
  }
}

// ============================================================================
// DRIZZLE ADAPTER
// ============================================================================

export interface DrizzleOrderHelpers {
  asc: (col: unknown) => unknown;
  desc: (col: unknown) => unknown;
  /** Optional helpers for NULLS precedence; some versions expose `.nullsFirst()`/`.nullsLast()` */
  nullsFirst?: (orderNode: unknown) => unknown;
  nullsLast?: (orderNode: unknown) => unknown;
}

/**
 * Apply order to a Drizzle-style query builder.
 * You must pass helpers from your driver binding (e.g., import { asc, desc } from 'drizzle-orm').
 *
 * Usage:
 *   qb = applyOrderToDrizzle(qb, table, opts, { asc, desc, nullsFirst, nullsLast })
 */
export function applyOrderToDrizzle<QB extends { orderBy: unknown }>(
  qb: QB,
  table: Record<string, unknown>,
  opts: { orderBy?: string; orderDirection?: OrderDir; orderNulls?: NullsPlacement } | undefined,
  helpers: DrizzleOrderHelpers
): QB {
  if (!opts?.orderBy) return qb;

  const { asc, desc, nullsFirst, nullsLast } = helpers;
  const dir = opts.orderDirection ?? OrderDirection.ASC;

  // Resolve a column if it's a simple identifier (table.column) and exists on `table`
  let orderNode: unknown;
  if (isSafeIdentifier(opts.orderBy)) {
    const [, maybeCol] = opts.orderBy.split('.');
    const col =
      (maybeCol && table?.[maybeCol]) ||
      table?.[opts.orderBy] || // direct key
      undefined;

    if (col) {
      orderNode = dir === OrderDirection.DESC ? desc(col) : asc(col);
    }
  }

  // Fallback to expression string (Drizzle may need sql.raw; we avoid importing sql)
  if (!orderNode) {
    // If you use drizzle-orm/sql, replace this with: sql.raw(`${opts.orderBy} ${dir}`)
    // Here, just no-op to avoid unsafe raw usage.
    return qb;
  }

  if (opts.orderNulls === NullsOrder.FIRST && typeof nullsFirst === 'function') {
    orderNode = nullsFirst(orderNode);
  } else if (opts.orderNulls === NullsOrder.LAST && typeof nullsLast === 'function') {
    orderNode = nullsLast(orderNode);
  }

  return qb.orderBy(orderNode);
}

// ============================================================================
// PRISMA ADAPTER
// ============================================================================

/**
 * Build a Prisma-compatible `orderBy` object.
 * Returns undefined if no orderBy is provided or if expression is unsafe.
 *
 * For complex expressions / NULLS FIRST/LAST on Postgres, you'll need $queryRaw.
 */
export function toPrismaOrder(
  opts?: { orderBy?: string; orderDirection?: OrderDir }
): Record<string, unknown> | undefined {
  if (!opts?.orderBy) return undefined;
  if (!isSafeIdentifier(opts.orderBy)) return undefined; // Prisma orderBy must be a path
  const dir = (opts.orderDirection ?? OrderDirection.ASC).toLowerCase() as 'asc' | 'desc';
  const parts = opts.orderBy.split('.');
  if (parts.length === 1) return { [parts[0] as string]: dir };
  // Build nested { a: { b: { c: 'desc' } } }
  return parts.slice(0, -1).reverse().reduce((acc, key) => {
    const obj: unknown = {};
    obj[key as string] = acc === null ? { [parts[parts.length - 1] as string]: dir } : acc;
    return obj;
  }, null as unknown);
}

// ============================================================================
// SUPABASE ADAPTER
// ============================================================================

/**
 * Apply order to a Supabase-style query builder.
 * Expects qb.order(field, { ascending: boolean, nullsFirst?: boolean })
 *
 * Usage:
 *   qb = applyOrderToSupabase(qb, opts)
 */
export function applyOrderToSupabase<QB extends { order: unknown }>(
  qb: QB,
  opts?: { orderBy?: string; orderDirection?: OrderDir; orderNulls?: NullsPlacement }
): QB {
  if (!opts?.orderBy) return qb;

  const ascending = opts.orderDirection !== OrderDirection.DESC;
  const nullsFirst = opts.orderNulls === NullsOrder.FIRST;

  try {
    return qb.order(opts.orderBy, { ascending, nullsFirst });
  } catch {
    // Fallback for complex expressions - Supabase may need RPC calls for complex ordering
    return qb;
  }
}

/**
 * Build Supabase order options object
 */
export function toSupabaseOrderOptions(opts?: { orderBy?: string; orderDirection?: OrderDir; orderNulls?: NullsPlacement }): { field: string; options: { ascending: boolean; nullsFirst?: boolean } } | undefined {
  if (!opts?.orderBy) return undefined;
  
  const ascending = opts.orderDirection !== OrderDirection.DESC;
  const nullsFirst = opts.orderNulls === NullsOrder.FIRST;
  
  return {
    field: opts.orderBy,
    options: { ascending, nullsFirst }
  };
}

// ============================================================================
// GENERIC UTILITIES
// ============================================================================

/**
 * Extract order fields from FindOptions<T> without coupling
 */
export function extractOrderFromFindOptions<T>(
  opts?: FindOptions<T>
): { orderBy?: string; orderDirection?: OrderDir; orderNulls?: NullsPlacement } {
  const result: { orderBy?: string; orderDirection?: OrderDir; orderNulls?: NullsPlacement } = {};
  
  if (opts?.orderBy !== undefined) {
    result.orderBy = opts.orderBy;
  }
  if (opts?.orderDirection !== undefined) {
    result.orderDirection = opts.orderDirection;
  }
  if (opts?.orderNulls !== undefined) {
    result.orderNulls = opts.orderNulls;
  }
  
  return result;
}

/**
 * Validate order options for safety
 */
export function validateOrderOptions(opts?: { orderBy?: string; orderDirection?: OrderDir; orderNulls?: NullsPlacement }): boolean {
  if (!opts?.orderBy) return true;
  
  // Check if orderBy is safe for most adapters
  if (!isSafeIdentifier(opts.orderBy)) {
    console.warn(`Unsafe orderBy expression detected: ${opts.orderBy}. Use orderByUnsafe() for complex expressions.`);
    return false;
  }
  
  return true;
}

// ============================================================================
// FILTER ADAPTER UTILITIES
// ============================================================================

/**
 * Filter operator types for where clauses
 */
export type FilterOperator = 
  | 'eq'           // equals
  | 'ne'           // not equals
  | 'gt'           // greater than
  | 'gte'          // greater than or equal
  | 'lt'           // less than
  | 'lte'          // less than or equal
  | 'in'           // in array
  | 'nin'          // not in array
  | 'like'         // SQL LIKE
  | 'ilike'        // case-insensitive LIKE
  | 'between'      // between two values
  | 'isNull'       // is null
  | 'isNotNull'    // is not null
  | 'jsonPath'     // JSON path query (expects path + value)
  | 'raw';         // raw expression

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value?: unknown;
  values?: unknown[]; // for 'in', 'nin', 'between'
  expression?: string; // for 'raw'
  /**
   * For 'jsonPath': dot/arrow-style path segments. If omitted and value looks like
   * { path, value }, this field is populated dynamically for backwards-compat.
   */
  path?: string | string[];
}

/**
 * Convert WhereInput to FilterCondition array
 */
export function whereInputToFilterConditions(where?: Record<string, unknown>): FilterCondition[] {
  if (!where) return [];
  
  const conditions: FilterCondition[] = [];
  
  for (const [field, value] of Object.entries(where)) {
    if (value === null) {
      conditions.push({ field, operator: 'isNull' });
    } else if (Array.isArray(value)) {
      conditions.push({ field, operator: 'in', values: value });
    } else if (typeof value === 'object' && value !== null) {
      // Handle operator objects like { gt: 100, lt: 200 }
      for (const [op, val] of Object.entries(value)) {
        if (op === 'between' && Array.isArray(val) && val.length === 2) {
          conditions.push({ field, operator: 'between', values: val });
        } else if (['gt', 'gte', 'lt', 'lte', 'ne'].includes(op)) {
          conditions.push({ field, operator: op as FilterOperator, value: val });
        } else if (op === 'like' || op === 'ilike') {
          conditions.push({ field, operator: op as FilterOperator, value: val });
        }
      }
    } else {
      conditions.push({ field, operator: 'eq', value });
    }
  }
  
  return conditions;
}

/**
 * Convert FilterCondition to SQL WHERE fragment
 */
export function filterConditionToSql(condition: FilterCondition): string {
  const field = toSqlIdentifierOrExpr(condition.field);
  
  switch (condition.operator) {
    case 'eq':
      return `${field} = ${JSON.stringify(condition.value)}`;
    case 'ne':
      return `${field} != ${JSON.stringify(condition.value)}`;
    case 'gt':
      return `${field} > ${JSON.stringify(condition.value)}`;
    case 'gte':
      return `${field} >= ${JSON.stringify(condition.value)}`;
    case 'lt':
      return `${field} < ${JSON.stringify(condition.value)}`;
    case 'lte':
      return `${field} <= ${JSON.stringify(condition.value)}`;
    case 'in':
      if (!condition.values || condition.values.length === 0) {
        // Nothing can match IN (), return a falsey predicate
        return 'FALSE';
      }
      {
        const inValues = condition.values.map(v => JSON.stringify(v)).join(', ');
        return `${field} IN (${inValues})`;
      }
    case 'nin':
      if (!condition.values || condition.values.length === 0) {
        // NOT IN () is vacuously true
        return 'TRUE';
      }
      {
        const ninValues = condition.values.map(v => JSON.stringify(v)).join(', ');
        return `${field} NOT IN (${ninValues})`;
      }
    case 'like':
      return `${field} LIKE ${JSON.stringify(condition.value)}`;
    case 'ilike':
      return `${field} ILIKE ${JSON.stringify(condition.value)}`;
    case 'between':
      return `${field} BETWEEN ${JSON.stringify(condition.values?.[0])} AND ${JSON.stringify(condition.values?.[1])}`;
    case 'isNull':
      return `${field} IS NULL`;
    case 'isNotNull':
      return `${field} IS NOT NULL`;
    case 'jsonPath':
      {
        // Accept either explicit fields or legacy { value: { path, value } }
        let path = condition.path;
        let val = condition.value;
        if (!path && val && typeof val === 'object' && 'path' in val && 'value' in val) {
          path = (val as unknown).path;
          val = (val as unknown).value;
        }
        const segs = Array.isArray(path) ? path : typeof path === 'string' ? path.split('.') : [];
        if (segs.length === 0) return ''; // nothing to generate
        // Use -> for json and ->> for text at the final hop
        const head = segs.slice(0, -1).map(s => `->${JSON.stringify(s)}`).join('');
        const last = segs[segs.length - 1];
        return `${field}${head}->>${JSON.stringify(last)} = ${JSON.stringify(val)}`;
      }
    case 'raw':
      return condition.expression || '';
    default:
      return '';
  }
}

/**
 * Convert FilterCondition array to SQL WHERE clause
 */
export function filterConditionsToSqlWhere(conditions: FilterCondition[]): string {
  if (conditions.length === 0) return '';
  
  const fragments = conditions.map(filterConditionToSql).filter(f => f.length > 0);
  return fragments.length > 0 ? `WHERE ${fragments.join(' AND ')}` : '';
}

// ============================================================================
// PARAMETERIZED SQL HELPERS ({ sql, params })
// ============================================================================
//
// Usage example:
//   const conds = whereInputToFilterConditions({
//     status: ['active', 'pending'],
//     created_at: { between: ['2025-01-01', '2025-12-31'] },
//     meta: { path: 'flags.vip', value: true }
//   });
//   
//   const { sql, params } = filterConditionsToSqlWhereParams(conds, 'postgres');
//   // sql: WHERE "status" IN ($1, $2) AND "created_at" BETWEEN $3 AND $4 AND "meta"->"flags"->>"vip" = $5
//   // params: ['active', 'pending', '2025-01-01', '2025-12-31', true]
//

export type SqlDialect = 'postgres' | 'question';

interface ParamCtx {
  params: unknown[];
  dialect: SqlDialect;
  nextPlaceholder(): string;
}

function createParamCtx(dialect: SqlDialect = 'postgres'): ParamCtx {
  const ctx: ParamCtx = {
    params: [],
    dialect,
    nextPlaceholder() {
      if (this.dialect === 'postgres') return `$${this.params.length + 1}`;
      // generic question-mark style
      return `?`;
    }
  };
  return ctx;
}

/**
 * Build a single predicate as parameterized SQL.
 * Mirrors filterConditionToSql but returns { sql, params }.
 */
export function filterConditionToSqlParams(
  condition: FilterCondition,
  dialect: SqlDialect = 'postgres'
): { sql: string; params: unknown[] } {
  const ctx = createParamCtx(dialect);
  const field = toSqlIdentifierOrExpr(condition.field);

  const push = (v: unknown) => {
    const ph = ctx.nextPlaceholder();
    ctx.params.push(v);
    return ph;
  };

  let sql = '';
  switch (condition.operator) {
    case 'eq':
      sql = `${field} = ${push(condition.value)}`;
      break;
    case 'ne':
      sql = `${field} != ${push(condition.value)}`;
      break;
    case 'gt':
      sql = `${field} > ${push(condition.value)}`;
      break;
    case 'gte':
      sql = `${field} >= ${push(condition.value)}`;
      break;
    case 'lt':
      sql = `${field} < ${push(condition.value)}`;
      break;
    case 'lte':
      sql = `${field} <= ${push(condition.value)}`;
      break;
    case 'in': {
      const vals = condition.values ?? [];
      if (vals.length === 0) {
        sql = 'FALSE';
        break;
      }
      if (dialect === 'postgres') {
        // Postgres: ANY($1::type[]) would require typing; keep simple: IN ($1,$2,...)
        const ph = vals.map(v => (ctx.params.push(v), `$${ctx.params.length}`)).join(', ');
        sql = `${field} IN (${ph})`;
      } else {
        const ph = vals.map(v => (ctx.params.push(v), `?`)).join(', ');
        sql = `${field} IN (${ph})`;
      }
      break;
    }
    case 'nin': {
      const vals = condition.values ?? [];
      if (vals.length === 0) {
        sql = 'TRUE';
        break;
      }
      if (dialect === 'postgres') {
        const ph = vals.map(v => (ctx.params.push(v), `$${ctx.params.length}`)).join(', ');
        sql = `${field} NOT IN (${ph})`;
      } else {
        const ph = vals.map(v => (ctx.params.push(v), `?`)).join(', ');
        sql = `${field} NOT IN (${ph})`;
      }
      break;
    }
    case 'like':
      sql = `${field} LIKE ${push(condition.value)}`;
      break;
    case 'ilike':
      // ILIKE is Postgres-specific; for other dialects callers can downcase both sides
      sql = `${field} ILIKE ${push(condition.value)}`;
      break;
    case 'between': {
      const [a, b] = condition.values ?? [];
      sql = `${field} BETWEEN ${push(a)} AND ${push(b)}`;
      break;
    }
    case 'isNull':
      sql = `${field} IS NULL`;
      break;
    case 'isNotNull':
      sql = `${field} IS NOT NULL`;
      break;
    case 'jsonPath': {
      let path = condition.path;
      let val = condition.value;
      if (!path && val && typeof val === 'object' && 'path' in val && 'value' in val) {
        path = (val as unknown).path;
        val = (val as unknown).value;
      }
      const segs = Array.isArray(path) ? path : typeof path === 'string' ? path.split('.') : [];
      if (segs.length === 0) {
        sql = '';
        break;
      }
      const head = segs.slice(0, -1).map(s => `->${JSON.stringify(s)}`).join('');
      const last = segs[segs.length - 1];
      sql = `${field}${head}->>${JSON.stringify(last)} = ${push(val)}`;
      break;
    }
    case 'raw':
      sql = condition.expression || '';
      break;
    default:
      sql = '';
  }

  return { sql, params: ctx.params };
}

/**
 * Build a full WHERE clause from conditions as parameterized SQL.
 * Returns empty sql ('') and [] when there are no fragments.
 */
export function filterConditionsToSqlWhereParams(
  conditions: FilterCondition[],
  dialect: SqlDialect = 'postgres'
): { sql: string; params: unknown[] } {
  const ctx = createParamCtx(dialect);
  const frags: string[] = [];
  
  for (const c of conditions) {
    const sql = buildConditionSql(c, ctx);
    if (sql) {
      frags.push(sql);
    }
  }
  
  return frags.length ? { sql: `WHERE ${frags.join(' AND ')}`, params: ctx.params } : { sql: '', params: [] };
}

/**
 * Build SQL for a single condition using a shared parameter context
 */
function buildConditionSql(condition: FilterCondition, ctx: ParamCtx): string {
  const field = toSqlIdentifierOrExpr(condition.field);

  const push = (v: unknown) => {
    const ph = ctx.nextPlaceholder();
    ctx.params.push(v);
    return ph;
  };

  switch (condition.operator) {
    case 'eq':
      return `${field} = ${push(condition.value)}`;
    case 'ne':
      return `${field} != ${push(condition.value)}`;
    case 'gt':
      return `${field} > ${push(condition.value)}`;
    case 'gte':
      return `${field} >= ${push(condition.value)}`;
    case 'lt':
      return `${field} < ${push(condition.value)}`;
    case 'lte':
      return `${field} <= ${push(condition.value)}`;
    case 'in': {
      const vals = condition.values ?? [];
      if (vals.length === 0) {
        return 'FALSE';
      }
      if (ctx.dialect === 'postgres') {
        const ph = vals.map(v => (ctx.params.push(v), `$${ctx.params.length}`)).join(', ');
        return `${field} IN (${ph})`;
      } else {
        const ph = vals.map(v => (ctx.params.push(v), `?`)).join(', ');
        return `${field} IN (${ph})`;
      }
    }
    case 'nin': {
      const vals = condition.values ?? [];
      if (vals.length === 0) {
        return 'TRUE';
      }
      if (ctx.dialect === 'postgres') {
        const ph = vals.map(v => (ctx.params.push(v), `$${ctx.params.length}`)).join(', ');
        return `${field} NOT IN (${ph})`;
      } else {
        const ph = vals.map(v => (ctx.params.push(v), `?`)).join(', ');
        return `${field} NOT IN (${ph})`;
      }
    }
    case 'like':
      return `${field} LIKE ${push(condition.value)}`;
    case 'ilike':
      return `${field} ILIKE ${push(condition.value)}`;
    case 'between': {
      const [a, b] = condition.values ?? [];
      return `${field} BETWEEN ${push(a)} AND ${push(b)}`;
    }
    case 'isNull':
      return `${field} IS NULL`;
    case 'isNotNull':
      return `${field} IS NOT NULL`;
    case 'jsonPath': {
      let path = condition.path;
      let val = condition.value;
      if (!path && val && typeof val === 'object' && 'path' in val && 'value' in val) {
        path = (val as unknown).path;
        val = (val as unknown).value;
      }
      const segs = Array.isArray(path) ? path : typeof path === 'string' ? path.split('.') : [];
      if (segs.length === 0) {
        return '';
      }
      const head = segs.slice(0, -1).map(s => `->${JSON.stringify(s)}`).join('');
      const last = segs[segs.length - 1];
      return `${field}${head}->>${JSON.stringify(last)} = ${push(val)}`;
    }
    case 'raw':
      return condition.expression || '';
    default:
      return '';
  }
}

/**
 * Apply filters to Supabase query builder
 */
export function applyFiltersToSupabase<QB extends { filter: unknown }>(
  qb: QB,
  conditions: FilterCondition[]
): QB {
  for (const condition of conditions) {
    try {
      // Prefer modern supabase-js ops if present; fallback to .filter()
      const has = (name: string) => typeof (qb as unknown)?.[name] === 'function';
      const F = (op: string, ...args: unknown[]) =>
        has(op) ? ((qb as unknown)[op](...args) as QB) : ((qb as unknown).filter(condition.field, op, args[0]) as QB);

      switch (condition.operator) {
        case 'eq':   qb = has('eq')   ? (qb as unknown).eq(condition.field, condition.value) : F('eq', condition.value); break;
        case 'ne':   qb = has('neq')  ? (qb as unknown).neq(condition.field, condition.value) : F('neq', condition.value); break;
        case 'gt':   qb = has('gt')   ? (qb as unknown).gt(condition.field, condition.value) : F('gt', condition.value); break;
        case 'gte':  qb = has('gte')  ? (qb as unknown).gte(condition.field, condition.value) : F('gte', condition.value); break;
        case 'lt':   qb = has('lt')   ? (qb as unknown).lt(condition.field, condition.value) : F('lt', condition.value); break;
        case 'lte':  qb = has('lte')  ? (qb as unknown).lte(condition.field, condition.value) : F('lte', condition.value); break;
        case 'in': {
          const vals = condition.values ?? [];
          qb = has('in') ? (qb as unknown).in(condition.field, vals) : ((qb as unknown).filter(condition.field, 'in', `(${vals.join(',')})`) as QB);
          break;
        }
        case 'nin': {
          const vals = condition.values ?? [];
          qb = has('not') && typeof (qb as unknown).not === 'function' && has('in')
            ? (qb as unknown).not('in', condition.field, vals) // some clients expose not('in', col, vals)
            : ((qb as unknown).filter(condition.field, 'not.in', `(${vals.join(',')})`) as QB);
          break;
        }
        case 'like':  qb = has('like')  ? (qb as unknown).like(condition.field, condition.value)  : F('like', condition.value); break;
        case 'ilike': qb = has('ilike') ? (qb as unknown).ilike(condition.field, condition.value) : F('ilike', condition.value); break;
        case 'between':
          qb = (has('gte') ? (qb as unknown).gte(condition.field, condition.values?.[0]) : F('gte', condition.values?.[0])) as QB;
          qb = (has('lte') ? (qb as unknown).lte(condition.field, condition.values?.[1]) : F('lte', condition.values?.[1])) as QB;
          break;
        case 'isNull':     qb = has('is') ? (qb as unknown).is(condition.field, null) : F('is', null); break;
        case 'isNotNull':  qb = has('not') && has('is') ? (qb as unknown).not('is', condition.field, null) : F('not.is', null); break;
        case 'jsonPath':
          // For JSON contains on Postgres: .contains() matches jsonb @>
          qb = has('contains') ? (qb as unknown).contains(condition.field, { [(condition.path as unknown) ?? '']: condition.value }) : qb;
          break;
        case 'raw':
          console.warn('Raw filter expressions not supported in Supabase adapter');
          break;
      }
    } catch (error) {
      console.warn(`Failed to apply filter ${condition.field} ${condition.operator}:`, error);
    }
  }
  
  return qb;
}

/**
 * Extract and convert where conditions from FindOptions
 */
export function extractFiltersFromFindOptions<T>(
  opts?: FindOptions<T>
): FilterCondition[] {
  return whereInputToFilterConditions(opts?.where);
}

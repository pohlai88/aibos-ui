import { describe, it, expect } from 'vitest';
import {
  // Filtering utilities
  filterNonNull,
  filterEmpty,
  filterByProperty,
  filterByPredicate,
  filterByMultiple,
  
  // Grouping utilities
  groupBy,
  groupByProperty,
  groupByMultiple,
  
  // Uniqueness utilities
  unique,
  uniqueBy,
  uniqueByKey,
  findDuplicates,
  removeDuplicates,
  
  // Sorting utilities
  sortBy,
  sortByMultiple,
  sortByFunction,
  
  // Array manipulation utilities
  chunk,
  flatten,
  flattenDeep,
  partition,
  splitAt,
  take,
  takeLast,
  drop,
  dropLast,
  
  // Search utilities
  findFirst,
  findLast,
  findAll,
  findIndex,
  findLastIndex,
  
  // Transformation utilities
  mapDefined,
  flatMap,
  reduceUntil,
  
  // Accounting-specific utilities
  groupTransactionsByAccount,
  filterTransactionsByDateRange,
  calculateTotalAmount,
  getTopByField,
  
  // Utility functions
  isEmpty,
  hasItems,
  getLength,
  fill,
  generate,
  
  // Performance helpers
  binarySearch,
  topKBy,
  uniqueStableBy,
  partitionMap,
  
  // Schema-aware comparators
  sortBySchema,
  buildFieldComparator,
  buildSchemaComparator,
  
  // Async chunked operations
  mapAsyncChunked,
  reduceAsyncChunked,
  forEachAsyncChunked,
  
  // Query engine
  query,
  qFrom,
  innerJoin,
  leftJoin,
  paginateOffset,
  paginateCursor,
  queryPage,
  
  // Filter DSL and Range Index
  buildFilter,
  queryWithDSL,
  createRangeIndex,
  queryRangeIndex,
  createMonthlyRangeIndex,
} from '../collection-utilities';
import { isValidAccountType, AccountType } from '../accounting-utilities';

// Test data
interface Account {
  accountCode: string;
  accountName: string;
  accountType: string;
  balance: number;
  isActive: boolean;
}

interface Transaction {
  id: string;
  accountCode: string;
  amount: number;
  date: Date;
  description: string;
}

const mockAccounts: Account[] = [
  { accountCode: '1001', accountName: 'Cash', accountType: AccountType.ASSET, balance: 5000, isActive: true },
  { accountCode: '1002', accountName: 'Bank', accountType: AccountType.ASSET, balance: 15000, isActive: true },
  { accountCode: '2001', accountName: 'Payables', accountType: AccountType.LIABILITY, balance: 3000, isActive: true },
  { accountCode: '2002', accountName: 'Loans', accountType: AccountType.LIABILITY, balance: 0, isActive: false },
  { accountCode: '3001', accountName: 'Equity', accountType: AccountType.EQUITY, balance: 17000, isActive: true },
];

const mockTransactions: Transaction[] = [
  { id: '1', accountCode: '1001', amount: 1000, date: new Date('2024-01-01'), description: 'Deposit' },
  { id: '2', accountCode: '1001', amount: -500, date: new Date('2024-01-02'), description: 'Withdrawal' },
  { id: '3', accountCode: '1002', amount: 2000, date: new Date('2024-01-03'), description: 'Transfer' },
  { id: '4', accountCode: '2001', amount: 1500, date: new Date('2024-01-04'), description: 'Invoice' },
  { id: '5', accountCode: '1001', amount: 300, date: new Date('2024-01-05'), description: 'Interest' },
];

describe('Collection Utilities', () => {
  describe('Account Type Validation', () => {
    it('validates account types using Phase 2 utility', () => {
      // Test valid account types
      expect(isValidAccountType(AccountType.ASSET)).toBe(true);
      expect(isValidAccountType(AccountType.LIABILITY)).toBe(true);
      expect(isValidAccountType(AccountType.EQUITY)).toBe(true);
      expect(isValidAccountType(AccountType.REVENUE)).toBe(true);
      expect(isValidAccountType(AccountType.EXPENSE)).toBe(true);
      
      // Test invalid account types
      expect(isValidAccountType('INVALID' as any)).toBe(false);
      expect(isValidAccountType('' as any)).toBe(false);
    });
  });

  describe('Filtering Utilities', () => {
    it('filters out null and undefined values', () => {
      const mixed = [1, null, 2, undefined, 3, null, 4];
      const result = filterNonNull(mixed);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('filters out empty values', () => {
      const mixed = ['hello', '', null, 'world', [], undefined, 'test'];
      const result = filterEmpty(mixed);
      expect(result).toEqual(['hello', 'world', 'test']);
    });

    it('filters by property value', () => {
      const result = filterByProperty(mockAccounts, 'isActive', true);
      expect(result).toHaveLength(4);
      expect(result.every(acc => acc.isActive)).toBe(true);
    });

    it('filters by predicate function', () => {
      const result = filterByPredicate(mockAccounts, acc => acc.balance > 10000);
      expect(result).toHaveLength(2);
      expect(result.every(acc => acc.balance > 10000)).toBe(true);
    });

    it('filters by multiple predicates', () => {
      const result = filterByMultiple(mockAccounts, [
        acc => acc.isActive,
        acc => acc.balance > 0
      ]);
      expect(result).toHaveLength(4);
      expect(result.every(acc => acc.isActive && acc.balance > 0)).toBe(true);
    });
  });

  describe('Grouping Utilities', () => {
    it('groups by key function', () => {
      const result = groupBy(mockAccounts, acc => acc.accountType);
      expect(result.keys).toEqual(['Asset', 'Liability', 'Equity']);
      expect(result.groups.Asset).toHaveLength(2);
      expect(result.groups.Liability).toHaveLength(2);
      expect(result.groups.Equity).toHaveLength(1);
      expect(result.counts.Asset).toBe(2);
    });

    it('groups by property', () => {
      const result = groupByProperty(mockAccounts, 'accountType');
      expect(result.keys).toEqual(['Asset', 'Liability', 'Equity']);
      expect(result.groups.Asset).toHaveLength(2);
    });

    it('groups by multiple properties', () => {
      const result = groupByMultiple(mockAccounts, ['accountType', 'isActive']);
      expect(result.keys).toContain('Asset\u001Ftrue');
      expect(result.keys).toContain('Liability\u001Ffalse');
    });
  });

  describe('Uniqueness Utilities', () => {
    it('removes duplicate values', () => {
      const duplicates = [1, 2, 2, 3, 3, 3, 4];
      const result = unique(duplicates);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('removes duplicates by property', () => {
      const accounts = [
        { id: 1, code: 'A' },
        { id: 2, code: 'B' },
        { id: 3, code: 'A' },
        { id: 4, code: 'C' }
      ];
      const result = uniqueBy(accounts, 'code');
      expect(result).toHaveLength(3);
      expect(result.map(a => a.code)).toEqual(['A', 'B', 'C']);
    });

    it('removes duplicates by key function', () => {
      const result = uniqueByKey(mockAccounts, acc => acc.accountType);
      expect(result).toHaveLength(3);
      expect(result.map(acc => acc.accountType)).toEqual([AccountType.ASSET, AccountType.LIABILITY, AccountType.EQUITY]);
    });

    it('finds duplicate values', () => {
      const duplicates = [1, 2, 2, 3, 3, 3, 4];
      const result = findDuplicates(duplicates);
      expect(result).toEqual([2, 3]);
    });

    it('removes all duplicates', () => {
      const duplicates = [1, 2, 2, 3, 3, 3, 4];
      const result = removeDuplicates(duplicates);
      expect(result).toEqual([1, 4]);
    });
  });

  describe('Sorting Utilities', () => {
    it('sorts by property ascending', () => {
      const result = sortBy(mockAccounts, 'balance', 'asc');
      expect(result[0]?.balance).toBe(0);
      expect(result[4]?.balance).toBe(17000);
    });

    it('sorts by property descending', () => {
      const result = sortBy(mockAccounts, 'balance', 'desc');
      expect(result[0]?.balance).toBe(17000);
      expect(result[4]?.balance).toBe(0);
    });

    it('sorts by multiple properties', () => {
      const result = sortByMultiple(mockAccounts, [
        { key: 'accountType', direction: 'asc' },
        { key: 'balance', direction: 'desc' }
      ]);
      expect(result[0]?.accountType).toBe(AccountType.ASSET);
      expect(result[1]?.accountType).toBe(AccountType.ASSET);
      expect(result[0]?.balance).toBeGreaterThan(result[1]?.balance || 0);
    });

    it('sorts by custom function', () => {
      const result = sortByFunction(mockAccounts, (a, b) => a.balance - b.balance);
      expect(result[0]?.balance).toBe(0);
      expect(result[4]?.balance).toBe(17000);
    });
  });

  describe('Array Manipulation Utilities', () => {
    it('chunks array into specified size', () => {
      const array = [1, 2, 3, 4, 5, 6, 7];
      const result = chunk(array, 3);
      expect(result.chunks).toEqual([[1, 2, 3], [4, 5, 6]]);
      expect(result.remainder).toEqual([7]);
      expect(result.totalChunks).toBe(2);
    });

    it('flattens nested arrays', () => {
      const nested = [[1, 2], [3, 4], [5]];
      const result = flatten(nested);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('flattens deeply nested arrays', () => {
      const deeplyNested = [1, [2, [3, [4]]]];
      const result = flattenDeep(deeplyNested);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('partitions array based on predicate', () => {
      const result = partition(mockAccounts, acc => acc.isActive);
      expect(result.left).toHaveLength(4);
      expect(result.right).toHaveLength(1);
      expect(result.left.every(acc => acc.isActive)).toBe(true);
      expect(result.right.every(acc => !acc.isActive)).toBe(true);
    });

    it('splits array at specific index', () => {
      const array = [1, 2, 3, 4, 5];
      const result = splitAt(array, 2);
      expect(result[0]).toEqual([1, 2]);
      expect(result[1]).toEqual([3, 4, 5]);
    });

    it('takes first n elements', () => {
      const result = take(mockAccounts, 3);
      expect(result).toHaveLength(3);
      expect(result[0]?.accountCode).toBe('1001');
    });

    it('takes last n elements', () => {
      const result = takeLast(mockAccounts, 2);
      expect(result).toHaveLength(2);
      expect(result[0]?.accountCode).toBe('2002');
    });

    it('drops first n elements', () => {
      const result = drop(mockAccounts, 2);
      expect(result).toHaveLength(3);
      expect(result[0]?.accountCode).toBe('2001');
    });

    it('drops last n elements', () => {
      const result = dropLast(mockAccounts, 2);
      expect(result).toHaveLength(3);
      expect(result[2]?.accountCode).toBe('2001');
    });
  });

  describe('Search Utilities', () => {
    it('finds first matching item', () => {
      const result = findFirst(mockAccounts, acc => acc.balance > 10000);
      expect(result?.accountCode).toBe('1002');
    });

    it('finds last matching item', () => {
      const result = findLast(mockAccounts, acc => acc.balance > 10000);
      expect(result?.accountCode).toBe('3001');
    });

    it('finds all matching items', () => {
      const result = findAll(mockAccounts, acc => acc.balance > 10000);
      expect(result).toHaveLength(2);
      expect(result.every(acc => acc.balance > 10000)).toBe(true);
    });

    it('finds index of first matching item', () => {
      const result = findIndex(mockAccounts, acc => acc.accountCode === '2001');
      expect(result).toBe(2);
    });

    it('finds index of last matching item', () => {
      const result = findLastIndex(mockAccounts, acc => acc.balance > 10000);
      expect(result).toBe(4);
    });
  });

  describe('Transformation Utilities', () => {
    it('maps and filters undefined results', () => {
      const result = mapDefined(mockAccounts, acc => 
        acc.isActive ? acc.accountCode : undefined
      );
      expect(result).toHaveLength(4);
      expect(result).toEqual(['1001', '1002', '2001', '3001']);
    });

    it('maps and flattens results', () => {
      const accounts = [
        { codes: ['A', 'B'] },
        { codes: ['C', 'D'] }
      ];
      const result = flatMap(accounts, acc => acc.codes);
      expect(result).toEqual(['A', 'B', 'C', 'D']);
    });

    it('reduces with early termination', () => {
      const result = reduceUntil(
        mockAccounts,
        (sum, acc) => sum + acc.balance,
        0,
        sum => sum > 20000
      );
      expect(result).toBeGreaterThan(20000);
    });
  });

  describe('Accounting-Specific Utilities', () => {
    it('groups transactions by account code', () => {
      const result = groupTransactionsByAccount(mockTransactions);
      expect(result.keys).toContain('1001');
      expect(result.keys).toContain('1002');
      expect(result.keys).toContain('2001');
      expect(result.groups['1001']).toHaveLength(3);
    });

    it('filters transactions by date range', () => {
      const startDate = new Date('2024-01-02');
      const endDate = new Date('2024-01-04');
      const result = filterTransactionsByDateRange(mockTransactions, startDate, endDate);
      expect(result).toHaveLength(3);
      expect(result.every(t => t.date >= startDate && t.date <= endDate)).toBe(true);
    });

    it('calculates total amount from transactions', () => {
      const result = calculateTotalAmount(mockTransactions, 'amount');
      expect(result).toBe(4300); // 1000 + (-500) + 2000 + 1500 + 300
    });

    it('gets top items by field', () => {
      const result = getTopByField(mockAccounts, 'balance', 3);
      expect(result).toHaveLength(3);
      expect(result[0]?.balance).toBe(17000);
      expect(result[1]?.balance).toBe(15000);
      expect(result[2]?.balance).toBe(5000);
    });
  });

  describe('Utility Functions', () => {
    it('checks if array is empty', () => {
      expect(isEmpty([])).toBe(true);
      expect(isEmpty([1, 2, 3])).toBe(false);
    });

    it('checks if array has items', () => {
      expect(hasItems([])).toBe(false);
      expect(hasItems([1, 2, 3])).toBe(true);
    });

    it('gets array length safely', () => {
      expect(getLength([])).toBe(0);
      expect(getLength([1, 2, 3])).toBe(3);
      expect(getLength(null)).toBe(0);
      expect(getLength(undefined)).toBe(0);
    });

    it('fills array with value', () => {
      const result = fill(5, 0);
      expect(result).toEqual([0, 0, 0, 0, 0]);
    });

    it('generates array with function', () => {
      const result = generate(5, i => i * 2);
      expect(result).toEqual([0, 2, 4, 6, 8]);
    });
  });

  describe('Performance Helpers', () => {
    it('performs binary search on sorted array', () => {
      const sorted = [1, 3, 5, 7, 9, 11, 13];
      const found = binarySearch(sorted, 7, (a, b) => a - b);
      expect(found).toBe(3);
      
      const notFound = binarySearch(sorted, 6, (a, b) => a - b);
      expect(notFound).toBe(~3); // insertion point at index 3
    });

    it('gets top K items by score', () => {
      const items = [
        { name: 'A', score: 10 },
        { name: 'B', score: 30 },
        { name: 'C', score: 20 },
        { name: 'D', score: 40 },
        { name: 'E', score: 5 }
      ];
      
      const top3 = topKBy(items, 3, item => item.score);
      expect(top3).toHaveLength(3);
      expect(top3[0]?.name).toBe('D'); // highest score
      expect(top3[1]?.name).toBe('B');
      expect(top3[2]?.name).toBe('C');
    });

    it('gets unique items stable by key', () => {
      const items = [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' },
        { id: 1, name: 'Duplicate' },
        { id: 3, name: 'Third' }
      ];
      
      const unique = uniqueStableBy(items, item => item.id);
      expect(unique).toHaveLength(3);
      expect(unique[0]?.name).toBe('First'); // first occurrence preserved
      expect(unique[1]?.name).toBe('Second');
      expect(unique[2]?.name).toBe('Third');
    });

    it('partitions and maps in single pass', () => {
      const items = [1, 2, 3, 4, 5, 6];
      const result = partitionMap(
        items,
        item => item % 2 === 0 ? item * 2 : undefined,
        item => item % 2 === 1 ? item * 3 : undefined
      );
      
      expect(result.left).toEqual([4, 8, 12]); // even * 2
      expect(result.right).toEqual([3, 9, 15]); // odd * 3
    });
  });

  describe('Edge Cases', () => {
    it('handles empty arrays', () => {
      expect(filterNonNull([])).toEqual([]);
      expect(groupBy([], () => 'key')).toEqual({ groups: {}, keys: [], counts: {} });
      expect(chunk([], 2)).toEqual({ chunks: [], remainder: [], totalChunks: 0 });
    });

    it('handles single item arrays', () => {
      expect(unique([1])).toEqual([1]);
      expect(partition([1], x => x > 0)).toEqual({ left: [1], right: [] });
    });

    it('handles invalid chunk size', () => {
      expect(() => chunk([1, 2, 3], 0)).toThrow('Chunk size must be greater than 0');
      expect(() => chunk([1, 2, 3], -1)).toThrow('Chunk size must be greater than 0');
    });

    it('handles null/undefined inputs gracefully', () => {
      expect(getLength(null)).toBe(0);
      expect(getLength(undefined)).toBe(0);
    });
  });

  describe('Schema-Aware Comparators', () => {
    interface TestRow {
      date?: string;
      accountCode: string;
      amount: number;
      active?: boolean;
    }

    const testRows: TestRow[] = [
      { date: '2025-07-01', accountCode: 'A10', amount: 5, active: true },
      { date: undefined as any, accountCode: 'A2', amount: 7, active: false },
      { date: '2025-01-15', accountCode: 'A2', amount: 9, active: true },
      { date: '2025-01-15', accountCode: 'A1', amount: 3, active: false },
    ];

    it('sorts by schema with dates and strings', () => {
      const sorted = sortBySchema(testRows, [
        { key: 'date', type: 'date', direction: 'asc', nulls: 'last' },
        { key: 'accountCode', type: 'string' },
      ]);

      expect(sorted[0]).toEqual({ date: '2025-01-15', accountCode: 'A1', amount: 3, active: false });
      expect(sorted[1]).toEqual({ date: '2025-01-15', accountCode: 'A2', amount: 9, active: true });
      expect(sorted[2]).toEqual({ date: '2025-07-01', accountCode: 'A10', amount: 5, active: true });
      expect(sorted[3]).toEqual({ date: undefined as any, accountCode: 'A2', amount: 7, active: false });
    });

    it('sorts with transforms and nulls first', () => {
      const sorted = sortBySchema(testRows, [
        { key: 'accountCode', type: 'string', transform: (s: string) => s?.toUpperCase() },
        { key: 'amount', type: 'number', direction: 'desc' },
      ]);

      // Check that sorting is working correctly
      expect(sorted.length).toBe(4);
      
      // First by account code - with numeric sorting, A1, A2, A10 should be the order
      expect(sorted[0]?.accountCode).toBe('A1');
      expect(sorted[1]?.accountCode).toBe('A2');
      expect(sorted[2]?.accountCode).toBe('A2');
      expect(sorted[3]?.accountCode).toBe('A10');
      
      // Within A2 group, higher amount should come first
      expect(sorted[1]?.amount).toBeGreaterThan(sorted[2]?.amount || 0);
    });

    it('handles boolean types correctly', () => {
      const sorted = sortBySchema(testRows, [
        { key: 'active', type: 'boolean', direction: 'desc' },
      ]);

      const activeCount = sorted.filter(r => r.active === true).length;
      const inactiveCount = sorted.filter(r => r.active === false).length;
      expect(activeCount).toBe(2);
      expect(inactiveCount).toBe(2);
    });

    it('builds field comparator correctly', () => {
      const comparator = buildFieldComparator<TestRow>({
        key: 'amount',
        type: 'number',
        direction: 'desc'
      });

      const result = comparator(
        { accountCode: 'A', amount: 5 },
        { accountCode: 'B', amount: 10 }
      );
      expect(result).toBeGreaterThan(0); // 10 should come before 5
    });

    it('builds schema comparator with multiple fields', () => {
      const comparator = buildSchemaComparator<TestRow>([
        { key: 'accountCode', type: 'string' },
        { key: 'amount', type: 'number', direction: 'desc' },
      ]);

      const result = comparator(
        { accountCode: 'A', amount: 5 },
        { accountCode: 'A', amount: 10 }
      );
      expect(result).toBeGreaterThan(0); // Same account code, higher amount first
    });
  });

  describe('Async Chunked Operations', () => {
    it('maps asynchronously with concurrency', async () => {
      const numbers = [1, 2, 3, 4, 5];
      const results = await mapAsyncChunked(
        numbers,
        async (n) => n * 2,
        { concurrency: 2 }
      );
      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('maps with progress callback', async () => {
      const numbers = [1, 2, 3, 4, 5];
      const progressCalls: number[] = [];
      
      await mapAsyncChunked(
        numbers,
        async (n) => n * 2,
        { 
          concurrency: 2,
          onProgress: (done, _total) => progressCalls.push(done)
        }
      );
      
      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls[progressCalls.length - 1]).toBe(5);
    });

    it('reduces asynchronously', async () => {
      const numbers = [1, 2, 3, 4, 5];
      const sum = await reduceAsyncChunked(
        numbers,
        async (acc, n) => acc + n,
        0,
        { yieldEvery: 2 }
      );
      expect(sum).toBe(15);
    });

    it('handles abort signal', async () => {
      const controller = new AbortController();
      const numbers = Array.from({ length: 100 }, (_, i) => i);
      
      // Abort after a short delay
      setTimeout(() => controller.abort(), 10);
      
      await expect(
        mapAsyncChunked(
          numbers,
          async (n) => {
            await new Promise(resolve => setTimeout(resolve, 1));
            return n * 2;
          },
          { signal: controller.signal }
        )
      ).rejects.toThrow('Aborted');
    });

    it('forEachAsyncChunked executes side effects', async () => {
      const numbers = [1, 2, 3];
      const results: number[] = [];
      
      await forEachAsyncChunked(
        numbers,
        async (n) => {
          results.push(n * 2);
        },
        { concurrency: 2 }
      );
      
      expect(results).toEqual([2, 4, 6]);
    });

    it('handles mixed sync/async operations', async () => {
      const numbers = [1, 2, 3, 4, 5];
      const results = await mapAsyncChunked(
        numbers,
        (n) => n % 2 === 0 ? Promise.resolve(n * 2) : n * 3,
        { concurrency: 3 }
      );
      expect(results).toEqual([3, 4, 9, 8, 15]);
    });
  });

  describe('Query Engine', () => {
    interface Transaction {
      id: string;
      accountCode: string;
      amount: number;
      date: Date;
      currency: string;
    }

    const transactions: Transaction[] = [
      { id: '1', accountCode: 'A1', amount: 100, date: new Date('2025-01-01'), currency: 'USD' },
      { id: '2', accountCode: 'A2', amount: 200, date: new Date('2025-01-02'), currency: 'USD' },
      { id: '3', accountCode: 'A1', amount: 150, date: new Date('2025-01-03'), currency: 'EUR' },
      { id: '4', accountCode: 'A3', amount: 300, date: new Date('2025-01-04'), currency: 'USD' },
    ];

    it('performs basic query with where and select', () => {
      const result = query({
        from: transactions,
        where: t => t.currency === 'USD',
        select: t => ({ code: t.accountCode, amount: t.amount }),
        orderBy: [{ key: 'amount', type: 'number', direction: 'desc' }],
      });

      expect(result.rows).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.rows[0]?.amount).toBe(300);
      expect(result.rows[1]?.amount).toBe(200);
      expect(result.rows[2]?.amount).toBe(100);
    });

    it('performs query with multiple where conditions', () => {
      const result = query<Transaction>({
        from: transactions,
        where: [
          t => t.currency === 'USD',
          t => t.amount >= 200,
        ],
        orderBy: [{ key: 'date', type: 'date', direction: 'asc' }],
      });

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.id).toBe('2');
      expect(result.rows[1]?.id).toBe('4');
    });

    it('performs query with distinctBy', () => {
      const result = query({
        from: transactions,
        select: t => ({ accountCode: t.accountCode, currency: t.currency }),
        distinctBy: r => r.accountCode,
        orderBy: [{ key: 'accountCode', type: 'string' }],
      });

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0]?.accountCode).toBe('A1');
      expect(result.rows[1]?.accountCode).toBe('A2');
      expect(result.rows[2]?.accountCode).toBe('A3');
    });

    it('performs query with limit and offset', () => {
      const result = query({
        from: transactions,
        orderBy: [{ key: 'amount', type: 'number', direction: 'desc' }],
        limit: 2,
        offset: 1,
      });

      expect(result.rows).toHaveLength(2);
      expect(result.total).toBe(4);
      expect(result.rows[0]?.amount).toBe(200);
      expect(result.rows[1]?.amount).toBe(150);
    });

    it('uses fluent builder API', () => {
      const result = qFrom(transactions)
        .where(t => t.currency === 'USD')
        .select(t => ({ code: t.accountCode, amount: t.amount }));

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0]?.amount).toBe(100);
    });
  });

  describe('Joins', () => {
    interface Transaction {
      id: string;
      accountCode: string;
      amount: number;
    }

    interface Account {
      code: string;
      name: string;
    }

    const transactions: Transaction[] = [
      { id: '1', accountCode: 'A1', amount: 100 },
      { id: '2', accountCode: 'A2', amount: 200 },
      { id: '3', accountCode: 'A1', amount: 150 },
    ];

    const accounts: Account[] = [
      { code: 'A1', name: 'Cash' },
      { code: 'A2', name: 'Accounts Receivable' },
    ];

    it('performs inner join', () => {
      const result = innerJoin({
        left: transactions,
        right: accounts,
        on: { leftKey: t => t.accountCode, rightKey: a => a.code },
        project: (t, a) => ({ id: t.id, accountName: a.name, amount: t.amount }),
      });

      expect(result).toHaveLength(3);
      expect(result[0]?.accountName).toBe('Cash');
      expect(result[1]?.accountName).toBe('Accounts Receivable');
      expect(result[2]?.accountName).toBe('Cash');
    });

    it('performs left join', () => {
      const result = leftJoin({
        left: transactions,
        right: accounts,
        on: { leftKey: t => t.accountCode, rightKey: a => a.code },
        project: (t, a) => ({ id: t.id, accountName: a?.name || 'Unknown', amount: t.amount }),
      });

      expect(result).toHaveLength(3);
      expect(result[0]?.accountName).toBe('Cash');
      expect(result[1]?.accountName).toBe('Accounts Receivable');
      expect(result[2]?.accountName).toBe('Cash');
    });
  });

  describe('Pagination', () => {
    const numbers = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, value: i + 1 }));

    it('performs offset pagination', () => {
      const page1 = paginateOffset(numbers, 1, 10);
      expect(page1.items).toHaveLength(10);
      expect(page1.page).toBe(1);
      expect(page1.pageSize).toBe(10);
      expect(page1.pageCount).toBe(3);
      expect(page1.total).toBe(25);
      expect(page1.items[0]?.id).toBe(1);

      const page2 = paginateOffset(numbers, 2, 10);
      expect(page2.items).toHaveLength(10);
      expect(page2.page).toBe(2);
      expect(page2.items[0]?.id).toBe(11);

      const page3 = paginateOffset(numbers, 3, 10);
      expect(page3.items).toHaveLength(5);
      expect(page3.page).toBe(3);
      expect(page3.items[0]?.id).toBe(21);
    });

    it('performs cursor pagination', () => {
      const orderBy = [{ key: 'value' as keyof typeof numbers[0], type: 'number' as const, direction: 'asc' as const }];
      
      const page1 = paginateCursor({
        rows: numbers,
        orderBy,
        pageSize: 10,
      });

      expect(page1.items).toHaveLength(10);
      expect(page1.total).toBe(25);
      expect(page1.nextCursor).toBeDefined();
      expect(page1.items[0]?.value).toBe(1);

      const page2 = paginateCursor({
        rows: numbers,
        orderBy,
        pageSize: 10,
        ...(page1.nextCursor && { cursor: page1.nextCursor }),
      });

      expect(page2.items).toHaveLength(10);
      expect(page2.items[0]?.value).toBe(11);
    });

    it('performs query with pagination', () => {
      const result = queryPage({
        from: numbers,
        where: n => n.value > 10,
        orderBy: [{ key: 'value' as keyof typeof numbers[0], type: 'number' as const, direction: 'asc' as const }],
        page: 1,
        pageSize: 5,
      });

      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(15); // numbers > 10
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(5);
      expect(result.pageCount).toBe(3);
      expect(result.items[0]?.value).toBe(11);
    });
  });

  describe('Filter DSL', () => {
    interface TestItem {
      id: string;
      name: string;
      amount: number;
      category: string;
      active: boolean;
    }

    const testItems: TestItem[] = [
      { id: '1', name: 'Apple', amount: 100, category: 'fruit', active: true },
      { id: '2', name: 'Banana', amount: 200, category: 'fruit', active: false },
      { id: '3', name: 'Carrot', amount: 150, category: 'vegetable', active: true },
      { id: '4', name: 'Orange', amount: 300, category: 'fruit', active: true },
    ];

    it('builds simple equality filter', () => {
      const filter = buildFilter({ field: 'category', op: '=', value: 'fruit' });
      const result = testItems.filter(filter);
      
      expect(result).toHaveLength(3);
      expect(result.every(item => item.category === 'fruit')).toBe(true);
    });

    it('builds numeric comparison filter', () => {
      const filter = buildFilter({ field: 'amount', op: '>=', value: 200 });
      const result = testItems.filter(filter);
      
      expect(result).toHaveLength(2);
      expect(result.every(item => item.amount >= 200)).toBe(true);
    });

    it('builds string contains filter', () => {
      const filter = buildFilter({ field: 'name', op: 'contains', value: 'an' });
      const result = testItems.filter(filter);
      
      expect(result).toHaveLength(2);
      expect(result.every(item => item.name.includes('an'))).toBe(true);
    });

    it('builds in/not-in filters', () => {
      const inFilter = buildFilter({ field: 'category', op: 'in', value: ['fruit', 'vegetable'] });
      const inResult = testItems.filter(inFilter);
      expect(inResult).toHaveLength(4);

      const notInFilter = buildFilter({ field: 'category', op: 'not-in', value: ['fruit'] });
      const notInResult = testItems.filter(notInFilter);
      expect(notInResult).toHaveLength(1);
    });

    it('builds complex AND/OR group filters', () => {
      const complexFilter = buildFilter({
        op: 'AND',
        conditions: [
          { field: 'category', op: '=', value: 'fruit' },
          {
            op: 'OR',
            conditions: [
              { field: 'amount', op: '>', value: 150 },
              { field: 'active', op: '=', value: true }
            ]
          }
        ]
      });
      
      const result = testItems.filter(complexFilter);
      expect(result).toHaveLength(3); // Apple, Banana, and Orange (all fruits, and Banana has amount > 150 OR Orange is active)
    });

    it('integrates with query engine', () => {
      const result = queryWithDSL({
        from: testItems,
        whereDSL: {
          op: 'AND',
          conditions: [
            { field: 'amount', op: '>=', value: 150 },
            { field: 'active', op: '=', value: true }
          ]
        },
        orderBy: [{ key: 'amount', type: 'number', direction: 'desc' }]
      });

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.amount).toBe(300);
      expect(result.rows[1]?.amount).toBe(150);
    });
  });

  describe('Range Index', () => {
    interface Transaction {
      id: string;
      amount: number;
      date: Date;
      accountCode: string;
    }

    const transactions: Transaction[] = [
      { id: '1', amount: 100, date: new Date('2025-01-15'), accountCode: 'A1' },
      { id: '2', amount: 200, date: new Date('2025-01-20'), accountCode: 'A2' },
      { id: '3', amount: 150, date: new Date('2025-02-10'), accountCode: 'A1' },
      { id: '4', amount: 300, date: new Date('2025-02-15'), accountCode: 'A3' },
      { id: '5', amount: 250, date: new Date('2025-03-05'), accountCode: 'A2' },
    ];

    it('creates and queries range index', () => {
      const ranges = [
        { key: 'Q1', start: 0, end: 2 },
        { key: 'Q2', start: 2, end: 4 },
        { key: 'Q3', start: 4, end: 5 }
      ];

      const index = createRangeIndex(transactions, item => {
        const month = item.date.getMonth();
        if (month < 3) return 'Q1';
        if (month < 6) return 'Q2';
        return 'Q3';
      }, ranges);

      const q1Items = queryRangeIndex(index, 'Q1');
      expect(q1Items).toHaveLength(2);
      expect(q1Items[0]?.id).toBe('1');
      expect(q1Items[1]?.id).toBe('2');

      const q2Items = queryRangeIndex(index, 'Q2');
      expect(q2Items).toHaveLength(2);
      expect(q2Items[0]?.id).toBe('3');
      expect(q2Items[1]?.id).toBe('4');
    });

    it('queries range index with additional filter', () => {
      const ranges = [
        { key: 'all', start: 0, end: 5 }
      ];

      const index = createRangeIndex(transactions, () => 'all', ranges);
      
      const filteredItems = queryRangeIndex(index, 'all', item => item.amount > 150);
      expect(filteredItems).toHaveLength(3);
      expect(filteredItems.every(item => item.amount > 150)).toBe(true);
    });

    it('creates monthly range index', () => {
      const sortedTransactions = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const monthlyIndex = createMonthlyRangeIndex(
        sortedTransactions,
        'date',
        new Date('2025-01-01'),
        new Date('2025-03-31')
      );

      const janItems = queryRangeIndex(monthlyIndex, '2025-01');
      expect(janItems).toHaveLength(2);
      expect(janItems.every(item => item.date.getMonth() === 0)).toBe(true);

      const febItems = queryRangeIndex(monthlyIndex, '2025-02');
      expect(febItems).toHaveLength(2);
      expect(febItems.every(item => item.date.getMonth() === 1)).toBe(true);

      const marItems = queryRangeIndex(monthlyIndex, '2025-03');
      expect(marItems).toHaveLength(1);
      expect(marItems[0]?.date.getMonth()).toBe(2);
    });

    it('handles empty ranges gracefully', () => {
      const ranges = [
        { key: 'empty', start: 0, end: 0 }
      ];

      const index = createRangeIndex(transactions, () => 'empty', ranges);
      const emptyItems = queryRangeIndex(index, 'empty');
      expect(emptyItems).toHaveLength(0);

      const missingItems = queryRangeIndex(index, 'missing');
      expect(missingItems).toHaveLength(0);
    });
  });
});

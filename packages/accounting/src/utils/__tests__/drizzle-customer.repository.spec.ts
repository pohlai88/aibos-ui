/**
 * Drizzle Customer Repository Tests
 * 
 * Example test implementation using the RepositorySpec scaffold.
 * Tests the Drizzle CustomerRepository implementation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CustomerRepositoryDrizzle, Customer } from '../drizzle/customer.repository';
import { RepositorySpec } from './repository-spec';

// Mock Drizzle database for testing
class MockDrizzleDB {
  select = jest.fn().mockReturnThis();
  from = jest.fn().mockReturnThis();
  where = jest.fn().mockReturnThis();
  limit = jest.fn().mockReturnThis();
  offset = jest.fn().mockReturnThis();
  orderBy = jest.fn().mockReturnThis();
  insert = jest.fn().mockReturnThis();
  values = jest.fn().mockReturnThis();
  returning = jest.fn().mockReturnThis();
  update = jest.fn().mockReturnThis();
  set = jest.fn().mockReturnThis();
  delete = jest.fn().mockReturnThis();
  
  fn = {
    count: jest.fn()
  };
  
  transaction = jest.fn();
}

describe('Drizzle Customer Repository', () => {
  let repository: CustomerRepositoryDrizzle;
  let mockDB: MockDrizzleDB;
  let mockTable: any;
  let spec: RepositorySpec<Customer, string>;

  beforeEach(() => {
    mockDB = new MockDrizzleDB();
    mockTable = {
      id: 'id',
      name: 'name',
      email: 'email',
      phone: 'phone',
      address: 'address',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      deletedAt: 'deletedAt'
    };
    
    repository = new CustomerRepositoryDrizzle(mockDB, mockTable);
    spec = new RepositorySpec(repository, 'Customer');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Basic CRUD Tests
  // ---------------------------------------------------------------------------
  
  it('should create customer', async () => {
    const customer = spec.createTestEntity({
      name: 'John Doe',
      email: 'john@example.com'
    });
    
    const mockInserted = { ...customer, id: '123' };
    mockDB.returning.mockResolvedValue([mockInserted]);
    
    const saved = await repository.saveWithValidation(customer);
    
    expect(saved).toBeDefined();
    expect(saved.id).toBe('123');
    expect(saved.name).toBe('John Doe');
    expect(mockDB.insert).toHaveBeenCalledWith(mockTable);
    expect(mockDB.values).toHaveBeenCalledWith(customer);
  });

  it('should find customer by id', async () => {
    const customer = { id: '123', name: 'John Doe', email: 'john@example.com' };
    mockDB.limit.mockResolvedValue([customer]);
    
    const found = await repository.findByIdWithValidation('123');
    
    expect(found).toBeDefined();
    expect(found!.id).toBe('123');
    expect(found!.name).toBe('John Doe');
    expect(mockDB.select).toHaveBeenCalled();
    expect(mockDB.from).toHaveBeenCalledWith(mockTable);
    expect(mockDB.where).toHaveBeenCalled();
    expect(mockDB.limit).toHaveBeenCalledWith(1);
  });

  it('should update customer', async () => {
    const customer = { id: '123', name: 'Jane Doe', email: 'john@example.com' };
    mockDB.limit.mockResolvedValue([customer]);
    
    const updated = await repository.updateWithValidation('123', { name: 'Jane Doe' });
    
    expect(updated.name).toBe('Jane Doe');
    expect(mockDB.update).toHaveBeenCalledWith(mockTable);
    expect(mockDB.set).toHaveBeenCalledWith({ name: 'Jane Doe' });
  });

  it('should delete customer', async () => {
    mockDB.delete.mockResolvedValue({ affected: 1 });
    
    await repository.deleteWithValidation('123');
    
    expect(mockDB.delete).toHaveBeenCalledWith(mockTable);
    expect(mockDB.where).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Custom Business Method Tests
  // ---------------------------------------------------------------------------
  
  it('should find customer by email', async () => {
    const customer = { id: '123', name: 'John Doe', email: 'john@example.com' };
    mockDB.limit.mockResolvedValue([customer]);
    
    const found = await repository.findByEmail('john@example.com');
    
    expect(found).toBeDefined();
    expect(found!.email).toBe('john@example.com');
  });

  it('should find active customers', async () => {
    const customers = [
      { id: '1', name: 'John', email: 'john@example.com', deletedAt: null },
      { id: '2', name: 'Jane', email: 'jane@example.com', deletedAt: null }
    ];
    mockDB.offset.mockResolvedValue(customers);
    
    const found = await repository.findActive();
    
    expect(found).toHaveLength(2);
    expect(found.every(c => c.deletedAt === null)).toBe(true);
  });

  it('should soft delete customer', async () => {
    mockDB.update.mockResolvedValue({ affected: 1 });
    
    await repository.softDelete('123');
    
    expect(mockDB.update).toHaveBeenCalledWith(mockTable);
    expect(mockDB.set).toHaveBeenCalledWith({ deletedAt: expect.any(Date) });
  });

  it('should restore customer', async () => {
    const customer = { id: '123', name: 'John Doe', email: 'john@example.com', deletedAt: null };
    mockDB.limit.mockResolvedValue([customer]);
    
    const restored = await repository.restore('123');
    
    expect(restored.deletedAt).toBeNull();
    expect(mockDB.update).toHaveBeenCalledWith(mockTable);
    expect(mockDB.set).toHaveBeenCalledWith({ deletedAt: null });
  });

  // ---------------------------------------------------------------------------
  // Transaction Tests
  // ---------------------------------------------------------------------------
  
  it('should support transactions', async () => {
    const customer1 = { id: '1', name: 'John', email: 'john@example.com' };
    const customer2 = { id: '2', name: 'Jane', email: 'jane@example.com' };
    
    mockDB.returning
      .mockResolvedValueOnce([customer1])
      .mockResolvedValueOnce([customer2]);
    
    mockDB.transaction.mockImplementation(async (callback) => {
      return callback(mockDB);
    });
    
    await repository.withTransaction(async (tx) => {
      await repository.saveWithValidation(customer1, { tx });
      await repository.saveWithValidation(customer2, { tx });
    });
    
    expect(mockDB.transaction).toHaveBeenCalled();
    expect(mockDB.insert).toHaveBeenCalledTimes(2);
  });

  // ---------------------------------------------------------------------------
  // Error Handling Tests
  // ---------------------------------------------------------------------------
  
  it('should throw not found error for non-existent customer', async () => {
    mockDB.limit.mockResolvedValue([]);
    
    await expect(
      repository.findByIdWithValidation('non-existent')
    ).rejects.toThrow();
  });

  it('should respect abort signals', async () => {
    const controller = new AbortController();
    controller.abort();
    
    const customer = { name: 'John', email: 'john@example.com' };
    
    await expect(
      repository.saveWithValidation(customer, { signal: controller.signal })
    ).rejects.toThrow();
  });

  // ---------------------------------------------------------------------------
  // Pagination Tests
  // ---------------------------------------------------------------------------
  
  it('should paginate customers', async () => {
    const customers = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Customer ${i + 1}`,
      email: `customer${i + 1}@example.com`
    }));
    
    mockDB.offset.mockResolvedValue(customers.slice(0, 10));
    mockDB.fn.count.mockReturnValue('count');
    mockDB.select.mockResolvedValueOnce([{ count: 15 }]);
    
    const result = await repository.paginate({ page: 1, limit: 10 });
    
    expect(result.data).toHaveLength(10);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(15);
    expect(result.totalPages).toBe(2);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrevious).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Count Tests
  // ---------------------------------------------------------------------------
  
  it('should count customers', async () => {
    mockDB.fn.count.mockReturnValue('count');
    mockDB.select.mockResolvedValue([{ count: 5 }]);
    
    const count = await repository.count();
    
    expect(count).toBe(5);
    expect(mockDB.select).toHaveBeenCalled();
    expect(mockDB.from).toHaveBeenCalledWith(mockTable);
  });

  // ---------------------------------------------------------------------------
  // Exists Tests
  // ---------------------------------------------------------------------------
  
  it('should check if customer exists', async () => {
    mockDB.limit.mockResolvedValue([{ id: '123' }]);
    
    const exists = await repository.exists('123');
    
    expect(exists).toBe(true);
    expect(mockDB.select).toHaveBeenCalled();
    expect(mockDB.from).toHaveBeenCalledWith(mockTable);
    expect(mockDB.where).toHaveBeenCalled();
    expect(mockDB.limit).toHaveBeenCalledWith(1);
  });

  it('should return false for non-existent customer', async () => {
    mockDB.limit.mockResolvedValue([]);
    
    const exists = await repository.exists('non-existent');
    
    expect(exists).toBe(false);
  });
});

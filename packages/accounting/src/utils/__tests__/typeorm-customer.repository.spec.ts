/**
 * TypeORM Customer Repository Tests
 * 
 * Example test implementation using the RepositorySpec scaffold.
 * Tests the TypeORM CustomerRepository implementation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataSource } from 'typeorm';
import { CustomerRepository, Customer } from '../typeorm/customer.repository';
import { RepositorySpec } from './repository-spec';

// Mock DataSource for testing
class MockDataSource {
  manager = {
    getRepository: () => ({
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      count: jest.fn()
    }),
    transaction: jest.fn()
  };
}

describe('TypeORM Customer Repository', () => {
  let repository: CustomerRepository;
  let mockDataSource: MockDataSource;
  let spec: RepositorySpec<Customer, string>;

  beforeEach(() => {
    mockDataSource = new MockDataSource();
    repository = new CustomerRepository(mockDataSource as any);
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
    
    const mockRepo = mockDataSource.manager.getRepository();
    mockRepo.save.mockResolvedValue({ ...customer, id: '123' });
    
    const saved = await repository.saveWithValidation(customer);
    
    expect(saved).toBeDefined();
    expect(saved.id).toBe('123');
    expect(saved.name).toBe('John Doe');
    expect(mockRepo.save).toHaveBeenCalledWith(customer);
  });

  it('should find customer by id', async () => {
    const customer = { id: '123', name: 'John Doe', email: 'john@example.com' };
    const mockRepo = mockDataSource.manager.getRepository();
    mockRepo.findOne.mockResolvedValue(customer);
    
    const found = await repository.findByIdWithValidation('123');
    
    expect(found).toBeDefined();
    expect(found!.id).toBe('123');
    expect(found!.name).toBe('John Doe');
  });

  it('should update customer', async () => {
    const customer = { id: '123', name: 'John Doe', email: 'john@example.com' };
    const mockRepo = mockDataSource.manager.getRepository();
    mockRepo.update.mockResolvedValue({ affected: 1 });
    mockRepo.findOne.mockResolvedValue({ ...customer, name: 'Jane Doe' });
    
    const updated = await repository.updateWithValidation('123', { name: 'Jane Doe' });
    
    expect(updated.name).toBe('Jane Doe');
    expect(mockRepo.update).toHaveBeenCalledWith({ id: '123' }, { name: 'Jane Doe' });
  });

  it('should delete customer', async () => {
    const mockRepo = mockDataSource.manager.getRepository();
    mockRepo.delete.mockResolvedValue({ affected: 1 });
    
    await repository.deleteWithValidation('123');
    
    expect(mockRepo.delete).toHaveBeenCalledWith({ id: '123' });
  });

  // ---------------------------------------------------------------------------
  // Custom Business Method Tests
  // ---------------------------------------------------------------------------
  
  it('should find customer by email', async () => {
    const customer = { id: '123', name: 'John Doe', email: 'john@example.com' };
    const mockRepo = mockDataSource.manager.getRepository();
    mockRepo.findOne.mockResolvedValue(customer);
    
    const found = await repository.findByEmail('john@example.com');
    
    expect(found).toBeDefined();
    expect(found!.email).toBe('john@example.com');
  });

  it('should find active customers', async () => {
    const customers = [
      { id: '1', name: 'John', email: 'john@example.com', deletedAt: null },
      { id: '2', name: 'Jane', email: 'jane@example.com', deletedAt: null }
    ];
    const mockRepo = mockDataSource.manager.getRepository();
    mockRepo.find.mockResolvedValue(customers);
    
    const found = await repository.findActive();
    
    expect(found).toHaveLength(2);
    expect(found.every(c => c.deletedAt === null)).toBe(true);
  });

  it('should soft delete customer', async () => {
    const mockRepo = mockDataSource.manager.getRepository();
    mockRepo.softDelete.mockResolvedValue({ affected: 1 });
    
    await repository.softDelete('123');
    
    expect(mockRepo.softDelete).toHaveBeenCalledWith({ id: '123' });
  });

  it('should restore customer', async () => {
    const customer = { id: '123', name: 'John Doe', email: 'john@example.com', deletedAt: null };
    const mockRepo = mockDataSource.manager.getRepository();
    mockRepo.update.mockResolvedValue({ affected: 1 });
    mockRepo.findOne.mockResolvedValue(customer);
    
    const restored = await repository.restore('123');
    
    expect(restored.deletedAt).toBeNull();
    expect(mockRepo.update).toHaveBeenCalledWith({ id: '123' }, { deletedAt: null });
  });

  // ---------------------------------------------------------------------------
  // Transaction Tests
  // ---------------------------------------------------------------------------
  
  it('should support transactions', async () => {
    const customer1 = { id: '1', name: 'John', email: 'john@example.com' };
    const customer2 = { id: '2', name: 'Jane', email: 'jane@example.com' };
    
    const mockRepo = mockDataSource.manager.getRepository();
    mockRepo.save.mockResolvedValueOnce(customer1).mockResolvedValueOnce(customer2);
    
    mockDataSource.manager.transaction.mockImplementation(async (callback) => {
      return callback(mockDataSource.manager);
    });
    
    await repository.withTransaction(async (tx) => {
      await repository.saveWithValidation(customer1, { tx });
      await repository.saveWithValidation(customer2, { tx });
    });
    
    expect(mockDataSource.manager.transaction).toHaveBeenCalled();
    expect(mockRepo.save).toHaveBeenCalledTimes(2);
  });

  // ---------------------------------------------------------------------------
  // Error Handling Tests
  // ---------------------------------------------------------------------------
  
  it('should throw not found error for non-existent customer', async () => {
    const mockRepo = mockDataSource.manager.getRepository();
    mockRepo.findOne.mockResolvedValue(null);
    
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
    
    const mockRepo = mockDataSource.manager.getRepository();
    mockRepo.find.mockResolvedValue(customers.slice(0, 10));
    mockRepo.count.mockResolvedValue(15);
    
    const result = await repository.paginate({ page: 1, limit: 10 });
    
    expect(result.data).toHaveLength(10);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(15);
    expect(result.totalPages).toBe(2);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrevious).toBe(false);
  });
});

/**
 * Repository Specification Tests
 * 
 * Generic test scaffold for testing repository implementations.
 * Can be used with both TypeORM and Drizzle implementations.
 * 
 * Features:
 * - CRUD operations testing
 * - Transaction testing
 * - AbortSignal testing
 * - Validation testing
 * - Error handling testing
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BaseRepository, FindOptions, SaveOptions, DeleteOptions } from '../../utils/repository-pattern-utilities';

// Generic test interface
export interface TestEntity {
  id?: string;
  name: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Generic repository spec
export class RepositorySpec<T extends TestEntity, ID = string> {
  constructor(
    private repository: BaseRepository<T, ID>,
    private entityName: string
  ) {}

  // ---------------------------------------------------------------------------
  // Test data helpers
  // ---------------------------------------------------------------------------
  
  createTestEntity(overrides: Partial<T> = {}): T {
    return {
      id: undefined,
      name: 'Test Entity',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    } as T;
  }

  // ---------------------------------------------------------------------------
  // CRUD Tests
  // ---------------------------------------------------------------------------
  
  async testCreate(): Promise<void> {
    const entity = this.createTestEntity();
    const saved = await this.repository.saveWithValidation(entity);
    
    expect(saved).toBeDefined();
    expect(saved.id).toBeDefined();
    expect(saved.name).toBe(entity.name);
    expect(saved.email).toBe(entity.email);
  }

  async testFindById(): Promise<void> {
    const entity = this.createTestEntity();
    const saved = await this.repository.saveWithValidation(entity);
    
    const found = await this.repository.findByIdWithValidation(saved.id!);
    expect(found).toBeDefined();
    expect(found!.id).toBe(saved.id);
    expect(found!.name).toBe(entity.name);
  }

  async testUpdate(): Promise<void> {
    const entity = this.createTestEntity();
    const saved = await this.repository.saveWithValidation(entity);
    
    const updates = { name: 'Updated Name' };
    const updated = await this.repository.updateWithValidation(saved.id!, updates);
    
    expect(updated.name).toBe('Updated Name');
    expect(updated.email).toBe(entity.email); // unchanged
  }

  async testDelete(): Promise<void> {
    const entity = this.createTestEntity();
    const saved = await this.repository.saveWithValidation(entity);
    
    await this.repository.deleteWithValidation(saved.id!);
    
    const found = await this.repository.findById(saved.id!);
    expect(found).toBeNull();
  }

  async testFind(): Promise<void> {
    // Create multiple entities
    const entities = [
      this.createTestEntity({ name: 'Entity 1', email: 'entity1@example.com' }),
      this.createTestEntity({ name: 'Entity 2', email: 'entity2@example.com' }),
      this.createTestEntity({ name: 'Entity 3', email: 'entity3@example.com' })
    ];
    
    for (const entity of entities) {
      await this.repository.saveWithValidation(entity);
    }
    
    const found = await this.repository.findWithValidation();
    expect(found.length).toBeGreaterThanOrEqual(3);
  }

  async testFindOne(): Promise<void> {
    const entity = this.createTestEntity({ name: 'Unique Entity', email: 'unique@example.com' });
    await this.repository.saveWithValidation(entity);
    
    const found = await this.repository.findOneWithValidation({
      where: { name: 'Unique Entity' }
    });
    
    expect(found).toBeDefined();
    expect(found!.name).toBe('Unique Entity');
  }

  async testCount(): Promise<void> {
    const initialCount = await this.repository.count();
    
    const entity = this.createTestEntity();
    await this.repository.saveWithValidation(entity);
    
    const newCount = await this.repository.count();
    expect(newCount).toBe(initialCount + 1);
  }

  async testExists(): Promise<void> {
    const entity = this.createTestEntity();
    const saved = await this.repository.saveWithValidation(entity);
    
    expect(await this.repository.exists(saved.id!)).toBe(true);
    expect(await this.repository.exists('non-existent-id' as ID)).toBe(false);
  }

  // ---------------------------------------------------------------------------
  // Pagination Tests
  // ---------------------------------------------------------------------------
  
  async testPaginate(): Promise<void> {
    // Create multiple entities
    const entities = Array.from({ length: 25 }, (_, i) => 
      this.createTestEntity({ 
        name: `Entity ${i + 1}`, 
        email: `entity${i + 1}@example.com` 
      })
    );
    
    for (const entity of entities) {
      await this.repository.saveWithValidation(entity);
    }
    
    const page1 = await this.repository.paginate({ page: 1, limit: 10 });
    expect(page1.data.length).toBe(10);
    expect(page1.page).toBe(1);
    expect(page1.limit).toBe(10);
    expect(page1.total).toBeGreaterThanOrEqual(25);
    expect(page1.hasNext).toBe(true);
    expect(page1.hasPrevious).toBe(false);
    
    const page2 = await this.repository.paginate({ page: 2, limit: 10 });
    expect(page2.data.length).toBe(10);
    expect(page2.page).toBe(2);
    expect(page2.hasNext).toBe(true);
    expect(page2.hasPrevious).toBe(true);
  }

  // ---------------------------------------------------------------------------
  // Transaction Tests
  // ---------------------------------------------------------------------------
  
  async testTransaction(): Promise<void> {
    const entity1 = this.createTestEntity({ name: 'Transaction Entity 1', email: 'tx1@example.com' });
    const entity2 = this.createTestEntity({ name: 'Transaction Entity 2', email: 'tx2@example.com' });
    
    await this.repository.withTransaction(async (tx) => {
      await this.repository.saveWithValidation(entity1, { tx });
      await this.repository.saveWithValidation(entity2, { tx });
    });
    
    const found1 = await this.repository.findByIdWithValidation(entity1.id!);
    const found2 = await this.repository.findByIdWithValidation(entity2.id!);
    
    expect(found1).toBeDefined();
    expect(found2).toBeDefined();
  }

  async testTransactionRollback(): Promise<void> {
    const entity = this.createTestEntity({ name: 'Rollback Entity', email: 'rollback@example.com' });
    
    try {
      await this.repository.withTransaction(async (tx) => {
        await this.repository.saveWithValidation(entity, { tx });
        throw new Error('Simulated error');
      });
    } catch (error) {
      // Expected error
    }
    
    const found = await this.repository.findById(entity.id!);
    expect(found).toBeNull();
  }

  // ---------------------------------------------------------------------------
  // AbortSignal Tests
  // ---------------------------------------------------------------------------
  
  async testAbortSignal(): Promise<void> {
    const controller = new AbortController();
    const entity = this.createTestEntity();
    
    // Abort immediately
    controller.abort();
    
    await expect(
      this.repository.saveWithValidation(entity, { signal: controller.signal })
    ).rejects.toThrow();
  }

  // ---------------------------------------------------------------------------
  // Validation Tests
  // ---------------------------------------------------------------------------
  
  async testValidation(): Promise<void> {
    const invalidEntity = this.createTestEntity({ name: '', email: 'invalid-email' });
    
    await expect(
      this.repository.saveWithValidation(invalidEntity)
    ).rejects.toThrow();
  }

  // ---------------------------------------------------------------------------
  // Error Handling Tests
  // ---------------------------------------------------------------------------
  
  async testNotFoundError(): Promise<void> {
    await expect(
      this.repository.findByIdWithValidation('non-existent-id' as ID)
    ).rejects.toThrow();
  }

  async testDuplicateError(): Promise<void> {
    const entity = this.createTestEntity({ email: 'duplicate@example.com' });
    await this.repository.saveWithValidation(entity);
    
    const duplicate = this.createTestEntity({ email: 'duplicate@example.com' });
    await expect(
      this.repository.saveWithValidation(duplicate)
    ).rejects.toThrow();
  }

  // ---------------------------------------------------------------------------
  // Run all tests
  // ---------------------------------------------------------------------------
  
  async runAllTests(): Promise<void> {
    describe(`${this.entityName} Repository Tests`, () => {
      beforeEach(async () => {
        // Setup: clear test data
        // Implementation depends on your test database setup
      });

      afterEach(async () => {
        // Cleanup: clear test data
        // Implementation depends on your test database setup
      });

      it('should create entity', () => this.testCreate());
      it('should find entity by id', () => this.testFindById());
      it('should update entity', () => this.testUpdate());
      it('should delete entity', () => this.testDelete());
      it('should find entities', () => this.testFind());
      it('should find one entity', () => this.testFindOne());
      it('should count entities', () => this.testCount());
      it('should check entity exists', () => this.testExists());
      it('should paginate entities', () => this.testPaginate());
      it('should support transactions', () => this.testTransaction());
      it('should rollback transactions on error', () => this.testTransactionRollback());
      it('should respect abort signals', () => this.testAbortSignal());
      it('should validate entities', () => this.testValidation());
      it('should throw not found error', () => this.testNotFoundError());
      it('should throw duplicate error', () => this.testDuplicateError());
    });
  }
}

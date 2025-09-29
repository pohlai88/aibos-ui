/**
 * Intercompany Operations - SSOT Implementation
 * 
 * Intercompany transaction tagging and matching utilities.
 * Imports from consolidation-types.ts for consistency.
 */

import type {
  Transaction,
  IntercompanyTag,
  ConsolidationEntity,
  TransactionType,
  TransactionMatch
} from './consolidation-types-utilities';

// ============================================================================
// INTERCOMPANY OPERATIONS
// ============================================================================

/**
 * Tag intercompany transaction
 * 
 * @param transaction - Transaction to tag
 * @param entities - Available consolidation entities
 * @returns Intercompany tag
 * 
 * @example
 * ```typescript
 * const tag = tagIntercompanyTransaction(transaction, entities);
 * ```
 */
export function tagIntercompanyTransaction(
  transaction: Transaction,
  entities: readonly ConsolidationEntity[]
): IntercompanyTag {
  // Find matching entities
  const entityFrom = entities.find(e => e.id === transaction.entity);
  const entityTo = entities.find(e => e.id === transaction.counterparty);

  if (!entityFrom || !entityTo) {
    throw new Error('Entity not found for transaction');
  }

  // Determine confidence based on transaction type and amount
  const confidence = calculateTagConfidence(transaction, entityFrom, entityTo);

  return {
    transactionId: transaction.id,
    entityFrom: entityFrom.id,
    entityTo: entityTo.id,
    transactionType: transaction.transactionType,
    amount: transaction.amount,
    currency: transaction.currency,
    tagDate: new Date(),
    confidence,
    method: 'automatic',
    metadata: {
      taggedBy: 'system',
      tagVersion: '1.0'
    }
  };
}

/**
 * Calculate tag confidence score
 * 
 * @param transaction - Transaction to analyze
 * @param entityFrom - Source entity
 * @param entityTo - Target entity
 * @returns Confidence score (0-1)
 */
function calculateTagConfidence(
  transaction: Transaction,
  entityFrom: ConsolidationEntity,
  entityTo: ConsolidationEntity
): number {
  let confidence = 0.5; // Base confidence

  // Increase confidence for related entities
  if (areEntitiesRelated(entityFrom, entityTo, [])) {
    confidence += 0.3;
  }

  // Increase confidence for common transaction types
  const commonTypes: TransactionType[] = ['sale', 'purchase', 'loan', 'fee'];
  if (commonTypes.includes(transaction.transactionType)) {
    confidence += 0.2;
  }

  // Decrease confidence for very large amounts (might be errors)
  if (transaction.amount > 1000000) {
    confidence -= 0.1;
  }

  return Math.min(1.0, Math.max(0.0, confidence));
}

/**
 * Check if two entities are related
 * 
 * @param entity1 - First entity
 * @param entity2 - Second entity
 * @param allEntities - All entities for relationship checking
 * @returns True if entities are related
 */
export function areEntitiesRelated(
  entity1: ConsolidationEntity,
  entity2: ConsolidationEntity,
  allEntities: readonly ConsolidationEntity[]
): boolean {
  // Direct parent-child relationship
  if (entity1.id === entity2.parentId || entity2.id === entity1.parentId) {
    return true;
  }

  // Check for common parent
  const entity1Parents = getEntityParents(entity1, allEntities);
  const entity2Parents = getEntityParents(entity2, allEntities);
  
  return entity1Parents.some(parent => entity2Parents.includes(parent));
}

/**
 * Get all parent entities for an entity
 * 
 * @param entity - Entity to get parents for
 * @param allEntities - All entities
 * @returns Array of parent entity IDs
 */
function getEntityParents(
  entity: ConsolidationEntity,
  allEntities: readonly ConsolidationEntity[]
): string[] {
  const parents: string[] = [];
  let currentEntity = entity;

  while (currentEntity.parentId) {
    parents.push(currentEntity.parentId);
    currentEntity = allEntities.find(e => e.id === currentEntity.parentId)!;
    if (!currentEntity) break;
  }

  return parents;
}

/**
 * Match intercompany transactions
 * 
 * @param transactions - Transactions to match
 * @param entities - Available entities
 * @returns Array of matched transaction pairs
 * 
 * @example
 * ```typescript
 * const matches = matchIntercompanyTransactions(transactions, entities);
 * ```
 */
export function matchIntercompanyTransactions(
  transactions: readonly Transaction[],
  entities: readonly ConsolidationEntity[]
): readonly TransactionMatch[] {
  const matches: TransactionMatch[] = [];
  const used = new Set<string>();

  // Sort transactions by amount (descending) for better matching
  const sortedTransactions = [...transactions].sort((a, b) => b.amount - a.amount);

  for (let i = 0; i < sortedTransactions.length; i++) {
    const t1 = sortedTransactions[i]!;
    if (used.has(t1.id)) continue;

    for (let j = i + 1; j < sortedTransactions.length; j++) {
      const t2 = sortedTransactions[j]!;
      if (used.has(t2.id)) continue;

      // Check if transactions can be matched
      if (canMatchTransactions(t1, t2, entities)) {
        matches.push({
          transaction1: t1,
          transaction2: t2,
          matchType: 'exact',
          matchConfidence: calculateMatchConfidence(t1, t2),
          matchDate: new Date()
        });

        used.add(t1.id);
        used.add(t2.id);
        break;
      }
    }
  }

  return matches;
}

/**
 * Check if two transactions can be matched
 * 
 * @param t1 - First transaction
 * @param t2 - Second transaction
 * @param entities - Available entities
 * @returns True if transactions can be matched
 */
function canMatchTransactions(
  t1: Transaction,
  t2: Transaction,
  entities: readonly ConsolidationEntity[]
): boolean {
  // Must be different entities
  if (t1.entity === t2.entity) return false;

  // Must be related entities
  const entity1 = entities.find(e => e.id === t1.entity);
  const entity2 = entities.find(e => e.id === t2.entity);
  
  if (!entity1 || !entity2) return false;
  if (!areEntitiesRelated(entity1, entity2, entities)) return false;

  // Must be opposite transaction types
  const oppositeTypes: Record<TransactionType, TransactionType[]> = {
    sale: ['purchase'],
    purchase: ['sale'],
    loan: ['loan'],
    dividend: ['dividend'],
    fee: ['fee'],
    interest: ['interest'],
    transfer: ['transfer'],
    other: ['other']
  };

  if (!oppositeTypes[t1.transactionType]?.includes(t2.transactionType)) {
    return false;
  }

  // Amounts should be close (within 5% tolerance)
  const amountDifference = Math.abs(t1.amount - t2.amount);
  const averageAmount = (t1.amount + t2.amount) / 2;
  const tolerance = averageAmount * 0.05;

  return amountDifference <= tolerance;
}

/**
 * Calculate match confidence between two transactions
 * 
 * @param t1 - First transaction
 * @param t2 - Second transaction
 * @returns Confidence score (0-1)
 */
function calculateMatchConfidence(t1: Transaction, t2: Transaction): number {
  let confidence = 0.5; // Base confidence

  // Exact amount match
  if (t1.amount === t2.amount) {
    confidence += 0.3;
  }

  // Same currency
  if (t1.currency === t2.currency) {
    confidence += 0.1;
  }

  // Same transaction type
  if (t1.transactionType === t2.transactionType) {
    confidence += 0.1;
  }

  return Math.min(1.0, confidence);
}

/**
 * Validate intercompany transaction
 * 
 * @param transaction - Transaction to validate
 * @param entities - Available entities
 * @returns Validation result
 */
export function validateIntercompanyTransaction(
  transaction: Transaction,
  entities: readonly ConsolidationEntity[]
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if entities exist
  const entityFrom = entities.find(e => e.id === transaction.entity);
  const entityTo = entities.find(e => e.id === transaction.counterparty);

  if (!entityFrom) {
    errors.push(`Entity not found: ${transaction.entity}`);
  }

  if (!entityTo) {
    errors.push(`Counterparty not found: ${transaction.counterparty}`);
  }

  // Check if entities are related
  if (entityFrom && entityTo && !areEntitiesRelated(entityFrom, entityTo, entities)) {
    warnings.push('Transaction between unrelated entities');
  }

  // Check amount
  if (transaction.amount <= 0) {
    errors.push('Transaction amount must be positive');
  }

  // Check currency
  if (entityFrom && entityFrom.currency !== transaction.currency) {
    warnings.push('Transaction currency differs from entity currency');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Re-export types for external use
export type { TransactionMatch } from './consolidation-types-utilities';

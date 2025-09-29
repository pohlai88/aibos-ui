/**
 * Transfer Pricing - SSOT Implementation
 * 
 * Transfer pricing rule management and markup elimination utilities.
 * Imports from consolidation-types.ts for consistency.
 */

import type {
  TransferPricingRule,
  TransferPricingAdjustment,
  Transaction,
  ConsolidationEntity
} from './consolidation-types-utilities';
import type { JournalEntry } from './journal-entry-utilities';

// ============================================================================
// TRANSFER PRICING OPERATIONS
// ============================================================================

/**
 * Apply transfer pricing rule to transaction
 * 
 * @param transaction - Transaction to apply rule to
 * @param rule - Transfer pricing rule
 * @param entities - Available entities
 * @returns Transfer pricing adjustment
 * 
 * @example
 * ```typescript
 * const adjustment = applyTransferPricingRule(transaction, rule, entities);
 * ```
 */
export function applyTransferPricingRule(
  transaction: Transaction,
  rule: TransferPricingRule,
  entities: readonly ConsolidationEntity[]
): TransferPricingAdjustment | null {
  // Check if transaction is applicable to this rule
  if (!isTransactionApplicable(transaction, rule, entities)) {
    return null;
  }

  // Calculate markup amount
  const markupAmount = calculateMarkupAmount(transaction, rule);

  if (markupAmount === 0) {
    return null;
  }

  return {
    id: `tp-adj-${transaction.id}-${rule.id}-${Date.now()}`,
    ruleId: rule.id,
    entityId: transaction.entity,
    adjustmentAmount: markupAmount,
    currency: transaction.currency,
    adjustmentDate: new Date(),
    description: `Transfer pricing adjustment for ${rule.name}`,
    metadata: {
      transactionId: transaction.id,
      markupPercentage: rule.markupPercentage,
      originalAmount: transaction.amount,
      adjustmentType: 'markup_elimination'
    }
  };
}

/**
 * Check if transaction is applicable to transfer pricing rule
 * 
 * @param transaction - Transaction to check
 * @param rule - Transfer pricing rule
 * @param entities - Available entities
 * @returns True if transaction is applicable
 */
function isTransactionApplicable(
  transaction: Transaction,
  rule: TransferPricingRule,
  entities: readonly ConsolidationEntity[]
): boolean {
  // Check if rule is active
  if (!rule.isActive) {
    return false;
  }

  // Check effective date
  if (transaction.transactionDate < rule.effectiveDate) {
    return false;
  }

  // Check expiry date
  if (rule.expiryDate && transaction.transactionDate > rule.expiryDate) {
    return false;
  }

  // Check if transaction entity is applicable
  if (rule.applicableEntities.length > 0 && 
      !rule.applicableEntities.includes(transaction.entity)) {
    return false;
  }

  // Check if transaction account is applicable
  if (rule.applicableAccounts.length > 0 && 
      !rule.applicableAccounts.includes(transaction.accountCode)) {
    return false;
  }

  // Check if transaction is between related entities
  const entityFrom = entities.find(e => e.id === transaction.entity);
  const entityTo = entities.find(e => e.id === transaction.counterparty);

  if (!entityFrom || !entityTo) {
    return false;
  }

  return areEntitiesRelated(entityFrom, entityTo, entities);
}

/**
 * Calculate markup amount for transaction
 * 
 * @param transaction - Transaction
 * @param rule - Transfer pricing rule
 * @returns Markup amount
 */
function calculateMarkupAmount(
  transaction: Transaction,
  rule: TransferPricingRule
): number {
  // Apply markup percentage to transaction amount
  return (transaction.amount * rule.markupPercentage) / 100;
}

/**
 * Check if two entities are related
 * 
 * @param entity1 - First entity
 * @param entity2 - Second entity
 * @param allEntities - All entities for relationship checking
 * @returns True if entities are related
 */
function areEntitiesRelated(
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
 * Generate transfer pricing adjustments for transactions
 * 
 * @param transactions - Transactions to process
 * @param rules - Transfer pricing rules
 * @param entities - Available entities
 * @returns Transfer pricing adjustments
 * 
 * @example
 * ```typescript
 * const adjustments = generateTransferPricingAdjustments(transactions, rules, entities);
 * ```
 */
export function generateTransferPricingAdjustments(
  transactions: readonly Transaction[],
  rules: readonly TransferPricingRule[],
  entities: readonly ConsolidationEntity[]
): readonly TransferPricingAdjustment[] {
  const adjustments: TransferPricingAdjustment[] = [];

  for (const transaction of transactions) {
    for (const rule of rules) {
      const adjustment = applyTransferPricingRule(transaction, rule, entities);
      if (adjustment) {
        adjustments.push(adjustment);
      }
    }
  }

  return adjustments;
}

/**
 * Create transfer pricing journal entries
 * 
 * @param adjustments - Transfer pricing adjustments
 * @returns Journal entries for adjustments
 */
export function createTransferPricingJournalEntries(
  adjustments: readonly TransferPricingAdjustment[]
): readonly JournalEntry[] {
  const entries: JournalEntry[] = [];

  for (const adjustment of adjustments) {
    const entry: JournalEntry = {
      id: `tp-entry-${adjustment.id}`,
      date: adjustment.adjustmentDate,
      reference: `TP-${adjustment.ruleId}`,
      description: adjustment.description,
      lines: [
        {
          id: `tp-line-1-${adjustment.id}`,
          accountCode: 'TRANSFER_PRICING_ADJUSTMENT',
          debit: adjustment.adjustmentAmount,
          credit: 0,
          description: 'Transfer pricing markup',
          currency: adjustment.currency
        },
        {
          id: `tp-line-2-${adjustment.id}`,
          accountCode: 'TRANSFER_PRICING_ADJUSTMENT',
          debit: 0,
          credit: adjustment.adjustmentAmount,
          description: 'Transfer pricing markup elimination',
          currency: adjustment.currency
        }
      ],
      totalDebits: adjustment.adjustmentAmount,
      totalCredits: adjustment.adjustmentAmount,
      currency: adjustment.currency,
      status: 'draft'
    };

    entries.push(entry);
  }

  return entries;
}

/**
 * Validate transfer pricing rule
 * 
 * @param rule - Rule to validate
 * @returns Validation result
 */
export function validateTransferPricingRule(
  rule: TransferPricingRule
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (!rule.id || rule.id.trim() === '') {
    errors.push('Rule ID is required');
  }

  if (!rule.name || rule.name.trim() === '') {
    errors.push('Rule name is required');
  }

  if (!rule.description || rule.description.trim() === '') {
    errors.push('Rule description is required');
  }

  // Validate markup percentage
  if (rule.markupPercentage < 0 || rule.markupPercentage > 100) {
    errors.push('Markup percentage must be between 0 and 100');
  }

  // Validate dates
  if (rule.effectiveDate > new Date()) {
    warnings.push('Effective date is in the future');
  }

  if (rule.expiryDate && rule.expiryDate <= rule.effectiveDate) {
    errors.push('Expiry date must be after effective date');
  }

  // Validate applicable entities and accounts
  if (rule.applicableEntities.length === 0) {
    warnings.push('No applicable entities specified - rule will apply to all entities');
  }

  if (rule.applicableAccounts.length === 0) {
    warnings.push('No applicable accounts specified - rule will apply to all accounts');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Create transfer pricing rule
 * 
 * @param id - Rule ID
 * @param name - Rule name
 * @param description - Rule description
 * @param markupPercentage - Markup percentage
 * @param options - Additional options
 * @returns Transfer pricing rule
 */
export function createTransferPricingRule(
  id: string,
  name: string,
  description: string,
  markupPercentage: number,
  options: {
    applicableEntities?: readonly string[];
    applicableAccounts?: readonly string[];
    effectiveDate?: Date;
    expiryDate?: Date;
    metadata?: Record<string, unknown>;
  } = {}
): TransferPricingRule {
  return {
    id,
    name,
    description,
    markupPercentage,
    applicableEntities: options.applicableEntities || [],
    applicableAccounts: options.applicableAccounts || [],
    isActive: true,
    effectiveDate: options.effectiveDate || new Date(),
    ...(options.expiryDate && { expiryDate: options.expiryDate }),
    metadata: {
      createdBy: 'system',
      version: '1.0',
      ...options.metadata
    }
  };
}

/**
 * Calculate transfer pricing impact
 * 
 * @param transactions - Transactions to analyze
 * @param rules - Transfer pricing rules
 * @param entities - Available entities
 * @returns Transfer pricing impact summary
 */
export function calculateTransferPricingImpact(
  transactions: readonly Transaction[],
  rules: readonly TransferPricingRule[],
  entities: readonly ConsolidationEntity[]
): TransferPricingImpact {
  const adjustments = generateTransferPricingAdjustments(transactions, rules, entities);
  
  const totalAdjustmentAmount = adjustments.reduce(
    (sum, adj) => sum + adj.adjustmentAmount,
    0
  );

  const adjustmentsByRule = new Map<string, number>();
  for (const adjustment of adjustments) {
    const current = adjustmentsByRule.get(adjustment.ruleId) || 0;
    adjustmentsByRule.set(adjustment.ruleId, current + adjustment.adjustmentAmount);
  }

  const adjustmentsByEntity = new Map<string, number>();
  for (const adjustment of adjustments) {
    const current = adjustmentsByEntity.get(adjustment.entityId) || 0;
    adjustmentsByEntity.set(adjustment.entityId, current + adjustment.adjustmentAmount);
  }

  return {
    totalAdjustmentAmount,
    adjustmentCount: adjustments.length,
    adjustmentsByRule: Object.fromEntries(adjustmentsByRule),
    adjustmentsByEntity: Object.fromEntries(adjustmentsByEntity),
    averageAdjustmentAmount: adjustments.length > 0 ? totalAdjustmentAmount / adjustments.length : 0,
    calculationDate: new Date()
  };
}

/**
 * Transfer pricing impact summary
 */
export interface TransferPricingImpact {
  readonly totalAdjustmentAmount: number;
  readonly adjustmentCount: number;
  readonly adjustmentsByRule: Record<string, number>;
  readonly adjustmentsByEntity: Record<string, number>;
  readonly averageAdjustmentAmount: number;
  readonly calculationDate: Date;
}

/**
 * Get active transfer pricing rules
 * 
 * @param rules - All transfer pricing rules
 * @param asOfDate - Date to check activity as of
 * @returns Active rules
 */
export function getActiveTransferPricingRules(
  rules: readonly TransferPricingRule[],
  asOfDate: Date = new Date()
): readonly TransferPricingRule[] {
  return rules.filter(rule => 
    rule.isActive &&
    rule.effectiveDate <= asOfDate &&
    (!rule.expiryDate || rule.expiryDate > asOfDate)
  );
}

/**
 * Get transfer pricing rules applicable to entity
 * 
 * @param rules - All transfer pricing rules
 * @param entityId - Entity ID
 * @returns Applicable rules
 */
export function getTransferPricingRulesForEntity(
  rules: readonly TransferPricingRule[],
  entityId: string
): readonly TransferPricingRule[] {
  return rules.filter(rule => 
    rule.applicableEntities.length === 0 || 
    rule.applicableEntities.includes(entityId)
  );
}

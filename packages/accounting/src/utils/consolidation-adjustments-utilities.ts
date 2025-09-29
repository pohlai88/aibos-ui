/**
 * Consolidation Adjustments - SSOT Implementation
 * 
 * Consolidation adjustment generation and management utilities.
 * Imports from consolidation-types.ts for consistency.
 */

import type {
  ConsolidationAdjustment,
  DueToDueFromBalance,
  ConsolidationEntity,
  AdjustmentType
} from './consolidation-types-utilities';
import type { FiscalPeriod } from './fiscal-period-utilities';

// ============================================================================
// CONSOLIDATION ADJUSTMENTS
// ============================================================================

/**
 * Generate consolidation adjustments
 * 
 * @param entities - Consolidation entities
 * @param period - Fiscal period
 * @param adjustmentTypes - Types of adjustments to generate
 * @returns Array of consolidation adjustments
 * 
 * @example
 * ```typescript
 * const adjustments = generateConsolidationAdjustments(entities, period, ['elimination', 'currency_translation']);
 * ```
 */
export function generateConsolidationAdjustments(
  entities: readonly ConsolidationEntity[],
  period: FiscalPeriod,
  adjustmentTypes: readonly AdjustmentType[] = ['elimination', 'currency_translation']
): readonly ConsolidationAdjustment[] {
  const adjustments: ConsolidationAdjustment[] = [];

  for (const entity of entities) {
    for (const adjustmentType of adjustmentTypes) {
      const entityAdjustments = generateEntityAdjustments(entity, period, adjustmentType);
      adjustments.push(...entityAdjustments);
    }
  }

  return adjustments;
}

/**
 * Generate adjustments for a specific entity and type
 * 
 * @param entity - Entity to generate adjustments for
 * @param period - Fiscal period
 * @param adjustmentType - Type of adjustment
 * @returns Array of adjustments for the entity
 */
function generateEntityAdjustments(
  entity: ConsolidationEntity,
  period: FiscalPeriod,
  adjustmentType: AdjustmentType
): readonly ConsolidationAdjustment[] {
  const adjustments: ConsolidationAdjustment[] = [];

  switch (adjustmentType) {
    case 'elimination':
      adjustments.push(...generateEliminationAdjustments(entity, period));
      break;
    case 'currency_translation':
      adjustments.push(...generateCurrencyTranslationAdjustments(entity, period));
      break;
    case 'fair_value':
      adjustments.push(...generateFairValueAdjustments(entity, period));
      break;
    case 'goodwill':
      adjustments.push(...generateGoodwillAdjustments(entity, period));
      break;
    case 'minority_interest':
      adjustments.push(...generateMinorityInterestAdjustments(entity, period));
      break;
    case 'other':
      adjustments.push(...generateOtherAdjustments(entity, period));
      break;
  }

  return adjustments;
}

/**
 * Generate elimination adjustments
 * 
 * @param entity - Entity
 * @param period - Fiscal period
 * @returns Elimination adjustments
 */
function generateEliminationAdjustments(
  entity: ConsolidationEntity,
  period: FiscalPeriod
): readonly ConsolidationAdjustment[] {
  // This would calculate actual elimination amounts based on intercompany transactions
  const eliminationAmount = 0; // Placeholder calculation

  if (eliminationAmount === 0) {
    return [];
  }

  return [{
    id: `elimination-${entity.id}-${period.period}`,
    entityId: entity.id,
    adjustmentType: 'elimination',
    amount: eliminationAmount,
    currency: entity.currency,
    adjustmentDate: period.endDate,
    description: `Elimination adjustment for ${entity.name}`,
    isReversed: false,
    metadata: {
      period: period.period,
      entityType: entity.type,
      consolidationMethod: entity.consolidationMethod
    }
  }];
}

/**
 * Generate currency translation adjustments
 * 
 * @param entity - Entity
 * @param period - Fiscal period
 * @returns Currency translation adjustments
 */
function generateCurrencyTranslationAdjustments(
  entity: ConsolidationEntity,
  period: FiscalPeriod
): readonly ConsolidationAdjustment[] {
  // This would calculate currency translation adjustments based on exchange rates
  const translationAmount = 0; // Placeholder calculation

  if (translationAmount === 0) {
    return [];
  }

  return [{
    id: `currency-translation-${entity.id}-${period.period}`,
    entityId: entity.id,
    adjustmentType: 'currency_translation',
    amount: translationAmount,
    currency: entity.currency,
    adjustmentDate: period.endDate,
    description: `Currency translation adjustment for ${entity.name}`,
    isReversed: false,
    metadata: {
      period: period.period,
      entityCurrency: entity.currency,
      reportingCurrency: 'MYR' // This would come from configuration
    }
  }];
}

/**
 * Generate fair value adjustments
 * 
 * @param entity - Entity
 * @param period - Fiscal period
 * @returns Fair value adjustments
 */
function generateFairValueAdjustments(
  entity: ConsolidationEntity,
  period: FiscalPeriod
): readonly ConsolidationAdjustment[] {
  // This would calculate fair value adjustments based on asset valuations
  const fairValueAmount = 0; // Placeholder calculation

  if (fairValueAmount === 0) {
    return [];
  }

  return [{
    id: `fair-value-${entity.id}-${period.period}`,
    entityId: entity.id,
    adjustmentType: 'fair_value',
    amount: fairValueAmount,
    currency: entity.currency,
    adjustmentDate: period.endDate,
    description: `Fair value adjustment for ${entity.name}`,
    isReversed: false,
    metadata: {
      period: period.period,
      valuationDate: period.endDate,
      valuationMethod: 'market_value'
    }
  }];
}

/**
 * Generate goodwill adjustments
 * 
 * @param entity - Entity
 * @param period - Fiscal period
 * @returns Goodwill adjustments
 */
function generateGoodwillAdjustments(
  entity: ConsolidationEntity,
  period: FiscalPeriod
): readonly ConsolidationAdjustment[] {
  // This would calculate goodwill adjustments based on acquisition costs
  const goodwillAmount = 0; // Placeholder calculation

  if (goodwillAmount === 0) {
    return [];
  }

  return [{
    id: `goodwill-${entity.id}-${period.period}`,
    entityId: entity.id,
    adjustmentType: 'goodwill',
    amount: goodwillAmount,
    currency: entity.currency,
    adjustmentDate: period.endDate,
    description: `Goodwill adjustment for ${entity.name}`,
    isReversed: false,
    metadata: {
      period: period.period,
      acquisitionDate: entity.effectiveDate,
      goodwillCalculation: 'purchase_price_minus_fair_value'
    }
  }];
}

/**
 * Generate minority interest adjustments
 * 
 * @param entity - Entity
 * @param period - Fiscal period
 * @returns Minority interest adjustments
 */
function generateMinorityInterestAdjustments(
  entity: ConsolidationEntity,
  period: FiscalPeriod
): readonly ConsolidationAdjustment[] {
  // This would calculate minority interest adjustments based on ownership percentages
  const minorityInterestAmount = 0; // Placeholder calculation

  if (minorityInterestAmount === 0) {
    return [];
  }

  return [{
    id: `minority-interest-${entity.id}-${period.period}`,
    entityId: entity.id,
    adjustmentType: 'minority_interest',
    amount: minorityInterestAmount,
    currency: entity.currency,
    adjustmentDate: period.endDate,
    description: `Minority interest adjustment for ${entity.name}`,
    isReversed: false,
    metadata: {
      period: period.period,
      ownershipPercentage: entity.ownershipPercentage,
      minorityPercentage: 100 - entity.ownershipPercentage
    }
  }];
}

/**
 * Generate other adjustments
 * 
 * @param entity - Entity
 * @param period - Fiscal period
 * @returns Other adjustments
 */
function generateOtherAdjustments(
  _entity: ConsolidationEntity,
  _period: FiscalPeriod
): readonly ConsolidationAdjustment[] {
  // This would generate any other consolidation adjustments
  return [];
}

/**
 * Calculate due-to/due-from balances for entities
 * 
 * @param entities - Consolidation entities
 * @param period - Fiscal period
 * @returns Due-to/due-from balances
 * 
 * @example
 * ```typescript
 * const balances = calculateDueToDueFrom(entities, period);
 * ```
 */
export function calculateDueToDueFrom(
  entities: readonly ConsolidationEntity[],
  period: FiscalPeriod
): readonly DueToDueFromBalance[] {
  const balances: DueToDueFromBalance[] = [];

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const entity1 = entities[i]!;
      const entity2 = entities[j]!;

      if (!areEntitiesRelated(entity1, entity2, entities)) continue;

      const balance: DueToDueFromBalance = {
        balanceId: `balance-${entity1.id}-${entity2.id}-${period.period}`,
        entityFrom: entity1.id,
        entityTo: entity2.id,
        dueToAmount: 0, // This would be calculated from actual transactions
        dueFromAmount: 0, // This would be calculated from actual transactions
        currency: entity1.currency,
        balanceDate: period.endDate,
        netBalance: 0 // This would be calculated as dueToAmount - dueFromAmount
      };

      balances.push(balance);
    }
  }

  return balances;
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
 * Reverse consolidation adjustment
 * 
 * @param adjustment - Adjustment to reverse
 * @param reversalDate - Date of reversal
 * @returns Reversed adjustment
 */
export function reverseConsolidationAdjustment(
  adjustment: ConsolidationAdjustment,
  reversalDate: Date = new Date()
): ConsolidationAdjustment {
  return {
    ...adjustment,
    id: `reversal-${adjustment.id}`,
    amount: -adjustment.amount,
    adjustmentDate: reversalDate,
    description: `Reversal of: ${adjustment.description}`,
    isReversed: true,
    reversalDate: reversalDate,
    metadata: {
      ...adjustment.metadata,
      originalAdjustmentId: adjustment.id,
      reversalDate: reversalDate.toISOString()
    }
  };
}

/**
 * Validate consolidation adjustment
 * 
 * @param adjustment - Adjustment to validate
 * @returns Validation result
 */
export function validateConsolidationAdjustment(
  adjustment: ConsolidationAdjustment
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (!adjustment.id || adjustment.id.trim() === '') {
    errors.push('Adjustment ID is required');
  }

  if (!adjustment.entityId || adjustment.entityId.trim() === '') {
    errors.push('Entity ID is required');
  }

  if (!adjustment.description || adjustment.description.trim() === '') {
    errors.push('Description is required');
  }

  // Validate amount
  if (adjustment.amount === 0) {
    warnings.push('Adjustment amount is zero');
  }

  // Validate adjustment type
  const validTypes: AdjustmentType[] = [
    'elimination', 'currency_translation', 'fair_value', 
    'goodwill', 'minority_interest', 'other'
  ];
  
  if (!validTypes.includes(adjustment.adjustmentType)) {
    errors.push(`Invalid adjustment type: ${adjustment.adjustmentType}`);
  }

  // Validate dates
  if (adjustment.adjustmentDate > new Date()) {
    warnings.push('Adjustment date is in the future');
  }

  if (adjustment.isReversed && !adjustment.reversalDate) {
    errors.push('Reversal date is required for reversed adjustments');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Create consolidation adjustment
 * 
 * @param entityId - Entity ID
 * @param adjustmentType - Type of adjustment
 * @param amount - Adjustment amount
 * @param currency - Currency
 * @param description - Description
 * @param options - Additional options
 * @returns Consolidation adjustment
 */
export function createConsolidationAdjustment(
  entityId: string,
  adjustmentType: AdjustmentType,
  amount: number,
  currency: string,
  description: string,
  options: {
    adjustmentDate?: Date;
    journalEntryId?: string;
    metadata?: Record<string, unknown>;
  } = {}
): ConsolidationAdjustment {
  return {
    id: `adj-${entityId}-${adjustmentType}-${Date.now()}`,
    entityId,
    adjustmentType,
    amount,
    currency: currency as unknown, // Type assertion for SupportedCurrency
    adjustmentDate: options.adjustmentDate || new Date(),
    description,
    ...(options.journalEntryId && { journalEntryId: options.journalEntryId }),
    isReversed: false,
    metadata: {
      createdBy: 'system',
      version: '1.0',
      ...options.metadata
    }
  };
}

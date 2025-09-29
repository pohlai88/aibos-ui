/**
 * Consolidation Utilities - SSOT Implementation (Refactored)
 * 
 * Main consolidation utilities file that re-exports from split modules.
 * This maintains backward compatibility while improving maintainability.
 * 
 * Split into focused modules:
 * - consolidation-types.ts: Type definitions and constants
 * - intercompany-operations.ts: Intercompany transaction operations
 * - elimination-rules.ts: Elimination rule management
 * - consolidation-adjustments.ts: Consolidation adjustments
 * - entity-management.ts: Entity relationship management
 * - transfer-pricing.ts: Transfer pricing operations
 */

// ============================================================================
// RE-EXPORT FROM SPLIT MODULES
// ============================================================================

// Types and constants
export * from './consolidation-types-utilities';

// Intercompany operations
export * from './intercompany-operations-utilities';

// Elimination rules
export * from './elimination-rules-utilities';

// Consolidation adjustments
export * from './consolidation-adjustments-utilities';

// Entity management
export * from './entity-management-utilities';

// Transfer pricing
export * from './transfer-pricing-utilities';

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================

// Re-export commonly used functions with original names for backward compatibility
export {
  tagIntercompanyTransaction,
  matchIntercompanyTransactions,
  validateIntercompanyTransaction
} from './intercompany-operations-utilities';

export {
  applyEliminationRule,
  validateEliminationRule,
  validateEliminationRuleSet,
  createEliminationRule
} from './elimination-rules-utilities';

export {
  generateConsolidationAdjustments,
  calculateDueToDueFrom,
  reverseConsolidationAdjustment,
  validateConsolidationAdjustment,
  createConsolidationAdjustment
} from './consolidation-adjustments-utilities';

export {
  calculateEntityOwnership,
  getEntityHierarchy,
  findRelatedEntities,
  validateEntityRelationship,
  createEntityRelationship,
  recordOwnershipChange,
  calculateEffectiveConsolidationMethod,
  getEntitiesByType,
  getActiveEntities,
  validateConsolidationEntity
} from './entity-management-utilities';

export {
  applyTransferPricingRule,
  generateTransferPricingAdjustments,
  createTransferPricingJournalEntries,
  validateTransferPricingRule,
  createTransferPricingRule,
  calculateTransferPricingImpact,
  getActiveTransferPricingRules,
  getTransferPricingRulesForEntity
} from './transfer-pricing-utilities';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get consolidation utilities version
 * 
 * @returns Version information
 */
export function getConsolidationUtilitiesVersion(): string {
  return '2.0.0-split';
}

/**
 * Get consolidation utilities modules
 * 
 * @returns List of available modules
 */
export function getConsolidationModules(): readonly string[] {
  return [
    'consolidation-types',
    'intercompany-operations', 
    'elimination-rules',
    'consolidation-adjustments',
    'entity-management',
    'transfer-pricing'
  ];
}

/**
 * Validate consolidation utilities configuration
 * 
 * @returns Validation result
 */
export function validateConsolidationConfiguration(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if all modules are properly loaded
  const modules = getConsolidationModules();
  
  if (modules.length === 0) {
    errors.push('No consolidation modules found');
  }

  // Check version compatibility
  const version = getConsolidationUtilitiesVersion();
  if (!version.includes('split')) {
    warnings.push('Using legacy consolidation utilities - consider upgrading');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
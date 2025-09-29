/**
 * Consolidation Utilities - Enterprise Production Ready
 * 
 * Comprehensive consolidation utilities for intercompany tagging,
 * elimination proposals, and consolidation adjustments.
 * 
 * Features:
 * - Intercompany transaction tagging and matching
 * - Elimination rules and proposals
 * - Consolidation adjustment entries
 * - Entity relationship management
 * - Integration with existing journal entry and validation utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   tagIntercompanyTransaction,
 *   applyEliminationRule,
 *   generateConsolidationAdjustments,
 *   calculateEntityOwnership
 * } from './consolidation-utilities';
 * 
 * // Tag intercompany transaction
 * const tag = tagIntercompanyTransaction(transaction, entities);
 * 
 * // Apply elimination rule
 * const elimination = applyEliminationRule(rule, transactions);
 * ```
 */

import type { 
  SupportedCurrency
} from './accounting-utilities';
import type { 
  JournalEntry,
  JournalLine
} from './journal-entry-utilities';
import type { 
  FiscalPeriod,
  ValidationResult
} from './fiscal-period-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Consolidation entity with ownership information
 */
export interface ConsolidationEntity {
  readonly id: string;
  readonly name: string;
  readonly type: EntityType;
  readonly parent?: string;
  readonly ownership: OwnershipPercentage;
  readonly currency: SupportedCurrency;
  readonly reportingCurrency: SupportedCurrency;
  readonly consolidationMethod: ConsolidationMethod;
  readonly status: EntityStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Intercompany transaction tag
 */
export interface IntercompanyTag {
  readonly transaction: Transaction;
  readonly entities: readonly ConsolidationEntity[];
  readonly isIntercompany: boolean;
  readonly counterparty: string;
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly tagDate: Date;
}

/**
 * Elimination rule configuration
 */
export interface EliminationRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly accountPatterns: readonly AccountPattern[];
  readonly entityPatterns: readonly EntityPattern[];
  readonly eliminationMethod: EliminationMethod;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Elimination result
 */
export interface EliminationResult {
  readonly rule: EliminationRule;
  readonly transactions: readonly Transaction[];
  readonly eliminatedAmount: number;
  readonly eliminationEntries: readonly JournalEntry[];
  readonly calculationDate: Date;
}

/**
 * Consolidation adjustment
 */
export interface ConsolidationAdjustment {
  readonly id: string;
  readonly entity: ConsolidationEntity;
  readonly adjustmentType: AdjustmentType;
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly period: FiscalPeriod;
  readonly description: string;
  readonly journalEntry: JournalEntry;
  readonly createdAt: Date;
}

/**
 * Ownership percentage information
 */
export interface OwnershipPercentage {
  readonly entity: string;
  readonly percentage: number;
  readonly effectiveDate: Date;
  readonly expiryDate?: Date;
  readonly status: OwnershipStatus;
}

/**
 * Transaction entity
 */
export interface Transaction {
  readonly id: string;
  readonly entity: string;
  readonly counterparty: string;
  readonly account: string;
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly date: Date;
  readonly description: string;
  readonly reference?: string;
  readonly type: TransactionType;
}

/**
 * Account pattern for elimination rules
 */
export interface AccountPattern {
  readonly pattern: string;
  readonly matchType: PatternMatchType;
  readonly active: boolean;
}

/**
 * Entity pattern for elimination rules
 */
export interface EntityPattern {
  readonly pattern: string;
  readonly matchType: PatternMatchType;
  readonly active: boolean;
}

/**
 * Intercompany match result
 */
export interface IntercompanyMatch {
  readonly transaction1: Transaction;
  readonly transaction2: Transaction;
  readonly matchType: MatchType;
  readonly confidence: number;
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly matchDate: Date;
}

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Entity types
 */
export type EntityType = 
  | 'parent'
  | 'subsidiary'
  | 'associate'
  | 'joint_venture'
  | 'branch'
  | 'division';

/**
 * Consolidation methods
 */
export type ConsolidationMethod = 
  | 'full_consolidation'
  | 'equity_method'
  | 'proportional_consolidation'
  | 'cost_method';

/**
 * Entity status
 */
export type EntityStatus = 
  | 'active'
  | 'inactive'
  | 'disposed'
  | 'acquired'
  | 'merged'
  | 'liquidated';

/**
 * Elimination methods
 */
export type EliminationMethod = 
  | 'automatic'
  | 'manual'
  | 'semi_automatic';

/**
 * Adjustment types
 */
export type AdjustmentType = 
  | 'elimination'
  | 'currency_translation'
  | 'fair_value'
  | 'goodwill'
  | 'minority_interest'
  | 'other';

/**
 * Ownership status
 */
export type OwnershipStatus = 
  | 'active'
  | 'pending'
  | 'expired'
  | 'cancelled'
  | 'suspended';

/**
 * Transaction types
 */
export type TransactionType = 
  | 'sale'
  | 'purchase'
  | 'loan'
  | 'dividend'
  | 'fee'
  | 'interest'
  | 'transfer'
  | 'other';

/**
 * Pattern match types
 */
export type PatternMatchType = 
  | 'exact'
  | 'starts_with'
  | 'ends_with'
  | 'contains'
  | 'regex';

/**
 * Match types
 */
export type MatchType = 
  | 'exact'
  | 'tolerance'
  | 'manual'
  | 'partial';

/**
 * Entity type configurations
 */
export const ENTITY_TYPES = {
  parent: { name: 'Parent Company', consolidates: true, ownershipThreshold: 50 },
  subsidiary: { name: 'Subsidiary', consolidates: true, ownershipThreshold: 50 },
  associate: { name: 'Associate', consolidates: false, ownershipThreshold: 20 },
  joint_venture: { name: 'Joint Venture', consolidates: true, ownershipThreshold: 50 },
  branch: { name: 'Branch', consolidates: true, ownershipThreshold: 100 },
  division: { name: 'Division', consolidates: true, ownershipThreshold: 100 }
} as const;

/**
 * Consolidation method configurations
 */
export const CONSOLIDATION_METHODS = {
  full_consolidation: { name: 'Full Consolidation', description: '100% consolidation with minority interest' },
  equity_method: { name: 'Equity Method', description: 'Investment accounted for using equity method' },
  proportional_consolidation: { name: 'Proportional Consolidation', description: 'Consolidation based on ownership percentage' },
  cost_method: { name: 'Cost Method', description: 'Investment carried at cost' }
} as const;

// ============================================================================
// INTERCOMPANY OPERATIONS
// ============================================================================

/**
 * Tag intercompany transaction
 * 
 * @param transaction - Transaction to tag
 * @param entities - Consolidation entities
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
  // Find entities involved in the transaction
  const entity1 = entities.find(e => e.id === transaction.entity);
  const entity2 = entities.find(e => e.id === transaction.counterparty);

  if (!entity1 || !entity2) {
    throw new Error('Transaction entities not found in consolidation group');
  }

  // Check if entities are in the same consolidation group
  const isIntercompany = areEntitiesRelated(entity1, entity2, entities);

  return {
    transaction,
    entities: [entity1, entity2],
    isIntercompany,
    counterparty: transaction.counterparty,
    amount: transaction.amount,
    currency: transaction.currency,
    tagDate: new Date()
  };
}

/**
 * Validate intercompany tag
 * 
 * @param tag - Intercompany tag to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateIntercompanyTag(tag);
 * if (!validation.isValid) {
 *   console.error('Tag validation failed:', validation.errors);
 * }
 * ```
 */
export function validateIntercompanyTag(tag: IntercompanyTag): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate transaction
  if (!tag.transaction.id) {
    errors.push('Transaction ID is required');
  }

  if (tag.transaction.amount === 0) {
    errors.push('Transaction amount cannot be zero');
  }

  // Validate entities
  if (tag.entities.length !== 2) {
    errors.push('Exactly two entities must be involved in intercompany transaction');
  }

  // Validate amount consistency
  if (tag.amount !== tag.transaction.amount) {
    errors.push('Tag amount must match transaction amount');
  }

  // Validate currency consistency
  if (tag.currency !== tag.transaction.currency) {
    errors.push('Tag currency must match transaction currency');
  }

  // Warnings
  if (tag.isIntercompany && tag.amount < 0) {
    warnings.push('Intercompany transaction amount is negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Find intercompany matches
 * 
 * @param transactions - Transactions to match
 * @param entities - Consolidation entities
 * @returns Intercompany matches
 * 
 * @example
 * ```typescript
 * const matches = findIntercompanyMatches(transactions, entities);
 * ```
 */
export function findIntercompanyMatches(
  transactions: readonly Transaction[],
  entities: readonly ConsolidationEntity[]
): readonly IntercompanyMatch[] {
  const matches: IntercompanyMatch[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < transactions.length; i++) {
    const transaction1 = transactions[i];
    if (!transaction1) continue;
    
    if (processed.has(transaction1.id)) continue;

    for (let j = i + 1; j < transactions.length; j++) {
      const transaction2 = transactions[j];
      if (!transaction2) continue;
      
      if (processed.has(transaction2.id)) continue;

      // Check if transactions are intercompany matches
      const match = findTransactionMatch(transaction1, transaction2, entities);
      
      if (match) {
        matches.push(match);
        processed.add(transaction1.id);
        processed.add(transaction2.id);
        break;
      }
    }
  }

  return matches;
}

// ============================================================================
// ELIMINATION RULES
// ============================================================================

/**
 * Define elimination rule
 * 
 * @param rule - Elimination rule to define
 * @returns void
 * 
 * @example
 * ```typescript
 * defineEliminationRule({
 *   id: 'rule-001',
 *   name: 'Intercompany Sales',
 *   description: 'Eliminate intercompany sales',
 *   accountPatterns: [{ pattern: '4*', matchType: 'starts_with', active: true }],
 *   entityPatterns: [{ pattern: 'SUBSIDIARY', matchType: 'contains', active: true }],
 *   eliminationMethod: 'automatic',
 *   active: true
 * });
 * ```
 */
export function defineEliminationRule(rule: EliminationRule): void {
  // Validate rule
  const validation = validateEliminationRule(rule);
  if (!validation.isValid) {
    throw new Error(`Invalid elimination rule: ${validation.errors.join(', ')}`);
  }

  // Store rule (in real implementation, this would persist to database)
  // For now, we just validate and return
}

/**
 * Apply elimination rule
 * 
 * @param rule - Elimination rule
 * @param transactions - Transactions to apply rule to
 * @returns Elimination result
 * 
 * @example
 * ```typescript
 * const elimination = applyEliminationRule(rule, transactions);
 * ```
 */
export function applyEliminationRule(
  rule: EliminationRule,
  transactions: readonly Transaction[]
): EliminationResult {
  // Validate rule
  if (!rule.active) {
    throw new Error('Elimination rule must be active');
  }

  // Find matching transactions
  const matchingTransactions = findMatchingTransactions(rule, transactions);
  
  // Calculate eliminated amount
  const eliminatedAmount = matchingTransactions.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amount),
    0
  );

  // Generate elimination entries
  const eliminationEntries = generateEliminationEntries(rule, matchingTransactions);

  return {
    rule,
    transactions: matchingTransactions,
    eliminatedAmount,
    eliminationEntries,
    calculationDate: new Date()
  };
}

/**
 * Validate elimination rule
 * 
 * @param rule - Elimination rule to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateEliminationRule(rule);
 * if (!validation.isValid) {
 *   console.error('Rule validation failed:', validation.errors);
 * }
 * ```
 */
export function validateEliminationRule(rule: EliminationRule): ValidationResult {
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

  // Validate patterns
  if (rule.accountPatterns.length === 0) {
    errors.push('At least one account pattern is required');
  }

  if (rule.entityPatterns.length === 0) {
    errors.push('At least one entity pattern is required');
  }

  // Validate elimination method
  if (!['automatic', 'manual', 'semi_automatic'].includes(rule.eliminationMethod)) {
    errors.push(`Invalid elimination method: ${rule.eliminationMethod}`);
  }

  // Validate patterns
  for (const pattern of rule.accountPatterns) {
    if (!pattern.pattern || pattern.pattern.trim() === '') {
      errors.push('Account pattern cannot be empty');
    }

    if (!['exact', 'starts_with', 'ends_with', 'contains', 'regex'].includes(pattern.matchType)) {
      errors.push(`Invalid account pattern match type: ${pattern.matchType}`);
    }
  }

  for (const pattern of rule.entityPatterns) {
    if (!pattern.pattern || pattern.pattern.trim() === '') {
      errors.push('Entity pattern cannot be empty');
    }

    if (!['exact', 'starts_with', 'ends_with', 'contains', 'regex'].includes(pattern.matchType)) {
      errors.push(`Invalid entity pattern match type: ${pattern.matchType}`);
    }
  }

  // Warnings
  if (rule.accountPatterns.length > 10) {
    warnings.push('Large number of account patterns may impact performance');
  }

  if (rule.entityPatterns.length > 10) {
    warnings.push('Large number of entity patterns may impact performance');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// CONSOLIDATION ADJUSTMENTS
// ============================================================================

/**
 * Generate consolidation adjustments
 * 
 * @param entities - Consolidation entities
 * @param period - Fiscal period
 * @returns Consolidation adjustments
 * 
 * @example
 * ```typescript
 * const adjustments = generateConsolidationAdjustments(entities, period);
 * ```
 */
export function generateConsolidationAdjustments(
  entities: readonly ConsolidationEntity[],
  period: FiscalPeriod
): readonly ConsolidationAdjustment[] {
  const adjustments: ConsolidationAdjustment[] = [];

  // Generate adjustments for each entity
  for (const entity of entities) {
    if (entity.status !== 'active') continue;

    // Generate elimination adjustments
    const eliminationAdjustments = generateEliminationAdjustments(entity, period);
    adjustments.push(...eliminationAdjustments);

    // Generate currency translation adjustments
    if (entity.currency !== entity.reportingCurrency) {
      const currencyAdjustments = generateCurrencyTranslationAdjustments(entity, period);
      adjustments.push(...currencyAdjustments);
    }

    // Generate fair value adjustments
    const fairValueAdjustments = generateFairValueAdjustments(entity, period);
    adjustments.push(...fairValueAdjustments);
  }

  return adjustments;
}

/**
 * Post consolidation adjustments
 * 
 * @param adjustments - Consolidation adjustments
 * @returns Journal entries
 * 
 * @example
 * ```typescript
 * const entries = postConsolidationAdjustments(adjustments);
 * ```
 */
export function postConsolidationAdjustments(
  adjustments: readonly ConsolidationAdjustment[]
): readonly JournalEntry[] {
  const entries: JournalEntry[] = [];

  for (const adjustment of adjustments) {
    entries.push(adjustment.journalEntry);
  }

  return entries;
}

/**
 * Validate consolidation adjustments
 * 
 * @param adjustments - Consolidation adjustments to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateConsolidationAdjustments(adjustments);
 * if (!validation.isValid) {
 *   console.error('Adjustment validation failed:', validation.errors);
 * }
 * ```
 */
export function validateConsolidationAdjustments(
  adjustments: readonly ConsolidationAdjustment[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate each adjustment
  for (const adjustment of adjustments) {
    if (!adjustment.id || adjustment.id.trim() === '') {
      errors.push(`Adjustment ID is required for ${adjustment.entity.name}`);
    }

    if (adjustment.amount === 0) {
      errors.push(`Adjustment amount cannot be zero for ${adjustment.entity.name}`);
    }

    if (!adjustment.description || adjustment.description.trim() === '') {
      errors.push(`Adjustment description is required for ${adjustment.entity.name}`);
    }

    // Validate journal entry
    const entryValidation = validateJournalEntry(adjustment.journalEntry);
    if (!entryValidation.isValid) {
      errors.push(...entryValidation.errors.map((e: string) => `${adjustment.entity.name}: ${e}`));
    }

    // Validate period
    if (adjustment.period.startDate >= adjustment.period.endDate) {
      errors.push(`Invalid period for ${adjustment.entity.name}`);
    }
  }

  // Check for duplicate adjustments
  const adjustmentIds = adjustments.map(a => a.id);
  const duplicateIds = adjustmentIds.filter((id, index) => adjustmentIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate adjustment IDs: ${duplicateIds.join(', ')}`);
  }

  // Warnings
  if (adjustments.length > 100) {
    warnings.push('Large number of adjustments may impact performance');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// ENTITY MANAGEMENT
// ============================================================================

/**
 * Define consolidation entity
 * 
 * @param entity - Consolidation entity to define
 * @returns void
 * 
 * @example
 * ```typescript
 * defineConsolidationEntity({
 *   id: 'entity-001',
 *   name: 'Subsidiary A',
 *   type: 'subsidiary',
 *   parent: 'parent-001',
 *   ownership: { entity: 'parent-001', percentage: 80, effectiveDate: new Date(), status: 'active' },
 *   currency: 'USD',
 *   reportingCurrency: 'USD',
 *   consolidationMethod: 'full_consolidation',
 *   status: 'active'
 * });
 * ```
 */
export function defineConsolidationEntity(entity: ConsolidationEntity): void {
  // Validate entity
  const validation = validateConsolidationEntity(entity);
  if (!validation.isValid) {
    throw new Error(`Invalid consolidation entity: ${validation.errors.join(', ')}`);
  }

  // Store entity (in real implementation, this would persist to database)
  // For now, we just validate and return
}

/**
 * Validate consolidation entity
 * 
 * @param entity - Consolidation entity to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateConsolidationEntity(entity);
 * if (!validation.isValid) {
 *   console.error('Entity validation failed:', validation.errors);
 * }
 * ```
 */
export function validateConsolidationEntity(entity: ConsolidationEntity): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (!entity.id || entity.id.trim() === '') {
    errors.push('Entity ID is required');
  }

  if (!entity.name || entity.name.trim() === '') {
    errors.push('Entity name is required');
  }

  // Validate entity type
  if (!Object.keys(ENTITY_TYPES).includes(entity.type)) {
    errors.push(`Invalid entity type: ${entity.type}`);
  }

  // Validate ownership
  if (entity.ownership.percentage < 0 || entity.ownership.percentage > 100) {
    errors.push('Ownership percentage must be between 0 and 100');
  }

  // Validate currencies
  if (!entity.currency || entity.currency.trim() === '') {
    errors.push('Entity currency is required');
  }

  if (!entity.reportingCurrency || entity.reportingCurrency.trim() === '') {
    errors.push('Reporting currency is required');
  }

  // Validate consolidation method
  if (!Object.keys(CONSOLIDATION_METHODS).includes(entity.consolidationMethod)) {
    errors.push(`Invalid consolidation method: ${entity.consolidationMethod}`);
  }

  // Validate status
  if (!['active', 'inactive', 'disposed', 'acquired', 'merged', 'liquidated'].includes(entity.status)) {
    errors.push(`Invalid entity status: ${entity.status}`);
  }

  // Warnings
  if (entity.type === 'subsidiary' && !entity.parent) {
    warnings.push('Subsidiary entity should have a parent');
  }

  if (entity.ownership.percentage < 20 && entity.type === 'associate') {
    warnings.push('Associate ownership percentage is below 20%');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculate entity ownership
 * 
 * @param parent - Parent entity
 * @param subsidiary - Subsidiary entity
 * @returns Ownership percentage
 * 
 * @example
 * ```typescript
 * const ownership = calculateEntityOwnership(parent, subsidiary);
 * ```
 */
export function calculateEntityOwnership(
  parent: ConsolidationEntity,
  subsidiary: ConsolidationEntity
): OwnershipPercentage {
  // Validate entities
  if (parent.id === subsidiary.id) {
    throw new Error('Parent and subsidiary cannot be the same entity');
  }

  if (subsidiary.parent !== parent.id) {
    throw new Error('Subsidiary parent does not match parent entity');
  }

  return subsidiary.ownership;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if entities are related in consolidation group
 * 
 * @param entity1 - First entity
 * @param entity2 - Second entity
 * @param entities - All entities in consolidation group
 * @returns True if entities are related
 */
function areEntitiesRelated(
  entity1: ConsolidationEntity,
  entity2: ConsolidationEntity,
  entities: readonly ConsolidationEntity[]
): boolean {
  // Same entity
  if (entity1.id === entity2.id) return false;

  // Direct parent-child relationship
  if (entity1.id === entity2.parent || entity2.id === entity1.parent) return true;

  // Find common parent
  const parent1 = findParent(entity1, entities);
  const parent2 = findParent(entity2, entities);

  return parent1?.id === parent2?.id;
}

/**
 * Find parent entity
 * 
 * @param entity - Entity to find parent for
 * @param entities - All entities
 * @returns Parent entity or undefined
 */
function findParent(
  entity: ConsolidationEntity,
  entities: readonly ConsolidationEntity[]
): ConsolidationEntity | undefined {
  if (!entity.parent) return undefined;
  return entities.find(e => e.id === entity.parent);
}

/**
 * Find transaction match
 * 
 * @param transaction1 - First transaction
 * @param transaction2 - Second transaction
 * @param entities - Consolidation entities
 * @returns Match result or undefined
 */
function findTransactionMatch(
  transaction1: Transaction,
  transaction2: Transaction,
  entities: readonly ConsolidationEntity[]
): IntercompanyMatch | undefined {
  // Check if transactions are intercompany
  const entity1 = entities.find(e => e.id === transaction1.entity);
  const entity2 = entities.find(e => e.id === transaction2.entity);

  if (!entity1 || !entity2) return undefined;

  const isIntercompany = areEntitiesRelated(entity1, entity2, entities);
  if (!isIntercompany) return undefined;

  // Check for matching amounts (opposite signs)
  const amount1 = Math.abs(transaction1.amount);
  const amount2 = Math.abs(transaction2.amount);
  const tolerance = 0.01;

  if (Math.abs(amount1 - amount2) > tolerance) return undefined;

  // Check for same currency
  if (transaction1.currency !== transaction2.currency) return undefined;

  // Check for same date (within reasonable tolerance)
  const dateDiff = Math.abs(transaction1.date.getTime() - transaction2.date.getTime());
  const maxDateDiff = 30 * 24 * 60 * 60 * 1000; // 30 days

  if (dateDiff > maxDateDiff) return undefined;

  // Calculate confidence based on various factors
  let confidence = 0.8; // Base confidence

  // Same account increases confidence
  if (transaction1.account === transaction2.account) {
    confidence += 0.1;
  }

  // Same description increases confidence
  if (transaction1.description === transaction2.description) {
    confidence += 0.1;
  }

  // Closer dates increase confidence
  const dateConfidence = 1 - (dateDiff / maxDateDiff);
  confidence = (confidence + dateConfidence) / 2;

  return {
    transaction1,
    transaction2,
    matchType: 'tolerance',
    confidence,
    amount: amount1,
    currency: transaction1.currency,
    matchDate: new Date()
  };
}

/**
 * Find matching transactions for elimination rule
 * 
 * @param rule - Elimination rule
 * @param transactions - Transactions to search
 * @returns Matching transactions
 */
function findMatchingTransactions(
  rule: EliminationRule,
  transactions: readonly Transaction[]
): readonly Transaction[] {
  return transactions.filter(transaction => {
    // Check account patterns
    const accountMatches = rule.accountPatterns.some(pattern => 
      pattern.active && matchesPattern(transaction.account, pattern.pattern, pattern.matchType)
    );

    // Check entity patterns
    const entityMatches = rule.entityPatterns.some(pattern => 
      pattern.active && (matchesPattern(transaction.entity, pattern.pattern, pattern.matchType) ||
                        matchesPattern(transaction.counterparty, pattern.pattern, pattern.matchType))
    );

    return accountMatches && entityMatches;
  });
}

/**
 * Check if text matches pattern
 * 
 * @param text - Text to check
 * @param pattern - Pattern to match
 * @param matchType - Match type
 * @returns True if text matches pattern
 */
function matchesPattern(text: string, pattern: string, matchType: PatternMatchType): boolean {
  switch (matchType) {
    case 'exact':
      return text === pattern;
    case 'starts_with':
      return text.startsWith(pattern);
    case 'ends_with':
      return text.endsWith(pattern);
    case 'contains':
      return text.includes(pattern);
    case 'regex':
      try {
        const regex = new RegExp(pattern);
        return regex.test(text);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Generate elimination entries
 * 
 * @param rule - Elimination rule
 * @param transactions - Transactions to eliminate
 * @returns Elimination journal entries
 */
function generateEliminationEntries(
  rule: EliminationRule,
  transactions: readonly Transaction[]
): readonly JournalEntry[] {
  const entries: JournalEntry[] = [];

  // Group transactions by entity pair
  const entityPairs = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    const key = `${transaction.entity}-${transaction.counterparty}`;
    if (!entityPairs.has(key)) {
      entityPairs.set(key, []);
    }
    const pairTransactions = entityPairs.get(key);
    if (pairTransactions) {
      pairTransactions.push(transaction);
    }
  }

  // Generate elimination entry for each entity pair
  for (const [key, pairTransactions] of entityPairs) {
    const entry: JournalEntry = {
      id: `elimination-${rule.id}-${key}-${Date.now()}`,
      date: new Date(),
      reference: `ELIM-${rule.id}`,
      description: `Elimination: ${rule.name}`,
      lines: [],
      totalDebits: 0,
      totalCredits: 0,
      currency: pairTransactions[0]!.currency,
      status: 'draft'
    };

    // Add elimination lines
    for (const transaction of pairTransactions) {
      entry.lines.push({
        id: `line-${transaction.id}`,
        accountCode: transaction.account,
        description: `Elimination: ${transaction.description}`,
        debit: transaction.amount < 0 ? Math.abs(transaction.amount) : 0,
        credit: transaction.amount > 0 ? transaction.amount : 0,
        currency: transaction.currency
      });
    }

    // Calculate totals
    entry.totalDebits = entry.lines.reduce((sum: number, line: JournalLine) => sum + line.debit, 0);
    entry.totalCredits = entry.lines.reduce((sum: number, line: JournalLine) => sum + line.credit, 0);

    entries.push(entry);
  }

  return entries;
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
  const adjustments: ConsolidationAdjustment[] = [];

  // Generate intercompany elimination adjustment
  const eliminationAdjustment: ConsolidationAdjustment = {
    id: `elimination-${entity.id}-${period.period}`,
    entity,
    adjustmentType: 'elimination',
    amount: 0, // This would be calculated based on actual intercompany transactions
    currency: entity.currency,
    period,
    description: `Intercompany eliminations for ${entity.name}`,
    journalEntry: {
      id: `elimination-entry-${entity.id}-${period.period}`,
      date: period.endDate,
      reference: `ELIM-${entity.id}`,
      description: `Intercompany eliminations for ${entity.name}`,
      lines: [],
      totalDebits: 0,
      totalCredits: 0,
      currency: entity.currency,
      status: 'draft'
    },
    createdAt: new Date()
  };

  adjustments.push(eliminationAdjustment);

  return adjustments;
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
  const adjustments: ConsolidationAdjustment[] = [];

  // Generate currency translation adjustment
  const translationAdjustment: ConsolidationAdjustment = {
    id: `translation-${entity.id}-${period.period}`,
    entity,
    adjustmentType: 'currency_translation',
    amount: 0, // This would be calculated based on exchange rate differences
    currency: entity.reportingCurrency,
    period,
    description: `Currency translation for ${entity.name}`,
    journalEntry: {
      id: `translation-entry-${entity.id}-${period.period}`,
      date: period.endDate,
      reference: `TRANS-${entity.id}`,
      description: `Currency translation for ${entity.name}`,
      lines: [],
      totalDebits: 0,
      totalCredits: 0,
      currency: entity.reportingCurrency,
      status: 'draft'
    },
    createdAt: new Date()
  };

  adjustments.push(translationAdjustment);

  return adjustments;
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
  const adjustments: ConsolidationAdjustment[] = [];

  // Generate fair value adjustment
  const fairValueAdjustment: ConsolidationAdjustment = {
    id: `fair-value-${entity.id}-${period.period}`,
    entity,
    adjustmentType: 'fair_value',
    amount: 0, // This would be calculated based on fair value differences
    currency: entity.currency,
    period,
    description: `Fair value adjustment for ${entity.name}`,
    journalEntry: {
      id: `fair-value-entry-${entity.id}-${period.period}`,
      date: period.endDate,
      reference: `FAIR-${entity.id}`,
      description: `Fair value adjustment for ${entity.name}`,
      lines: [],
      totalDebits: 0,
      totalCredits: 0,
      currency: entity.currency,
      status: 'draft'
    },
    createdAt: new Date()
  };

  adjustments.push(fairValueAdjustment);

  return adjustments;
}

/**
 * Validate journal entry
 * 
 * @param entry - Journal entry to validate
 * @returns Validation result
 */
function validateJournalEntry(entry: JournalEntry): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (!entry.id || entry.id.trim() === '') {
    errors.push('Journal entry ID is required');
  }

  if (!entry.description || entry.description.trim() === '') {
    errors.push('Journal entry description is required');
  }

  if (entry.lines.length === 0) {
    errors.push('Journal entry must have at least one line');
  }

  // Validate balance
  if (Math.abs(entry.totalDebits - entry.totalCredits) > 0.01) {
    errors.push('Journal entry is not balanced');
  }

  // Validate lines
  for (const line of entry.lines) {
    if (!line.accountCode || line.accountCode.trim() === '') {
      errors.push('Line account is required');
    }

    if (line.debit < 0 || line.credit < 0) {
      errors.push('Line debit and credit amounts cannot be negative');
    }

    if (line.debit > 0 && line.credit > 0) {
      errors.push('Line cannot have both debit and credit amounts');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

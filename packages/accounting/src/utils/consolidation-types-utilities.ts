/**
 * Consolidation Types - SSOT Implementation
 * 
 * Centralized type definitions for consolidation operations.
 * Imports from core utilities for consistency.
 */

import type { 
  SupportedCurrency
} from './accounting-utilities';
import type { 
  JournalEntry
} from './journal-entry-utilities';

// ============================================================================
// CONSOLIDATION TYPES & INTERFACES
// ============================================================================

/**
 * Consolidation entity with ownership information
 */
export interface ConsolidationEntity {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly type: EntityType;
  readonly currency: SupportedCurrency;
  readonly country: string;
  readonly parentId?: string;
  readonly ownershipPercentage: number;
  readonly consolidationMethod: ConsolidationMethod;
  readonly isActive: boolean;
  readonly effectiveDate: Date;
  readonly expiryDate?: Date;
  readonly metadata: Record<string, unknown>;
}

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

// ============================================================================
// CONSOLIDATION CONSTANTS
// ============================================================================

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
// INTERCOMPANY TRANSACTION TYPES
// ============================================================================

/**
 * Intercompany transaction
 */
export interface Transaction {
  readonly id: string;
  readonly entity: string;
  readonly counterparty: string;
  readonly transactionType: TransactionType;
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly transactionDate: Date;
  readonly description: string;
  readonly accountCode: string;
  readonly journalEntryId?: string;
  readonly isEliminated: boolean;
  readonly eliminationDate?: Date;
  readonly metadata: Record<string, unknown>;
}

/**
 * Intercompany transaction tag
 */
export interface IntercompanyTag {
  readonly transactionId: string;
  readonly entityFrom: string;
  readonly entityTo: string;
  readonly transactionType: TransactionType;
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly tagDate: Date;
  readonly confidence: number;
  readonly method: 'automatic' | 'manual' | 'rule_based';
  readonly metadata: Record<string, unknown>;
}

// ============================================================================
// ELIMINATION RULE TYPES
// ============================================================================

/**
 * Account pattern for elimination rules
 */
export interface AccountPattern {
  readonly pattern: string;
  readonly matchType: PatternMatchType;
  readonly isActive: boolean;
}

/**
 * Entity pattern for elimination rules
 */
export interface EntityPattern {
  readonly pattern: string;
  readonly matchType: PatternMatchType;
  readonly isActive: boolean;
}

/**
 * Elimination rule
 */
export interface EliminationRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly eliminationMethod: EliminationMethod;
  readonly accountPatterns: readonly AccountPattern[];
  readonly entityPatterns: readonly EntityPattern[];
  readonly isActive: boolean;
  readonly effectiveDate: Date;
  readonly expiryDate?: Date;
  readonly priority: number;
  readonly metadata: Record<string, unknown>;
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

// ============================================================================
// CONSOLIDATION ADJUSTMENT TYPES
// ============================================================================

/**
 * Consolidation adjustment
 */
export interface ConsolidationAdjustment {
  readonly id: string;
  readonly entityId: string;
  readonly adjustmentType: AdjustmentType;
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly adjustmentDate: Date;
  readonly description: string;
  readonly journalEntryId?: string;
  readonly isReversed: boolean;
  readonly reversalDate?: Date;
  readonly metadata: Record<string, unknown>;
}

/**
 * Due-to/due-from balance
 */
export interface DueToDueFromBalance {
  readonly balanceId: string;
  readonly entityFrom: string;
  readonly entityTo: string;
  readonly dueToAmount: number;
  readonly dueFromAmount: number;
  readonly currency: SupportedCurrency;
  readonly balanceDate: Date;
  readonly netBalance: number;
}

// ============================================================================
// ENTITY RELATIONSHIP TYPES
// ============================================================================

/**
 * Entity relationship
 */
export interface EntityRelationship {
  readonly id: string;
  readonly parentId: string;
  readonly childId: string;
  readonly ownershipPercentage: number;
  readonly relationshipType: 'subsidiary' | 'associate' | 'joint_venture';
  readonly effectiveDate: Date;
  readonly expiryDate?: Date;
  readonly isActive: boolean;
  readonly metadata: Record<string, unknown>;
}

/**
 * Ownership change
 */
export interface OwnershipChange {
  readonly id: string;
  readonly entityId: string;
  readonly parentId: string;
  readonly oldOwnershipPercentage: number;
  readonly newOwnershipPercentage: number;
  readonly changeDate: Date;
  readonly changeType: 'acquisition' | 'disposal' | 'adjustment';
  readonly description: string;
  readonly metadata: Record<string, unknown>;
}

// ============================================================================
// TRANSFER PRICING TYPES
// ============================================================================

/**
 * Transfer pricing rule
 */
export interface TransferPricingRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly markupPercentage: number;
  readonly applicableEntities: readonly string[];
  readonly applicableAccounts: readonly string[];
  readonly isActive: boolean;
  readonly effectiveDate: Date;
  readonly expiryDate?: Date;
  readonly metadata: Record<string, unknown>;
}

/**
 * Transfer pricing adjustment
 */
export interface TransferPricingAdjustment {
  readonly id: string;
  readonly ruleId: string;
  readonly entityId: string;
  readonly adjustmentAmount: number;
  readonly currency: SupportedCurrency;
  readonly adjustmentDate: Date;
  readonly description: string;
  readonly journalEntryId?: string;
  readonly metadata: Record<string, unknown>;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Rule set validation result
 */
export interface RuleSetValidation {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
  readonly overlaps: readonly RuleOverlap[];
}

/**
 * Rule overlap information
 */
export interface RuleOverlap {
  readonly ruleA: string;
  readonly ruleB: string;
  readonly dimension: 'account' | 'entity' | 'both';
  readonly detail: string;
}

/**
 * Transaction match result
 */
export interface TransactionMatch {
  readonly transaction1: Transaction;
  readonly transaction2: Transaction;
  readonly matchType: MatchType;
  readonly matchConfidence: number;
  readonly matchDate: Date;
}

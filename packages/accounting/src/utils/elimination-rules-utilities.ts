/**
 * Elimination Rules - SSOT Implementation
 * 
 * Elimination rule management and processing utilities.
 * Imports from consolidation-types.ts for consistency.
 */

import type {
  EliminationRule,
  EliminationResult,
  Transaction,
  AccountPattern,
  EntityPattern,
  PatternMatchType,
  RuleSetValidation,
  RuleOverlap
} from './consolidation-types-utilities';
import type { JournalEntry } from './journal-entry-utilities';

// Validation result type
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// ELIMINATION RULE OPERATIONS
// ============================================================================

/**
 * Apply elimination rule to transactions
 * 
 * @param rule - Elimination rule to apply
 * @param transactions - Transactions to process
 * @returns Elimination result
 * 
 * @example
 * ```typescript
 * const result = applyEliminationRule(rule, transactions);
 * ```
 */
export function applyEliminationRule(
  rule: EliminationRule,
  transactions: readonly Transaction[]
): EliminationResult {
  // Find matching transactions
  const matchingTransactions = findMatchingTransactions(rule, transactions);
  
  // Calculate eliminated amount
  const eliminatedAmount = matchingTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
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
 * Find transactions matching elimination rule
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
      matchesPattern(transaction.accountCode, pattern.pattern, pattern.matchType)
    );

    // Check entity patterns
    const entityMatches = rule.entityPatterns.some(pattern =>
      matchesPattern(transaction.entity, pattern.pattern, pattern.matchType) ||
      matchesPattern(transaction.counterparty, pattern.pattern, pattern.matchType)
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
    entityPairs.get(key)!.push(transaction);
  }

  // Generate elimination entry for each entity pair
  for (const [key, pairTransactions] of entityPairs) {
    const totalAmount = pairTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    if (totalAmount > 0) {
      const entry: JournalEntry = {
        id: `elimination-${rule.id}-${key}-${Date.now()}`,
        date: new Date(),
        reference: `ELIM-${rule.id}`,
        description: `Elimination entry for rule: ${rule.name}`,
        lines: [
          {
            id: `line-1-${Date.now()}`,
            accountCode: 'ELIMINATION_ACCOUNT',
            debit: totalAmount,
            credit: 0,
            description: 'Elimination debit',
            currency: pairTransactions[0]!.currency
          },
          {
            id: `line-2-${Date.now()}`,
            accountCode: 'ELIMINATION_ACCOUNT',
            debit: 0,
            credit: totalAmount,
            description: 'Elimination credit',
            currency: pairTransactions[0]!.currency
          }
        ],
        totalDebits: totalAmount,
        totalCredits: totalAmount,
        currency: pairTransactions[0]!.currency,
        status: 'draft'
      };

      entries.push(entry);
    }
  }

  return entries;
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

/**
 * Validate elimination rule set for overlaps and hygiene issues
 * 
 * @param rules - Elimination rules to validate
 * @returns Rule set validation result
 * 
 * @example
 * ```typescript
 * const ruleCheck = validateEliminationRuleSet(eliminationRules);
 * if (!ruleCheck.isValid) {
 *   console.error(ruleCheck.errors);
 * }
 * if (ruleCheck.overlaps.length) {
 *   console.warn('Potential rule overlaps:', ruleCheck.overlaps);
 * }
 * ```
 */
export function validateEliminationRuleSet(rules: readonly EliminationRule[]): RuleSetValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const overlaps: RuleOverlap[] = [];

  // Check for duplicate rule IDs
  const ruleIds = new Set<string>();
  for (const rule of rules) {
    if (ruleIds.has(rule.id)) {
      errors.push(`Duplicate rule ID: ${rule.id}`);
    }
    ruleIds.add(rule.id);
  }

  // Check for rule overlaps
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const ruleA = rules[i]!;
      const ruleB = rules[j]!;

      // Check account pattern overlaps
      const accountOverlaps = findPatternOverlaps(
        ruleA.accountPatterns,
        ruleB.accountPatterns,
        'account'
      );

      // Check entity pattern overlaps
      const entityOverlaps = findPatternOverlaps(
        ruleA.entityPatterns,
        ruleB.entityPatterns,
        'entity'
      );

      // Add overlaps
      overlaps.push(...accountOverlaps.map(overlap => ({
        ruleA: ruleA.id,
        ruleB: ruleB.id,
        dimension: 'account' as const,
        detail: overlap
      })));

      overlaps.push(...entityOverlaps.map(overlap => ({
        ruleA: ruleA.id,
        ruleB: ruleB.id,
        dimension: 'entity' as const,
        detail: overlap
      })));

      // Check for both account and entity overlaps
      if (accountOverlaps.length > 0 && entityOverlaps.length > 0) {
        overlaps.push({
          ruleA: ruleA.id,
          ruleB: ruleB.id,
          dimension: 'both',
          detail: 'Both account and entity patterns overlap'
        });
      }
    }
  }

  // Warnings for high overlap count
  if (overlaps.length > 5) {
    warnings.push('High number of rule overlaps detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    overlaps
  };
}

/**
 * Find pattern overlaps between two pattern arrays
 * 
 * @param patternsA - First pattern array
 * @param patternsB - Second pattern array
 * @param type - Pattern type for error messages
 * @returns Array of overlap descriptions
 */
function findPatternOverlaps(
  patternsA: readonly AccountPattern[] | readonly EntityPattern[],
  patternsB: readonly AccountPattern[] | readonly EntityPattern[],
  type: 'account' | 'entity'
): string[] {
  const overlaps: string[] = [];

  for (const patternA of patternsA) {
    for (const patternB of patternsB) {
      // Check if patterns could match the same text
      if (couldPatternsOverlap(patternA.pattern, patternB.pattern, patternA.matchType, patternB.matchType)) {
        overlaps.push(`${type} pattern "${patternA.pattern}" overlaps with "${patternB.pattern}"`);
      }
    }
  }

  return overlaps;
}

/**
 * Check if two patterns could potentially overlap
 * 
 * @param pattern1 - First pattern
 * @param pattern2 - Second pattern
 * @param matchType1 - First match type
 * @param matchType2 - Second match type
 * @returns True if patterns could overlap
 */
function couldPatternsOverlap(
  pattern1: string,
  pattern2: string,
  matchType1: PatternMatchType,
  matchType2: PatternMatchType
): boolean {
  // Simple overlap detection - in practice this would be more sophisticated
  if (matchType1 === 'exact' && matchType2 === 'exact') {
    return pattern1 === pattern2;
  }

  if (matchType1 === 'contains' || matchType2 === 'contains') {
    return pattern1.includes(pattern2) || pattern2.includes(pattern1);
  }

  if (matchType1 === 'starts_with' && matchType2 === 'starts_with') {
    return pattern1.startsWith(pattern2) || pattern2.startsWith(pattern1);
  }

  if (matchType1 === 'ends_with' && matchType2 === 'ends_with') {
    return pattern1.endsWith(pattern2) || pattern2.endsWith(pattern1);
  }

  return false;
}

/**
 * Create elimination rule
 * 
 * @param id - Rule ID
 * @param name - Rule name
 * @param description - Rule description
 * @param accountPatterns - Account patterns
 * @param entityPatterns - Entity patterns
 * @param options - Additional options
 * @returns Elimination rule
 */
export function createEliminationRule(
  id: string,
  name: string,
  description: string,
  accountPatterns: readonly AccountPattern[],
  entityPatterns: readonly EntityPattern[],
  options: {
    eliminationMethod?: 'automatic' | 'manual' | 'semi_automatic';
    priority?: number;
    effectiveDate?: Date;
    expiryDate?: Date;
  } = {}
): EliminationRule {
  return {
    id,
    name,
    description,
    eliminationMethod: options.eliminationMethod || 'automatic',
    accountPatterns,
    entityPatterns,
    isActive: true,
    effectiveDate: options.effectiveDate || new Date(),
    ...(options.expiryDate && { expiryDate: options.expiryDate }),
    priority: options.priority || 1,
    metadata: {
      createdBy: 'system',
      version: '1.0'
    }
  };
}

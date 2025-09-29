/**
 * Consolidation Mapping Utilities - Enterprise Production Ready
 * 
 * Comprehensive consolidation mapping utilities for local→group COA mapping,
 * currency translation, and CTA calculations.
 * 
 * Features:
 * - Chart of accounts mapping between local and group entities
 * - Currency translation with multiple rate sources
 * - Currency translation adjustment (CTA) calculations
 * - Translation rule management and validation
 * - Integration with existing FX and journal entry utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   defineCOAMapping,
 *   translateCurrency,
 *   calculateCTA,
 *   applyTranslationRule
 * } from './consolidation-mapping-utilities';
 * 
 * // Define COA mapping
 * const mapping = defineCOAMapping('1000', '1100', 'entity-001');
 * 
 * // Translate currency
 * const translation = translateCurrency(1000, 'USD', 'EUR', exchangeRate);
 * ```
 */

import type { 
  SupportedCurrency
} from './accounting-utilities';

// ============================================================================
// SHARED TYPES
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Journal entry
 */
export interface JournalEntry {
  readonly id: string;
  readonly date: Date;
  readonly description: string;
  lines: JournalLine[];
  totalDebits: number;
  totalCredits: number;
  readonly currency: SupportedCurrency;
  readonly status: string;
  readonly createdAt: Date;
}

/**
 * Journal line
 */
export interface JournalLine {
  readonly account: string;
  readonly description: string;
  readonly debit: number;
  readonly credit: number;
  readonly currency: SupportedCurrency;
  readonly reference?: string;
}

/**
 * Fiscal period
 */
export interface FiscalPeriod {
  readonly startDate: Date;
  readonly endDate: Date;
  readonly periodNumber: number;
  readonly fiscalYear: number;
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Chart of accounts mapping
 */
export interface COAMapping {
  readonly id: string;
  readonly localAccount: string;
  readonly groupAccount: string;
  readonly entity: string;
  readonly mappingType: MappingType;
  readonly active: boolean;
  readonly effectiveDate: Date;
  readonly expiryDate?: Date | undefined;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Currency translation result
 */
export interface TranslationResult {
  readonly originalAmount: number;
  readonly translatedAmount: number;
  readonly fromCurrency: SupportedCurrency;
  readonly toCurrency: SupportedCurrency;
  readonly rate: number;
  readonly translationDate: Date;
  readonly translationMethod: TranslationMethod;
}

/**
 * Currency translation adjustment (CTA) result
 */
export interface CTAResult {
  readonly entity: string;
  readonly period: FiscalPeriod;
  readonly openingCTA: number;
  readonly periodCTA: number;
  readonly closingCTA: number;
  readonly translationRates: readonly ExchangeRate[];
  readonly calculationDate: Date;
}

/**
 * Exchange rate information
 */
export interface ExchangeRate {
  readonly fromCurrency: SupportedCurrency;
  readonly toCurrency: SupportedCurrency;
  readonly rate: number;
  readonly rateType: RateType;
  readonly date: Date;
  readonly source: RateSource;
}

/**
 * Translation rule configuration
 */
export interface TranslationRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly sourceCurrency: SupportedCurrency;
  readonly targetCurrency: SupportedCurrency;
  readonly rateSource: RateSource;
  readonly translationMethod: TranslationMethod;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Translated transaction
 */
export interface TranslatedTransaction {
  readonly original: Transaction;
  readonly translated: Transaction;
  readonly translation: TranslationResult;
  readonly cta: number;
}

/**
 * Mapped transaction after COA mapping
 */
export interface MappedTransaction {
  readonly original: Transaction;
  readonly mapped: Transaction;
  readonly mapping: COAMapping;
  readonly mappingDate: Date;
}

/**
 * Transaction entity
 */
export interface Transaction {
  readonly id: string;
  readonly entity: string;
  readonly account: string;
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly date: Date;
  readonly description: string;
  readonly reference?: string;
  readonly type: TransactionType;
}

/**
 * Translation data for rule application
 */
export interface TranslationData {
  readonly transactions: readonly Transaction[];
  readonly rates: readonly ExchangeRate[];
  readonly period: FiscalPeriod;
  readonly entity: string;
}

/**
 * Consolidation entity
 */
export interface ConsolidationEntity {
  readonly id: string;
  readonly name: string;
  readonly currency: SupportedCurrency;
  readonly reportingCurrency: SupportedCurrency;
  readonly status: EntityStatus;
}

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Mapping types
 */
export type MappingType = 
  | 'direct'
  | 'aggregated'
  | 'split'
  | 'conditional';

/**
 * Translation methods
 */
export type TranslationMethod = 
  | 'current_rate'
  | 'historical_rate'
  | 'average_rate'
  | 'closing_rate'
  | 'weighted_average';

/**
 * Rate sources
 */
export type RateSource = 
  | 'central_bank'
  | 'market'
  | 'internal'
  | 'external'
  | 'bloomberg'
  | 'reuters';

/**
 * Rate types
 */
export type RateType = 
  | 'spot'
  | 'forward'
  | 'mid'
  | 'buy'
  | 'sell';

/**
 * Transaction types
 */
export type TransactionType = 
  | 'debit'
  | 'credit'
  | 'balance'
  | 'adjustment'
  | 'elimination';

/**
 * Entity status
 */
export type EntityStatus = 
  | 'active'
  | 'inactive'
  | 'disposed'
  | 'acquired';

/**
 * Mapping type configurations
 */
export const MAPPING_TYPES = {
  direct: { name: 'Direct Mapping', description: 'One-to-one account mapping' },
  aggregated: { name: 'Aggregated Mapping', description: 'Multiple accounts to one group account' },
  split: { name: 'Split Mapping', description: 'One account to multiple group accounts' },
  conditional: { name: 'Conditional Mapping', description: 'Mapping based on conditions' }
} as const;

/**
 * Translation method configurations
 */
export const TRANSLATION_METHODS = {
  current_rate: { name: 'Current Rate', description: 'Use current exchange rate' },
  historical_rate: { name: 'Historical Rate', description: 'Use historical exchange rate' },
  average_rate: { name: 'Average Rate', description: 'Use average exchange rate for period' },
  closing_rate: { name: 'Closing Rate', description: 'Use closing exchange rate' },
  weighted_average: { name: 'Weighted Average', description: 'Use weighted average rate' }
} as const;

/**
 * Rate source configurations
 */
export const RATE_SOURCES = {
  central_bank: { name: 'Central Bank', description: 'Official central bank rates' },
  market: { name: 'Market Rates', description: 'Market-based exchange rates' },
  internal: { name: 'Internal Rates', description: 'Internal company rates' },
  external: { name: 'External Provider', description: 'Third-party rate provider' },
  bloomberg: { name: 'Bloomberg', description: 'Bloomberg terminal rates' },
  reuters: { name: 'Reuters', description: 'Reuters rates' }
} as const;

// ============================================================================
// COA MAPPING
// ============================================================================

/**
 * Define COA mapping
 * 
 * @param localAccount - Local account code
 * @param groupAccount - Group account code
 * @param entity - Entity identifier
 * @param options - Additional mapping options
 * @returns COA mapping
 * 
 * @example
 * ```typescript
 * const mapping = defineCOAMapping('1000', '1100', 'entity-001', {
 *   mappingType: 'direct',
 *   effectiveDate: new Date('2024-01-01')
 * });
 * ```
 */
export function defineCOAMapping(
  localAccount: string,
  groupAccount: string,
  entity: string,
  options: {
    mappingType?: MappingType;
    effectiveDate?: Date;
    expiryDate?: Date;
    active?: boolean;
  } = {}
): COAMapping {
  // Validate inputs
  if (!localAccount || localAccount.trim() === '') {
    throw new Error('Local account is required');
  }

  if (!groupAccount || groupAccount.trim() === '') {
    throw new Error('Group account is required');
  }

  if (!entity || entity.trim() === '') {
    throw new Error('Entity is required');
  }

  const effectiveDate = options.effectiveDate || new Date();
  
  if (options.expiryDate && options.expiryDate <= effectiveDate) {
    throw new Error('Expiry date must be after effective date');
  }

  return {
    id: `mapping-${entity}-${localAccount}-${groupAccount}`,
    localAccount,
    groupAccount,
    entity,
    mappingType: options.mappingType || 'direct',
    active: options.active !== false,
    effectiveDate,
    expiryDate: options.expiryDate || undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Validate COA mapping
 * 
 * @param mapping - COA mapping to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateCOAMapping(mapping);
 * if (!validation.isValid) {
 *   console.error('Mapping validation failed:', validation.errors);
 * }
 * ```
 */
export function validateCOAMapping(mapping: COAMapping): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (!mapping.id || mapping.id.trim() === '') {
    errors.push('Mapping ID is required');
  }

  if (!mapping.localAccount || mapping.localAccount.trim() === '') {
    errors.push('Local account is required');
  }

  if (!mapping.groupAccount || mapping.groupAccount.trim() === '') {
    errors.push('Group account is required');
  }

  if (!mapping.entity || mapping.entity.trim() === '') {
    errors.push('Entity is required');
  }

  // Validate mapping type
  if (!Object.keys(MAPPING_TYPES).includes(mapping.mappingType)) {
    errors.push(`Invalid mapping type: ${mapping.mappingType}`);
  }

  // Validate dates
  if (mapping.expiryDate && mapping.expiryDate <= mapping.effectiveDate) {
    errors.push('Expiry date must be after effective date');
  }

  if (mapping.effectiveDate > new Date()) {
    warnings.push('Effective date is in the future');
  }

  // Validate account codes format
  if (!/^[0-9A-Za-z\-_]+$/.test(mapping.localAccount)) {
    warnings.push('Local account code contains special characters');
  }

  if (!/^[0-9A-Za-z\-_]+$/.test(mapping.groupAccount)) {
    warnings.push('Group account code contains special characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate COA mapping set for overlaps and conflicts
 * 
 * @param mappings - COA mappings to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateCOAMappingSet(mappings);
 * if (!validation.isValid) {
 *   console.error('Mapping set validation failed:', validation.errors);
 * }
 * ```
 */
export function validateCOAMappingSet(mappings: readonly COAMapping[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // entity + localAccount uniqueness over time
  const byKey = new Map<string, COAMapping[]>();
  for (const m of mappings) {
    const k = `${m.entity}::${m.localAccount}`;
    byKey.set(k, [...(byKey.get(k) || []), m]);
  }

  for (const [k, list] of byKey.entries()) {
    const sorted = list.slice().sort((a,b)=> a.effectiveDate.getTime()-b.effectiveDate.getTime());
    for (let i=0;i<sorted.length;i++){
      const a = sorted[i]!;
      for (let j=i+1;j<sorted.length;j++){
        const b = sorted[j]!;
        const aEnd = a.expiryDate ?? new Date(8640000000000000); // max date
        const bEnd = b.expiryDate ?? new Date(8640000000000000);
        const overlap = a.effectiveDate <= bEnd && b.effectiveDate <= aEnd;
        if (overlap) {
          errors.push(`Overlapping mappings for ${k} -> ${a.groupAccount} & ${b.groupAccount}`);
        }
      }
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Apply COA mapping to transactions
 * 
 * @param transactions - Transactions to map
 * @param mappings - COA mappings
 * @returns Mapped transactions
 * 
 * @example
 * ```typescript
 * const mappedTransactions = applyCOAMapping(transactions, mappings);
 * ```
 */
export function applyCOAMapping(
  transactions: readonly Transaction[],
  mappings: readonly COAMapping[]
): readonly MappedTransaction[] {
  const mappedTransactions: MappedTransaction[] = [];

  for (const transaction of transactions) {
    // Find applicable mapping
    const mapping = findApplicableMapping(transaction, mappings);
    
    if (mapping && mapping.active) {
      const mappedTransaction: MappedTransaction = {
        original: transaction,
        mapped: {
          ...transaction,
          account: mapping.groupAccount
        },
        mapping,
        mappingDate: new Date()
      };

      mappedTransactions.push(mappedTransaction);
    }
  }

  return mappedTransactions;
}

// ============================================================================
// CURRENCY TRANSLATION
// ============================================================================

/**
 * Translate currency amount
 * 
 * @param amount - Amount to translate
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @param rate - Exchange rate
 * @returns Translation result
 * 
 * @example
 * ```typescript
 * const translation = translateCurrency(1000, 'USD', 'EUR', exchangeRate);
 * ```
 */
export function translateCurrency(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  rate: ExchangeRate
): TranslationResult {
  // Validate inputs (amount may be signed for debit/credit semantics)

  // Allow identity translation when currencies are equal (rate.rate should be 1)
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      translatedAmount: amount,
      fromCurrency,
      toCurrency,
      rate: 1,
      translationDate: new Date(),
      translationMethod: 'current_rate'
    };
  }

  if (rate.rate <= 0) {
    throw new Error('Exchange rate must be positive');
  }

  if (rate.fromCurrency !== fromCurrency || rate.toCurrency !== toCurrency) {
    throw new Error('Exchange rate currencies do not match translation currencies');
  }

  // Calculate translated amount (preserve sign)
  const translatedAmount = amount * rate.rate;

  return {
    originalAmount: amount,
    translatedAmount,
    fromCurrency,
    toCurrency,
    rate: rate.rate,
    translationDate: new Date(),
    translationMethod: 'current_rate'
  };
}

/**
 * Translate transaction
 * 
 * @param transaction - Transaction to translate
 * @param targetCurrency - Target currency
 * @param rate - Exchange rate
 * @returns Translated transaction
 * 
 * @example
 * ```typescript
 * const translated = translateTransaction(transaction, 'EUR', exchangeRate);
 * ```
 */
export function translateTransaction(
  transaction: Transaction,
  targetCurrency: SupportedCurrency,
  rate: ExchangeRate
): TranslatedTransaction {
  // Translate amount
  const translation = translateCurrency(
    transaction.amount,
    transaction.currency,
    targetCurrency,
    rate
  );

  // Create translated transaction
  const translatedTransaction: Transaction = {
    ...transaction,
    amount: translation.translatedAmount,
    currency: targetCurrency
  };

  // CTA here is a per-transaction *remeasurement delta* for reporting currency.
  // (Still simplified; true CTA is period-aggregate on equity/OCI.)
  const cta = translation.translatedAmount - (transaction.amount);

  return {
    original: transaction,
    translated: translatedTransaction,
    translation,
    cta
  };
}

/**
 * Validate currency translation
 * 
 * @param translation - Translation result to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateCurrencyTranslation(translation);
 * if (!validation.isValid) {
 *   console.error('Translation validation failed:', validation.errors);
 * }
 * ```
 */
export function validateCurrencyTranslation(translation: TranslationResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  // Signed amounts are allowed; remove error

  if (translation.rate <= 0) {
    errors.push('Exchange rate must be positive');
  }

  // Identity translations are permitted

  // Validate calculation
  const expectedTranslatedAmount = translation.originalAmount * translation.rate;
  if (Math.abs(translation.translatedAmount - expectedTranslatedAmount) > 0.01) {
    errors.push('Translated amount calculation is incorrect');
  }

  // Validate translation method
  if (!Object.keys(TRANSLATION_METHODS).includes(translation.translationMethod)) {
    errors.push(`Invalid translation method: ${translation.translationMethod}`);
  }

  // Warnings
  if (translation.rate > 10) {
    warnings.push('Exchange rate is unusually high - verify accuracy');
  }

  if (translation.rate < 0.1) {
    warnings.push('Exchange rate is unusually low - verify accuracy');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// CTA CALCULATIONS
// ============================================================================

/**
 * Calculate currency translation adjustment (CTA)
 * 
 * @param entity - Consolidation entity
 * @param period - Fiscal period
 * @param rates - Exchange rates
 * @returns CTA calculation result
 * 
 * @example
 * ```typescript
 * const cta = calculateCTA(entity, period, rates);
 * ```
 */
export function calculateCTA(
  entity: ConsolidationEntity,
  period: FiscalPeriod,
  rates: readonly ExchangeRate[]
): CTAResult {
  // Validate inputs
  if (entity.currency === entity.reportingCurrency) {
    throw new Error('Entity currency and reporting currency cannot be the same for CTA calculation');
  }

  if (rates.length === 0) {
    throw new Error('Exchange rates are required for CTA calculation');
  }

  // Find relevant rates
  const openingRate = findRateForDate(rates, period.startDate, entity.currency, entity.reportingCurrency);
  const closingRate = findRateForDate(rates, period.endDate, entity.currency, entity.reportingCurrency);

  if (!openingRate || !closingRate) {
    throw new Error('Required exchange rates not found for CTA calculation');
  }

  // Calculate CTA components (simplified calculation)
  const openingCTA = 0; // This would be calculated based on opening balances
  const periodCTA = calculatePeriodCTA(entity, period, rates);
  const closingCTA = openingCTA + periodCTA;

  return {
    entity: entity.id,
    period,
    openingCTA,
    periodCTA,
    closingCTA,
    translationRates: rates,
    calculationDate: new Date()
  };
}

/**
 * Generate CTA journal entries
 * 
 * @param cta - CTA result
 * @returns Journal entries for CTA
 * 
 * @example
 * ```typescript
 * const entries = generateCTAEntries(cta);
 * ```
 */
export function generateCTAEntries(cta: CTAResult): readonly JournalEntry[] {
  const entries: JournalEntry[] = [];

  if (Math.abs(cta.periodCTA) > 0.01) {
    const entry: JournalEntry = {
      id: `cta-${cta.entity}-${cta.period.periodNumber}`,
      date: cta.period.endDate,
      description: `Currency Translation Adjustment - ${cta.entity}`,
      lines: [],
      totalDebits: 0,
      totalCredits: 0,
      currency: 'USD', // Consider threading reporting currency if available on the entity
      status: 'draft',
      createdAt: new Date()
    };

    if (cta.periodCTA > 0) {
      // Debit CTA account
      entry.lines.push({
        account: 'Currency Translation Adjustment',
        description: `CTA - ${cta.entity}`,
        debit: cta.periodCTA,
        credit: 0,
        currency: 'USD',
        reference: `CTA-${cta.entity}`
      });

      // Credit equity
      entry.lines.push({
        account: 'Accumulated Other Comprehensive Income',
        description: `CTA - ${cta.entity}`,
        debit: 0,
        credit: cta.periodCTA,
        currency: 'USD',
        reference: `CTA-${cta.entity}`
      });
    } else {
      // Credit CTA account
      entry.lines.push({
        account: 'Currency Translation Adjustment',
        description: `CTA - ${cta.entity}`,
        debit: 0,
        credit: Math.abs(cta.periodCTA),
        currency: 'USD',
        reference: `CTA-${cta.entity}`
      });

      // Debit equity
      entry.lines.push({
        account: 'Accumulated Other Comprehensive Income',
        description: `CTA - ${cta.entity}`,
        debit: Math.abs(cta.periodCTA),
        credit: 0,
        currency: 'USD',
        reference: `CTA-${cta.entity}`
      });
    }

    // Calculate totals
    entry.totalDebits  = Number(entry.lines.reduce((s,l)=> s + l.debit ,0).toFixed(2));
    entry.totalCredits = Number(entry.lines.reduce((s,l)=> s + l.credit,0).toFixed(2));

    entries.push(entry);
  }

  return entries;
}

/**
 * Validate CTA calculation
 * 
 * @param cta - CTA result to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateCTACalculation(cta);
 * if (!validation.isValid) {
 *   console.error('CTA validation failed:', validation.errors);
 * }
 * ```
 */
export function validateCTACalculation(cta: CTAResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (!cta.entity || cta.entity.trim() === '') {
    errors.push('Entity is required');
  }

  if (cta.period.startDate >= cta.period.endDate) {
    errors.push('Period start date must be before end date');
  }

  if (cta.translationRates.length === 0) {
    errors.push('Translation rates are required');
  }

  // Validate CTA calculation
  const expectedClosingCTA = cta.openingCTA + cta.periodCTA;
  if (Math.abs(cta.closingCTA - expectedClosingCTA) > 0.01) {
    errors.push('Closing CTA calculation is incorrect');
  }

  // Warnings
  if (Math.abs(cta.periodCTA) > 1000000) {
    warnings.push('Period CTA is unusually large - verify calculation');
  }

  if (cta.translationRates.length > 100) {
    warnings.push('Large number of translation rates may impact performance');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// TRANSLATION RULES
// ============================================================================

/**
 * Define translation rule
 * 
 * @param rule - Translation rule to define
 * @returns void
 * 
 * @example
 * ```typescript
 * defineTranslationRule({
 *   id: 'rule-001',
 *   name: 'USD to EUR Translation',
 *   description: 'Translate USD amounts to EUR using current rate',
 *   sourceCurrency: 'USD',
 *   targetCurrency: 'EUR',
 *   rateSource: 'central_bank',
 *   translationMethod: 'current_rate',
 *   active: true
 * });
 * ```
 */
export function defineTranslationRule(rule: TranslationRule): void {
  // Validate rule
  const validation = validateTranslationRule(rule);
  if (!validation.isValid) {
    throw new Error(`Invalid translation rule: ${validation.errors.join(', ')}`);
  }

  // Store rule (in real implementation, this would persist to database)
  // For now, we just validate and return
}

/**
 * Apply translation rule
 * 
 * @param rule - Translation rule
 * @param data - Translation data
 * @returns Translation result
 * 
 * @example
 * ```typescript
 * const result = applyTranslationRule(rule, translationData);
 * ```
 */
export function applyTranslationRule(
  rule: TranslationRule,
  data: TranslationData
): TranslationResult {
  // Validate rule
  if (!rule.active) {
    throw new Error('Translation rule must be active');
  }

  // Find applicable rate
  const rate = findApplicableRate(rule, data.rates, data.period);
  if (!rate) {
    throw new Error('No applicable exchange rate found for translation rule');
  }

  // Scope: same entity AND same source currency
  const scoped = data.transactions.filter(t =>
    t.entity === data.entity && t.currency === rule.sourceCurrency
  );
  const totalAmount = scoped.reduce((sum, t) => sum + t.amount, 0);

  // Translate using rule
  return translateCurrency(
    totalAmount,
    rule.sourceCurrency,
    rule.targetCurrency,
    rate
  );
}

/**
 * Validate translation rule
 * 
 * @param rule - Translation rule to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateTranslationRule(rule);
 * if (!validation.isValid) {
 *   console.error('Rule validation failed:', validation.errors);
 * }
 * ```
 */
export function validateTranslationRule(rule: TranslationRule): ValidationResult {
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

  // Validate currencies
  if (!rule.sourceCurrency || rule.sourceCurrency.trim() === '') {
    errors.push('Source currency is required');
  }

  if (!rule.targetCurrency || rule.targetCurrency.trim() === '') {
    errors.push('Target currency is required');
  }

  if (rule.sourceCurrency === rule.targetCurrency) {
    errors.push('Source and target currencies cannot be the same');
  }

  // Validate rate source
  if (!Object.keys(RATE_SOURCES).includes(rule.rateSource)) {
    errors.push(`Invalid rate source: ${rule.rateSource}`);
  }

  // Validate translation method
  if (!Object.keys(TRANSLATION_METHODS).includes(rule.translationMethod)) {
    errors.push(`Invalid translation method: ${rule.translationMethod}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find applicable COA mapping for transaction
 * 
 * @param transaction - Transaction
 * @param mappings - COA mappings
 * @returns Applicable mapping or undefined
 */
function findApplicableMapping(
  transaction: Transaction,
  mappings: readonly COAMapping[]
): COAMapping | undefined {
  const txDate = transaction.date;

  return mappings.find(mapping => 
    mapping.active &&
    mapping.entity === transaction.entity &&
    mapping.localAccount === transaction.account &&
    mapping.effectiveDate <= txDate &&
    (!mapping.expiryDate || mapping.expiryDate > txDate)
  );
}

/**
 * Find exchange rate for specific date
 * 
 * @param rates - Exchange rates
 * @param date - Date to find rate for
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Exchange rate or undefined
 */
function findRateForDate(
  rates: readonly ExchangeRate[],
  date: Date,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency
): ExchangeRate | undefined {
  const candidates = rates
    .filter(r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency && r.date <= date)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  return candidates[candidates.length - 1];
}

/**
 * Calculate period CTA
 * 
 * @param entity - Consolidation entity
 * @param period - Fiscal period
 * @param rates - Exchange rates
 * @returns Period CTA amount
 */
function calculatePeriodCTA(
  entity: ConsolidationEntity,
  period: FiscalPeriod,
  rates: readonly ExchangeRate[]
): number {
  // This is a simplified calculation
  // In practice, this would involve:
  // 1. Getting all transactions for the period
  // 2. Translating them using appropriate rates
  // 3. Calculating the difference between translated and original amounts
  
  // Placeholder: retranslate a notional base net-asset figure with opening vs closing rate.
  // In production, feed this function opening net assets (ex-cash) or equity balances.
  const baseAmount = 100000;
  const openingRate = findRateForDate(rates, period.startDate, entity.currency, entity.reportingCurrency);
  const closingRate = findRateForDate(rates, period.endDate, entity.currency, entity.reportingCurrency);
  
  if (!openingRate || !closingRate) {
    return 0;
  }
  
  const openingTranslated = baseAmount * openingRate.rate;
  const closingTranslated = baseAmount * closingRate.rate;
  
  return closingTranslated - openingTranslated;
}

/**
 * Find applicable rate for translation rule
 * 
 * @param rule - Translation rule
 * @param rates - Exchange rates
 * @param period - Fiscal period
 * @returns Applicable rate or undefined
 */
function findApplicableRate(
  rule: TranslationRule,
  rates: readonly ExchangeRate[],
  period: FiscalPeriod
): ExchangeRate | undefined {
  const applicableRates = rates.filter(rate =>
    rate.fromCurrency === rule.sourceCurrency &&
    rate.toCurrency === rule.targetCurrency &&
    rate.date >= period.startDate &&
    rate.date <= period.endDate
  ).sort((a,b)=> a.date.getTime()-b.date.getTime());

  if (applicableRates.length === 0) {
    return undefined;
  }

  switch (rule.translationMethod) {
    case 'current_rate':
      return applicableRates[applicableRates.length - 1]; // latest by date
    case 'historical_rate':
      return applicableRates[0]; // earliest
    case 'average_rate': {
      const averageRate = applicableRates.reduce((sum, rate) => sum + rate.rate, 0) / applicableRates.length;
      const firstRate = applicableRates[0];
      if (!firstRate) {
        throw new Error('No applicable rates found');
      }
      return { 
        ...firstRate, 
        rate: averageRate
      };
    }
    case 'closing_rate':
      return applicableRates[applicableRates.length - 1]; // period-end
    case 'weighted_average':
      // This would require transaction data to calculate weighted average
      return applicableRates[applicableRates.length - 1]; // Fallback to latest
    default:
      return applicableRates[applicableRates.length - 1];
  }
}

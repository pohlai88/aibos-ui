/**
 * Document Numbering Utilities - Enterprise Production Ready
 * 
 * Comprehensive document numbering utilities for series/sequence management,
 * gap policies, and check-digit validation.
 * 
 * Features:
 * - Document numbering series and sequence management
 * - Gap identification and policy enforcement
 * - Check-digit validation and generation
 * - Numbering rule configuration and validation
 * - Integration with existing validation utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   defineNumberingSeries,
 *   getNextNumber,
 *   identifyNumberingGaps,
 *   calculateCheckDigit
 * } from './document-numbering-utilities';
 * 
 * // Define numbering series
 * const series = defineNumberingSeries({
 *   id: 'INV-001',
 *   name: 'Invoice Series',
 *   prefix: 'INV',
 *   startNumber: 1000
 * });
 * 
 * // Get next number
 * const nextNumber = getNextNumber('INV-001', context);
 * ```
 */

import type { 
  ValidationResult
} from './fiscal-period-utilities';

// -----------------------------------------------------------------------------
// Internal helpers & state (in real systems replace with DB-backed repos)
// -----------------------------------------------------------------------------
const SERIES_REGISTRY = new Map<string, NumberingSeries>();

function escapeRegexLiteral(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertSinglePlaceholder(format: string): void {
  const matches = [...format.matchAll(/\{([0-9]+)\}/g)];
  if (matches.length !== 1) {
    throw new Error('Format must contain exactly one numeric placeholder like {0000}');
  }
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Numbering series configuration
 */
export interface NumberingSeries {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly prefix: string;
  readonly suffix: string;
  readonly format: string;
  readonly startNumber: number;
  readonly currentNumber: number;
  readonly increment: number;
  readonly checkDigit: boolean;
  readonly checkDigitAlgorithm: CheckDigitAlgorithm;
  readonly gapPolicy: GapPolicy;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Next number result
 */
export interface NextNumberResult {
  readonly series: string;
  readonly nextNumber: string;
  readonly reserved: boolean;
  readonly reservationId?: string;
  readonly expiryDate?: Date;
  readonly generatedAt: Date;
}

/**
 * Sequence number
 */
export interface SequenceNumber {
  readonly series: string;
  readonly number: string;
  readonly fullNumber: string;
  readonly generatedDate: Date;
  readonly checkDigit?: string;
}

/**
 * Numbering gap
 */
export interface NumberingGap {
  readonly series: string;
  readonly startNumber: number;
  readonly endNumber: number;
  readonly gapSize: number;
  readonly period: DateRange;
  readonly status: GapStatus;
  readonly identifiedAt: Date;
}

/**
 * Gap policy configuration
 */
export interface GapPolicy {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly policyType: GapPolicyType;
  readonly maxGapSize: number;
  readonly autoFill: boolean;
  readonly requireApproval: boolean;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Check-digit algorithm configuration
 */
export interface CheckDigitAlgorithmConfig {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly algorithm: string;
  readonly weight: number[];
  readonly modulus: number;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Numbering context
 */
export interface NumberingContext {
  readonly entity: string;
  readonly user: string;
  readonly date: Date;
  readonly documentType: string;
  readonly customData?: Record<string, unknown>;
}

/**
 * Sequence options
 */
export interface SequenceOptions {
  readonly quantity?: number;
  readonly reserve?: boolean;
  readonly expiryHours?: number;
  readonly context?: NumberingContext;
}

/**
 * Reserved number
 */
export interface ReservedNumber {
  readonly id: string;
  readonly series: string;
  readonly number: string;
  readonly reservedBy: string;
  readonly reservedAt: Date;
  readonly expiryDate: Date;
  readonly status: ReservationStatus;
}

/**
 * Gap resolution
 */
export interface GapResolution {
  readonly gaps: readonly NumberingGap[];
  readonly policy: GapPolicy;
  readonly resolution: GapResolutionType;
  readonly resolvedBy: string;
  readonly resolvedAt: Date;
  readonly notes?: string;
}

/**
 * Date range
 */
export interface DateRange {
  readonly startDate: Date;
  readonly endDate: Date;
}

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Check-digit algorithms
 */
export type CheckDigitAlgorithm = 
  | 'mod10'
  | 'mod11'
  | 'luhn'
  | 'custom';

/**
 * Gap policy types
 */
export type GapPolicyType = 
  | 'allow'
  | 'prevent'
  | 'auto_fill'
  | 'require_approval';

/**
 * Gap status
 */
export type GapStatus = 
  | 'identified'
  | 'resolved'
  | 'approved'
  | 'rejected'
  | 'ignored';

/**
 * Reservation status
 */
export type ReservationStatus = 
  | 'active'
  | 'used'
  | 'expired'
  | 'cancelled';

/**
 * Gap resolution types
 */
export type GapResolutionType = 
  | 'fill'
  | 'skip'
  | 'approve'
  | 'reject'
  | 'ignore';

/**
 * Check-digit algorithm configurations
 */
export const CHECK_DIGIT_ALGORITHMS = {
  mod10: {
    name: 'Modulo 10',
    description: 'Standard modulo 10 check digit',
    algorithm: 'mod10',
    weight: [1, 2, 1, 2, 1, 2, 1, 2],
    modulus: 10
  },
  mod11: {
    name: 'Modulo 11',
    description: 'Standard modulo 11 check digit',
    algorithm: 'mod11',
    weight: [2, 3, 4, 5, 6, 7, 8, 9],
    modulus: 11
  },
  luhn: {
    name: 'Luhn Algorithm',
    description: 'Luhn algorithm for credit card numbers',
    algorithm: 'luhn',
    weight: [1, 2, 1, 2, 1, 2, 1, 2],
    modulus: 10
  },
  custom: {
    name: 'Custom Algorithm',
    description: 'Custom check digit algorithm',
    algorithm: 'custom',
    weight: [1, 1, 1, 1, 1, 1, 1, 1],
    modulus: 10
  }
} as const;

/**
 * Gap policy type configurations
 */
export const GAP_POLICY_TYPES = {
  allow: { name: 'Allow Gaps', description: 'Allow gaps in numbering sequence' },
  prevent: { name: 'Prevent Gaps', description: 'Prevent gaps in numbering sequence' },
  auto_fill: { name: 'Auto Fill', description: 'Automatically fill gaps' },
  require_approval: { name: 'Require Approval', description: 'Require approval for gaps' }
} as const;

// ============================================================================
// SERIES MANAGEMENT
// ============================================================================

/**
 * Define numbering series
 * 
 * @param series - Numbering series configuration
 * @returns void
 * 
 * @example
 * ```typescript
 * defineNumberingSeries({
 *   id: 'INV-001',
 *   name: 'Invoice Series',
 *   description: 'Main invoice numbering series',
 *   prefix: 'INV',
 *   suffix: '',
 *   format: 'INV-{0000}',
 *   startNumber: 1000,
 *   currentNumber: 1000,
 *   increment: 1,
 *   checkDigit: true,
 *   checkDigitAlgorithm: 'mod10',
 *   gapPolicy: gapPolicy,
 *   active: true
 * });
 * ```
 */
export function defineNumberingSeries(series: NumberingSeries): void {
  // Validate series
  const validation = validateNumberingSeries(series);
  if (!validation.isValid) {
    throw new Error(`Invalid numbering series: ${validation.errors.join(', ')}`);
  }

  // Store series (stub registry; replace with persistence in production)
  SERIES_REGISTRY.set(series.id, { ...series });
}

/**
 * Validate numbering series
 * 
 * @param series - Numbering series to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateNumberingSeries(series);
 * if (!validation.isValid) {
 *   console.error('Series validation failed:', validation.errors);
 * }
 * ```
 */
export function validateNumberingSeries(series: NumberingSeries): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (!series.id || series.id.trim() === '') {
    errors.push('Series ID is required');
  }

  if (!series.name || series.name.trim() === '') {
    errors.push('Series name is required');
  }

  if (!series.description || series.description.trim() === '') {
    errors.push('Series description is required');
  }

  // Validate format
  if (!series.format || series.format.trim() === '') {
    errors.push('Series format is required');
  }

  if (!series.format.includes('{') || !series.format.includes('}')) {
    errors.push('Series format must contain numeric placeholder like {0000}');
  }

  // Enforce exactly one placeholder
  try {
    assertSinglePlaceholder(series.format);
  } catch (e: unknown) {
    errors.push(e.message || 'Invalid format placeholder');
  }

  // Validate numbers
  if (series.startNumber < 0) {
    errors.push('Start number cannot be negative');
  }

  if (series.currentNumber < series.startNumber) {
    errors.push('Current number cannot be less than start number');
  }

  if (series.increment <= 0) {
    errors.push('Increment must be positive');
  }

  // Validate check digit
  if (series.checkDigit) {
    if (!Object.keys(CHECK_DIGIT_ALGORITHMS).includes(series.checkDigitAlgorithm)) {
      errors.push(`Invalid check digit algorithm: ${series.checkDigitAlgorithm}`);
    }
  }

  // Warnings
  if (series.startNumber > 1000000) {
    warnings.push('Large start number - verify reasonableness');
  }

  if (series.increment > 100) {
    warnings.push('Large increment - verify reasonableness');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get next number from series
 * 
 * @param series - Series identifier
 * @param context - Numbering context
 * @returns Next number result
 * 
 * @example
 * ```typescript
 * const nextNumber = getNextNumber('INV-001', {
 *   entity: 'entity-001',
 *   user: 'user123',
 *   date: new Date(),
 *   documentType: 'invoice'
 * });
 * ```
 */
export function getNextNumber(
  series: string,
  context: NumberingContext
): NextNumberResult {
  // Validate inputs
  if (!series || series.trim() === '') {
    throw new Error('Series identifier is required');
  }

  if (!context.entity || !context.user) {
    throw new Error('Entity and user are required in context');
  }

  // Get series configuration
  const seriesConfig = getSeriesConfiguration(series);
  if (!seriesConfig) {
    throw new Error(`Series not found: ${series}`);
  }

  if (!seriesConfig.active) {
    throw new Error(`Series is not active: ${series}`);
  }

  // Calculate next number
  const nextNumber = seriesConfig.currentNumber + seriesConfig.increment;
  
  // Format the number
  const formattedCore = formatNumber(nextNumber, seriesConfig.format);
  const composed = composeWithAffixes(formattedCore, seriesConfig.prefix, seriesConfig.suffix);
  
  // Add check digit if required
  let finalNumber = composed;
  if (seriesConfig.checkDigit) {
    const checkDigit = calculateCheckDigit(extractNumericFromFormatPayload(formattedCore, seriesConfig.format), seriesConfig.checkDigitAlgorithm);
    finalNumber = `${composed}${checkDigit}`; // check digit at the very end
  }

  return {
    series,
    nextNumber: finalNumber,
    reserved: false,
    generatedAt: new Date()
  };
}

// ============================================================================
// SEQUENCE OPERATIONS
// ============================================================================

/**
 * Generate sequence number
 * 
 * @param series - Series identifier
 * @param options - Sequence options
 * @returns Sequence number
 * 
 * @example
 * ```typescript
 * const sequence = generateSequenceNumber('INV-001', {
 *   quantity: 1,
 *   reserve: true,
 *   expiryHours: 24
 * });
 * ```
 */
export function generateSequenceNumber(
  series: string,
  _options: SequenceOptions = {}
): SequenceNumber {
  // Validate inputs
  if (!series || series.trim() === '') {
    throw new Error('Series identifier is required');
  }

  // Get series configuration
  const seriesConfig = getSeriesConfiguration(series);
  if (!seriesConfig) {
    throw new Error(`Series not found: ${series}`);
  }

  // Generate number
  const number = seriesConfig.currentNumber + seriesConfig.increment;
  const formattedCore = formatNumber(number, seriesConfig.format);
  const composed = composeWithAffixes(formattedCore, seriesConfig.prefix, seriesConfig.suffix);
  
  // Add check digit if required
  let fullNumber = composed;
  let checkDigit: string | undefined;
  
  if (seriesConfig.checkDigit) {
    checkDigit = calculateCheckDigit(extractNumericFromFormatPayload(formattedCore, seriesConfig.format), seriesConfig.checkDigitAlgorithm);
    fullNumber = `${composed}${checkDigit}`;
  }

  return {
    series,
    number: composed,
    fullNumber,
    generatedDate: new Date(),
    ...(checkDigit && { checkDigit })
  };
}

/**
 * Validate sequence number
 * 
 * @param number - Sequence number to validate
 * @param series - Series identifier
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateSequenceNumber('INV-1001', 'INV-001');
 * if (!validation.isValid) {
 *   console.error('Sequence validation failed:', validation.errors);
 * }
 * ```
 */
export function validateSequenceNumber(
  number: string,
  series: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate inputs
  if (!number || number.trim() === '') {
    errors.push('Sequence number is required');
  }

  if (!series || series.trim() === '') {
    errors.push('Series identifier is required');
  }

  // Get series configuration
  const seriesConfig = getSeriesConfiguration(series);
  if (!seriesConfig) {
    errors.push(`Series not found: ${series}`);
    return { isValid: false, errors, warnings };
  }

  // Validate format including prefix/suffix and one placeholder
  if (!isValidNumberFormatWithAffixes(number, seriesConfig)) {
    errors.push('Number does not match series format/prefix/suffix');
  }

  // Validate check digit if required
  if (seriesConfig.checkDigit && number.length >= 2) {
    const providedCheckDigit = number.slice(-1);
    const withoutCheckDigit = number.slice(0, -1);
    if (!isValidNumberFormatWithAffixes(withoutCheckDigit, seriesConfig)) {
      errors.push('Check-digit position invalid');
    } else {
      // Extract numeric payload as per format (from the core, not including prefix/suffix)
      const core = stripAffixes(withoutCheckDigit, seriesConfig.prefix, seriesConfig.suffix);
      const numericPayload = extractNumericFromFormatPayload(core, seriesConfig.format);
      const calculated = calculateCheckDigit(numericPayload, seriesConfig.checkDigitAlgorithm);
      if (providedCheckDigit !== calculated) {
        errors.push('Invalid check digit');
      }
    }
  }

  // Validate number range
  const coreForRange = stripAffixes(seriesConfig.checkDigit ? number.slice(0, -1) : number, seriesConfig.prefix, seriesConfig.suffix);
  const numericValue = extractNumericValue(coreForRange, seriesConfig.format);
  if (numericValue < seriesConfig.startNumber) {
    errors.push('Number is below series start number');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Reserve sequence number
 * 
 * @param series - Series identifier
 * @param context - Numbering context
 * @returns Reserved number
 * 
 * @example
 * ```typescript
 * const reserved = reserveSequenceNumber('INV-001', context);
 * ```
 */
export function reserveSequenceNumber(
  series: string,
  context: NumberingContext
): ReservedNumber {
  // Validate inputs
  if (!series || series.trim() === '') {
    throw new Error('Series identifier is required');
  }

  if (!context.user) {
    throw new Error('User is required in context');
  }

  // Get series configuration
  const seriesConfig = getSeriesConfiguration(series);
  if (!seriesConfig) {
    throw new Error(`Series not found: ${series}`);
  }

  // Generate next number
  const nextNumber = seriesConfig.currentNumber + seriesConfig.increment;
  const formattedCore = formatNumber(nextNumber, seriesConfig.format);
  const composed = composeWithAffixes(formattedCore, seriesConfig.prefix, seriesConfig.suffix);
  
  // Add check digit if required
  let fullNumber = composed;
  if (seriesConfig.checkDigit) {
    const checkDigit = calculateCheckDigit(extractNumericFromFormatPayload(formattedCore, seriesConfig.format), seriesConfig.checkDigitAlgorithm);
    fullNumber = `${composed}${checkDigit}`;
  }

  // Calculate expiry date (default 24 hours)
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 24); // default; make policy-driven in adapter

  return {
    id: `reservation-${series}-${Date.now()}`,
    series,
    number: fullNumber,
    reservedBy: context.user,
    reservedAt: new Date(),
    expiryDate,
    status: 'active'
  };
}

// ============================================================================
// GAP MANAGEMENT
// ============================================================================

/**
 * Identify numbering gaps
 * 
 * @param series - Series identifier
 * @param period - Date range
 * @returns Numbering gaps
 * 
 * @example
 * ```typescript
 * const gaps = identifyNumberingGaps('INV-001', {
 *   startDate: new Date('2024-01-01'),
 *   endDate: new Date('2024-12-31')
 * });
 * ```
 */
export function identifyNumberingGaps(
  series: string,
  period: DateRange
): readonly NumberingGap[] {
  // Validate inputs
  if (!series || series.trim() === '') {
    throw new Error('Series identifier is required');
  }

  if (period.startDate >= period.endDate) {
    throw new Error('Period start date must be before end date');
  }

  // Get series configuration
  const seriesConfig = getSeriesConfiguration(series);
  if (!seriesConfig) {
    throw new Error(`Series not found: ${series}`);
  }

  // Get used numbers for the period (in real implementation, this would query the database)
  const usedNumbers = getUsedNumbers(series, period);
  
  // Identify gaps
  const gaps: NumberingGap[] = [];
  const sortedNumbers = usedNumbers.slice().sort((a, b) => a - b);

  // Detect initial gap from startNumber to first used number
  if (sortedNumbers.length > 0) {
    const first = sortedNumbers[0]!;
    if (first > seriesConfig.startNumber) {
      const gapSize = Math.floor((first - seriesConfig.startNumber) / seriesConfig.increment);
      if (gapSize > 0) {
        gaps.push({
          series,
          startNumber: seriesConfig.startNumber,
          endNumber: first - seriesConfig.increment,
          gapSize,
          period,
          status: 'identified',
          identifiedAt: new Date()
        });
      }
    }
  }
  
  for (let i = 0; i < sortedNumbers.length - 1; i++) {
    const current = sortedNumbers[i];
    const next = sortedNumbers[i + 1];
    if (!current || !next) continue;
    
    const expectedNext = current + seriesConfig.increment;
    if (next > expectedNext) {
      const stepsMissing = Math.floor((next - expectedNext) / seriesConfig.increment) + 1 - 1;
      const endNum = next - seriesConfig.increment;
      gaps.push({
        series,
        startNumber: expectedNext,
        endNumber: endNum,
        gapSize: Math.max(stepsMissing, 1),
        period,
        status: 'identified',
        identifiedAt: new Date()
      });
    }
  }

  return gaps;
}

/**
 * Apply gap policy
 * 
 * @param gaps - Numbering gaps
 * @param policy - Gap policy
 * @returns Gap resolution
 * 
 * @example
 * ```typescript
 * const resolution = applyGapPolicy(gaps, gapPolicy);
 * ```
 */
export function applyGapPolicy(
  gaps: readonly NumberingGap[],
  policy: GapPolicy
): GapResolution {
  // Validate inputs
  if (!policy.active) {
    throw new Error('Gap policy must be active');
  }

  if (gaps.length === 0) {
    return {
      gaps,
      policy,
      resolution: 'ignore',
      resolvedBy: 'system',
      resolvedAt: new Date()
    };
  }

  // Apply policy based on type
  let resolution: GapResolutionType;
  
  switch (policy.policyType) {
    case 'allow':
      resolution = 'ignore';
      break;
    case 'prevent':
      resolution = 'reject';
      break;
    case 'auto_fill':
      resolution = 'fill';
      break;
    case 'require_approval':
      resolution = 'approve';
      break;
    default:
      resolution = 'ignore';
  }

  return {
    gaps,
    policy,
    resolution,
    resolvedBy: 'system',
    resolvedAt: new Date()
  };
}

/**
 * Validate gap policy
 * 
 * @param policy - Gap policy to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateGapPolicy(policy);
 * if (!validation.isValid) {
 *   console.error('Gap policy validation failed:', validation.errors);
 * }
 * ```
 */
export function validateGapPolicy(policy: GapPolicy): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (!policy.id || policy.id.trim() === '') {
    errors.push('Policy ID is required');
  }

  if (!policy.name || policy.name.trim() === '') {
    errors.push('Policy name is required');
  }

  if (!policy.description || policy.description.trim() === '') {
    errors.push('Policy description is required');
  }

  // Validate policy type
  if (!Object.keys(GAP_POLICY_TYPES).includes(policy.policyType)) {
    errors.push(`Invalid gap policy type: ${policy.policyType}`);
  }

  // Validate max gap size
  if (policy.maxGapSize < 0) {
    errors.push('Max gap size cannot be negative');
  }

  // Warnings
  if (policy.maxGapSize > 1000) {
    warnings.push('Large max gap size - verify reasonableness');
  }

  if (policy.autoFill && policy.requireApproval) {
    warnings.push('Auto fill and require approval are both enabled');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// CHECK-DIGIT OPERATIONS
// ============================================================================

/**
 * Calculate check digit
 * 
 * @param number - Base number
 * @param algorithm - Check digit algorithm
 * @returns Check digit
 * 
 * @example
 * ```typescript
 * const checkDigit = calculateCheckDigit('12345', 'mod10');
 * ```
 */
export function calculateCheckDigit(
  number: string,
  algorithm: CheckDigitAlgorithm
): string {
  // Validate inputs
  if (!number || number.trim() === '') {
    throw new Error('Number is required');
  }

  if (!Object.keys(CHECK_DIGIT_ALGORITHMS).includes(algorithm)) {
    throw new Error(`Invalid check digit algorithm: ${algorithm}`);
  }

  // Get algorithm configuration
  const algorithmConfig = CHECK_DIGIT_ALGORITHMS[algorithm as keyof typeof CHECK_DIGIT_ALGORITHMS];
  
  // Calculate check digit based on algorithm
  switch (algorithm) {
    case 'mod10':
      return calculateMod10CheckDigit(number, [...algorithmConfig.weight], algorithmConfig.modulus);
    case 'mod11':
      return calculateMod11CheckDigit(number, [...algorithmConfig.weight], algorithmConfig.modulus);
    case 'luhn':
      return calculateLuhnCheckDigit(number);
    case 'custom':
      return calculateCustomCheckDigit(number, [...algorithmConfig.weight], algorithmConfig.modulus);
    default:
      throw new Error(`Unsupported check digit algorithm: ${algorithm}`);
  }
}

/**
 * Validate check digit
 * 
 * @param number - Number with check digit
 * @param algorithm - Check digit algorithm
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateCheckDigit('123456', 'mod10');
 * if (!validation.isValid) {
 *   console.error('Check digit validation failed:', validation.errors);
 * }
 * ```
 */
export function validateCheckDigit(
  number: string,
  algorithm: CheckDigitAlgorithm
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate inputs
  if (!number || number.trim() === '') {
    errors.push('Number is required');
  }

  if (!Object.keys(CHECK_DIGIT_ALGORITHMS).includes(algorithm)) {
    errors.push(`Invalid check digit algorithm: ${algorithm}`);
  }

  if (number.length < 2) {
    errors.push('Number must be at least 2 digits long');
  }

  // Extract base number and check digit
  const baseNumber = number.slice(0, -1);
  const providedCheckDigit = number.slice(-1);
  
  // Calculate expected check digit
  const expectedCheckDigit = calculateCheckDigit(baseNumber, algorithm);
  
  // Validate
  if (providedCheckDigit !== expectedCheckDigit) {
    errors.push('Invalid check digit');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate check digit number
 * 
 * @param baseNumber - Base number
 * @param algorithm - Check digit algorithm
 * @returns Number with check digit
 * 
 * @example
 * ```typescript
 * const fullNumber = generateCheckDigitNumber('12345', 'mod10');
 * ```
 */
export function generateCheckDigitNumber(
  baseNumber: string,
  algorithm: CheckDigitAlgorithm
): string {
  // Validate inputs
  if (!baseNumber || baseNumber.trim() === '') {
    throw new Error('Base number is required');
  }

  // Calculate check digit
  const checkDigit = calculateCheckDigit(baseNumber, algorithm);
  
  // Return full number
  return `${baseNumber}${checkDigit}`;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get series configuration
 * 
 * @param series - Series identifier
 * @returns Series configuration or undefined
 */
function getSeriesConfiguration(series: string): NumberingSeries | undefined {
  // Fetch from registry (stub). Replace with real repository.
  if (SERIES_REGISTRY.has(series)) return SERIES_REGISTRY.get(series);
  return undefined;
}

/**
 * Format number according to series format
 * 
 * @param number - Number to format
 * @param format - Format string
 * @returns Formatted number
 */
function formatNumber(number: number, format: string): string {
  assertSinglePlaceholder(format);
  // Extract the placeholder pattern
  const placeholderMatch = format.match(/\{([0-9]+)\}/);
  if (!placeholderMatch) {
    throw new Error('Invalid format string - no placeholder found');
  }

  const placeholder = placeholderMatch[1];
  if (!placeholder) {
    throw new Error('Invalid placeholder format');
  }
  const padding = parseInt(placeholder, 10);
  
  // Format the number with padding
  const formattedNumber = number.toString().padStart(padding, '0');
  
  // Replace placeholder in format
  return format.replace(/\{[0-9]+\}/, formattedNumber);
}

/**
 * Compose code with prefix/suffix
 */
function composeWithAffixes(core: string, prefix: string, suffix: string): string {
  const pre = prefix ?? '';
  const suf = suffix ?? '';
  return `${pre}${core}${suf}`;
}

/**
 * Validate with prefix/suffix
 */
function isValidNumberFormatWithAffixes(full: string, series: NumberingSeries): boolean {
  assertSinglePlaceholder(series.format);
  const placeholderMatch = series.format.match(/\{([0-9]+)\}/);
  if (!placeholderMatch) return false;
  const padding = parseInt(placeholderMatch[1]!, 10);
  const escapedCore = escapeRegexLiteral(series.format).replace(/\{[0-9]+\}/, `[0-9]{${padding}}`);
  const pre = escapeRegexLiteral(series.prefix ?? '');
  const suf = escapeRegexLiteral(series.suffix ?? '');
  const regex = new RegExp(`^${pre}${escapedCore}${suf}$`);
  return regex.test(full);
}

/**
 * Remove prefix/suffix
 */
function stripAffixes(full: string, prefix: string, suffix: string): string {
  const pre = prefix ?? '';
  const suf = suffix ?? '';
  if (pre && !full.startsWith(pre)) return full;
  if (suf && !full.endsWith(suf)) return full;
  return full.substring(pre.length, full.length - suf.length);
}

/**
 * Extract numeric value from formatted number
 * 
 * @param number - Formatted number
 * @param format - Format string
 * @returns Numeric value
 */
function extractNumericValue(number: string, format: string): number {
  // Extract the placeholder pattern
  const placeholderMatch = format.match(/\{([0-9]+)\}/);
  if (!placeholderMatch) {
    throw new Error('Invalid format string - no placeholder found');
  }

  const placeholder = placeholderMatch[1];
  if (!placeholder) {
    throw new Error('Invalid placeholder format');
  }
  const padding = parseInt(placeholder, 10);
  
  // Extract the numeric part
  const numericPart = number.slice(-padding);
  
  return parseInt(numericPart, 10);
}

/**
 * Extract the numeric payload used for check digit (the {000..} core)
 */
function extractNumericFromFormatPayload(core: string, format: string): string {
  assertSinglePlaceholder(format);
  const placeholderMatch = format.match(/\{([0-9]+)\}/);
  if (!placeholderMatch) throw new Error('Invalid format');
  const padding = parseInt(placeholderMatch[1]!, 10);
  // Core == format with placeholder replaced -> numeric sits at the end of core portion
  return core.slice(-padding);
}

/**
 * Get used numbers for period
 * 
 * @param series - Series identifier
 * @param period - Date range
 * @returns Used numbers
 */
function getUsedNumbers(_series: string, _period: DateRange): number[] {
  // This would typically query the database for used numbers
  // For now, we'll return placeholder data
  return [1000, 1001, 1003, 1005, 1006, 1008, 1010];
}

/**
 * Calculate modulo 10 check digit
 * 
 * @param number - Base number
 * @param weight - Weight array
 * @param modulus - Modulus
 * @returns Check digit
 */
function calculateMod10CheckDigit(number: string, weight: number[], modulus: number): string {
  let sum = 0;
  const digits = number.split('').reverse();
  
  for (let i = 0; i < digits.length; i++) {
    const digitStr = digits[i];
    if (!digitStr) continue;
    const digit = parseInt(digitStr, 10);
    const w = weight[i % weight.length];
    if (w === undefined) continue;
    let product = digit * w;
    
    // Sum digits if product is greater than 9
    if (product > 9) {
      product = Math.floor(product / 10) + (product % 10);
    }
    
    sum += product;
  }
  
  const checkDigit = (modulus - (sum % modulus)) % modulus;
  return checkDigit.toString();
}

/**
 * Calculate modulo 11 check digit
 * 
 * @param number - Base number
 * @param weight - Weight array
 * @param modulus - Modulus
 * @returns Check digit
 */
function calculateMod11CheckDigit(number: string, weight: number[], modulus: number): string {
  let sum = 0;
  const digits = number.split('').reverse();
  
  for (let i = 0; i < digits.length; i++) {
    const digitStr = digits[i];
    if (!digitStr) continue;
    const digit = parseInt(digitStr, 10);
    const w = weight[i % weight.length];
    if (w === undefined) continue;
    sum += digit * w;
  }
  
  // Standardized modulo 11 digit in range 0..(modulus-1)
  const checkDigit = (modulus - (sum % modulus)) % modulus;
  return checkDigit.toString();
}

/**
 * Calculate Luhn check digit
 * 
 * @param number - Base number
 * @returns Check digit
 */
function calculateLuhnCheckDigit(number: string): string {
  let sum = 0;
  const digits = number.split('').reverse();
  
  for (let i = 0; i < digits.length; i++) {
    const digitStr = digits[i];
    if (!digitStr) continue;
    let digit = parseInt(digitStr, 10);
    
    // Double every second digit
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    
    sum += digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

/**
 * Calculate custom check digit
 * 
 * @param number - Base number
 * @param weight - Weight array
 * @param modulus - Modulus
 * @returns Check digit
 */
function calculateCustomCheckDigit(number: string, weight: number[], modulus: number): string {
  let sum = 0;
  const digits = number.split('').reverse();
  
  for (let i = 0; i < digits.length; i++) {
    const digitStr = digits[i];
    if (!digitStr) continue;
    const digit = parseInt(digitStr, 10);
    const w = weight[i % weight.length];
    if (w === undefined) continue;
    sum += digit * w;
  }
  
  const checkDigit = sum % modulus;
  return checkDigit.toString();
}

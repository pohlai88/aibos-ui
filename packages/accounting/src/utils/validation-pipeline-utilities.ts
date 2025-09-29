/**
 * Validation Pipeline Utilities - Phase 2 Implementation
 * 
 * Provides a flexible validation pipeline system for complex validation scenarios.
 * Supports chaining validators, custom validation rules, and structured validation results.
 * 
 * Features:
 * - ValidationPipeline class for chaining validators
 * - CommandValidator for common command validation
 * - Pre-configured validators for accounting operations
 * - Structured validation results with issues
 * - Async validation support
 * - Validation rule builders
 */

import { 
  type BusinessValidationResult,
  type ValidationIssue,
  type ValidationCode
} from './validation-utilities';
import { 
  type ErrorContext
} from './error-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type Validator<T> = (data: T) => BusinessValidationResult | Promise<BusinessValidationResult>;

export interface ValidationRule<T> {
  name: string;
  validator: Validator<T>;
  severity?: 'error' | 'warning';
  stopOnError?: boolean;
}

export interface ValidationPipelineOptions {
  stopOnFirstError?: boolean;
  collectAllIssues?: boolean;
  includeWarnings?: boolean;
  /** Optional guard to avoid flooding: stop after this many collected issues (post-filter). */
  maxIssues?: number;
  /** If true (default), dedupe identical issues by (path, code, message, severity). */
  dedupeIssues?: boolean;
}

export interface ValidationContext extends ErrorContext {
  validationId?: string;
  timestamp?: Date;
  source?: string;
}

// ============================================================================
// VALIDATION PIPELINE
// ============================================================================

/**
 * Flexible validation pipeline that can chain multiple validators
 */
export class ValidationPipeline<T> {
  private validators: ValidationRule<T>[] = [];
  private options: ValidationPipelineOptions;

  constructor(options: ValidationPipelineOptions = {}) {
    this.options = {
      stopOnFirstError: options.stopOnFirstError ?? false,
      collectAllIssues: options.collectAllIssues ?? true,
      includeWarnings: options.includeWarnings ?? true,
      ...(options.maxIssues !== undefined && { maxIssues: options.maxIssues }),
      dedupeIssues: options.dedupeIssues ?? true
    };
  }

  /**
   * Add a validator to the pipeline
   */
  addValidator(
    name: string,
    validator: Validator<T>,
    options: { severity?: 'error' | 'warning'; stopOnError?: boolean } = {}
  ): this {
    this.validators.push({
      name,
      validator,
      severity: options.severity ?? 'error',
      stopOnError: options.stopOnError ?? false
    });
    return this;
  }

  /**
   * Add a validation rule to the pipeline
   */
  addRule(rule: ValidationRule<T>): this {
    this.validators.push(rule);
    return this;
  }

  /**
   * Add many validators at once.
   * Usage: addValidators(['a', v1], ['b', v2, { severity:'warning' }])
   */
  addValidators(
    ...rules: Array<[name: string, validator: Validator<T>, options?: { severity?: 'error' | 'warning'; stopOnError?: boolean }]> 
  ): this {
    for (const [name, validator, opts] of rules) {
      this.addValidator(name, validator, opts ?? {});
    }
    return this;
  }

  /**
   * Validate data using the pipeline
   */
  async validate(data: T, _context?: ValidationContext): Promise<BusinessValidationResult> {
    const issues: ValidationIssue[] = [];
    const startTime = new Date();
    let executed = 0;

    for (const rule of this.validators) {
      try {
        executed++;
        const result = await rule.validator(data);
        
        if (!result.isValid && result.issues) {
          // Add rule name to issues for better traceability
          const enhancedIssues = result.issues.map(issue => ({
            ...issue,
            path: pathJoin(rule.name, issue.path || null),
            // Prefer the issue's own severity if present, then the rule default.
            severity: (issue.severity ?? rule.severity ?? 'error')
          }));
          
          issues.push(...enhancedIssues);

          // Stop if this rule should stop on error
          const hasError = enhancedIssues.some(i => i.severity === 'error');
          if (
            rule.stopOnError ||
            this.options.stopOnFirstError ||
            (!this.options.collectAllIssues && hasError)
          ) {
            break;
          }
        }
      } catch (error) {
        const issue: ValidationIssue = {
          code: 'UNKNOWN' as ValidationCode,
          path: rule.name,
          message: `Validation rule '${rule.name}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: rule.severity ?? 'error'
        };
        
        issues.push(issue);

        if (rule.stopOnError || this.options.stopOnFirstError || !this.options.collectAllIssues) {
          break;
        }
      }
    }

    const endTime = new Date();
    // Duration calculation available for future use
    endTime.getTime() - startTime.getTime();

    // Filter issues based on options
    const filteredIssues = this.options.includeWarnings 
      ? issues 
      : issues.filter(issue => issue.severity === 'error');

    // Optional de-duplication
    const deduped = this.options.dedupeIssues
      ? (() => {
          const seen = new Set<string>();
          return filteredIssues.filter(i => {
            const key = `${i.path ?? ''}|${i.code ?? ''}|${i.message}|${i.severity}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        })()
      : filteredIssues;

    // Optional cap to prevent overly large payloads
    const capped = (this.options.maxIssues && this.options.maxIssues > 0)
      ? deduped.slice(0, this.options.maxIssues)
      : deduped;

    const errors = capped
      .filter(issue => issue.severity === 'error')
      .map(issue => issue.message);

    const warnings = capped
      .filter(issue => issue.severity === 'warning')
      .map(issue => issue.message);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      issues: capped
    };
  }

  /**
   * Get the number of validators in the pipeline
   */
  getValidatorCount(): number {
    return this.validators.length;
  }

  /**
   * Clear all validators from the pipeline
   */
  clear(): this {
    this.validators = [];
    return this;
  }
}

// ============================================================================
// COMMAND VALIDATOR
// ============================================================================

/**
 * Specialized validator for command objects
 */
export class CommandValidator<T> extends ValidationPipeline<T> {
  constructor(options: ValidationPipelineOptions = {}) {
    super({
      ...options,
      stopOnFirstError: options.stopOnFirstError ?? true,
      collectAllIssues: options.collectAllIssues ?? true
    });
  }

  /**
   * Create a pre-configured validator for CreateAccountCommand
   */
  static forCreateAccount(): CommandValidator<any> {
    return new CommandValidator<any>()
      .addValidator('accountCode', validateAccountCode)
      .addValidator('accountName', validateAccountName)
      .addValidator('accountType', validateAccountType)
      .addValidator('parentAccount', validateParentAccount)
      .addValidator('tenantId', validateTenantId);
  }

  /**
   * Create a pre-configured validator for PostJournalEntryCommand
   */
  static forPostJournalEntry(): CommandValidator<any> {
    return new CommandValidator<any>()
      .addValidator('journalEntry', validateJournalEntry)
      .addValidator('lines', validateJournalEntryLines)
      .addValidator('balance', validateDebitCreditBalance)
      .addValidator('postingDate', validatePostingDate)
      .addValidator('tenantId', validateTenantId);
  }

  /**
   * Create a pre-configured validator for IssueInvoiceCommand
   */
  static forIssueInvoice(): CommandValidator<any> {
    return new CommandValidator<any>()
      .addValidator('invoice', validateInvoice)
      .addValidator('customer', validateCustomer)
      .addValidator('items', validateInvoiceItems)
      .addValidator('amounts', validateInvoiceAmounts)
      .addValidator('tenantId', validateTenantId);
  }
}

// ============================================================================
// DOMAIN VALIDATORS
// ============================================================================

/**
 * Create a pre-configured validator for Account domain objects
 */
export class AccountValidator extends ValidationPipeline<any> {
  constructor() {
    super();
    this.addValidator('accountCode', validateAccountCode)
        .addValidator('accountName', validateAccountName)
        .addValidator('accountType', validateAccountType)
        .addValidator('balance', validateAccountBalance)
        .addValidator('dates', validateAccountDates);
  }
}

/**
 * Create a pre-configured validator for JournalEntry domain objects
 */
export class JournalEntryValidator extends ValidationPipeline<any> {
  constructor() {
    super();
    this.addValidator('entryNumber', validateEntryNumber)
        .addValidator('description', validateDescription)
        .addValidator('postingDate', validatePostingDate)
        .addValidator('status', validateJournalEntryStatus)
        .addValidator('amounts', validateJournalEntryAmounts);
  }
}

/**
 * Create a pre-configured validator for Invoice domain objects
 */
export class InvoiceValidator extends ValidationPipeline<any> {
  constructor() {
    super();
    this.addValidator('invoiceNumber', validateInvoiceNumber)
        .addValidator('customer', validateCustomer)
        .addValidator('items', validateInvoiceItems)
        .addValidator('amounts', validateInvoiceAmounts)
        .addValidator('dates', validateInvoiceDates);
  }
}

// ============================================================================
// VALIDATION RULE BUILDERS
// ============================================================================

/**
 * Build a required field validator
 */
export function required<T>(fieldName: keyof T, message?: string): Validator<T> {
  return (data: T): BusinessValidationResult => {
    const value = data[fieldName];
    if (value === null || value === undefined || value === '') {
      return {
        isValid: false,
        errors: [message || `${String(fieldName)} is required`],
        warnings: [],
        issues: [{
          code: 'REQUIRED' as ValidationCode,
          path: String(fieldName),
          message: message || `${String(fieldName)} is required`,
          severity: 'error'
        }]
      };
    }
    return { isValid: true, errors: [], warnings: [], issues: [] };
  };
}

/**
 * Build a string length validator
 */
export function stringLength<T>(
  fieldName: keyof T,
  minLength: number,
  maxLength: number,
  message?: string
): Validator<T> {
  return (data: T): BusinessValidationResult => {
    const value = data[fieldName];
    if (typeof value !== 'string') {
      return {
        isValid: false,
        errors: [`${String(fieldName)} must be a string`],
        warnings: [],
        issues: [{
          code: 'FORMAT' as ValidationCode,
          path: String(fieldName),
          message: `${String(fieldName)} must be a string`,
          severity: 'error'
        }]
      };
    }

    if (value.length < minLength || value.length > maxLength) {
      return {
        isValid: false,
        errors: [message || `${String(fieldName)} must be between ${minLength} and ${maxLength} characters`],
        warnings: [],
        issues: [{
          code: 'LENGTH' as ValidationCode,
          path: String(fieldName),
          message: message || `${String(fieldName)} must be between ${minLength} and ${maxLength} characters`,
          severity: 'error'
        }]
      };
    }

    return { isValid: true, errors: [], warnings: [], issues: [] };
  };
}

/**
 * Build a number range validator
 */
export function numberRange<T>(
  fieldName: keyof T,
  min: number,
  max: number,
  message?: string
): Validator<T> {
  return (data: T): BusinessValidationResult => {
    const value = data[fieldName];
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        isValid: false,
        errors: [`${String(fieldName)} must be a number`],
        warnings: [],
        issues: [{
          code: 'FORMAT' as ValidationCode,
          path: String(fieldName),
          message: `${String(fieldName)} must be a number`,
          severity: 'error'
        }]
      };
    }

    if (value < min || value > max) {
      return {
        isValid: false,
        errors: [message || `${String(fieldName)} must be between ${min} and ${max}`],
        warnings: [],
        issues: [{
          code: 'RANGE' as ValidationCode,
          path: String(fieldName),
          message: message || `${String(fieldName)} must be between ${min} and ${max}`,
          severity: 'error'
        }]
      };
    }

    return { isValid: true, errors: [], warnings: [], issues: [] };
  };
}

/**
 * Build a custom validator
 */
export function custom<T>(
  fieldName: keyof T,
  validator: (value: any) => boolean | string,
  message?: string
): Validator<T> {
  return (data: T): BusinessValidationResult => {
    const value = data[fieldName];
    const result = validator(value);
    
    if (result === false) {
      return {
        isValid: false,
        errors: [message || `${String(fieldName)} is invalid`],
        warnings: [],
        issues: [{
          code: 'FORMAT' as ValidationCode,
          path: String(fieldName),
          message: message || `${String(fieldName)} is invalid`,
          severity: 'error'
        }]
      };
    }

    if (typeof result === 'string') {
      return {
        isValid: false,
        errors: [result],
        warnings: [],
        issues: [{
          code: 'FORMAT' as ValidationCode,
          path: String(fieldName),
          message: result,
          severity: 'error'
        }]
      };
    }

    return { isValid: true, errors: [], warnings: [], issues: [] };
  };
}

/**
 * Compose multiple validators into one.
 * Useful for ad-hoc combinations without allocating a new pipeline instance.
 */
export function compose<T>(name: string, ...validators: Validator<T>[]): ValidationRule<T> {
  return {
    name,
    validator: async (data: T) => {
      const combined: ValidationIssue[] = [];
      for (const v of validators) {
        const r = await v(data);
        if (!r.isValid && r.issues) combined.push(...r.issues);
      }
      return {
        isValid: combined.length === 0,
        errors: combined.filter(i => i.severity === 'error').map(i => i.message),
        warnings: combined.filter(i => i.severity === 'warning').map(i => i.message),
        issues: combined
      };
    }
  };
}

/**
 * Join a base path with a child path safely.
 * - If child is empty/undefined → return base
 * - If child starts with "[" (array index) → concat without dot
 * - Else → dot-join
 */
function pathJoin(base: string, child?: string | null): string {
  if (!child) return base;
  return child.startsWith('[') ? `${base}${child}` : `${base}.${child}`;
}

/**
 * Conditionally require a field when a predicate over the whole object is true.
 * Example: requiredIf('dueDate', d => d.status === 'POSTED')
 */
export function requiredIf<T>(
  fieldName: keyof T,
  predicate: (data: T) => boolean,
  message?: string
): Validator<T> {
  return (data: T): BusinessValidationResult => {
    if (!predicate(data)) {
      return { isValid: true, errors: [], warnings: [], issues: [] };
    }
    const value = data[fieldName];
    const isMissing = value === null || value === undefined || value === '';
    if (!isMissing) {
      return { isValid: true, errors: [], warnings: [], issues: [] };
    }
    const msg = message || `${String(fieldName)} is required`;
    return {
      isValid: false,
      errors: [msg],
      warnings: [],
      issues: [{
        code: 'REQUIRED' as ValidationCode,
        path: String(fieldName),
        message: msg,
        severity: 'error'
      }]
    };
  };
}

/**
 * Validate each element of an array field with an item validator.
 * Item issues get paths like "items[2].quantity".
 */
export function each<T, E = any>(
  fieldName: keyof T,
  itemValidator: Validator<E>
): Validator<T> {
  return async (data: T): Promise<BusinessValidationResult> => {
    const arr: unknown = (data as any)[fieldName];
    if (!Array.isArray(arr)) {
      const msg = `${String(fieldName)} must be an array`;
      return {
        isValid: false,
        errors: [msg],
        warnings: [],
        issues: [{
          code: 'FORMAT' as ValidationCode,
          path: String(fieldName),
          message: msg,
          severity: 'error'
        }]
      };
    }
    const issues: ValidationIssue[] = [];
    for (let i = 0; i < arr.length; i++) {
      const r = await itemValidator(arr[i] as E);
      if (!r.isValid && r.issues) {
        for (const iss of r.issues) {
          const base = `${String(fieldName)}[${i}]`;
          issues.push({
            ...iss,
            path: pathJoin(base, iss.path || null),
            severity: iss.severity ?? 'error'
          });
        }
      }
    }
    return {
      isValid: issues.length === 0,
      errors: issues.filter(i => i.severity === 'error').map(i => i.message),
      warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
      issues
    };
  };
}

/**
 * Ensure values in an array field are unique by a key selector.
 * Example: uniqueArrayBy('lines', l => l.accountCode, 'Duplicate account lines')
 */
export function uniqueArrayBy<T, E = any, K = string | number>(
  fieldName: keyof T,
  keySelector: (item: E) => K,
  message?: string
): Validator<T> {
  return (data: T): BusinessValidationResult => {
    const arr: unknown = (data as any)[fieldName];
    if (!Array.isArray(arr)) {
      return { isValid: true, errors: [], warnings: [], issues: [] };
    }
    const seen = new Map<K, number>();
    const duplicates: { key: K; firstIndex: number; dupIndex: number }[] = [];
    for (let i = 0; i < arr.length; i++) {
      const key = keySelector(arr[i] as E);
      if (seen.has(key)) {
        duplicates.push({ key, firstIndex: seen.get(key)!, dupIndex: i });
      } else {
        seen.set(key, i);
      }
    }
    if (duplicates.length === 0) {
      return { isValid: true, errors: [], warnings: [], issues: [] };
    }
    const issues: ValidationIssue[] = duplicates.map(d => ({
      code: 'DUPLICATE' as ValidationCode,
      path: `${String(fieldName)}[${d.dupIndex}]`,
      message: message ?? `Duplicate value (${String(d.key)}) in ${String(fieldName)}`,
      severity: 'error'
    }));
    return {
      isValid: false,
      errors: issues.map(i => i.message),
      warnings: [],
      issues
    };
  };
}

/**
 * Constrain a field's value to one of the provided allowed values.
 * Uses strict equality. Useful for enums.
 */
export function oneOf<T, V = unknown>(
  fieldName: keyof T,
  allowed: readonly V[],
  message?: string
): Validator<T> {
  return (data: T): BusinessValidationResult => {
    const value = (data as any)[fieldName] as V;
    const ok = allowed.includes(value as any);
    if (ok) return { isValid: true, errors: [], warnings: [], issues: [] };
    const msg = message ?? `${String(fieldName)} must be one of: ${allowed.map(String).join(', ')}`;
    return {
      isValid: false,
      errors: [msg],
      warnings: [],
      issues: [{
        code: 'ONE_OF' as ValidationCode,
        path: String(fieldName),
        message: msg,
        severity: 'error'
      }]
    };
  };
}

/**
 * Ensure a string field matches a regex pattern (full test, not partial).
 * Provide a custom message to keep UI copy friendly.
 */
export function matchesRegex<T>(
  fieldName: keyof T,
  pattern: RegExp,
  message?: string
): Validator<T> {
  return (data: T): BusinessValidationResult => {
    const value = (data as any)[fieldName];
    const ok = typeof value === 'string' && pattern.test(value);
    if (ok) return { isValid: true, errors: [], warnings: [], issues: [] };
    const msg = message ?? `${String(fieldName)} is in an invalid format`;
    return {
      isValid: false,
      errors: [msg],
      warnings: [],
      issues: [{
        code: 'FORMAT' as ValidationCode,
        path: String(fieldName),
        message: msg,
        severity: 'error'
      }]
    };
  };
}

/**
 * Validate that ALL elements in an array field satisfy a predicate validator.
 * Unlike `each()`, this short-circuits on first failure when collectAllIssues=false.
 */
export function every<T, E = any>(
  fieldName: keyof T,
  itemValidator: Validator<E>
): Validator<T> {
  return async (data: T): Promise<BusinessValidationResult> => {
    const arr: unknown = (data as any)[fieldName];
    if (!Array.isArray(arr)) {
      // Treat non-array as pass; use `required()`/type checks to enforce array.
      return { isValid: true, errors: [], warnings: [], issues: [] };
    }
    const issues: ValidationIssue[] = [];
    for (let i = 0; i < arr.length; i++) {
      const r = await itemValidator(arr[i] as E);
      if (!r.isValid && r.issues?.length) {
        for (const iss of r.issues) {
          const base = `${String(fieldName)}[${i}]`;
          issues.push({
            ...iss,
            path: pathJoin(base, iss.path || null),
            severity: iss.severity ?? 'error'
          });
        }
      }
    }
    return {
      isValid: issues.length === 0,
      errors: issues.filter(i => i.severity === 'error').map(i => i.message),
      warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
      issues
    };
  };
}

// ============================================================================
// SPECIFIC VALIDATORS
// ============================================================================

// Light structural types for better safety without importing full domain types
type HasAccountCode = { accountCode?: unknown; parentAccountCode?: unknown };
type HasAccountName = { accountName?: unknown };
type HasAccountType = { accountType?: unknown };
type HasParentAccount = { parentAccountCode?: unknown; accountCode?: unknown };
type HasLines = { lines?: Array<{ accountCode?: unknown; debitAmount?: number; creditAmount?: number }> };
type HasTenant = { tenantId?: unknown };
type HasPostingDate = { postingDate?: unknown };
type HasEntryNumber = { entryNumber?: unknown };
type HasInvoiceNumber = { invoiceNumber?: unknown };
type HasDescription = { description?: unknown };
type HasStatus = { status?: unknown };
type HasAmounts = { amounts?: { totalDebit?: number; totalCredit?: number; subtotal?: number; tax?: number; total?: number } };
type HasBalance = { balance?: number };
type HasDates = { dates?: { createdAt?: unknown; updatedAt?: unknown; issueDate?: unknown; dueDate?: unknown } };
type HasId = { id?: unknown };
type HasCustomer = { customer?: { id?: unknown } | null | undefined };
type HasItems = { items?: Array<{ description?: unknown; quantity?: number; unitPrice?: number }> };

// Account validators
function validateAccountCode(data: HasAccountCode): BusinessValidationResult {
  return custom('accountCode', (value) => {
    if (typeof value !== 'string') return false;
    return /^[A-Z0-9]{3,20}$/.test(value);
  }, 'Account code must be 3-20 alphanumeric characters')(
    { accountCode: data.accountCode } as any
  ) as BusinessValidationResult;
}

function validateAccountName(data: HasAccountName): BusinessValidationResult {
  return stringLength('accountName', 1, 100)(
    { accountName: data.accountName } as any
  ) as BusinessValidationResult;
}

function validateAccountType(data: HasAccountType): BusinessValidationResult {
  return custom('accountType', (value) => {
    const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
    return typeof value === 'string' && validTypes.includes(value);
  }, 'Invalid account type')(
    { accountType: data.accountType } as any
  ) as BusinessValidationResult;
}

function validateParentAccount(data: HasParentAccount): BusinessValidationResult {
  if (!data.parentAccountCode) {
    return { isValid: true, errors: [], warnings: [], issues: [] };
  }
  
  return custom('parentAccountCode', (value) => {
    if (typeof value !== 'string') return false;
    return /^[A-Z0-9]{3,20}$/.test(value) && value !== data.accountCode;
  }, 'Parent account code must be different from account code')(
    { parentAccountCode: data.parentAccountCode } as any
  ) as BusinessValidationResult;
}

// Journal entry validators
function validateJournalEntry(data: HasId): BusinessValidationResult {
  return required('id')(data as any) as BusinessValidationResult;
}

function validateJournalEntryLines(data: HasLines): BusinessValidationResult {
  return custom('lines', (value) => {
    if (!Array.isArray(value) || value.length === 0) return false;
    return value.every(line =>
      typeof line?.accountCode === 'string' &&
      typeof line?.debitAmount === 'number' && line.debitAmount >= 0 &&
      typeof line?.creditAmount === 'number' && line.creditAmount >= 0
    );
  }, 'Journal entry must have at least one line with valid amounts')(
    { lines: data.lines } as any
  ) as BusinessValidationResult;
}

function validateDebitCreditBalance(data: HasLines): BusinessValidationResult {
  const TOL = 0.01;
  // If there are no lines, let the lines rule handle it; balance rule passes.
  if (!Array.isArray(data.lines) || data.lines.length === 0) {
    return { isValid: true, errors: [], warnings: [], issues: [] };
  }
  const totalDebit = data.lines.reduce((sum: number, line: any) => sum + (line?.debitAmount || 0), 0);
  const totalCredit = data.lines.reduce((sum: number, line: any) => sum + (line?.creditAmount || 0), 0);
  const ok = Math.abs(totalDebit - totalCredit) <= TOL;
  return ok
    ? { isValid: true, errors: [], warnings: [], issues: [] }
    : {
        isValid: false,
        errors: [`Total debits must equal total credits (tolerance: ${TOL})`],
        warnings: [],
        issues: [{
          code: 'BALANCE' as ValidationCode,
          path: 'balance',
          message: `Total debits must equal total credits (tolerance: ${TOL})`,
          severity: 'error'
        }]
      };
}

// Common validators
function validateTenantId(data: HasTenant): BusinessValidationResult {
  return required('tenantId')(data as any) as BusinessValidationResult;
}

function validatePostingDate(data: HasPostingDate): BusinessValidationResult {
  return custom('postingDate', (value) => {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime()) && date <= new Date();
  }, 'Posting date must be a valid date not in the future')(
    { postingDate: data.postingDate } as any
  ) as BusinessValidationResult;
}

function validateEntryNumber(data: HasEntryNumber): BusinessValidationResult {
  return stringLength('entryNumber', 1, 50)(data as any) as BusinessValidationResult;
}

function validateDescription(data: HasDescription): BusinessValidationResult {
  return stringLength('description', 1, 500)(data as any) as BusinessValidationResult;
}

function validateJournalEntryStatus(data: HasStatus): BusinessValidationResult {
  return custom('status', (value) => {
    const validStatuses = ['DRAFT', 'POSTED', 'CANCELLED'];
    return typeof value === 'string' && validStatuses.includes(value);
  }, 'Invalid journal entry status')(data as any) as BusinessValidationResult;
}

function validateJournalEntryAmounts(data: HasAmounts): BusinessValidationResult {
  return custom('amounts', (value) => {
    return typeof value.totalDebit === 'number' && 
           typeof value.totalCredit === 'number' &&
           value.totalDebit >= 0 && 
           value.totalCredit >= 0;
  }, 'Invalid journal entry amounts')(data as any) as BusinessValidationResult;
}

function validateAccountBalance(data: HasBalance): BusinessValidationResult {
  return custom('balance', (value) => {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }, 'Invalid account balance')(data as any) as BusinessValidationResult;
}

function validateAccountDates(data: HasDates): BusinessValidationResult {
  return custom('dates', (value) => {
    const createdAt = new Date(value?.createdAt as any);
    const updatedAt = new Date(value?.updatedAt as any);
    return !isNaN(createdAt.getTime()) && 
           !isNaN(updatedAt.getTime()) && 
           updatedAt >= createdAt;
  }, 'Invalid account dates')(data as any) as BusinessValidationResult;
}

// Invoice validators
function validateInvoice(data: HasId): BusinessValidationResult {
  return required('id')(data as any) as BusinessValidationResult;
}

function validateCustomer(data: HasCustomer): BusinessValidationResult {
  return custom('customer', (value) => {
    return value && typeof value === 'object' && value.id;
  }, 'Customer is required')(data as any) as BusinessValidationResult;
}

function validateInvoiceItems(data: HasItems): BusinessValidationResult {
  return custom('items', (value) => {
    if (!Array.isArray(value) || value.length === 0) return false;
    return value.every(item => 
      item.description && 
      typeof item.quantity === 'number' && 
      typeof item.unitPrice === 'number'
    );
  }, 'Invoice must have at least one item')(data as any) as BusinessValidationResult;
}

function validateInvoiceAmounts(data: HasAmounts): BusinessValidationResult {
  return custom('amounts', (value) => {
    return typeof value.subtotal === 'number' && 
           typeof value.tax === 'number' && 
           typeof value.total === 'number' &&
           value.subtotal >= 0 && 
           value.tax >= 0 && 
           value.total >= 0;
  }, 'Invalid invoice amounts')(data as any) as BusinessValidationResult;
}

function validateInvoiceNumber(data: HasInvoiceNumber): BusinessValidationResult {
  // Correct structural type for 'invoiceNumber'
  return stringLength<HasInvoiceNumber>('invoiceNumber', 1, 50)({ invoiceNumber: (data as any).invoiceNumber }) as BusinessValidationResult;
}

function validateInvoiceDates(data: HasDates): BusinessValidationResult {
  return custom('dates', (value) => {
    const issueDate = new Date(value?.issueDate as any);
    const dueDate = new Date(value?.dueDate as any);
    return !isNaN(issueDate.getTime()) && 
           !isNaN(dueDate.getTime()) && 
           dueDate >= issueDate;
  }, 'Invalid invoice dates')(data as any) as BusinessValidationResult;
}

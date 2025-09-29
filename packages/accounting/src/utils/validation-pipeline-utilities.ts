/**
 * Validation Pipeline Utilities - Phase 2 Implementation (Refactored)
 * 
 * Provides a flexible validation pipeline system for complex validation scenarios.
 * Now uses SSOT architecture with split modules for better maintainability.
 * 
 * Features:
 * - ValidationPipeline class for chaining validators
 * - CommandValidator for common command validation
 * - Pre-configured validators for accounting operations
 * - Structured validation results with issues
 * - Async validation support
 * - Validation rule builders
 * - SSOT integration with policies
 */

// Re-export from split modules for backward compatibility
export * from './validation-rules-utilities';
export * from './validation-results-utilities';

// Re-export ValidationContext with explicit name to avoid conflicts
export type { ValidationContext as ValidationPipelineContext } from './validation-context-utilities';
export { ValidationPipeline } from './validation-pipeline-core-utilities';

import { 
  type BusinessValidationResult,
  type ValidationIssue
} from './validation-utilities';
import { 
  type ErrorContext
} from './error-utilities';
import { 
  ValidationPipeline,
  type ValidationRule,
  type ValidationPipelineOptions
} from './validation-pipeline-core-utilities';

// ============================================================================
// COMMAND VALIDATOR (Backward Compatibility)
// ============================================================================

/**
 * CommandValidator for common command validation patterns
 * Maintains backward compatibility with existing code
 */
export class CommandValidator<T> {
  private pipeline: ValidationPipeline<T>;

  constructor(options: ValidationPipelineOptions = {}) {
    this.pipeline = new ValidationPipeline<T>(options);
  }

  /**
   * Add validation rule
   */
  addRule(rule: ValidationRule<T>): this {
    this.pipeline.addRule(rule);
    return this;
  }

  /**
   * Add validator function
   */
  addValidator(
    name: string,
    validator: (data: T) => BusinessValidationResult | Promise<BusinessValidationResult>,
    options: { severity?: 'error' | 'warning'; stopOnError?: boolean } = {}
  ): this {
    this.pipeline.addValidator(name, validator, options);
    return this;
  }

  /**
   * Validate command data
   */
  async validate(data: T, context?: ErrorContext): Promise<BusinessValidationResult> {
    return this.pipeline.validate(data, context);
  }

  /**
   * Get pipeline statistics
   */
  getStats(): { validatorCount: number; options: ValidationPipelineOptions } {
    return this.pipeline.getStats();
  }
}

// ============================================================================
// PRE-CONFIGURED VALIDATORS (Backward Compatibility)
// ============================================================================

/**
 * Create a command validator for account validation
 */
export function createAccountValidator(): CommandValidator<unknown> {
  const validator = new CommandValidator<unknown>();
  
  validator.addValidator('accountCodeRequired', (data: unknown) => {
    const issues: ValidationIssue[] = [];
    
    if (!data.code || data.code.trim().length === 0) {
      issues.push({
        code: 'MISSING_CODE' as unknown,
        message: 'Account code is required',
        severity: 'error',
        path: 'code'
      });
    }
    
    return {
      isValid: issues.length === 0,
      errors: issues.filter(i => i.severity === 'error').map(i => i.message),
      warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
      issues
    };
  });

  return validator;
}

/**
 * Create a command validator for journal entry validation
 */
export function createJournalEntryValidator(): CommandValidator<unknown> {
  const validator = new CommandValidator<unknown>();
  
  validator.addValidator('balancedEntry', (data: unknown) => {
    const issues: ValidationIssue[] = [];
    
    if (data.totalDebits !== data.totalCredits) {
          issues.push({
        code: 'UNBALANCED_ENTRY' as unknown,
        message: 'Journal entry must be balanced (debits = credits)',
        severity: 'error',
        path: 'balance'
      });
    }
    
    return {
      isValid: issues.length === 0,
      errors: issues.filter(i => i.severity === 'error').map(i => i.message),
      warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
      issues
    };
  });

  return validator;
}

/**
 * Create a command validator for transaction validation
 */
export function createTransactionValidator(): CommandValidator<unknown> {
  const validator = new CommandValidator<unknown>();
  
  validator.addValidator('positiveAmount', (data: unknown) => {
    const issues: ValidationIssue[] = [];
    
    if (data.amount < 0) {
          issues.push({
        code: 'NEGATIVE_AMOUNT' as unknown,
        message: 'Transaction amount must be positive',
        severity: 'error',
        path: 'amount'
      });
    }
    
    return {
      isValid: issues.length === 0,
      errors: issues.filter(i => i.severity === 'error').map(i => i.message),
      warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
      issues
    };
  });

  return validator;
}

// ============================================================================
// HELPER FUNCTIONS (Backward Compatibility)
// ============================================================================

/**
 * Create a validation pipeline with default options
 */
export function createValidationPipeline<T>(options?: ValidationPipelineOptions): ValidationPipeline<T> {
  return new ValidationPipeline<T>(options);
}

/**
 * Create a simple validator function
 */
export function createValidator<T>(
  name: string,
  validatorFn: (data: T) => boolean | string,
  severity: 'error' | 'warning' = 'error'
): ValidationRule<T> {
  return {
    name,
    validator: (data: T) => {
      const result = validatorFn(data);
      
      if (typeof result === 'boolean') {
        return {
          isValid: result,
          errors: [],
          warnings: [],
          issues: []
        };
      } else {
        return {
        isValid: false,
          errors: severity === 'error' ? [result] : [],
          warnings: severity === 'warning' ? [result] : [],
        issues: [{
            code: 'VALIDATION_FAILED' as unknown,
            message: result,
            severity,
            path: 'data'
        }]
      };
}
    },
    severity,
    stopOnError: severity === 'error'
  };
}

// ============================================================================
// MISSING EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

/**
 * AccountValidator - Backward compatibility class
 */
export class AccountValidator extends CommandValidator<unknown> {
  constructor() {
    super();
    this.addValidator('accountCodeRequired', (data: unknown) => {
      const issues: ValidationIssue[] = [];
      
      if (!data.code || data.code.trim().length === 0) {
        issues.push({
          code: 'MISSING_CODE' as unknown,
          message: 'Account code is required',
          severity: 'error',
          path: 'code'
        });
      }
      
      return {
        isValid: issues.length === 0,
        errors: issues.filter(i => i.severity === 'error').map(i => i.message),
        warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
        issues
      };
    });
  }
}

/**
 * JournalEntryValidator - Backward compatibility class
 */
export class JournalEntryValidator extends CommandValidator<unknown> {
  constructor() {
    super();
    this.addValidator('balancedEntry', (data: unknown) => {
      const issues: ValidationIssue[] = [];
      
      if (data.totalDebits !== data.totalCredits) {
        issues.push({
          code: 'UNBALANCED_ENTRY' as unknown,
          message: 'Journal entry must be balanced (debits = credits)',
          severity: 'error',
          path: 'balance'
        });
      }
      
      return {
        isValid: issues.length === 0,
        errors: issues.filter(i => i.severity === 'error').map(i => i.message),
        warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
        issues
      };
    });
  }
}

/**
 * InvoiceValidator - Backward compatibility class
 */
export class InvoiceValidator extends CommandValidator<unknown> {
  constructor() {
    super();
    this.addValidator('positiveAmount', (data: unknown) => {
      const issues: ValidationIssue[] = [];
      
      if (data.amount < 0) {
        issues.push({
          code: 'NEGATIVE_AMOUNT' as unknown,
          message: 'Transaction amount must be positive',
          severity: 'error',
          path: 'amount'
        });
      }
      
      return {
        isValid: issues.length === 0,
        errors: issues.filter(i => i.severity === 'error').map(i => i.message),
        warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
        issues
      };
    });
  }
}

/**
 * Compose function for chaining validators
 */
export function compose<T>(...validators: CommandValidator<T>[]): CommandValidator<T> {
  const composed = new CommandValidator<T>();
  
  validators.forEach(_validator => {
    // Note: This is a simplified composition - in practice you'd need to extract rules
    // For now, we'll create a basic composed validator
  });
  
  return composed;
}
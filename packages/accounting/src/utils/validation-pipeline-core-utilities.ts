/**
 * Validation Pipeline Core - SSOT Implementation
 * 
 * Core validation pipeline logic with SSOT integration.
 * Imports from policies/validation-policy.ts for consistent validation behavior.
 */

import { 
  type BusinessValidationResult,
  type ValidationIssue
} from './validation-utilities';
import { 
  type ErrorContext
} from './error-utilities';
import { 
  type ValidationRule as PolicyValidationRule,
  VALIDATION_POLICIES
} from './policies/validation-policy';

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
 * Integrates with SSOT validation policies for consistent behavior
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
   * Add validation rules from SSOT policy
   */
  addPolicyRules(policyType: keyof typeof VALIDATION_POLICIES): this {
    const policy = VALIDATION_POLICIES[policyType];
    
    policy.rules.forEach(rule => {
      this.addValidator(
        rule.name,
        (data: T) => this.validateWithPolicyRule(data, rule),
        { 
          severity: rule.severity,
          stopOnError: rule.severity === 'error'
        }
      );
    });
    
    return this;
  }

  /**
   * Validate data using policy rule
   */
  private validateWithPolicyRule(_data: T, _rule: PolicyValidationRule): BusinessValidationResult {
    // This would be implemented based on the specific rule condition
    // For now, return a basic validation result
    return {
      isValid: true,
      errors: [],
      warnings: [],
      issues: []
    };
  }

  /**
   * Execute validation pipeline
   */
  async validate(data: T, _context?: ValidationContext): Promise<BusinessValidationResult> {
    const allIssues: ValidationIssue[] = [];
    let hasErrors = false;

    for (const rule of this.validators) {
      try {
        const result = await rule.validator(data);
        
        if (result.issues) {
          allIssues.push(...result.issues);
        }
        
        if (!result.isValid) {
          hasErrors = true;
          
          if (rule.stopOnError || this.options.stopOnFirstError) {
            break;
          }
        }
        
        // Check max issues limit
        if (this.options.maxIssues && allIssues.length >= this.options.maxIssues) {
          break;
        }
        
      } catch (error) {
        const errorIssue: ValidationIssue = {
          code: 'VALIDATION_ERROR' as unknown,
          message: `Validation error in ${rule.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
          path: rule.name
        };
        
        allIssues.push(errorIssue);
        hasErrors = true;
        
        if (rule.stopOnError || this.options.stopOnFirstError) {
          break;
        }
      }
    }

    // Filter issues based on options
    let filteredIssues = allIssues;
    
    if (!this.options.includeWarnings) {
      filteredIssues = filteredIssues.filter(issue => issue.severity === 'error');
    }
    
    if (this.options.dedupeIssues) {
      filteredIssues = this.deduplicateIssues(filteredIssues);
    }

    return {
      isValid: !hasErrors,
      errors: filteredIssues.filter(issue => issue.severity === 'error').map(issue => issue.message),
      warnings: filteredIssues.filter(issue => issue.severity === 'warning').map(issue => issue.message),
      issues: filteredIssues
    };
  }

  /**
   * Deduplicate issues based on path, code, message, and severity
   */
  private deduplicateIssues(issues: ValidationIssue[]): ValidationIssue[] {
    const seen = new Set<string>();
    return issues.filter(issue => {
      const key = `${issue.path || ''}-${issue.code}-${issue.message}-${issue.severity}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Get pipeline statistics
   */
  getStats(): { validatorCount: number; options: ValidationPipelineOptions } {
    return {
      validatorCount: this.validators.length,
      options: this.options
    };
  }
}

// ============================================================================
// PIPELINE BUILDERS
// ============================================================================

/**
 * Create a new validation pipeline with default options
 */
export function createValidationPipeline<T>(options?: ValidationPipelineOptions): ValidationPipeline<T> {
  return new ValidationPipeline<T>(options);
}

/**
 * Create a validation pipeline for a specific policy type
 */
export function createPolicyValidationPipeline<T>(policyType: keyof typeof VALIDATION_POLICIES): ValidationPipeline<T> {
  const pipeline = new ValidationPipeline<T>();
  pipeline.addPolicyRules(policyType);
  return pipeline;
}

/**
 * Create a validation pipeline with custom rules
 */
export function createCustomValidationPipeline<T>(
  rules: ValidationRule<T>[],
  options?: ValidationPipelineOptions
): ValidationPipeline<T> {
  const pipeline = new ValidationPipeline<T>(options);
  rules.forEach(rule => pipeline.addRule(rule));
  return pipeline;
}

/**
 * Validation Results - SSOT Implementation
 * 
 * Result processing and formatting for validation operations.
 * Provides structured result handling and reporting capabilities.
 */

import { 
  type BusinessValidationResult,
  type ValidationIssue
} from './validation-utilities';
import { 
  type ValidationResult
} from './validation-context-utilities';

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResultSummary {
  isValid: boolean;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  criticalIssues: ValidationIssue[];
  nonCriticalIssues: ValidationIssue[];
  duration: number;
  timestamp: Date;
}

export interface ValidationReport {
  id: string;
  title: string;
  summary: ValidationResultSummary;
  details: ValidationIssue[];
  recommendations: string[];
  metadata: Record<string, unknown>;
  generatedAt: Date;
}

export interface ValidationMetrics {
  totalValidations: number;
  successRate: number;
  averageIssuesPerValidation: number;
  mostCommonIssues: Array<{ code: string; count: number; percentage: number }>;
  performanceMetrics: {
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
  };
}

// ============================================================================
// VALIDATION RESULT PROCESSOR
// ============================================================================

export class ValidationResultProcessor {
  /**
   * Process validation result and create summary
   */
  static processResult(
    result: BusinessValidationResult,
    duration: number = 0
  ): ValidationResultSummary {
    const criticalIssues = (result.issues || []).filter(issue => issue.severity === 'error');
    const nonCriticalIssues = (result.issues || []).filter(issue => issue.severity === 'warning');

    return {
      isValid: result.isValid,
      totalIssues: (result.issues || []).length,
      errorCount: criticalIssues.length,
      warningCount: nonCriticalIssues.length,
      criticalIssues,
      nonCriticalIssues,
      duration,
      timestamp: new Date()
    };
  }

  /**
   * Generate validation report
   */
  static generateReport(
    results: ValidationResultSummary[],
    title: string = 'Validation Report',
    metadata: Record<string, unknown> = {}
  ): ValidationReport {
    const allIssues = results.flatMap(r => r.criticalIssues.concat(r.nonCriticalIssues));
    const summary = this.aggregateResults(results);
    const recommendations = this.generateRecommendations(allIssues);

    return {
      id: this.generateReportId(),
      title,
      summary,
      details: allIssues,
      recommendations,
      metadata,
      generatedAt: new Date()
    };
  }

  /**
   * Calculate validation metrics
   */
  static calculateMetrics(results: ValidationResult[]): ValidationMetrics {
    const totalValidations = results.length;
    const successfulValidations = results.filter(r => r.isValid).length;
    const successRate = totalValidations > 0 ? successfulValidations / totalValidations : 0;
    
    const totalIssues = results.reduce((sum, r) => sum + r.errorCount + r.warningCount, 0);
    const averageIssuesPerValidation = totalValidations > 0 ? totalIssues / totalValidations : 0;

    const durations = results.map(r => r.duration);
    const performanceMetrics = this.calculatePerformanceMetrics(durations);

    const issueCounts = new Map<string, number>();
    results.forEach(result => {
      // This would need access to the actual issues, simplified for now
      issueCounts.set('VALIDATION_ERROR', (issueCounts.get('VALIDATION_ERROR') || 0) + result.errorCount);
    });

    const mostCommonIssues = Array.from(issueCounts.entries())
      .map(([code, count]) => ({
        code,
        count,
        percentage: totalIssues > 0 ? (count / totalIssues) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalValidations,
      successRate,
      averageIssuesPerValidation,
      mostCommonIssues,
      performanceMetrics
    };
  }

  /**
   * Format validation result for display
   */
  static formatResult(result: BusinessValidationResult): string {
    const lines: string[] = [];
    
    lines.push(`Validation Result: ${result.isValid ? 'PASSED' : 'FAILED'}`);
    lines.push(`Errors: ${result.errors.length}`);
    lines.push(`Warnings: ${result.warnings.length}`);
    
    if (result.errors.length > 0) {
      lines.push('\nErrors:');
      result.errors.forEach((error, index) => {
        lines.push(`  ${index + 1}. ${error}`);
      });
    }
    
    if (result.warnings.length > 0) {
      lines.push('\nWarnings:');
      result.warnings.forEach((warning, index) => {
        lines.push(`  ${index + 1}. ${warning}`);
      });
    }
    
    return lines.join('\n');
  }

  /**
   * Export validation result to JSON
   */
  static exportToJson(result: BusinessValidationResult): string {
    return JSON.stringify({
      isValid: result.isValid,
      errors: result.errors,
      warnings: result.warnings,
      issues: result.issues,
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Export validation result to CSV
   */
  static exportToCsv(results: ValidationResultSummary[]): string {
    const headers = ['Timestamp', 'Valid', 'Errors', 'Warnings', 'Duration'];
    const rows = results.map(result => [
      result.timestamp.toISOString(),
      result.isValid.toString(),
      result.errorCount.toString(),
      result.warningCount.toString(),
      result.duration.toString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Aggregate multiple validation results
   */
  private static aggregateResults(results: ValidationResultSummary[]): ValidationResultSummary {
    const allCriticalIssues = results.flatMap(r => r.criticalIssues);
    const allNonCriticalIssues = results.flatMap(r => r.nonCriticalIssues);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    return {
      isValid: results.every(r => r.isValid),
      totalIssues: allCriticalIssues.length + allNonCriticalIssues.length,
      errorCount: allCriticalIssues.length,
      warningCount: allNonCriticalIssues.length,
      criticalIssues: allCriticalIssues,
      nonCriticalIssues: allNonCriticalIssues,
      duration: totalDuration,
      timestamp: new Date()
    };
  }

  /**
   * Generate recommendations based on validation issues
   */
  private static generateRecommendations(issues: ValidationIssue[]): string[] {
    const recommendations: string[] = [];
    const issueCodes = new Set(issues.map(issue => issue.code));

    if (issueCodes.has('INVALID_CODE_FORMAT' as unknown)) {
      recommendations.push('Review account code format requirements');
    }
    
    if (issueCodes.has('UNBALANCED_ENTRY' as unknown)) {
      recommendations.push('Check journal entry balancing logic');
    }
    
    if (issueCodes.has('NEGATIVE_AMOUNT' as unknown)) {
      recommendations.push('Implement amount validation rules');
    }
    
    if (issueCodes.has('MISSING_DESCRIPTION' as unknown)) {
      recommendations.push('Add required field validation');
    }

    return recommendations;
  }

  /**
   * Calculate performance metrics
   */
  private static calculatePerformanceMetrics(durations: number[]): ValidationMetrics['performanceMetrics'] {
    if (durations.length === 0) {
      return {
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0
      };
    }

    const sortedDurations = durations.sort((a, b) => a - b);
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minDuration = sortedDurations[0] || 0;
    const maxDuration = sortedDurations[sortedDurations.length - 1] || 0;
    const p95Index = Math.ceil(sortedDurations.length * 0.95) - 1;
    const p95Duration = sortedDurations[p95Index] || 0;

    return {
      averageDuration,
      minDuration,
      maxDuration,
      p95Duration
    };
  }

  /**
   * Generate unique report ID
   */
  private static generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Process validation result and create summary
 */
export function processValidationResult(
  result: BusinessValidationResult,
  duration: number = 0
): ValidationResultSummary {
  return ValidationResultProcessor.processResult(result, duration);
}

/**
 * Generate validation report
 */
export function generateValidationReport(
  results: ValidationResultSummary[],
  title: string = 'Validation Report',
  metadata: Record<string, unknown> = {}
): ValidationReport {
  return ValidationResultProcessor.generateReport(results, title, metadata);
}

/**
 * Calculate validation metrics
 */
export function calculateValidationMetrics(results: ValidationResult[]): ValidationMetrics {
  return ValidationResultProcessor.calculateMetrics(results);
}

/**
 * Format validation result for display
 */
export function formatValidationResult(result: BusinessValidationResult): string {
  return ValidationResultProcessor.formatResult(result);
}

/**
 * Export validation result to JSON
 */
export function exportValidationResultToJson(result: BusinessValidationResult): string {
  return ValidationResultProcessor.exportToJson(result);
}

/**
 * Export validation result to CSV
 */
export function exportValidationResultToCsv(results: ValidationResultSummary[]): string {
  return ValidationResultProcessor.exportToCsv(results);
}

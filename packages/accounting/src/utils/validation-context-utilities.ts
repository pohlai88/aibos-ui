/**
 * Validation Context - SSOT Implementation
 * 
 * Context management for validation operations.
 * Provides structured context for validation pipelines and error handling.
 */

import { 
  type ValidationContext as BaseValidationContext
} from './validation-pipeline-core-utilities';

// ============================================================================
// VALIDATION CONTEXT TYPES
// ============================================================================

export interface ValidationContext extends BaseValidationContext {
  validationId?: string;
  timestamp?: Date;
  source?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export interface ValidationSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  context: ValidationContext;
  results: ValidationResult[];
  statistics: ValidationStatistics;
}

export interface ValidationResult {
  id: string;
  timestamp: Date;
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  duration: number;
  context: ValidationContext;
}

export interface ValidationStatistics {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  averageDuration: number;
  totalErrors: number;
  totalWarnings: number;
}

// ============================================================================
// VALIDATION CONTEXT MANAGER
// ============================================================================

export class ValidationContextManager {
  private static instance: ValidationContextManager;
  private sessions: Map<string, ValidationSession> = new Map();
  private statistics: ValidationStatistics = {
    totalValidations: 0,
    successfulValidations: 0,
    failedValidations: 0,
    averageDuration: 0,
    totalErrors: 0,
    totalWarnings: 0
  };

  private constructor() {}

  static getInstance(): ValidationContextManager {
    if (!ValidationContextManager.instance) {
      ValidationContextManager.instance = new ValidationContextManager();
    }
    return ValidationContextManager.instance;
  }

  /**
   * Create a new validation context
   */
  createContext(
    source: string,
    options: {
      userId?: string;
      sessionId?: string;
      requestId?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): ValidationContext {
    const validationId = this.generateValidationId();
    
    return {
      validationId,
      timestamp: new Date(),
      source,
      ...(options.userId && { userId: options.userId }),
      ...(options.sessionId && { sessionId: options.sessionId }),
      ...(options.requestId && { requestId: options.requestId }),
      ...(options.metadata && { metadata: options.metadata })
    };
  }

  /**
   * Start a validation session
   */
  startSession(context: ValidationContext): ValidationSession {
    const session: ValidationSession = {
      id: context.validationId || this.generateValidationId(),
      startTime: new Date(),
      context,
      results: [],
      statistics: {
        totalValidations: 0,
        successfulValidations: 0,
        failedValidations: 0,
        averageDuration: 0,
        totalErrors: 0,
        totalWarnings: 0
      }
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * End a validation session
   */
  endSession(sessionId: string): ValidationSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    session.endTime = new Date();
    this.updateStatistics(session);
    return session;
  }

  /**
   * Add a validation result to a session
   */
  addResult(
    sessionId: string,
    result: Omit<ValidationResult, 'id' | 'timestamp' | 'context'>
  ): ValidationResult | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const validationResult: ValidationResult = {
      id: this.generateValidationId(),
      timestamp: new Date(),
      ...result,
      context: session.context
    };

    session.results.push(validationResult);
    this.updateSessionStatistics(session);
    return validationResult;
  }

  /**
   * Get validation session
   */
  getSession(sessionId: string): ValidationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all validation sessions
   */
  getAllSessions(): ValidationSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get global validation statistics
   */
  getStatistics(): ValidationStatistics {
    return { ...this.statistics };
  }

  /**
   * Clear old sessions (older than specified hours)
   */
  clearOldSessions(hoursOld: number = 24): number {
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    let clearedCount = 0;

    const sessionsToDelete: string[] = [];
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.startTime < cutoffTime) {
        sessionsToDelete.push(sessionId);
      }
    }
    
    for (const sessionId of sessionsToDelete) {
      this.sessions.delete(sessionId);
      clearedCount++;
    }

    return clearedCount;
  }

  /**
   * Generate a unique validation ID
   */
  private generateValidationId(): string {
    return `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update session statistics
   */
  private updateSessionStatistics(session: ValidationSession): void {
    const stats = session.statistics;
    stats.totalValidations = session.results.length;
    stats.successfulValidations = session.results.filter(r => r.isValid).length;
    stats.failedValidations = session.results.filter(r => !r.isValid).length;
    stats.totalErrors = session.results.reduce((sum, r) => sum + r.errorCount, 0);
    stats.totalWarnings = session.results.reduce((sum, r) => sum + r.warningCount, 0);
    
    if (session.results.length > 0) {
      stats.averageDuration = session.results.reduce((sum, r) => sum + r.duration, 0) / session.results.length;
    }
  }

  /**
   * Update global statistics
   */
  private updateStatistics(session: ValidationSession): void {
    const stats = this.statistics;
    stats.totalValidations += session.statistics.totalValidations;
    stats.successfulValidations += session.statistics.successfulValidations;
    stats.failedValidations += session.statistics.failedValidations;
    stats.totalErrors += session.statistics.totalErrors;
    stats.totalWarnings += session.statistics.totalWarnings;
    
    if (stats.totalValidations > 0) {
      stats.averageDuration = (stats.averageDuration * (stats.totalValidations - session.statistics.totalValidations) + 
        session.statistics.averageDuration * session.statistics.totalValidations) / stats.totalValidations;
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a validation context for a specific operation
 */
export function createValidationContext(
  source: string,
  options: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    metadata?: Record<string, unknown>;
  } = {}
): ValidationContext {
  return ValidationContextManager.getInstance().createContext(source, options);
}

/**
 * Start a validation session
 */
export function startValidationSession(context: ValidationContext): ValidationSession {
  return ValidationContextManager.getInstance().startSession(context);
}

/**
 * End a validation session
 */
export function endValidationSession(sessionId: string): ValidationSession | null {
  return ValidationContextManager.getInstance().endSession(sessionId);
}

/**
 * Add a validation result to a session
 */
export function addValidationResult(
  sessionId: string,
  result: Omit<ValidationResult, 'id' | 'timestamp' | 'context'>
): ValidationResult | null {
  return ValidationContextManager.getInstance().addResult(sessionId, result);
}

/**
 * Get validation statistics
 */
export function getValidationStatistics(): ValidationStatistics {
  return ValidationContextManager.getInstance().getStatistics();
}

/**
 * Clear old validation sessions
 */
export function clearOldValidationSessions(hoursOld: number = 24): number {
  return ValidationContextManager.getInstance().clearOldSessions(hoursOld);
}

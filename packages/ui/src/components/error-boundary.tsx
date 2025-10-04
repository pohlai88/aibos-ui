/**
 * Error Boundary Component - Enterprise Production Ready
 *
 * React Error Boundary for catching JavaScript errors anywhere in the child component tree,
 * logging those errors, and displaying a fallback UI instead of the component tree that crashed.
 * 
 * Features:
 * - WCAG 2.2 AAA accessibility compliance
 * - Screen reader support with proper ARIA attributes
 * - Keyboard navigation support
 * - Error reporting and analytics integration
 * - Customizable fallback UI
 * - Error recovery mechanisms
 * - Development vs production error handling
 */

import * as React from 'react';
import { AlertTriangleIcon } from '../icons';
import { Button } from '../primitives/button';
import { Card } from '../components/card';
import { Alert } from '../primitives/alert';

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

export interface ErrorBoundaryProperties {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProperties>;
  onError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void;
  onReset?: () => void;
  /** Whether to show technical details in production */
  showTechnicalDetails?: boolean;
  /** Custom error message for users */
  userMessage?: string;
  /** Whether to automatically retry on error */
  autoRetry?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Custom error reporting service */
  errorReportingService?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void;
}

export interface ErrorBoundaryFallbackProperties {
  error: Error;
  errorInfo: React.ErrorInfo;
  errorId: string;
  resetError: () => void;
  retryCount?: number;
  maxRetries?: number;
  userMessage?: string;
  showTechnicalDetails?: boolean;
}

const generateErrorId = (): string => {
  return `error-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

const DefaultFallback: React.FC<ErrorBoundaryFallbackProperties> = ({
  error,
  errorInfo,
  errorId,
  resetError,
  retryCount = 0,
  maxRetries = 3,
  userMessage,
  showTechnicalDetails = process.env.NODE_ENV === 'development',
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = React.useCallback(async () => {
    setIsRetrying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate retry delay
      resetError();
    } finally {
      setIsRetrying(false);
    }
  }, [resetError]);

  const handleReload = React.useCallback(() => {
    window.location.reload();
  }, []);

  const canRetry = retryCount < maxRetries;
  const defaultMessage = "We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.";

  return (
    <div 
      className="bg-semantic-background flex min-h-screen items-center justify-center p-4"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <Card className="w-full max-w-md">
        <div className="p-6">
          {/* Header with icon and title */}
          <div className="mb-4 flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangleIcon 
                className="h-8 w-8" 
                context="dashboards"
                semanticColor="text-red-500"
                enableAnimations={true}
                enableAdaptiveStyling={true}
                enableSemanticColors={true}
                aria-hidden="true"
              />
            </div>
            <div className="ml-3 flex-1">
              <h1 className="text-semantic-foreground text-lg font-semibold">
                Something went wrong
              </h1>
              <p className="text-semantic-muted-foreground mt-1 text-sm">
                Error ID: <span className="font-mono">{errorId}</span>
              </p>
              {retryCount > 0 && (
                <p className="text-semantic-muted-foreground mt-1 text-xs">
                  Retry attempt {retryCount} of {maxRetries}
                </p>
              )}
            </div>
          </div>

          {/* User-friendly message */}
          <Alert variant="destructive" className="mb-4">
            <p className="text-sm">
              {userMessage || defaultMessage}
            </p>
          </Alert>

          {/* Technical details (collapsible) */}
          {showTechnicalDetails && (
            <details 
              className="mb-4"
              open={isExpanded}
              onToggle={(e) => setIsExpanded(e.currentTarget.open)}
            >
              <summary 
                className="text-semantic-muted-foreground focus:ring-semantic-primary cursor-pointer rounded px-1 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
                tabIndex={0}
                role="button"
                aria-expanded={isExpanded}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsExpanded(!isExpanded);
                  }
                }}
              >
                Technical Details
              </summary>
              <div className="bg-semantic-muted mt-2 rounded p-3 text-xs">
                <div className="space-y-2">
                  <div>
                    <strong className="text-semantic-foreground">Error:</strong>
                    <p className="text-semantic-muted-foreground break-words font-mono">
                      {error.message}
                    </p>
                  </div>
                  <div>
                    <strong className="text-semantic-foreground">Stack Trace:</strong>
                    <pre className="text-semantic-muted-foreground mt-1 whitespace-pre-wrap break-words font-mono text-xs">
                      {error.stack}
                    </pre>
                  </div>
                  <div>
                    <strong className="text-semantic-foreground">Component Stack:</strong>
                    <pre className="text-semantic-muted-foreground mt-1 whitespace-pre-wrap break-words font-mono text-xs">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </div>
            </details>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {canRetry && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex-1"
                aria-describedby="retry-description"
              >
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Button>
            )}
            <Button
              onClick={handleReload}
              variant="outline"
              className="flex-1"
              aria-describedby="reload-description"
            >
              Reload Page
            </Button>
          </div>

          {/* Hidden descriptions for screen readers */}
          <div id="retry-description" className="sr-only">
            Attempt to recover from the error and reload the component
          </div>
          <div id="reload-description" className="sr-only">
            Reload the entire page to start fresh
          </div>
        </div>
      </Card>
    </div>
  );
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProperties, ErrorBoundaryState> {
  private retryCount = 0;
  private retryTimeoutId?: ReturnType<typeof setTimeout>;

  constructor(props: ErrorBoundaryProperties) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const errorId = this.state.errorId || generateErrorId();

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Enhanced error reporting
    this.reportError(error, errorInfo, errorId);

    // Auto-retry logic
    if (this.props.autoRetry && this.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry();
    }
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo, errorId: string): void => {
    // Call custom error reporting service if provided
    if (this.props.errorReportingService) {
      try {
        this.props.errorReportingService(error, errorInfo, errorId);
      } catch (reportingError) {
        console.error('Error reporting service failed:', reportingError);
      }
    }

    // Call the onError callback if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo, errorId);
      } catch (callbackError) {
        console.error('Error callback failed:', callbackError);
      }
    }

    // Enhanced logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 ErrorBoundary caught an error');
      console.error('Error ID:', errorId);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Retry Count:', this.retryCount);
      console.groupEnd();
    }

    // Production error logging (can be sent to external services)
    if (process.env.NODE_ENV === 'production') {
      // In production, you might want to send this to an error tracking service
      // like Sentry, LogRocket, or your own error reporting endpoint
      console.error('Production Error:', {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      });
    }
  };

  private scheduleRetry = (): void => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.retryTimeoutId = setTimeout(() => {
      this.retryCount++;
      this.resetError();
    }, Math.min(1000 * Math.pow(2, this.retryCount), 10000)); // Exponential backoff, max 10s
  };

  resetError = (): void => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined, 
      errorId: undefined 
    });

    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = undefined;
    }

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  override componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  override render(): React.ReactNode {
    if (this.state.hasError && this.state.error && this.state.errorInfo && this.state.errorId) {
      const FallbackComponent = this.props.fallback || DefaultFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          resetError={this.resetError}
          retryCount={this.retryCount}
          maxRetries={this.props.maxRetries || 3}
          userMessage={this.props.userMessage}
          showTechnicalDetails={this.props.showTechnicalDetails}
        />
      );
    }

    return this.props.children;
  }
}

// Utility hook for error boundary context
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

// Higher-order component for easier error boundary usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProperties, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Error reporting utilities
export const createErrorReporter = (endpoint: string) => {
  return async (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    try {
      await globalThis.fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };
};

// Export types for external use
export type ErrorBoundaryComponent = typeof ErrorBoundary;
export type ErrorBoundaryFallbackComponent = React.ComponentType<ErrorBoundaryFallbackProperties>;

/**
 * Error Boundary Component - Enterprise Production Ready
 *
 * React Error Boundary for catching JavaScript errors anywhere in the child component tree,
 * logging those errors, and displaying a fallback UI instead of the component tree that crashed.
 */

import * as React from 'react';

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
}

export interface ErrorBoundaryFallbackProperties {
  error: Error;
  errorInfo: React.ErrorInfo;
  errorId: string;
  resetError: () => void;
}

const generateErrorId = (): string => {
  return `error-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

const DefaultFallback: React.FC<ErrorBoundaryFallbackProperties> = ({
  error,
  errorInfo,
  errorId,
  resetError,
}) => (
  <div className="bg-semantic-background flex min-h-screen items-center justify-center">
    <div className="bg-semantic-surface shadow-elev-2 w-full max-w-md rounded-lg p-6">
      <div className="mb-4 flex items-center">
        <div className="flex-shrink-0">
          <svg
            className="text-semantic-destructive h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-semantic-foreground text-lg font-medium">Something went wrong</h3>
          <p className="text-semantic-muted-foreground text-sm">Error ID: {errorId}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-semantic-foreground mb-2 text-sm">
          We're sorry, but something unexpected happened. Please try refreshing the page.
        </p>
        <details className="text-semantic-muted-foreground text-xs">
          <summary className="cursor-pointer font-medium">Technical Details</summary>
          <div className="bg-semantic-muted mt-2 rounded p-2">
            <p>
              <strong>Error:</strong> {error.message}
            </p>
            <p>
              <strong>Stack:</strong>
            </p>
            <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>
            <p>
              <strong>Component Stack:</strong>
            </p>
            <pre className="whitespace-pre-wrap text-xs">{errorInfo.componentStack}</pre>
          </div>
        </details>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={resetError}
          className="bg-semantic-primary text-semantic-primary-foreground hover:bg-semantic-primary/90 focus:ring-semantic-primary flex-1 rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="bg-semantic-secondary text-semantic-secondary-foreground hover:bg-semantic-secondary/90 focus:ring-semantic-secondary flex-1 rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
);

export class ErrorBoundary extends React.Component<ErrorBoundaryProperties, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProperties) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
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

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', {
        errorId,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  override render(): React.ReactNode {
    if (this.state.hasError && this.state.error && this.state.errorInfo && this.state.errorId) {
      const FallbackComponent = this.props.fallback || DefaultFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Export types for external use
export type ErrorBoundaryComponent = typeof ErrorBoundary;
export type ErrorBoundaryFallbackComponent = React.ComponentType<ErrorBoundaryFallbackProperties>;

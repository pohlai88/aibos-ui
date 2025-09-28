/**
 * TypeScript Definitions - Enterprise Production Ready
 *
 * Comprehensive type system for the AIBOS UI package.
 * Provides safe alternatives to `any` while allowing necessary unsafe operations
 * for React rendering and third-party library integrations.
 */

import type * as React from 'react';

// ============================================================================
// UNSAFE ANY TYPES - For React Rendering and Third-Party Integrations
// ============================================================================

/**
 * UnsafeAny - Centralized alias for intentional `any` usage
 *
 * This type is used ONLY for complex third-party library integrations
 * where TypeScript's type system cannot properly infer the correct types.
 *
 * Current usage:
 * - TanStack Table cell rendering (complex generic inference)
 * - React Hook Form + Zod integration
 * - Performance optimization scenarios
 * - Third-party library type mismatches
 *
 * Guidelines:
 * - Use sparingly and document the reason
 * - Prefer proper typing when possible
 * - Keep usage minimal and well-documented
 * - Always add comments explaining why UnsafeAny is necessary
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for React rendering and third-party integrations
export type UnsafeAny = any;

/**
 * UnsafeAnyArray - For arrays that need to be treated as any[]
 * Used in scenarios where we need to iterate over unknown data structures
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for React rendering and third-party integrations
export type UnsafeAnyArray = any[];

/**
 * UnsafeAnyObject - For objects that need to be treated as any
 * Used in scenarios where we need to access unknown object properties
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for React rendering and third-party integrations
export type UnsafeAnyObject = Record<string, any>;

// ============================================================================
// REACT-SPECIFIC TYPES
// ============================================================================

/**
 * ReactNode - Safe React node type
 * Used for all React children and rendering scenarios
 */
export type ReactNode = React.ReactNode;

/**
 * ReactElement - Safe React element type
 * Used for component return types
 */
export type ReactElement = React.ReactElement;

/**
 * ReactRef - Generic React ref type
 * Used for component refs
 */
export type ReactRef<T = HTMLElement> = React.Ref<T>;

/**
 * ReactEventHandler - Generic React event handler
 * Used for event handling
 */
export type ReactEventHandler<T = HTMLElement> = React.EventHandler<React.SyntheticEvent<T>>;

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * ComponentProps - Generic component props
 * Used as base for all component prop types
 */
export type ComponentProps<T extends React.ElementType = 'div'> = React.ComponentProps<T>;

/**
 * ComponentPropsWithoutRef - Component props without ref
 * Used for forwardRef components
 */
export type ComponentPropsWithoutRef<T extends React.ElementType = 'div'> =
  React.ComponentPropsWithoutRef<T>;

/**
 * ComponentRef - Component ref type
 * Used for component reference types
 */
export type ComponentRef<T extends React.ElementType = 'div'> = React.ComponentRef<T>;

// ============================================================================
// FORM AND DATA TYPES
// ============================================================================

/**
 * FormData - Generic form data type
 * Used for form state management
 */
export type FormData<T = Record<string, unknown>> = T;

/**
 * FormErrors - Form validation errors
 * Used for form error handling
 */
export type FormErrors<T = Record<string, unknown>> = Partial<Record<keyof T, string>>;

/**
 * FormState - Form state management
 * Used for form state tracking
 */
export type FormState<T = Record<string, unknown>> = {
  data: T;
  errors: FormErrors<T>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
};

// ============================================================================
// TABLE AND DATA GRID TYPES
// ============================================================================

/**
 * TableRow - Generic table row type
 * Used for table data structures
 */
export type TableRow<T = Record<string, unknown>> = T;

/**
 * TableColumn - Generic table column type
 * Used for table column definitions
 */
export type TableColumn<T = Record<string, unknown>> = {
  key: keyof T;
  title: string;
  width?: number;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
};

/**
 * TableData - Generic table data type
 * Used for table data arrays
 */
export type TableData<T = Record<string, unknown>> = T[];

// ============================================================================
// STYLING AND VARIANT TYPES
// ============================================================================

/**
 * ClassNames - Class name type
 * Used for className props
 */
export type ClassNames = string | string[] | Record<string, boolean> | undefined;

/**
 * StyleProps - Style properties
 * Used for inline styles
 */
export type StyleProps = React.CSSProperties;

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Optional - Make all properties optional
 * Used for partial updates
 */
export type Optional<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Required - Make all properties required
 * Used for strict prop validation
 */
export type Required<T> = {
  [P in keyof T]-?: T[P];
};

/**
 * Partial - Make all properties partial
 * Used for optional configurations
 */
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Pick - Pick specific properties
 * Used for selective prop extraction
 */
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * Omit - Omit specific properties
 * Used for prop exclusion
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// ============================================================================
// ASYNC AND PROMISE TYPES
// ============================================================================

/**
 * AsyncFunction - Generic async function type
 * Used for async operations
 */
export type AsyncFunction<T = unknown, R = unknown> = (argument: T) => Promise<R>;

/**
 * PromiseResult - Promise result type
 * Used for promise handling
 */
export type PromiseResult<T> = Promise<T>;

/**
 * AsyncState - Async operation state
 * Used for async state management
 */
export type AsyncState<T = unknown> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * EventHandler - Generic event handler
 * Used for event handling
 */
export type EventHandler<T = Event> = (event: T) => void;

/**
 * ChangeHandler - Change event handler
 * Used for input change events
 */
export type ChangeHandler<T = HTMLInputElement> = (event: React.ChangeEvent<T>) => void;

/**
 * ClickHandler - Click event handler
 * Used for click events
 */
export type ClickHandler<T = HTMLElement> = (event: React.MouseEvent<T>) => void;

/**
 * KeyboardHandler - Keyboard event handler
 * Used for keyboard events
 */
export type KeyboardHandler<T = HTMLElement> = (event: React.KeyboardEvent<T>) => void;

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * ValidationRule - Generic validation rule
 * Used for form validation
 */
export type ValidationRule<T = unknown> = (value: T) => boolean | string;

/**
 * ValidationSchema - Validation schema
 * Used for complex validation
 */
export type ValidationSchema<T = Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

// ============================================================================
// PERFORMANCE TYPES
// ============================================================================

/**
 * PerformanceMode - Performance mode type
 * Used for performance optimization
 */
export type PerformanceMode = 'development' | 'production' | 'test';

// ============================================================================
// ACCESSIBILITY TYPES
// ============================================================================

/**
 * AriaProps - ARIA properties
 * Used for accessibility
 */
export type AriaProps = {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-disabled'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-details'?: string;
  'aria-errormessage'?: string;
  'aria-flowto'?: string;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-keyshortcuts'?: string;
  'aria-modal'?: boolean;
  'aria-multiline'?: boolean;
  'aria-multiselectable'?: boolean;
  'aria-orientation'?: 'horizontal' | 'vertical';
  'aria-placeholder'?: string;
  'aria-posinset'?: number;
  'aria-pressed'?: boolean | 'mixed';
  'aria-readonly'?: boolean;
  'aria-relevant'?: 'additions' | 'removals' | 'text' | 'all';
  'aria-required'?: boolean;
  'aria-roledescription'?: string;
  'aria-rowcount'?: number;
  'aria-rowindex'?: number;
  'aria-rowspan'?: number;
  'aria-setsize'?: number;
  'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
  'aria-valuemax'?: number;
  'aria-valuemin'?: number;
  'aria-valuenow'?: number;
  'aria-valuetext'?: string;
};

// ============================================================================
// THEME TYPES
// ============================================================================

// Note: ThemeMode and ThemeConfig are exported from hooks/use-theme.tsx
// to avoid conflicts with hook-specific implementations

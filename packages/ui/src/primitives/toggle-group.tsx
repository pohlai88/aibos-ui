/**
 * Toggle Group Component - Enterprise Production Ready
 *
 * Toggle Group component with semantic tokens, comprehensive accessibility features,
 * and support for single and multiple selection variants.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';

const toggleGroupVariants = cva(
  'inline-flex items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: '',
        outline: 'border-semantic-input border',
        ghost: '',
      },
      size: {
        default: 'h-10',
        sm: 'h-9',
        lg: 'h-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const toggleGroupItemVariants = cva(
  'ring-offset-semantic-background focus-visible:ring-semantic-ring data-[state=on]:bg-semantic-primary data-[state=on]:text-semantic-primary-foreground hover:bg-semantic-muted hover:text-semantic-muted-foreground inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-semantic-background',
        outline: 'border-semantic-input bg-semantic-background hover:bg-semantic-accent hover:text-semantic-accent-foreground border',
        ghost: 'hover:bg-semantic-accent hover:text-semantic-accent-foreground',
      },
      size: {
        default: 'h-10 px-3',
        sm: 'h-9 px-2.5',
        lg: 'h-11 px-5',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ToggleGroupSingleProperties
  extends VariantProps<typeof toggleGroupVariants> {
  /**
   * Type of selection behavior
   */
  type?: 'single';
  /**
   * Current value
   */
  value?: string;
  /**
   * Default value
   */
  defaultValue?: string;
  /**
   * Callback when value changes
   */
  onValueChange?: (value: string) => void;
  /**
   * Whether the toggle group is disabled
   */
  disabled?: boolean;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Children content
   */
  children?: React.ReactNode;
}

export interface ToggleGroupMultipleProperties
  extends VariantProps<typeof toggleGroupVariants> {
  /**
   * Type of selection behavior
   */
  type: 'multiple';
  /**
   * Current values
   */
  value?: string[];
  /**
   * Default values
   */
  defaultValue?: string[];
  /**
   * Callback when value changes
   */
  onValueChange?: (value: string[]) => void;
  /**
   * Whether the toggle group is disabled
   */
  disabled?: boolean;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Children content
   */
  children?: React.ReactNode;
}

export type ToggleGroupProperties = ToggleGroupSingleProperties | ToggleGroupMultipleProperties;

export interface ToggleGroupItemProperties
  extends VariantProps<typeof toggleGroupItemVariants> {
  /**
   * Value of the toggle item
   */
  value: string;
  /**
   * Whether the toggle item is disabled
   */
  disabled?: boolean;
  /**
   * ARIA label for accessibility
   */
  'aria-label'?: string;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Children content
   */
  children?: React.ReactNode;
}

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProperties
>(({ className, variant, size, type = 'single', ...props }, reference) => {
  if (isPerfMode()) {
    // Performance mode: minimal DOM, static classes
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={cn('toggle-group perf-static', className)}
        {...varianceAttributes()}
        {...props}
      />
    );
  }

  // Handle different prop types based on selection mode
  if (type === 'single' || type === undefined) {
    const singleProps = props as ToggleGroupSingleProperties;
    return (
      <ToggleGroupPrimitive.Root
        ref={reference}
        type="single"
        className={cn(toggleGroupVariants({ variant, size }), className)}
        value={singleProps.value}
        defaultValue={singleProps.defaultValue}
        onValueChange={singleProps.onValueChange}
        disabled={singleProps.disabled}
        {...(singleProps as Record<string, unknown>)}
      >
        {singleProps.children}
      </ToggleGroupPrimitive.Root>
    );
  } else {
    const multipleProps = props as ToggleGroupMultipleProperties;
    return (
      <ToggleGroupPrimitive.Root
        ref={reference}
        type="multiple"
        className={cn(toggleGroupVariants({ variant, size }), className)}
        value={multipleProps.value}
        defaultValue={multipleProps.defaultValue}
        onValueChange={multipleProps.onValueChange}
        disabled={multipleProps.disabled}
        {...(multipleProps as Record<string, unknown>)}
      >
        {multipleProps.children}
      </ToggleGroupPrimitive.Root>
    );
  }
});
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProperties
>(({ className, variant, size, ...props }, reference) => {
  if (isPerfMode()) {
    // Performance mode: minimal DOM, static classes
    return (
      <button
        ref={reference as React.Ref<HTMLButtonElement>}
        type="button"
        className={cn('toggle-group-item perf-static', className)}
        {...varianceAttributes()}
        {...props}
      >
        {props.children}
      </button>
    );
  }

  return (
    <ToggleGroupPrimitive.Item
      ref={reference}
      className={cn(toggleGroupItemVariants({ variant, size }), className)}
      {...props}
    />
  );
});
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem, toggleGroupVariants, toggleGroupItemVariants };
export type ToggleGroupReference = React.ElementRef<typeof ToggleGroup>;
export type ToggleGroupItemReference = React.ElementRef<typeof ToggleGroupItem>;
export type ToggleGroupElement = React.ElementType;
export type ToggleGroupItemElement = React.ElementType;

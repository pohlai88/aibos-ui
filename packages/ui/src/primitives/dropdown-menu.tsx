/**
 * Dropdown Menu Component - Enterprise Production Ready
 *
 * Dropdown menu component with semantic tokens, CVA variants,
 * and comprehensive accessibility features for enhanced dropdown menus.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { ChevronDownIcon, CheckIcon } from '../icons';

const dropdownMenuVariants = cva(
  'bg-semantic-background text-semantic-foreground border-semantic-border min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const dropdownMenuTriggerVariants = cva(
  'bg-semantic-background text-semantic-foreground border-semantic-border ring-offset-semantic-background focus:ring-semantic-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 text-xs',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
      },
      variant: {
        default: 'bg-semantic-background',
        ghost: 'hover:bg-semantic-accent hover:text-semantic-accent-foreground bg-transparent',
        outline: 'border-semantic-border bg-transparent',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
);

const dropdownMenuItemVariants = cva(
  'text-semantic-foreground focus:bg-semantic-accent focus:text-semantic-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  {
    variants: {
      size: {
        sm: 'px-1.5 py-1 text-xs',
        md: 'px-2 py-1.5 text-sm',
        lg: 'px-3 py-2 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const dropdownMenuSeparatorVariants = cva(
  'bg-semantic-border -mx-1 my-1 h-px',
  {
    variants: {
      size: {
        sm: '-mx-0.5',
        md: '-mx-1',
        lg: '-mx-1.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const dropdownMenuLabelVariants = cva(
  'text-semantic-muted-foreground px-2 py-1.5 text-sm font-semibold',
  {
    variants: {
      size: {
        sm: 'px-1.5 py-1 text-xs',
        md: 'px-2 py-1.5 text-sm',
        lg: 'px-3 py-2 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const dropdownMenuSubTriggerVariants = cva(
  'text-semantic-foreground focus:bg-semantic-accent focus:text-semantic-accent-foreground data-[state=open]:bg-semantic-accent data-[state=open]:text-semantic-accent-foreground flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
  {
    variants: {
      size: {
        sm: 'px-1.5 py-1 text-xs',
        md: 'px-2 py-1.5 text-sm',
        lg: 'px-3 py-2 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface DropdownMenuProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dropdownMenuVariants> {
  children: React.ReactNode;
}

export interface DropdownMenuTriggerProperties
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof dropdownMenuTriggerVariants> {
  children: React.ReactNode;
  asChild?: boolean;
}

export interface DropdownMenuContentProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dropdownMenuVariants> {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  alignOffset?: number;
}

export interface DropdownMenuItemProperties
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'>,
    VariantProps<typeof dropdownMenuItemVariants> {
  children: React.ReactNode;
  disabled?: boolean;
  onSelect?: (event: Event) => void;
}

export interface DropdownMenuSeparatorProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dropdownMenuSeparatorVariants> {}

export interface DropdownMenuLabelProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dropdownMenuLabelVariants> {
  children: React.ReactNode;
}

export interface DropdownMenuSubTriggerProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dropdownMenuSubTriggerVariants> {
  children: React.ReactNode;
  disabled?: boolean;
}

export interface DropdownMenuSubContentProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dropdownMenuVariants> {
  children: React.ReactNode;
}

const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProperties>(
  ({ className, size = 'md', children, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('dropdown-menu perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={reference}
        className={cn(dropdownMenuVariants({ size }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DropdownMenu.displayName = 'DropdownMenu';

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProperties>(
  ({ className, size = 'md', variant = 'default', children, asChild: _asChild = false, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <button
          ref={reference}
          className={cn('dropdown-menu-trigger perf-static', className)}
          aria-haspopup="menu"
          {...varianceAttributes()}
          {...props}
        >
          {children}
          <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
        </button>
      );
    }

    return (
      <button
        ref={reference}
        className={cn(dropdownMenuTriggerVariants({ size, variant }), className)}
        aria-haspopup="menu"
        {...props}
      >
        {children}
        <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
      </button>
    );
  }
);

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProperties>(
  ({ 
    className, 
    size = 'md', 
    align = 'center', 
    side = 'bottom', 
    sideOffset = 4,
    alignOffset = 0,
    children, 
    ...props 
  }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('dropdown-menu-content perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={reference}
        className={cn(dropdownMenuVariants({ size }), className)}
        data-side={side}
        data-align={align}
        data-side-offset={sideOffset}
        data-align-offset={alignOffset}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProperties>(
  ({ className, size = 'md', disabled = false, onSelect, children, ...props }, reference) => {
    const handleClick = React.useCallback((e: React.MouseEvent) => {
      if (!disabled && onSelect) {
        onSelect(e.nativeEvent);
      }
    }, [disabled, onSelect]);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!disabled && onSelect) {
          onSelect(e.nativeEvent);
        }
      }
    }, [disabled, onSelect]);

    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('dropdown-menu-item perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={reference}
        className={cn(dropdownMenuItemVariants({ size }), className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        data-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        role="menuitem"
        {...props}
      >
        {children}
      </div>
    );
  }
);

DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, DropdownMenuSeparatorProperties>(
  ({ className, size = 'md', ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('dropdown-menu-separator perf-static', className)}
          {...varianceAttributes()}
          {...props}
        />
      );
    }

    return (
      <div
        ref={reference}
        className={cn(dropdownMenuSeparatorVariants({ size }), className)}
        role="separator"
        {...props}
      />
    );
  }
);

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelProperties>(
  ({ className, size = 'md', children, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('dropdown-menu-label perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={reference}
        className={cn(dropdownMenuLabelVariants({ size }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuSubTrigger = React.forwardRef<HTMLDivElement, DropdownMenuSubTriggerProperties>(
  ({ className, size = 'md', disabled = false, children, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('dropdown-menu-sub-trigger perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          {children}
          <ChevronDownIcon className="ml-auto h-4 w-4" />
        </div>
      );
    }

    return (
      <div
        ref={reference}
        className={cn(dropdownMenuSubTriggerVariants({ size }), className)}
        data-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        role="menuitem"
        {...props}
      >
        {children}
        <ChevronDownIcon className="ml-auto h-4 w-4" />
      </div>
    );
  }
);

DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

const DropdownMenuSubContent = React.forwardRef<HTMLDivElement, DropdownMenuSubContentProperties>(
  ({ className, size = 'md', children, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('dropdown-menu-sub-content perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={reference}
        className={cn(dropdownMenuVariants({ size }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

// Checkbox item variant
const DropdownMenuCheckboxItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProperties>(
  ({ className, size = 'md', disabled = false, onSelect, children, ...props }, reference) => {
    const [checked, setChecked] = React.useState(false);

    const handleClick = React.useCallback((e: React.MouseEvent) => {
      if (!disabled) {
        setChecked(!checked);
        if (onSelect) {
          onSelect(e.nativeEvent);
        }
      }
    }, [disabled, checked, onSelect]);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!disabled) {
          setChecked(!checked);
          if (onSelect) {
            onSelect(e.nativeEvent);
          }
        }
      }
    }, [disabled, checked, onSelect]);

    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('dropdown-menu-checkbox-item perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          <CheckIcon className="mr-2 h-4 w-4" />
          {children}
        </div>
      );
    }

    return (
      <div
        ref={reference}
        className={cn(dropdownMenuItemVariants({ size }), className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        data-disabled={disabled}
        data-checked={checked}
        tabIndex={disabled ? -1 : 0}
        role="menuitemcheckbox"
        aria-checked={checked}
        {...props}
      >
        <CheckIcon className={cn('mr-2 h-4 w-4', !checked && 'opacity-0')} />
        {children}
      </div>
    );
  }
);

DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

export { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuLabel, 
  DropdownMenuSubTrigger, 
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  dropdownMenuVariants,
  dropdownMenuTriggerVariants,
  dropdownMenuItemVariants,
  dropdownMenuSeparatorVariants,
  dropdownMenuLabelVariants,
  dropdownMenuSubTriggerVariants,
};

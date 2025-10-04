/**
 * Combobox Component - Enterprise Production Ready
 *
 * Combobox component with semantic tokens, CVA variants,
 * and comprehensive accessibility features.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const comboboxVariants = cva(
  'relative flex w-full flex-col',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const comboboxTriggerVariants = cva(
  'border-semantic-border bg-semantic-background ring-offset-semantic-background placeholder:text-semantic-muted-foreground focus:ring-semantic-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 text-xs',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const comboboxContentVariants = cva(
  'bg-semantic-popover text-semantic-popover-foreground shadow-elev-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border',
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

const comboboxItemVariants = cva(
  'focus:bg-semantic-accent focus:text-semantic-accent-foreground relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  {
    variants: {
      size: {
        sm: 'py-1 pl-6 pr-2 text-xs',
        md: 'py-1.5 pl-8 pr-2 text-sm',
        lg: 'py-2 pl-8 pr-2 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface ComboboxProperties
  extends VariantProps<typeof comboboxVariants> {
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
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Whether the combobox is disabled
   */
  disabled?: boolean;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Children content (ComboboxItem components)
   */
  children?: React.ReactNode;
  /**
   * Whether to show search icon
   */
  showSearchIcon?: boolean;
  /**
   * Whether to show clear button
   */
  showClearButton?: boolean;
}

export interface ComboboxItemProperties
  extends VariantProps<typeof comboboxItemVariants> {
  /**
   * Value of the combobox item
   */
  value: string;
  /**
   * Whether the combobox item is disabled
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

const Combobox = React.forwardRef<
  HTMLDivElement,
  ComboboxProperties
>(({ 
  className, 
  size = 'md', 
  value, 
  defaultValue, 
  onValueChange, 
  placeholder = 'Search...', 
  disabled = false,
  showSearchIcon = true,
  showClearButton = true,
  children, 
  ...props 
}, reference) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState(value || defaultValue || '');
  const [selectedValue, setSelectedValue] = React.useState(value || defaultValue || '');
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Handle value changes
  const handleValueChange = React.useCallback((newValue: string) => {
    setSelectedValue(newValue);
    setSearchValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  }, [onValueChange]);

  // Handle clear
  const handleClear = React.useCallback(() => {
    setSelectedValue('');
    setSearchValue('');
    onValueChange?.('');
  }, [onValueChange]);

  // Handle search input change
  const handleSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    setIsOpen(true);
  }, []);

  // Handle trigger click
  const handleTriggerClick = React.useCallback(() => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  }, [disabled, isOpen]);

  // Handle key down
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  }, [isOpen]);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (isPerfMode()) {
    // Performance mode: minimal DOM, static classes
    return (
      <div
        ref={reference}
        className={cn('combobox perf-static', className)}
        {...varianceAttributes()}
        {...props}
      >
        <div className="combobox-trigger perf-static">
          <input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            readOnly
            className="combobox-input perf-static"
          />
        </div>
        <div className="combobox-content perf-static">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={reference}
      className={cn(comboboxVariants({ size }), className)}
      {...props}
    >
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(comboboxTriggerVariants({ size }))}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? 'combobox-content' : undefined}
        role="combobox"
      >
        <div className="flex flex-1 items-center gap-2">
          {showSearchIcon && <Search className="text-semantic-muted-foreground h-4 w-4" />}
          <input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={handleSearchChange}
            className="text-semantic-foreground placeholder:text-semantic-muted-foreground flex-1 border-none bg-transparent outline-none"
            disabled={disabled}
          />
        </div>
        <div className="flex items-center gap-1">
          {showClearButton && selectedValue && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-semantic-muted-foreground hover:text-semantic-foreground h-4 w-4"
              aria-label="Clear"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ChevronDown className={cn(
            "text-semantic-muted-foreground h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )} />
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div
          ref={contentRef}
          id="combobox-content"
          className={cn(comboboxContentVariants({ size }))}
          role="listbox"
        >
          <div className="p-1">
            {React.Children.map(children, (child) => {
              if (React.isValidElement<ComboboxItemProperties>(child)) {
                return React.cloneElement(child, {
                  ...child.props,
                  size,
                  onSelect: () => handleValueChange(child.props.value),
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
});

Combobox.displayName = 'Combobox';

const ComboboxItem = React.forwardRef<
  HTMLDivElement,
  ComboboxItemProperties & { onSelect?: () => void }
>(({ className, size = 'md', value, disabled = false, children, onSelect, ...props }, reference) => {
  const handleClick = React.useCallback(() => {
    if (!disabled) {
      onSelect?.();
    }
  }, [disabled, onSelect]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  if (isPerfMode()) {
    // Performance mode: minimal DOM, static classes
    return (
      <div
        ref={reference}
        className={cn('combobox-item perf-static', className)}
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
      className={cn(comboboxItemVariants({ size }), className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="option"
      aria-selected="false"
      tabIndex={disabled ? -1 : 0}
      data-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  );
});

ComboboxItem.displayName = 'ComboboxItem';

export { Combobox, ComboboxItem, comboboxVariants, comboboxTriggerVariants, comboboxContentVariants, comboboxItemVariants };
export type ComboboxReference = React.ElementRef<typeof Combobox>;
export type ComboboxItemReference = React.ElementRef<typeof ComboboxItem>;
export type ComboboxElement = React.ElementType;
export type ComboboxItemElement = React.ElementType;

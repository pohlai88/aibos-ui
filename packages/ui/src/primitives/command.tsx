/**
 * Command Component - Enterprise Production Ready
 *
 * Command palette component with semantic tokens, CVA variants,
 * and comprehensive accessibility features for keyboard-driven navigation.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Search, Command as CommandIcon } from 'lucide-react';

const commandVariants = cva(
  'bg-semantic-background text-semantic-foreground flex h-full w-full flex-col overflow-hidden rounded-md',
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

const commandInputVariants = cva(
  'border-semantic-border bg-semantic-background ring-offset-semantic-background placeholder:text-semantic-muted-foreground focus:ring-semantic-ring flex h-11 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-9 text-xs',
        md: 'h-11 text-sm',
        lg: 'h-12 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const commandListVariants = cva(
  'max-h-[300px] overflow-y-auto overflow-x-hidden',
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

const commandItemVariants = cva(
  'text-semantic-foreground aria-selected:bg-semantic-accent aria-selected:text-semantic-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
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

const commandGroupVariants = cva(
  'text-semantic-muted-foreground px-2 py-1.5 text-xs font-medium',
  {
    variants: {
      size: {
        sm: 'px-1.5 py-1 text-xs',
        md: 'px-2 py-1.5 text-xs',
        lg: 'px-3 py-2 text-sm',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const commandSeparatorVariants = cva(
  'bg-semantic-border -mx-1 h-px',
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

export interface CommandProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof commandVariants> {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showSearchIcon?: boolean;
  showCommandIcon?: boolean;
}

export interface CommandInputProperties
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof commandInputVariants> {
  placeholder?: string;
  disabled?: boolean;
  showSearchIcon?: boolean;
  showCommandIcon?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export interface CommandListProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof commandListVariants> {}

export interface CommandItemProperties
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'>,
    VariantProps<typeof commandItemVariants> {
  value: string;
  disabled?: boolean;
  onSelect?: (value: string) => void;
}

export interface CommandGroupProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof commandGroupVariants> {
  heading?: string;
}

export interface CommandSeparatorProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof commandSeparatorVariants> {}

const Command = React.forwardRef<HTMLDivElement, CommandProperties>(
  ({ 
    className, 
    size = 'md', 
    value, 
    onValueChange, 
    placeholder = 'Type a command or search...', 
    disabled = false,
    showSearchIcon = true,
    showCommandIcon = true,
    children, 
    ...props 
  }, reference) => {
    const [searchValue, setSearchValue] = React.useState('');
    const [_selectedValue, setSelectedValue] = React.useState(value || '');
    const inputRef = React.useRef<HTMLInputElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);

    // Handle search input change
    const handleSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchValue(newValue);
    }, []);

    // Handle item selection
    const handleItemSelect = React.useCallback((itemValue: string) => {
      setSelectedValue(itemValue);
      onValueChange?.(itemValue);
    }, [onValueChange]);

    // Handle key down for navigation
    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchValue('');
        inputRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Focus first item
        const firstItem = listRef.current?.querySelector('[role="option"]') as HTMLElement;
        firstItem?.focus();
      }
    }, []);

    // Focus input on mount
    React.useEffect(() => {
      if (!disabled) {
        inputRef.current?.focus();
      }
    }, [disabled]);

    if (isPerfMode()) {
      // Performance mode: minimal DOM, static classes
      return (
        <div
          ref={reference}
          className={cn('command perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          <div className="command-input-wrapper perf-static">
            {showCommandIcon && <CommandIcon className="command-icon perf-static" />}
            {showSearchIcon && <Search className="search-icon perf-static" />}
            <input
              ref={inputRef}
              className="command-input perf-static"
              placeholder={placeholder}
              disabled={disabled}
              {...varianceAttributes()}
            />
          </div>
          <div ref={listRef} className="command-list perf-static">
            {children}
          </div>
        </div>
      );
    }

    return (
        <div
          ref={reference}
          className={cn(commandVariants({ size }), className)}
          role="application"
          {...props}
        >
        {/* Input */}
        <div className="flex items-center border-b px-3">
          {showCommandIcon && (
            <CommandIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          )}
          {showSearchIcon && (
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          )}
          <input
            ref={inputRef}
            className={cn(commandInputVariants({ size }), 'border-0 px-0 py-0 shadow-none focus-visible:ring-0')}
            placeholder={placeholder}
            value={searchValue}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
        </div>

        {/* List */}
        <div ref={listRef} className={cn(commandListVariants({ size }))}>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === CommandList) {
              // If it's a CommandList, recursively process its children
              const childProps = child.props as Record<string, unknown>;
              return React.cloneElement(child, {
                ...childProps,
                children: React.Children.map(childProps.children as React.ReactNode, (grandChild) => {
                  if (React.isValidElement(grandChild)) {
                    const grandChildProps = grandChild.props as Record<string, unknown>;
                    if (grandChildProps.value !== undefined) {
                      return React.cloneElement(grandChild, {
                        ...grandChildProps,
                        size,
                        onSelect: handleItemSelect,
                      } as React.ReactElement);
                    }
                  }
                  return grandChild;
                }),
              });
            } else if (React.isValidElement(child)) {
              const childProps = child.props as Record<string, unknown>;
              if (childProps.value !== undefined) {
                // Direct CommandItem
                return React.cloneElement(child, {
                  ...childProps,
                  size,
                  onSelect: handleItemSelect,
                } as React.ReactElement);
              }
            }
            return child;
          })}
        </div>
      </div>
    );
  }
);

Command.displayName = 'Command';

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProperties>(
  ({ className, size = 'md', placeholder, disabled = false, showSearchIcon = true, showCommandIcon = true, onKeyDown, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div className="command-input-wrapper perf-static">
          {showCommandIcon && <CommandIcon className="command-icon perf-static" />}
          {showSearchIcon && <Search className="search-icon perf-static" />}
          <input
            ref={reference}
            className={cn('command-input perf-static', className)}
            placeholder={placeholder}
            disabled={disabled}
            {...varianceAttributes()}
            {...props}
          />
        </div>
      );
    }

    return (
      <div className="flex items-center border-b px-3">
        {showCommandIcon && (
          <CommandIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        )}
        {showSearchIcon && (
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        )}
        <input
          ref={reference}
          className={cn(commandInputVariants({ size }), 'border-0 px-0 py-0 shadow-none focus-visible:ring-0', className)}
          placeholder={placeholder}
          disabled={disabled}
          onKeyDown={onKeyDown}
          {...props}
        />
      </div>
    );
  }
);

CommandInput.displayName = 'CommandInput';

const CommandList = React.forwardRef<HTMLDivElement, CommandListProperties>(
  ({ className, size = 'md', ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('command-list perf-static', className)}
          {...varianceAttributes()}
          {...props}
        />
      );
    }

    return (
      <div
        ref={reference}
        className={cn(commandListVariants({ size }), className)}
        {...props}
      />
    );
  }
);

CommandList.displayName = 'CommandList';

const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProperties>(
  ({ className, size = 'md', value, disabled = false, onSelect, children, ...props }, reference) => {
    const handleClick = React.useCallback(() => {
      if (!disabled) {
        onSelect?.(value);
      }
    }, [disabled, onSelect, value]);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    }, [handleClick]);

    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('command-item perf-static', className)}
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
        className={cn(commandItemVariants({ size }), className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="option"
        aria-selected="false"
        tabIndex={disabled ? -1 : 0}
        data-disabled={disabled}
        data-value={value}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CommandItem.displayName = 'CommandItem';

const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProperties>(
  ({ className, size = 'md', heading, children, ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('command-group perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          {heading && <div className="command-group-heading perf-static">{heading}</div>}
          {children}
        </div>
      );
    }

    return (
      <div
        ref={reference}
        className={cn(commandGroupVariants({ size }), className)}
        {...props}
      >
        {heading && <div className="command-group-heading">{heading}</div>}
        {children}
      </div>
    );
  }
);

CommandGroup.displayName = 'CommandGroup';

const CommandSeparator = React.forwardRef<HTMLDivElement, CommandSeparatorProperties>(
  ({ className, size = 'md', ...props }, reference) => {
    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('command-separator perf-static', className)}
          {...varianceAttributes()}
          {...props}
        />
      );
    }

    return (
      <div
        ref={reference}
        className={cn(commandSeparatorVariants({ size }), className)}
        role="separator"
        {...props}
      />
    );
  }
);

CommandSeparator.displayName = 'CommandSeparator';

export { 
  Command, 
  CommandInput, 
  CommandList, 
  CommandItem, 
  CommandGroup, 
  CommandSeparator,
  commandVariants,
  commandInputVariants,
  commandListVariants,
  commandItemVariants,
  commandGroupVariants,
  commandSeparatorVariants,
};

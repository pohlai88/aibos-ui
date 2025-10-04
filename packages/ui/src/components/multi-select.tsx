/**
 * Multi-select Component - Enterprise Production Ready
 *
 * Advanced multi-selection component with search, filtering, grouping,
 * keyboard navigation, and comprehensive accessibility features.
 * Built for enterprise use cases with complex selection patterns.
 */

import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { Badge } from '../primitives/badge';
import { Checkbox } from '../primitives/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { ScrollArea } from '../primitives/scroll-area';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import type { UnsafeAny } from '../types';
import * as React from 'react';
import {
  ChevronDownIcon,
  CloseIcon,
  SearchIcon,
  CheckIcon,
} from '../icons';

const multiSelectVariants = cva('relative', {
  variants: {
    variant: {
      default: '',
      outline: 'border border-semantic-border rounded-md',
      ghost: 'bg-transparent',
    },
    size: {
      sm: 'h-8',
      md: 'h-10',
      lg: 'h-12',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const multiSelectTriggerVariants = cva(
  'flex items-center justify-between w-full px-3 py-2 text-sm bg-semantic-background border border-semantic-input rounded-md focus:outline-none focus:ring-2 focus:ring-semantic-ring focus:border-semantic-ring disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-2 py-1 text-xs',
        md: 'h-10 px-3 py-2 text-sm',
        lg: 'h-12 px-4 py-3 text-base',
      },
      variant: {
        default: '',
        outline: 'border-semantic-border',
        ghost: 'border-transparent bg-transparent',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
);

const multiSelectContentVariants = cva(
  'z-50 min-w-[8rem] overflow-hidden rounded-md border border-semantic-border bg-semantic-popover p-1 text-semantic-popover-foreground shadow-md',
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

const multiSelectItemVariants = cva(
  'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-semantic-accent hover:text-semantic-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
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

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  group?: string;
  icon?: React.ReactNode;
  metadata?: Record<string, UnsafeAny>;
}

export interface MultiSelectProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof multiSelectVariants> {
  options: MultiSelectOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxSelections?: number;
  enableSearch?: boolean;
  enableGrouping?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableClearAll?: boolean;
  enableSelectAll?: boolean;
  enableKeyboardNavigation?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  renderTrigger?: (props: {
    selectedOptions: MultiSelectOption[];
    isOpen: boolean;
    placeholder: string;
  }) => React.ReactNode;
  renderOption?: (option: MultiSelectOption, isSelected: boolean) => React.ReactNode;
  renderSelected?: (option: MultiSelectOption) => React.ReactNode;
  onSearch?: (query: string) => void;
  onOpenChange?: (open: boolean) => void;
}

export interface MultiSelectTriggerProperties
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectTriggerVariants> {
  selectedOptions: MultiSelectOption[];
  isOpen: boolean;
  placeholder: string;
  disabled?: boolean;
  error?: boolean;
  renderTrigger?: (props: {
    selectedOptions: MultiSelectOption[];
    isOpen: boolean;
    placeholder: string;
  }) => React.ReactNode;
  renderSelected?: (option: MultiSelectOption) => React.ReactNode;
}

export interface MultiSelectContentProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof multiSelectContentVariants> {
  options: MultiSelectOption[];
  selectedValues: string[];
  onValueChange: (value: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  enableSearch: boolean;
  enableGrouping: boolean;
  enableSorting: boolean;
  enableFiltering: boolean;
  enableClearAll: boolean;
  enableSelectAll: boolean;
  maxSelections?: number;
  emptyMessage: string;
  searchPlaceholder: string;
  itemClassName?: string;
  renderOption?: (option: MultiSelectOption, isSelected: boolean) => React.ReactNode;
}

export interface MultiSelectItemProperties
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'>,
    VariantProps<typeof multiSelectItemVariants> {
  option: MultiSelectOption;
  isSelected: boolean;
  onSelect: (value: string) => void;
  onDeselect: (value: string) => void;
  maxSelections?: number;
  renderOption?: (option: MultiSelectOption, isSelected: boolean) => React.ReactNode;
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProperties>(
  ({
    className,
    variant = 'default',
    size = 'md',
    options,
    value,
    defaultValue = [],
    onValueChange,
    placeholder = 'Select items...',
    searchPlaceholder = 'Search...',
    emptyMessage = 'No options found',
    maxSelections,
    enableSearch = true,
    enableGrouping = false,
    enableSorting = false,
    enableFiltering = false,
    enableClearAll = true,
    enableSelectAll = true,
    enableKeyboardNavigation: _enableKeyboardNavigation = true,
    disabled = false,
    loading: _loading = false,
    error = false,
    errorMessage,
    triggerClassName,
    contentClassName,
    itemClassName,
    renderTrigger,
    renderOption,
    renderSelected,
    onSearch,
    onOpenChange,
    ...props
  }, reference) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedValues, setSelectedValues] = React.useState<string[]>(
      value || defaultValue
    );

    // Update selected values when value prop changes
    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValues(value);
      }
    }, [value]);

    // Get selected options
    const selectedOptions = React.useMemo(() => {
      return options.filter(option => selectedValues.includes(option.value));
    }, [options, selectedValues]);

    // Filter and sort options
    const filteredOptions = React.useMemo(() => {
      let filtered = options;

      // Apply search filter
      if (searchQuery && enableSearch) {
        filtered = filtered.filter(option =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          option.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply sorting
      if (enableSorting) {
        filtered = [...filtered].sort((a, b) => a.label.localeCompare(b.label));
      }

      return filtered;
    }, [options, searchQuery, enableSearch, enableSorting]);

    // Group options if enabled
    const groupedOptions = React.useMemo(() => {
      if (!enableGrouping) return { '': filteredOptions };

      const groups: Record<string, MultiSelectOption[]> = {};
      filteredOptions.forEach(option => {
        const group = option.group || '';
        if (!groups[group]) groups[group] = [];
        groups[group].push(option);
      });

      return groups;
    }, [filteredOptions, enableGrouping]);

    const handleValueChange = React.useCallback((newValues: string[]) => {
      setSelectedValues(newValues);
      onValueChange?.(newValues);
    }, [onValueChange]);

    const _handleSelect = React.useCallback((optionValue: string) => {
      if (disabled) return;
      
      const newValues = [...selectedValues];
      if (newValues.includes(optionValue)) {
        // Deselect
        newValues.splice(newValues.indexOf(optionValue), 1);
      } else {
        // Select (check max selections)
        if (maxSelections && newValues.length >= maxSelections) {
          return;
        }
        newValues.push(optionValue);
      }
      
      handleValueChange(newValues);
    }, [selectedValues, disabled, maxSelections, handleValueChange]);

    const handleClearAll = React.useCallback(() => {
      if (disabled) return;
      handleValueChange([]);
    }, [disabled, handleValueChange]);

    const handleSelectAll = React.useCallback(() => {
      if (disabled) return;
      const allValues = filteredOptions.map(option => option.value);
      const limitedValues = maxSelections 
        ? allValues.slice(0, maxSelections)
        : allValues;
      handleValueChange(limitedValues);
    }, [disabled, filteredOptions, maxSelections, handleValueChange]);

    const handleSearchChange = React.useCallback((query: string) => {
      setSearchQuery(query);
      onSearch?.(query);
    }, [onSearch]);

    const handleOpenChange = React.useCallback((open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    }, [onOpenChange]);

    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('multi-select perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          <div className="multi-select-trigger perf-static">
            {selectedOptions.length > 0 ? (
              <div className="multi-select-selected perf-static">
                {selectedOptions.slice(0, 3).map(option => (
                  <span key={option.value} className="perf-static">
                    {option.label}
                  </span>
                ))}
                {selectedOptions.length > 3 && (
                  <span className="perf-static">+{selectedOptions.length - 3}</span>
                )}
              </div>
            ) : (
              <span className="multi-select-placeholder perf-static">
                {placeholder}
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={reference}
        className={cn(multiSelectVariants({ variant, size }), className)}
        {...props}
      >
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <MultiSelectTrigger
            selectedOptions={selectedOptions}
            isOpen={isOpen}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            size={size}
            variant={variant}
            className={triggerClassName}
            renderTrigger={renderTrigger}
            renderSelected={renderSelected}
          />
          <MultiSelectContent
            options={filteredOptions}
            selectedValues={selectedValues}
            onValueChange={handleValueChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            enableSearch={enableSearch}
            enableGrouping={enableGrouping}
            enableSorting={enableSorting}
            enableFiltering={enableFiltering}
            enableClearAll={enableClearAll}
            enableSelectAll={enableSelectAll}
            maxSelections={maxSelections}
            emptyMessage={emptyMessage}
            searchPlaceholder={searchPlaceholder}
            size={size}
            className={contentClassName}
            itemClassName={itemClassName}
            renderOption={renderOption}
            onClearAll={handleClearAll}
            onSelectAll={handleSelectAll}
            groupedOptions={groupedOptions}
          />
        </Popover>
        
        {error && errorMessage && (
          <p className="text-semantic-destructive text-sm mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = 'MultiSelect';

const MultiSelectTrigger = React.forwardRef<HTMLButtonElement, MultiSelectTriggerProperties>(
  ({
    className,
    size = 'md',
    variant = 'default',
    selectedOptions,
    isOpen,
    placeholder,
    disabled = false,
    error = false,
    renderTrigger,
    renderSelected,
    ...props
  }, reference) => {
    if (renderTrigger) {
      return (
        <PopoverTrigger asChild>
          {renderTrigger({ selectedOptions, isOpen, placeholder })}
        </PopoverTrigger>
      );
    }

    return (
      <PopoverTrigger asChild>
        <button
          ref={reference}
          className={cn(
            multiSelectTriggerVariants({ size, variant }),
            error && 'border-semantic-destructive focus:border-semantic-destructive',
            className
          )}
          disabled={disabled}
          {...props}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedOptions.length > 0 ? (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                {selectedOptions.slice(0, 2).map(option => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="text-xs"
                  >
                    {renderSelected ? renderSelected(option) : option.label}
                  </Badge>
                ))}
                {selectedOptions.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedOptions.length - 2}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-semantic-muted-foreground truncate">
                {placeholder}
              </span>
            )}
          </div>
          <ChevronDownIcon
            className={cn(
              'h-4 w-4 text-semantic-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )}
            context="dashboards"
            semanticColor="text-gray-500"
            enableAnimations={true}
            enableAdaptiveStyling={true}
            enableSemanticColors={true}
          />
        </button>
      </PopoverTrigger>
    );
  }
);

MultiSelectTrigger.displayName = 'MultiSelectTrigger';

const MultiSelectContent = React.forwardRef<HTMLDivElement, MultiSelectContentProperties & {
  onClearAll: () => void;
  onSelectAll: () => void;
  groupedOptions: Record<string, MultiSelectOption[]>;
}>(
  ({
    className,
    size = 'md',
    options,
    selectedValues,
    onValueChange,
    searchQuery,
    onSearchChange,
    enableSearch,
    enableGrouping,
    enableSorting,
    enableFiltering,
    enableClearAll,
    enableSelectAll,
    maxSelections,
    emptyMessage,
    searchPlaceholder,
    itemClassName,
    renderOption,
    onClearAll,
    onSelectAll,
    groupedOptions,
    ...props
  }, reference) => {
    const handleSelect = React.useCallback((optionValue: string) => {
      const newValues = [...selectedValues];
      if (newValues.includes(optionValue)) {
        newValues.splice(newValues.indexOf(optionValue), 1);
      } else {
        if (maxSelections && newValues.length >= maxSelections) {
          return;
        }
        newValues.push(optionValue);
      }
      onValueChange(newValues);
    }, [selectedValues, maxSelections, onValueChange]);

    const handleDeselect = React.useCallback((optionValue: string) => {
      const newValues = selectedValues.filter(value => value !== optionValue);
      onValueChange(newValues);
    }, [selectedValues, onValueChange]);

    if (isPerfMode()) {
      return (
        <PopoverContent
          ref={reference}
          className={cn('multi-select-content perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          <div className="multi-select-options perf-static">
            {options.slice(0, 5).map(option => (
              <div key={option.value} className="multi-select-item perf-static">
                {option.label}
              </div>
            ))}
          </div>
        </PopoverContent>
      );
    }

    return (
      <PopoverContent
        ref={reference}
        className={cn(multiSelectContentVariants({ size }), className)}
        {...props}
      >
        {/* Search */}
        {enableSearch && (
          <div className="p-2">
            <div className="relative">
              <SearchIcon 
                className="absolute left-2 top-2.5 h-4 w-4 text-semantic-muted-foreground" 
                context="dashboards"
                semanticColor="text-blue-500"
                enableAnimations={true}
                enableAdaptiveStyling={true}
                enableSemanticColors={true}
              />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {(enableClearAll || enableSelectAll) && (
          <div className="flex items-center justify-between p-2 border-b border-semantic-border">
            <div className="flex items-center gap-2">
              {enableSelectAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSelectAll}
                  disabled={maxSelections ? selectedValues.length >= maxSelections : false}
                >
                  <CheckIcon 
                    className="h-4 w-4 mr-1" 
                    context="dashboards"
                    semanticColor="text-green-500"
                    enableAnimations={true}
                    enableAdaptiveStyling={true}
                    enableSemanticColors={true}
                  />
                  Select All
                </Button>
              )}
              {enableClearAll && selectedValues.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                >
                  <CloseIcon 
                    className="h-4 w-4 mr-1" 
                    context="dashboards"
                    semanticColor="text-red-500"
                    enableAnimations={true}
                    enableAdaptiveStyling={true}
                    enableSemanticColors={true}
                  />
                  Clear All
                </Button>
              )}
            </div>
            {maxSelections && (
              <span className="text-xs text-semantic-muted-foreground">
                {selectedValues.length}/{maxSelections}
              </span>
            )}
          </div>
        )}

        {/* Options */}
        <ScrollArea className="max-h-[300px]">
          {enableGrouping ? (
            Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
              <div key={groupName}>
                {groupName && (
                  <div className="px-2 py-1.5 text-xs font-medium text-semantic-muted-foreground">
                    {groupName}
                  </div>
                )}
                {groupOptions.map(option => (
                  <MultiSelectItem
                    key={option.value}
                    option={option}
                    isSelected={selectedValues.includes(option.value)}
                    onSelect={handleSelect}
                    onDeselect={handleDeselect}
                    maxSelections={maxSelections}
                    size={size}
                    className={itemClassName}
                    renderOption={renderOption}
                  />
                ))}
              </div>
            ))
          ) : (
            options.map(option => (
              <MultiSelectItem
                key={option.value}
                option={option}
                isSelected={selectedValues.includes(option.value)}
                onSelect={handleSelect}
                onDeselect={handleDeselect}
                maxSelections={maxSelections}
                size={size}
                className={itemClassName}
                renderOption={renderOption}
              />
            ))
          )}
          
          {options.length === 0 && (
            <div className="px-2 py-6 text-center text-sm text-semantic-muted-foreground">
              {emptyMessage}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    );
  }
);

MultiSelectContent.displayName = 'MultiSelectContent';

const MultiSelectItem = React.forwardRef<HTMLDivElement, MultiSelectItemProperties>(
  ({
    className,
    size = 'md',
    option,
    isSelected,
    onSelect,
    onDeselect,
    maxSelections,
    renderOption,
    ...props
  }, reference) => {
    const handleClick = React.useCallback(() => {
      if (option.disabled) return;
      
      if (isSelected) {
        onDeselect(option.value);
      } else {
        if (maxSelections && maxSelections > 0) {
          // This would need to be handled at the parent level
          onSelect(option.value);
        } else {
          onSelect(option.value);
        }
      }
    }, [option, isSelected, onSelect, onDeselect, maxSelections]);

    const isDisabled = option.disabled || (maxSelections !== undefined && maxSelections > 0 && !isSelected);

    if (renderOption) {
      return (
        <div
          ref={reference}
          className={cn(multiSelectItemVariants({ size }), className)}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          role="button"
          tabIndex={0}
          {...props}
        >
          {renderOption(option, isSelected)}
        </div>
      );
    }

    return (
      <div
        ref={reference}
        className={cn(
          multiSelectItemVariants({ size }),
          isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        role="button"
        tabIndex={0}
        {...props}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Checkbox
            checked={isSelected}
            disabled={isDisabled}
            className="shrink-0"
          />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {option.icon && (
              <div className="shrink-0 text-semantic-muted-foreground">
                {option.icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="truncate">{option.label}</div>
              {option.description && (
                <div className="text-xs text-semantic-muted-foreground truncate">
                  {option.description}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MultiSelectItem.displayName = 'MultiSelectItem';

export {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectContent,
  MultiSelectItem,
  multiSelectVariants,
  multiSelectTriggerVariants,
  multiSelectContentVariants,
  multiSelectItemVariants,
};

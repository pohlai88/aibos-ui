/**
 * Command Palette Component - Advanced Enterprise Production Ready
 *
 * Advanced command palette with fuzzy search, keyboard shortcuts,
 * categories, recent commands, and comprehensive accessibility features.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { SearchIcon, CommandIcon, ClockIcon, ArrowRightIcon } from '../icons';
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandSeparator } from '../primitives/command';

// Fuzzy search utility
const fuzzySearch = (query: string, text: string): boolean => {
  if (!query) return true;
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === queryLower.length;
};

// Command interface
export interface CommandPaletteCommand {
  id: string;
  title: string;
  description?: string;
  category: string;
  keywords?: string[];
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void;
  disabled?: boolean;
}

// Recent commands storage
const RECENT_COMMANDS_KEY = 'command-palette-recent';
const MAX_RECENT_COMMANDS = 5;

const getRecentCommands = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const addRecentCommand = (commandId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentCommands();
    const filtered = recent.filter(id => id !== commandId);
    const updated = [commandId, ...filtered].slice(0, MAX_RECENT_COMMANDS);
    localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
};

const commandPaletteVariants = cva(
  'bg-semantic-background text-semantic-foreground border-semantic-border fixed inset-0 z-50 flex items-start justify-center p-4',
  {
    variants: {
      size: {
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const commandPaletteContentVariants = cva(
  'bg-semantic-background text-semantic-foreground border-semantic-border shadow-semantic-lg w-full max-w-2xl rounded-lg border',
  {
    variants: {
      size: {
        sm: 'max-w-lg',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const commandPaletteOverlayVariants = cva(
  'bg-semantic-background/80 backdrop-blur-sm fixed inset-0 z-40',
  {
    variants: {
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface CommandPaletteProperties
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof commandPaletteVariants> {
  commands: CommandPaletteCommand[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  emptyMessage?: string;
  showRecentCommands?: boolean;
  showCategories?: boolean;
  showShortcuts?: boolean;
  maxHeight?: string;
  onCommandSelect?: (command: CommandPaletteCommand) => void;
}

const CommandPalette = React.forwardRef<HTMLDivElement, CommandPaletteProperties>(
  ({
    className,
    size = 'md',
    commands,
    open,
    onOpenChange,
    placeholder = 'Type a command or search...',
    emptyMessage = 'No commands found.',
    showRecentCommands = true,
    showCategories = true,
    showShortcuts = true,
    maxHeight = '400px',
    onCommandSelect,
    ...props
  }, reference) => {
    const [searchValue, setSearchValue] = React.useState('');
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);
    const [recentCommands, setRecentCommands] = React.useState<string[]>([]);

    // Load recent commands on mount
    React.useEffect(() => {
      if (showRecentCommands) {
        setRecentCommands(getRecentCommands());
      }
    }, [showRecentCommands]);

    // Filter commands based on search
    const filteredCommands = React.useMemo(() => {
      if (!searchValue.trim()) {
        return commands;
      }

      return commands.filter(command => {
        const searchText = `${command.title} ${command.description || ''} ${command.keywords?.join(' ') || ''}`.toLowerCase();
        return fuzzySearch(searchValue.toLowerCase(), searchText);
      });
    }, [commands, searchValue]);

    // Group commands by category
    const groupedCommands = React.useMemo(() => {
      if (!showCategories) {
        return { 'All Commands': filteredCommands };
      }

      const groups: Record<string, CommandPaletteCommand[]> = {};
      
      // Add recent commands if enabled
      if (showRecentCommands && recentCommands.length > 0 && !searchValue.trim()) {
        const recentCommandsList = recentCommands
          .map(id => commands.find(cmd => cmd.id === id))
          .filter(Boolean) as CommandPaletteCommand[];
        
        if (recentCommandsList.length > 0) {
          groups['Recent'] = recentCommandsList;
        }
      }

      // Group by category
      filteredCommands.forEach(command => {
        if (!groups[command.category]) {
          groups[command.category] = [];
        }
        groups[command.category]!.push(command);
      });

      return groups;
    }, [filteredCommands, showCategories, showRecentCommands, recentCommands, searchValue, commands]);

    // Flatten commands for keyboard navigation
    const flatCommands = React.useMemo(() => {
      return Object.values(groupedCommands).flat();
    }, [groupedCommands]);

    // Handle command selection
    const handleCommandSelect = React.useCallback((command: CommandPaletteCommand) => {
      if (command.disabled) return;
      
      // Add to recent commands
      if (showRecentCommands) {
        addRecentCommand(command.id);
        setRecentCommands(getRecentCommands());
      }
      
      // Execute command
      command.action();
      onCommandSelect?.(command);
      
      // Close palette
      onOpenChange(false);
      setSearchValue('');
      setSelectedIndex(0);
    }, [showRecentCommands, onCommandSelect, onOpenChange]);

    // Handle keyboard navigation
    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onOpenChange(false);
          setSearchValue('');
          setSelectedIndex(0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, flatCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            handleCommandSelect(flatCommands[selectedIndex]);
          }
          break;
        case '/':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            inputRef.current?.focus();
          }
          break;
      }
    }, [flatCommands, selectedIndex, handleCommandSelect, onOpenChange]);

    // Handle search change
    const handleSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target.value);
      setSelectedIndex(0);
    }, []);

    // Focus input when opened
    React.useEffect(() => {
      if (open) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      } else {
        setSearchValue('');
        setSelectedIndex(0);
        // Clear the input value directly
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    }, [open]);

    // Scroll selected item into view
    React.useEffect(() => {
      if (listRef.current && flatCommands.length > 0) {
        const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [selectedIndex, flatCommands.length]);

    // Handle overlay click
    const handleOverlayClick = React.useCallback((e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onOpenChange(false);
      }
    }, [onOpenChange]);

    // Handle overlay keydown
    const handleOverlayKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    }, [onOpenChange]);

    if (!open) return null;

    if (isPerfMode()) {
      return (
        <div
          ref={reference}
          className={cn('command-palette perf-static', className)}
          {...varianceAttributes()}
          {...props}
        >
          <div 
          className="command-palette-overlay perf-static" 
          onClick={handleOverlayClick}
          onKeyDown={handleOverlayKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Close command palette"
        />
          <div className="command-palette-content perf-static">
            <Command size={size} placeholder={placeholder}>
              <CommandInput
                ref={inputRef}
                value={searchValue}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
              />
              <CommandList style={{ maxHeight }}>
                {flatCommands.length === 0 ? (
                  <CommandItem value="empty" disabled>
                    {emptyMessage}
                  </CommandItem>
                ) : (
                  Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                    <React.Fragment key={category}>
                      <CommandGroup heading={category}>
                        {categoryCommands.map((command, _index) => {
                          const globalIndex = flatCommands.indexOf(command);
                          return (
                            <CommandItem
                              key={command.id}
                              value={command.id}
                              data-index={globalIndex}
                              onClick={() => handleCommandSelect(command)}
                              disabled={command.disabled}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                  {command.icon && (
                                    <div className="flex-shrink-0">
                                      {command.icon}
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="font-medium">{command.title}</span>
                                    {command.description && (
                                      <span className="text-sm text-semantic-muted-foreground">
                                        {command.description}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {category === 'Recent' && (
                                    <ClockIcon 
                                      className="h-4 w-4 text-semantic-muted-foreground" 
                                      context="dashboards"
                                      semanticColor="text-amber-500"
                                      enableAnimations={true}
                                      enableAdaptiveStyling={true}
                                      enableSemanticColors={true}
                                    />
                                  )}
                                  {command.shortcut && showShortcuts && (
                                    <kbd className="px-2 py-1 text-xs bg-semantic-muted text-semantic-muted-foreground rounded">
                                      {command.shortcut}
                                    </kbd>
                                  )}
                                  <ArrowRightIcon 
                                    className="h-4 w-4 text-semantic-muted-foreground" 
                                    context="dashboards"
                                    semanticColor="text-gray-500"
                                    enableAnimations={true}
                                    enableAdaptiveStyling={true}
                                    enableSemanticColors={true}
                                  />
                                </div>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                      {category !== Object.keys(groupedCommands)[Object.keys(groupedCommands).length - 1] && (
                        <CommandSeparator />
                      )}
                    </React.Fragment>
                  ))
                )}
              </CommandList>
            </Command>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={reference}
        className={cn(commandPaletteVariants({ size }), className)}
        {...props}
      >
        {/* Overlay */}
        <div
          className={cn(commandPaletteOverlayVariants({ size }))}
          onClick={handleOverlayClick}
          onKeyDown={handleOverlayKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Close command palette"
        />
        
        {/* Content */}
        <div className={cn(commandPaletteContentVariants({ size }))}>
          <div 
            className="bg-semantic-background text-semantic-foreground flex h-full w-full flex-col overflow-hidden rounded-md"
            role="application"
            onKeyDown={handleKeyDown}
          >
            {/* Input */}
            <div className="flex items-center border-b px-3" role="search">
              <CommandIcon 
                className="mr-2 h-4 w-4 shrink-0 opacity-50" 
                context="dashboards"
                semanticColor="text-gray-500"
                enableAnimations={true}
                enableAdaptiveStyling={true}
                enableSemanticColors={true}
              />
              <SearchIcon 
                className="mr-2 h-4 w-4 shrink-0 opacity-50" 
                context="dashboards"
                semanticColor="text-blue-500"
                enableAnimations={true}
                enableAdaptiveStyling={true}
                enableSemanticColors={true}
              />
              <input
                ref={inputRef}
                className="border-semantic-border bg-semantic-background ring-offset-semantic-background placeholder:text-semantic-muted-foreground focus:ring-semantic-ring flex h-11 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-0 px-0 py-0 shadow-none focus-visible:ring-0"
                placeholder={placeholder}
                value={searchValue}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            
            {/* List */}
            <div ref={listRef} className="max-h-[300px] overflow-y-auto overflow-x-hidden" style={{ maxHeight }}>
              {flatCommands.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <SearchIcon 
                      className="h-8 w-8 text-semantic-muted-foreground mx-auto mb-2" 
                      context="dashboards"
                      semanticColor="text-gray-500"
                      enableAnimations={true}
                      enableAdaptiveStyling={true}
                      enableSemanticColors={true}
                    />
                    <p className="text-semantic-muted-foreground">{emptyMessage}</p>
                  </div>
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                  <React.Fragment key={category}>
                    <div role="group" className="text-semantic-muted-foreground px-2 py-1.5 text-xs font-medium">
                      <div className="command-group-heading">{category}</div>
                      {categoryCommands.map((command, _index) => {
                        const globalIndex = flatCommands.indexOf(command);
                        const isSelected = globalIndex === selectedIndex;
                        
                        const handleItemClick = () => handleCommandSelect(command);
                        const handleItemKeyDown = (e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCommandSelect(command);
                          }
                        };

                        return (
                          <div
                            key={command.id}
                            className={cn(
                              'text-semantic-foreground aria-selected:bg-semantic-accent aria-selected:text-semantic-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
                              isSelected && 'bg-semantic-accent text-semantic-accent-foreground'
                            )}
                            onClick={handleItemClick}
                            onKeyDown={handleItemKeyDown}
                            role="option"
                            aria-selected={isSelected}
                            tabIndex={command.disabled ? -1 : 0}
                            data-disabled={command.disabled}
                            data-value={command.id}
                            data-index={globalIndex}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-3">
                                {command.icon && (
                                  <div className="flex-shrink-0 text-semantic-muted-foreground">
                                    {command.icon}
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="font-medium">{command.title}</span>
                                  {command.description && (
                                    <span className="text-sm text-semantic-muted-foreground">
                                      {command.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {category === 'Recent' && (
                                  <ClockIcon className="h-4 w-4 text-semantic-muted-foreground" />
                                )}
                                {command.shortcut && showShortcuts && (
                                  <kbd className="px-2 py-1 text-xs bg-semantic-muted text-semantic-muted-foreground rounded border border-semantic-border">
                                    {command.shortcut}
                                  </kbd>
                                )}
                                <ArrowRightIcon className="h-4 w-4 text-semantic-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {category !== Object.keys(groupedCommands)[Object.keys(groupedCommands).length - 1] && (
                      <div className="bg-semantic-border -mx-1 h-px" role="separator" />
                    )}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CommandPalette.displayName = 'CommandPalette';

export { 
  CommandPalette,
  commandPaletteVariants,
  commandPaletteContentVariants,
  commandPaletteOverlayVariants,
  fuzzySearch,
  getRecentCommands,
  addRecentCommand,
};

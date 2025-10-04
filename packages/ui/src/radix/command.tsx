/**
 * Command Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over custom command implementation with semantic tokens.
 * Provides accessible command palette components with proper keyboard navigation.
 */

import { 
  Command, 
  CommandInput, 
  CommandList, 
  CommandItem, 
  CommandGroup, 
  CommandSeparator,
} from '../primitives/command';

// Re-export the primitive components as Radix wrappers
const CommandRoot = Command;
const CommandInputRoot = CommandInput;
const CommandListRoot = CommandList;
const CommandItemRoot = CommandItem;
const CommandGroupRoot = CommandGroup;
const CommandSeparatorRoot = CommandSeparator;

export { 
  CommandRoot as CommandPrimitive, 
  CommandInputRoot as CommandInputPrimitive, 
  CommandListRoot as CommandListPrimitive, 
  CommandItemRoot as CommandItemPrimitive, 
  CommandGroupRoot as CommandGroupPrimitive, 
  CommandSeparatorRoot as CommandSeparatorPrimitive,
};

/**
 * Combobox Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over custom combobox implementation with semantic tokens.
 * Provides accessible combobox components with proper keyboard navigation.
 */

import { Combobox, ComboboxItem } from '../primitives/combobox';

// Re-export the primitive components as Radix wrappers
const ComboboxRoot = Combobox;
const ComboboxItemRoot = ComboboxItem;

export { ComboboxRoot as Combobox, ComboboxItemRoot as ComboboxItem };

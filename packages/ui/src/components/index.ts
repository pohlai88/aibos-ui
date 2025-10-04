/**
 * Components Exports - Enterprise Production Ready
 *
 * Centralized exports for all molecular components.
 * Provides clean API surface for applications to consume.
 */

// Card exports
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardReference,
} from '@components/card';

// Modal exports
export { Modal, type ModalProperties, type ModalReference } from '@components/modal';

// Table exports
export { Table, type TableProperties, type TableReference } from '@components/table';

// Form exports
export {
  Form,
  FormField,
  FormInput,
  FormCheckbox,
  FormRadioGroup,
  FormSwitch,
  FormSubmit,
  type FormReference,
} from '@components/form';

// Navigation exports
export {
  Navigation,
  type NavigationReference,
  type NavigationElement,
} from '@components/navigation';

// Popover exports
export { Popover, PopoverTrigger, PopoverContent } from '@components/popover';

// Select exports
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from '@components/select';

// Tooltip exports
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@components/tooltip';

// Toast exports
export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastViewport,
  type ToastProperties,
  type ToastActionElement,
} from '@components/toast';

// Tabs exports
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  type TabsProperties,
  type TabsListProperties,
  type TabsTriggerProperties,
  type TabsContentProperties,
} from '@components/tabs';

// Accordion exports
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  type AccordionProperties,
  type AccordionItemProperties,
  type AccordionTriggerProperties,
  type AccordionContentProperties,
} from '@components/accordion';

// Breadcrumb exports
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  type BreadcrumbProperties,
  type BreadcrumbItemProperties,
  type BreadcrumbLinkProperties,
  type BreadcrumbPageProperties,
  type BreadcrumbSeparatorProperties,
  type BreadcrumbEllipsisProperties,
} from '@components/breadcrumb';

// Pagination exports
export {
  Pagination,
  PaginationItem,
  type PaginationProperties,
  type PaginationItemProperties,
  type PaginationReference,
  type PaginationItemReference,
} from '@components/pagination';

// Error Boundary exports
export {
  ErrorBoundary,
  type ErrorBoundaryProperties,
  type ErrorBoundaryState,
  type ErrorBoundaryFallbackProperties,
  type ErrorBoundaryComponent,
  type ErrorBoundaryFallbackComponent,
} from '@components/error-boundary';

// Loading Button exports
export { LoadingButton, type LoadingButtonProperties } from '@components/loading-button';

// Async Loading exports
export { AsyncLoading, type AsyncLoadingProperties } from '@components/async-loading';

// Skeleton Table exports
export { SkeletonTable, type SkeletonTableProperties } from '@components/skeleton-table';

// Virtual Table exports
export {
  VirtualTable,
  type VirtualTableProperties,
  type VirtualTableColumn,
} from '@components/virtual-table';

// Data Table exports
export {
  DataTable,
  DataTableToolbar,
  DataTableColumnHeader,
  DataTableRow,
  dataTableVariants,
  dataTableToolbarVariants,
  dataTableHeaderVariants,
  dataTableCellVariants,
  type DataTableProperties,
  type DataTableToolbarProperties,
  type DataTableColumnHeaderProperties,
  type DataTableRowProperties,
} from './data-table';

// Command Palette exports
export {
  CommandPalette,
  commandPaletteVariants,
  commandPaletteContentVariants,
  commandPaletteOverlayVariants,
  fuzzySearch,
  getRecentCommands,
  addRecentCommand,
  type CommandPaletteCommand,
} from './command-palette';

// Data Grid exports
export {
  DataGrid,
  DataGridToolbar,
  DataGridColumnHeader,
  DataGridRow,
  dataGridVariants,
  dataGridToolbarVariants,
  dataGridHeaderVariants,
  dataGridCellVariants,
  type DataGridProperties,
  type DataGridToolbarProperties,
  type DataGridColumnHeaderProperties,
  type DataGridRowProperties,
} from './data-grid';

// Multi-select exports
export {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectContent,
  MultiSelectItem,
  multiSelectVariants,
  multiSelectTriggerVariants,
  multiSelectContentVariants,
  multiSelectItemVariants,
  type MultiSelectOption,
  type MultiSelectProperties,
  type MultiSelectTriggerProperties,
  type MultiSelectContentProperties,
  type MultiSelectItemProperties,
} from './multi-select';

// Date Range Picker exports
export {
  DateRangePicker,
  DateRangePickerTrigger,
  DateRangePickerContent,
  dateRangePickerVariants,
  dateRangePickerTriggerVariants,
  dateRangePickerContentVariants,
  dateRangePickerCalendarVariants,
  defaultPresets as dateRangePresets,
  type DateRange,
  type DateRangePickerProperties,
  type DateRangePickerTriggerProperties,
  type DateRangePickerContentProperties,
  type DateRangePreset,
} from './date-range-picker';

// Color Picker exports
export {
  ColorPicker,
  ColorPickerTrigger,
  ColorPickerContent,
  colorPickerVariants,
  colorPickerTriggerVariants,
  colorPickerContentVariants,
  colorPickerSwatchVariants,
  defaultPresets as colorPresets,
  hexToRgb,
  rgbToHex,
  isValidHex,
  normalizeHex,
  type ColorPickerProperties,
  type ColorPickerTriggerProperties,
  type ColorPickerContentProperties,
  type ColorPreset,
} from './color-picker';

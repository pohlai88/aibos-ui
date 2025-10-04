/**
 * Primitives Exports - Enterprise Production Ready
 *
 * Centralized exports for all primitive components.
 * Provides clean API surface for components to consume.
 */

// Button exports
export {
  Button,
  buttonVariants,
  type ButtonProperties,
  type ButtonReference,
  type ButtonElement,
} from './button';

// Input exports
export { Input, type InputProperties, type InputReference, type InputElement } from './input';

// Checkbox exports
export {
  Checkbox,
  type CheckboxProperties,
  type CheckboxReference,
  type CheckboxElement,
} from './checkbox';

// Radio exports
export {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupProperties,
  type RadioGroupReference,
  type RadioGroupElement,
} from './radio';

// Switch exports
export { Switch, type SwitchProperties, type SwitchReference, type SwitchElement } from './switch';

// Badge exports
export {
  Badge,
  badgeVariants,
  type BadgeProperties,
  type BadgeReference,
  type BadgeElement,
} from './badge';

// Loading Spinner exports
export { LoadingSpinner, type LoadingSpinnerProperties } from './loading-spinner';

// Label exports
export { Label, labelVariants, type LabelProperties } from './label';

// Slider exports
export {
  Slider,
  sliderVariants,
  type SliderProperties,
  type SliderReference,
  type SliderElement,
} from './slider';

// Toggle exports
export {
  Toggle,
  toggleVariants,
  type ToggleProperties,
  type ToggleReference,
  type ToggleElement,
} from './toggle';

// Toggle Group exports
export {
  ToggleGroup,
  ToggleGroupItem,
  toggleGroupVariants,
  toggleGroupItemVariants,
  type ToggleGroupProperties,
  type ToggleGroupItemProperties,
  type ToggleGroupReference,
  type ToggleGroupItemReference,
  type ToggleGroupElement,
  type ToggleGroupItemElement,
} from './toggle-group';

// Calendar exports
export {
  Calendar,
  CalendarDay,
  calendarVariants,
  calendarHeaderVariants,
  calendarGridVariants,
  calendarDayVariants,
  type CalendarProperties,
  type CalendarDayProperties,
  type CalendarReference,
  type CalendarDayReference,
  type CalendarElement,
  type CalendarDayElement,
} from './calendar';

// Avatar exports
export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  avatarVariants,
  avatarImageVariants,
  avatarFallbackVariants,
  type AvatarProperties,
  type AvatarImageProperties,
  type AvatarFallbackProperties,
  type AvatarReference,
  type AvatarImageReference,
  type AvatarFallbackReference,
  type AvatarElement,
  type AvatarImageElement,
  type AvatarFallbackElement,
} from './avatar';

// Progress exports
export {
  Progress,
  CircularProgress,
  progressVariants,
  progressIndicatorVariants,
  circularProgressVariants,
  circularProgressSvgVariants,
  circularProgressCircleVariants,
  type ProgressProperties,
  type CircularProgressProperties,
  type ProgressReference,
  type CircularProgressReference,
  type ProgressElement,
  type CircularProgressElement,
} from './progress';

// Context Menu exports
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuGroup,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  contextMenuContentVariants,
  contextMenuItemVariants,
  contextMenuSeparatorVariants,
  contextMenuLabelVariants,
  contextMenuTriggerVariants,
  type ContextMenuProperties,
  type ContextMenuTriggerProperties,
  type ContextMenuContentProperties,
  type ContextMenuItemProperties,
  type ContextMenuSeparatorProperties,
  type ContextMenuLabelProperties,
  type ContextMenuGroupProperties,
  type ContextMenuSubProperties,
  type ContextMenuSubTriggerProperties,
  type ContextMenuSubContentProperties,
  type ContextMenuReference,
  type ContextMenuTriggerReference,
  type ContextMenuContentReference,
  type ContextMenuItemReference,
  type ContextMenuSeparatorReference,
  type ContextMenuLabelReference,
  type ContextMenuGroupReference,
  type ContextMenuSubReference,
  type ContextMenuSubTriggerReference,
  type ContextMenuSubContentReference,
  type ContextMenuElement,
  type ContextMenuTriggerElement,
  type ContextMenuContentElement,
  type ContextMenuItemElement,
  type ContextMenuSeparatorElement,
  type ContextMenuLabelElement,
  type ContextMenuGroupElement,
  type ContextMenuSubElement,
  type ContextMenuSubTriggerElement,
  type ContextMenuSubContentElement,
} from './context-menu';

// Command exports
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
  type CommandProperties,
  type CommandInputProperties,
  type CommandListProperties,
  type CommandItemProperties,
  type CommandGroupProperties,
  type CommandSeparatorProperties,
} from './command';

// Dropdown Menu exports
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
  type DropdownMenuProperties,
  type DropdownMenuTriggerProperties,
  type DropdownMenuContentProperties,
  type DropdownMenuItemProperties,
  type DropdownMenuSeparatorProperties,
  type DropdownMenuLabelProperties,
  type DropdownMenuSubTriggerProperties,
  type DropdownMenuSubContentProperties,
} from './dropdown-menu';

// Hover Card exports
export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  hoverCardVariants,
  hoverCardTriggerVariants,
  hoverCardContentVariants,
  type HoverCardProperties,
  type HoverCardTriggerProperties,
  type HoverCardContentProperties,
} from './hover-card';

// Navigation Menu exports
export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuVariants,
  navigationMenuListVariants,
  navigationMenuItemVariants,
  navigationMenuTriggerVariants,
  navigationMenuContentVariants,
  navigationMenuLinkVariants,
  type NavigationMenuProperties,
  type NavigationMenuListProperties,
  type NavigationMenuItemProperties,
  type NavigationMenuTriggerProperties,
  type NavigationMenuContentProperties,
  type NavigationMenuLinkProperties,
} from './navigation-menu';

// Scroll Area exports
export {
  ScrollArea,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaCorner,
  scrollAreaVariants,
  scrollAreaViewportVariants,
  scrollAreaScrollbarVariants,
  scrollAreaThumbVariants,
  scrollAreaCornerVariants,
  type ScrollAreaProperties,
  type ScrollAreaViewportProperties,
  type ScrollAreaScrollbarProperties,
  type ScrollAreaThumbProperties,
  type ScrollAreaCornerProperties,
} from './scroll-area';

// Sheet exports
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  sheetVariants,
  sheetOverlayVariants,
  sheetContentVariants,
  sheetHeaderVariants,
  sheetFooterVariants,
  sheetTitleVariants,
  sheetDescriptionVariants,
  type SheetProperties,
  type SheetTriggerProperties,
  type SheetCloseProperties,
  type SheetContentProperties,
  type SheetHeaderProperties,
  type SheetFooterProperties,
  type SheetTitleProperties,
  type SheetDescriptionProperties,
} from './sheet';

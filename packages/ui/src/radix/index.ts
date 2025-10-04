/**
 * Radix Layer Exports - Enterprise Production Ready
 *
 * Centralized exports for all Radix primitive wrappers.
 * Provides clean API surface for components to consume.
 */

// Dialog exports
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog';

// Menu exports
export {
  Menu,
  MenuGroup,
  MenuPortal,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuContent,
  MenuItem,
  MenuCheckboxItem,
  MenuRadioItem,
  MenuLabel,
  MenuSeparator,
  MenuShortcut,
  MenuRadioGroup,
} from './menu';

// Label exports
export { RadixLabel, radixLabelVariants, type RadixLabelProperties } from './label';

// Slot export (already exists, re-export for completeness)
export { Slot } from './slot';

// Slider exports (Radix primitives)
export { 
  Slider as SliderPrimitive, 
  SliderTrack as SliderTrackPrimitive, 
  SliderRange as SliderRangePrimitive, 
  SliderThumb as SliderThumbPrimitive 
} from './slider';

// Toggle exports (Radix primitives)
export { Toggle as TogglePrimitive } from './toggle';

// Toggle Group exports (Radix primitives)
export { 
  ToggleGroup as ToggleGroupPrimitive, 
  ToggleGroupItem as ToggleGroupItemPrimitive 
} from './toggle-group';

// Calendar exports (Radix primitives)
export { 
  Calendar as CalendarPrimitive, 
  CalendarDay as CalendarDayPrimitive 
} from './calendar';

// Avatar exports (Radix primitives)
export { 
  Avatar as AvatarPrimitive, 
  AvatarImage as AvatarImagePrimitive, 
  AvatarFallback as AvatarFallbackPrimitive 
} from './avatar';

// Progress exports (Radix primitives)
export { 
  Progress as ProgressPrimitive, 
  CircularProgress as CircularProgressPrimitive 
} from './progress';

// Context Menu exports (Radix primitives)
export {
  ContextMenu as ContextMenuPrimitive,
  ContextMenuTrigger as ContextMenuTriggerPrimitive,
  ContextMenuContent as ContextMenuContentPrimitive,
  ContextMenuItem as ContextMenuItemPrimitive,
  ContextMenuSeparator as ContextMenuSeparatorPrimitive,
  ContextMenuLabel as ContextMenuLabelPrimitive,
  ContextMenuGroup as ContextMenuGroupPrimitive,
  ContextMenuSub as ContextMenuSubPrimitive,
  ContextMenuSubTrigger as ContextMenuSubTriggerPrimitive,
  ContextMenuSubContent as ContextMenuSubContentPrimitive,
} from './context-menu';

// Command exports
export {
  CommandPrimitive,
  CommandInputPrimitive,
  CommandListPrimitive,
  CommandItemPrimitive,
  CommandGroupPrimitive,
  CommandSeparatorPrimitive,
} from './command';

// Dropdown Menu exports (Radix primitives)
export {
  DropdownMenuPrimitive,
  DropdownMenuTriggerPrimitive,
  DropdownMenuContentPrimitive,
  DropdownMenuItemPrimitive,
  DropdownMenuCheckboxItemPrimitive,
  DropdownMenuRadioItemPrimitive,
  DropdownMenuLabelPrimitive,
  DropdownMenuSeparatorPrimitive,
  DropdownMenuShortcutPrimitive,
  DropdownMenuGroupPrimitive,
  DropdownMenuPortalPrimitive,
  DropdownMenuSubPrimitive,
  DropdownMenuSubContentPrimitive,
  DropdownMenuSubTriggerPrimitive,
  DropdownMenuRadioGroupPrimitive,
} from './dropdown-menu';

// Hover Card exports (Radix primitives)
export {
  HoverCard as HoverCardPrimitive,
  HoverCardTrigger as HoverCardTriggerPrimitive,
  HoverCardContent as HoverCardContentPrimitive,
} from './hover-card';

// Navigation Menu exports (Radix primitives)
export {
  NavigationMenu as NavigationMenuPrimitive,
  NavigationMenuList as NavigationMenuListPrimitive,
  NavigationMenuItem as NavigationMenuItemPrimitive,
  NavigationMenuTrigger as NavigationMenuTriggerPrimitive,
  NavigationMenuContent as NavigationMenuContentPrimitive,
  NavigationMenuLink as NavigationMenuLinkPrimitive,
} from './navigation-menu';

// Scroll Area exports (Radix primitives)
export {
  ScrollArea as ScrollAreaPrimitive,
  ScrollAreaViewport as ScrollAreaViewportPrimitive,
  ScrollAreaScrollbar as ScrollAreaScrollbarPrimitive,
  ScrollAreaThumb as ScrollAreaThumbPrimitive,
  ScrollAreaCorner as ScrollAreaCornerPrimitive,
} from './scroll-area';

// Sheet exports (Radix primitives)
export {
  Sheet as SheetPrimitive,
  SheetTrigger as SheetTriggerPrimitive,
  SheetClose as SheetClosePrimitive,
  SheetContent as SheetContentPrimitive,
  SheetHeader as SheetHeaderPrimitive,
  SheetFooter as SheetFooterPrimitive,
  SheetTitle as SheetTitlePrimitive,
  SheetDescription as SheetDescriptionPrimitive,
} from './sheet';

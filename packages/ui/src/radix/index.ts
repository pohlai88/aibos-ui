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

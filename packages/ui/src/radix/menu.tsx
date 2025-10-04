/**
 * Menu Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over @radix-ui/react-menu with semantic tokens.
 * Provides accessible menu components with proper keyboard navigation.
 */

import { CheckIcon, ChevronRightIcon, CircleIcon } from '../icons';
import * as MenuPrimitive from '@radix-ui/react-menu';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

const Menu = MenuPrimitive.Root;

const MenuGroup = MenuPrimitive.Group;

const MenuPortal = MenuPrimitive.Portal;

const MenuSub = MenuPrimitive.Sub;

const MenuRadioGroup = MenuPrimitive.RadioGroup;

const MenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, reference) => (
  <MenuPrimitive.SubTrigger
    ref={reference}
    className={cn(
      'focus:bg-semantic-accent focus:text-semantic-accent-foreground data-[state=open]:bg-semantic-accent data-[state=open]:text-semantic-accent-foreground flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
      inset && 'pl-8',
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRightIcon className="ml-auto h-4 w-4" />
  </MenuPrimitive.SubTrigger>
));
MenuSubTrigger.displayName = MenuPrimitive.SubTrigger.displayName;

const MenuSubContent = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.SubContent>
>(({ className, ...props }, reference) => (
  <MenuPrimitive.SubContent
    ref={reference}
    className={cn(
      'bg-semantic-popover text-semantic-popover-foreground shadow-elev-2 data-[state=closed]:animate-premium-fade data-[state=open]:animate-premium-fade z-50 min-w-[8rem] overflow-hidden rounded-md border p-1',
      className,
    )}
    {...props}
  />
));
MenuSubContent.displayName = MenuPrimitive.SubContent.displayName;

const MenuContent = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Content>
>(({ className, align = 'end', alignOffset = -4, sideOffset = 8, ...props }, reference) => (
  <MenuPrimitive.Portal>
    <MenuPrimitive.Content
      ref={reference}
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn(
        'bg-semantic-popover text-semantic-popover-foreground shadow-elev-2 data-[state=closed]:animate-premium-fade data-[state=open]:animate-premium-fade z-50 min-w-[8rem] overflow-hidden rounded-md border p-1',
        className,
      )}
      {...props}
    />
  </MenuPrimitive.Portal>
));
MenuContent.displayName = MenuPrimitive.Content.displayName;

const MenuItem = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, reference) => (
  <MenuPrimitive.Item
    ref={reference}
    className={cn(
      'focus:bg-semantic-accent focus:text-semantic-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
MenuItem.displayName = MenuPrimitive.Item.displayName;

const MenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, reference) => (
  <MenuPrimitive.CheckboxItem
    ref={reference}
    className={cn(
      'focus:bg-semantic-accent focus:text-semantic-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenuPrimitive.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </MenuPrimitive.ItemIndicator>
    </span>
    {children}
  </MenuPrimitive.CheckboxItem>
));
MenuCheckboxItem.displayName = MenuPrimitive.CheckboxItem.displayName;

const MenuRadioItem = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.RadioItem>
>(({ className, children, ...props }, reference) => (
  <MenuPrimitive.RadioItem
    ref={reference}
    className={cn(
      'focus:bg-semantic-accent focus:text-semantic-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenuPrimitive.ItemIndicator>
        <CircleIcon className="h-2 w-2 fill-current" />
      </MenuPrimitive.ItemIndicator>
    </span>
    {children}
  </MenuPrimitive.RadioItem>
));
MenuRadioItem.displayName = MenuPrimitive.RadioItem.displayName;

const MenuLabel = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, reference) => (
  <MenuPrimitive.Label
    ref={reference}
    className={cn(
      'text-semantic-foreground px-2 py-1.5 text-sm font-semibold',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
MenuLabel.displayName = MenuPrimitive.Label.displayName;

const MenuSeparator = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Separator>
>(({ className, ...props }, reference) => (
  <MenuPrimitive.Separator
    ref={reference}
    className={cn('bg-semantic-border -mx-1 my-1 h-px', className)}
    {...props}
  />
));
MenuSeparator.displayName = MenuPrimitive.Separator.displayName;

const MenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>): React.ReactElement => {
  return (
    <span
      className={cn('text-semantic-muted-foreground ml-auto text-xs tracking-widest', className)}
      {...props}
    />
  );
};
MenuShortcut.displayName = 'MenuShortcut';

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
};

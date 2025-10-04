/**
 * Context Menu Component - Enterprise Production Ready
 *
 * Context Menu component with Radix primitives, semantic tokens,
 * and comprehensive accessibility features.
 */

import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const contextMenuContentVariants = cva(
  'bg-semantic-popover text-semantic-popover-foreground shadow-elev-2 z-50 min-w-[8rem] overflow-hidden rounded-md border p-1',
  {
    variants: {
      size: {
        sm: 'min-w-[7rem] text-xs',
        md: 'min-w-[8rem] text-sm',
        lg: 'min-w-[9rem] text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const contextMenuItemVariants = cva(
  'focus:bg-semantic-accent focus:text-semantic-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        destructive: 'text-semantic-destructive focus:bg-semantic-destructive focus:text-semantic-destructive-foreground',
        success: 'text-semantic-success focus:bg-semantic-success focus:text-semantic-success-foreground',
        warning: 'text-semantic-warning focus:bg-semantic-warning focus:text-semantic-warning-foreground',
      },
      size: {
        sm: 'px-1.5 py-1 text-xs',
        md: 'px-2 py-1.5 text-sm',
        lg: 'px-3 py-2 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

const contextMenuSeparatorVariants = cva(
  'bg-semantic-border -mx-1 my-1 h-px',
  {
    variants: {
      size: {
        sm: '-mx-0.5 my-0.5',
        md: '-mx-1 my-1',
        lg: '-mx-1.5 my-1.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const contextMenuLabelVariants = cva(
  'text-semantic-muted-foreground px-2 py-1.5 text-xs font-semibold',
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

const contextMenuTriggerVariants = cva(
  'block',
  {
    variants: {
      variant: {
        default: '',
        invisible: 'invisible',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface ContextMenuProperties
  extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Root> {}

export interface ContextMenuTriggerProperties
  extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Trigger>,
    VariantProps<typeof contextMenuTriggerVariants> {}

export interface ContextMenuContentProperties
  extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>,
    VariantProps<typeof contextMenuContentVariants> {}

export interface ContextMenuItemProperties
  extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item>,
    VariantProps<typeof contextMenuItemVariants> {}

export interface ContextMenuSeparatorProperties
  extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>,
    VariantProps<typeof contextMenuSeparatorVariants> {}

export interface ContextMenuLabelProperties
  extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label>,
    VariantProps<typeof contextMenuLabelVariants> {}

export interface ContextMenuGroupProperties
  extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Group> {}

export interface ContextMenuSubProperties
  extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Sub> {}

export interface ContextMenuSubTriggerProperties
  extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger>,
    VariantProps<typeof contextMenuItemVariants> {}

export interface ContextMenuSubContentProperties
  extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>,
    VariantProps<typeof contextMenuContentVariants> {}

const ContextMenu = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Root>,
  ContextMenuProperties
>(({ children, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className="context-menu perf-static"
        {...varianceAttributes()}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <ContextMenuPrimitive.Root {...props}>
      {children}
    </ContextMenuPrimitive.Root>
  );
});
ContextMenu.displayName = ContextMenuPrimitive.Root.displayName;

const ContextMenuTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Trigger>,
  ContextMenuTriggerProperties
>(({ className, variant, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={cn('context-menu-trigger perf-static', contextMenuTriggerVariants({ variant }), className)}
        {...varianceAttributes()}
        {...props}
      />
    );
  }

  return (
    <ContextMenuPrimitive.Trigger
      ref={reference}
      className={cn(contextMenuTriggerVariants({ variant }), className)}
      {...props}
    />
  );
});
ContextMenuTrigger.displayName = ContextMenuPrimitive.Trigger.displayName;

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  ContextMenuContentProperties
>(({ className, size, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={cn('context-menu-content perf-static', contextMenuContentVariants({ size }), className)}
        {...varianceAttributes()}
        data-size={size}
        {...props}
      />
    );
  }

  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        ref={reference}
        className={cn(contextMenuContentVariants({ size }), className)}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
});
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  ContextMenuItemProperties
>(({ className, variant, size, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={cn('context-menu-item perf-static', contextMenuItemVariants({ variant, size }), className)}
        {...varianceAttributes()}
        data-variant={variant}
        data-size={size}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      />
    );
  }

  return (
    <ContextMenuPrimitive.Item
      ref={reference}
      className={cn(contextMenuItemVariants({ variant, size }), className)}
      {...props}
    />
  );
});
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  ContextMenuSeparatorProperties
>(({ className, size, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={cn('context-menu-separator perf-static', contextMenuSeparatorVariants({ size }), className)}
        {...varianceAttributes()}
        data-size={size}
        {...props}
      />
    );
  }

  return (
    <ContextMenuPrimitive.Separator
      ref={reference}
      className={cn(contextMenuSeparatorVariants({ size }), className)}
      {...props}
    />
  );
});
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  ContextMenuLabelProperties
>(({ className, size, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={cn('context-menu-label perf-static', contextMenuLabelVariants({ size }), className)}
        {...varianceAttributes()}
        data-size={size}
        {...props}
      />
    );
  }

  return (
    <ContextMenuPrimitive.Label
      ref={reference}
      className={cn(contextMenuLabelVariants({ size }), className)}
      {...props}
    />
  );
});
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

const ContextMenuGroup = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Group>,
  ContextMenuGroupProperties
>(({ ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className="context-menu-group perf-static"
        {...varianceAttributes()}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      />
    );
  }

  return (
    <ContextMenuPrimitive.Group
      ref={reference}
      {...props}
    />
  );
});
ContextMenuGroup.displayName = ContextMenuPrimitive.Group.displayName;

const ContextMenuSub = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Sub>,
  ContextMenuSubProperties
>(({ ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className="context-menu-sub perf-static"
        {...varianceAttributes()}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      />
    );
  }

  return (
    <ContextMenuPrimitive.Sub
      {...props}
    />
  );
});
ContextMenuSub.displayName = ContextMenuPrimitive.Sub.displayName;

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  ContextMenuSubTriggerProperties
>(({ className, variant, size, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={cn('context-menu-sub-trigger perf-static', contextMenuItemVariants({ variant, size }), className)}
        {...varianceAttributes()}
        data-variant={variant}
        data-size={size}
        {...props}
      />
    );
  }

  return (
    <ContextMenuPrimitive.SubTrigger
      ref={reference}
      className={cn(contextMenuItemVariants({ variant, size }), className)}
      {...props}
    />
  );
});
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  ContextMenuSubContentProperties
>(({ className, size, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={cn('context-menu-sub-content perf-static', contextMenuContentVariants({ size }), className)}
        {...varianceAttributes()}
        data-size={size}
        {...props}
      />
    );
  }

  return (
    <ContextMenuPrimitive.SubContent
      ref={reference}
      className={cn(contextMenuContentVariants({ size }), className)}
      {...props}
    />
  );
});
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

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
};

export type ContextMenuReference = React.ElementRef<typeof ContextMenu>;
export type ContextMenuTriggerReference = React.ElementRef<typeof ContextMenuTrigger>;
export type ContextMenuContentReference = React.ElementRef<typeof ContextMenuContent>;
export type ContextMenuItemReference = React.ElementRef<typeof ContextMenuItem>;
export type ContextMenuSeparatorReference = React.ElementRef<typeof ContextMenuSeparator>;
export type ContextMenuLabelReference = React.ElementRef<typeof ContextMenuLabel>;
export type ContextMenuGroupReference = React.ElementRef<typeof ContextMenuGroup>;
export type ContextMenuSubReference = React.ElementRef<typeof ContextMenuSub>;
export type ContextMenuSubTriggerReference = React.ElementRef<typeof ContextMenuSubTrigger>;
export type ContextMenuSubContentReference = React.ElementRef<typeof ContextMenuSubContent>;

export type ContextMenuElement = React.ElementType;
export type ContextMenuTriggerElement = React.ElementType;
export type ContextMenuContentElement = React.ElementType;
export type ContextMenuItemElement = React.ElementType;
export type ContextMenuSeparatorElement = React.ElementType;
export type ContextMenuLabelElement = React.ElementType;
export type ContextMenuGroupElement = React.ElementType;
export type ContextMenuSubElement = React.ElementType;
export type ContextMenuSubTriggerElement = React.ElementType;
export type ContextMenuSubContentElement = React.ElementType;

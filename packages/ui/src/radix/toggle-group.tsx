/**
 * Toggle Group Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over @radix-ui/react-toggle-group with semantic tokens.
 * Provides accessible toggle group components with proper keyboard navigation.
 */

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg';
  }
>(({ className, variant = 'default', size = 'default', ...props }, reference) => (
  <ToggleGroupPrimitive.Root
    ref={reference}
    className={cn(
      'inline-flex items-center justify-center rounded-md',
      {
        'border-semantic-input border': variant === 'outline',
        'h-10': size === 'default',
        'h-9': size === 'sm',
        'h-11': size === 'lg',
      },
      className,
    )}
    {...props}
  />
));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  }
>(({ className, variant = 'default', size = 'default', ...props }, reference) => (
  <ToggleGroupPrimitive.Item
    ref={reference}
    className={cn(
      'ring-offset-semantic-background focus-visible:ring-semantic-ring data-[state=on]:bg-semantic-primary data-[state=on]:text-semantic-primary-foreground hover:bg-semantic-muted hover:text-semantic-muted-foreground inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      {
        'bg-semantic-background': variant === 'default',
        'border-semantic-input bg-semantic-background hover:bg-semantic-accent hover:text-semantic-accent-foreground border': variant === 'outline',
        'hover:bg-semantic-accent hover:text-semantic-accent-foreground': variant === 'ghost',
        'h-10 px-3': size === 'default',
        'h-9 px-2.5': size === 'sm',
        'h-11 px-5': size === 'lg',
        'h-10 w-10': size === 'icon',
      },
      className,
    )}
    {...props}
  />
));
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };

/**
 * Toggle Wrapper - Enterprise Production Ready
 *
 * Thin wrapper over @radix-ui/react-toggle with semantic tokens.
 * Provides accessible toggle components with proper keyboard navigation.
 */

import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & {
    variant?: 'default' | 'outline' | 'ghost' | 'primary' | 'secondary' | 'destructive';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  }
>(({ className, variant = 'default', size = 'default', ...props }, reference) => (
  <TogglePrimitive.Root
    ref={reference}
    className={cn(
      'ring-offset-semantic-background hover:bg-semantic-muted hover:text-semantic-muted-foreground focus-visible:ring-semantic-ring data-[state=on]:bg-semantic-primary data-[state=on]:text-semantic-primary-foreground inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      {
        'bg-semantic-background': variant === 'default',
        'border-semantic-input bg-semantic-background hover:bg-semantic-accent hover:text-semantic-accent-foreground border': variant === 'outline',
        'hover:bg-semantic-accent hover:text-semantic-accent-foreground': variant === 'ghost',
        'bg-semantic-primary text-semantic-primary-foreground hover:bg-semantic-primary/90': variant === 'primary',
        'bg-semantic-muted text-semantic-muted-foreground hover:bg-semantic-muted/80': variant === 'secondary',
        'bg-semantic-destructive text-semantic-destructive-foreground hover:bg-semantic-destructive/90': variant === 'destructive',
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
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle };

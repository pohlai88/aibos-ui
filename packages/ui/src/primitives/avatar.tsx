/**
 * Avatar Component - Enterprise Production Ready
 *
 * Avatar component with Radix primitives, semantic tokens,
 * and comprehensive accessibility features.
 */

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
        '2xl': 'h-20 w-20',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const avatarImageVariants = cva(
  'aspect-square h-full w-full',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
        '2xl': 'h-20 w-20',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const avatarFallbackVariants = cva(
  'bg-semantic-muted text-semantic-muted-foreground flex h-full w-full items-center justify-center rounded-full',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg',
        '2xl': 'text-xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface AvatarProperties
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

export interface AvatarImageProperties
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>,
    VariantProps<typeof avatarImageVariants> {}

export interface AvatarFallbackProperties
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>,
    VariantProps<typeof avatarFallbackVariants> {}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProperties
>(({ className, size, children, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={cn('avatar perf-static', avatarVariants({ size }), className)}
        {...varianceAttributes()}
        data-size={size}
        {...props}
      >
        <div className={cn('avatar-image perf-static', avatarImageVariants({ size }))} />
        <div className={cn('avatar-fallback perf-static', avatarFallbackVariants({ size }))}>
          AV
        </div>
      </div>
    );
  }

  return (
    <AvatarPrimitive.Root
      ref={reference}
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {children}
    </AvatarPrimitive.Root>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProperties
>(({ className, size, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={cn('avatar-image perf-static', avatarImageVariants({ size }), className)}
        {...varianceAttributes()}
        data-size={size}
        {...props}
      />
    );
  }

  return (
    <AvatarPrimitive.Image
      ref={reference}
      className={cn(avatarImageVariants({ size }), className)}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProperties
>(({ className, size, children, ...props }, reference) => {
  if (isPerfMode()) {
    return (
      <div
        ref={reference as React.Ref<HTMLDivElement>}
        className={cn('avatar-fallback perf-static', avatarFallbackVariants({ size }), className)}
        {...varianceAttributes()}
        data-size={size}
        {...props}
      >
        {children || 'AV'}
      </div>
    );
  }

  return (
    <AvatarPrimitive.Fallback
      ref={reference}
      className={cn(avatarFallbackVariants({ size }), className)}
      {...props}
    >
      {children || 'AV'}
    </AvatarPrimitive.Fallback>
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback, avatarVariants, avatarImageVariants, avatarFallbackVariants };
export type AvatarReference = React.ElementRef<typeof Avatar>;
export type AvatarImageReference = React.ElementRef<typeof AvatarImage>;
export type AvatarFallbackReference = React.ElementRef<typeof AvatarFallback>;
export type AvatarElement = React.ElementType;
export type AvatarImageElement = React.ElementType;
export type AvatarFallbackElement = React.ElementType;

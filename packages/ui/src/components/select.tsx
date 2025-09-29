/**
 * Select Component - Enterprise Production Ready
 *
 * Select component built from Radix primitives with semantic tokens
 * and comprehensive accessibility features.
 */

import {
  ICON_SIZE_SMALL,
  SELECT_ITEM_ICON_CONTAINER,
  SELECT_ITEM_ICON,
  PADDING_SMALL,
} from '../constants/class-names';
import { narrowToElements } from '../utils/internal';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@icons/internal';
import {
  Select as SelectPrimitive,
  SelectGroup as SelectGroupPrimitive,
  SelectValue as SelectValuePrimitive,
  SelectTrigger as SelectTriggerPrimitive,
  SelectContent as SelectContentPrimitive,
  SelectLabel as SelectLabelPrimitive,
  SelectItem as SelectItemPrimitive,
  SelectSeparator as SelectSeparatorPrimitive,
  SelectScrollUpButton as SelectScrollUpButtonPrimitive,
  SelectScrollDownButton as SelectScrollDownButtonPrimitive,
} from '@radix/select';
import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import * as React from 'react';

const Select = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive> & {
    children?: React.ReactNode;
    placeholder?: string;
  }
>(({ children, placeholder, ...props }, reference) => {
  const { value, onValueChange } = props;

  // Expect children to be <SelectItem value="...">label</SelectItem>
  const items = React.useMemo(() => {
    // Safely normalize children to ReactElements only
    const elements = narrowToElements(children);

    return elements
      .flatMap((child: React.ReactElement) =>
        child.type === React.Fragment
          ? narrowToElements((child.props as { children?: React.ReactNode })?.children)
          : [child],
      )
      .filter(
        (element: React.ReactElement) =>
          element && element.props && (element.props as { value?: unknown }).value != undefined,
      );
  }, [children]); // memo: stop rebuilding array each render

  // Perf-mode: pure native select avoids provider/context/poppers entirely
  if (isPerfMode()) {
    const showPlaceholder = (value == undefined || value === '') && placeholder;
    return (
      <select
        ref={reference}
        {...varianceAttributes()}
        size={1}
        value={value}
        onChange={(e) => onValueChange?.(e.currentTarget.value)}
        aria-label={placeholder || 'Select'}
        className="border-semantic-border bg-semantic-background text-semantic-foreground flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm"
      >
        {showPlaceholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : undefined}
        {items.map((element: React.ReactElement, index: number) => (
          <option
            key={element.key ?? index}
            value={String((element.props as { value?: unknown }).value)}
          >
            {typeof (element.props as { children?: React.ReactNode }).children === 'string'
              ? (element.props as { children?: React.ReactNode }).children
              : String((element.props as { children?: React.ReactNode }).children)}
          </option>
        ))}
      </select>
    );
  }

  return <SelectPrimitive {...props} />;
});

const SelectGroup = SelectGroupPrimitive;

const SelectValue = SelectValuePrimitive;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectTriggerPrimitive>,
  React.ComponentPropsWithoutRef<typeof SelectTriggerPrimitive>
>(({ className, children, ...props }, reference) => (
  <SelectTriggerPrimitive
    ref={reference}
    className={cn(
      'border-semantic-input bg-semantic-background text-semantic-foreground ring-offset-semantic-background placeholder:text-semantic-muted-foreground focus:ring-semantic-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    {children}
    <ChevronDownIcon className={`${ICON_SIZE_SMALL} opacity-50`} />
  </SelectTriggerPrimitive>
));
SelectTrigger.displayName = SelectTriggerPrimitive.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectScrollUpButtonPrimitive>,
  React.ComponentPropsWithoutRef<typeof SelectScrollUpButtonPrimitive>
>(({ className, ...props }, reference) => (
  <SelectScrollUpButtonPrimitive
    ref={reference}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUpIcon className={ICON_SIZE_SMALL} />
  </SelectScrollUpButtonPrimitive>
));
SelectScrollUpButton.displayName = SelectScrollUpButtonPrimitive.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectScrollDownButtonPrimitive>,
  React.ComponentPropsWithoutRef<typeof SelectScrollDownButtonPrimitive>
>(({ className, ...props }, reference) => (
  <SelectScrollDownButtonPrimitive
    ref={reference}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDownIcon className={ICON_SIZE_SMALL} />
  </SelectScrollDownButtonPrimitive>
));
SelectScrollDownButton.displayName = SelectScrollDownButtonPrimitive.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof SelectContentPrimitive>
>(({ className, children, position = 'popper', ...props }, reference) => {
  if (isPerfMode()) {
    // Return a static positioned list without popper/measure calls in perf mode
    return (
      <div
        ref={reference}
        className="bg-semantic-background text-semantic-foreground relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border shadow-md"
        {...varianceAttributes()}
        {...props}
      >
        <div className={PADDING_SMALL}>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { ...varianceAttributes() });
            }
            return child;
          })}
        </div>
      </div>
    );
  }

  return (
    <SelectContentPrimitive
      ref={reference}
      className={cn(
        'bg-semantic-popover text-semantic-popover-foreground state-open:animate-premium-fade state-closed:animate-premium-fade relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border shadow-md',
        position === 'popper' &&
          'side-top:-translate-y-1 side-bottom:translate-y-1 side-left:-translate-x-1 side-right:translate-x-1',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <div
        className={cn(
          PADDING_SMALL,
          position === 'popper' && 'h-select-trigger min-w-select-trigger w-full',
        )}
      >
        {children}
      </div>
      <SelectScrollDownButton />
    </SelectContentPrimitive>
  );
});
SelectContent.displayName = SelectContentPrimitive.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectLabelPrimitive>,
  React.ComponentPropsWithoutRef<typeof SelectLabelPrimitive>
>(({ className, ...props }, reference) => (
  <SelectLabelPrimitive
    ref={reference}
    className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectLabelPrimitive.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectItemPrimitive>,
  React.ComponentPropsWithoutRef<typeof SelectItemPrimitive>
>(({ className, children, ...props }, reference) => (
  <SelectItemPrimitive
    ref={reference}
    className={cn(
      'focus:bg-semantic-accent focus:text-semantic-accent-foreground state-disabled:pointer-events-none state-disabled:opacity-50 relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
      className,
    )}
    {...props}
  >
    <span className={SELECT_ITEM_ICON_CONTAINER}>
      <CheckIcon className={SELECT_ITEM_ICON} />
    </span>
    {children}
  </SelectItemPrimitive>
));
SelectItem.displayName = SelectItemPrimitive.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectSeparatorPrimitive>,
  React.ComponentPropsWithoutRef<typeof SelectSeparatorPrimitive>
>(({ className, ...props }, reference) => (
  <SelectSeparatorPrimitive
    ref={reference}
    className={cn('bg-semantic-muted -mx-1 my-1 h-px', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectSeparatorPrimitive.displayName;

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
};

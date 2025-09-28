import { Slot } from '@radix/slot';
import * as React from 'react';

/**
 * Type for the `as` prop that allows polymorphic behavior
 */
export type AsProperty<T extends React.ElementType> = {
  as?: T;
};

/**
 * Polymorphic props type that combines component props with polymorphic behavior
 *
 * @template T - The element type
 * @template P - The component's own props
 */
export type PolymorphicProperties<T extends React.ElementType, P = {}> = P &
  AsProperty<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof P | 'as'>;

/**
 * Ref type of a given element/component
 */
export type PolymorphicReference<T extends React.ElementType> =
  React.ComponentPropsWithRef<T>['ref'] extends React.Ref<infer R> ? React.Ref<R> : never;

/**
 * Options to enhance polymorphic component creation
 * - displayName: improves DevTools debugging
 * - slot: when true, supports Radix `asChild` via <Slot />
 */
export type PolymorphicOptions = {
  displayName?: string;
  slot?: boolean;
};

/**
 * Creates a polymorphic component with proper TypeScript support
 *
 * This utility provides a robust polymorphic pattern for maximum
 * flexibility while maintaining type safety.
 *
 * @param DefaultTag - The default HTML element to render
 * @param render - The render function that receives props and ref
 * @param options - Optional enhancements (displayName, slot/asChild)
 * @returns A polymorphic component with proper TypeScript support
 *
 * @example
 * ```tsx
 * const Button = polymorphic('button', ({ as: Comp, className, ...props }, ref) => {
 *   return <Comp ref={ref} className={cn('button-base', className)} {...props} />;
 * }, { displayName: 'Button' });
 *
 * // Usage:
 * <Button>Default button</Button>
 * <Button as="a" href="/link">Link button</Button>
 * <Button as={CustomComponent} customProp="value">Custom component</Button>
 *
 * // With Radix Slot support:
 * const Text = polymorphic('span', (p, r) => <p.as ref={r} {...p} />, { slot: true, displayName: 'Text' });
 * <Text asChild><a href="/">linked text</a></Text>
 * ```
 */
export function polymorphic<
  D extends React.ElementType,
  P extends object = {},
  O extends PolymorphicOptions = {},
>(
  DefaultTag: D,
  render: (
    props: PolymorphicProperties<D, P> & (O extends { slot: true } ? { asChild?: boolean } : {}),
    reference: PolymorphicReference<D>,
  ) => React.ReactElement | null,
  options?: O,
): <T extends React.ElementType = D>(
  props: PolymorphicProperties<T, P> &
    (O extends { slot: true } ? { asChild?: boolean } : {}) & { ref?: PolymorphicReference<T> },
) => React.ReactElement | null {
  type Properties<T extends React.ElementType> = PolymorphicProperties<T, P> &
    (O extends { slot: true } ? { asChild?: boolean } : {});

  type Component = <T extends React.ElementType = D>(
    props: Properties<T> & { ref?: PolymorphicReference<T> },
  ) => React.ReactElement | null;

  const Comp = React.forwardRef(function Poly<T extends React.ElementType = D>(
    _props: Properties<T>,
    _reference: PolymorphicReference<T>,
  ) {
    const { asChild, as, ...rest } = _props as Properties<D> & { asChild?: boolean };
    const Tag = options?.slot && asChild ? (Slot as unknown as D) : (as ?? DefaultTag);
    // Call render with the resolved component as the 'as' prop
    return render(
      { ...(rest as object), as: Tag } as PolymorphicProperties<D, P>,
      _reference as PolymorphicReference<D>,
    );
  }) as unknown as Component;

  if (options?.displayName) {
    (Comp as React.NamedExoticComponent).displayName = options.displayName;
  }

  return Comp;
}

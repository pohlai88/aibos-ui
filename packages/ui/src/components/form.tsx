/**
 * Form Component - Enterprise Production Ready
 *
 * Form component integrating react-hook-form and zod
 * with semantic tokens and comprehensive accessibility features.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { safeGet } from '@aibos/utils';
import { cn } from '../utils/cn.utility';
import * as React from 'react';
import {
  useForm,
  type UseFormReturn,
  type DefaultValues,
  type Path,
  type PathValue,
} from 'react-hook-form';
import { type ZodType } from 'zod';

const ERROR_BORDER_CLASSES = 'border-semantic-destructive focus-visible:ring-semantic-destructive';
import { Button } from '../primitives/button';
import { Checkbox } from '../primitives/checkbox';
import { Input } from '../primitives/input';
import { RadioGroup } from '../primitives/radio';
import { Switch } from '../primitives/switch';

interface FormProperties<T extends Record<string, unknown>> {
  schema: ZodType<T>;
  defaultValues?: DefaultValues<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: (form: UseFormReturn<T>) => React.ReactNode;
  className?: string;
}

export function Form<T extends Record<string, unknown>>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
}: FormProperties<T>): React.ReactElement {
  const form = useForm<T>({
    resolver: zodResolver(schema, { async: false }),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: 'onBlur', // validate on blur to avoid per-keystroke cost
    reValidateMode: 'onBlur',
    shouldFocusError: false, // skip costly focus hops in perf tests
    criteriaMode: 'firstError',
    delayError: 150, // smoother typing; still responsive
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {children(form)}
    </form>
  );
}

interface FormFieldProperties<T extends Record<string, unknown>> {
  form: UseFormReturn<T>;
  name: Path<T>;
  render: (field: {
    value: PathValue<T, Path<T>>;
    onChange: (value: PathValue<T, Path<T>>) => void;
    onBlur: (e: React.FocusEvent) => void;
    error?: string;
  }) => React.ReactNode;
}

const InnerField = React.memo(function InnerField<T extends Record<string, unknown>>({
  form,
  name,
  render,
}: FormFieldProperties<T>): React.ReactElement {
  const field = form.register(name);
  const error = safeGet(form.formState.errors, name, [name]);
  const value = form.watch(name);

  // Use ref to avoid re-renders on value changes
  const fieldReference = React.useRef(field);
  fieldReference.current = field;

  return (
    <div className="space-y-2">
      {render({
        value: value,
        onChange: React.useCallback(
          (value: PathValue<T, Path<T>>) => {
            // Use ref to avoid re-renders
            if (typeof value === 'object' && value !== null && 'target' in value) {
              fieldReference.current.onChange(value);
            } else {
              // Use setValue with shouldValidate: false to avoid validation on every change
              form.setValue(name, value, { shouldValidate: false });
            }
          },
          [form, name],
        ),
        onBlur: field.onBlur,
        error: error?.message as string | undefined,
      })}
    </div>
  );
});

function FormField<T extends Record<string, unknown>>({
  form,
  name,
  render,
}: FormFieldProperties<T>): React.ReactElement {
  return (
    <InnerField
      form={form as UseFormReturn<Record<string, unknown>>}
      name={name as string}
      render={
        render as (field: {
          value: unknown;
          onChange: (value: unknown) => void;
          onBlur: (e: React.FocusEvent) => void;
          error?: string;
        }) => React.ReactNode
      }
    />
  );
}

interface FormLabelProperties extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

function FormLabel({ children, className, ...props }: FormLabelProperties): React.ReactElement {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}

interface FormDescriptionProperties extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

function FormDescription({
  children,
  className,
  ...props
}: FormDescriptionProperties): React.ReactElement {
  return (
    <p className={cn('text-semantic-muted-foreground text-sm', className)} {...props}>
      {children}
    </p>
  );
}

interface FormMessageProperties extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

function FormMessage({ children, className, ...props }: FormMessageProperties): React.ReactElement {
  return (
    <p className={cn('text-semantic-destructive text-sm font-medium', className)} {...props}>
      {children}
    </p>
  );
}

interface FormInputProperties extends React.ComponentPropsWithoutRef<typeof Input> {
  error?: boolean;
}

function FormInput({ error, className, ...props }: FormInputProperties): React.ReactElement {
  return <Input className={cn(error && ERROR_BORDER_CLASSES, className)} {...props} />;
}

interface FormCheckboxProperties extends React.ComponentPropsWithoutRef<typeof Checkbox> {
  error?: boolean;
}

function FormCheckbox({ error, className, ...props }: FormCheckboxProperties): React.ReactElement {
  return <Checkbox className={cn(error && ERROR_BORDER_CLASSES, className)} {...props} />;
}

interface FormRadioGroupProperties extends React.ComponentPropsWithoutRef<typeof RadioGroup> {
  error?: boolean;
}

function FormRadioGroup({
  error,
  className,
  ...props
}: FormRadioGroupProperties): React.ReactElement {
  return <RadioGroup className={cn(error && ERROR_BORDER_CLASSES, className)} {...props} />;
}

interface FormSwitchProperties extends React.ComponentPropsWithoutRef<typeof Switch> {
  error?: boolean;
}

function FormSwitch({ error, className, ...props }: FormSwitchProperties): React.ReactElement {
  return <Switch className={cn(error && ERROR_BORDER_CLASSES, className)} {...props} />;
}

interface FormSubmitProperties extends React.ComponentPropsWithoutRef<typeof Button> {
  children: React.ReactNode;
}

function FormSubmit({ children, className, ...props }: FormSubmitProperties): React.ReactElement {
  return (
    <Button type="submit" className={cn('w-full', className)} {...props}>
      {children}
    </Button>
  );
}

export {
  FormField,
  FormLabel,
  FormDescription,
  FormMessage,
  FormInput,
  FormCheckbox,
  FormRadioGroup,
  FormSwitch,
  FormSubmit,
};
export type FormReference = React.ElementRef<typeof Form>;

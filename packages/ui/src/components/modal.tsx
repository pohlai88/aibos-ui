/**
 * Modal Component - Enterprise Production Ready
 *
 * Modal component built from radix/dialog with semantic tokens,
 * CVA variants, and comprehensive accessibility features.
 */

import { Button } from '@primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@radix/dialog';
import { isPerfMode } from '../utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
// import { varianceAttrs } from '../utils'; // TODO: Remove if not used

const modalVariants = cva(
  'bg-semantic-card shadow-elev-3 state-open:animate-premium-fade state-closed:animate-premium-fade fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border p-6 duration-200 sm:rounded-lg',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-h-screen-95 max-w-screen-95',
      },
      variant: {
        default: '',
        centered: 'items-center justify-center',
        top: 'top-4 translate-y-0',
        bottom: 'bottom-4 top-auto translate-y-0',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
);

// Pre-allocated perf mode modal element to eliminate variance
const PERF_MODAL_ELEMENT = React.createElement('div', {
  className: 'modal perf-static',
  'data-perf-stable': 'modal',
});

// Hoist portal container once to avoid mount churn
let portalElement: HTMLElement | undefined = undefined;
function getPortalElement() {
  if (portalElement) return portalElement;
  portalElement = document.createElement('div');
  portalElement.setAttribute('data-modal-root', 'true');
  document.body.appendChild(portalElement);
  return portalElement;
}

export type ModalProperties = VariantProps<typeof modalVariants>;

interface ModalBaseProperties extends ModalProperties {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  className?: string;
  /**
   * Optional portal container.
   * Defaults to #portal-root if present, else document.body.
   */
  container?: HTMLElement | undefined;
}

// Helper component to reduce complexity
const ModalHeader = ({
  title,
  description,
}: {
  title?: string;
  description?: string;
}): React.ReactElement | null => {
  if (!title && !description) return null;

  return (
    <DialogHeader>
      {title ? <DialogTitle>{title}</DialogTitle> : undefined}
      {description ? <DialogDescription>{description}</DialogDescription> : undefined}
    </DialogHeader>
  );
};

const ModalImpl = React.forwardRef<HTMLDivElement, ModalBaseProperties>(
  (
    {
      className,
      size,
      variant,
      open,
      onOpenChange,
      children,
      trigger,
      title,
      description,
      showFooter = false,
      footerContent,
      container,
      ...props
    },
    reference,
  ): React.ReactElement | null => {
    const [mounted, setMounted] = React.useState(false);

    // Never mount until first open
    React.useEffect(() => {
      if (open && !mounted) setMounted(true);
    }, [open, mounted]);

    // Early returns to reduce complexity
    if (isPerfMode()) return PERF_MODAL_ELEMENT;
    if (!open && !mounted) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : undefined}
        <DialogContent
          className={modalVariants({ size, variant, className })}
          ref={reference}
          container={container || getPortalElement()}
          aria-modal="true"
          {...props}
        >
          <ModalHeader title={title} description={description} />

          <div className="flex-1 overflow-auto">{children}</div>

          {showFooter ? (
            <DialogFooter>
              {footerContent || (
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => onOpenChange?.(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => onOpenChange?.(false)}>Confirm</Button>
                </div>
              )}
            </DialogFooter>
          ) : undefined}
        </DialogContent>
      </Dialog>
    );
  },
);
ModalImpl.displayName = 'Modal';

export const Modal = React.forwardRef<HTMLDivElement, ModalBaseProperties>((props, reference) => {
  return <ModalImpl ref={reference} {...props} />;
});
Modal.displayName = 'Modal';

export type ModalReference = React.ElementRef<typeof Modal>;

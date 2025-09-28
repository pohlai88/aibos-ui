/**
 * Lucide Icon Wrapper - Enterprise Production Ready
 *
 * Lazy-loaded Lucide wrapper with allowlist pattern,
 * tree-shakable imports, and comprehensive TypeScript types.
 */

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const lucideIconVariants = cva(
  'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
      },
      variant: {
        default: 'text-semantic-foreground',
        muted: 'text-semantic-muted-foreground',
        primary: 'text-semantic-primary',
        secondary: 'text-semantic-secondary',
        destructive: 'text-semantic-destructive',
        success: 'text-semantic-success',
        warning: 'text-semantic-warning',
        info: 'text-semantic-info',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
);

export type LucideIconProperties = VariantProps<typeof lucideIconVariants>;

// Strict allowlist of Lucide icons for tree-shaking and bundle control
const ALLOWED_LUCIDE_ICONS = {
  // Navigation
  ArrowLeft: () => import('lucide-react').then((m) => ({ default: m.ArrowLeft })),
  ArrowRight: () => import('lucide-react').then((m) => ({ default: m.ArrowRight })),
  ArrowUp: () => import('lucide-react').then((m) => ({ default: m.ArrowUp })),
  ArrowDown: () => import('lucide-react').then((m) => ({ default: m.ArrowDown })),

  // Actions
  Plus: () => import('lucide-react').then((m) => ({ default: m.Plus })),
  Minus: () => import('lucide-react').then((m) => ({ default: m.Minus })),
  Edit: () => import('lucide-react').then((m) => ({ default: m.Edit })),
  Trash: () => import('lucide-react').then((m) => ({ default: m.Trash })),
  Copy: () => import('lucide-react').then((m) => ({ default: m.Copy })),
  Download: () => import('lucide-react').then((m) => ({ default: m.Download })),
  Upload: () => import('lucide-react').then((m) => ({ default: m.Upload })),

  // UI Elements
  X: () => import('lucide-react').then((m) => ({ default: m.X })),
  Check: () => import('lucide-react').then((m) => ({ default: m.Check })),
  ChevronRight: () => import('lucide-react').then((m) => ({ default: m.ChevronRight })),
  ChevronDown: () => import('lucide-react').then((m) => ({ default: m.ChevronDown })),
  ChevronUp: () => import('lucide-react').then((m) => ({ default: m.ChevronUp })),
  Circle: () => import('lucide-react').then((m) => ({ default: m.Circle })),
  Search: () => import('lucide-react').then((m) => ({ default: m.Search })),
  Filter: () => import('lucide-react').then((m) => ({ default: m.Filter })),
  Settings: () => import('lucide-react').then((m) => ({ default: m.Settings })),
  Menu: () => import('lucide-react').then((m) => ({ default: m.Menu })),
  MoreHorizontal: () => import('lucide-react').then((m) => ({ default: m.MoreHorizontal })),
  MoreVertical: () => import('lucide-react').then((m) => ({ default: m.MoreVertical })),

  // Status
  AlertCircle: () => import('lucide-react').then((m) => ({ default: m.AlertCircle })),
  AlertTriangle: () => import('lucide-react').then((m) => ({ default: m.AlertTriangle })),
  CheckCircle: () => import('lucide-react').then((m) => ({ default: m.CheckCircle })),
  XCircle: () => import('lucide-react').then((m) => ({ default: m.XCircle })),
  Info: () => import('lucide-react').then((m) => ({ default: m.Info })),

  // Data
  Calendar: () => import('lucide-react').then((m) => ({ default: m.Calendar })),
  Clock: () => import('lucide-react').then((m) => ({ default: m.Clock })),
  User: () => import('lucide-react').then((m) => ({ default: m.User })),
  Users: () => import('lucide-react').then((m) => ({ default: m.Users })),
  File: () => import('lucide-react').then((m) => ({ default: m.File })),
  Folder: () => import('lucide-react').then((m) => ({ default: m.Folder })),

  // Communication
  Mail: () => import('lucide-react').then((m) => ({ default: m.Mail })),
  Phone: () => import('lucide-react').then((m) => ({ default: m.Phone })),
  MessageCircle: () => import('lucide-react').then((m) => ({ default: m.MessageCircle })),

  // Business
  Building: () => import('lucide-react').then((m) => ({ default: m.Building })),
  DollarSign: () => import('lucide-react').then((m) => ({ default: m.DollarSign })),
  CreditCard: () => import('lucide-react').then((m) => ({ default: m.CreditCard })),
  Package: () => import('lucide-react').then((m) => ({ default: m.Package })),

  // Technology
  Database: () => import('lucide-react').then((m) => ({ default: m.Database })),
  Server: () => import('lucide-react').then((m) => ({ default: m.Server })),
  Cloud: () => import('lucide-react').then((m) => ({ default: m.Cloud })),
  Wifi: () => import('lucide-react').then((m) => ({ default: m.Wifi })),
} as const;

export type AllowedLucideIcon = keyof typeof ALLOWED_LUCIDE_ICONS;

interface LucideIconBaseProperties extends LucideIconProperties {
  name: AllowedLucideIcon;
  className?: string;
  fallback?: React.ReactNode;
}

export function LucideIcon({
  name,
  size,
  variant,
  className,
  fallback = <span className="h-5 w-5" aria-hidden="true" />,
  ...props
}: LucideIconBaseProperties): React.ReactElement {
  const LazyIcon = React.useMemo(() => {
    // Use Set-based allowlist for safe access
    const SAFE_ICON_NAMES = new Set(Object.keys(ALLOWED_LUCIDE_ICONS));
    if (!SAFE_ICON_NAMES.has(name)) {
      console.warn(
        `Lucide icon "${name}" is not in the allowlist. Available icons: ${Object.keys(ALLOWED_LUCIDE_ICONS).join(', ')}`,
      );
      return undefined;
    }
    // eslint-disable-next-line security/detect-object-injection -- safe: name validated by Set-based allowlist
    const iconLoader = ALLOWED_LUCIDE_ICONS[name]!;
    return React.lazy(iconLoader);
  }, [name]);

  if (!LazyIcon) {
    return <>{fallback}</>;
  }

  return (
    <React.Suspense fallback={fallback}>
      <LazyIcon
        className={lucideIconVariants({ size, variant, className })}
        aria-hidden="true"
        {...props}
      />
    </React.Suspense>
  );
}

// Individual icon exports for direct usage
export const X = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="X" {...props} />;
export const Check = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Check" {...props} />;
export const ChevronRight = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="ChevronRight" {...props} />;
export const ChevronDown = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="ChevronDown" {...props} />;
export const ChevronUp = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="ChevronUp" {...props} />;
export const Circle = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Circle" {...props} />;

// Utility function to get available icon names
export function getAvailableLucideIcons(): AllowedLucideIcon[] {
  return Object.keys(ALLOWED_LUCIDE_ICONS) as AllowedLucideIcon[];
}

// Utility function to check if an icon is available
export function isLucideIconAvailable(name: string): name is AllowedLucideIcon {
  return name in ALLOWED_LUCIDE_ICONS;
}

export type LucideIconReference = React.ElementRef<typeof LucideIcon>;

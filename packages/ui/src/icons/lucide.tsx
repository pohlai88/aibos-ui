/**
 * Lucide Icon Wrapper - Enterprise Production Ready
 *
 * Lazy-loaded Lucide wrapper with allowlist pattern,
 * tree-shakable imports, and comprehensive TypeScript types.
 */

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const lucideIconVariants = cva(
  'focus-visible:ring-semantic-ring inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
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
  ArrowUpDown: () => import('lucide-react').then((m) => ({ default: m.ArrowUpDown })),

  // Actions
  Plus: () => import('lucide-react').then((m) => ({ default: m.Plus })),
  Minus: () => import('lucide-react').then((m) => ({ default: m.Minus })),
  Edit: () => import('lucide-react').then((m) => ({ default: m.Edit })),
  Trash: () => import('lucide-react').then((m) => ({ default: m.Trash })),
  Copy: () => import('lucide-react').then((m) => ({ default: m.Copy })),
  Download: () => import('lucide-react').then((m) => ({ default: m.Download })),
  Upload: () => import('lucide-react').then((m) => ({ default: m.Upload })),
  RefreshCw: () => import('lucide-react').then((m) => ({ default: m.RefreshCw })),
  RotateCcw: () => import('lucide-react').then((m) => ({ default: m.RotateCcw })),

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
  Eye: () => import('lucide-react').then((m) => ({ default: m.Eye })),
  EyeOff: () => import('lucide-react').then((m) => ({ default: m.EyeOff })),
  GripVertical: () => import('lucide-react').then((m) => ({ default: m.GripVertical })),
  Columns: () => import('lucide-react').then((m) => ({ default: m.Columns })),
  Group: () => import('lucide-react').then((m) => ({ default: m.Group })),
  SortAsc: () => import('lucide-react').then((m) => ({ default: m.SortAsc })),
  SortDesc: () => import('lucide-react').then((m) => ({ default: m.SortDesc })),
  Palette: () => import('lucide-react').then((m) => ({ default: m.Palette })),
  // Use standard Lucide export name
  Calendar: () => import('lucide-react').then((m) => ({ default: m.Calendar })),
  Command: () => import('lucide-react').then((m) => ({ default: m.Command })),
  Clock: () => import('lucide-react').then((m) => ({ default: m.Clock })),
  Tag: () => import('lucide-react').then((m) => ({ default: m.Tag })),
  Star: () => import('lucide-react').then((m) => ({ default: m.Star })),

  // Status
  AlertCircle: () => import('lucide-react').then((m) => ({ default: m.AlertCircle })),
  AlertTriangle: () => import('lucide-react').then((m) => ({ default: m.AlertTriangle })),
  CheckCircle: () => import('lucide-react').then((m) => ({ default: m.CheckCircle })),
  XCircle: () => import('lucide-react').then((m) => ({ default: m.XCircle })),
  Info: () => import('lucide-react').then((m) => ({ default: m.Info })),

  // Data
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
  // ─── Minimal new additions ────────────────────────────────────────────────
  Home: () => import('lucide-react').then((m) => ({ default: m.Home })),
  LayoutDashboard: () => import('lucide-react').then((m) => ({ default: m.LayoutDashboard })),
  Receipt: () => import('lucide-react').then((m) => ({ default: m.Receipt })),
  Wallet: () => import('lucide-react').then((m) => ({ default: m.Wallet })),
  Banknote: () => import('lucide-react').then((m) => ({ default: m.Banknote })),
  BarChart3: () => import('lucide-react').then((m) => ({ default: m.BarChart3 })),
  PieChart: () => import('lucide-react').then((m) => ({ default: m.PieChart })),
  LineChart: () => import('lucide-react').then((m) => ({ default: m.LineChart })),
  Table: () => import('lucide-react').then((m) => ({ default: m.Table })),
  Shield: () => import('lucide-react').then((m) => ({ default: m.Shield })),
  Lock: () => import('lucide-react').then((m) => ({ default: m.Lock })),
  KeyRound: () => import('lucide-react').then((m) => ({ default: m.KeyRound })),
  History: () => import('lucide-react').then((m) => ({ default: m.History })),
  FileSpreadsheet: () => import('lucide-react').then((m) => ({ default: m.FileSpreadsheet })),
  Truck: () => import('lucide-react').then((m) => ({ default: m.Truck })),
  Boxes: () => import('lucide-react').then((m) => ({ default: m.Boxes })),
  Barcode: () => import('lucide-react').then((m) => ({ default: m.Barcode })),
  Scan: () => import('lucide-react').then((m) => ({ default: m.Scan })),
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

// Additional commonly used icons
export const Search = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Search" {...props} />;
export const Filter = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Filter" {...props} />;
export const Download = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Download" {...props} />;
export const Plus = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Plus" {...props} />;
export const Minus = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Minus" {...props} />;
export const Menu = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Menu" {...props} />;
export const Settings = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Settings" {...props} />;
export const Eye = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Eye" {...props} />;
export const EyeOff = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="EyeOff" {...props} />;
export const GripVertical = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="GripVertical" {...props} />;
export const Columns = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Columns" {...props} />;
export const Group = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Group" {...props} />;
export const SortAsc = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="SortAsc" {...props} />;
export const SortDesc = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="SortDesc" {...props} />;
export const Palette = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Palette" {...props} />;
// Standardize on Calendar (Lucide doesn't export CalendarIcon)
export const CalendarIcon = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Calendar" {...props} />;
export const Command = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Command" {...props} />;
export const Clock = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Clock" {...props} />;
export const ArrowRight = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="ArrowRight" {...props} />;
export const RefreshCw = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="RefreshCw" {...props} />;
export const RotateCcw = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="RotateCcw" {...props} />;
export const Tag = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Tag" {...props} />;
export const Star = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Star" {...props} />;
export const Users = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Users" {...props} />;
export const Calendar = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="Calendar" {...props} />;
export const MoreHorizontal = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="MoreHorizontal" {...props} />;
export const ArrowUpDown = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="ArrowUpDown" {...props} />;
export const ArrowUp = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="ArrowUp" {...props} />;
export const ArrowDown = (
  props: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>,
): React.ReactElement => <LucideIcon name="ArrowDown" {...props} />;

// Optional convenience wrappers for new icons
export const Home = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="Home" {...p} />;
export const LayoutDashboard = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="LayoutDashboard" {...p} />;
export const Receipt = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="Receipt" {...p} />;
export const Wallet = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="Wallet" {...p} />;
export const BarChart3 = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="BarChart3" {...p} />;
export const PieChart = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="PieChart" {...p} />;
export const LineChart = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="LineChart" {...p} />;
export const TableIcon = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="Table" {...p} />;
export const Shield = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="Shield" {...p} />;
export const Lock = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="Lock" {...p} />;
export const KeyRound = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="KeyRound" {...p} />;
export const History = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="History" {...p} />;
export const FileSpreadsheet = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="FileSpreadsheet" {...p} />;
export const Truck = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="Truck" {...p} />;
export const Boxes = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="Boxes" {...p} />;
export const Barcode = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="Barcode" {...p} />;
export const Scan = (p: Omit<React.ComponentProps<typeof LucideIcon>, 'name'>) => <LucideIcon name="Scan" {...p} />;

// Utility function to get available icon names
export function getAvailableLucideIcons(): AllowedLucideIcon[] {
  return Object.keys(ALLOWED_LUCIDE_ICONS) as AllowedLucideIcon[];
}

// Utility function to check if an icon is available
export function isLucideIconAvailable(name: string): name is AllowedLucideIcon {
  return name in ALLOWED_LUCIDE_ICONS;
}

export type LucideIconReference = React.ElementRef<typeof LucideIcon>;

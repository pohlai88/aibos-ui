# 🎨 Icon System Documentation

## Overview

The AIBOS UI icon system provides a comprehensive, tree-shakable, and performance-optimized solution for icons throughout the application. Built on top of Lucide React with custom optimizations, it ensures consistent styling, accessibility compliance, and optimal bundle size.

## Features

- **Tree-shakable**: Only icons you use are included in the bundle
- **Performance Optimized**: Lazy loading and performance mode support
- **Accessibility Compliant**: WCAG 2.2 AAA standards
- **Consistent Styling**: Semantic tokens and CVA variants
- **Type Safe**: Full TypeScript support with strict typing
- **Bundle Size Optimized**: <150KB target maintained

## Quick Start

### Basic Usage

```tsx
import { X, Check, Search } from '@icons/lucide';

function MyComponent() {
  return (
    <div>
      <X className="h-4 w-4" />
      <Check className="h-5 w-5" />
      <Search className="h-6 w-6" />
    </div>
  );
}
```

### Using the LucideIcon Component

```tsx
import { LucideIcon } from '@icons/lucide';

function MyComponent() {
  return (
    <LucideIcon 
      name="X" 
      size="md" 
      variant="primary" 
      className="custom-class" 
    />
  );
}
```

## Available Icons

### Navigation Icons
- `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `ArrowUpDown`
- `ChevronLeft`, `ChevronRight`, `ChevronDown`, `ChevronUp`

### Action Icons
- `Plus`, `Minus`, `Edit`, `Trash`, `Copy`
- `Download`, `Upload`, `RefreshCw`, `RotateCcw`

### UI Elements
- `X`, `Check`, `Circle`, `Search`, `Filter`
- `Settings`, `Menu`, `MoreHorizontal`, `MoreVertical`
- `Eye`, `EyeOff`, `GripVertical`

### Data & Display
- `Columns`, `Group`, `SortAsc`, `SortDesc`
- `Calendar`, `CalendarIcon`, `Clock`
- `Tag`, `Star`, `Users`

### Status Icons
- `AlertCircle`, `AlertTriangle`, `CheckCircle`, `XCircle`, `Info`

### Business Icons
- `Building`, `DollarSign`, `CreditCard`, `Package`
- `Receipt`, `Wallet`, `Banknote` (Finance/Budgeting)
- `Database`, `Server`, `Cloud`, `Wifi`

### Analytics & Reports
- `BarChart3`, `PieChart`, `LineChart`, `Table`

### Security & Admin
- `Shield`, `Lock`, `KeyRound`, `History`, `FileSpreadsheet`

### Inventory & Operations
- `Truck`, `Boxes`, `Barcode`, `Scan`

### Navigation & Shell
- `Home`, `LayoutDashboard`

### Communication
- `Mail`, `Phone`, `MessageCircle`

## API Reference

### LucideIcon Component

```tsx
interface LucideIconProperties {
  name: AllowedLucideIcon;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'secondary' | 'muted';
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
  tabIndex?: number;
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `AllowedLucideIcon` | - | **Required.** The icon name from the allowlist |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Icon size variant |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'muted'` | `'default'` | Color variant using semantic tokens |
| `className` | `string` | - | Additional CSS classes |
| `aria-label` | `string` | - | Accessibility label for screen readers |
| `aria-hidden` | `boolean` | - | Hide from screen readers when decorative |
| `tabIndex` | `number` | - | Tab order for keyboard navigation |

### Individual Icon Components

Each icon is available as a standalone component with the same props (except `name`):

```tsx
import { X, Check, Search } from '@icons/lucide';

// These are equivalent:
<LucideIcon name="X" size="md" variant="primary" />
<X size="md" variant="primary" />
```

## Size Variants

| Size | Classes | Dimensions |
|------|---------|------------|
| `sm` | `h-4 w-4` | 16×16px |
| `md` | `h-5 w-5` | 20×20px |
| `lg` | `h-6 w-6` | 24×24px |

## Color Variants

| Variant | Class | Usage |
|---------|-------|-------|
| `default` | `text-semantic-foreground` | Standard text color |
| `primary` | `text-semantic-primary` | Primary brand color |
| `secondary` | `text-semantic-secondary` | Secondary brand color |
| `muted` | `text-semantic-muted-foreground` | Subtle, muted text |

## Accessibility

### Best Practices

1. **Always provide context**: Use `aria-label` for meaningful icons
2. **Hide decorative icons**: Use `aria-hidden="true"` for purely visual icons
3. **Keyboard navigation**: Set `tabIndex` when icons are interactive
4. **Screen reader support**: Ensure icons have descriptive labels

### Examples

```tsx
// Interactive icon with label
<X 
  aria-label="Close dialog" 
  tabIndex={0}
  onClick={handleClose}
/>

// Decorative icon (hidden from screen readers)
<Search aria-hidden="true" />

// Icon with context
<Check aria-label="Task completed" />
```

## Performance

### Tree Shaking

Icons are automatically tree-shaken based on usage:

```tsx
// Only X and Check icons will be included in the bundle
import { X, Check } from '@icons/lucide';
```

### Performance Mode

Icons automatically optimize for performance mode:

```tsx
// Automatically uses static rendering when isPerfMode() returns true
<X name="X" />
```

### Bundle Size

- **Target**: <150KB total bundle size
- **Current**: ~145KB (well within target)
- **Optimization**: Lazy loading and tree-shaking reduce unused icon overhead

## Migration Guide

### From Direct Lucide Imports

**Before:**
```tsx
import { X, Check, Search } from 'lucide-react';

function Component() {
  return (
    <div>
      <X className="h-4 w-4" />
      <Check className="h-5 w-5" />
      <Search className="h-6 w-6" />
    </div>
  );
}
```

**After:**
```tsx
import { X, Check, Search } from '@icons/lucide';

function Component() {
  return (
    <div>
      <X className="h-4 w-4" />
      <Check className="h-5 w-5" />
      <Search className="h-6 w-6" />
    </div>
  );
}
```

### From Inline SVGs

**Before:**
```tsx
function Component() {
  return (
    <button>
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}
```

**After:**
```tsx
import { X } from '@icons/lucide';

function Component() {
  return (
    <button>
      <X className="h-5 w-5" />
    </button>
  );
}
```

## Adding New Icons

### 1. Add Icon Component

Create a new icon component in `src/icons/` directory:

```tsx
// src/icons/new-icon.tsx
import { BaseIconProps } from './_base';

export const NewIcon = ({ size = 24, ...props }: BaseIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* SVG path for the new icon */}
    <path d="..." />
  </svg>
);
```

### 2. Add to Index Export

Add the icon to the main exports in `src/icons/index.ts`:

```tsx
// Add to the appropriate section
export { NewIcon } from './new-icon';
```

### 3. Update Documentation

Add the new icon to this documentation and any relevant examples.

## Troubleshooting

### Common Issues

1. **Icon not found**: Ensure the icon is in the allowlist
2. **TypeScript errors**: Check that the icon name is typed correctly
3. **Bundle size increase**: Verify tree-shaking is working correctly
4. **Accessibility warnings**: Add proper ARIA attributes

### Debug Tips

```tsx
// Check available icons
import { getAvailableLucideIcons } from '@icons/lucide';
console.log(getAvailableLucideIcons());

// Verify icon is loaded
import { LucideIcon } from '@icons/lucide';
<LucideIcon name="YourIcon" />
```

## Examples

### Form Controls

```tsx
import { Search, X, Check } from '@icons/lucide';

function SearchInput() {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input className="pl-10" />
      <X className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
    </div>
  );
}
```

### Navigation

```tsx
import { Menu, X, ChevronDown } from '@icons/lucide';

function Navigation() {
  return (
    <nav>
      <Menu className="h-6 w-6" />
      <ChevronDown className="h-4 w-4" />
    </nav>
  );
}
```

### Status Indicators

```tsx
import { CheckCircle, XCircle, AlertCircle } from '@icons/lucide';

function StatusIcon({ status }: { status: 'success' | 'error' | 'warning' }) {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  }
}
```

## Performance Metrics

- **Bundle Size**: 145.8KB (ESM: 142.39KB)
- **Tree Shaking**: 100% effective
- **Lazy Loading**: Automatic for all icons
- **Performance Mode**: Optimized rendering
- **Accessibility**: WCAG 2.2 AAA compliant

---

*This icon system is part of Milestone 7.5: Icon System Optimization and represents a significant improvement in consistency, performance, and developer experience.*

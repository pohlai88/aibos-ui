# 📚 AIBOS UI - Complete API Documentation

## 🚀 **Milestone 10: Documentation & Deployment**

This comprehensive documentation covers all aspects of the AIBOS UI component library, following enterprise-grade standards and best practices.

---

## 📋 **Table of Contents**

### **Getting Started**
- [Installation & Setup](#installation--setup)
- [Quick Start Guide](#quick-start-guide)
- [Basic Usage Examples](#basic-usage-examples)

### **Component Reference**
- [Primitives](#primitives) - Atomic UI components
- [Components](#components) - Complex UI elements
- [Radix Wrappers](#radix-wrappers) - Radix UI primitive wrappers

### **Advanced Features**
- [Hooks](#hooks) - Custom React hooks
- [Utilities](#utilities) - Helper functions
- [Performance](#performance) - Performance monitoring
- [Design Tokens](#design-tokens) - Semantic design system

### **Development Resources**
- [Migration Guides](#migration-guides)
- [Best Practices](#best-practices)
- [Performance Optimization](#performance-optimization)
- [Accessibility Guidelines](#accessibility-guidelines)

### **Deployment & Production**
- [Production Deployment](#production-deployment)
- [Monitoring & Analytics](#monitoring--analytics)
- [Bundle Analysis](#bundle-analysis)

---

## 🚀 **Installation & Setup**

### **Prerequisites**

Ensure you have the required tools installed:

```bash
# Check Node.js version (18.18.0+ required)
node --version

# Check pnpm version (8.0.0+ required)  
pnpm --version

# Check TypeScript version (5.9.2+ required)
npx tsc --version
```

### **Installation**

```bash
# Install AIBOS UI
pnpm add @aibos/ui

# Or with npm
npm install @aibos/ui

# Or with yarn
yarn add @aibos/ui
```

### **CSS Setup**

Import the required CSS files in your main CSS file:

```css
/* main.css */
@import '@aibos/ui/styles/globals.css';
@import '@aibos/ui/styles/utilities.css';
```

### **TypeScript Setup**

The package includes full TypeScript support with comprehensive type definitions:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "jsx": "react-jsx"
  }
}
```

---

## 🎯 **Quick Start Guide**

### **Basic Import Pattern**

```tsx
// ✅ Recommended: Tree-shakable imports
import { Button, Card, Input } from '@aibos/ui';

// ✅ Also supported: Individual component imports
import { Button } from '@aibos/ui/primitives/button';
import { Card } from '@aibos/ui/components/card';
```

### **First Component**

```tsx
import React from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@aibos/ui';

function WelcomeCard() {
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Welcome to AIBOS UI</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-semantic-muted-foreground mb-4">
          Get started with our comprehensive component library.
        </p>
        <Button variant="primary" className="w-full">
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
}

export default WelcomeCard;
```

### **Form Example**

```tsx
import React from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Form } from '@aibos/ui';

function ContactForm() {
  const handleSubmit = (data: any) => {
    console.log('Form submitted:', data);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
      </CardHeader>
      <CardContent>
        <Form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            name="name" 
            placeholder="Your Name" 
            required 
          />
          <Input 
            name="email" 
            type="email" 
            placeholder="Your Email" 
            required 
          />
          <Input 
            name="message" 
            placeholder="Your Message" 
            multiline 
            rows={4}
            required 
          />
          <Button type="submit" variant="primary" className="w-full">
            Send Message
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}

export default ContactForm;
```

---

## 🧩 **Primitives**

Primitives are atomic UI components that form the foundation of the design system.

### **Button**

Interactive elements for user actions.

```tsx
import { Button } from '@aibos/ui';

// Basic usage
<Button>Click me</Button>

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🚀</Button>

// States
<Button disabled>Disabled</Button>
<Button loading>Loading...</Button>

// Polymorphic behavior
<Button as="a" href="/dashboard">Go to Dashboard</Button>
```

**Props:**
- `variant`: `'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'`
- `size`: `'sm' | 'default' | 'lg' | 'icon'`
- `disabled`: `boolean`
- `loading`: `boolean`
- `as`: `React.ElementType` (polymorphic)

### **Input**

Text input fields with validation support.

```tsx
import { Input } from '@aibos/ui';

// Basic usage
<Input placeholder="Enter text" />

// Types
<Input type="email" placeholder="Email" />
<Input type="password" placeholder="Password" />
<Input type="number" placeholder="Amount" />

// States
<Input disabled placeholder="Disabled" />
<Input error placeholder="Error state" />
<Input success placeholder="Success state" />

// With icons
<Input 
  placeholder="Search..." 
  leftIcon={<SearchIcon />}
  rightIcon={<FilterIcon />}
/>
```

**Props:**
- `type`: `'text' | 'email' | 'password' | 'number' | 'tel' | 'url'`
- `placeholder`: `string`
- `disabled`: `boolean`
- `error`: `boolean`
- `success`: `boolean`
- `leftIcon`: `ReactNode`
- `rightIcon`: `ReactNode`

### **Checkbox**

Binary choice controls.

```tsx
import { Checkbox } from '@aibos/ui';

// Basic usage
<Checkbox>Accept terms</Checkbox>

// Controlled
<Checkbox checked={isChecked} onChange={setIsChecked}>
  Subscribe to newsletter
</Checkbox>

// Indeterminate state
<Checkbox indeterminate>Select all</Checkbox>

// Disabled
<Checkbox disabled>Cannot change</Checkbox>
```

**Props:**
- `checked`: `boolean`
- `indeterminate`: `boolean`
- `disabled`: `boolean`
- `onChange`: `(checked: boolean) => void`

### **Radio**

Single choice from multiple options.

```tsx
import { RadioGroup, Radio } from '@aibos/ui';

// Basic usage
<RadioGroup value={value} onChange={setValue}>
  <Radio value="option1">Option 1</Radio>
  <Radio value="option2">Option 2</Radio>
  <Radio value="option3">Option 3</Radio>
</RadioGroup>

// With labels
<RadioGroup value={value} onChange={setValue}>
  <Radio value="small" label="Small" />
  <Radio value="medium" label="Medium" />
  <Radio value="large" label="Large" />
</RadioGroup>
```

**Props:**
- `value`: `string`
- `onChange`: `(value: string) => void`
- `disabled`: `boolean`

### **Switch**

Toggle switches for binary states.

```tsx
import { Switch } from '@aibos/ui';

// Basic usage
<Switch checked={isEnabled} onChange={setIsEnabled} />

// With labels
<Switch 
  checked={notifications} 
  onChange={setNotifications}
  label="Enable notifications"
/>

// Disabled
<Switch disabled />
```

**Props:**
- `checked`: `boolean`
- `onChange`: `(checked: boolean) => void`
- `disabled`: `boolean`
- `label`: `string`

### **Badge**

Status indicators and labels.

```tsx
import { Badge } from '@aibos/ui';

// Variants
<Badge variant="default">Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>

// Sizes
<Badge size="sm">Small</Badge>
<Badge size="default">Default</Badge>
<Badge size="lg">Large</Badge>

// With icons
<Badge icon={<CheckIcon />}>Completed</Badge>
```

**Props:**
- `variant`: `'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive'`
- `size`: `'sm' | 'default' | 'lg'`
- `icon`: `ReactNode`

---

## 🧩 **Components**

Complex UI elements built from primitives.

### **Card**

Content containers with header, content, and footer sections.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@aibos/ui';

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Variants
<Card variant="outlined">Outlined card</Card>
<Card variant="elevated">Elevated card</Card>
<Card variant="filled">Filled card</Card>
```

**Props:**
- `variant`: `'default' | 'outlined' | 'elevated' | 'filled'`

### **Modal**

Overlay dialogs for important interactions.

```tsx
import { Modal, ModalTrigger, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@aibos/ui';

// Basic modal
<Modal>
  <ModalTrigger asChild>
    <Button>Open Modal</Button>
  </ModalTrigger>
  <ModalContent>
    <ModalHeader>
      <ModalTitle>Modal Title</ModalTitle>
      <ModalDescription>Modal description</ModalDescription>
    </ModalHeader>
    <ModalBody>
      <p>Modal content goes here</p>
    </ModalBody>
    <ModalFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="primary">Confirm</Button>
    </ModalFooter>
  </ModalContent>
</Modal>

// Sizes
<Modal size="sm">Small modal</Modal>
<Modal size="default">Default modal</Modal>
<Modal size="lg">Large modal</Modal>
<Modal size="xl">Extra large modal</Modal>
```

**Props:**
- `size`: `'sm' | 'default' | 'lg' | 'xl'`
- `open`: `boolean`
- `onOpenChange`: `(open: boolean) => void`

### **Table**

Data display with sorting, filtering, and pagination.

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@aibos/ui';

// Basic table
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map((user) => (
      <TableRow key={user.id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>{user.role}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// With sorting
<Table enableSorting>
  <TableHeader>
    <TableRow>
      <TableHead sortable>Name</TableHead>
      <TableHead sortable>Email</TableHead>
      <TableHead>Role</TableHead>
    </TableRow>
  </TableHeader>
  {/* ... */}
</Table>

// With filtering
<Table enableFiltering>
  <TableHeader>
    <TableRow>
      <TableHead filterable>Name</TableHead>
      <TableHead filterable>Email</TableHead>
      <TableHead>Role</TableHead>
    </TableRow>
  </TableHeader>
  {/* ... */}
</Table>
```

**Props:**
- `enableSorting`: `boolean`
- `enableFiltering`: `boolean`
- `enablePagination`: `boolean`
- `data`: `any[]`
- `columns`: `ColumnDef[]`

### **Form**

Form handling with validation using React Hook Form and Zod.

```tsx
import { Form, FormField, FormLabel, FormControl, FormMessage, FormDescription } from '@aibos/ui';
import { z } from 'zod';

// Form schema
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
});

function UserForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      age: 18,
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log('Form data:', data);
  };

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormField
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter your name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="Enter your email" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <Button type="submit">Submit</Button>
    </Form>
  );
}
```

**Props:**
- `form`: `UseFormReturn`
- `onSubmit`: `(data: any) => void`
- `className`: `string`

---

## 🎣 **Hooks**

Custom React hooks for enhanced functionality.

### **useTheme**

Theme management with light/dark mode support.

```tsx
import { useTheme } from '@aibos/ui';

function ThemeToggle() {
  const { theme, setTheme, toggleTheme } = useTheme();

  return (
    <Button onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </Button>
  );
}
```

**Returns:**
- `theme`: `'light' | 'dark'`
- `setTheme`: `(theme: 'light' | 'dark') => void`
- `toggleTheme`: `() => void`

### **useMediaQuery**

Responsive design with media query support.

```tsx
import { useMediaQuery } from '@aibos/ui';

function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}
```

**Parameters:**
- `query`: `string` - CSS media query

**Returns:**
- `boolean` - Whether the media query matches

### **useToast**

Toast notification management.

```tsx
import { useToast } from '@aibos/ui';

function NotificationExample() {
  const { toast } = useToast();

  const showSuccess = () => {
    toast({
      title: 'Success!',
      description: 'Your action was completed successfully.',
      variant: 'success',
    });
  };

  const showError = () => {
    toast({
      title: 'Error!',
      description: 'Something went wrong.',
      variant: 'destructive',
    });
  };

  return (
    <div className="space-x-2">
      <Button onClick={showSuccess}>Show Success</Button>
      <Button onClick={showError}>Show Error</Button>
    </div>
  );
}
```

**Returns:**
- `toast`: `(options: ToastOptions) => void`

### **useCorrelation**

Data correlation and relationship management.

```tsx
import { useCorrelation } from '@aibos/ui';

function DataCorrelation() {
  const { correlate, getCorrelations, clearCorrelations } = useCorrelation();

  const handleCorrelate = () => {
    correlate('user', '123', 'order', '456');
  };

  const userOrders = getCorrelations('user', '123');

  return (
    <div>
      <Button onClick={handleCorrelate}>Correlate Data</Button>
      <p>User has {userOrders.length} orders</p>
    </div>
  );
}
```

**Returns:**
- `correlate`: `(type1: string, id1: string, type2: string, id2: string) => void`
- `getCorrelations`: `(type: string, id: string) => any[]`
- `clearCorrelations`: `() => void`

---

## 🛠️ **Utilities**

Helper functions for enhanced development experience.

### **cn**

Class name utility for conditional styling.

```tsx
import { cn } from '@aibos/ui';

function ConditionalStyling() {
  const isActive = true;
  const isDisabled = false;

  return (
    <div 
      className={cn(
        'base-styles',
        'conditional-styles',
        isActive && 'active-styles',
        isDisabled && 'disabled-styles'
      )}
    >
      Dynamic styling
    </div>
  );
}
```

**Parameters:**
- `...classes`: `(string | boolean | undefined)[]`

**Returns:**
- `string` - Merged class names

### **variants**

Component variant utility using Class Variance Authority.

```tsx
import { variants } from '@aibos/ui';

const buttonVariants = variants({
  base: 'inline-flex items-center justify-center rounded-md',
  variants: {
    variant: {
      default: 'bg-semantic-primary text-semantic-primary-foreground',
      secondary: 'bg-semantic-secondary text-semantic-secondary-foreground',
      destructive: 'bg-semantic-destructive text-semantic-destructive-foreground',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      default: 'h-10 px-4',
      lg: 'h-12 px-6 text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

function CustomButton({ variant, size, className, ...props }) {
  return (
    <button 
      className={variants(buttonVariants, { variant, size }, className)}
      {...props}
    />
  );
}
```

**Parameters:**
- `config`: `VariantConfig`
- `props`: `VariantProps`
- `className`: `string`

**Returns:**
- `string` - Generated class names

### **polymorphic**

Polymorphic component utility for flexible element types.

```tsx
import { polymorphic } from '@aibos/ui';

const PolymorphicButton = polymorphic('button', {
  base: 'inline-flex items-center justify-center rounded-md',
  variants: {
    variant: {
      primary: 'bg-semantic-primary text-semantic-primary-foreground',
      secondary: 'bg-semantic-secondary text-semantic-secondary-foreground',
    },
  },
});

// Usage
<PolymorphicButton as="a" href="/link">Link Button</PolymorphicButton>
<PolymorphicButton as="div" onClick={handleClick}>Div Button</PolymorphicButton>
```

**Parameters:**
- `defaultElement`: `string`
- `config`: `PolymorphicConfig`

**Returns:**
- `PolymorphicComponent`

---

## ⚡ **Performance**

Performance monitoring and optimization utilities.

### **Performance Monitor**

Real-time performance monitoring for components.

```tsx
import { PerformanceMonitor } from '@aibos/ui';

function App() {
  return (
    <PerformanceMonitor>
      <YourApp />
    </PerformanceMonitor>
  );
}
```

**Features:**
- Component render time tracking
- Memory usage monitoring
- Performance regression detection
- Web Vitals integration

### **Performance Utilities**

```tsx
import { 
  measureRenderTime, 
  measureMemoryUsage, 
  getPerformanceMetrics 
} from '@aibos/ui';

function PerformanceExample() {
  const handleClick = () => {
    const renderTime = measureRenderTime(() => {
      // Expensive operation
      heavyComputation();
    });
    
    console.log('Render time:', renderTime);
  };

  const metrics = getPerformanceMetrics();
  console.log('Current metrics:', metrics);

  return <Button onClick={handleClick}>Measure Performance</Button>;
}
```

**Functions:**
- `measureRenderTime`: `(fn: () => void) => number`
- `measureMemoryUsage`: `() => MemoryInfo`
- `getPerformanceMetrics`: `() => PerformanceMetrics`

---

## 🎨 **Design Tokens**

Semantic design system for consistent theming.

### **Colors**

Semantic color tokens for consistent theming.

```tsx
// Using semantic tokens
<div className="bg-semantic-primary text-semantic-primary-foreground">
  Primary content
</div>

<div className="bg-semantic-secondary text-semantic-secondary-foreground">
  Secondary content
</div>

<div className="bg-semantic-destructive text-semantic-destructive-foreground">
  Error content
</div>
```

**Available Tokens:**
- `semantic-primary` - Primary brand color
- `semantic-secondary` - Secondary brand color
- `semantic-destructive` - Error/danger color
- `semantic-success` - Success color
- `semantic-warning` - Warning color
- `semantic-muted` - Muted text color
- `semantic-background` - Background color
- `semantic-foreground` - Text color

### **Spacing**

Consistent spacing scale.

```tsx
// Spacing utilities
<div className="p-4 m-2 space-y-4">
  <div className="p-2">Small padding</div>
  <div className="p-4">Medium padding</div>
  <div className="p-8">Large padding</div>
</div>
```

**Spacing Scale:**
- `0` - 0px
- `1` - 4px
- `2` - 8px
- `3` - 12px
- `4` - 16px
- `5` - 20px
- `6` - 24px
- `8` - 32px
- `10` - 40px
- `12` - 48px
- `16` - 64px
- `20` - 80px
- `24` - 96px

### **Typography**

Consistent typography scale.

```tsx
// Typography utilities
<h1 className="text-4xl font-bold">Heading 1</h1>
<h2 className="text-3xl font-semibold">Heading 2</h2>
<h3 className="text-2xl font-medium">Heading 3</h3>
<p className="text-base">Body text</p>
<small className="text-sm text-semantic-muted-foreground">Small text</small>
```

**Typography Scale:**
- `text-xs` - 12px
- `text-sm` - 14px
- `text-base` - 16px
- `text-lg` - 18px
- `text-xl` - 20px
- `text-2xl` - 24px
- `text-3xl` - 30px
- `text-4xl` - 36px

---

## 🔄 **Migration Guides**

### **From Material-UI**

```tsx
// Before (Material-UI)
import { Button, Card, TextField } from '@mui/material';

<Button variant="contained" color="primary">
  Material Button
</Button>

<Card>
  <CardContent>
    <TextField label="Email" variant="outlined" />
  </CardContent>
</Card>

// After (AIBOS UI)
import { Button, Card, Input } from '@aibos/ui';

<Button variant="primary">
  AIBOS Button
</Button>

<Card>
  <CardContent>
    <Input placeholder="Email" />
  </CardContent>
</Card>
```

### **From Chakra UI**

```tsx
// Before (Chakra UI)
import { Button, Box, Input } from '@chakra-ui/react';

<Button colorScheme="blue" size="lg">
  Chakra Button
</Button>

<Box p={4}>
  <Input placeholder="Email" />
</Box>

// After (AIBOS UI)
import { Button, Card, Input } from '@aibos/ui';

<Button variant="primary" size="lg">
  AIBOS Button
</Button>

<Card className="p-4">
  <Input placeholder="Email" />
</Card>
```

### **From Ant Design**

```tsx
// Before (Ant Design)
import { Button, Card, Input } from 'antd';

<Button type="primary" size="large">
  Ant Button
</Button>

<Card>
  <Input placeholder="Email" />
</Card>

// After (AIBOS UI)
import { Button, Card, Input } from '@aibos/ui';

<Button variant="primary" size="lg">
  AIBOS Button
</Button>

<Card>
  <Input placeholder="Email" />
</Card>
```

---

## 📋 **Best Practices**

### **1. Use Semantic Tokens**

```tsx
// ✅ Good - Semantic tokens
<Button className="bg-semantic-primary text-semantic-primary-foreground">
  Primary Action
</Button>

// ❌ Bad - Hardcoded colors
<Button className="bg-blue-600 text-white">
  Primary Action
</Button>
```

### **2. Leverage Polymorphic Behavior**

```tsx
// ✅ Good - Polymorphic components
<Button as="a" href="/dashboard">Go to Dashboard</Button>
<Button as="div" onClick={handleClick}>Custom Element</Button>

// ❌ Bad - Wrapping components
<a href="/dashboard">
  <Button>Go to Dashboard</Button>
</a>
```

### **3. Optimize Imports**

```tsx
// ✅ Good - Tree-shakable imports
import { Button } from '@aibos/ui/primitives/button';
import { Card } from '@aibos/ui/components/card';

// ✅ Also good - Main import (still optimized)
import { Button, Card } from '@aibos/ui';

// ❌ Bad - Source imports
import { Button } from '@aibos/ui/src/primitives/button';
```

### **4. Handle Loading States**

```tsx
// ✅ Good - Loading states
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Spinner className="mr-2" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</Button>

// ❌ Bad - No loading feedback
<Button onClick={handleSubmit}>
  Submit
</Button>
```

### **5. Accessibility First**

```tsx
// ✅ Good - Accessible components
<Button 
  aria-label="Close dialog"
  onClick={onClose}
>
  ×
</Button>

<Input 
  aria-describedby="email-help"
  aria-invalid={hasError}
/>
<div id="email-help">Enter your email address</div>

// ❌ Bad - Missing accessibility
<Button onClick={onClose}>×</Button>
<Input />
```

---

## ⚡ **Performance Optimization**

### **Bundle Size Optimization**

```tsx
// ✅ Optimal - Individual imports
import { Button } from '@aibos/ui/primitives/button';
import { Card } from '@aibos/ui/components/card';

// ✅ Good - Main import (still tree-shakable)
import { Button, Card } from '@aibos/ui';

// ❌ Avoid - Importing entire library
import * as UI from '@aibos/ui';
```

### **Dynamic Imports**

```tsx
// ✅ Good - Dynamic imports for heavy components
import { lazy, Suspense } from 'react';

const DataGrid = lazy(() => import('@aibos/ui/components/data-grid'));
const DataTable = lazy(() => import('@aibos/ui/components/data-table'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DataGrid data={data} />
    </Suspense>
  );
}
```

### **Performance Monitoring**

```tsx
// ✅ Good - Performance monitoring
import { PerformanceMonitor } from '@aibos/ui';

function App() {
  return (
    <PerformanceMonitor>
      <YourApp />
    </PerformanceMonitor>
  );
}
```

---

## ♿ **Accessibility Guidelines**

### **WCAG 2.2 AAA Compliance**

All components meet WCAG 2.2 AAA standards:

```tsx
// ✅ Accessible button
<Button 
  aria-label="Close dialog"
  onClick={onClose}
  className="focus:ring-2 focus:ring-semantic-primary"
>
  ×
</Button>

// ✅ Accessible form
<Form>
  <FormField
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email Address</FormLabel>
        <FormControl>
          <Input 
            type="email"
            aria-describedby="email-help"
            aria-invalid={hasError}
            {...field}
          />
        </FormControl>
        <FormMessage />
        <FormDescription id="email-help">
          Enter your email address
        </FormDescription>
      </FormItem>
    )}
  />
</Form>
```

### **Keyboard Navigation**

```tsx
// ✅ Keyboard accessible
<Button 
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</Button>

// ✅ Focus management
<Modal 
  onOpenChange={setOpen}
  onEscapeKeyDown={() => setOpen(false)}
>
  {/* Modal content */}
</Modal>
```

### **Screen Reader Support**

```tsx
// ✅ Screen reader friendly
<Button 
  aria-label="Delete item"
  aria-describedby="delete-help"
>
  🗑️
</Button>
<div id="delete-help">
  This will permanently delete the item
</div>

// ✅ Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {notification}
</div>
```

---

## 🚀 **Production Deployment**

### **Build Process**

```bash
# Production build
pnpm run build

# Validate build
pnpm run validate

# Check bundle size
pnpm run size

# Analyze bundle
pnpm run analyze
```

### **Bundle Analysis**

```bash
# Check bundle budgets
pnpm run size

# Detailed analysis
pnpm run analyze
```

**Current Bundle Metrics:**
- **Main Bundle**: 26.37KB (target: ≤150KB) ✅
- **Total Initial JS**: 29.70KB (target: ≤220KB) ✅
- **Largest Async Chunk**: 5.75KB (target: ≤180KB) ✅
- **Individual Components**: <1KB each (target: ≤50KB) ✅

### **CDN Deployment**

```html
<!-- CDN Usage -->
<script src="https://cdn.aibos-ui.com/latest/index.js"></script>
<link rel="stylesheet" href="https://cdn.aibos-ui.com/latest/styles.css">
```

### **NPM Publishing**

```bash
# Publish to npm
pnpm publish

# Publish with validation
pnpm run prepublishOnly
```

---

## 📊 **Monitoring & Analytics**

### **Performance Monitoring**

```tsx
import { PerformanceMonitor } from '@aibos/ui';

function App() {
  return (
    <PerformanceMonitor
      onMetrics={(metrics) => {
        // Send metrics to analytics service
        analytics.track('performance', metrics);
      }}
    >
      <YourApp />
    </PerformanceMonitor>
  );
}
```

### **Error Tracking**

```tsx
import { ErrorBoundary } from '@aibos/ui';

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Send error to tracking service
        errorTracking.captureException(error, errorInfo);
      }}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

### **Usage Analytics**

```tsx
// Component usage tracking
import { trackComponentUsage } from '@aibos/ui';

function MyComponent() {
  useEffect(() => {
    trackComponentUsage('MyComponent', { variant: 'primary' });
  }, []);

  return <Button variant="primary">Tracked Button</Button>;
}
```

---

## 📚 **Additional Resources**

### **Documentation Links**

- [Component API Reference](./api/) - Complete API documentation
- [Design System Guide](./design-system/) - Design principles and tokens
- [Performance Guide](./performance/) - Performance optimization
- [Accessibility Guide](./accessibility/) - Accessibility compliance
- [Migration Guide](./migration/) - Migration from other libraries

### **Support Channels**

- [GitHub Issues](https://github.com/pohlai88/aibos-ui/issues) - Bug reports and feature requests
- [Community Forum](https://community.aibos-ui.com) - Community discussions
- [Enterprise Support](https://enterprise.aibos-ui.com) - Enterprise support

### **Contributing**

- [Contributing Guide](./contributing/) - How to contribute
- [Code of Conduct](./code-of-conduct/) - Community guidelines
- [Development Setup](./development/) - Development environment

---

## 🎯 **Quick Reference**

### **Common Patterns**

```tsx
// Form with validation
<Form onSubmit={handleSubmit}>
  <FormField name="email" render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input type="email" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )} />
  <Button type="submit">Submit</Button>
</Form>

// Data table with sorting
<Table enableSorting enableFiltering>
  <TableHeader>
    <TableRow>
      <TableHead sortable>Name</TableHead>
      <TableHead sortable>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.email}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// Modal with form
<Modal>
  <ModalTrigger asChild>
    <Button>Open Modal</Button>
  </ModalTrigger>
  <ModalContent>
    <ModalHeader>
      <ModalTitle>Edit User</ModalTitle>
    </ModalHeader>
    <ModalBody>
      <Form onSubmit={handleSubmit}>
        {/* Form fields */}
      </Form>
    </ModalBody>
    <ModalFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="primary">Save</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

### **Import Patterns**

```tsx
// Primitives
import { Button, Input, Checkbox, Switch, Badge } from '@aibos/ui';

// Components
import { Card, Modal, Table, Form, Navigation } from '@aibos/ui';

// Hooks
import { useTheme, useMediaQuery, useToast } from '@aibos/ui';

// Utilities
import { cn, variants, polymorphic } from '@aibos/ui';

// Performance
import { PerformanceMonitor, measureRenderTime } from '@aibos/ui';
```

---

**Built with ❤️ for the AI-BOS ERP system**

*Empowering enterprise applications with world-class UI components*

---

## 📄 **License**

MIT License - see [LICENSE](./LICENSE) file for details.

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📞 **Support**

- **Documentation**: [docs.aibos-ui.com](https://docs.aibos-ui.com)
- **Issues**: [GitHub Issues](https://github.com/pohlai88/aibos-ui/issues)
- **Community**: [Discord](https://discord.gg/aibos-ui)
- **Enterprise**: [jackwee@ai-bos.io](mailto:jackwee@ai-bos.io)

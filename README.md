# AI-BOS UI Library

A pure UI component library SDK built with React, TypeScript, and Tailwind CSS.

## 🎯 **Pure UI SDK**

This repository contains a **pure UI component library** designed as an SDK/npm package:

- **UI Components** (`@aibos/ui`) - Complete React component library with Tailwind CSS

## 🚀 **Quick Start**

### **Prerequisites**

- **Node.js**: 20+ (LTS recommended)
- **pnpm**: 9+ (package manager)

### **Installation & Setup**

```bash
# 1. Clone the repository
git clone <repository-url>
cd aibos-ui

# 2. Install dependencies
pnpm install

# 3. Build the package
pnpm build

# 4. Run tests
pnpm test
```

### **Development Commands**

| Command            | Purpose            | Description                                 |
| ------------------ | ------------------ | ------------------------------------------- |
| `pnpm dev`         | Start development  | Watch mode for UI package                  |
| `pnpm build`      | Build package      | Production build for UI package             |
| `pnpm test`        | Run tests          | Unit tests                                  |
| `pnpm lint`        | Code quality       | ESLint checks                               |
| `pnpm typecheck`   | Type safety        | TypeScript compilation checks               |
| `pnpm clean`       | Clean build files  | Remove all dist and cache files             |

## 🎨 **UI Component Library (@aibos/ui)**

### **Features**

- **Dark-First Theme**: WCAG 2.2 AAA accessibility compliance
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **Tree-Shaking**: Optimized imports for minimal bundle size
- **Accessibility**: Built-in accessibility features

### **Installation**

```bash
# Install the UI package
npm install @aibos/ui

# Install peer dependencies
npm install react react-dom
```

### **Usage Example**

```tsx
import { Button, Card, Badge } from '@aibos/ui';

export function MyComponent() {
  return (
    <Card className="p-6">
      <Badge variant="primary">Status</Badge>
      <Button variant="primary" size="lg">
        Action
      </Button>
    </Card>
  );
}
```

### **Styling Setup**

The package includes CSS files that need to be imported:

```tsx
// In your main CSS file or component
import '@aibos/ui/styles/globals.css';
import '@aibos/ui/styles/utilities.css';
```

## 🧪 **Testing**

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch
```

## 🔒 **Security & Quality**

- **ESLint**: Code quality and security rules
- **TypeScript**: Type safety and compile-time checks
- **Pre-commit Hooks**: Automated quality gates

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](packages/ui/LICENSE) file for details.

---

**Built with ❤️ by the AI-BOS UI Team**
# AIBOS ERP UI-Business Package Installation Guide

## 🚀 **Quick Start**

### **What is UI-Business Package?**
The `@aibos/ui-business` package is a **frontend UI component library** that provides:
- Business-specific React components
- Financial UI widgets and charts
- Accounting form components
- Business logic utilities for the frontend

**Important**: This package does NOT connect to databases directly. It communicates with backend services through APIs.

### **Prerequisites**
- Node.js 18+ (LTS recommended)
- pnpm 8+ (recommended package manager)
- Git
- VS Code (recommended IDE)

### **1. Install Node.js**
```bash
# Download from https://nodejs.org/
# Or use a version manager like nvm

# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### **2. Install pnpm**
```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### **3. Clone Repository**
```bash
# Clone the repository
git clone <repository-url>
cd aibos-erp

# Install all dependencies
pnpm install
```

### **4. Build UI-Business Package**
```bash
# Build the UI-Business package
cd packages/ui-business
pnpm build

# Verify build output
ls dist/
# Should see: index.js, index.cjs, types/
```

### **5. Use in Your Application**
```bash
# In your Next.js app or React app
npm install @aibos/ui-business

# Import components
import { NumberFormattingSettings } from '@aibos/ui-business';
```

## 📦 **Package Development**

### **UI Business Package Development**
```bash
cd packages/ui-business

# Install dependencies
pnpm install

# Build the package
pnpm run build

# Run linting
pnpm run lint

# Run type checking
pnpm run typecheck

# Run tests (when available)
pnpm run test
```

### **Integration with Backend**
The UI-Business package communicates with backend services through:
- REST API calls
- GraphQL queries
- WebSocket connections
- gRPC services

**Example API Integration:**
```typescript
// In your application using ui-business components
import { NumberFormattingSettings } from '@aibos/ui-business';

// Configure API endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Use components with backend data
const MyComponent = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Fetch data from backend API
    fetch(`${API_BASE_URL}/api/accounting/data`)
      .then(res => res.json())
      .then(setData);
  }, []);
  
  return (
    <NumberFormattingSettings 
      value={data?.amount} 
      currency="USD" 
    />
  );
};
```

## 🛠️ **Development Tools Setup**

### **VS Code Extensions**
Install the following extensions for optimal development experience:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-react-native",
    "ms-vscode.vscode-jest",
    "ms-vscode.vscode-playwright"
  ]
}
```

### **Git Hooks Setup**
```bash
# Install husky hooks
pnpm run prepare

# This will set up pre-commit hooks for:
# - Linting
# - Type checking
# - Formatting
# - Testing
```

## 🔧 **Configuration**

### **Environment Variables for Applications Using UI-Business**
When using the UI-Business package in your application, configure these environment variables:

```bash
# API Configuration (in your app, not in ui-business)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Optional: Feature flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Optional: Theme configuration
NEXT_PUBLIC_THEME=light
NEXT_PUBLIC_CURRENCY=USD
NEXT_PUBLIC_LOCALE=en-US
```

**Note**: The UI-Business package itself doesn't need environment variables. These are for the applications that consume the package.

### **TypeScript Configuration**
The project uses strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### **ESLint Configuration**
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off"
  }
}
```

## 🧪 **Testing Setup**

### **Unit Testing**
```bash
# Run unit tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Run tests in watch mode
pnpm run test:watch
```

### **E2E Testing**
```bash
# Install Playwright browsers
pnpm exec playwright install

# Run E2E tests
pnpm run test:e2e

# Run E2E tests in UI mode
pnpm run test:e2e:ui
```

### **Testing Configuration**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

## 🚀 **Publishing & Distribution**

### **Build for Distribution**
```bash
# Build the package for npm publishing
cd packages/ui-business
pnpm run build

# Verify build output
ls dist/
# Should contain: index.js, index.cjs, types/
```

### **Publishing to npm**
```bash
# Login to npm (if not already logged in)
npm login

# Publish the package
npm publish

# Or publish with specific tag
npm publish --tag beta
```

### **Using in Applications**
```bash
# Install in your application
npm install @aibos/ui-business

# Or install specific version
npm install @aibos/ui-business@1.0.0
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. Build Errors**
```bash
# Clear build cache
rm -rf dist/
rm -rf node_modules/.cache

# Rebuild package
pnpm run build
```

#### **2. TypeScript Errors**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
rm -rf dist/

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"

# Run type checking
pnpm run typecheck
```

#### **3. Import/Export Issues**
```bash
# Check package exports in package.json
cat package.json | grep -A 10 '"exports"'

# Verify build output
ls dist/
# Should see: index.js, index.cjs, types/
```

#### **4. Dependency Issues**
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

#### **5. Linting Errors**
```bash
# Run linting
pnpm run lint

# Fix auto-fixable issues
pnpm run lint --fix
```

### **Performance Issues**

#### **1. Slow Build Times**
```bash
# Use pnpm for faster installs
pnpm install

# Enable build caching
export TURBO_FORCE=false
```

#### **2. Bundle Size Issues**
```bash
# Analyze bundle size
pnpm run build
ls -la dist/

# Check for unnecessary dependencies
pnpm list --depth=0
```

## 📚 **Additional Resources**

### **Package Development**
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TSUP Documentation](https://tsup.egoist.dev/)
- [ESLint Documentation](https://eslint.org/docs/)

### **UI Component Libraries**
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)

### **Testing Resources**
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### **Architecture**
- [Monorepo Best Practices](https://monorepo.tools/)
- [Package.json Exports](https://nodejs.org/api/packages.html#exports)

---

**Need Help?** Check our [Architecture Standards](./ARCHITECTURE_STANDARDS.md) or [contact support](mailto:support@aibos.com).

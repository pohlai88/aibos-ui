# 🚨 Package Configuration Standard v2.0

## ⚠️ CRITICAL: Zero Configuration Sprawl Policy

**NEVER create manual configurations. Always copy from proven working packages. Consistency > Optimization.**

## 🎯 Centralized Configuration Strategy

### Root-Level Single Source of Truth

**✅ TypeScript Build Exclusions** - `tsconfig.build.base.json`:
```json
{
  "exclude": [
    "**/*.test.*", "**/*.spec.*", "**/__tests__/**", "**/__mocks__/**",
    "**/tests/**", "**/test/**", "**/e2e/**", "**/integration/**", "**/fixtures/**",
    "**/*.stories.*", "**/*.story.*", "**/*.snap", "coverage/**",
    "**/examples/**", "**/scripts/**", "**/performance/**",
    "**/*.config.*", "**/vitest.config.*", "**/playwright.config.*"
  ]
}
```

**✅ ESLint Global Ignores** - `eslint.config.js`:
```javascript
{
  ignores: [
    // Build artifacts
    'node_modules/', 'dist/', 'build/', '.next/', 'coverage/',
    '**/*.gen.ts', '**/*.generated.ts', '**/dist/**', '**/build/**',
    '**/apps/web/.next/**', '**/apps/web/.next/types/**',
    '**/apps/web/.next/static/**', '**/apps/web/.next/server/**',
    
    // Test files - SINGLE SOURCE OF TRUTH
    '**/*.test.*', '**/*.spec.*', '**/__tests__/**', '**/__mocks__/**',
    '**/tests/**', '**/test/**', '**/e2e/**', '**/integration/**',
    '**/fixtures/**', '**/*.stories.*', '**/*.story.*', '**/*.snap',
    'coverage/**',
  ],
}
```

## 📋 Standard Package Configurations

### 1. TypeScript Configuration (`tsconfig.json`)

**✅ ALWAYS COPY FROM WORKING PACKAGES:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

**❌ NEVER ADD:**
- `exclude` patterns (handled by root config)
- Custom compiler options not in working packages
- `rootDir` or `outDir` in main tsconfig.json

### 2. TypeScript Types Configuration (`tsconfig.types.json`)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "emitDeclarationOnly": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist/types",
    "stripInternal": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

### 3. TSUP Configuration (`tsup.config.ts`)

**Backend Packages** (utils, accounting, eventsourcing, policy, observability, contracts):
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false,
  sourcemap: true,
  clean: false,
  splitting: false,
  target: 'es2022',
  treeshake: true,
  minify: true,
  external: ['node:*'],
});
```

**Frontend Packages** (ui, ui-business, accounting-web):
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false,
  splitting: true,
  sourcemap: true,
  clean: false,
  treeshake: true,
  skipNodeModulesBundle: true,
  minify: true,
  target: 'es2022',
  external: [
    'react', 'react-dom',
    '@radix-ui/react-accordion', '@radix-ui/react-checkbox',
    '@radix-ui/react-dialog', '@radix-ui/react-menu',
    '@radix-ui/react-popover', '@radix-ui/react-radio-group',
    '@radix-ui/react-select', '@radix-ui/react-slot',
    '@radix-ui/react-switch', '@radix-ui/react-tabs',
    '@radix-ui/react-toast', '@radix-ui/react-tooltip',
    'class-variance-authority', 'clsx', 'tailwind-merge', 'lucide-react',
  ],
  esbuildOptions(options) {
    options.treeShaking = true;
    options.drop = ['console', 'debugger'];
  },
});
```

### 4. ESLint Configuration (`eslint.config.js`)

**✅ ALWAYS EXTEND ROOT CONFIG:**

```javascript
import base from '../../eslint.config.js';

export default [
  // Extend root config (includes centralized ignores)
  ...base,

  // Package-specific overrides ONLY
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Package-specific rules only
      'security/detect-object-injection': 'error', // or 'warn' for utils
      'complexity': ['warn', 18], // UI: 18, UI-Business: 20, Utils: 20
      'max-lines-per-function': ['warn', 70], // UI: 70, UI-Business: 80
    },
  },
];
```

**❌ NEVER ADD:**
- Duplicate ignore patterns
- Custom plugin configurations
- Standalone ESLint configs

### 5. Package.json Build Scripts

```json
{
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/types/src/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types/src/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build:types": "tsc -p tsconfig.types.json",
    "build:js": "tsup",
    "build": "pnpm run build:types && pnpm run build:js",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

## 🚨 Next.js App Configuration

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./.next",
    "composite": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "declaration": true,
    "emitDeclarationOnly": false,
    "target": "ES2017",
    "strict": false,
    "module": "esnext",
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "experimentalDecorators": false,
    "emitDecoratorMetadata": false,
    "useDefineForClassFields": true
  },
  "include": ["src/**/*", "next-env.d.ts", ".next/types/**/*.ts"]
}
```

### ESLint Configuration (`eslint.config.js`)

```javascript
import base from '../../eslint.config.js';

export default [
  // Extend root config (includes centralized ignores)
  ...base,

  // Next.js specific overrides
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', 'pages/**/*.{ts,tsx}'],
    rules: {
      // Next.js specific rules
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'error',
      'jsx-a11y/anchor-is-valid': 'off', // Next.js Link handles this
      'import/no-anonymous-default-export': 'off', // Next.js pages
    },
  },
];
```

### Next.js Configuration (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@aibos/accounting',
    '@aibos/accounting-contracts', 
    '@aibos/accounting-web',
    '@aibos/contracts',
    '@aibos/ui',
    '@aibos/utils',
  ],
};

export default nextConfig;
```

## 🎯 Package-Specific Rules Matrix

| Package Type | Complexity | Max Lines | Security | Externals |
|--------------|------------|-----------|----------|-----------|
| UI | 18 | 70 | error | React/Radix |
| UI-Business | 20 | 80 | error | React/Radix |
| Utils | 20 | - | warn | node:* |
| Backend | - | - | warn | node:* |
| Web App | - | - | error | Next.js rules |

## ✅ Validation Checklist

Before creating any package:

- [ ] `tsconfig.json` extends `../../tsconfig.base.json`
- [ ] `tsconfig.types.json` exists and matches pattern
- [ ] `tsup.config.ts` matches package type (backend/frontend)
- [ ] `eslint.config.js` extends root config
- [ ] `package.json` has correct build scripts and exports
- [ ] No duplicate exclude/ignore patterns
- [ ] All configs copied from working packages

## 🚫 Anti-Patterns to AVOID

1. **❌ Manual test exclusions** - Use centralized root configs
2. **❌ Standalone ESLint configs** - Always extend root
3. **❌ Different tsup targets** - Always use `es2022`
4. **❌ Custom compiler options** - Copy from working packages
5. **❌ Duplicate ignore patterns** - Single source of truth

## 🔄 Package Creation Process

1. **Copy entire config from working package**
2. **Only modify package name and dependencies**
3. **Never deviate from proven patterns**
4. **Test build immediately**
5. **Verify no config sprawl**
6. **Run `pnpm syncpack:check` to verify dependency consistency**

## 📦 Dependency Management (Syncpack)

### Syncpack Configuration (`.syncpackrc.json`)

**✅ Enforced Version Consistency:**
- **Node.js**: `>=20.18.0` (LTS until 2026)
- **TypeScript**: `5.9.2` (exact)
- **ESLint**: `9.36.0` (exact)
- **Prettier**: `3.6.2` (exact)
- **TSUP**: `8.5.0` (exact)
- **Turbo**: `^2.5.8` (caret)
- **Vitest**: `^2.1.9` (caret)
- **React**: `^18.3.1` (caret)
- **Next.js**: `^15.5.4` (caret)
- **Tailwind**: `^3.4.17` (caret)

**✅ Workspace Package Rules:**
- All `@aibos/*` packages must use `workspace:*` for internal dependencies
- External packages cannot depend on workspace packages
- Circular dependencies between workspace packages are forbidden

**✅ Package.json Scripts:**
```json
{
  "scripts": {
    "syncpack:check": "syncpack list-mismatches",
    "syncpack:fix": "syncpack fix-mismatches"
  },
  "engines": {
    "node": ">=20.18.0",
    "npm": "DISALLOWED",
    "pnpm": ">=9.0.0"
  }
}
```

**✅ Validation Commands:**
- `pnpm syncpack:check` - Check for version mismatches
- `pnpm syncpack:fix` - Fix version mismatches automatically

## 🚀 Developer Experience (DX) Functions

### DX Command Hierarchy

**✅ Core DX Functions:**
- `pnpm dx` - Full development workflow (format, lint, typecheck, test, dep:check, syncpack)
- `pnpm dx:quick` - Essential config validation (syncpack only)
- `pnpm dx:validate` - Config + linting validation
- `pnpm dx:config` - Configuration consistency check
- `pnpm dx:build` - Build validation
- `pnpm dx:format` - Format + syncpack check
- `pnpm dx:full` - Full workflow + architecture validation

**✅ Usage Patterns:**
- **Daily Development**: `pnpm dx:quick` (fastest validation)
- **Pre-commit**: `pnpm dx:validate` (config + lint)
- **Pre-push**: `pnpm dx` (full workflow)
- **CI/CD**: `pnpm dx:full` (full workflow + architecture validation)
- **Configuration Changes**: `pnpm dx:config` (config consistency)

**✅ DX Function Benefits:**
- **Consistency**: All packages use identical tooling
- **Speed**: Cached operations with Turbo
- **Reliability**: Zero configuration sprawl enforcement
- **Maintainability**: Single command for complex workflows

## 🧹 Package.json Maintenance

### ✅ Cleaned Scripts (Removed Deprecated/Unused)

**❌ Removed Deprecated Scripts:**
- `danger` - Deprecated CI tool
- `lint:accessibility` - Required external service
- `lint:audit-trail` - Unused enterprise tool
- `lint:bundle` - Unused bundle analyzer
- `lint:data-retention` - Unused enterprise tool
- `lint:gdpr` - Unused compliance tool
- `lint:licenses` - Unused license checker
- `lint:performance` - Required external service
- `lint:pii` - Unused PII detector
- `lint:security` - Required external service
- `test:chaos` - Unused chaos testing
- `test:contract` - Unused contract testing
- `test:mutation` - Unused mutation testing

**❌ Removed Deprecated Configuration:**
- `workspaces` field (deprecated in pnpm, using `pnpm-workspace.yaml`)

**❌ Removed Unused Dependencies:**
- `@pact-foundation/pact` - Unused contract testing

### ✅ Safe Version Updates (No Breaking Changes)

**✅ Patch Updates Only:**
- `fast-glob`: `3.3.0` → `3.3.3`
- `knip`: `5.63.1` → `5.64.1`
- `lint-staged`: `16.1.6` → `16.2.1`

**🛡️ Prevented Breaking Changes:**
- **Reverted**: `zod` major version (would require refactoring)
- **Reverted**: `vitest` major version (would require refactoring)
- **Reverted**: `@types/node` major version (would require refactoring)

### ✅ Fixed Clean Function

**🔧 Issue**: `rimraf` not accessible in PATH when `node_modules` missing
**✅ Solution**: Use PowerShell commands with graceful error handling

```json
{
  "scripts": {
    "clean": "powershell -Command \"if (Test-Path 'dist') { Remove-Item -Recurse -Force 'dist' }; if (Test-Path '.turbo') { Remove-Item -Recurse -Force '.turbo' }; if (Test-Path '.next') { Remove-Item -Recurse -Force '.next' }; if (Test-Path 'tsconfig.tsbuildinfo') { Remove-Item -Force 'tsconfig.tsbuildinfo' }; if (Test-Path 'node_modules') { Remove-Item -Recurse -Force 'node_modules' }\" && pnpm store prune || echo 'Store prune completed with warnings'"
  }
}
```

**✅ Benefits:**
- **Works without dependencies**: No need for `rimraf` or `node_modules`
- **Graceful error handling**: Continues even if store prune fails
- **Cross-platform**: Uses PowerShell for Windows compatibility
- **Safe**: Only removes directories that exist

---

**🚨 REMEMBER: Zero configuration sprawl. Consistency > Optimization. Copy > Create.**

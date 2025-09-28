# Code Quality Utilities Guide

This guide explains how to use the utils package to resolve common code quality issues identified by ESLint.

## 🎯 Common Issues Resolved

### 1. Null vs Undefined Usage (`unicorn/no-null`)

**Problem:** ESLint prefers `undefined` over `null` for consistency.

**Solution:** Use the null/undefined conversion utilities:

```typescript
import { nullToUndefined, undefinedToNull, safeCoalesce } from '@aibos/utils';

// Convert null to undefined for internal code
const internalValue = nullToUndefined(externalValue);

// Convert undefined to null for DTO/DB/JSON
const dtoValue = undefinedToNull(internalValue);

// Safe nullish coalescing
const finalValue = safeCoalesce(value, 'default');
```

### 2. Duplicate Strings (`sonarjs/no-duplicate-string`)

**Problem:** Repeated string literals reduce maintainability.

**Solution:** Use string constants and registry:

```typescript
import { createStringConstant, COMMON_STRINGS } from '@aibos/utils';

// Create string constants
const STATUS_ACTIVE = createStringConstant('STATUS_ACTIVE', 'active');
const STATUS_INACTIVE = createStringConstant('STATUS_INACTIVE', 'inactive');

// Use common strings
const separator = COMMON_STRINGS.COMMA;
const emptyValue = COMMON_STRINGS.EMPTY;
```

### 3. Unused Collections (`sonarjs/no-unused-collection`)

**Problem:** Collections created but never accessed.

**Solution:** Use safe collections that track usage:

```typescript
import { createSafeArray, createSafeSet } from '@aibos/utils';

// Safe array that tracks usage
const items = createSafeArray<string>();
items.add('item1');
items.add('item2');

// Check if collection has been used
if (!items.hasBeenAccessed()) {
  console.warn('Collection created but never accessed');
}

// Access the collection
const allItems = items.getAll();
```

### 4. Object Injection (`security/detect-object-injection`)

**Problem:** Dynamic object property access can be unsafe.

**Solution:** Use safe object builder with key validation:

```typescript
import { createSafeObjectBuilder } from '@aibos/utils';

// Define allowed keys
const allowedKeys = ['name', 'age', 'email'];

// Create safe object builder
const userBuilder = createSafeObjectBuilder<{
  name: string;
  age: number;
  email: string;
}>(allowedKeys);

// Safely set properties
userBuilder.set('name', 'John Doe').set('age', 30).set('email', 'john@example.com');

// Build the final object
const user = userBuilder.build();
```

## 🛠️ Available Utilities

### Null/Undefined Handling

- `nullToUndefined(value)` - Convert null to undefined
- `undefinedToNull(value)` - Convert undefined to null
- `safeCoalesce(value, fallback)` - Safe nullish coalescing
- `isNullish(value)` - Check if value is null or undefined
- `isNotNullish(value)` - Check if value is not null or undefined

### String Management

- `createStringConstant(key, value)` - Create a string constant
- `getStringConstant(key)` - Get a string constant by key
- `COMMON_STRINGS` - Pre-defined common strings
- `safeToString(value)` - Safely convert value to string

### Collection Management

- `createSafeArray<T>()` - Create a safe array
- `createSafeSet<T>()` - Create a safe set
- `SafeArray<T>` - Safe array class with usage tracking
- `SafeSet<T>` - Safe set class with usage tracking

### Object Injection Prevention

- `createSafeObjectBuilder<T>(allowedKeys?)` - Create safe object builder
- `SafeObjectBuilder<T>` - Safe object builder class
- `createDict<T>()` - Create null-prototype dictionary
- `safeGet(dict, key)` - Safe object property access
- `safeSet(dict, key, value)` - Safe object property assignment

### Counter Utilities

- `createSafeCounter()` - Create a safe counter
- `safeIncrement(counter, key)` - Safely increment counter
- `safeGetCount(counter, key)` - Safely get counter value

## 📋 Migration Checklist

When fixing code quality issues, follow this checklist:

### ✅ Null vs Undefined

- [ ] Replace `null` with `undefined` for internal code
- [ ] Use `nullToUndefined()` for external data
- [ ] Use `undefinedToNull()` for DTO/DB/JSON
- [ ] Use `safeCoalesce()` for fallback values

### ✅ Duplicate Strings

- [ ] Identify repeated string literals
- [ ] Create string constants with `createStringConstant()`
- [ ] Use `COMMON_STRINGS` for common values
- [ ] Replace hardcoded strings with constants

### ✅ Unused Collections

- [ ] Replace `Array` with `createSafeArray()`
- [ ] Replace `Set` with `createSafeSet()`
- [ ] Check `hasBeenAccessed()` before creating collections
- [ ] Use `getAll()` to access collection contents

### ✅ Object Injection

- [ ] Replace direct object access with `safeGet()`
- [ ] Replace direct object assignment with `safeSet()`
- [ ] Use `createSafeObjectBuilder()` for complex objects
- [ ] Define allowed keys for object builders

## 🚀 Best Practices

### 1. Consistent Null Handling

```typescript
// ❌ Inconsistent
function processUser(user: User | null) {
  if (user === null) return null;
  return user.name;
}

// ✅ Consistent
function processUser(user: User | undefined) {
  const safeUser = safeCoalesce(user, { name: 'Unknown' });
  return safeUser.name;
}
```

### 2. String Constants

```typescript
// ❌ Duplicate strings
const status1 = 'active';
const status2 = 'active';
const status3 = 'active';

// ✅ String constants
const STATUS_ACTIVE = createStringConstant('STATUS_ACTIVE', 'active');
const status1 = STATUS_ACTIVE;
const status2 = STATUS_ACTIVE;
const status3 = STATUS_ACTIVE;
```

### 3. Safe Collections

```typescript
// ❌ Unused collection
const items = [];
items.push('item1');
items.push('item2');
// Never accessed

// ✅ Safe collection
const items = createSafeArray<string>();
items.add('item1');
items.add('item2');
const allItems = items.getAll(); // Explicitly access
```

### 4. Safe Object Access

```typescript
// ❌ Unsafe object access
const value = obj[dynamicKey];

// ✅ Safe object access
const value = safeGet(obj, dynamicKey);
```

## 🔧 Integration with ESLint

These utilities are designed to work seamlessly with your ESLint configuration:

- `unicorn/no-null` - Use `nullToUndefined()` and `undefinedToNull()`
- `sonarjs/no-duplicate-string` - Use `createStringConstant()` and `COMMON_STRINGS`
- `sonarjs/no-unused-collection` - Use `createSafeArray()` and `createSafeSet()`
- `security/detect-object-injection` - Use `safeGet()`, `safeSet()`, and `createSafeObjectBuilder()`

## 📚 Examples

See `packages/utils/src/examples/code-quality-examples.ts` for comprehensive examples of how to use these utilities in real-world scenarios.

## 🤝 Contributing

When adding new utilities to resolve code quality issues:

1. Follow the existing patterns
2. Add comprehensive JSDoc comments
3. Include usage examples
4. Update this guide
5. Add tests for the new utilities

# 🧮 Complexity Thresholds - Enterprise Guidelines

**Document**: Complexity Rules Configuration  
**Date**: December 2024  
**Status**: ✅ **UPDATED** - Enterprise-Appropriate Thresholds

---

## 📊 **Updated Complexity Thresholds**

### **Main ESLint Configuration (`eslint.config.js`)**

```typescript
// Complexity rules - Enterprise-appropriate thresholds
complexity: ['warn', 20],                    // Increased from 12 to 20
'max-depth': ['warn', 5],                   // Increased from 4 to 5
'max-lines-per-function': ['warn', 80],     // Increased from 50 to 80
'sonarjs/cognitive-complexity': ['warn', 25], // Increased from 15 to 25
```

### **UI Package Configuration (`packages/ui/eslint.config.js`)**

```typescript
// Quality rules - UI-appropriate thresholds
complexity: ['warn', 20],                   // Increased from 12 to 20
'sonarjs/cognitive-complexity': ['warn', 25], // Increased from 18 to 25
```

### **UI Package Specific Rules**

```typescript
// Keep complexity realistic, fail egregious cases
'sonarjs/cognitive-complexity': ['error', 30], // Increased from 20 to 30
```

---

## 🎯 **Rationale for Changes**

### **Why These Thresholds?**

#### **1. Enterprise Business Logic Complexity**

- **Accounting Rules**: Complex financial calculations require higher complexity
- **Policy Evaluation**: Multi-tenant ABAC rules naturally increase complexity
- **Data Validation**: Comprehensive validation logic needs more branches

#### **2. UI Component Complexity**

- **Form Components**: Complex forms with validation, conditional rendering
- **Data Tables**: Sorting, filtering, pagination, selection logic
- **Modal Dialogs**: Multi-step workflows, conditional content

#### **3. Real-World Examples**

**✅ Acceptable Complexity (15-20):**

```typescript
// Policy evaluator with multiple conditions
function can(actions: Action[], userRoles: string[], context: Context, policy: Policy): boolean {
  // 1) Expand role bundles per tenant policy
  const allowed = new Set(userRoles.flatMap((role) => policy.roles[role] ?? []));

  // 2) Invariant SoD check (non-negotiable)
  if (violatesSoD(actions)) return false;

  // 3) All requested actions must be allowed by role bundle
  if (!actions.every((action) => allowed.has(action))) return false;

  // 4) ABAC (tenant-configurable)
  for (const action of actions) {
    const rule = policy.abac[action];
    if (!rule) continue;

    // Self-approval ban
    if (
      rule.banSelfApproval &&
      action === 'journal:approve' &&
      context.createdBy === context.currentUserId
    ) {
      return false;
    }

    // Amount thresholds
    const defaultLimit = rule.maxAmount?.default ?? Number.POSITIVE_INFINITY;
    const roleLimits = userRoles.map((role) => {
      return Object.hasOwn(rule.maxAmount ?? {}, role)
        ? (rule.maxAmount?.[role] ?? Number.NEGATIVE_INFINITY)
        : Number.NEGATIVE_INFINITY;
    });
    const limit = Math.max(defaultLimit, ...roleLimits);
    if ((context.amount ?? 0) > limit) return false;
  }

  return true;
}
```

**✅ Acceptable UI Complexity (20-25):**

```typescript
// Complex form validation with conditional logic
function validateFormData(data: FormData, context: ValidationContext): ValidationResult {
  const errors: string[] = [];

  // Basic field validation
  if (!data.name?.trim()) errors.push('Name is required');
  if (!data.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.push('Valid email required');

  // Conditional validation based on form type
  if (data.formType === 'accounting') {
    if (!data.accountCode?.match(/^\d{4}$/)) errors.push('Account code must be 4 digits');
    if (data.accountType === 'revenue' && data.balance < 0) {
      errors.push('Revenue accounts cannot have negative balances');
    }
  }

  // Business rule validation
  if (data.amount && data.amount > 1000000) {
    if (!data.approvalLevel || data.approvalLevel < 2) {
      errors.push('Amounts over $1M require Level 2+ approval');
    }
  }

  // Multi-tenant validation
  if (context.tenantId === 'enterprise') {
    if (data.category && !ENTERPRISE_CATEGORIES.includes(data.category)) {
      errors.push('Category not allowed for enterprise tenant');
    }
  }

  return { isValid: errors.length === 0, errors };
}
```

---

## 🚨 **When to Refactor**

### **Red Flags (Exceed Thresholds)**

- **Complexity > 30**: Consider breaking into smaller functions
- **Max Depth > 6**: Extract nested logic into separate functions
- **Lines > 100**: Split into logical sections

### **Refactoring Strategies**

#### **1. Extract Methods**

```typescript
// ❌ Before - High complexity
function processTransaction(data: TransactionData): ProcessResult {
  // 25+ lines of complex logic
  if (data.type === 'journal') {
    if (data.amount > 10000) {
      if (data.approver === data.creator) {
        // Complex approval logic
      }
    }
  }
  // ... more complex logic
}

// ✅ After - Extracted methods
function processTransaction(data: TransactionData): ProcessResult {
  const validationResult = validateTransaction(data);
  if (!validationResult.isValid) return { error: validationResult.errors };

  const approvalResult = checkApprovalRequirements(data);
  if (!approvalResult.approved) return { error: approvalResult.reasons };

  return executeTransaction(data);
}
```

#### **2. Strategy Pattern**

```typescript
// ✅ Use strategy pattern for complex conditional logic
const transactionStrategies = {
  journal: new JournalTransactionStrategy(),
  payment: new PaymentTransactionStrategy(),
  adjustment: new AdjustmentTransactionStrategy(),
};

function processTransaction(data: TransactionData): ProcessResult {
  const strategy = transactionStrategies[data.type];
  return strategy.process(data);
}
```

---

## 📈 **Monitoring & Metrics**

### **Complexity Tracking**

- **Regular Reviews**: Monthly complexity audits
- **Threshold Alerts**: Automated warnings at 80% of limits
- **Refactoring Backlog**: Track high-complexity functions for improvement

### **Quality Gates**

- **New Code**: Must be under thresholds
- **Refactoring**: Existing high-complexity code gets priority
- **Documentation**: Complex functions require detailed comments

---

## 🎯 **Benefits of Updated Thresholds**

1. **✅ Realistic Expectations**: Appropriate for enterprise complexity
2. **✅ Developer Productivity**: Less friction, more focus on business logic
3. **✅ Maintainable Code**: Still prevents egregious complexity
4. **✅ Quality Assurance**: Maintains code quality standards
5. **✅ Team Alignment**: Clear guidelines for all developers

---

## 📋 **Summary**

| Rule                           | Old Threshold | New Threshold | Reason                    |
| ------------------------------ | ------------- | ------------- | ------------------------- |
| `complexity`                   | 12            | 20            | Enterprise business logic |
| `max-depth`                    | 4             | 5             | Nested conditional logic  |
| `max-lines-per-function`       | 50            | 80            | Comprehensive functions   |
| `sonarjs/cognitive-complexity` | 15-20         | 25-30         | Complex UI components     |

**Result**: More realistic thresholds that accommodate enterprise complexity while maintaining code quality standards.

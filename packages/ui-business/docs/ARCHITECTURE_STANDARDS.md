# AIBOS ERP Accounting UI/UX Architecture Standards

## 🚨 **MANDATORY COMPLIANCE - NO EXCEPTIONS**

This document defines **NON-NEGOTIABLE** standards for the AIBOS ERP accounting UI/UX development. Every developer MUST follow these standards exactly. No deviations, no "creative interpretations", no exceptions.

---

## 📁 **DIRECTORY STRUCTURE STANDARDS**

### **REQUIRED STRUCTURE:**

```
packages/ui-business/src/accounting/
├── components/              # ALL UI components
│   ├── primitives/         # Atomic components
│   ├── molecules/          # Composite components
│   ├── organisms/          # Complex components
│   ├── ai/                 # AI-specific components
│   └── templates/          # Page-level layouts
├── hooks/                  # Custom React hooks
├── services/               # UI-specific services
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
└── constants/               # Constants and configuration
```

### **FORBIDDEN PATTERNS:**

- ❌ NO nested subdirectories in `components/` beyond specified levels
- ❌ NO scattered component files
- ❌ NO duplicate service locations
- ❌ NO documentation in source directories

---

## 🔗 **BACKEND CONSUMPTION STANDARDS**

### **MANDATORY**: Workspace Import Pattern

```typescript
// ✅ CORRECT: Import from workspace packages
import { AccountingService } from '@aibos/accounting';
import { Account, JournalEntry } from '@aibos/accounting';
import { CreateAccountCommand } from '@aibos/accounting';

// ✅ CORRECT: Import from design system
import { Button, Input, Card } from '@aibos/ui';

// ❌ FORBIDDEN: Direct REST API calls from UI
// fetch('/api/v1/accounting/accounts') // NEVER DO THIS
```

### **INTEGRATION POINTS**:

- **Domain Models**: Import from `@aibos/accounting/src/domain/`
- **Services**: Import from `@aibos/accounting/src/services/`
- **Commands**: Import from `@aibos/accounting/src/commands/`
- **Events**: Import from `@aibos/accounting/src/events/`
- **Validation**: Import from `@aibos/accounting/src/validation/`
- **UI Components**: Import from `@aibos/ui`

---

## 📝 **FILE NAMING STANDARDS**

### **COMPONENTS (UI Elements):**

```typescript
// Pattern: {purpose}.tsx (lowercase with hyphens)
account-selector.tsx;
journal-entry-form.tsx;
trial-balance-table.tsx;
financial-dashboard.tsx;
```

### **HOOKS (Custom React Hooks):**

```typescript
// Pattern: use-{purpose}.ts
use-accounting-data.ts;
use-journal-entry.ts;
use-financial-reports.ts;
use-ai-assistant.ts;
```

### **SERVICES (UI Services):**

```typescript
// Pattern: {purpose}.service.ts
ui-integration.service.ts;
component-state.service.ts;
user-preferences.service.ts;
```

### **TYPES (TypeScript Definitions):**

```typescript
// Pattern: {purpose}.types.ts
accounting.types.ts;
journal-entry.types.ts;
financial-reports.types.ts;
```

### **UTILITIES (Helper Functions):**

```typescript
// Pattern: {purpose}.util.ts
format-currency.util.ts;
validate-amount.util.ts;
calculate-balance.util.ts;
```

---

## 🏗️ **ARCHITECTURAL STANDARDS**

### **COMPONENT ARCHITECTURE:**

```typescript
// ✅ CORRECT: Component structure
export function AccountSelector({ 
  accounts, 
  onSelect, 
  className 
}: AccountSelectorProps) {
  // Component implementation
}

// ✅ CORRECT: Props interface
interface AccountSelectorProps {
  accounts: Account[];
  onSelect: (account: Account) => void;
  className?: string;
}

// ❌ FORBIDDEN: Inline props
// export function AccountSelector(props: any) // NEVER DO THIS
```

### **HOOK ARCHITECTURE:**

```typescript
// ✅ CORRECT: Custom hook structure
export function useAccountingData(tenantId: string) {
  const [data, setData] = useState<AccountingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Hook implementation
  
  return { data, loading, error, refetch };
}

// ❌ FORBIDDEN: Direct API calls in hooks
// fetch('/api/v1/accounting/data') // NEVER DO THIS
```

### **SERVICE ARCHITECTURE:**

```typescript
// ✅ CORRECT: Service structure
export class UIIntegrationService {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly eventBus: EventBus
  ) {}

  async getAccountingData(tenantId: string): Promise<AccountingData> {
    return this.accountingService.getData(tenantId);
  }
}

// ❌ FORBIDDEN: Direct external calls
// fetch('https://external-api.com') // NEVER DO THIS
```

---

## 🎨 **DESIGN SYSTEM INTEGRATION**

### **MANDATORY**: Design System First

```typescript
// ✅ CORRECT: Import from design system first
import { Button, Input, Card, Badge } from '@aibos/ui';
import { AccountingService } from '@aibos/accounting';

// ✅ CORRECT: Create new in design system if not available
// packages/ui/src/components/accounting/account-selector.tsx

// ❌ FORBIDDEN: Bypassing design system
// <button>Click me</button> // NEVER DO THIS
```

### **COMPONENT COMPOSITION:**

```typescript
// ✅ CORRECT: Compose from design system
export function JournalEntryForm() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Journal Entry</Card.Title>
      </Card.Header>
      <Card.Content>
        <Input placeholder="Reference" />
        <Button>Save Entry</Button>
      </Card.Content>
    </Card>
  );
}

// ❌ FORBIDDEN: Custom styling
// <div style={{ padding: '16px' }}> // NEVER DO THIS
```

---

## 🧪 **TESTING STANDARDS**

### **TEST ORGANIZATION:**

```
packages/ui-business/src/accounting/
├── components/
│   ├── account-selector.tsx
│   └── account-selector.test.tsx
├── hooks/
│   ├── use-accounting-data.ts
│   └── use-accounting-data.test.ts
└── services/
    ├── ui-integration.service.ts
    └── ui-integration.service.test.ts
```

### **TEST NAMING:**

```typescript
// Pattern: {source-file}.test.tsx
account-selector.test.tsx;
use-accounting-data.test.ts;
ui-integration.service.test.ts;
```

### **TEST STRUCTURE:**

```typescript
describe('AccountSelector', () => {
  describe('when accounts are loaded', () => {
    it('should display all accounts', () => {
      // Arrange
      const accounts = [mockAccount1, mockAccount2];
      
      // Act
      render(<AccountSelector accounts={accounts} onSelect={jest.fn()} />);
      
      // Assert
      expect(screen.getByText('Account 1')).toBeInTheDocument();
      expect(screen.getByText('Account 2')).toBeInTheDocument();
    });
  });
});
```

---

## 📦 **MODULE STANDARDS**

### **COMPONENT EXPORTS:**

```typescript
// packages/ui-business/src/accounting/components/index.ts
export { AccountSelector } from './primitives/account-selector';
export { JournalEntryForm } from './molecules/journal-entry-form';
export { AccountingDashboard } from './organisms/accounting-dashboard';

// packages/ui-business/src/accounting/hooks/index.ts
export { useAccountingData } from './use-accounting-data';
export { useJournalEntry } from './use-journal-entry';
export { useFinancialReports } from './use-financial-reports';
```

### **MAIN PACKAGE EXPORTS:**

```typescript
// packages/ui-business/src/accounting/index.ts
export * from './components';
export * from './hooks';
export * from './services';
export * from './types';
export * from './utils';
```

---

## 🚫 **FORBIDDEN PATTERNS**

### **NEVER DO THIS:**

- ❌ Direct REST API calls from UI components
- ❌ Bypassing design system components
- ❌ Creating components outside designated directories
- ❌ Mixing naming conventions
- ❌ Using `any` type in TypeScript
- ❌ Ignoring accessibility requirements
- ❌ Creating unnecessary subdirectories
- ❌ Scattering related files
- ❌ Using inconsistent test patterns
- ❌ Skipping error handling
- ❌ Creating duplicate services
- ❌ Ignoring performance requirements

---

## ✅ **COMPLIANCE CHECKLIST**

Before submitting any code:

- [ ] File names follow exact patterns
- [ ] Directory structure matches requirements
- [ ] Components properly exported
- [ ] Tests in correct location with correct naming
- [ ] Imports use workspace packages
- [ ] Design system components used
- [ ] No forbidden patterns used
- [ ] TypeScript strict mode enabled
- [ ] Accessibility requirements met
- [ ] Performance benchmarks satisfied

---

## 🔍 **CODE REVIEW REQUIREMENTS**

Every PR MUST be reviewed for:

1. **Naming Convention Compliance**
2. **Directory Structure Compliance**
3. **Backend Consumption Compliance**
4. **Design System Integration Compliance**
5. **Test Organization Compliance**
6. **Architecture Pattern Compliance**

**NO EXCEPTIONS. NO "IT'S JUST A SMALL CHANGE".**

---

## 📊 **METRICS & MONITORING**

We track:

- File naming compliance rate
- Directory structure violations
- Backend consumption violations
- Design system compliance rate
- Test coverage by category
- Component export organization
- Performance benchmarks

**Target: 100% compliance. No exceptions.**

---

## 🎯 **ENFORCEMENT**

- **Automated**: Linting rules enforce naming and structure
- **Manual**: Code reviews check compliance
- **CI/CD**: Build fails on violations
- **Documentation**: This README is the source of truth

**Violations result in PR rejection. Period.**

---

## 🔄 **PHASE-SPECIFIC STANDARDS**

### **Phase 1: Foundation Architecture**
- Focus on component structure and design system integration
- Establish naming conventions and directory structure
- Implement basic workspace imports

### **Phase 2: Intelligent Data Entry**
- Add AI-specific components and services
- Implement AI service integration patterns
- Establish AI component naming conventions

### **Phase 3: Financial Intelligence**
- Add analytics components and services
- Implement data visualization patterns
- Establish reporting component structure

### **Phase 4: Reporting & Compliance**
- Add reporting components and services
- Implement compliance validation patterns
- Establish report generation structure

### **Phase 5: Workflow Automation**
- Add workflow components and services
- Implement process automation patterns
- Establish workflow component structure

### **Phase 6: Integration & Ecosystem**
- Add integration components and services
- Implement external system integration patterns
- Establish integration component structure

### **Phase 7: Security & Access**
- Add security components and services
- Implement access control patterns
- Establish security component structure

### **Phase 8: Analytics & Business Intelligence**
- Add BI components and services
- Implement analytics visualization patterns
- Establish BI component structure

### **Phase 9: User Experience & Personalization**
- Add UX components and services
- Implement personalization patterns
- Establish UX component structure

### **Phase 10: Innovation & Future-Proofing**
- Add innovation components and services
- Implement future technology patterns
- Establish innovation component structure

---

## 📚 **REFERENCE DOCUMENTS**

- [Phase 1: Foundation Architecture](./phase-1-foundation-architecture.md)
- [Phase 2: Intelligent Data Entry](./phase-2-intelligent-data-entry.md)
- [Phase 3: Financial Intelligence](./phase-3-financial-intelligence.md)
- [Phase 4: Reporting & Compliance](./phase-4-reporting-compliance.md)
- [Phase 5: Workflow Automation](./phase-5-workflow-automation.md)
- [Phase 6: Integration & Ecosystem](./phase-6-integration-ecosystem.md)
- [Phase 7: Security & Access](./phase-7-security-access.md)
- [Phase 8: Analytics & Business Intelligence](./phase-8-analytics-intelligence.md)
- [Phase 9: User Experience & Personalization](./phase-9-user-experience.md)
- [Phase 10: Innovation & Future-Proofing](./phase-10-innovation-future.md)

---

**This document is the single source of truth for AIBOS ERP accounting UI/UX development standards. No deviations allowed.**

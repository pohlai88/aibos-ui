# @aibos/accounting-web

**Enterprise-grade accounting web components for AIBOS ERP**

A comprehensive collection of accounting-specific web components built on top of the AIBOS UI-Business design system. These components provide ready-to-use accounting functionality with real-time data integration and professional financial reporting.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run type checking
pnpm typecheck

# Run tests
pnpm test
```

## 📦 Usage

### Basic Import

```tsx
import {
  FinancialDashboard,
  JournalEntryForm,
  TrialBalance,
  ChartOfAccounts,
  useAccounting,
} from '@aibos/accounting-web';
```

### Financial Dashboard

```tsx
import { FinancialDashboard } from '@aibos/accounting-web';

function AccountingView() {
  return (
    <FinancialDashboard
      tenantId="tenant-123"
      companyId="company-456"
      period="2024-Q4"
      showCharts={true}
      showVarianceAnalysis={true}
    />
  );
}
```

### Journal Entry Form

```tsx
import { JournalEntryForm, useAccounting } from '@aibos/accounting-web';

function JournalEntryView() {
  const { postJournalEntry, loading, error } = useAccounting();

  const handleSubmit = async (entry) => {
    try {
      await postJournalEntry(entry);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return <JournalEntryForm onSubmit={handleSubmit} loading={loading} error={error} />;
}
```

### Trial Balance

```tsx
import { TrialBalance, useAccounting } from '@aibos/accounting-web';

function TrialBalanceView() {
  const { loadTrialBalance, trialBalance, loading, error } = useAccounting();

  useEffect(() => {
    loadTrialBalance({
      asOf: '2024-12-31',
      tenantId: 'tenant-123',
    });
  }, []);

  return (
    <TrialBalance
      data={trialBalance}
      loading={loading}
      error={error}
      onRefresh={() =>
        loadTrialBalance({
          asOf: '2024-12-31',
          tenantId: 'tenant-123',
        })
      }
    />
  );
}
```

### Chart of Accounts

```tsx
import { ChartOfAccounts, useAccounting } from '@aibos/accounting-web';

function ChartOfAccountsView() {
  const { listAccounts, loading, error } = useAccounting();

  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    listAccounts({ companyId: 'company-456' }).then(setAccounts).catch(console.error);
  }, []);

  return (
    <ChartOfAccounts
      accounts={accounts}
      loading={loading}
      error={error}
      onAccountSelect={(account) => console.log('Selected:', account)}
    />
  );
}
```

## 🏗️ Architecture

```
src/
├── components/              # Accounting web components
│   ├── ChartOfAccounts.tsx
│   ├── FinancialDashboard.tsx
│   ├── JournalEntryForm.tsx
│   └── TrialBalance.tsx
├── hooks/                   # Custom React hooks
│   └── useAccounting.ts
├── lib/                     # API client and utilities
│   └── accounting-api.ts
└── index.ts                 # Main exports
```

## 🎨 Design Principles

### **Accounting-Specific Components**

- **Financial Data Integration**: Components work with real accounting data
- **Professional Reporting**: Enterprise-grade financial reports and dashboards
- **Audit Trail Support**: Complete transaction history and compliance tracking
- **Multi-Company Support**: Handle consolidated and entity-level accounting

### **Enterprise Features**

- **Real-time Data**: Live updates from accounting backend
- **Interactive Dashboards**: Drill-down capabilities and detailed analysis
- **Export Functionality**: PDF reports, Excel exports, and board packs
- **Role-based Access**: User permission enforcement and data security

### **Performance Optimized**

- **Efficient Data Loading**: Optimized API calls and caching
- **Lazy Loading**: On-demand component and data loading
- **Virtual Scrolling**: Handle large datasets efficiently
- **Memoized Components**: Optimal re-rendering performance

## 📊 Available Components

### **Financial Dashboard**

- **OutstandingCFODashboard**: Comprehensive financial command center
- **Financial Charts**: P&L, Balance Sheet, Cash Flow visualizations
- **Trend Analysis**: Multi-metric performance tracking
- **Variance Analysis**: Budget vs actual comparisons
- **Interactive Features**: Drill-down, export, and real-time updates

### **Accounting Forms**

- **JournalEntryForm**: Complete journal entry creation and editing
- **Account Selection**: Integrated chart of accounts picker
- **Validation**: Real-time validation and error handling
- **Audit Trail**: Complete transaction history tracking

### **Financial Reports**

- **TrialBalance**: Comprehensive trial balance with drill-down
- **ChartOfAccounts**: Hierarchical account structure navigation
- **Financial Statements**: P&L, Balance Sheet, Cash Flow reports
- **Custom Reports**: Flexible report generation and export

## 🔧 Component Props

### **FinancialDashboard**

```tsx
interface FinancialDashboardProperties {
  tenantId: string; // Required tenant identifier
  companyId?: string; // Optional company filter
  period?: string; // Reporting period (default: '2024-Q4')
  showCharts?: boolean; // Show financial charts (default: true)
  showVarianceAnalysis?: boolean; // Show variance analysis (default: true)
}
```

### **JournalEntryForm**

```tsx
interface JournalEntryFormProps {
  onSubmit: (entry: TJournalEntry) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  initialData?: Partial<TJournalEntry>;
  onCancel?: () => void;
}
```

### **TrialBalance**

```tsx
interface TrialBalanceProps {
  data: TTrialBalance | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onDrillDown?: (account: string) => void;
}
```

## 🎯 Business Use Cases

### **Financial Reporting**

- **Monthly Close**: Complete month-end closing process
- **Board Reporting**: Generate board packs and presentations
- **Audit Support**: Provide audit-ready financial statements
- **Compliance**: Meet regulatory reporting requirements

### **Transaction Management**

- **Journal Entries**: Create and manage accounting transactions
- **Account Management**: Maintain chart of accounts
- **Reconciliation**: Bank and account reconciliation processes
- **Approval Workflows**: Multi-level approval processes

### **Analytics & Insights**

- **Financial Analysis**: Comprehensive financial performance analysis
- **Trend Analysis**: Historical performance tracking
- **Variance Analysis**: Budget vs actual performance
- **Cash Flow Management**: Liquidity and cash flow monitoring

## 🛡️ Data Security

### **Access Control**

- **Tenant Isolation**: Multi-tenant data separation
- **Role-Based Access**: User permission enforcement
- **Audit Trails**: Complete activity logging
- **Data Encryption**: Secure data transmission

### **Compliance**

- **MFRS Compliance**: Malaysian Financial Reporting Standards
- **SOX Compliance**: Sarbanes-Oxley requirements
- **Data Retention**: Automated data lifecycle management
- **Privacy Protection**: Personal data handling

## 🚀 Performance

### **Optimization Features**

- **Efficient API Calls**: Optimized data fetching strategies
- **Caching**: Intelligent data caching and invalidation
- **Lazy Loading**: On-demand component and data loading
- **Virtual Scrolling**: Efficient large dataset handling

### **Bundle Size**

- **Tree Shaking**: Individual component imports
- **Code Splitting**: Route-based splitting
- **Compression**: Gzip and Brotli compression
- **CDN**: Global content delivery

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### **Test Coverage**

- **Unit Tests**: Component logic and API integration
- **Integration Tests**: Data flow and user interactions
- **Visual Tests**: Screenshot comparisons
- **Accessibility Tests**: WCAG compliance

## 📋 Quality Gates

- ✅ **Type Safety**: Full TypeScript coverage
- ✅ **Performance**: Optimized rendering and API calls
- ✅ **Accessibility**: WCAG 2.1 AA compliance
- ✅ **Testing**: Comprehensive test coverage
- ✅ **Documentation**: Complete API documentation
- ✅ **Security**: Data protection and access control

## 🔌 API Integration

### **AccountingClient**

The `AccountingClient` provides methods for all accounting operations:

```tsx
const client = new AccountingClient();

// Journal Entries
await client.postJournalEntry(entry);

// Trial Balance
const trialBalance = await client.getTrialBalance({ asOf: '2024-12-31', tenantId: 'tenant-123' });

// Chart of Accounts
const accounts = await client.listAccounts({ companyId: 'company-456' });

// Financial Chart Data
const profitLossData = await client.getProfitLossData({
  period: '2024-Q4',
  tenantId: 'tenant-123',
  companyId: 'company-456',
  periods: 4,
});

const balanceSheetData = await client.getBalanceSheetData({
  period: '2024-Q4',
  tenantId: 'tenant-123',
  companyId: 'company-456',
  periods: 4,
});

const cashFlowData = await client.getCashFlowData({
  period: '2024-Q4',
  tenantId: 'tenant-123',
  companyId: 'company-456',
  periods: 4,
});

const trendData = await client.getTrendData({
  period: '2024-Q4',
  tenantId: 'tenant-123',
  companyId: 'company-456',
  metrics: ['revenue', 'grossProfit', 'operatingIncome', 'netIncome'],
  periods: 4,
});

const varianceData = await client.getVarianceData({
  period: '2024-Q4',
  tenantId: 'tenant-123',
  companyId: 'company-456',
  metric: 'revenue',
  periods: 4,
});
```

### **useAccounting Hook**

The `useAccounting` hook provides React integration:

```tsx
const {
  loading,
  error,
  trialBalance,
  postJournalEntry,
  loadTrialBalance,
  getProfitLossData,
  getBalanceSheetData,
  getCashFlowData,
  getTrendData,
  getVarianceData,
} = useAccounting();
```

## 🤝 Contributing

1. **Follow Accounting Domain Patterns** - Use existing components as templates
2. **Maintain Data Contracts** - Ensure compatibility with accounting contracts
3. **Add Comprehensive Tests** - Cover business logic and API integration
4. **Update Documentation** - Keep README and examples current
5. **Ensure Performance** - Monitor impact on bundle size and API calls
6. **Validate Accessibility** - Test with screen readers and keyboard navigation

## 📄 License

MIT License - see LICENSE file for details.

---

**Need help?** Check the [Developer Guide](../ui/README.md) or create an issue in the repository.

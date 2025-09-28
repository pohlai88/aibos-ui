# BFF Layer TODO - Infrastructure Tasks

## 🚨 **IMPORTANT: NO CROSS-DEVELOPMENT**
This TODO list is for **BFF infrastructure tasks only**. Do not implement accounting business logic here.

## 📋 **Infrastructure Tasks (BFF Layer)**

### **High Priority**

#### **1. Rate Limiting Middleware** 🔴
- **File**: `src/common/middleware/rate-limiting.middleware.ts`
- **Purpose**: Implement rate limiting for different endpoint categories
- **Configuration**:
  - `/exchange-rates/batch`: 100 requests/hour per tenant
  - Report endpoints: 50 requests/hour per tenant  
  - Compliance endpoints: 20 requests/hour per tenant
- **Dependencies**: Redis for rate limit storage
- **Status**: ❌ Not implemented

#### **2. Idempotency Middleware** 🔴
- **File**: `src/common/middleware/idempotency.middleware.ts`
- **Purpose**: Handle `Idempotency-Key` header for POST operations
- **Scope**: 
  - `POST /api/accounting/journal-entries`
  - `POST /api/accounting/ui/journal-entries`
  - `POST /api/accounting/invoices`
- **Dependencies**: Redis for idempotency key storage
- **Status**: ❌ Not implemented

#### **3. API Changelog Endpoint** 🔴
- **File**: `src/modules/api/changelog.controller.ts`
- **Purpose**: Serve API changelog at `/api/accounting/changelog`
- **Implementation**: Static documentation endpoint
- **Status**: ❌ Not implemented

### **Medium Priority**

#### **4. Enhanced Request Tracing** 🟡
- **File**: `src/common/interceptors/enhanced-correlation.interceptor.ts`
- **Purpose**: Enhance existing `CorrelationInterceptor` with `x-request-id` support
- **Features**:
  - Echo `x-request-id` in responses
  - Add request tracing to logs
  - Support distributed tracing
- **Status**: 🔄 Partially implemented (basic correlation exists)

#### **5. Authentication Enhancement** 🟡
- **File**: `src/modules/auth/enhanced-auth.service.ts`
- **Purpose**: Enhance existing auth with additional features
- **Features**:
  - Role-based access control
  - Token refresh handling
  - Session management
- **Status**: 🔄 Partially implemented (basic JWT exists)

### **Low Priority**

#### **6. API Versioning Infrastructure** 🟢
- **File**: `src/common/middleware/api-versioning.middleware.ts`
- **Purpose**: Support for `/api/v2/accounting` format
- **Features**:
  - Version header parsing
  - Route versioning
  - Deprecation warnings
- **Status**: ❌ Not implemented

## 🏗️ **Architecture Notes**

### **Current BFF Structure**
```
apps/bff/src/
├── common/
│   ├── interceptors/          # ✅ CorrelationInterceptor, TenantInterceptor
│   └── middleware/            # ❌ Rate limiting, Idempotency (to be added)
├── modules/
│   ├── auth/                  # ✅ Basic JWT auth
│   ├── accounting/            # ✅ Accounting module integration
│   └── api/                   # ❌ Changelog endpoint (to be added)
└── config/                    # ✅ Database config
```

### **Integration Points**
- **Accounting Module**: BFF provides infrastructure, accounting handles business logic
- **Cross-cutting Concerns**: All infrastructure handled in BFF layer
- **Clean Separation**: No business logic in BFF, no infrastructure in accounting

## 🚫 **What NOT to Implement Here**

- ❌ Accounting business logic (belongs in `packages/accounting`)
- ❌ Financial calculations (belongs in `packages/accounting`)
- ❌ Domain models (belongs in `packages/accounting`)
- ❌ Validation schemas (belongs in `packages/accounting`)

## 📝 **Implementation Guidelines**

1. **Use Existing Patterns**: Follow existing interceptor/middleware patterns
2. **Redis Integration**: Use existing Redis setup for rate limiting/idempotency
3. **NestJS Standards**: Follow NestJS decorators and dependency injection
4. **TypeScript Strict**: Maintain strict type safety
5. **Error Handling**: Use existing error handling patterns

## 🎯 **Success Criteria**

- [ ] Rate limiting middleware implemented and tested
- [ ] Idempotency middleware implemented and tested  
- [ ] API changelog endpoint serving documentation
- [ ] Enhanced request tracing with `x-request-id` support
- [ ] All infrastructure concerns handled in BFF layer
- [ ] Clean separation maintained between BFF and accounting module

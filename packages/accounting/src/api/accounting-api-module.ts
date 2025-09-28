import type { AccountingService } from '../services/accounting.service';
import type { InvoiceService } from '../services/invoice.service';
import type { InvoiceEventHandlerService } from '../services/invoice-event-handler.service';
import type { UIIntegrationService } from '../services/ui-integration.service';
import type { ExchangeRateService } from '../services/exchange-rate.service';
import type { StandardsComplianceService } from '../services/standards-compliance.service';
import type { Express, Request, Response } from 'express';

import { AccountingController } from './accounting-controller.js';
import { InvoiceController } from './invoice-controller.js';
import { UIControllerExpress } from './ui-controller-express.js';
import { ExchangeRateController } from './exchange-rate-controller.js';
import { ComplianceController } from './compliance-controller.js';
import { createAccountingRoutes } from './accounting-routes.js';
import { createInvoiceRoutes } from './invoice-routes.js';
import { createUIRoutes } from './ui-routes.js';
import { createExchangeRateRoutes } from './exchange-rate-routes.js';
import { createComplianceRoutes } from './compliance-routes.js';
import {
  validateCreateAccount,
  validatePostJournalEntry,
  validateReverseJournalEntry,
  validateReconciliation,
  validateQueryParameters,
  validateIssueInvoice,
  validateMarkAsSent,
  validateMarkAsPaid,
  validateCancelInvoice,
  validateExchangeRateQuery,
  validateExchangeRateUpdate,
  validateExchangeRateBatch,
  validateComplianceReport,
  validateTaxForm,
  validateUIRealTimeBalances,
  validateUIAccountsQuery,
  validateUIJournalEntriesQuery,
  errorHandler,
  requestLogger,
} from './validation.middleware.js';

// Constants
const API_BASE_PATH = '/api/accounting';
const HEALTH_ENDPOINT = '/health';
const API_VERSION = '1.0.0';
const TENANT_ID_PARAM = 'Path parameter - Tenant identifier';
const TENANT_ID_HEADER = 'string (required) - Tenant identifier';
const USER_ID_HEADER = 'string (required) - User identifier';
const ISO_DATE_STRING = 'string (optional) - ISO date string';
const ACCOUNT_CODE_FILTER = 'string (optional) - Account code filter';
const REFERENCE_FILTER = 'string (optional) - Reference filter';
const CURRENCY_CODE_PARAM = 'Path parameter - Source currency code (3 letters)';
const TARGET_CURRENCY_PARAM = 'Path parameter - Target currency code (3 letters)';
const PARENT_ACCOUNT_CODE = 'string (optional) - Parent account code for hierarchy';
const POSTING_DATE_OPTIONAL = 'string (optional) - ISO 8601 date';
const CURRENCY_CODE_OPTIONAL = 'string (optional) - Transaction currency, defaults to MYR';
const INCLUDE_INACTIVE_OPTIONAL = 'string (optional) - "true" or "false"';
const PARENT_CODE_FILTER = 'string (optional) - Parent account code filter';
const ACCOUNT_TYPE_FILTER = 'string (optional) - Account type filter';
const SEARCH_TERM_FILTER = 'string (optional) - Search term for account names';
const PARENT_ACCOUNT_CODE_OPTIONAL = 'string (optional) - Parent account code';
const DATE_OPTIONAL = 'string (optional) - ISO date string for historical rate';
const DATE_OPTIONAL_RATES = 'string (optional) - ISO date string for historical rates';
const DATE_OPTIONAL_DEFAULT = 'string (optional) - ISO date string, defaults to current date';
const SOURCE_OPTIONAL = 'string (optional) - Rate source identifier';
const JURISDICTION_FILTER = 'string (optional) - Jurisdiction filter';
const REPORT_TYPE_FILTER = 'string (optional) - Report type filter';
const REPORT_TYPE_ENUM = 'enum (required) - TAX, REGULATORY, AUDIT, FINANCIAL';
const PERIOD_FORMAT = 'string (required) - Period in YYYY-MM format';
const JURISDICTION_CODE = 'string (required) - Jurisdiction code';
const FORMAT_ENUM = 'enum (optional) - PDF, EXCEL, XML, JSON (default: PDF)';

/**
 * Public shape of API documentation. Keep in sync with controllers/routes.
 * (Lightweight alternative to a full OpenAPI emit here.)
 */
export interface AccountingApiDocumentation {
  title: string;
  version: string;
  description: string;
  baseUrl: string;
  endpoints: Record<string, unknown>;
  examples: Record<string, unknown>;
}

export class AccountingApiModule {
  private readonly controller: AccountingController;
  private readonly invoiceController: InvoiceController;
  private readonly uiController: UIControllerExpress;
  private readonly exchangeRateController: ExchangeRateController;
  private readonly complianceController: ComplianceController;

  /**
   * Constructor injects services that are used to create controllers.
   * The services themselves are not directly used in this module,
   * but are passed to their respective controllers.
   */
  constructor(
    accountingService: AccountingService,
    invoiceService: InvoiceService,
    invoiceEventHandlerService: InvoiceEventHandlerService,
    uiIntegrationService: UIIntegrationService,
    exchangeRateService: ExchangeRateService,
    standardsComplianceService: StandardsComplianceService,
  ) {
    this.controller = new AccountingController(accountingService);
    this.invoiceController = new InvoiceController(invoiceService, invoiceEventHandlerService);
    this.uiController = new UIControllerExpress(uiIntegrationService);
    this.exchangeRateController = new ExchangeRateController(exchangeRateService);
    this.complianceController = new ComplianceController(standardsComplianceService);
  }

  /**
   * Register accounting API routes with the Express app
   */
  public registerRoutes(app: Express): void {
    // Apply global middleware (logging first)
    app.use(API_BASE_PATH, requestLogger);

    // Create routers with validation middleware
    const accountingRouter = createAccountingRoutes(this.controller, {
      postAccount: [validateCreateAccount],
      postJournal: [validatePostJournalEntry],
      reverseJournal: [validateReverseJournalEntry],
      reconcile: [validateReconciliation],
      getQuery: [validateQueryParameters],
    });
    const invoiceRouter = createInvoiceRoutes(this.invoiceController, {
      getQuery: [validateQueryParameters],
      postInvoice: [validateIssueInvoice],
      putSend: [validateMarkAsSent],
      putPay: [validateMarkAsPaid],
      putCancel: [validateCancelInvoice],
    });
    const uiRouter = createUIRoutes(this.uiController, {
      getQuery: [validateQueryParameters],
      getAccountsQuery: [validateUIAccountsQuery],
      getJournalEntriesQuery: [validateUIJournalEntriesQuery],
      getContextQuery: [validateQueryParameters],
      postAccount: [validateCreateAccount],
      postJournal: [validatePostJournalEntry],
      postValidate: [validateUIRealTimeBalances],
      postBalances: [validateUIRealTimeBalances],
    });
    const exchangeRateRouter = createExchangeRateRoutes(this.exchangeRateController, {
      getQuery: [validateExchangeRateQuery],
      getRate: [validateExchangeRateQuery],
      postBatch: [validateExchangeRateBatch],
      updateRate: [validateExchangeRateUpdate],
      getHistory: [validateExchangeRateQuery],
      getCurrencies: [validateExchangeRateQuery],
    });
    const complianceRouter = createComplianceRoutes(this.complianceController, {
      generateReport: [validateComplianceReport],
      getStatus: [validateQueryParameters],
      generateTaxForm: [validateTaxForm],
      getRequirements: [validateQueryParameters],
      validateData: [validateComplianceReport],
      getCalendar: [validateQueryParameters],
      getQuery: [validateQueryParameters],
    });

    // Mount the routers
    app.use(API_BASE_PATH, accountingRouter);
    app.use(`${API_BASE_PATH}/invoices`, invoiceRouter);
    app.use(`${API_BASE_PATH}/ui`, uiRouter);
    app.use(`${API_BASE_PATH}/exchange-rates`, exchangeRateRouter);
    app.use(`${API_BASE_PATH}/compliance`, complianceRouter);

    // Health check endpoint
    app.get(`${API_BASE_PATH}${HEALTH_ENDPOINT}`, (_req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Accounting API is healthy',
        timestamp: new Date().toISOString(),
        version: API_VERSION,
      });
    });

    // 404 handler for unknown API routes under base path
    app.use(API_BASE_PATH, (_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        timestamp: new Date().toISOString(),
        version: API_VERSION,
      });
    });

    // Error handler LAST so it can catch errors from any above route.
    app.use(API_BASE_PATH, errorHandler);
  }

  /**
   * Get API documentation
   */
  public getApiDocumentation(): AccountingApiDocumentation {
    return {
      title: 'Accounting API',
      version: '1.0.0',
      description:
        'REST API for core accounting operations - chart of accounts and journal entries',
      baseUrl: '/api/accounting',
      endpoints: {
        accounts: {
          'POST /accounts': {
            description: 'Create a new account in the chart of accounts',
            parameters: {
              tenantId: TENANT_ID_PARAM,
            },
            body: {
              accountCode: 'string (required) - Unique account code',
              accountName: 'string (required) - Account display name',
              accountType: 'enum (required) - ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE',
              parentAccountCode: PARENT_ACCOUNT_CODE,
              isActive: 'boolean (optional) - Account status, defaults to true',
            },
          },
        },
        journalEntries: {
          'POST /journal-entries': {
            description: 'Post a new journal entry',
            parameters: {
              tenantId: TENANT_ID_PARAM,
            },
            body: {
              journalEntryId: 'string (required) - Unique journal entry identifier',
              entries: 'array (required) - Journal entry lines',
              reference: 'string (required) - Reference number',
              description: 'string (required) - Entry description',
              postingDate: POSTING_DATE_OPTIONAL,
              currencyCode: CURRENCY_CODE_OPTIONAL,
            },
          },
          'POST /journal-entries/:journalEntryId/reverse': {
            description: 'Reverse an existing journal entry by its identifier',
            parameters: {
              tenantId: TENANT_ID_PARAM,
              journalEntryId: 'Path parameter - Journal entry identifier to reverse',
            },
          },
          'POST /reconciliation/:tenantId/:period': {
            description: 'Perform account reconciliation for a tenant and period',
          },
        },
        ui: {
          'GET /ui/accounts': {
            description: 'Get accounts optimized for UI display',
            headers: {
              'x-tenant-id': TENANT_ID_HEADER,
              'x-user-id': USER_ID_HEADER,
            },
            query: {
              includeInactive: INCLUDE_INACTIVE_OPTIONAL,
              parentCode: PARENT_CODE_FILTER,
              accountType: ACCOUNT_TYPE_FILTER,
              searchTerm: SEARCH_TERM_FILTER,
            },
          },
          'POST /ui/accounts': {
            description: 'Create account from UI',
            headers: {
              'x-tenant-id': TENANT_ID_HEADER,
              'x-user-id': USER_ID_HEADER,
            },
            body: {
              accountCode: 'string (required) - Unique account code',
              accountName: 'string (required) - Account display name',
              accountType: 'string (required) - Account type',
              parentAccountCode: PARENT_ACCOUNT_CODE_OPTIONAL,
              postingAllowed: 'boolean (required) - Whether posting is allowed',
            },
          },
          'GET /ui/journal-entries': {
            description: 'Get journal entries optimized for UI display',
            headers: {
              'x-tenant-id': TENANT_ID_HEADER,
              'x-user-id': USER_ID_HEADER,
            },
            query: {
              startDate: ISO_DATE_STRING,
              endDate: ISO_DATE_STRING,
              accountCode: ACCOUNT_CODE_FILTER,
              reference: REFERENCE_FILTER,
              limit: 'number (optional) - Maximum results (0-1000)',
              offset: 'number (optional) - Results offset',
            },
          },
          'POST /ui/journal-entries': {
            description: 'Post journal entry from UI',
            headers: {
              'x-tenant-id': TENANT_ID_HEADER,
              'x-user-id': USER_ID_HEADER,
            },
            body: {
              journalEntryId: 'string (required) - Unique journal entry identifier',
              reference: 'string (required) - Reference number',
              description: 'string (required) - Entry description',
              postingDate: 'string (required) - ISO date string',
              entries: 'array (required) - Journal entry lines',
            },
          },
          'POST /ui/validate-balance': {
            description: 'Validate journal entry balance for real-time UI feedback',
            headers: {
              'x-tenant-id': TENANT_ID_HEADER,
              'x-user-id': USER_ID_HEADER,
            },
            body: {
              entries: 'array (required) - Journal entry lines to validate',
            },
          },
          'POST /ui/real-time-balances': {
            description: 'Get real-time balances for UI components',
            headers: {
              'x-tenant-id': TENANT_ID_HEADER,
              'x-user-id': USER_ID_HEADER,
            },
            body: {
              accountCodes: 'array (required) - Array of account codes',
            },
          },
          'GET /ui/context': {
            description: 'Get accounting context for UI components',
            headers: {
              'x-tenant-id': TENANT_ID_HEADER,
              'x-user-id': USER_ID_HEADER,
            },
          },
        },
        exchangeRates: {
          'GET /exchange-rates/:fromCurrency/:toCurrency': {
            description: 'Get exchange rate between two currencies',
            parameters: {
              tenantId: TENANT_ID_PARAM,
              fromCurrency: CURRENCY_CODE_PARAM,
              toCurrency: TARGET_CURRENCY_PARAM,
            },
            query: {
              date: DATE_OPTIONAL,
            },
          },
          'POST /exchange-rates/batch': {
            description: 'Get multiple exchange rates in a single request',
            parameters: {
              tenantId: TENANT_ID_PARAM,
            },
            body: {
              currencyPairs: 'array (required) - Array of {fromCurrency, toCurrency} objects',
              date: DATE_OPTIONAL_RATES,
            },
          },
          'PUT /exchange-rates/:fromCurrency/:toCurrency': {
            description: 'Update exchange rate manually',
            parameters: {
              tenantId: TENANT_ID_PARAM,
              fromCurrency: CURRENCY_CODE_PARAM,
              toCurrency: TARGET_CURRENCY_PARAM,
            },
            body: {
              rate: 'number (required) - Exchange rate value',
              date: DATE_OPTIONAL_DEFAULT,
              source: SOURCE_OPTIONAL,
            },
          },
          'GET /exchange-rates/:fromCurrency/:toCurrency/history': {
            description: 'Get exchange rate history',
            parameters: {
              tenantId: TENANT_ID_PARAM,
              fromCurrency: CURRENCY_CODE_PARAM,
              toCurrency: TARGET_CURRENCY_PARAM,
            },
            query: {
              startDate: ISO_DATE_STRING,
              endDate: ISO_DATE_STRING,
              limit: 'number (optional) - Maximum results (default: 30)',
            },
          },
          'GET /exchange-rates/currencies': {
            description: 'Get list of supported currencies',
            parameters: {
              tenantId: TENANT_ID_PARAM,
            },
          },
        },
        compliance: {
          'POST /compliance/reports': {
            description: 'Generate compliance report',
            parameters: {
              tenantId: TENANT_ID_PARAM,
            },
            body: {
              reportType: REPORT_TYPE_ENUM,
              period: PERIOD_FORMAT,
              jurisdiction: JURISDICTION_CODE,
              format: FORMAT_ENUM,
            },
          },
          'GET /compliance/status/:tenantId': {
            description: 'Get compliance status for tenant',
            parameters: {
              tenantId: TENANT_ID_PARAM,
            },
            query: {
              jurisdiction: JURISDICTION_FILTER,
            },
          },
          'POST /compliance/tax-forms': {
            description: 'Generate tax form',
            parameters: {
              tenantId: TENANT_ID_PARAM,
            },
            body: {
              formType: 'string (required) - Tax form type',
              taxYear: 'number (required) - Tax year (2000-2100)',
              jurisdiction: 'string (required) - Jurisdiction code',
              data: 'object (required) - Form data',
            },
          },
          'GET /compliance/requirements/:jurisdiction': {
            description: 'Get regulatory requirements for jurisdiction',
            parameters: {
              jurisdiction: 'Path parameter - Jurisdiction code',
            },
            query: {
              reportType: REPORT_TYPE_FILTER,
            },
          },
          'POST /compliance/validate': {
            description: 'Validate compliance data',
            parameters: {
              tenantId: TENANT_ID_PARAM,
            },
            body: {
              data: 'object (required) - Data to validate',
              reportType: REPORT_TYPE_ENUM,
              jurisdiction: 'string (required) - Jurisdiction code',
            },
          },
          'GET /compliance/calendar/:tenantId': {
            description: 'Get compliance calendar for tenant',
            parameters: {
              tenantId: TENANT_ID_PARAM,
            },
            query: {
              year: 'number (optional) - Year (default: current year)',
              jurisdiction: JURISDICTION_FILTER,
            },
          },
        },
        health: {
          'GET /health': {
            description: 'API health check',
          },
        },
      },
      examples: {
        createAccount: {
          method: 'POST',
          url: '/api/accounting/accounts',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            accountCode: '1000',
            accountName: 'Cash and Cash Equivalents',
            accountType: 'ASSET',
            parentAccountCode: '100',
            isActive: true,
          },
        },
        postJournalEntry: {
          method: 'POST',
          url: '/api/accounting/journal-entries',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            journalEntryId: 'JE-2024-001',
            entries: [
              {
                accountCode: '1000',
                debitAmount: 1000,
                description: 'Cash received',
              },
              {
                accountCode: '4000',
                creditAmount: 1000,
                description: 'Revenue earned',
              },
            ],
            reference: 'INV-001',
            description: 'Cash sale transaction',
            currencyCode: 'MYR',
          },
        },
      },
    };
  }
}

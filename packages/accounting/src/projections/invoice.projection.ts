/**
 * Invoice Projections
 *
 * Read-optimized projections for invoice data, customer balances, and accounts receivable.
 * Updated by processing invoice domain events.
 */

import type { DomainEvent as _DomainEvent } from '@aibos/eventsourcing';
import { InvoiceStatus, type PaymentTerms, type InvoiceTotals } from '../domain/invoice.domain';
import { omitUndefined } from '../utils';

/**
 * Invoice summary for read models
 */
export interface InvoiceSummary {
  readonly invoiceId: string;
  readonly tenantId: string;
  readonly customerId: string;
  readonly invoiceNumber: string;
  readonly status: InvoiceStatus;
  readonly totals: InvoiceTotals;
  readonly issueDate: Date;
  readonly dueDate: Date;
  readonly paymentTerms: PaymentTerms;
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Customer balance summary
 */
export interface CustomerBalance {
  readonly customerId: string;
  readonly tenantId: string;
  readonly totalOutstanding: number;
  readonly totalOverdue: number;
  readonly currency: string;
  readonly invoiceCount: number;
  readonly lastInvoiceDate?: Date;
  readonly lastPaymentDate?: Date;
}

/**
 * Accounts Receivable summary
 */
export interface AccountsReceivableSummary {
  readonly tenantId: string;
  readonly totalReceivables: number;
  readonly totalOverdue: number;
  readonly currency: string;
  readonly customerCount: number;
  readonly averageDaysOutstanding: number;
}

/**
 * Invoice Projection Manager
 *
 * Maintains read-optimized projections for invoice data.
 * Processes invoice domain events to keep projections up-to-date.
 */
export class InvoiceProjectionManager {
  private readonly invoices: Map<string, InvoiceSummary> = new Map();
  private readonly customerBalances: Map<string, CustomerBalance> = new Map();
  private readonly accountsReceivable: Map<string, AccountsReceivableSummary> = new Map();

  /**
   * Process invoice issued event
   */
  public async processInvoiceIssued(event: unknown): Promise<void> {
    const invoiceSummary: InvoiceSummary = {
      invoiceId: event.invoiceId,
      tenantId: event.tenantId,
      customerId: event.customerId,
      invoiceNumber: event.invoiceNumber,
      status: InvoiceStatus.ISSUED,
      totals: event.totals,
      issueDate: new Date(event.issueDate),
      dueDate: new Date(event.dueDate),
      paymentTerms: event.paymentTerms,
      notes: event.notes,
      createdAt: new Date(event.occurredAt),
      updatedAt: new Date(event.occurredAt),
    };

    this.invoices.set(event.invoiceId, invoiceSummary);
    await this._updateCustomerBalance(event.tenantId, event.customerId);
    await this._updateAccountsReceivable(event.tenantId);
  }

  /**
   * Process invoice sent event
   */
  public async processInvoiceSent(event: unknown): Promise<void> {
    const invoice = this.invoices.get(event.aggregateId);
    if (!invoice) return;

    const updatedInvoice: InvoiceSummary = {
      ...invoice,
      status: InvoiceStatus.SENT,
      updatedAt: new Date(event.occurredAt),
    };

    this.invoices.set(event.aggregateId, updatedInvoice);
  }

  /**
   * Process invoice paid event
   */
  public async processInvoicePaid(event: unknown): Promise<void> {
    const invoice = this.invoices.get(event.aggregateId);
    if (!invoice) return;

    const updatedInvoice: InvoiceSummary = {
      ...invoice,
      status: InvoiceStatus.PAID,
      updatedAt: new Date(event.occurredAt),
    };

    this.invoices.set(event.aggregateId, updatedInvoice);
    await this._updateCustomerBalance(event.tenantId, invoice.customerId);
    await this._updateAccountsReceivable(event.tenantId);
  }

  /**
   * Process invoice cancelled event
   */
  public async processInvoiceCancelled(event: unknown): Promise<void> {
    const invoice = this.invoices.get(event.aggregateId);
    if (!invoice) return;

    const updatedInvoice: InvoiceSummary = {
      ...invoice,
      status: InvoiceStatus.CANCELLED,
      updatedAt: new Date(event.occurredAt),
    };

    this.invoices.set(event.aggregateId, updatedInvoice);
    await this._updateCustomerBalance(event.tenantId, invoice.customerId);
    await this._updateAccountsReceivable(event.tenantId);
  }

  /**
   * Process invoice overdue event
   */
  public async processInvoiceOverdue(event: unknown): Promise<void> {
    const invoice = this.invoices.get(event.aggregateId);
    if (!invoice) return;

    const updatedInvoice: InvoiceSummary = {
      ...invoice,
      status: InvoiceStatus.OVERDUE,
      updatedAt: new Date(event.occurredAt),
    };

    this.invoices.set(event.aggregateId, updatedInvoice);
    await this._updateCustomerBalance(event.tenantId, invoice.customerId);
    await this._updateAccountsReceivable(event.tenantId);
  }

  /**
   * Get invoice by ID
   */
  public getInvoice(invoiceId: string): InvoiceSummary | undefined {
    return this.invoices.get(invoiceId);
  }

  /**
   * Get invoices by customer
   */
  public getInvoicesByCustomer(customerId: string, tenantId: string): InvoiceSummary[] {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.customerId === customerId && invoice.tenantId === tenantId,
    );
  }

  /**
   * Get customer balance
   */
  public getCustomerBalance(customerId: string, tenantId: string): CustomerBalance | undefined {
    const key = `${tenantId}-${customerId}`;
    return this.customerBalances.get(key);
  }

  /**
   * Get accounts receivable summary
   */
  public getAccountsReceivableSummary(tenantId: string): AccountsReceivableSummary | undefined {
    return this.accountsReceivable.get(tenantId);
  }

  /**
   * Get overdue invoices
   */
  public getOverdueInvoices(tenantId: string): InvoiceSummary[] {
    const now = new Date();
    return Array.from(this.invoices.values()).filter(
      (invoice) =>
        invoice.tenantId === tenantId &&
        invoice.status === InvoiceStatus.OVERDUE &&
        invoice.dueDate < now,
    );
  }

  /**
   * Update customer balance projection
   */
  private async _updateCustomerBalance(tenantId: string, customerId: string): Promise<void> {
    const customerInvoices = this.getInvoicesByCustomer(customerId, tenantId);

    const totalOutstanding = customerInvoices
      .filter(
        (invoice) =>
          invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE,
      )
      .reduce((sum, invoice) => sum + invoice.totals.totalAmount, 0);

    const totalOverdue = customerInvoices
      .filter((invoice) => invoice.status === InvoiceStatus.OVERDUE)
      .reduce((sum, invoice) => sum + invoice.totals.totalAmount, 0);

    const lastInvoiceDate =
      customerInvoices.length > 0
        ? new Date(Math.max(...customerInvoices.map((index) => index.issueDate.getTime())))
        : undefined;

    const currency = customerInvoices.length > 0 ? customerInvoices[0].totals.currency : 'MYR';

    const balance: CustomerBalance = omitUndefined({
      customerId,
      tenantId,
      totalOutstanding,
      totalOverdue,
      currency,
      invoiceCount: customerInvoices.length,
      lastInvoiceDate,
      lastPaymentDate: undefined, // Would be updated from payment events
    });

    const key = `${tenantId}-${customerId}`;
    this.customerBalances.set(key, balance);
  }

  /**
   * Update accounts receivable summary
   */
  private async _updateAccountsReceivable(tenantId: string): Promise<void> {
    const tenantInvoices = Array.from(this.invoices.values()).filter(
      (invoice) => invoice.tenantId === tenantId,
    );

    const totalReceivables = tenantInvoices
      .filter(
        (invoice) =>
          invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE,
      )
      .reduce((sum, invoice) => sum + invoice.totals.totalAmount, 0);

    const totalOverdue = tenantInvoices
      .filter((invoice) => invoice.status === InvoiceStatus.OVERDUE)
      .reduce((sum, invoice) => sum + invoice.totals.totalAmount, 0);

    const customerIds = new Set(tenantInvoices.map((invoice) => invoice.customerId));
    const currency = tenantInvoices.length > 0 ? tenantInvoices[0].totals.currency : 'MYR';

    // Calculate average days outstanding
    const now = new Date();
    const outstandingInvoices = tenantInvoices.filter(
      (invoice) =>
        invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE,
    );

    const totalDaysOutstanding = outstandingInvoices.reduce((sum, invoice) => {
      const daysDiff = Math.floor(
        (now.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return sum + daysDiff;
    }, 0);

    const averageDaysOutstanding =
      outstandingInvoices.length > 0 ? totalDaysOutstanding / outstandingInvoices.length : 0;

    const summary: AccountsReceivableSummary = {
      tenantId,
      totalReceivables,
      totalOverdue,
      currency,
      customerCount: customerIds.size,
      averageDaysOutstanding,
    };

    this.accountsReceivable.set(tenantId, summary);
  }
}

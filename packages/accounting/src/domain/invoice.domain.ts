/**
 * Invoice Domain Aggregate
 *
 * Represents a customer invoice with line items, tax calculations, and payment terms.
 * Follows DDD patterns with rich domain logic and event sourcing.
 */

import { randomUUID } from 'node:crypto';
import { type DomainEvent } from '@aibos/eventsourcing';
import { omitUndefined } from '../utils';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentTerms {
  NET_15 = 'NET_15',
  NET_30 = 'NET_30',
  NET_45 = 'NET_45',
  NET_60 = 'NET_60',
  DUE_ON_RECEIPT = 'DUE_ON_RECEIPT',
  CUSTOM = 'CUSTOM',
}

export interface InvoiceLineItem {
  readonly lineNumber: number;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly currency: string;
  readonly taxRate: number;
  readonly taxCode?: string;
  readonly accountCode: string; // Revenue account
}

export interface InvoiceTotals {
  readonly subtotal: number;
  readonly taxAmount: number;
  readonly totalAmount: number;
  readonly currency: string;
}

export class Invoice {
  private _invoiceId: string;
  private _tenantId: string;
  private _customerId: string;
  private _invoiceNumber: string;
  private _status: InvoiceStatus;
  private _lineItems: InvoiceLineItem[];
  private _totals!: InvoiceTotals;
  private _issueDate: Date;
  private _dueDate!: Date;
  private _paymentTerms: PaymentTerms;
  private _notes?: string;
  private _version: number;
  private _uncommittedEvents: DomainEvent[] = [];

  constructor(
    invoiceId: string,
    tenantId: string,
    customerId: string,
    invoiceNumber: string,
    lineItems: InvoiceLineItem[],
    issueDate: Date,
    paymentTerms: PaymentTerms,
    notes?: string,
  ) {
    this._invoiceId = invoiceId;
    this._tenantId = tenantId;
    this._customerId = customerId;
    this._invoiceNumber = invoiceNumber;
    this._status = InvoiceStatus.DRAFT;
    this._lineItems = [...lineItems];
    this._issueDate = issueDate;
    this._paymentTerms = paymentTerms;

    // Use omitUndefined to handle exactOptionalPropertyTypes safely
    const cleanOptions = omitUndefined({
      notes: notes,
    });

    this._notes = cleanOptions.notes;
    this._version = 0;

    this._calculateTotals();
    this._calculateDueDate();
  }

  /**
   * Issue the invoice and emit InvoiceIssuedEvent
   */
  public issue(issuedBy: string): void {
    if (this._status !== InvoiceStatus.DRAFT) {
      throw new Error(`Cannot issue invoice in ${this._status} status`);
    }

    if (this._lineItems.length === 0) {
      throw new Error('Cannot issue invoice without line items');
    }

    this._status = InvoiceStatus.ISSUED;

    // Emit domain event
    const event = new InvoiceIssuedEvent(
      randomUUID(),
      `invoice-${this._invoiceId}`,
      this._version + 1,
      new Date(),
      this._tenantId,
      this._invoiceId,
      this._customerId,
      this._invoiceNumber,
      this._lineItems,
      this._totals,
      this._issueDate,
      this._dueDate,
      this._paymentTerms,
      issuedBy,
      this._notes,
    );

    this._uncommittedEvents.push(event);
    this._version++;
  }

  /**
   * Mark invoice as sent to customer
   */
  public markAsSent(sentBy: string): void {
    if (this._status !== InvoiceStatus.ISSUED) {
      throw new Error(`Cannot send invoice in ${this._status} status`);
    }

    this._status = InvoiceStatus.SENT;

    const event = new InvoiceSentEvent(
      randomUUID(),
      this._invoiceId,
      this._version + 1,
      new Date(),
      this._tenantId,
      sentBy,
    );

    this._uncommittedEvents.push(event);
    this._version++;
  }

  /**
   * Mark invoice as paid
   */
  public markAsPaid(paidAmount: number, paidBy: string, paymentDate: Date): void {
    if (this._status !== InvoiceStatus.SENT && this._status !== InvoiceStatus.OVERDUE) {
      throw new Error(`Cannot mark as paid from ${this._status} status`);
    }

    if (paidAmount !== this._totals.totalAmount) {
      throw new Error(
        `Paid amount ${paidAmount} does not match invoice total ${this._totals.totalAmount}`,
      );
    }

    this._status = InvoiceStatus.PAID;

    const event = new InvoicePaidEvent(
      randomUUID(),
      this._invoiceId,
      this._version + 1,
      new Date(),
      this._tenantId,
      paidAmount,
      paymentDate,
      paidBy,
    );

    this._uncommittedEvents.push(event);
    this._version++;
  }

  /**
   * Cancel the invoice
   */
  public cancel(cancelledBy: string, reason: string): void {
    if (this._status === InvoiceStatus.PAID) {
      throw new Error('Cannot cancel a paid invoice');
    }

    if (this._status === InvoiceStatus.CANCELLED) {
      throw new Error('Invoice is already cancelled');
    }

    this._status = InvoiceStatus.CANCELLED;

    const event = new InvoiceCancelledEvent(
      randomUUID(),
      this._invoiceId,
      this._version + 1,
      new Date(),
      this._tenantId,
      reason,
      cancelledBy,
    );

    this._uncommittedEvents.push(event);
    this._version++;
  }

  /**
   * Check if invoice is overdue
   */
  public checkOverdueStatus(): boolean {
    if (this._status === InvoiceStatus.PAID || this._status === InvoiceStatus.CANCELLED) {
      return false;
    }

    const now = new Date();
    if (now > this._dueDate) {
      if (this._status !== InvoiceStatus.OVERDUE) {
        this._status = InvoiceStatus.OVERDUE;

        const event = new InvoiceOverdueEvent(
          randomUUID(),
          this._invoiceId,
          this._version + 1,
          new Date(),
          this._tenantId,
          this._dueDate,
        );

        this._uncommittedEvents.push(event);
        this._version++;
      }
      return true;
    }

    return false;
  }

  private _calculateTotals(): void {
    const subtotal = this._lineItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    const taxAmount = this._lineItems.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice;
      return sum + lineTotal * item.taxRate;
    }, 0);

    this._totals = {
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
      currency: this._lineItems[0]?.currency || 'MYR',
    };
  }

  private _calculateDueDate(): void {
    const dueDays = this._getDueDays();
    this._dueDate = new Date(this._issueDate);
    this._dueDate.setDate(this._dueDate.getDate() + dueDays);
  }

  private _getDueDays(): number {
    switch (this._paymentTerms) {
      case PaymentTerms.DUE_ON_RECEIPT:
        return 0;
      case PaymentTerms.NET_15:
        return 15;
      case PaymentTerms.NET_30:
        return 30;
      case PaymentTerms.NET_45:
        return 45;
      case PaymentTerms.NET_60:
        return 60;
      default:
        return 30; // Default to NET 30
    }
  }

  // Getters
  public getInvoiceId(): string {
    return this._invoiceId;
  }
  public getTenantId(): string {
    return this._tenantId;
  }
  public getCustomerId(): string {
    return this._customerId;
  }
  public getInvoiceNumber(): string {
    return this._invoiceNumber;
  }
  public getStatus(): InvoiceStatus {
    return this._status;
  }
  public getLineItems(): ReadonlyArray<InvoiceLineItem> {
    return this._lineItems;
  }
  public getTotals(): InvoiceTotals {
    return this._totals;
  }
  public getIssueDate(): Date {
    return this._issueDate;
  }
  public getDueDate(): Date {
    return this._dueDate;
  }
  public getPaymentTerms(): PaymentTerms {
    return this._paymentTerms;
  }
  public getNotes(): string | undefined {
    return this._notes;
  }
  public getVersion(): number {
    return this._version;
  }
  public getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  public markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }
}

// Domain Events
export class InvoiceIssuedEvent implements DomainEvent {
  public readonly eventType = 'InvoiceIssued' as const;
  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;

  public readonly invoiceId: string;
  public readonly customerId: string;
  public readonly invoiceNumber: string;
  public readonly lineItems: ReadonlyArray<InvoiceLineItem>;
  public readonly totals: InvoiceTotals;
  public readonly issueDate: Date;
  public readonly dueDate: Date;
  public readonly paymentTerms: PaymentTerms;
  public readonly issuedBy: string;
  public readonly notes?: string;

  constructor(
    id: string,
    aggregateId: string,
    version: number,
    occurredAt: Date,
    tenantId: string,
    invoiceId: string,
    customerId: string,
    invoiceNumber: string,
    lineItems: InvoiceLineItem[],
    totals: InvoiceTotals,
    issueDate: Date,
    dueDate: Date,
    paymentTerms: PaymentTerms,
    issuedBy: string,
    notes?: string,
  ) {
    this.id = id;
    this.aggregateId = aggregateId;
    this.version = version;
    this.occurredAt = occurredAt;
    this.tenantId = tenantId;
    this.invoiceId = invoiceId;
    this.customerId = customerId;
    this.invoiceNumber = invoiceNumber;
    this.lineItems = lineItems;
    this.totals = totals;
    this.issueDate = issueDate;
    this.dueDate = dueDate;
    this.paymentTerms = paymentTerms;
    this.issuedBy = issuedBy;

    // Use omitUndefined to handle exactOptionalPropertyTypes safely
    const cleanOptions = omitUndefined({
      notes: notes,
    });

    this.notes = cleanOptions.notes;
  }

  public serialize(): Record<string, unknown> {
    return {
      eventType: this.eventType,
      id: this.id,
      aggregateId: this.aggregateId,
      version: this.version,
      occurredAt: this.occurredAt.toISOString(),
      tenantId: this.tenantId,
      invoiceId: this.invoiceId,
      customerId: this.customerId,
      invoiceNumber: this.invoiceNumber,
      lineItems: this.lineItems,
      totals: this.totals,
      issueDate: this.issueDate.toISOString(),
      dueDate: this.dueDate.toISOString(),
      paymentTerms: this.paymentTerms,
      issuedBy: this.issuedBy,
      notes: this.notes,
    };
  }
}

export class InvoiceSentEvent implements DomainEvent {
  public readonly eventType = 'InvoiceSent' as const;
  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;
  public readonly sentBy: string;

  constructor(
    id: string,
    aggregateId: string,
    version: number,
    occurredAt: Date,
    tenantId: string,
    sentBy: string,
  ) {
    this.id = id;
    this.aggregateId = aggregateId;
    this.version = version;
    this.occurredAt = occurredAt;
    this.tenantId = tenantId;
    this.sentBy = sentBy;
  }

  public serialize(): Record<string, unknown> {
    return {
      eventType: this.eventType,
      id: this.id,
      aggregateId: this.aggregateId,
      version: this.version,
      occurredAt: this.occurredAt.toISOString(),
      tenantId: this.tenantId,
      sentBy: this.sentBy,
    };
  }
}

export class InvoicePaidEvent implements DomainEvent {
  public readonly eventType = 'InvoicePaid' as const;
  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;
  public readonly paidAmount: number;
  public readonly paymentDate: Date;
  public readonly paidBy: string;

  constructor(
    id: string,
    aggregateId: string,
    version: number,
    occurredAt: Date,
    tenantId: string,
    paidAmount: number,
    paymentDate: Date,
    paidBy: string,
  ) {
    this.id = id;
    this.aggregateId = aggregateId;
    this.version = version;
    this.occurredAt = occurredAt;
    this.tenantId = tenantId;
    this.paidAmount = paidAmount;
    this.paymentDate = paymentDate;
    this.paidBy = paidBy;
  }

  public serialize(): Record<string, unknown> {
    return {
      eventType: this.eventType,
      id: this.id,
      aggregateId: this.aggregateId,
      version: this.version,
      occurredAt: this.occurredAt.toISOString(),
      tenantId: this.tenantId,
      paidAmount: this.paidAmount,
      paymentDate: this.paymentDate.toISOString(),
      paidBy: this.paidBy,
    };
  }
}

export class InvoiceCancelledEvent implements DomainEvent {
  public readonly eventType = 'InvoiceCancelled' as const;
  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;
  public readonly reason: string;
  public readonly cancelledBy: string;

  constructor(
    id: string,
    aggregateId: string,
    version: number,
    occurredAt: Date,
    tenantId: string,
    reason: string,
    cancelledBy: string,
  ) {
    this.id = id;
    this.aggregateId = aggregateId;
    this.version = version;
    this.occurredAt = occurredAt;
    this.tenantId = tenantId;
    this.reason = reason;
    this.cancelledBy = cancelledBy;
  }

  public serialize(): Record<string, unknown> {
    return {
      eventType: this.eventType,
      id: this.id,
      aggregateId: this.aggregateId,
      version: this.version,
      occurredAt: this.occurredAt.toISOString(),
      tenantId: this.tenantId,
      reason: this.reason,
      cancelledBy: this.cancelledBy,
    };
  }
}

export class InvoiceOverdueEvent implements DomainEvent {
  public readonly eventType = 'InvoiceOverdue' as const;
  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;
  public readonly dueDate: Date;

  constructor(
    id: string,
    aggregateId: string,
    version: number,
    occurredAt: Date,
    tenantId: string,
    dueDate: Date,
  ) {
    this.id = id;
    this.aggregateId = aggregateId;
    this.version = version;
    this.occurredAt = occurredAt;
    this.tenantId = tenantId;
    this.dueDate = dueDate;
  }

  public serialize(): Record<string, unknown> {
    return {
      eventType: this.eventType,
      id: this.id,
      aggregateId: this.aggregateId,
      version: this.version,
      occurredAt: this.occurredAt.toISOString(),
      tenantId: this.tenantId,
      dueDate: this.dueDate.toISOString(),
    };
  }
}

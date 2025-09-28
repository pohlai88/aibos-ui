/**
 * Issue Invoice Command
 *
 * Command to issue an invoice to a customer with line items and payment terms.
 */

import { type InvoiceLineItem, type PaymentTerms } from '../domain/invoice.domain';
import { omitUndefined } from '../utils';

export interface IssueInvoiceCommandProperties {
  readonly invoiceId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly customerId: string;
  readonly invoiceNumber: string;
  readonly lineItems: InvoiceLineItem[];
  readonly issueDate: Date;
  readonly paymentTerms: PaymentTerms;
  readonly notes?: string;
}

export class IssueInvoiceCommand {
  public readonly invoiceId: string;
  public readonly tenantId: string;
  public readonly userId: string;
  public readonly customerId: string;
  public readonly invoiceNumber: string;
  public readonly lineItems: InvoiceLineItem[];
  public readonly issueDate: Date;
  public readonly paymentTerms: PaymentTerms;
  public readonly notes?: string;

  constructor(properties: IssueInvoiceCommandProperties) {
    // Use omitUndefined to handle exactOptionalPropertyTypes safely
    const cleanProperties = omitUndefined({
      invoiceId: properties.invoiceId,
      tenantId: properties.tenantId,
      userId: properties.userId,
      customerId: properties.customerId,
      invoiceNumber: properties.invoiceNumber,
      lineItems: properties.lineItems,
      issueDate: properties.issueDate,
      paymentTerms: properties.paymentTerms,
      notes: properties.notes,
    });

    // Assign from cleaned properties
    this.invoiceId = cleanProperties.invoiceId;
    this.tenantId = cleanProperties.tenantId;
    this.userId = cleanProperties.userId;
    this.customerId = cleanProperties.customerId;
    this.invoiceNumber = cleanProperties.invoiceNumber;
    this.lineItems = cleanProperties.lineItems;
    this.issueDate = cleanProperties.issueDate;
    this.paymentTerms = cleanProperties.paymentTerms;
    this.notes = cleanProperties.notes;

    this._validate();
  }

  private _validate(): void {
    if (!this.invoiceId || this.invoiceId.trim().length === 0) {
      throw new Error('Invoice ID is required');
    }

    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new Error('Tenant ID is required');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!this.customerId || this.customerId.trim().length === 0) {
      throw new Error('Customer ID is required');
    }

    if (!this.invoiceNumber || this.invoiceNumber.trim().length === 0) {
      throw new Error('Invoice number is required');
    }

    if (!this.lineItems || this.lineItems.length === 0) {
      throw new Error('At least one line item is required');
    }

    // Validate line items
    for (const [index, item] of this.lineItems.entries()) {
      if (!item.description || item.description.trim().length === 0) {
        throw new Error(`Line item ${index + 1}: Description is required`);
      }

      if (item.quantity <= 0) {
        throw new Error(`Line item ${index + 1}: Quantity must be greater than 0`);
      }

      if (item.unitPrice < 0) {
        throw new Error(`Line item ${index + 1}: Unit price cannot be negative`);
      }

      if (!item.accountCode || item.accountCode.trim().length === 0) {
        throw new Error(`Line item ${index + 1}: Account code is required`);
      }

      if (item.taxRate < 0 || item.taxRate > 1) {
        throw new Error(`Line item ${index + 1}: Tax rate must be between 0 and 1`);
      }
    }

    if (!this.issueDate) {
      throw new Error('Issue date is required');
    }

    if (this.issueDate > new Date()) {
      throw new Error('Issue date cannot be in the future');
    }
  }
}

/**
 * Issue Invoice Command
 *
 * Command to issue an invoice to a customer with line items and payment terms.
 */

import { type InvoiceLineItem, type PaymentTerms } from '../domain/invoice.domain';
import { omitUndefined, isEmpty, isNonEmpty } from '../utils';
import { 
  createValidationError, 
  createBusinessError,
  type ErrorContext 
} from '../utils/error-utilities';

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
    const context: ErrorContext = {
      operation: 'issue-invoice-validation',
      userId: this.userId,
      tenantId: this.tenantId,
      data: { invoiceId: this.invoiceId, customerId: this.customerId }
    };

    if (!isNonEmpty(this.invoiceId)) {
      throw createValidationError('invoiceId', 'Invoice ID is required', this.invoiceId, context);
    }

    if (!isNonEmpty(this.tenantId)) {
      throw createValidationError('tenantId', 'Tenant ID is required', this.tenantId, context);
    }

    if (!isNonEmpty(this.userId)) {
      throw createValidationError('userId', 'User ID is required', this.userId, context);
    }

    if (!isNonEmpty(this.customerId)) {
      throw createValidationError('customerId', 'Customer ID is required', this.customerId, context);
    }

    if (!isNonEmpty(this.invoiceNumber)) {
      throw createValidationError('invoiceNumber', 'Invoice number is required', this.invoiceNumber, context);
    }

    if (isEmpty(this.lineItems)) {
      throw createValidationError('lineItems', 'At least one line item is required', this.lineItems, context);
    }

    // Validate line items
    for (const [index, item] of this.lineItems.entries()) {
      const lineItemContext: ErrorContext = {
        ...context,
        data: { ...context.data, lineItemIndex: index, lineItem: item }
      };

      if (!isNonEmpty(item.description)) {
        throw createValidationError(
          `lineItems[${index}].description`, 
          'Description is required', 
          item.description, 
          lineItemContext
        );
      }

      if (item.quantity <= 0) {
        throw createValidationError(
          `lineItems[${index}].quantity`, 
          'Quantity must be greater than 0', 
          item.quantity, 
          lineItemContext
        );
      }

      if (item.unitPrice < 0) {
        throw createValidationError(
          `lineItems[${index}].unitPrice`, 
          'Unit price cannot be negative', 
          item.unitPrice, 
          lineItemContext
        );
      }

      if (!isNonEmpty(item.accountCode)) {
        throw createValidationError(
          `lineItems[${index}].accountCode`, 
          'Account code is required', 
          item.accountCode, 
          lineItemContext
        );
      }

      if (item.taxRate < 0 || item.taxRate > 1) {
        throw createValidationError(
          `lineItems[${index}].taxRate`, 
          'Tax rate must be between 0 and 1', 
          item.taxRate, 
          lineItemContext
        );
      }
    }

    if (!this.issueDate) {
      throw createValidationError('issueDate', 'Issue date is required', this.issueDate, context);
    }

    if (this.issueDate > new Date()) {
      throw createBusinessError(
        'FUTURE_ISSUE_DATE',
        'Issue date cannot be in the future',
        'IssueInvoiceCommand',
        context
      );
    }
  }
}

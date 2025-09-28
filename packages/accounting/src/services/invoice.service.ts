/**
 * Invoice Service
 *
 * Orchestrates invoice operations including issuing invoices and automatic
 * journal entry generation for revenue recognition.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { omitUndefined } from '../utils';

import { Invoice } from '../domain/invoice.domain';
import { IssueInvoiceCommand } from '../commands/issue-invoice.command';
import { PostJournalEntryCommand } from '../commands/post-journal-entry.command';
import { AccountingService } from './accounting.service';
import { OutboxService } from './outbox.service';
import { InvoiceEventHandlerService } from './invoice-event-handler.service';

import { EVENT_STORE } from '../constants/injection.tokens';
import type { EventStore } from '../domain/repositories.interface';
// DomainEvent import removed as it's not used

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @Inject(EVENT_STORE)
    private readonly eventStore: EventStore,
    @Inject(AccountingService)
    private readonly accountingService: AccountingService,
    @Inject(OutboxService)
    private readonly outboxService: OutboxService,
    @Inject(ConfigService)
    private readonly config: ConfigService,
    @Inject(InvoiceEventHandlerService)
    private readonly eventHandler: InvoiceEventHandlerService,
  ) {}

  /**
   * Issue an invoice and automatically create journal entry for revenue recognition
   */
  async issueInvoice(command: IssueInvoiceCommand, idempotencyKey?: string): Promise<void> {
    this.logger.log(
      `Issuing invoice: ${command.invoiceNumber} for customer: ${command.customerId}`,
    );

    // Create invoice aggregate
    const invoice = new Invoice(
      command.invoiceId,
      command.tenantId,
      command.customerId,
      command.invoiceNumber,
      command.lineItems,
      command.issueDate,
      command.paymentTerms,
      command.notes,
    );

    // Issue the invoice (this generates InvoiceIssuedEvent)
    invoice.issue(command.userId);

    // Store the invoice events
    const events = invoice.getUncommittedEvents();
    await this.eventStore.append(
      `invoice-${command.invoiceId}`,
      events as unknown as Parameters<typeof this.eventStore.append>[1],
      invoice.getVersion() - events.length,
      command.tenantId,
      idempotencyKey,
    );

    invoice.markEventsAsCommitted();

    // Publish events via outbox
    await this.outboxService.publishEvents(
      events as unknown as Parameters<typeof this.outboxService.publishEvents>[0],
      command.tenantId,
    );

    // Process events for projections
    for (const event of events) {
      await this.eventHandler.handleInvoiceIssued(event as unknown);
    }

    // Automatically create journal entry for revenue recognition
    await this._createRevenueJournalEntry(command, invoice);

    this.logger.log(`Invoice issued successfully: ${command.invoiceNumber}`);
  }

  /**
   * Mark invoice as sent to customer
   */
  async markInvoiceAsSent(invoiceId: string, tenantId: string, sentBy: string): Promise<void> {
    this.logger.log(`Marking invoice as sent: ${invoiceId}`);

    // Load invoice from events
    const invoice = await this._loadInvoiceFromEvents(invoiceId, tenantId);

    invoice.markAsSent(sentBy);

    const events = invoice.getUncommittedEvents();
    await this.eventStore.append(
      `invoice-${invoiceId}`,
      events as unknown as Parameters<typeof this.eventStore.append>[1],
      invoice.getVersion() - events.length,
      tenantId,
    );

    invoice.markEventsAsCommitted();

    await this.outboxService.publishEvents(
      events as unknown as Parameters<typeof this.outboxService.publishEvents>[0],
      tenantId,
    );

    // Process events for projections
    for (const event of events) {
      await this.eventHandler.handleInvoiceSent(event as unknown);
    }

    this.logger.log(`Invoice marked as sent: ${invoiceId}`);
  }

  /**
   * Mark invoice as paid and create journal entry for payment
   */
  async markInvoiceAsPaid(
    invoiceId: string,
    tenantId: string,
    paidAmount: number,
    paidBy: string,
    paymentDate: Date,
  ): Promise<void> {
    this.logger.log(`Marking invoice as paid: ${invoiceId}`);

    // Load invoice from events
    const invoice = await this._loadInvoiceFromEvents(invoiceId, tenantId);

    invoice.markAsPaid(paidAmount, paidBy, paymentDate);

    const events = invoice.getUncommittedEvents();
    await this.eventStore.append(
      `invoice-${invoiceId}`,
      events as unknown as Parameters<typeof this.eventStore.append>[1],
      invoice.getVersion() - events.length,
      tenantId,
    );

    invoice.markEventsAsCommitted();

    await this.outboxService.publishEvents(
      events as unknown as Parameters<typeof this.outboxService.publishEvents>[0],
      tenantId,
    );

    // Process events for projections
    for (const event of events) {
      await this.eventHandler.handleInvoicePaid(event as unknown);
    }

    // Create journal entry for payment received
    await this._createPaymentJournalEntry(invoice, paidAmount, paymentDate, paidBy);

    this.logger.log(`Invoice marked as paid: ${invoiceId}`);
  }

  /**
   * Cancel an invoice
   */
  async cancelInvoice(
    invoiceId: string,
    tenantId: string,
    reason: string,
    cancelledBy: string,
  ): Promise<void> {
    this.logger.log(`Cancelling invoice: ${invoiceId}`);

    // Load invoice from events
    const invoice = await this._loadInvoiceFromEvents(invoiceId, tenantId);

    invoice.cancel(cancelledBy, reason);

    const events = invoice.getUncommittedEvents();
    await this.eventStore.append(
      `invoice-${invoiceId}`,
      events as unknown as Parameters<typeof this.eventStore.append>[1],
      invoice.getVersion() - events.length,
      tenantId,
    );

    invoice.markEventsAsCommitted();

    await this.outboxService.publishEvents(
      events as unknown as Parameters<typeof this.outboxService.publishEvents>[0],
      tenantId,
    );

    // Process events for projections
    for (const event of events) {
      await this.eventHandler.handleInvoiceCancelled(event as unknown);
    }

    this.logger.log(`Invoice cancelled: ${invoiceId}`);
  }

  /**
   * Check for overdue invoices and update their status
   */
  async checkOverdueInvoices(tenantId: string): Promise<string[]> {
    this.logger.log(`Checking overdue invoices for tenant: ${tenantId}`);

    // This would typically query a projection or read model
    // For now, we'll return an empty array as we need to implement the projection
    const overdueInvoiceIds: string[] = [];

    for (const invoiceId of overdueInvoiceIds) {
      const invoice = await this._loadInvoiceFromEvents(invoiceId, tenantId);
      invoice.checkOverdueStatus();

      const events = invoice.getUncommittedEvents();
      if (events.length > 0) {
        await this.eventStore.append(
          `invoice-${invoiceId}`,
          events as unknown as Parameters<typeof this.eventStore.append>[1],
          invoice.getVersion() - events.length,
          tenantId,
        );

        invoice.markEventsAsCommitted();

        await this.outboxService.publishEvents(
          events as unknown as Parameters<typeof this.outboxService.publishEvents>[0],
          tenantId,
        );

        // Process events for projections
        for (const event of events) {
          await this.eventHandler.handleInvoiceOverdue(event as unknown);
        }
      }
    }

    return overdueInvoiceIds;
  }

  /**
   * Create journal entry for revenue recognition when invoice is issued
   */
  private async _createRevenueJournalEntry(
    command: IssueInvoiceCommand,
    invoice: Invoice,
  ): Promise<void> {
    const totals = invoice.getTotals();
    const accountsReceivableAccount =
      this.config.get<string>('ACCOUNTS_RECEIVABLE_ACCOUNT') || '1200';
    const revenueAccount = command.lineItems[0]?.accountCode || '4000';

    const journalEntryCommand = new PostJournalEntryCommand(
      omitUndefined({
        journalEntryId: `REV-${command.invoiceId}`,
        tenantId: command.tenantId,
        userId: command.userId,
        entries: [
          {
            accountCode: accountsReceivableAccount,
            debitAmount: totals.totalAmount,
            creditAmount: 0,
            currency: totals.currency,
            description: `Invoice ${command.invoiceNumber} - Accounts Receivable`,
          },
          {
            accountCode: revenueAccount,
            debitAmount: 0,
            creditAmount: totals.subtotal,
            currency: totals.currency,
            description: `Invoice ${command.invoiceNumber} - Revenue`,
          },
        ],
        reference: command.invoiceNumber,
        description: `Revenue recognition for invoice ${command.invoiceNumber}`,
        postingDate: command.issueDate,
      }),
    );

    // Add tax entry if applicable
    if (totals.taxAmount > 0) {
      const taxPayableAccount = this.config.get<string>('TAX_PAYABLE_ACCOUNT') || '2100';
      journalEntryCommand.entries.push({
        accountCode: taxPayableAccount,
        debitAmount: 0,
        creditAmount: totals.taxAmount,
        currency: totals.currency,
        description: `Invoice ${command.invoiceNumber} - Tax Payable`,
      });
    }

    await this.accountingService.postJournalEntry(journalEntryCommand);
  }

  /**
   * Create journal entry for payment received
   */
  private async _createPaymentJournalEntry(
    invoice: Invoice,
    paidAmount: number,
    paymentDate: Date,
    paidBy: string,
  ): Promise<void> {
    const accountsReceivableAccount =
      this.config.get<string>('ACCOUNTS_RECEIVABLE_ACCOUNT') || '1200';
    const cashAccount = this.config.get<string>('CASH_ACCOUNT') || '1100';

    const journalEntryCommand = new PostJournalEntryCommand({
      journalEntryId: `PAY-${invoice.getInvoiceId()}`,
      tenantId: invoice.getTenantId(),
      userId: paidBy,
      entries: [
        {
          accountCode: cashAccount,
          debitAmount: paidAmount,
          creditAmount: 0,
          currency: invoice.getTotals().currency,
          description: `Payment received for invoice ${invoice.getInvoiceNumber()}`,
        },
        {
          accountCode: accountsReceivableAccount,
          debitAmount: 0,
          creditAmount: paidAmount,
          currency: invoice.getTotals().currency,
          description: `Payment received for invoice ${invoice.getInvoiceNumber()}`,
        },
      ],
      reference: `PAY-${invoice.getInvoiceNumber()}`,
      description: `Payment received for invoice ${invoice.getInvoiceNumber()}`,
      postingDate: paymentDate,
    });

    await this.accountingService.postJournalEntry(journalEntryCommand);
  }

  /**
   * Load invoice aggregate from events (event sourcing replay)
   */
  private async _loadInvoiceFromEvents(invoiceId: string, tenantId: string): Promise<Invoice> {
    try {
      this.logger.log(`Loading invoice from events: ${invoiceId}`);

      // Get all events for this invoice stream
      const events = await this.eventStore.getEvents(`invoice-${invoiceId}`, undefined, tenantId);

      if (events.length === 0) {
        throw new Error(`No events found for invoice: ${invoiceId}`);
      }

      // Find the InvoiceIssued event to get initial data
      const issuedEvent = events.find((e) => e.eventType === 'InvoiceIssued') as unknown;
      if (!issuedEvent) {
        throw new Error(`InvoiceIssued event not found for invoice: ${invoiceId}`);
      }

      // Create invoice from issued event data
      const invoice = new Invoice(
        issuedEvent.invoiceId,
        issuedEvent.tenantId,
        issuedEvent.customerId,
        issuedEvent.invoiceNumber,
        issuedEvent.lineItems,
        new Date(issuedEvent.issueDate),
        issuedEvent.paymentTerms,
        issuedEvent.notes,
      );

      // Apply subsequent events to rebuild the current state
      for (const event of events) {
        if (event.eventType === 'InvoiceIssued') {
          // Already handled in constructor
          continue;
        } else if (event.eventType === 'InvoiceSent') {
          invoice.markAsSent((event as unknown).sentBy);
        } else if (event.eventType === 'InvoicePaid') {
          const paidEvent = event as unknown;
          invoice.markAsPaid(
            paidEvent.paidAmount,
            paidEvent.paidBy,
            new Date(paidEvent.paymentDate),
          );
        } else if (event.eventType === 'InvoiceCancelled') {
          const cancelledEvent = event as unknown;
          invoice.cancel(cancelledEvent.cancelledBy, cancelledEvent.reason);
        } else if (event.eventType === 'InvoiceOverdue') {
          invoice.checkOverdueStatus();
        }
      }

      // Clear uncommitted events since we're replaying
      invoice.markEventsAsCommitted();

      this.logger.log(`Invoice loaded successfully from events: ${invoiceId}`);
      return invoice;
    } catch (error: unknown) {
      this.logger.error(`Failed to load invoice from events: ${invoiceId}`, error);
      throw error;
    }
  }
}

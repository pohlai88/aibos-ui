/**
 * Invoice Event Handler Service
 *
 * Processes invoice domain events and updates projections.
 * Handles event sourcing integration for invoice operations.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { InvoiceProjectionManager } from '../projections/invoice.projection';
import {
  InvoiceIssuedEvent,
  InvoiceSentEvent,
  InvoicePaidEvent,
  InvoiceCancelledEvent,
  InvoiceOverdueEvent,
} from '../domain/invoice.domain';
import { EVENT_STORE, INVOICE_PROJECTION } from '../constants/injection.tokens';
import type { EventStore } from '../domain/repositories.interface';
import type { DomainEvent } from '@aibos/eventsourcing';

@Injectable()
export class InvoiceEventHandlerService {
  private readonly logger = new Logger(InvoiceEventHandlerService.name);

  constructor(
    @Inject(EVENT_STORE)
    private readonly eventStore: EventStore,
    @Inject(INVOICE_PROJECTION)
    private readonly projectionManager: InvoiceProjectionManager,
  ) {}

  /**
   * Handle InvoiceIssued event
   */
  async handleInvoiceIssued(event: InvoiceIssuedEvent): Promise<void> {
    try {
      this.logger.log(`Processing InvoiceIssued event for invoice: ${event.invoiceId}`);

      await this.projectionManager.processInvoiceIssued(event);

      this.logger.log(`InvoiceIssued event processed successfully: ${event.invoiceId}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to process InvoiceIssued event: ${event.invoiceId}`, error);
      throw error;
    }
  }

  /**
   * Handle InvoiceSent event
   */
  async handleInvoiceSent(event: InvoiceSentEvent): Promise<void> {
    try {
      this.logger.log(`Processing InvoiceSent event for invoice: ${event.aggregateId}`);

      await this.projectionManager.processInvoiceSent(event);

      this.logger.log(`InvoiceSent event processed successfully: ${event.aggregateId}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to process InvoiceSent event: ${event.aggregateId}`, error);
      throw error;
    }
  }

  /**
   * Handle InvoicePaid event
   */
  async handleInvoicePaid(event: InvoicePaidEvent): Promise<void> {
    try {
      this.logger.log(`Processing InvoicePaid event for invoice: ${event.aggregateId}`);

      await this.projectionManager.processInvoicePaid(event);

      this.logger.log(`InvoicePaid event processed successfully: ${event.aggregateId}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to process InvoicePaid event: ${event.aggregateId}`, error);
      throw error;
    }
  }

  /**
   * Handle InvoiceCancelled event
   */
  async handleInvoiceCancelled(event: InvoiceCancelledEvent): Promise<void> {
    try {
      this.logger.log(`Processing InvoiceCancelled event for invoice: ${event.aggregateId}`);

      await this.projectionManager.processInvoiceCancelled(event);

      this.logger.log(`InvoiceCancelled event processed successfully: ${event.aggregateId}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to process InvoiceCancelled event: ${event.aggregateId}`, error);
      throw error;
    }
  }

  /**
   * Handle InvoiceOverdue event
   */
  async handleInvoiceOverdue(event: InvoiceOverdueEvent): Promise<void> {
    try {
      this.logger.log(`Processing InvoiceOverdue event for invoice: ${event.aggregateId}`);

      await this.projectionManager.processInvoiceOverdue(event);

      this.logger.log(`InvoiceOverdue event processed successfully: ${event.aggregateId}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to process InvoiceOverdue event: ${event.aggregateId}`, error);
      throw error;
    }
  }

  /**
   * Process events from event store for invoice projections
   * This method can be called to replay events and rebuild projections
   */
  async processInvoiceEvents(tenantId: string, fromVersion?: number): Promise<void> {
    try {
      this.logger.log(
        `Processing invoice events for tenant: ${tenantId}, from version: ${fromVersion || 0}`,
      );

      // Get all invoice events for the tenant
      const events = await this.eventStore.getEvents('invoice-stream', fromVersion, tenantId);

      for (const event of events) {
        await this._processEvent(event);
      }

      this.logger.log(`Processed ${events.length} invoice events for tenant: ${tenantId}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to process invoice events for tenant: ${tenantId}`, error);
      throw error;
    }
  }

  /**
   * Process a single event based on its type
   */
  private async _processEvent(event: DomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'InvoiceIssued':
        await this.handleInvoiceIssued(event as InvoiceIssuedEvent);
        break;
      case 'InvoiceSent':
        await this.handleInvoiceSent(event as InvoiceSentEvent);
        break;
      case 'InvoicePaid':
        await this.handleInvoicePaid(event as InvoicePaidEvent);
        break;
      case 'InvoiceCancelled':
        await this.handleInvoiceCancelled(event as InvoiceCancelledEvent);
        break;
      case 'InvoiceOverdue':
        await this.handleInvoiceOverdue(event as InvoiceOverdueEvent);
        break;
      default:
        this.logger.warn(`Unknown invoice event type: ${event.eventType}`);
    }
  }

  /**
   * Get invoice projection data
   */
  async getInvoiceSummary(invoiceId: string): Promise<unknown> {
    return this.projectionManager.getInvoice(invoiceId);
  }

  /**
   * Get customer balance projection
   */
  async getCustomerBalance(customerId: string, tenantId: string): Promise<unknown> {
    return this.projectionManager.getCustomerBalance(customerId, tenantId);
  }

  /**
   * Get accounts receivable summary
   */
  async getAccountsReceivableSummary(tenantId: string): Promise<unknown> {
    return this.projectionManager.getAccountsReceivableSummary(tenantId);
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(tenantId: string): Promise<unknown[]> {
    return this.projectionManager.getOverdueInvoices(tenantId);
  }
}

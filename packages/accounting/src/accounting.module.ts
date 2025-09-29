/**
 * Accounting Module
 *
 * NestJS module that provides all accounting services including
 * invoice management with event sourcing integration.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Services
import { AccountingService } from './services/accounting.service';
import { InvoiceService } from './services/invoice.service';
import { InvoiceEventHandlerService } from './services/invoice-event-handler.service';
import { OutboxService } from './services/outbox.service';

// Repositories
import { PostgreSQLEventStore } from './infrastructure/repositories/event-store.repository';
import { TypeormAccountRepository } from './infrastructure/typeorm-account.repository';
import { TypeormJournalEntryRepository } from './infrastructure/typeorm-journal-entry.repository';

// Projections
import { InvoiceProjectionManager } from './projections/invoice.projection';
import { GeneralLedgerProjection } from './projections/general-ledger.projection';

// Injection Tokens
import {
  EVENT_STORE,
  ACCOUNT_REPOSITORY,
  JOURNAL_ENTRY_REPOSITORY,
  INVOICE_PROJECTION,
  INVOICE_EVENT_HANDLER,
} from './constants/injection.tokens';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [
    // Core Services
    AccountingService,
    InvoiceService,
    InvoiceEventHandlerService,
    OutboxService,

    // Event Store
    {
      provide: EVENT_STORE,
      useClass: PostgreSQLEventStore,
    },

    // Repositories
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: TypeormAccountRepository,
    },
    {
      provide: JOURNAL_ENTRY_REPOSITORY,
      useClass: TypeormJournalEntryRepository,
    },

    // Projections
    {
      provide: INVOICE_PROJECTION,
      useClass: InvoiceProjectionManager,
    },
    {
      provide: INVOICE_EVENT_HANDLER,
      useClass: InvoiceEventHandlerService,
    },
    GeneralLedgerProjection,
  ],
  exports: [
    AccountingService,
    InvoiceService,
    InvoiceEventHandlerService,
    OutboxService,
    EVENT_STORE,
    ACCOUNT_REPOSITORY,
    JOURNAL_ENTRY_REPOSITORY,
    INVOICE_PROJECTION,
    INVOICE_EVENT_HANDLER,
  ],
})
export class AccountingModule {}

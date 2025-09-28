/**
 * Dependency injection tokens for the accounting module.
 * These tokens ensure proper DI in NestJS by providing runtime symbols
 * that don't get erased during compilation.
 */

export const EVENT_STORE = Symbol('EVENT_STORE');
export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');
export const JOURNAL_ENTRY_REPOSITORY = Symbol('JOURNAL_ENTRY_REPOSITORY');
export const INVOICE_REPOSITORY = Symbol('INVOICE_REPOSITORY');
export const INVOICE_PROJECTION = Symbol('INVOICE_PROJECTION');
export const INVOICE_EVENT_HANDLER = Symbol('INVOICE_EVENT_HANDLER');

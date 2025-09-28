/**
 * Accounting Utilities - Barrel Export
 * 
 * This is the public API entry point for accounting utilities.
 * It re-exports everything from the main accounting-utilities file.
 * 
 * ⚠️  IMPORTANT: This is the ONLY public entry point for accounting utilities.
 * 
 * All utilities are now embedded in accounting-utilities.ts for simplicity.
 * This barrel just provides a clean import path.
 */

// Re-export everything from the main accounting utilities file
export * from './accounting-utilities';

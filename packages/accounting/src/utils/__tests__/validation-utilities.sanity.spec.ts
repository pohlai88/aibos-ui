import { describe, it, expect } from 'vitest';
import { validateTaxId, validateCreditCard, validateJournalEntry, validateCurrencyCode, validateInvoice, validateAmount, validatePercentage, validateEmail } from '../validation-utilities';

describe('SG NRIC/FIN checksum', () => {
  it('fails on bad check letter', () => {
    const r = validateTaxId('S1234567Z', 'SG', { strict: true });
    expect(r.isValid).toBe(false);
    expect(r.errors).toContain('Invalid NRIC/FIN check letter');
  });

  it('passes with correct check letter', () => {
    // S1234567D is a valid NRIC with correct checksum
    const r = validateTaxId('S1234567D', 'SG', { strict: true });
    expect(r.isValid).toBe(true);
  });
});

describe('Mastercard 2-series', () => {
  it('accepts a known 2-series test number (Luhn)', () => {
    const r = validateCreditCard('2221 0000 0000 0009');
    expect(r.isValid).toBe(true);
  });

  it('accepts traditional 5-series Mastercard', () => {
    const r = validateCreditCard('5555 5555 5555 4444');
    expect(r.isValid).toBe(true);
  });

  it('rejects invalid 2-series number', () => {
    const r = validateCreditCard('2221 0000 0000 0000');
    expect(r.isValid).toBe(false);
  });
});

describe('Journal currency epsilon', () => {
  it('balances exactly in JPY (0 decimals)', () => {
    const r = validateJournalEntry({
      currency: 'JPY',
      date: '2025-01-01',
      description: 'Test',
      entries: [{ account: '1000', debit: 100 }, { account: '2000', credit: 100 }],
    }, { strict: true });
    expect(r.isValid).toBe(true);
  });

  it('balances with MYR precision (2 decimals)', () => {
    const r = validateJournalEntry({
      currency: 'MYR',
      date: '2025-01-01',
      description: 'Test',
      entries: [
        { account: '1000', debit: 100.01 },
        { account: '2000', credit: 100.01 }
      ],
    });
    expect(r.isValid).toBe(true);
  });

  it('fails when unbalanced beyond currency precision', () => {
    const r = validateJournalEntry({
      currency: 'MYR',
      date: '2025-01-01',
      description: 'Test',
      entries: [
        { account: '1000', debit: 100.01 },
        { account: '2000', credit: 100.00 }
      ],
    });
    expect(r.isValid).toBe(false);
    expect(r.errors).toContain('Journal entry is not balanced');
  });
});

describe('Currency normalization', () => {
  it('uppercases and validates', () => {
    const r = validateCurrencyCode('myr');
    expect(r.isValid).toBe(true);
  });

  it('validates supported currencies', () => {
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'MYR', 'SGD'];
    currencies.forEach(ccy => {
      const r = validateCurrencyCode(ccy);
      expect(r.isValid).toBe(true);
    });
  });

  it('rejects unsupported currencies', () => {
    const r = validateCurrencyCode('XYZ');
    expect(r.isValid).toBe(false);
    expect(r.errors).toContain('Unsupported currency code: XYZ');
  });
});

describe('Tax ID patterns', () => {
  it('accepts permissive MY patterns', () => {
    const patterns = ['1234567890', '12345678901', '123456789012'];
    patterns.forEach(pattern => {
      const r = validateTaxId(pattern, 'MY');
      expect(r.isValid).toBe(true);
    });
  });

  it('accepts PH patterns with branches', () => {
    const patterns = ['123456789', '123456789012'];
    patterns.forEach(pattern => {
      const r = validateTaxId(pattern, 'PH');
      expect(r.isValid).toBe(true);
    });
  });

  it('accepts VN patterns with branches', () => {
    const patterns = ['1234567890', '1234567890123'];
    patterns.forEach(pattern => {
      const r = validateTaxId(pattern, 'VN');
      expect(r.isValid).toBe(true);
    });
  });
});

describe('Phase 2 Email Validation Integration', () => {
  it('demonstrates Phase 2 utility usage for email validation in different contexts', () => {
    // Test customer email validation using Phase 2 utility
    const customer = {
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '+60123456789',
      country: 'MY'
    };
    
    // First validate the email using Phase 2 utility
    const emailValidation = validateEmail(customer.email);
    expect(emailValidation.isValid).toBe(true);
    
    // Test different email formats
    const validEmails = [
      'user@domain.com',
      'user.name@domain.co.uk',
      'user+tag@subdomain.example.org',
      'test123@company.com.my'
    ];
    
    validEmails.forEach(email => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(true);
    });
    
    // Test invalid email formats
    const invalidEmails = [
      'invalid-email',
      '@domain.com',
      'user@',
      'user@domain',
      '',
      'user..name@domain.com',
      'user@domain..com'
    ];
    
    invalidEmails.forEach(email => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(false);
    });
    
    // Test strict validation
    const strictResult = validateEmail('user@domain.com', { strict: true });
    expect(strictResult.isValid).toBe(true);
  });
  
  it('demonstrates Phase 2 utility usage for email validation in business contexts', () => {
    // Test vendor email validation
    const vendor = {
      name: 'Test Vendor',
      email: 'vendor@company.com',
      phone: '+60123456789',
      country: 'MY'
    };
    
    const emailValidation = validateEmail(vendor.email);
    expect(emailValidation.isValid).toBe(true);
    
    // Test email validation with different options
    const basicValidation = validateEmail('user@domain.com');
    const strictValidation = validateEmail('user@domain.com', { strict: true });
    const allowEmptyValidation = validateEmail('', { allowEmpty: true });
    
    expect(basicValidation.isValid).toBe(true);
    expect(strictValidation.isValid).toBe(true);
    expect(allowEmptyValidation.isValid).toBe(true);
  });
});

describe('Phase 2 Business Entity Validation Integration', () => {
  it('demonstrates Phase 2 utility usage for journal entry validation in domain layer', () => {
    // Test journal entry validation using Phase 2 utility
    const journalEntry = {
      date: '2025-01-01',
      description: 'Test Journal Entry',
      entries: [
        { account: '1000', debit: 1000, currency: 'MYR' },
        { account: '2000', credit: 1000, currency: 'MYR' }
      ],
      currency: 'MYR'
    };
    
    const result = validateJournalEntry(journalEntry, { strict: true });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    
    // Test unbalanced journal entry
    const unbalancedEntry = {
      date: '2025-01-01',
      description: 'Unbalanced Entry',
      entries: [
        { account: '1000', debit: 1000, currency: 'MYR' },
        { account: '2000', credit: 500, currency: 'MYR' } // Missing 500
      ],
      currency: 'MYR'
    };
    
    const unbalancedResult = validateJournalEntry(unbalancedEntry, { strict: true });
    expect(unbalancedResult.isValid).toBe(false);
    expect(unbalancedResult.errors).toContain('Journal entry is not balanced');
  });

  it('demonstrates Phase 2 utility usage for invoice validation', () => {
    // Test invoice validation using Phase 2 utility
    const invoice = {
      invoiceNumber: 'INV-001',
      date: '2025-01-01',
      dueDate: '2025-01-31',
      customer: { name: 'Test Customer' },
      items: [
        { description: 'Item 1', quantity: 2, unitPrice: 100 },
        { description: 'Item 2', quantity: 1, unitPrice: 50 }
      ],
      total: 250,
      currency: 'MYR'
    };
    
    const result = validateInvoice(invoice, { strict: true });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    
    // Test invoice with invalid due date
    const invalidInvoice = {
      ...invoice,
      dueDate: '2024-12-31' // Before invoice date
    };
    
    const invalidResult = validateInvoice(invalidInvoice, { strict: true });
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toContain('Invoice dueDate cannot be before date');
  });
});

describe('Phase 2 Number Formatting Integration', () => {
  it('demonstrates Phase 2 utility usage for decimal places validation', () => {
    // Test amount validation with Phase 2 decimal places utility
    const amountWithManyDecimals = validateAmount(123.456789, undefined, undefined, { strict: true });
    expect(amountWithManyDecimals.isValid).toBe(true);
    expect(amountWithManyDecimals.warnings).toContain('Amount has more than 4 decimal places');
    
    const amountWithFewDecimals = validateAmount(123.45, undefined, undefined, { strict: true });
    expect(amountWithFewDecimals.isValid).toBe(true);
    expect(amountWithFewDecimals.warnings).toHaveLength(0);
    
    // Test percentage validation with Phase 2 decimal places utility
    const percentageWithManyDecimals = validatePercentage(12.345678, { strict: true });
    expect(percentageWithManyDecimals.isValid).toBe(true);
    expect(percentageWithManyDecimals.warnings).toContain('Percentage has more than 4 decimal places');
    
    const percentageWithFewDecimals = validatePercentage(12.34, { strict: true });
    expect(percentageWithFewDecimals.isValid).toBe(true);
    expect(percentageWithFewDecimals.warnings).toHaveLength(0);
  });
});

describe('Invoice validation enhancements', () => {
  it('validates quantity > 0', () => {
    const r = validateInvoice({
      invoiceNumber: 'INV-001',
      date: '2025-01-01',
      dueDate: '2025-01-31',
      customer: { name: 'Test' },
      items: [{ description: 'Item', quantity: 0, unitPrice: 10 }],
      total: 0,
    });
    expect(r.isValid).toBe(false);
    expect(r.errors).toContain('Invoice item quantity must be > 0');
  });

  it('validates unit price >= 0', () => {
    const r = validateInvoice({
      invoiceNumber: 'INV-001',
      date: '2025-01-01',
      dueDate: '2025-01-31',
      customer: { name: 'Test' },
      items: [{ description: 'Item', quantity: 1, unitPrice: -10 }],
      total: -10,
    });
    expect(r.isValid).toBe(false);
    expect(r.errors).toContain('Invoice item unit price cannot be negative');
  });

  it('validates due date after invoice date in strict mode', () => {
    const r = validateInvoice({
      invoiceNumber: 'INV-001',
      date: '2025-01-31',
      dueDate: '2025-01-01',
      customer: { name: 'Test' },
      items: [{ description: 'Item', quantity: 1, unitPrice: 10 }],
      total: 10,
    }, { strict: true });
    expect(r.isValid).toBe(false);
    expect(r.errors).toContain('Invoice dueDate cannot be before date');
  });
});

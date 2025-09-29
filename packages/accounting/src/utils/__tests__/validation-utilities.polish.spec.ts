import { describe, it, expect } from 'vitest';
import { 
  validateEmail, 
  validatePhone, 
  validateTaxId, 
  validateCreditCard, 
  validateJournalEntry, 
  validateCurrencyCode, 
  validateInvoice,
  validateCustomer,
  validateIBAN,
  validateCardExpiry,
  validateCardCVC,
  type ValidationIssue,
  type ValidationCode
} from '../validation-utilities';

describe('Structured Error System', () => {
  it('provides structured errors with paths and codes', () => {
    const result = validateEmail('invalid-email');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
    expect(result.issues).toHaveLength(1);
    expect(result.issues![0]).toEqual({
      path: 'email',
      code: 'FORMAT',
      message: 'Invalid email format',
      severity: 'error'
    });
  });

  it('provides warnings with structured format', () => {
    const result = validateEmail('test@example.com', { strict: true });
    expect(result.isValid).toBe(true);
    // Should have no errors but might have warnings
    expect(result.issues).toBeDefined();
  });

  it('handles nested validation paths', () => {
    const journal = {
      date: '2025-01-01',
      description: 'Test',
      entries: [
        { account: '1000', debit: 100 },
        { account: '2000', credit: 50 } // Unbalanced
      ]
    };
    const result = validateJournalEntry(journal);
    expect(result.isValid).toBe(false);
    expect(result.issues?.some(i => i.path === 'journal.entries')).toBe(true);
    expect(result.issues?.some(i => i.code === 'BALANCE')).toBe(true);
  });
});

describe('IBAN Validation', () => {
  it('validates German IBAN correctly', () => {
    const result = validateIBAN('DE89 3704 0044 0532 0130 00');
    expect(result.isValid).toBe(true);
  });

  it('validates UK IBAN correctly', () => {
    const result = validateIBAN('GB82 WEST 1234 5698 7654 32');
    expect(result.isValid).toBe(true);
  });

  it('rejects invalid IBAN checksum', () => {
    const result = validateIBAN('DE89 3704 0044 0532 0130 01'); // Wrong checksum
    expect(result.isValid).toBe(false);
    expect(result.issues?.some(i => i.code === 'CHECKSUM')).toBe(true);
  });

  it('rejects unsupported country codes', () => {
    const result = validateIBAN('XX12 3456 7890 1234 5678');
    expect(result.isValid).toBe(false);
    expect(result.issues?.some(i => i.code === 'UNSUPPORTED')).toBe(true);
  });

  it('rejects wrong length for country', () => {
    const result = validateIBAN('DE89 3704 0044 0532 0130'); // Too short for DE
    expect(result.isValid).toBe(false);
    expect(result.issues?.some(i => i.code === 'LENGTH')).toBe(true);
  });
});

describe('Card Expiry Validation', () => {
  it('validates future expiry dates', () => {
    const futureYear = new Date().getFullYear() + 2;
    const result = validateCardExpiry(`12/${futureYear.toString().slice(-2)}`);
    expect(result.isValid).toBe(true);
  });

  it('validates 4-digit year format', () => {
    const futureYear = new Date().getFullYear() + 2;
    const result = validateCardExpiry(`12/${futureYear}`);
    expect(result.isValid).toBe(true);
  });

  it('rejects expired cards', () => {
    const pastYear = new Date().getFullYear() - 1;
    const result = validateCardExpiry(`12/${pastYear.toString().slice(-2)}`);
    expect(result.isValid).toBe(false);
    expect(result.issues?.some(i => i.code === 'RANGE' && i.message.includes('expired'))).toBe(true);
  });

  it('rejects invalid month', () => {
    const result = validateCardExpiry('13/25');
    expect(result.isValid).toBe(false);
    expect(result.issues?.some(i => i.code === 'RANGE' && i.message.includes('month'))).toBe(true);
  });

  it('rejects invalid format', () => {
    const result = validateCardExpiry('12-25');
    expect(result.isValid).toBe(false);
    expect(result.issues?.some(i => i.code === 'FORMAT')).toBe(true);
  });

  it('warns about unusually far future dates in strict mode', () => {
    const farFutureYear = new Date().getFullYear() + 15;
    const result = validateCardExpiry(`12/${farFutureYear}`, { strict: true });
    expect(result.isValid).toBe(true);
    expect(result.issues?.some(i => i.severity === 'warning' && i.message.includes('unusually far'))).toBe(true);
  });
});

describe('Card CVC Validation', () => {
  it('validates 3-digit CVC', () => {
    const result = validateCardCVC('123');
    expect(result.isValid).toBe(true);
  });

  it('validates 4-digit CVC', () => {
    const result = validateCardCVC('1234');
    expect(result.isValid).toBe(true);
  });

  it('rejects invalid CVC format', () => {
    const result = validateCardCVC('12');
    expect(result.isValid).toBe(false);
    expect(result.issues?.some(i => i.code === 'FORMAT')).toBe(true);
  });

  it('validates Amex CVC length in strict mode', () => {
    const result = validateCardCVC('1234', 'American Express', { strict: true });
    expect(result.isValid).toBe(true);
  });

  it('rejects wrong Amex CVC length in strict mode', () => {
    const result = validateCardCVC('123', 'American Express', { strict: true });
    expect(result.isValid).toBe(false);
    expect(result.issues?.some(i => i.code === 'LENGTH' && i.message.includes('Amex'))).toBe(true);
  });

  it('validates non-Amex CVC length in strict mode', () => {
    const result = validateCardCVC('123', 'Visa', { strict: true });
    expect(result.isValid).toBe(true);
  });

  it('rejects wrong non-Amex CVC length in strict mode', () => {
    const result = validateCardCVC('1234', 'Visa', { strict: true });
    expect(result.isValid).toBe(false);
    expect(result.issues?.some(i => i.code === 'LENGTH' && i.message.includes('Visa'))).toBe(true);
  });
});

describe('Enhanced Type Safety', () => {
  it('validates journal entries with proper typing', () => {
    const journal = {
      date: '2025-01-01',
      description: 'Test',
      entries: [
        { account: '1000', debit: 100 },
        { account: '2000', credit: 100 }
      ]
    };
    const result = validateJournalEntry(journal);
    expect(result.isValid).toBe(true);
  });

  it('validates invoices with proper typing', () => {
    const invoice = {
      invoiceNumber: 'INV-001',
      date: '2025-01-01',
      dueDate: '2025-01-31',
      customer: { name: 'Test Customer' },
      items: [
        { description: 'Item 1', quantity: 1, unitPrice: 100 }
      ],
      total: 100
    };
    const result = validateInvoice(invoice);
    expect(result.isValid).toBe(true);
  });

  it('validates customers with proper typing and Phase 2 email validation', () => {
    const customer = {
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '+60123456789',
      country: 'MY'
    };
    
    // First validate the email using Phase 2 utility
    const emailValidation = validateEmail(customer.email);
    expect(emailValidation.isValid).toBe(true);
    
    // Then validate the entire customer
    const result = validateCustomer(customer);
    expect(result.isValid).toBe(true);
  });
});

describe('Backward Compatibility', () => {
  it('maintains old error/warning arrays', () => {
    const result = validateEmail('invalid-email');
    expect(result.errors).toBeDefined();
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('provides both old and new error formats', () => {
    const result = validateEmail('invalid-email');
    expect(result.errors).toContain('Invalid email format');
    expect(result.issues).toHaveLength(1);
    expect(result.issues![0].message).toBe('Invalid email format');
  });
});

describe('Validation Code Types', () => {
  it('uses proper validation codes', () => {
    const codes: ValidationCode[] = [
      'REQUIRED', 'FORMAT', 'CHECKSUM', 'RANGE', 'LENGTH',
      'UNSUPPORTED', 'MISMATCH', 'BALANCE', 'CONSISTENCY'
    ];
    
    // Test that we can use these codes
    codes.forEach(code => {
      expect(typeof code).toBe('string');
    });
  });

  it('provides structured issues with all required fields', () => {
    const result = validateEmail('');
    expect(result.issues).toHaveLength(1);
    const issue = result.issues![0];
    expect(issue.path).toBeDefined();
    expect(issue.code).toBeDefined();
    expect(issue.message).toBeDefined();
    expect(issue.severity).toBeDefined();
  });
});

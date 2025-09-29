/**
 * Validation Utilities - Phase 2 Implementation
 * 
 * Comprehensive validation utilities for accounting data.
 * Provides type-safe validation for various business entities.
 * 
 * Features:
 * - Email and phone number validation
 * - Tax ID validation by country
 * - Bank account validation
 * - Credit card validation
 * - Amount and percentage validation
 * - Currency code validation
 * - Business entity validation
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const VALIDATION_CONSTANTS = {
  REQUIRED_FIELD: 'is required',
  INVALID_FORMAT: 'Invalid format',
  UNSUPPORTED_COUNTRY: 'validation not supported for country',
  INVALID_LENGTH: 'length seems unusual',
  CHECKSUM_INVALID: 'Invalid checksum',
  CARD_EXPIRED: 'Card is expired',
  EXPIRY_FUTURE: 'Expiry is unusually far in the future',
} as const;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ValidationCode =
  | 'INVALID_CODE_FORMAT'
  | 'INVALID_CODE_PATTERN'
  | 'MISSING_NAME'
  | 'NAME_TOO_LONG'
  | 'NEGATIVE_AMOUNT'
  | 'INVALID_PRECISION'
  | 'INVALID_DATE'
  | 'MISSING_DESCRIPTION'
  | 'UNBALANCED_ENTRY'
  | 'INVALID_RATE'
  | 'MISSING_TYPE'
  | 'VALIDATION_FAILED'
  | 'MISSING_PERIOD'
  | 'INVALID_PERIOD'
  | 'INVALID_VARIANCE_THRESHOLD'
  | 'MISSING_ACCOUNT_CODE'
  | 'MISSING_ACCOUNT_NAME'
  | 'MISSING_ACCOUNT_TYPE'
  | 'INVALID_BALANCE_TYPE'
  | 'NEGATIVE_PERIOD_DEBITS'
  | 'NEGATIVE_PERIOD_CREDITS'
  | 'NO_ACCOUNTS_OF_TYPE'
  | 'NEGATIVE_ASSET_BALANCE'
  | 'NEGATIVE_LIABILITY_BALANCE'
  | 'AMOUNT_BELOW_MINIMUM'
  | 'AMOUNT_ABOVE_MAXIMUM'
  | 'RULE_INACTIVE'
  | 'RULE_NOT_EFFECTIVE'
  | 'RULE_EXPIRED'
  | 'INVALID_RATE_FOR_GROSS_UP'
  | 'INVALID_GROSS_UP_METHOD'
  | 'MISSING_RULE_ID'
  | 'MISSING_JURISDICTION'
  | 'INVALID_TAX_TYPE'
  | 'INVALID_MINIMUM_AMOUNT'
  | 'INVALID_MAXIMUM_AMOUNT'
  | 'INVALID_EFFECTIVE_DATE'
  | 'INVALID_EXPIRY_DATE'
  | 'INVALID_DATE_RANGE'
  | 'MISSING_TRANSACTION_ID'
  | 'MISSING_VENDOR'
  | 'MISSING_CURRENCY'
  | 'INVALID_TRANSACTION_DATE'
  | 'INVALID_VENDOR_TYPE'
  | 'MISSING_PAYABLE_ID'
  | 'NEGATIVE_WITHHOLDING'
  | 'INVALID_STATUS'
  | 'INVALID_DUE_DATE'
  | 'INVALID_PAID_DATE'
  | 'INVALID_PAID_DATE_RANGE'
  | 'RULE_VALIDATION_ERROR'
  | 'MISSING_CONDITION_FIELD'
  | 'INVALID_CONDITION_OPERATOR'
  | 'MISSING_CONDITION_VALUE'
  | 'REQUIRED'
  | 'FORMAT'
  | 'CHECKSUM'
  | 'RANGE'
  | 'LENGTH'
  | 'UNSUPPORTED'
  | 'MISMATCH'
  | 'BALANCE'
  | 'CONSISTENCY';

export interface ValidationIssue {
  code: ValidationCode;
  path: string;          // dot-path indicating where the issue occurred, e.g. "invoice.total"
  message: string;
  severity?: 'error' | 'warning';
  value?: unknown;          // the actual value that caused the validation issue
}

export interface BusinessValidationResult {
  isValid: boolean;
  errors: string[];      // kept for backward compatibility
  warnings: string[];    // kept for backward compatibility
  issues?: ValidationIssue[]; // new structured list (errors + warnings)
}

export interface ValidationOptions {
  strict?: boolean;
  allowEmpty?: boolean;
  customRules?: Array<(value: unknown) => string | null>;
}

// Reuse accounting currency helpers (avoid magic numbers/drift)
import {
  type SupportedCurrency,
  getCurrencyDecimalsStrict,
  normalizeCurrency,
  isEmpty,
} from './index';

// Narrowed shapes (keep lenient, but better than any)
export interface JournalLineInput {
  account?: string;
  debit?: number;
  credit?: number;
  currency?: string;
}
export interface JournalEntryInput {
  date?: string | Date;
  description?: string;
  entries?: JournalLineInput[];
  currency?: string;
}
export interface InvoiceItemInput {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  taxRate?: number; // %
}
export interface InvoiceInput {
  invoiceNumber?: string;
  date?: string | Date;
  dueDate?: string | Date;
  customer?: unknown;
  items?: InvoiceItemInput[];
  total?: number;
  currency?: string;
}
export interface CustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  country?: SupportedCountry | string;
}
export interface VendorInput {
  name?: string;
  email?: string;
  phone?: string;
  country?: SupportedCountry | string;
}
export interface TransactionInput {
  date?: string | Date;
  amount?: number;
  type?: string; // e.g., 'SALE' | 'REFUND'
}

// ---------- internal helpers for issues ----------

/**
 * Get decimal places count using Phase 2 utility approach
 * This replaces manual string manipulation with a more robust approach
 */
function getDecimalPlaces(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const string_ = value.toString();
  const decimalIndex = string_.indexOf('.');
  return decimalIndex === -1 ? 0 : string_.length - decimalIndex - 1;
}

function createResult(): BusinessValidationResult {
  return { isValid: true, errors: [], warnings: [], issues: [] };
}
function err(r: BusinessValidationResult, path: string, code: ValidationCode, message: string) {
  r.isValid = false;
  r.errors.push(message);
  r.issues!.push({ path, code, message, severity: 'error' });
}
function warn(r: BusinessValidationResult, path: string, code: ValidationCode, message: string) {
  r.warnings.push(message);
  r.issues!.push({ path, code, message, severity: 'warning' });
}

// Country-specific validation patterns
const VALIDATION_PATTERNS = {
  // Tax ID patterns
  TAX_ID: {
    // Keep MY permissive by default; stricter checks behind options.strict
    MY: /^\d{10,12}$/,
    SG: /^[STFG]\d{7}[A-Z]$/,
    TH: /^\d{13}$/, // Thailand: 13 digits
    ID: /^\d{15}$/, // Indonesia: 15 digits
    PH: /^\d{9,12}$/, // 9 or 12 (with branches)
    VN: /^(\d{10}|\d{13})$/, // 10 or 13 (10 + branch)
  },
  // Phone number patterns
  PHONE: {
    MY: /^(\+?6?01)[0-46-9]-?[0-9]{7,8}$/, // Malaysia
    SG: /^(\+?65)?[689]\d{7}$/, // Singapore
    TH: /^(\+?66)?[689]\d{8}$/, // Thailand
    ID: /^(\+?62)?[0-9]{8,13}$/, // Indonesia
    PH: /^(\+?63)?[0-9]{10}$/, // Philippines
    VN: /^(\+?84)?[0-9]{9,10}$/, // Vietnam
  },
  // Bank account patterns
  BANK_ACCOUNT: {
    MY: /^\d{10,16}$/, // Malaysia: 10-16 digits
    SG: /^\d{6,12}$/, // Singapore: 6-12 digits
    TH: /^\d{10,15}$/, // Thailand: 10-15 digits
    ID: /^\d{8,16}$/, // Indonesia: 8-16 digits
    PH: /^\d{10,12}$/, // Philippines: 10-12 digits
    VN: /^\d{9,14}$/, // Vietnam: 9-14 digits
  },
} as const;

// Supported countries
const _SUPPORTED_COUNTRIES = ['MY', 'SG', 'TH', 'ID', 'PH', 'VN'] as const;
type SupportedCountry = typeof _SUPPORTED_COUNTRIES[number];

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Validate email address
 */
export function validateEmail(email: string, options: ValidationOptions = {}): BusinessValidationResult {
  const r = createResult();

  if (!email) {
    if (!options.allowEmpty) {
      err(r, 'email', 'REQUIRED', `Email ${VALIDATION_CONSTANTS.REQUIRED_FIELD}`);
    }
    return r;
  }

  // Basic email regex - safe pattern
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(email)) { err(r,'email','FORMAT',`${VALIDATION_CONSTANTS.INVALID_FORMAT} email format`); return r; }

  // Additional checks for strict validation
  if (options.strict) {
    if (email.length > 254) {
      err(r,'email','LENGTH','Email is too long');
    }
    
    const localPart = email.split('@')[0];
    if (localPart && localPart.length > 64) {
      err(r,'email','LENGTH','Email local part is too long');
    }
    
    if (email.includes('..')) {
      err(r,'email','FORMAT','Email cannot contain consecutive dots');
    }
    
    if (email.startsWith('.') || email.endsWith('.')) {
      err(r,'email','FORMAT','Email cannot start or end with a dot');
    }
  }

  return r;
}

// ============================================================================
// PHONE VALIDATION
// ============================================================================

/**
 * Validate phone number by country
 */
export function validatePhone(
  phone: string, 
  country: SupportedCountry = 'MY',
  options: ValidationOptions = {}
): BusinessValidationResult {
  const r = createResult();

  if (!phone) {
    if (!options.allowEmpty) {
      err(r,'phone','REQUIRED',`Phone number ${VALIDATION_CONSTANTS.REQUIRED_FIELD}`);
    }
    return r;
  }

  // Clean phone number (remove spaces, dashes, parentheses)
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  const pattern = VALIDATION_PATTERNS.PHONE[country];
  if (!pattern) {
    err(r,'phone','UNSUPPORTED',`Phone ${VALIDATION_CONSTANTS.UNSUPPORTED_COUNTRY}: ${country}`);
    return r;
  }

  if (!pattern.test(cleanPhone)) err(r,'phone','FORMAT',`Invalid phone number format for ${country}`);

  // Additional checks
  if (options.strict) {
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      warn(r,'phone','LENGTH',`Phone number ${VALIDATION_CONSTANTS.INVALID_LENGTH}`);
    }
  }

  return r;
}

// ============================================================================
// TAX ID VALIDATION
// ============================================================================

/**
 * Validate tax ID by country
 */
export function validateTaxId(
  taxId: string, 
  country: SupportedCountry = 'MY',
  options: ValidationOptions = {}
): BusinessValidationResult {
  const r = createResult();

  if (!taxId) {
    if (!options.allowEmpty) {
      err(r,'taxId','REQUIRED','Tax ID is required');
    }
    return r;
  }

  const pattern = VALIDATION_PATTERNS.TAX_ID[country];
  if (!pattern) {
    err(r,'taxId','UNSUPPORTED',`Tax ID validation not supported for country: ${country}`);
    return r;
  }

  if (!pattern.test(taxId)) err(r,'taxId','FORMAT',`Invalid tax ID format for ${country}`);

  // Additional country-specific validations
  if (options.strict) {
    switch (country) {
      case 'MY':
        // Keep strict checks minimal until spec is finalized
        break;
      case 'SG':
        // Singapore NRIC/FIN validation
        if (taxId.length === 9) {
          const weights = [2, 7, 6, 5, 4, 3, 2];
          const sum = taxId.slice(1, 8).split('').reduce((accumulator, digit, index) => {
            const weight = weights[index];
            return accumulator + parseInt(digit) * (weight || 0);
          }, 0);
          const prefix = taxId[0] as 'S'|'T'|'F'|'G';
          const offset = (prefix === 'T' || prefix === 'G') ? 4 : 0;
          const total = sum + offset;
          const remainder = total % 11;
          const nricLetters = ['J','Z','I','H','G','F','E','D','C','B','A']; // S/T
          const finLetters  = ['X','W','U','T','R','Q','P','N','M','L','K']; // F/G
          const table = (prefix === 'S' || prefix === 'T') ? nricLetters : finLetters;
          const expected = table[remainder];
          if (taxId[8] !== expected) err(r,'taxId','CHECKSUM','Invalid NRIC/FIN check letter');
        }
        break;
    }
  }

  return r;
}

// ============================================================================
// BANK ACCOUNT VALIDATION
// ============================================================================

/**
 * Validate bank account number
 */
export function validateBankAccount(
  accountNumber: string, 
  bankCode: string = '',
  country: SupportedCountry = 'MY',
  options: ValidationOptions = {}
): BusinessValidationResult {
  const r = createResult();

  if (!accountNumber) {
    if (!options.allowEmpty) {
      err(r,'bank.accountNumber','REQUIRED','Bank account number is required');
    }
    return r;
  }

  // Clean account number
  const cleanAccount = accountNumber.replace(/\s/g, '');
  
  if (!/^\d+$/.test(cleanAccount)) { err(r,'bank.accountNumber','FORMAT','Bank account number must contain only digits'); return r; }

  const pattern = VALIDATION_PATTERNS.BANK_ACCOUNT[country];
  if (!pattern) {
    err(r,'bank.accountNumber','UNSUPPORTED',`Bank account validation not supported for country: ${country}`);
    return r;
  }

  if (!pattern.test(cleanAccount)) err(r,'bank.accountNumber','FORMAT',`Invalid bank account format for ${country}`);

  // Additional checks
  if (options.strict && bankCode && bankCode.length < 3) { warn(r,'bank.bankCode','LENGTH','Bank code seems too short'); }

  return r;
}

// ============================================================================
// CREDIT CARD VALIDATION
// ============================================================================

/**
 * Validate credit card number using Luhn algorithm
 */
export function validateCreditCard(cardNumber: string, options: ValidationOptions = {}): BusinessValidationResult {
  const r = createResult();

  if (!cardNumber) {
    if (!options.allowEmpty) {
      err(r,'card.number','REQUIRED','Credit card number is required');
    }
    return r;
  }

  // Clean card number
  const cleanCard = cardNumber.replace(/\s/g, '');
  
  if (!/^\d+$/.test(cleanCard)) { err(r,'card.number','FORMAT','Credit card number must contain only digits'); return r; }

  // Check length
  if (cleanCard.length < 13 || cleanCard.length > 19) { err(r,'card.number','LENGTH','Invalid credit card number length'); return r; }

  // Luhn algorithm validation
  if (!validateLuhnAlgorithm(cleanCard)) { err(r,'card.number','CHECKSUM','Invalid credit card number'); return r; }

  if (options.strict) {
    const cardType = detectCardType(cleanCard);
    if (cardType) warn(r,'card.number','FORMAT',`Detected card type: ${cardType}`);
  }

  return r;
}

/**
 * Validate using Luhn algorithm
 */
function validateLuhnAlgorithm(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;

  // Process digits from right to left
  for (let index = cardNumber.length - 1; index >= 0; index--) {
    const char = cardNumber[index];
    if (!char) continue;
    
    let digit = parseInt(char);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Detect credit card type
 */
function detectCardType(cardNumber: string): string | null {
  const patterns = {
    'Visa': /^4/,
    // 51–55 and 2221–2720
    'Mastercard': /^(5[1-5]\d{14}|2(2(2[1-9]\d{12}|[3-9]\d{13})|[3-6]\d{14}|7(0\d{14}|1\d{14}|20\d{13})))$/,
    'American Express': /^3[47]/,
    'Discover': /^6(?:011|5)/,
    'JCB': /^35/,
    'Diners Club': /^3[0689]/,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(cardNumber)) {
      return type;
    }
  }

  return null;
}

// ============================================================================
// AMOUNT VALIDATION
// ============================================================================

/**
 * Validate amount with min/max constraints
 */
export function validateAmount(
  amount: number, 
  min?: number, 
  max?: number,
  options: ValidationOptions = {}
): BusinessValidationResult {
  const r = createResult();

  if (typeof amount !== 'number' || isNaN(amount)) { err(r,'amount','FORMAT','Amount must be a valid number'); return r; }

  if (amount < 0) err(r,'amount','RANGE','Amount cannot be negative');

  if (min !== undefined && amount < min) err(r,'amount','RANGE',`Amount must be at least ${min}`);

  if (max !== undefined && amount > max) err(r,'amount','RANGE',`Amount must not exceed ${max}`);

  if (options.strict) {
    const dp = getDecimalPlaces(amount);
    if (dp > 4) warn(r,'amount','FORMAT','Amount has more than 4 decimal places');
  }
  return r;
}

// ============================================================================
// PERCENTAGE VALIDATION
// ============================================================================

/**
 * Validate percentage value
 */
export function validatePercentage(
  value: number,
  options: ValidationOptions = {}
): BusinessValidationResult {
  const r = createResult();

  if (typeof value !== 'number' || isNaN(value)) { err(r,'percentage','FORMAT','Percentage must be a valid number'); return r; }

  if (value < 0) err(r,'percentage','RANGE','Percentage cannot be negative');

  if (value > 100) err(r,'percentage','RANGE','Percentage cannot exceed 100%');

  if (options.strict) {
    const dp = getDecimalPlaces(value);
    if (dp > 4) warn(r,'percentage','FORMAT','Percentage has more than 4 decimal places');
  }
  return r;
}

// ============================================================================
// CURRENCY CODE VALIDATION
// ============================================================================

/**
 * Validate currency code
 */
export function validateCurrencyCode(
  code: string, 
  options: ValidationOptions = {}
): BusinessValidationResult {
  const r = createResult();

  if (!code) {
    if (!options.allowEmpty) {
      err(r,'currency','REQUIRED','Currency code is required');
    }
    return r;
  }

  const normalizedCode = normalizeCurrency(code);
  try {
    getCurrencyDecimalsStrict(normalizedCode as SupportedCurrency);
  } catch {
    err(r,'currency','UNSUPPORTED',`Unsupported currency code: ${code}`);
  }

  if (options.strict && code !== normalizedCode) warn(r,'currency','FORMAT',`Currency code should be uppercase: ${normalizedCode}`);

  return r;
}

// ============================================================================
// ACCOUNT TYPE VALIDATION
// ============================================================================

/**
 * Validate account type
 */
export function validateAccountType(
  type: string, 
  options: ValidationOptions = {}
): BusinessValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!type) {
    if (!options.allowEmpty) {
      errors.push('Account type is required');
    }
    return { isValid: isEmpty(errors), errors, warnings };
  }

  // Standard account types
  const validTypes = [
    'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE',
    'CURRENT_ASSET', 'FIXED_ASSET', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY',
    'ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE', 'CASH', 'INVENTORY',
    'SALES', 'COST_OF_GOODS_SOLD', 'OPERATING_EXPENSE', 'NON_OPERATING_EXPENSE'
  ];

  const normalizedType = type.toUpperCase();
  
  if (!validTypes.includes(normalizedType)) {
    errors.push(`Invalid account type: ${type}`);
  }

  if (options.strict && type !== normalizedType) {
    warnings.push(`Account type should be uppercase: ${normalizedType}`);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

// ============================================================================
// BUSINESS ENTITY VALIDATION
// ============================================================================

/**
 * Validate journal entry
 */
export function validateJournalEntry(entry: JournalEntryInput, _options: ValidationOptions = {}): BusinessValidationResult {
  const r = createResult();

  if (!entry) {
    err(r,'journal','REQUIRED','Journal entry is required');
    return r;
  }

  // Required fields
  const requiredFields = ['date', 'description', 'entries'];
  for (const field of requiredFields) {
    if (!entry[field as keyof JournalEntryInput]) {
      err(r,`journal.${field}`,'REQUIRED',`Journal entry ${field} is required`);
    }
  }

  // Validate entries array
  if (entry.entries && Array.isArray(entry.entries)) {
    if (entry.entries.length < 2) {
      err(r,'journal.entries','RANGE','Journal entry must have at least 2 line items');
    }

    // Per-line checks + balance
    let totalDebits = 0;
    let totalCredits = 0;

    entry.entries.forEach((li, index) => {
      const p = `journal.entries[${index}]`;
      const hasDebit = typeof li.debit === 'number' && !isNaN(li.debit);
      const hasCredit = typeof li.credit === 'number' && !isNaN(li.credit);
      if (!li.account) err(r,`${p}.account`,'REQUIRED','Journal line missing account');
      if (hasDebit && hasCredit) err(r,p,'FORMAT','Journal line cannot have both debit and credit');
      if (!hasDebit && !hasCredit) err(r,p,'FORMAT','Journal line requires either debit or credit');
      if ((li.debit ?? 0) < 0 || (li.credit ?? 0) < 0) err(r,p,'RANGE','Journal line amounts cannot be negative');
      totalDebits += (li.debit ?? 0);
      totalCredits += (li.credit ?? 0);
    });

    const documentCcy = normalizeCurrency(entry.currency || (entry.entries[0]?.currency ?? 'MYR'));
    let dec = 2; try { dec = getCurrencyDecimalsStrict(documentCcy as SupportedCurrency); } catch {}
    const eps = 1 / Math.pow(10, dec);
    if (Math.abs(totalDebits - totalCredits) > eps) err(r,'journal.entries','BALANCE','Journal entry is not balanced');
  }

  return r;
}

/**
 * Validate invoice
 */
export function validateInvoice(invoice: InvoiceInput, options: ValidationOptions = {}): BusinessValidationResult {
  const r = createResult();

  if (!invoice) {
    err(r,'invoice','REQUIRED','Invoice is required');
    return r;
  }

  // Required fields
  const requiredFields = ['invoiceNumber', 'date', 'dueDate', 'customer', 'items', 'total'];
  for (const field of requiredFields) {
    if (!invoice[field as keyof InvoiceInput]) {
      err(r,`invoice.${field}`,'REQUIRED',`Invoice ${field} is required`);
    }
  }

  // Validate items
  if (invoice.items && Array.isArray(invoice.items)) {
    if (invoice.items.length === 0) {
      err(r,'invoice.items','RANGE','Invoice must have at least one item');
    }

    invoice.items.forEach((it, index) => {
      const p = `invoice.items[${index}]`;
      if (!it.description || !it.quantity || !it.unitPrice) err(r,p,'REQUIRED','Invoice item must have description, quantity, and unit price');
      if ((it.quantity ?? 0) <= 0) err(r,`${p}.quantity`,'RANGE','Invoice item quantity must be > 0');
      if ((it.unitPrice ?? 0) < 0) err(r,`${p}.unitPrice`,'RANGE','Invoice item unit price cannot be negative');
    });

    if (options.strict) {
      const documentCcy = normalizeCurrency(invoice.currency || 'MYR');
      let dec = 2; try { dec = getCurrencyDecimalsStrict(documentCcy as SupportedCurrency); } catch {}
      const eps = 1 / Math.pow(10, dec);
      const computed = invoice.items.reduce((s, it) => {
        const line = (it.quantity ?? 0) * (it.unitPrice ?? 0);
        const tax = (it.taxRate ?? 0) > 0 ? line * ((it.taxRate ?? 0) / 100) : 0;
        return s + line + tax;
      }, 0);
      if (typeof invoice.total === 'number' && Math.abs(invoice.total - computed) > eps) {
        warn(r,'invoice.total','CONSISTENCY','Invoice total does not match computed sum (within currency tolerance)');
      }
      if (invoice.date && invoice.dueDate && new Date(invoice.dueDate) < new Date(invoice.date)) {
        err(r,'invoice.dueDate','RANGE','Invoice dueDate cannot be before date');
      }
    }
  }

  return r;
}

/**
 * Validate customer
 */
export function validateCustomer(customer: CustomerInput, options: ValidationOptions = {}): BusinessValidationResult {
  const r = createResult();

  if (!customer) {
    err(r,'customer','REQUIRED','Customer is required');
    return r;
  }

  // Required fields
  const requiredFields = ['name'];
  for (const field of requiredFields) {
    if (!(customer as Record<string, unknown>)[field]) {
      err(r,`customer.${field}`,'REQUIRED',`Customer ${field} is required`);
    }
  }

  // Validate email if provided
  if (customer.email) {
    const emailValidation = validateEmail(customer.email, options);
    if (!emailValidation.isValid) emailValidation.issues?.forEach(index => index.severity==='error' ? err(r,`customer.email`,index.code,index.message) : warn(r,`customer.email`,index.code,index.message));
  }

  // Validate phone if provided
  if (customer.phone) {
    const phoneValidation = validatePhone(customer.phone, (customer.country as SupportedCountry) || 'MY', options);
    if (!phoneValidation.isValid) phoneValidation.issues?.forEach(index => index.severity==='error' ? err(r,`customer.phone`,index.code,index.message) : warn(r,`customer.phone`,index.code,index.message));
  }

  return r;
}

/**
 * Validate vendor
 */
export function validateVendor(vendor: VendorInput, options: ValidationOptions = {}): BusinessValidationResult {
  const r = createResult();

  if (!vendor) {
    err(r,'vendor','REQUIRED','Vendor is required');
    return r;
  }

  // Required fields
  const requiredFields = ['name'];
  for (const field of requiredFields) {
    if (!(vendor as Record<string, unknown>)[field]) {
      err(r,`vendor.${field}`,'REQUIRED',`Vendor ${field} is required`);
    }
  }

  // Validate email if provided
  if (vendor.email) {
    const emailValidation = validateEmail(vendor.email, options);
    if (!emailValidation.isValid) emailValidation.issues?.forEach(index => index.severity==='error' ? err(r,`vendor.email`,index.code,index.message) : warn(r,`vendor.email`,index.code,index.message));
  }

  // Validate phone if provided
  if (vendor.phone) {
    const phoneValidation = validatePhone(vendor.phone, (vendor.country as SupportedCountry) || 'MY', options);
    if (!phoneValidation.isValid) phoneValidation.issues?.forEach(index => index.severity==='error' ? err(r,`vendor.phone`,index.code,index.message) : warn(r,`vendor.phone`,index.code,index.message));
  }

  return r;
}

/**
 * Validate transaction
 */
export function validateTransaction(transaction: TransactionInput): BusinessValidationResult {
  const r = createResult();

  if (!transaction) {
    err(r,'transaction','REQUIRED','Transaction is required');
    return r;
  }

  // Required fields
  const requiredFields = ['date', 'amount', 'type'];
  for (const field of requiredFields) {
    if (!(transaction as Record<string, unknown>)[field]) {
      err(r,`transaction.${field}`,'REQUIRED',`Transaction ${field} is required`);
    }
  }

  // Validate amount
  if (transaction.amount !== undefined) {
    const amountValidation = validateAmount(transaction.amount, 0, undefined);
    if (!amountValidation.isValid) amountValidation.issues?.forEach(index => index.severity==='error' ? err(r,`transaction.amount`,index.code,index.message) : warn(r,`transaction.amount`,index.code,index.message));
  }

  return r;
}

// ========================================================================
// IBAN VALIDATION (EU etc.)  — strict-only suggested for usage
// ========================================================================
const IBAN_LENGTHS: Record<string, number> = {
  AL: 28, AD: 24, AT: 20, AZ: 28, BH: 22, BE: 16, BA: 20, BR: 29, BG: 22, CR: 22, HR: 21,
  CY: 28, CZ: 24, DK: 18, DO: 28, EE: 20, FO: 18, FI: 18, FR: 27, GE: 22, DE: 22, GI: 23,
  GR: 27, GL: 18, GT: 28, HU: 28, IS: 26, IE: 22, IL: 23, IT: 27, JO: 30, KZ: 20, KW: 30,
  LV: 21, LB: 28, LI: 21, LT: 20, LU: 20, MK: 19, MT: 31, MR: 27, MU: 30, MC: 27, MD: 24,
  ME: 22, NL: 18, NO: 15, PK: 24, PS: 29, PL: 28, PT: 25, QA: 29, RO: 24, SM: 27, SA: 24,
  RS: 22, SK: 24, SI: 19, ES: 24, SE: 24, CH: 21, TN: 24, TR: 26, UA: 29, AE: 23, GB: 22, VG: 24
};

export function validateIBAN(iban: string, options: ValidationOptions = {}): BusinessValidationResult {
  const r = createResult();
  if (!iban) { if (!options.allowEmpty) err(r,'iban','REQUIRED','IBAN is required'); return r; }
  const raw = iban.replace(/\s+/g, '').toUpperCase();
  if (raw.length < 4) { err(r,'iban','LENGTH','IBAN too short'); return r; }
  const cc = raw.slice(0,2);
  const expected = IBAN_LENGTHS[cc];
  if (!expected) { err(r,'iban','UNSUPPORTED',`Unsupported IBAN country: ${cc}`); return r; }
  if (raw.length !== expected) { err(r,'iban','LENGTH',`IBAN length mismatch for ${cc}: expected ${expected}`); return r; }
  // Move first 4 chars to end, convert letters to numbers (A=10 ... Z=35), mod 97 == 1
  const rearr = raw.slice(4) + raw.slice(0,4);
  const numeric = rearr.replace(/[A-Z]/g, ch => (ch.charCodeAt(0) - 55).toString());
  // compute mod 97 safely
  let remainder = 0;
  for (let index=0;index<numeric.length;index++){
    remainder = (remainder * 10 + (numeric.charCodeAt(index) - 48)) % 97;
  }
  if (remainder !== 1) err(r,'iban','CHECKSUM','Invalid IBAN checksum');
  return r;
}

// ========================================================================
// CARD EXPIRY / CVC (strict helpers)
// ========================================================================
export function validateCardExpiry(expiry: string, options: ValidationOptions = {}): BusinessValidationResult {
  const r = createResult();
  if (!expiry) { if (!options.allowEmpty) err(r,'card.expiry','REQUIRED','Card expiry is required'); return r; }
  const m = expiry.match(/^(\d{2})\s*\/\s*(\d{2}|\d{4})$/);
  if (!m) { err(r,'card.expiry','FORMAT','Expiry must be in MM/YY or MM/YYYY'); return r; }
  const mm = m[1];
  const yy = m[2];
  if (!mm || !yy) { err(r,'card.expiry','FORMAT','Invalid expiry format'); return r; }
  const month = parseInt(mm,10);
  if (month < 1 || month > 12) { err(r,'card.expiry','RANGE','Expiry month must be 01–12'); return r; }
  let year = parseInt(yy,10);
  if (yy.length === 2) { year += 2000; }
  const now = new Date();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  if (endOfMonth < now) err(r,'card.expiry','RANGE','Card is expired');
  if (options.strict) {
    const fiveYearsAhead = new Date(now.getFullYear()+10, now.getMonth(), now.getDate());
    if (endOfMonth > fiveYearsAhead) warn(r,'card.expiry','RANGE','Expiry is unusually far in the future');
  }
  return r;
}

export function validateCardCVC(cvc: string, cardType?: string, options: ValidationOptions = {}): BusinessValidationResult {
  const r = createResult();
  if (!cvc) { if (!options.allowEmpty) err(r,'card.cvc','REQUIRED','CVC is required'); return r; }
  if (!/^\d{3,4}$/.test(cvc)) { err(r,'card.cvc','FORMAT','CVC must be 3–4 digits'); return r; }
  if (options.strict) {
    if (cardType === 'American Express' && cvc.length !== 4) err(r,'card.cvc','LENGTH','Amex CVC must be 4 digits');
    if (cardType && cardType !== 'American Express' && cvc.length !== 3) err(r,'card.cvc','LENGTH',`${cardType} CVC must be 3 digits`);
  }
  return r;
}

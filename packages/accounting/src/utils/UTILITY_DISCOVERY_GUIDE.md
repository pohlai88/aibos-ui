/**
 * UTILITY DISCOVERY GUIDE
 * 
 * This file shows you ALL available utilities and how to discover opportunities
 * to use them in your existing codebase.
 */

// ============================================================================
// 1. SAFE OBJECT UTILITIES
// ============================================================================

// ✅ Use these instead of manual object access:
import { safeGet, isRecord, hasKey } from '../utils';

// BEFORE (unsafe):
const value = obj?.property?.nested; // Could be undefined
if (obj && 'property' in obj) { /* manual check */ }

// AFTER (safe):
const value = safeGet(obj, 'property.nested', 'default');
if (isRecord(obj) && hasKey(obj, 'property')) { /* type-safe */ }

// ============================================================================
// 2. FINANCIAL ROUNDING UTILITIES
// ============================================================================

// ✅ Use these instead of Math.round() for financial calculations:
import { round2, round2HalfUp, round2Bankers, toMinorUnits, fromMinorUnits } from '../utils';

// BEFORE (floating point errors):
const amount = Math.round(1.005 * 100) / 100; // Might be 1.00 instead of 1.01

// AFTER (precise):
const amount = round2HalfUp(1.005); // Always 1.01
const cents = toMinorUnits(123.45); // 12345 (no float drift)
const dollars = fromMinorUnits(12345); // 123.45

// ============================================================================
// 3. OBJECT SHAPING UTILITIES
// ============================================================================

// ✅ Use these instead of manual object filtering:
import { omitUndefined, buildConditionalObject, safeSpread } from '../utils';

// BEFORE (manual):
const clean = Object.fromEntries(
  Object.entries(obj).filter(([, v]) => v !== undefined)
);

// AFTER (clean):
const clean = omitUndefined(obj);

// BEFORE (manual conditional properties):
const result = {};
if (condition1) result.prop1 = value1;
if (condition2) result.prop2 = value2;

// AFTER (declarative):
const result = buildConditionalObject(
  [condition1, 'prop1', value1],
  [condition2, 'prop2', value2]
);

// ============================================================================
// 4. CURRENCY UTILITIES
// ============================================================================

// ✅ Use these instead of manual currency handling:
import { 
  isValidCurrency, 
  getCurrencyDecimalsStrict, 
  normalizeCurrency,
  SUPPORTED_CURRENCIES 
} from '../utils';

// BEFORE (manual validation):
const DECIMALS = { USD: 2, EUR: 2, JPY: 0 };
const decimals = DECIMALS[currency] || 2;

// AFTER (centralized):
if (!isValidCurrency(currency)) throw new Error('Invalid currency');
const decimals = getCurrencyDecimalsStrict(currency);

// ============================================================================
// 5. PERIOD UTILITIES
// ============================================================================

// ✅ Use these instead of manual date/period handling:
import { 
  parseAccountingPeriod, 
  getPeriodRangeUTC, 
  isDateInPeriod 
} from '../utils';

// BEFORE (manual parsing):
const [year, month] = period.split('-').map(Number);

// AFTER (validated):
const parsed = parseAccountingPeriod(period);
if (!parsed) throw new Error('Invalid period');
const { year, month, format } = parsed;

// ============================================================================
// 6. ACCOUNT CODE UTILITIES
// ============================================================================

// ✅ Use these instead of manual account code validation:
import { 
  isValidAccountCode, 
  normalizeAccountCode, 
  parseHierarchicalAccountCode 
} from '../utils';

// BEFORE (manual validation):
const code = accountCode.trim().toUpperCase();

// AFTER (validated):
if (!isValidAccountCode(accountCode)) throw new Error('Invalid account code');
const normalized = normalizeAccountCode(accountCode);

// ============================================================================
// 7. JOURNAL ENTRY UTILITIES
// ============================================================================

// ✅ Use these instead of manual balance validation:
import { 
  validateJournalEntryBalance, 
  shouldUseBigIntForJournal 
} from '../utils';

// BEFORE (manual validation):
const totalDebits = entries.reduce((sum, e) => sum + e.debitAmount, 0);
const totalCredits = entries.reduce((sum, e) => sum + e.creditAmount, 0);
if (totalDebits !== totalCredits) throw new Error('Unbalanced');

// AFTER (comprehensive):
const validation = validateJournalEntryBalance(entries);
if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}

// ============================================================================
// 8. FINANCIAL CALCULATION UTILITIES
// ============================================================================

// ✅ Use these instead of manual financial calculations:
import { 
  calculateCompoundInterest, 
  calculatePresentValue,
  calculateStraightLineDepreciation,
  calculateTax 
} from '../utils';

// BEFORE (manual calculations):
const interest = principal * Math.pow(1 + rate, periods) - principal;

// AFTER (validated):
const interest = calculateCompoundInterest(principal, rate, periods);

// ============================================================================
// HOW TO DISCOVER OPPORTUNITIES
// ============================================================================

/*
1. SEARCH PATTERNS TO FIND OPPORTUNITIES:

   Currency handling:
   - Search: "currency.*decimals|DECIMALS.*currency|Math.round.*currency"
   - Replace with: getCurrencyDecimalsStrict(), isValidCurrency()

   Object access:
   - Search: "obj\\?\\..*\\?\\..*|obj\\[.*\\]\\?\\."
   - Replace with: safeGet()

   Manual rounding:
   - Search: "Math\\.round.*\\*.*100.*/.*100|Math\\.round.*factor"
   - Replace with: round2(), round2HalfUp()

   Object filtering:
   - Search: "Object\\.fromEntries.*filter.*undefined"
   - Replace with: omitUndefined()

   Manual validation:
   - Search: "if.*typeof.*===.*string.*&&.*includes|if.*currency.*===.*USD"
   - Replace with: isValidCurrency(), isValidAccountType()

2. COMMON PATTERNS TO REPLACE:

   ❌ Manual currency decimals:
   const DECIMALS = { USD: 2, EUR: 2 };
   
   ✅ Use utility:
   const decimals = getCurrencyDecimalsStrict(currency);

   ❌ Manual rounding:
   Math.round(amount * 100) / 100
   
   ✅ Use utility:
   round2(amount)

   ❌ Manual object cleaning:
   Object.fromEntries(Object.entries(obj).filter(([,v]) => v !== undefined))
   
   ✅ Use utility:
   omitUndefined(obj)

   ❌ Manual validation:
   if (typeof value === 'string' && SUPPORTED_CURRENCIES.includes(value))
   
   ✅ Use utility:
   if (isValidCurrency(value))

3. AUTOMATED DISCOVERY COMMANDS:

   Find currency handling:
   grep -r "currency.*decimals\|DECIMALS.*currency" src/
   
   Find manual rounding:
   grep -r "Math\.round.*\*.*100.*/.*100" src/
   
   Find object access patterns:
   grep -r "obj\?\.\w*\?\.\w*" src/
   
   Find manual validation:
   grep -r "typeof.*===.*string.*&&" src/
*/

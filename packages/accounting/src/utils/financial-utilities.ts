/**
 * Financial Calculation Utilities - Phase 2 Implementation
 * 
 * Comprehensive financial calculation utilities for accounting operations.
 * Extends the existing financial utilities with additional calculations.
 * 
 * Features:
 * - Tax calculations (inclusive/exclusive)
 * - Discount and markup calculations
 * - Margin and ROI calculations
 * - NPV and IRR calculations
 * - Payback period calculations
 * - Advanced depreciation methods
 * - Currency-aware calculations
 */

import {
  type SupportedCurrency,
  normalizeCurrency,
  roundToCurrency,
  toMinor,
  fromMinor,
  isEmpty,
} from './index';
import { createValidationError } from './error-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DiscountCalculation {
  originalAmount: number;
  discountRate: number;
  discountAmount: number;
  finalAmount: number;
  currency: SupportedCurrency;
}

export interface MarkupCalculation {
  cost: number;
  markupRate: number;
  markupAmount: number;
  sellingPrice: number;
  currency: SupportedCurrency;
}

export interface MarginCalculation {
  sellingPrice: number;
  cost: number;
  marginAmount: number;
  marginPercentage: number;
}

export interface ROICalculation {
  investment: number;
  return: number;
  roi: number;
  period: number; // in years
}

export interface NPVCalculation {
  cashFlows: number[];
  discountRate: number;
  npv: number;
  periods: number;
}

export interface IRRCalculation {
  cashFlows: number[];
  irr: number;
  iterations: number;
  converged: boolean;
}

export interface PaybackCalculation {
  investment: number;
  annualCashFlow: number;
  paybackPeriod: number; // in years
  paybackPeriodMonths: number;
}

export interface DepreciationSchedule {
  year: number;
  beginningValue: number;
  depreciation: number;
  endingValue: number;
  accumulatedDepreciation: number;
}

// Minor-units tuple for tax lines
export interface TaxTupleMinor {
  netMinor: number;
  taxMinor: number;
  grossMinor: number;
  rate: number;
  currency: SupportedCurrency;
}

export interface NPVScheduledRow {
  period: number;
  cashFlow: number;
  discountFactor: number;
  presentValue: number;
  cumulativeNPV: number;
}

export interface IRRSchedule {
  irr: number;
  converged: boolean;
  iterations: number;
  rows: NPVScheduledRow[];
}

// ============================================================================
// TAX CALCULATIONS
// ============================================================================

// Note: Tax calculation functions are already implemented in accounting-utilities.ts
// This section provides additional tax-related utilities

/**
 * Calculate tax-exclusive amount from tax-inclusive amount
 */
export function calculateTaxExclusiveAmount(
  grossAmount: number,
  rate: number,
  currency: SupportedCurrency = 'MYR'
): number {
  if (grossAmount < 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Gross amount cannot be negative',
        grossAmount,
        { operation: 'calculate-tax-from-gross' }
      );
  }
  if (rate < 0 || rate >= 1) throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Tax rate must be between 0 and 1 (exclusive)',
        rate,
        { operation: 'calculate-tax' }
      );
  const current = normalizeCurrency(currency)!;
  return roundToCurrency(grossAmount / (1 + rate), current);
}

// ============================================================================
// DISCOUNT CALCULATIONS
// ============================================================================

/**
 * Calculate discount amount and final price
 */
export function calculateDiscount(
  amount: number,
  discountRate: number,
  currency: SupportedCurrency = 'MYR'
): DiscountCalculation {
  if (amount < 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Amount cannot be negative',
        amount,
        { operation: 'calculate-discount' }
      );
  }
  if (discountRate < 0 || discountRate > 1) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Discount rate must be between 0 and 1',
        discountRate,
        { operation: 'calculate-discount' }
      );
  }

  const current = normalizeCurrency(currency)!;
  const discountAmount = roundToCurrency(amount * discountRate, current);
  const finalAmount = roundToCurrency(amount - discountAmount, current);

  return {
    originalAmount: amount,
    discountRate,
    discountAmount,
    finalAmount,
    currency: current,
  };
}

/**
 * Calculate discount rate from original and final amounts
 */
export function calculateDiscountRate(
  originalAmount: number,
  finalAmount: number
): number {
  if (originalAmount <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Original amount must be positive',
        originalAmount,
        { operation: 'calculate-percentage-change' }
      );
  }
  if (finalAmount < 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Final amount cannot be negative',
        finalAmount,
        { operation: 'calculate-percentage-change' }
      );
  }
  if (finalAmount > originalAmount) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Final amount cannot be greater than original amount',
        finalAmount,
        { operation: 'calculate-percentage-change' }
      );
  }

  return (originalAmount - finalAmount) / originalAmount;
}

// ============================================================================
// MARKUP CALCULATIONS
// ============================================================================

/**
 * Calculate markup amount and selling price
 */
export function calculateMarkup(
  cost: number,
  markupRate: number,
  currency: SupportedCurrency = 'MYR'
): MarkupCalculation {
  if (cost < 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Cost cannot be negative',
        cost,
        { operation: 'calculate-markup' }
      );
  }
  if (markupRate < 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Markup rate cannot be negative',
        markupRate,
        { operation: 'calculate-markup' }
      );
  }

  const current = normalizeCurrency(currency)!;
  const markupAmount = roundToCurrency(cost * markupRate, current);
  const sellingPrice = roundToCurrency(cost + markupAmount, current);

  return {
    cost,
    markupRate,
    markupAmount,
    sellingPrice,
    currency: current,
  };
}

/**
 * Calculate markup rate from cost and selling price
 */
export function calculateMarkupRate(
  cost: number,
  sellingPrice: number
): number {
  if (cost <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Cost must be positive',
        cost,
        { operation: 'calculate-margin' }
      );
  }
  if (sellingPrice < 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Selling price cannot be negative',
        sellingPrice,
        { operation: 'calculate-margin' }
      );
  }

  return (sellingPrice - cost) / cost;
}

// ============================================================================
// MARGIN CALCULATIONS
// ============================================================================

/**
 * Calculate margin amount and percentage
 */
export function calculateMargin(
  sellingPrice: number,
  cost: number
): MarginCalculation {
  if (sellingPrice < 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Selling price cannot be negative',
        sellingPrice,
        { operation: 'calculate-margin' }
      );
  }
  if (cost < 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Cost cannot be negative',
        cost,
        { operation: 'calculate-markup' }
      );
  }
  if (sellingPrice < cost) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Selling price cannot be less than cost',
        sellingPrice,
        { operation: 'calculate-margin' }
      );
  }

  const marginAmount = sellingPrice - cost;
  const marginPercentage = sellingPrice > 0 ? marginAmount / sellingPrice : 0;

  return {
    sellingPrice,
    cost,
    marginAmount,
    marginPercentage,
  };
}

/**
 * Calculate selling price from cost and desired margin percentage
 */
export function calculateSellingPriceFromMargin(
  cost: number,
  marginPercentage: number
): number {
  if (cost < 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Cost cannot be negative',
        cost,
        { operation: 'calculate-markup' }
      );
  }
  if (marginPercentage < 0 || marginPercentage >= 1) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Margin percentage must be between 0 and 1',
        marginPercentage,
        { operation: 'calculate-margin' }
      );
  }

  return cost / (1 - marginPercentage);
}

// ============================================================================
// ROI CALCULATIONS
// ============================================================================

/**
 * Calculate Return on Investment (ROI)
 */
export function calculateROI(
  investment: number,
  returnAmount: number,
  period: number = 1
): ROICalculation {
  if (investment <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Investment must be positive',
        investment,
        { operation: 'calculate-roi' }
      );
  }
  if (period <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Period must be positive',
        period,
        { operation: 'calculate-roi' }
      );
  }

  const roi = (returnAmount - investment) / investment;

  return {
    investment,
    return: returnAmount,
    roi,
    period,
  };
}

/**
 * Calculate annualized ROI
 */
export function calculateAnnualizedROI(
  investment: number,
  returnAmount: number,
  period: number
): number {
  if (investment <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Investment must be positive',
        investment,
        { operation: 'calculate-roi' }
      );
  }
  if (period <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Period must be positive',
        period,
        { operation: 'calculate-roi' }
      );
  }

  const totalROI = (returnAmount - investment) / investment;
  return Math.pow(1 + totalROI, 1 / period) - 1;
}

// ============================================================================
// NPV CALCULATIONS
// ============================================================================

/**
 * Calculate Net Present Value (NPV)
 */
export function calculateNPV(
  cashFlows: number[],
  discountRate: number
): NPVCalculation {
  if (isEmpty(cashFlows)) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Cash flows array cannot be empty',
        cashFlows,
        { operation: 'calculate-npv' }
      );
  }
  if (discountRate < 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Discount rate cannot be negative',
        discountRate,
        { operation: 'calculate-npv' }
      );
  }

  let npv = 0;
  for (let index = 0; index < cashFlows.length; index++) {
    const cashFlow = cashFlows[index];
    if (cashFlow !== undefined) {
      npv += cashFlow / Math.pow(1 + discountRate, index);
    }
  }

  return {
    cashFlows,
    discountRate,
    npv,
    periods: cashFlows.length,
  };
}

// ============================================================================
// IRR CALCULATIONS
// ============================================================================

/**
 * Calculate Internal Rate of Return (IRR) using Newton-Raphson method
 */
export function calculateIRR(
  cashFlows: number[],
  maxIterations: number = 100,
  tolerance: number = 1e-6
): IRRCalculation {
  if (cashFlows.length < 2) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'At least 2 cash flows required for IRR calculation',
        cashFlows,
        { operation: 'calculate-irr' }
      );
  }

  // Require sign change for a real root in standard NPV
  const hasPos = cashFlows.some(v => v > 0);
  const hasNeg = cashFlows.some(v => v < 0);
  if (!(hasPos && hasNeg)) {
    return { cashFlows, irr: NaN, iterations: 0, converged: false };
  }

  // Initial guess
  let rate = 0.1;
  let iterations = 0;

  for (let index = 0; index < maxIterations; index++) {
    iterations = index + 1;

    // Calculate NPV and its derivative
    let npv = 0;
    let npvDerivative = 0;

    for (let index = 0; index < cashFlows.length; index++) {
      const discountFactor = Math.pow(1 + rate, index);
      const cf = cashFlows[index];
      if (cf !== undefined) {
        npv += cf / discountFactor;
        npvDerivative -= (index * cf) / (discountFactor * (1 + rate));
      }
    }

    // Check convergence
    if (Math.abs(npv) < tolerance) {
      return {
        cashFlows,
        irr: rate,
        iterations,
        converged: true,
      };
    }

    // Newton-Raphson update
    if (Math.abs(npvDerivative) < tolerance) {
      break; // Avoid division by zero
    }

    const newRate = rate - npv / npvDerivative;

    // Check for convergence in rate
    if (Math.abs(newRate - rate) < tolerance) {
      return {
        cashFlows,
        irr: newRate,
        iterations,
        converged: true,
      };
    }

    rate = newRate;

    // Prevent extreme rates for stability
    if (rate < -0.99) {
      rate = -0.99;
    }
    if (rate > 10) {
      rate = 10;
    }
  }

  // Fallback: bisection on [-0.99, 10] if signs differ
  const npvAt = (r: number) =>
    cashFlows.reduce((accumulator, cf, index) => accumulator + cf / Math.pow(1 + r, index), 0);
  let lo = -0.99, hi = 10;
  let fLo = npvAt(lo), fHi = npvAt(hi);
  if (Number.isFinite(fLo) && Number.isFinite(fHi) && fLo * fHi < 0) {
    for (let index = 0; index < 200; index++) {
      const mid = (lo + hi) / 2;
      const fMid = npvAt(mid);
      if (Math.abs(fMid) < tolerance) {
        return { cashFlows, irr: mid, iterations: iterations + index, converged: true };
      }
      if (fLo * fMid < 0) {
        hi = mid; fHi = fMid;
      } else {
        lo = mid; fLo = fMid;
      }
    }
    return { cashFlows, irr: (lo + hi) / 2, iterations: iterations + 200, converged: true };
  }

  return {
    cashFlows,
    irr: rate,
    iterations,
    converged: false,
  };
}

// ============================================================================
// PAYBACK PERIOD CALCULATIONS
// ============================================================================

/**
 * Calculate payback period
 */
export function calculatePaybackPeriod(
  investment: number,
  annualCashFlow: number
): PaybackCalculation {
  if (investment <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Investment must be positive',
        investment,
        { operation: 'calculate-roi' }
      );
  }
  if (annualCashFlow <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Annual cash flow must be positive',
        annualCashFlow,
        { operation: 'calculate-payback-period' }
      );
  }

  const paybackPeriod = investment / annualCashFlow;
  const paybackPeriodMonths = paybackPeriod * 12;

  return {
    investment,
    annualCashFlow,
    paybackPeriod,
    paybackPeriodMonths,
  };
}

/**
 * Calculate payback period with varying cash flows
 */
export function calculatePaybackPeriodVariable(
  investment: number,
  cashFlows: number[]
): { paybackPeriod: number; paybackPeriodMonths: number; converged: boolean } {
  if (investment <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Investment must be positive',
        investment,
        { operation: 'calculate-roi' }
      );
  }
  if (isEmpty(cashFlows)) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Cash flows array cannot be empty',
        cashFlows,
        { operation: 'calculate-npv' }
      );
  }

  let cumulativeCashFlow = 0;

  for (let index = 0; index < cashFlows.length; index++) {
    const cashFlow = cashFlows[index];
    if (cashFlow !== undefined) {
      cumulativeCashFlow += cashFlow;

      if (cumulativeCashFlow >= investment) {
        // Interpolate for partial year
        const previousCumulative = cumulativeCashFlow - cashFlow;
        const remainingInvestment = investment - previousCumulative;
        if (cashFlow === 0) {
          return { paybackPeriod: index + 1, paybackPeriodMonths: (index + 1) * 12, converged: true };
        }
        const partialYear = remainingInvestment / cashFlow;
        return {
          paybackPeriod: index + partialYear,
          paybackPeriodMonths: (index + partialYear) * 12,
          converged: true,
        };
      }
    }
  }

  return {
    paybackPeriod: cashFlows.length,
    paybackPeriodMonths: cashFlows.length * 12,
    converged: false,
  };
}

// ============================================================================
// DEPRECIATION CALCULATIONS
// ============================================================================

// Note: Basic depreciation functions are already implemented in accounting-utilities.ts
// This section provides additional depreciation methods

/**
 * Calculate depreciation using sum-of-years-digits method
 */
export function calculateSumOfYearsDepreciation(
  cost: number,
  salvageValue: number,
  usefulLife: number
): DepreciationSchedule[] {
  if (cost <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Cost must be positive',
        cost,
        { operation: 'calculate-margin' }
      );
  }
  if (salvageValue < 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Salvage value cannot be negative',
        salvageValue,
        { operation: 'calculate-depreciation' }
      );
  }
  if (usefulLife <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Useful life must be positive',
        usefulLife,
        { operation: 'calculate-depreciation' }
      );
  }

  const sumOfYears = (usefulLife * (usefulLife + 1)) / 2;
  const schedule: DepreciationSchedule[] = [];
  let accumulatedDepreciation = 0;

  for (let year = 1; year <= usefulLife; year++) {
    const beginningValue = cost - accumulatedDepreciation;
    const depreciationRate = (usefulLife - year + 1) / sumOfYears;
    const depreciation = (cost - salvageValue) * depreciationRate;
    accumulatedDepreciation += depreciation;
    const endingValue = cost - accumulatedDepreciation;

    schedule.push({
      year,
      beginningValue,
      depreciation,
      endingValue,
      accumulatedDepreciation,
    });
  }

  return schedule;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate effective annual rate from nominal rate and compounding frequency
 */
export function calculateEffectiveAnnualRate(
  nominalRate: number,
  compoundingFrequency: number
): number {
  if (nominalRate < 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Nominal rate cannot be negative',
        nominalRate,
        { operation: 'calculate-effective-rate' }
      );
  }
  if (compoundingFrequency <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Compounding frequency must be positive',
        compoundingFrequency,
        { operation: 'calculate-effective-rate' }
      );
  }

  return Math.pow(1 + nominalRate / compoundingFrequency, compoundingFrequency) - 1;
}

/**
 * Calculate present value of an annuity
 */
export function calculatePresentValueAnnuity(
  payment: number,
  rate: number,
  periods: number
): number {
  if (payment <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Payment must be positive',
        { payment, rate, periods },
        { operation: 'financial-operation' }
      );
  }
  if (rate < 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Rate cannot be negative',
        { payment, rate, periods },
        { operation: 'financial-operation' }
      );
  }
  if (periods <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Periods must be positive',
        { payment, rate, periods },
        { operation: 'financial-operation' }
      );
  }

  if (rate === 0) {
    return payment * periods;
  }

  return payment * ((1 - Math.pow(1 + rate, -periods)) / rate);
}

/**
 * Calculate future value of an annuity
 */
export function calculateFutureValueAnnuity(
  payment: number,
  rate: number,
  periods: number
): number {
  if (payment <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Payment must be positive',
        { payment, rate, periods },
        { operation: 'financial-operation' }
      );
  }
  if (rate < 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Rate cannot be negative',
        { payment, rate, periods },
        { operation: 'financial-operation' }
      );
  }
  if (periods <= 0) {
    throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Periods must be positive',
        { payment, rate, periods },
        { operation: 'financial-operation' }
      );
  }

  if (rate === 0) {
    return payment * periods;
  }

  return payment * ((Math.pow(1 + rate, periods) - 1) / rate);
}

// ============================================================================
// MINOR-UNITS MODE (cents-safe)  ✅
// ============================================================================

/** Net → (net,tax,gross) in MINOR units */
export function calcTaxTupleMinorFromNet(
  netMinor: number,
  rate: number,
  currency: SupportedCurrency
): TaxTupleMinor {
  if (netMinor < 0) throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'netMinor cannot be negative',
        { netMinor, rate, currency },
        { operation: 'financial-operation' }
      );
  if (rate < 0 || rate > 1) throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Rate must be between 0 and 1',
        { netMinor, rate, currency },
        { operation: 'financial-operation' }
      );
  const current = normalizeCurrency(currency)!;
  const net = fromMinor(netMinor, current);
  const tax = roundToCurrency(net * rate, current);
  const gross = roundToCurrency(net + tax, current);
  return {
    netMinor,
    taxMinor: toMinor(tax, current),
    grossMinor: toMinor(gross, current),
    rate,
    currency: current,
  };
}

/** Gross → (net,tax,gross) in MINOR units */
export function calcTaxTupleMinorFromGross(
  grossMinor: number,
  rate: number,
  currency: SupportedCurrency
): TaxTupleMinor {
  if (grossMinor < 0) throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'grossMinor cannot be negative',
        { grossMinor, rate, currency },
        { operation: 'financial-operation' }
      );
  if (rate < 0 || rate >= 1) throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Rate must be between 0 and 1 (exclusive)',
        { grossMinor, rate, currency },
        { operation: 'financial-operation' }
      );
  const current = normalizeCurrency(currency)!;
  const gross = fromMinor(grossMinor, current);
  const net = roundToCurrency(gross / (1 + rate), current);
  const tax = roundToCurrency(gross - net, current);
  return {
    netMinor: toMinor(net, current),
    taxMinor: toMinor(tax, current),
    grossMinor,
    rate,
    currency: current,
  };
}

/**
 * Allocate line-level tax in MINOR units so that sum(lineTax) === totalTax.
 * Pro-rata by unrounded line tax weights with largest-remainder distribution.
 */
export function allocateTaxAcrossLinesMinor(
  lineNetMinors: number[],
  rate: number,
  currency: SupportedCurrency
): number[] {
  if (rate < 0 || rate > 1) throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Rate must be between 0 and 1',
        { lineNetMinors, rate, currency },
        { operation: 'financial-operation' }
      );
  const current = normalizeCurrency(currency)!;
  const sumNetMinor = lineNetMinors.reduce((a, v) => a + v, 0);
  const totalTaxMinor = toMinor(roundToCurrency(fromMinor(sumNetMinor, current) * rate, current), current);
  if (sumNetMinor === 0) return lineNetMinors.map(() => 0);

  // weights by real (unrounded) tax per line
  const weights = lineNetMinors.map(nm => fromMinor(nm, current) * rate);
  const sumWeights = weights.reduce((a, v) => a + v, 0) || 1;
  const rawAlloc = weights.map(w => (w / sumWeights) * totalTaxMinor);
  const floorAlloc = rawAlloc.map(Math.floor);
  let remainder = totalTaxMinor - floorAlloc.reduce((a, v) => a + v, 0);
  // distribute remainder to largest fractional parts
  const indexByFrac: Array<{ i: number; frac: number }> = rawAlloc
    .map((v, index) => ({ i: index, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floorAlloc];
  
  // Distribute remainder using largest remainder method
  let remainingRemainder = remainder;
  for (let k = 0; k < indexByFrac.length && remainingRemainder > 0; k++) {
    const item = indexByFrac[k];
    if (item && typeof item.i === 'number' && item.i >= 0) {
      const index = item.i as number;
      if (index < result.length) {
        result[index]! += 1;
        remainingRemainder -= 1;
      }
    }
  }
  return result;
}

// ============================================================================
// SCHEDULES FOR AUDIT TRAILS (NPV/IRR)  ✅
// ============================================================================
export function generateNPVSchedule(
  cashFlows: number[],
  discountRate: number
): { npv: number; rows: NPVScheduledRow[] } {
  if (cashFlows.length === 0) throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Cash flows array cannot be empty',
        cashFlows,
        { operation: 'calculate-npv' }
      );
  if (discountRate < 0) throw createValidationError(
        'INVALID_FINANCIAL_INPUT',
        'Discount rate cannot be negative',
        discountRate,
        { operation: 'calculate-npv' }
      );
  const rows: NPVScheduledRow[] = [];
  let cumulative = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    const cashFlow = cashFlows[t];
    if (cashFlow !== undefined) {
      const df = 1 / Math.pow(1 + discountRate, t);
      const pv = cashFlow * df;
      cumulative += pv;
      rows.push({ period: t, cashFlow, discountFactor: df, presentValue: pv, cumulativeNPV: cumulative });
    }
  }
  return { npv: cumulative, rows };
}

export function generateIRRSchedule(
  cashFlows: number[],
  options?: { irr?: number; maxIterations?: number; tolerance?: number }
): IRRSchedule {
  const { irr, iterations, converged } = options?.irr != null
    ? { irr: options.irr, iterations: 0, converged: true }
    : calculateIRR(cashFlows, options?.maxIterations, options?.tolerance);
  const r = irr ?? NaN;
  const { rows } = Number.isFinite(r) ? generateNPVSchedule(cashFlows, r) : { rows: [] as NPVScheduledRow[] };
  return { irr: r, iterations: iterations ?? 0, converged: !!converged, rows };
}

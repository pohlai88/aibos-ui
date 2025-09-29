/**
 * Aging Utilities
 * 
 * AR/AP aging buckets, as-of logic, and credit-limit checks.
 * Provides comprehensive aging analysis, credit limit management, and collection tracking.
 * 
 * @fileoverview Aging calculations, bucket management, and credit limit operations
 */

import {
  SupportedCurrency,
} from './accounting-utilities';
import { createValidationError } from './error-utilities';
import { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import { isValidDate, differenceInDaysFns } from './date-utilities';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface AgingTransaction {
  id: string;
  customer: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  currency: SupportedCurrency;
  status: TransactionStatus;
  paidAmount: number;
  remainingAmount: number;
}

export interface AgingBucket {
  id: string;
  name: string;
  minDays: number;
  maxDays: number;
  description: string;
  color?: string;
}

export interface AgingResult {
  customer: string;
  asOfDate: Date;
  buckets: AgingBucketResult[];
  totalAmount: number;
  totalOverdue: number;
  averageDays: number;
}

export interface AgingBucketResult {
  bucket: AgingBucket;
  amount: number;
  percentage: number;
  transactionCount: number;
  averageDays: number;
}

export interface CreditLimit {
  customer: string;
  limit: number;
  currency: SupportedCurrency;
  effectiveDate: Date;
  expiryDate?: Date;
  status: LimitStatus;
  lastUpdated: Date;
}

export interface CreditLimitResult {
  customer: string;
  currentBalance: number;
  creditLimit: number;
  availableCredit: number;
  utilizationPercentage: number;
  isWithinLimit: boolean;
  excessAmount: number;
}

export interface CustomerAging {
  customer: string;
  asOfDate: Date;
  buckets: AgingBucketResult[];
  totalAmount: number;
  totalOverdue: number;
  averageDays: number;
  creditLimit: CreditLimit | null;
  creditUtilization: CreditUtilization | null;
}

export interface VendorAging {
  vendor: string;
  asOfDate: Date;
  buckets: AgingBucketResult[];
  totalAmount: number;
  totalOverdue: number;
  averageDays: number;
}

export interface AgingBucketDefinition {
  buckets: AgingBucket[];
  defaultBucket?: AgingBucket;
  overdueThreshold: number;
}

export interface BucketUpdates {
  buckets: AgingBucket[];
  addBucket?: AgingBucket;
  removeBucket?: string;
  updateBucket?: AgingBucket;
}

export interface CreditUtilization {
  customer: string;
  asOfDate: Date;
  currentBalance: number;
  creditLimit: number;
  availableCredit: number;
  utilizationPercentage: number;
  isWithinLimit: boolean;
  excessAmount: number;
  trend: UtilizationTrend;
}

export interface CollectionActivity {
  id: string;
  customer: string;
  date: Date;
  type: ActivityType;
  description: string;
  amount: number;
  currency: SupportedCurrency;
  status: ActivityStatus;
  followUpDate?: Date;
}

export interface CollectionEfficiency {
  customer: string;
  period: DateRange;
  totalInvoices: number;
  collectedInvoices: number;
  collectionRate: number;
  averageCollectionDays: number;
  totalCollected: number;
  totalOutstanding: number;
}

export interface CollectionReport {
  period: DateRange;
  customers: string[];
  totalOutstanding: number;
  totalCollected: number;
  collectionRate: number;
  averageCollectionDays: number;
  efficiency: CollectionEfficiency[];
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type TransactionStatus = 'open' | 'paid' | 'partial' | 'overdue' | 'cancelled';
export type LimitStatus = 'active' | 'suspended' | 'expired' | 'cancelled';
export type UtilizationTrend = 'increasing' | 'decreasing' | 'stable' | 'volatile';
export type ActivityType = 'call' | 'email' | 'letter' | 'payment' | 'promise' | 'dispute';
export type ActivityStatus = 'completed' | 'pending' | 'cancelled' | 'rescheduled';

// ============================================================================
// Aging Calculations
// ============================================================================

/**
 * Calculate aging
 */
export function calculateAging(
  transactions: AgingTransaction[],
  asOfDate: Date,
  buckets: AgingBucket[]
): AgingResult {
  if (!isValidDate(asOfDate)) {
    throw createValidationError(
      'INVALID_AS_OF_DATE',
      'As-of date must be valid',
      asOfDate,
      { operation: 'calculate-aging' }
    );
  }
  
  if (!buckets || buckets.length === 0) {
    throw createValidationError(
      'MISSING_AGING_BUCKETS',
      'Aging buckets are required',
      buckets,
      { operation: 'calculate-aging' }
    );
  }
  
  const bucketResults: AgingBucketResult[] = [];
  let totalAmount = 0;
  let totalOverdue = 0;
  let totalDays = 0;
  let transactionCount = 0;
  
  for (const bucket of buckets) {
    const bucketTransactions = transactions.filter(transaction => {
      const days = differenceInDaysFns(asOfDate, transaction.dueDate);
      return days >= bucket.minDays && days <= bucket.maxDays;
    });
    
    const bucketAmount = bucketTransactions.reduce((sum, t) => sum + t.remainingAmount, 0);
    const bucketPercentage = totalAmount > 0 ? (bucketAmount / totalAmount) * 100 : 0;
    const bucketAverageDays = bucketTransactions.length > 0 
      ? bucketTransactions.reduce((sum, t) => sum + differenceInDaysFns(asOfDate, t.dueDate), 0) / bucketTransactions.length
      : 0;
    
    bucketResults.push({
      bucket,
      amount: bucketAmount,
      percentage: bucketPercentage,
      transactionCount: bucketTransactions.length,
      averageDays: bucketAverageDays,
    });
    
    totalAmount += bucketAmount;
    totalDays += bucketTransactions.reduce((sum, t) => sum + differenceInDaysFns(asOfDate, t.dueDate), 0);
    transactionCount += bucketTransactions.length;
    
    // Check if bucket represents overdue amounts
    if (bucket.minDays > 0) {
      totalOverdue += bucketAmount;
    }
  }
  
  const averageDays = transactionCount > 0 ? totalDays / transactionCount : 0;
  
  return {
    customer: transactions[0]?.customer || 'UNKNOWN',
    asOfDate,
    buckets: bucketResults,
    totalAmount,
    totalOverdue,
    averageDays,
  };
}

/**
 * Calculate customer aging
 */
export function calculateCustomerAging(
  customer: string,
  asOfDate: Date,
  buckets: AgingBucket[]
): CustomerAging {
  // This would typically fetch transactions from a database
  const transactions: AgingTransaction[] = []; // Placeholder
  
  const agingResult = calculateAging(transactions, asOfDate, buckets);
  
  return {
    customer,
    asOfDate,
    buckets: agingResult.buckets,
    totalAmount: agingResult.totalAmount,
    totalOverdue: agingResult.totalOverdue,
    averageDays: agingResult.averageDays,
    creditLimit: null, // Would be fetched from database
    creditUtilization: null, // Would be calculated
  };
}

/**
 * Calculate vendor aging
 */
export function calculateVendorAging(
  vendor: string,
  asOfDate: Date,
  buckets: AgingBucket[]
): VendorAging {
  // This would typically fetch transactions from a database
  const transactions: AgingTransaction[] = []; // Placeholder
  
  const agingResult = calculateAging(transactions, asOfDate, buckets);
  
  return {
    vendor,
    asOfDate,
    buckets: agingResult.buckets,
    totalAmount: agingResult.totalAmount,
    totalOverdue: agingResult.totalOverdue,
    averageDays: agingResult.averageDays,
  };
}

// ============================================================================
// Bucket Management
// ============================================================================

/**
 * Define aging buckets
 */
export function defineAgingBuckets(definition: AgingBucketDefinition): AgingBucket[] {
  if (!definition.buckets || definition.buckets.length === 0) {
    throw createValidationError(
      'MISSING_BUCKETS',
      'Aging buckets are required',
      definition.buckets,
      { operation: 'define-aging-buckets' }
    );
  }
  
  // Validate buckets
  for (const bucket of definition.buckets) {
    const validation = validateAgingBucket(bucket);
    if (!validation.isValid) {
      throw createValidationError(
        'INVALID_AGING_BUCKET',
        'Invalid aging bucket provided',
        bucket,
        { operation: 'define-aging-buckets' }
      );
    }
  }
  
  return definition.buckets;
}

/**
 * Validate aging buckets
 */
export function validateAgingBuckets(buckets: AgingBucket[]): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!buckets || buckets.length === 0) {
    issues.push({
      code: 'REQUIRED',
      path: 'buckets',
      message: 'Aging buckets are required',
    });
  }
  
  for (const bucket of buckets) {
    const bucketValidation = validateAgingBucket(bucket);
    if (!bucketValidation.isValid && bucketValidation.issues) {
      issues.push(...bucketValidation.issues);
    }
  }
  
  // Check for overlapping buckets
  for (let i = 0; i < buckets.length; i++) {
    for (let j = i + 1; j < buckets.length; j++) {
      const bucket1 = buckets[i];
      const bucket2 = buckets[j];
      
      if (bucket1 && bucket2 && bucket1.minDays <= bucket2.maxDays && bucket2.minDays <= bucket1.maxDays) {
        issues.push({
          code: 'CONSISTENCY',
          path: 'buckets',
          message: `Buckets ${bucket1.name} and ${bucket2.name} overlap`,
        });
      }
    }
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(i => i.severity !== 'warning').map(i => i.message),
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    issues,
  };
}

/**
 * Update aging buckets
 */
export function updateAgingBuckets(
  buckets: AgingBucket[],
  updates: BucketUpdates
): AgingBucket[] {
  let updatedBuckets = [...buckets];
  
  if (updates.addBucket) {
    updatedBuckets.push(updates.addBucket);
  }
  
  if (updates.removeBucket) {
    updatedBuckets = updatedBuckets.filter(bucket => bucket.id !== updates.removeBucket);
  }
  
  if (updates.updateBucket) {
    const index = updatedBuckets.findIndex(bucket => bucket.id === updates.updateBucket!.id);
    if (index !== -1) {
      updatedBuckets[index] = updates.updateBucket;
    }
  }
  
  if (updates.buckets) {
    updatedBuckets = updates.buckets;
  }
  
  return updatedBuckets;
}

// ============================================================================
// Credit Limit Operations
// ============================================================================

/**
 * Check credit limit
 */
export function checkCreditLimit(
  customer: string,
  requestedAmount: number,
  currentBalance: number
): CreditLimitResult {
  if (requestedAmount < 0) {
    throw createValidationError(
      'NEGATIVE_REQUESTED_AMOUNT',
      'Requested amount cannot be negative',
      requestedAmount,
      { operation: 'check-credit-limit' }
    );
  }
  
  if (currentBalance < 0) {
    throw createValidationError(
      'NEGATIVE_CURRENT_BALANCE',
      'Current balance cannot be negative',
      currentBalance,
      { operation: 'check-credit-limit' }
    );
  }
  
  // This would typically fetch credit limit from database
  const creditLimit = 10000; // Placeholder
  
  const availableCredit = Math.max(0, creditLimit - currentBalance);
  const utilizationPercentage = creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;
  const isWithinLimit = (currentBalance + requestedAmount) <= creditLimit;
  const excessAmount = Math.max(0, (currentBalance + requestedAmount) - creditLimit);
  
  return {
    customer,
    currentBalance,
    creditLimit,
    availableCredit,
    utilizationPercentage,
    isWithinLimit,
    excessAmount,
  };
}

/**
 * Update credit limit
 */
export function updateCreditLimit(
  customer: string,
  newLimit: number,
  effectiveDate: Date
): CreditLimit {
  if (newLimit < 0) {
    throw createValidationError(
      'NEGATIVE_CREDIT_LIMIT',
      'Credit limit cannot be negative',
      newLimit,
      { operation: 'update-credit-limit' }
    );
  }
  
  if (!isValidDate(effectiveDate)) {
    throw createValidationError(
      'INVALID_EFFECTIVE_DATE',
      'Effective date must be valid',
      effectiveDate,
      { operation: 'update-credit-limit' }
    );
  }
  
  return {
    customer,
    limit: newLimit,
    currency: 'USD', // Default currency
    effectiveDate,
    status: 'active',
    lastUpdated: new Date(),
  };
}

/**
 * Validate credit limit
 */
export function validateCreditLimit(limit: CreditLimit): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!limit.customer) {
    issues.push({
      code: 'REQUIRED',
      path: 'customer',
      message: 'Customer is required',
    });
  }
  
  if (limit.limit < 0) {
    issues.push({
      code: 'RANGE',
      path: 'limit',
      message: 'Credit limit cannot be negative',
    });
  }
  
  if (!limit.currency) {
    issues.push({
      code: 'REQUIRED',
      path: 'currency',
      message: 'Currency is required',
    });
  }
  
  if (!isValidDate(limit.effectiveDate)) {
    issues.push({
      code: 'FORMAT',
      path: 'effectiveDate',
      message: 'Effective date must be valid',
    });
  }
  
  if (!limit.status || !['active', 'suspended', 'expired', 'cancelled'].includes(limit.status)) {
    issues.push({
      code: 'UNSUPPORTED',
      path: 'status',
      message: 'Invalid credit limit status',
    });
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(i => i.severity !== 'warning').map(i => i.message),
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    issues,
  };
}

/**
 * Calculate credit utilization
 */
export function calculateCreditUtilization(
  customer: string,
  asOfDate: Date
): CreditUtilization {
  // This would typically fetch data from database
  const currentBalance = 0; // Placeholder
  const creditLimit = 10000; // Placeholder
  
  const availableCredit = Math.max(0, creditLimit - currentBalance);
  const utilizationPercentage = creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;
  const isWithinLimit = currentBalance <= creditLimit;
  const excessAmount = Math.max(0, currentBalance - creditLimit);
  
  return {
    customer,
    asOfDate,
    currentBalance,
    creditLimit,
    availableCredit,
    utilizationPercentage,
    isWithinLimit,
    excessAmount,
    trend: 'stable', // Would be calculated based on historical data
  };
}

// ============================================================================
// Collection Management
// ============================================================================

/**
 * Track collection activity
 */
export function trackCollectionActivity(
  customer: string,
  activity: CollectionActivity
): void {
  // This would typically store in database
  console.log(`Tracking collection activity for customer ${customer}:`, activity);
}

/**
 * Calculate collection efficiency
 */
export function calculateCollectionEfficiency(
  customer: string,
  period: DateRange
): CollectionEfficiency {
  // This would typically fetch data from database
  const totalInvoices = 0; // Placeholder
  const collectedInvoices = 0; // Placeholder
  const totalCollected = 0; // Placeholder
  const totalOutstanding = 0; // Placeholder
  
  const collectionRate = totalInvoices > 0 ? (collectedInvoices / totalInvoices) * 100 : 0;
  const averageCollectionDays = 0; // Would be calculated from actual data
  
  return {
    customer,
    period,
    totalInvoices,
    collectedInvoices,
    collectionRate,
    averageCollectionDays,
    totalCollected,
    totalOutstanding,
  };
}

/**
 * Generate collection report
 */
export function generateCollectionReport(
  customers: string[],
  period: DateRange
): CollectionReport {
  const efficiency: CollectionEfficiency[] = [];
  let totalOutstanding = 0;
  let totalCollected = 0;
  let totalCollectionDays = 0;
  
  for (const customer of customers) {
    const customerEfficiency = calculateCollectionEfficiency(customer, period);
    efficiency.push(customerEfficiency);
    
    totalOutstanding += customerEfficiency.totalOutstanding;
    totalCollected += customerEfficiency.totalCollected;
    totalCollectionDays += customerEfficiency.averageCollectionDays;
  }
  
  const collectionRate = totalOutstanding > 0 ? (totalCollected / (totalOutstanding + totalCollected)) * 100 : 0;
  const averageCollectionDays = customers.length > 0 ? totalCollectionDays / customers.length : 0;
  
  return {
    period,
    customers,
    totalOutstanding,
    totalCollected,
    collectionRate,
    averageCollectionDays,
    efficiency,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate aging bucket
 */
function validateAgingBucket(bucket: AgingBucket): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!bucket.id) {
    issues.push({
      code: 'REQUIRED',
      path: 'id',
      message: 'Bucket ID is required',
    });
  }
  
  if (!bucket.name) {
    issues.push({
      code: 'REQUIRED',
      path: 'name',
      message: 'Bucket name is required',
    });
  }
  
  if (bucket.minDays < 0) {
    issues.push({
      code: 'RANGE',
      path: 'minDays',
      message: 'Minimum days cannot be negative',
    });
  }
  
  if (bucket.maxDays < 0) {
    issues.push({
      code: 'RANGE',
      path: 'maxDays',
      message: 'Maximum days cannot be negative',
    });
  }
  
  if (bucket.minDays > bucket.maxDays) {
    issues.push({
      code: 'RANGE',
      path: 'minDays,maxDays',
      message: 'Minimum days cannot be greater than maximum days',
    });
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(i => i.severity !== 'warning').map(i => i.message),
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    issues,
  };
}

/**
 * Get default aging buckets
 */
export function getDefaultAgingBuckets(): AgingBucket[] {
  return [
    {
      id: 'current',
      name: 'Current',
      minDays: 0,
      maxDays: 30,
      description: '0-30 days',
      color: '#28a745',
    },
    {
      id: '31-60',
      name: '31-60 Days',
      minDays: 31,
      maxDays: 60,
      description: '31-60 days',
      color: '#ffc107',
    },
    {
      id: '61-90',
      name: '61-90 Days',
      minDays: 61,
      maxDays: 90,
      description: '61-90 days',
      color: '#fd7e14',
    },
    {
      id: 'over-90',
      name: 'Over 90 Days',
      minDays: 91,
      maxDays: Number.MAX_SAFE_INTEGER,
      description: 'Over 90 days',
      color: '#dc3545',
    },
  ];
}

/**
 * Get aging summary
 */
export function getAgingSummary(
  results: AgingResult[]
): {
  totalCustomers: number;
  totalAmount: number;
  totalOverdue: number;
  averageDays: number;
  bucketSummary: Record<string, number>;
} {
  const totalCustomers = results.length;
  const totalAmount = results.reduce((sum, result) => sum + result.totalAmount, 0);
  const totalOverdue = results.reduce((sum, result) => sum + result.totalOverdue, 0);
  const totalDays = results.reduce((sum, result) => sum + result.averageDays, 0);
  const averageDays = totalCustomers > 0 ? totalDays / totalCustomers : 0;
  
  const bucketSummary: Record<string, number> = {};
  for (const result of results) {
    for (const bucket of result.buckets) {
      bucketSummary[bucket.bucket.name] = (bucketSummary[bucket.bucket.name] || 0) + bucket.amount;
    }
  }
  
  return {
    totalCustomers,
    totalAmount,
    totalOverdue,
    averageDays,
    bucketSummary,
  };
}

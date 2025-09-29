/**
 * Inventory Costing Utilities - Enterprise Production Ready
 * 
 * Comprehensive inventory costing utilities for FIFO/LIFO/weighted average layers,
 * COGS extraction, and write-down rules.
 * 
 * Features:
 * - Multiple costing methods (FIFO, LIFO, weighted average, specific identification)
 * - Layer management and cost flow tracking
 * - COGS calculation and validation
 * - Write-down rules and impairment handling
 * - Integration with existing financial and validation utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   calculateFIFOCost,
 *   calculateWeightedAverageCost,
 *   calculateCOGS,
 *   calculateWriteDown
 * } from './inventory-costing-utilities';
 * 
 * // Calculate FIFO cost
 * const fifoResult = calculateFIFOCost(inventoryItem, 100, new Date());
 * 
 * // Calculate COGS
 * const cogsResult = calculateCOGS(sale, 'fifo');
 * ```
 */

import type { 
  SupportedCurrency
} from './accounting-utilities';
import type { 
  BusinessValidationResult as ValidationResult
} from './validation-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Inventory item with complete costing information
 */
export interface InventoryItem {
  readonly id: string;
  readonly itemNumber: string;
  readonly description: string;
  readonly category: InventoryCategory;
  readonly unitOfMeasure: string;
  readonly costingMethod: CostingMethod;
  readonly layers: readonly InventoryLayer[];
  readonly totalQuantity: number;
  readonly totalValue: number;
  readonly currency: SupportedCurrency;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Inventory layer for cost flow tracking
 */
export interface InventoryLayer {
  readonly id: string;
  readonly item: InventoryItem;
  readonly quantity: number;
  readonly unitCost: number;
  readonly totalCost: number;
  readonly date: Date;
  readonly batchNumber?: string;
  readonly expiryDate?: Date;
  readonly status: LayerStatus;
  readonly createdAt: Date;
}

/**
 * Costing calculation result
 */
export interface CostingResult {
  readonly item: InventoryItem;
  readonly quantity: number;
  readonly unitCost: number;
  readonly totalCost: number;
  readonly method: CostingMethod;
  readonly layersUsed: readonly InventoryLayer[];
  readonly calculationDate: Date;
}

/**
 * COGS calculation result
 */
export interface COGSResult {
  readonly sale: InventorySale;
  readonly quantity: number;
  readonly unitCost: number;
  readonly totalCOGS: number;
  readonly method: CostingMethod;
  readonly layersUsed: readonly InventoryLayer[];
  readonly calculationDate: Date;
}

/**
 * Write-down calculation result
 */
export interface WriteDownResult {
  readonly item: InventoryItem;
  readonly currentValue: number;
  readonly marketValue: number;
  readonly writeDownAmount: number;
  readonly writeDownPercentage: number;
  readonly reason: WriteDownReason;
  readonly calculationDate: Date;
}

/**
 * Inventory sale transaction
 */
export interface InventorySale {
  readonly id: string;
  readonly item: InventoryItem;
  readonly quantity: number;
  readonly saleDate: Date;
  readonly customer: string;
  readonly unitPrice: number;
  readonly totalAmount: number;
  readonly currency: SupportedCurrency;
  readonly reference?: string;
}

/**
 * Inventory transaction for layer updates
 */
export interface InventoryTransaction {
  readonly id: string;
  readonly item: InventoryItem;
  readonly transactionType: InventoryTransactionType;
  readonly quantity: number;
  readonly unitCost?: number;
  readonly totalCost?: number;
  readonly date: Date;
  readonly reference?: string;
  readonly batchNumber?: string;
  readonly expiryDate?: Date;
}

/**
 * Inventory adjustment for write-downs
 */
export interface InventoryAdjustment {
  readonly id: string;
  readonly item: InventoryItem;
  readonly adjustmentType: AdjustmentType;
  readonly quantity: number;
  readonly unitCost: number;
  readonly totalCost: number;
  readonly reason: string;
  readonly date: Date;
  readonly reference?: string;
}

/**
 * Costing calculation options
 */
export interface CostingOptions {
  readonly asOfDate: Date;
  readonly includeExpired?: boolean;
  readonly precision?: number;
  readonly currency?: SupportedCurrency;
}

/**
 * COGS calculation options
 */
export interface COGSOptions {
  readonly method: CostingMethod;
  readonly asOfDate: Date;
  readonly includeExpired?: boolean;
  readonly precision?: number;
}

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Supported costing methods
 */
export type CostingMethod = 
  | 'fifo'
  | 'lifo'
  | 'weighted_average'
  | 'specific_identification';

/**
 * Inventory categories
 */
export type InventoryCategory = 
  | 'raw_materials'
  | 'work_in_progress'
  | 'finished_goods'
  | 'supplies'
  | 'merchandise'
  | 'components'
  | 'consumables'
  | 'other';

/**
 * Layer status for tracking
 */
export type LayerStatus = 
  | 'active'
  | 'consumed'
  | 'expired'
  | 'written_off'
  | 'reserved'
  | 'quarantined';

/**
 * Write-down reasons
 */
export type WriteDownReason = 
  | 'obsolescence'
  | 'damage'
  | 'market_decline'
  | 'expiry'
  | 'quality_issues'
  | 'regulatory'
  | 'other';

/**
 * Inventory transaction types
 */
export type InventoryTransactionType = 
  | 'receipt'
  | 'issue'
  | 'transfer'
  | 'adjustment'
  | 'write_off'
  | 'return'
  | 'cycle_count';

/**
 * Adjustment types
 */
export type AdjustmentType = 
  | 'write_down'
  | 'write_off'
  | 'revaluation'
  | 'cycle_count'
  | 'damage'
  | 'theft'
  | 'other';

/**
 * Costing method configurations
 */
export const COSTING_METHODS = {
  fifo: {
    name: 'First In, First Out',
    description: 'Assumes oldest inventory is sold first',
    advantages: ['Simple to understand', 'Matches physical flow'],
    disadvantages: ['May not reflect current costs']
  },
  lifo: {
    name: 'Last In, First Out',
    description: 'Assumes newest inventory is sold first',
    advantages: ['Matches current costs', 'Tax benefits'],
    disadvantages: ['May not match physical flow']
  },
  weighted_average: {
    name: 'Weighted Average',
    description: 'Uses average cost of all inventory',
    advantages: ['Smooths cost fluctuations', 'Simple calculation'],
    disadvantages: ['May not reflect current market']
  },
  specific_identification: {
    name: 'Specific Identification',
    description: 'Tracks specific items individually',
    advantages: ['Most accurate', 'Matches physical flow'],
    disadvantages: ['Complex to implement', 'Requires detailed tracking']
  }
} as const;

/**
 * Inventory category configurations
 */
export const INVENTORY_CATEGORIES = {
  raw_materials: { name: 'Raw Materials', perishable: false, defaultCosting: 'fifo' },
  work_in_progress: { name: 'Work in Progress', perishable: false, defaultCosting: 'weighted_average' },
  finished_goods: { name: 'Finished Goods', perishable: true, defaultCosting: 'fifo' },
  supplies: { name: 'Supplies', perishable: false, defaultCosting: 'weighted_average' },
  merchandise: { name: 'Merchandise', perishable: true, defaultCosting: 'fifo' },
  components: { name: 'Components', perishable: false, defaultCosting: 'fifo' },
  consumables: { name: 'Consumables', perishable: true, defaultCosting: 'weighted_average' },
  other: { name: 'Other', perishable: false, defaultCosting: 'weighted_average' }
} as const;

// ============================================================================
// COSTING METHODS
// ============================================================================

/**
 * Calculate FIFO cost for inventory
 * 
 * @param inventory - Inventory item
 * @param quantity - Quantity to cost
 * @param asOfDate - Date to calculate as of
 * @returns FIFO costing result
 * 
 * @example
 * ```typescript
 * const fifoResult = calculateFIFOCost(inventoryItem, 100, new Date());
 * ```
 */
export function calculateFIFOCost(
  inventory: InventoryItem,
  quantity: number,
  asOfDate: Date
): CostingResult {
  // Validate inputs
  if (quantity <= 0) {
    throw new Error('Quantity must be positive');
  }

  if (quantity > inventory.totalQuantity) {
    throw new Error('Quantity exceeds available inventory');
  }

  // Sort layers by date (oldest first for FIFO)
  const sortedLayers = [...inventory.layers]
    .filter(layer => layer.status === 'active' && layer.date <= asOfDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  let remainingQuantity = quantity;
  let totalCost = 0;
  const layersUsed: InventoryLayer[] = [];

  // Consume layers in FIFO order
  for (const layer of sortedLayers) {
    if (remainingQuantity <= 0) break;

    const quantityToUse = Math.min(remainingQuantity, layer.quantity);
    const layerCost = quantityToUse * layer.unitCost;
    
    totalCost += layerCost;
    remainingQuantity -= quantityToUse;
    
    layersUsed.push({
      ...layer,
      quantity: quantityToUse,
      totalCost: layerCost
    });
  }

  if (remainingQuantity > 0) {
    throw new Error('Insufficient inventory layers for FIFO calculation');
  }

  const unitCost = totalCost / quantity;

  return {
    item: inventory,
    quantity,
    unitCost,
    totalCost,
    method: 'fifo',
    layersUsed,
    calculationDate: new Date()
  };
}

/**
 * Calculate weighted average cost for inventory
 * 
 * @param inventory - Inventory item
 * @param quantity - Quantity to cost
 * @param asOfDate - Date to calculate as of
 * @returns Weighted average costing result
 * 
 * @example
 * ```typescript
 * const avgResult = calculateWeightedAverageCost(inventoryItem, 100, new Date());
 * ```
 */
export function calculateWeightedAverageCost(
  inventory: InventoryItem,
  quantity: number,
  asOfDate: Date
): CostingResult {
  // Validate inputs
  if (quantity <= 0) {
    throw new Error('Quantity must be positive');
  }

  if (quantity > inventory.totalQuantity) {
    throw new Error('Quantity exceeds available inventory');
  }

  // Get active layers as of date
  const activeLayers = inventory.layers.filter(
    layer => layer.status === 'active' && layer.date <= asOfDate
  );

  // Calculate weighted average unit cost
  const totalQuantity = activeLayers.reduce((sum, layer) => sum + layer.quantity, 0);
  const totalValue = activeLayers.reduce((sum, layer) => sum + layer.totalCost, 0);
  
  if (totalQuantity === 0) {
    throw new Error('No active inventory layers found');
  }

  const weightedAverageUnitCost = totalValue / totalQuantity;
  const totalCost = quantity * weightedAverageUnitCost;

  // Create virtual layer for the calculation
  const virtualLayer: InventoryLayer = {
    id: `virtual-${Date.now()}`,
    item: inventory,
    quantity,
    unitCost: weightedAverageUnitCost,
    totalCost,
    date: asOfDate,
    status: 'active',
    createdAt: new Date()
  };

  return {
    item: inventory,
    quantity,
    unitCost: weightedAverageUnitCost,
    totalCost,
    method: 'weighted_average',
    layersUsed: [virtualLayer],
    calculationDate: new Date()
  };
}

/**
 * Calculate LIFO cost for inventory
 * 
 * @param inventory - Inventory item
 * @param quantity - Quantity to cost
 * @param asOfDate - Date to calculate as of
 * @returns LIFO costing result
 * 
 * @example
 * ```typescript
 * const lifoResult = calculateLIFOCost(inventoryItem, 100, new Date());
 * ```
 */
export function calculateLIFOCost(
  inventory: InventoryItem,
  quantity: number,
  asOfDate: Date
): CostingResult {
  // Validate inputs
  if (quantity <= 0) {
    throw new Error('Quantity must be positive');
  }

  if (quantity > inventory.totalQuantity) {
    throw new Error('Quantity exceeds available inventory');
  }

  // Sort layers by date (newest first for LIFO)
  const sortedLayers = [...inventory.layers]
    .filter(layer => layer.status === 'active' && layer.date <= asOfDate)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  let remainingQuantity = quantity;
  let totalCost = 0;
  const layersUsed: InventoryLayer[] = [];

  // Consume layers in LIFO order
  for (const layer of sortedLayers) {
    if (remainingQuantity <= 0) break;

    const quantityToUse = Math.min(remainingQuantity, layer.quantity);
    const layerCost = quantityToUse * layer.unitCost;
    
    totalCost += layerCost;
    remainingQuantity -= quantityToUse;
    
    layersUsed.push({
      ...layer,
      quantity: quantityToUse,
      totalCost: layerCost
    });
  }

  if (remainingQuantity > 0) {
    throw new Error('Insufficient inventory layers for LIFO calculation');
  }

  const unitCost = totalCost / quantity;

  return {
    item: inventory,
    quantity,
    unitCost,
    totalCost,
    method: 'lifo',
    layersUsed,
    calculationDate: new Date()
  };
}

/**
 * Calculate specific identification cost
 * 
 * @param inventory - Inventory item
 * @param layers - Specific layers to use
 * @returns Specific identification costing result
 * 
 * @example
 * ```typescript
 * const specificResult = calculateSpecificIdentification(inventoryItem, selectedLayers);
 * ```
 */
export function calculateSpecificIdentification(
  inventory: InventoryItem,
  layers: readonly InventoryLayer[]
): CostingResult {
  // Validate inputs
  if (layers.length === 0) {
    throw new Error('At least one layer must be specified');
  }

  // Validate all layers belong to the inventory item
  for (const layer of layers) {
    if (layer.item.id !== inventory.id) {
      throw new Error('All layers must belong to the same inventory item');
    }
  }

  // Calculate total quantity and cost
  const totalQuantity = layers.reduce((sum, layer) => sum + layer.quantity, 0);
  const totalCost = layers.reduce((sum, layer) => sum + layer.totalCost, 0);
  const unitCost = totalCost / totalQuantity;

  return {
    item: inventory,
    quantity: totalQuantity,
    unitCost,
    totalCost,
    method: 'specific_identification',
    layersUsed: layers,
    calculationDate: new Date()
  };
}

// ============================================================================
// LAYER MANAGEMENT
// ============================================================================

/**
 * Create new inventory layer
 * 
 * @param item - Inventory item
 * @param quantity - Layer quantity
 * @param cost - Layer cost
 * @param date - Layer date
 * @param options - Additional layer options
 * @returns New inventory layer
 * 
 * @example
 * ```typescript
 * const layer = createInventoryLayer(item, 100, 10.50, new Date(), {
 *   batchNumber: 'BATCH-001',
 *   expiryDate: new Date('2025-12-31')
 * });
 * ```
 */
export function createInventoryLayer(
  item: InventoryItem,
  quantity: number,
  cost: number,
  date: Date,
  options: {
    batchNumber?: string;
    expiryDate?: Date;
    status?: LayerStatus;
  } = {}
): InventoryLayer {
  // Validate inputs
  if (quantity <= 0) {
    throw new Error('Quantity must be positive');
  }

  if (cost <= 0) {
    throw new Error('Cost must be positive');
  }

  if (date > new Date()) {
    throw new Error('Layer date cannot be in the future');
  }

  const totalCost = quantity * cost;

  const layer: {
    id: string;
    item: InventoryItem;
    quantity: number;
    unitCost: number;
    totalCost: number;
    date: Date;
    status: LayerStatus;
    createdAt: Date;
    batchNumber?: string;
    expiryDate?: Date;
  } = {
    id: `layer-${item.id}-${Date.now()}`,
    item,
    quantity,
    unitCost: cost,
    totalCost,
    date,
    status: options.status || 'active',
    createdAt: new Date()
  };

  if (options.batchNumber !== undefined) {
    layer.batchNumber = options.batchNumber;
  }

  if (options.expiryDate !== undefined) {
    layer.expiryDate = options.expiryDate;
  }

  return layer as InventoryLayer;
}

/**
 * Update inventory layers based on transaction
 * 
 * @param item - Inventory item
 * @param transaction - Inventory transaction
 * @returns Updated inventory layers
 * 
 * @example
 * ```typescript
 * const updatedLayers = updateInventoryLayers(item, transaction);
 * ```
 */
export function updateInventoryLayers(
  item: InventoryItem,
  transaction: InventoryTransaction
): readonly InventoryLayer[] {
  const updatedLayers: InventoryLayer[] = [...item.layers];

  switch (transaction.transactionType) {
    case 'receipt':
      // Add new layer for receipt
      if (transaction.unitCost === undefined) {
        throw new Error('Unit cost is required for receipt transaction');
      }
      
      const layerOptions: {
        batchNumber?: string;
        expiryDate?: Date;
        status?: LayerStatus;
      } = {};

      if (transaction.batchNumber !== undefined) {
        layerOptions.batchNumber = transaction.batchNumber;
      }

      if (transaction.expiryDate !== undefined) {
        layerOptions.expiryDate = transaction.expiryDate;
      }

      const newLayer = createInventoryLayer(
        item,
        transaction.quantity,
        transaction.unitCost,
        transaction.date,
        layerOptions
      );
      
      updatedLayers.push(newLayer);
      break;

    case 'issue':
      // Consume layers based on costing method
      const layersToConsume = consumeLayersForIssue(item, transaction);
      updatedLayers.push(...layersToConsume);
      break;

    case 'adjustment':
      // Adjust layer quantities
      if (transaction.unitCost === undefined) {
        throw new Error('Unit cost is required for adjustment transaction');
      }
      
      const adjustmentLayer = createInventoryLayer(
        item,
        transaction.quantity,
        transaction.unitCost,
        transaction.date,
        { status: 'active' }
      );
      
      updatedLayers.push(adjustmentLayer);
      break;

    case 'write_off':
      // Mark layers as written off
      const writeOffLayers = markLayersAsWrittenOff(item, transaction);
      updatedLayers.push(...writeOffLayers);
      break;

    default:
      throw new Error(`Unsupported transaction type: ${transaction.transactionType}`);
  }

  return updatedLayers;
}

/**
 * Validate inventory layers
 * 
 * @param layers - Layers to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateInventoryLayers(layers);
 * if (!validation.isValid) {
 *   console.error('Layer validation failed:', validation.errors);
 * }
 * ```
 */
export function validateInventoryLayers(layers: readonly InventoryLayer[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate each layer
  for (const layer of layers) {
    if (layer.quantity <= 0) {
      errors.push(`Layer ${layer.id}: Quantity must be positive`);
    }

    if (layer.unitCost <= 0) {
      errors.push(`Layer ${layer.id}: Unit cost must be positive`);
    }

    if (layer.totalCost !== layer.quantity * layer.unitCost) {
      errors.push(`Layer ${layer.id}: Total cost does not match quantity × unit cost`);
    }

    if (layer.date > new Date()) {
      errors.push(`Layer ${layer.id}: Date cannot be in the future`);
    }

    if (layer.expiryDate && layer.expiryDate < layer.date) {
      errors.push(`Layer ${layer.id}: Expiry date cannot be before layer date`);
    }

    // Check for expired layers
    if (layer.expiryDate && layer.expiryDate < new Date() && layer.status === 'active') {
      warnings.push(`Layer ${layer.id}: Expired but still active`);
    }
  }

  // Check for duplicate layer IDs
  const layerIds = layers.map(layer => layer.id);
  const duplicateIds = layerIds.filter((id, index) => layerIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate layer IDs found: ${duplicateIds.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// COGS OPERATIONS
// ============================================================================

/**
 * Calculate COGS for a sale
 * 
 * @param sale - Inventory sale
 * @param costingMethod - Costing method to use
 * @returns COGS calculation result
 * 
 * @example
 * ```typescript
 * const cogsResult = calculateCOGS(sale, 'fifo');
 * ```
 */
export function calculateCOGS(
  sale: InventorySale,
  costingMethod: CostingMethod
): COGSResult {
  // Validate sale
  if (sale.quantity <= 0) {
    throw new Error('Sale quantity must be positive');
  }

  if (sale.quantity > sale.item.totalQuantity) {
    throw new Error('Sale quantity exceeds available inventory');
  }

  // Calculate cost based on method
  let costingResult: CostingResult;

  switch (costingMethod) {
    case 'fifo':
      costingResult = calculateFIFOCost(sale.item, sale.quantity, sale.saleDate);
      break;
    case 'lifo':
      costingResult = calculateLIFOCost(sale.item, sale.quantity, sale.saleDate);
      break;
    case 'weighted_average':
      costingResult = calculateWeightedAverageCost(sale.item, sale.quantity, sale.saleDate);
      break;
    default:
      throw new Error(`Unsupported costing method: ${costingMethod}`);
  }

  return {
    sale,
    quantity: costingResult.quantity,
    unitCost: costingResult.unitCost,
    totalCOGS: costingResult.totalCost,
    method: costingMethod,
    layersUsed: costingResult.layersUsed,
    calculationDate: new Date()
  };
}

/**
 * Extract COGS from layers
 * 
 * @param layers - Inventory layers
 * @param quantity - Quantity to extract
 * @param method - Costing method
 * @returns COGS extraction result
 * 
 * @example
 * ```typescript
 * const cogsResult = extractCOGSFromLayers(layers, 100, 'fifo');
 * ```
 */
export function extractCOGSFromLayers(
  layers: readonly InventoryLayer[],
  quantity: number,
  method: CostingMethod
): COGSResult {
  if (layers.length === 0) {
    throw new Error('No layers provided');
  }

  // Get the inventory item from the first layer
  const item = layers[0]?.item;
  if (!item) {
    throw new Error('No valid layers provided');
  }

  // Create a virtual sale for COGS calculation
  const virtualSale: InventorySale = {
    id: `virtual-sale-${Date.now()}`,
    item,
    quantity,
    saleDate: new Date(),
    customer: 'Internal',
    unitPrice: 0,
    totalAmount: 0,
    currency: item.currency
  };

  return calculateCOGS(virtualSale, method);
}

/**
 * Validate COGS calculation
 * 
 * @param cogs - COGS result to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateCOGSCalculation(cogs);
 * if (!validation.isValid) {
 *   console.error('COGS validation failed:', validation.errors);
 * }
 * ```
 */
export function validateCOGSCalculation(cogs: COGSResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (cogs.quantity <= 0) {
    errors.push('COGS quantity must be positive');
  }

  if (cogs.unitCost <= 0) {
    errors.push('COGS unit cost must be positive');
  }

  if (cogs.totalCOGS <= 0) {
    errors.push('COGS total must be positive');
  }

  // Validate calculation
  const expectedTotal = cogs.quantity * cogs.unitCost;
  if (Math.abs(cogs.totalCOGS - expectedTotal) > 0.01) {
    errors.push('COGS total does not match quantity × unit cost');
  }

  // Validate layers used
  const layersTotalQuantity = cogs.layersUsed.reduce((sum, layer) => sum + layer.quantity, 0);
  if (Math.abs(layersTotalQuantity - cogs.quantity) > 0.01) {
    errors.push('Layers total quantity does not match COGS quantity');
  }

  const layersTotalCost = cogs.layersUsed.reduce((sum, layer) => sum + layer.totalCost, 0);
  if (Math.abs(layersTotalCost - cogs.totalCOGS) > 0.01) {
    errors.push('Layers total cost does not match COGS total');
  }

  // Warnings
  if (cogs.unitCost > cogs.sale.unitPrice) {
    warnings.push('COGS unit cost exceeds sale unit price');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// WRITE-DOWN MANAGEMENT
// ============================================================================

/**
 * Calculate write-down for inventory
 * 
 * @param item - Inventory item
 * @param currentValue - Current inventory value
 * @param marketValue - Market value
 * @param reason - Write-down reason
 * @returns Write-down calculation result
 * 
 * @example
 * ```typescript
 * const writeDown = calculateWriteDown(item, 10000, 8000, 'market_decline');
 * ```
 */
export function calculateWriteDown(
  item: InventoryItem,
  currentValue: number,
  marketValue: number,
  reason: WriteDownReason
): WriteDownResult {
  // Validate inputs
  if (currentValue <= 0) {
    throw new Error('Current value must be positive');
  }

  if (marketValue < 0) {
    throw new Error('Market value cannot be negative');
  }

  if (marketValue >= currentValue) {
    throw new Error('Market value must be less than current value for write-down');
  }

  const writeDownAmount = currentValue - marketValue;
  const writeDownPercentage = (writeDownAmount / currentValue) * 100;

  return {
    item,
    currentValue,
    marketValue,
    writeDownAmount,
    writeDownPercentage,
    reason,
    calculationDate: new Date()
  };
}

/**
 * Apply write-down to inventory
 * 
 * @param item - Inventory item
 * @param writeDown - Write-down result
 * @returns Inventory adjustment
 * 
 * @example
 * ```typescript
 * const adjustment = applyWriteDown(item, writeDown);
 * ```
 */
export function applyWriteDown(
  item: InventoryItem,
  writeDown: WriteDownResult
): InventoryAdjustment {
  // Calculate unit write-down
  const unitWriteDown = writeDown.writeDownAmount / item.totalQuantity;

  return {
    id: `write-down-${item.id}-${Date.now()}`,
    item,
    adjustmentType: 'write_down',
    quantity: item.totalQuantity,
    unitCost: unitWriteDown,
    totalCost: writeDown.writeDownAmount,
    reason: `Write-down due to ${writeDown.reason}`,
    date: new Date(),
    reference: `WRITE-DOWN-${writeDown.reason.toUpperCase()}`
  };
}

/**
 * Validate write-down calculation
 * 
 * @param writeDown - Write-down result to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateWriteDown(writeDown);
 * if (!validation.isValid) {
 *   console.error('Write-down validation failed:', validation.errors);
 * }
 * ```
 */
export function validateWriteDown(writeDown: WriteDownResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (writeDown.currentValue <= 0) {
    errors.push('Current value must be positive');
  }

  if (writeDown.marketValue < 0) {
    errors.push('Market value cannot be negative');
  }

  if (writeDown.writeDownAmount <= 0) {
    errors.push('Write-down amount must be positive');
  }

  if (writeDown.writeDownPercentage <= 0) {
    errors.push('Write-down percentage must be positive');
  }

  // Validate calculations
  const expectedWriteDownAmount = writeDown.currentValue - writeDown.marketValue;
  if (Math.abs(writeDown.writeDownAmount - expectedWriteDownAmount) > 0.01) {
    errors.push('Write-down amount calculation is incorrect');
  }

  const expectedPercentage = (writeDown.writeDownAmount / writeDown.currentValue) * 100;
  if (Math.abs(writeDown.writeDownPercentage - expectedPercentage) > 0.01) {
    errors.push('Write-down percentage calculation is incorrect');
  }

  // Warnings
  if (writeDown.writeDownPercentage > 50) {
    warnings.push('Write-down percentage exceeds 50% - verify reasonableness');
  }

  if (writeDown.marketValue === 0) {
    warnings.push('Market value is zero - consider complete write-off');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Consume layers for issue transaction
 * 
 * @param item - Inventory item
 * @param transaction - Issue transaction
 * @returns Consumed layers
 */
function consumeLayersForIssue(
  item: InventoryItem,
  transaction: InventoryTransaction
): readonly InventoryLayer[] {
  const consumedLayers: InventoryLayer[] = [];
  let remainingQuantity = transaction.quantity;

  // Sort layers based on costing method
  const sortedLayers = [...item.layers]
    .filter(layer => layer.status === 'active')
    .sort((a, b) => {
      switch (item.costingMethod) {
        case 'fifo':
          return a.date.getTime() - b.date.getTime();
        case 'lifo':
          return b.date.getTime() - a.date.getTime();
        default:
          return a.date.getTime() - b.date.getTime();
      }
    });

  // Consume layers
  for (const layer of sortedLayers) {
    if (remainingQuantity <= 0) break;

    const quantityToConsume = Math.min(remainingQuantity, layer.quantity);
    
    consumedLayers.push({
      ...layer,
      quantity: quantityToConsume,
      totalCost: quantityToConsume * layer.unitCost,
      status: 'consumed'
    });

    remainingQuantity -= quantityToConsume;
  }

  if (remainingQuantity > 0) {
    throw new Error('Insufficient inventory for issue transaction');
  }

  return consumedLayers;
}

/**
 * Mark layers as written off
 * 
 * @param item - Inventory item
 * @param transaction - Write-off transaction
 * @returns Written-off layers
 */
function markLayersAsWrittenOff(
  item: InventoryItem,
  transaction: InventoryTransaction
): readonly InventoryLayer[] {
  const writtenOffLayers: InventoryLayer[] = [];
  let remainingQuantity = transaction.quantity;

  // Get active layers
  const activeLayers = item.layers.filter(layer => layer.status === 'active');

  // Mark layers as written off
  for (const layer of activeLayers) {
    if (remainingQuantity <= 0) break;

    const quantityToWriteOff = Math.min(remainingQuantity, layer.quantity);
    
    writtenOffLayers.push({
      ...layer,
      quantity: quantityToWriteOff,
      totalCost: quantityToWriteOff * layer.unitCost,
      status: 'written_off'
    });

    remainingQuantity -= quantityToWriteOff;
  }

  if (remainingQuantity > 0) {
    throw new Error('Insufficient inventory for write-off transaction');
  }

  return writtenOffLayers;
}

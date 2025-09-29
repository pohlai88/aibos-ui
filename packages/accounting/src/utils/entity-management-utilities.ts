/**
 * Entity Management - SSOT Implementation
 * 
 * Entity relationship and ownership management utilities.
 * Imports from consolidation-types.ts for consistency.
 */

import type {
  ConsolidationEntity,
  EntityRelationship,
  OwnershipChange,
  EntityType,
  ConsolidationMethod
} from './consolidation-types-utilities';

// ============================================================================
// ENTITY MANAGEMENT OPERATIONS
// ============================================================================

/**
 * Calculate entity ownership percentage
 * 
 * @param entity - Entity to calculate ownership for
 * @param relationships - Entity relationships
 * @returns Ownership percentage
 * 
 * @example
 * ```typescript
 * const ownership = calculateEntityOwnership(entity, relationships);
 * ```
 */
export function calculateEntityOwnership(
  entity: ConsolidationEntity,
  relationships: readonly EntityRelationship[]
): number {
  // Direct ownership from parent
  const directRelationship = relationships.find(
    rel => rel.childId === entity.id && rel.isActive
  );

  if (!directRelationship) {
    return entity.ownershipPercentage;
  }

  // Calculate effective ownership through parent chain
  const parentEntity = relationships.find(
    rel => rel.childId === directRelationship.parentId
  );

  if (parentEntity) {
    return (directRelationship.ownershipPercentage * parentEntity.ownershipPercentage) / 100;
  }

  return directRelationship.ownershipPercentage;
}

/**
 * Get entity hierarchy
 * 
 * @param entity - Entity to get hierarchy for
 * @param entities - All entities
 * @param relationships - Entity relationships
 * @returns Entity hierarchy tree
 */
export function getEntityHierarchy(
  entity: ConsolidationEntity,
  entities: readonly ConsolidationEntity[],
  relationships: readonly EntityRelationship[]
): EntityHierarchyNode {
  const children = relationships
    .filter(rel => rel.parentId === entity.id && rel.isActive)
    .map(rel => {
      const childEntity = entities.find(e => e.id === rel.childId);
      if (!childEntity) return null;
      return getEntityHierarchy(childEntity, entities, relationships);
    })
    .filter((node): node is EntityHierarchyNode => node !== null);

  return {
    entity,
    children,
    level: calculateEntityLevel(entity, relationships),
    ownershipPath: getOwnershipPath(entity, relationships)
  };
}

/**
 * Entity hierarchy node
 */
export interface EntityHierarchyNode {
  readonly entity: ConsolidationEntity;
  readonly children: readonly EntityHierarchyNode[];
  readonly level: number;
  readonly ownershipPath: readonly OwnershipStep[];
}

/**
 * Ownership step in the hierarchy
 */
export interface OwnershipStep {
  readonly entityId: string;
  readonly ownershipPercentage: number;
  readonly relationshipType: 'subsidiary' | 'associate' | 'joint_venture';
}

/**
 * Calculate entity level in hierarchy
 * 
 * @param entity - Entity
 * @param relationships - Entity relationships
 * @returns Level in hierarchy (0 = root)
 */
function calculateEntityLevel(
  entity: ConsolidationEntity,
  relationships: readonly EntityRelationship[]
): number {
  let level = 0;
  let currentEntity = entity;

  while (currentEntity.parentId) {
    const parentRelationship = relationships.find(
      rel => rel.childId === currentEntity.id && rel.isActive
    );
    
    if (!parentRelationship) break;
    
    level++;
    currentEntity = { ...currentEntity, id: parentRelationship.parentId } as ConsolidationEntity;
  }

  return level;
}

/**
 * Get ownership path for entity
 * 
 * @param entity - Entity
 * @param relationships - Entity relationships
 * @returns Ownership path
 */
function getOwnershipPath(
  entity: ConsolidationEntity,
  relationships: readonly EntityRelationship[]
): readonly OwnershipStep[] {
  const path: OwnershipStep[] = [];
  let currentEntity = entity;

  while (currentEntity.parentId) {
    const relationship = relationships.find(
      rel => rel.childId === currentEntity.id && rel.isActive
    );
    
    if (!relationship) break;

    path.unshift({
      entityId: relationship.parentId,
      ownershipPercentage: relationship.ownershipPercentage,
      relationshipType: relationship.relationshipType
    });

    currentEntity = { ...currentEntity, id: relationship.parentId } as ConsolidationEntity;
  }

  return path;
}

/**
 * Find related entities
 * 
 * @param entity - Entity to find related entities for
 * @param entities - All entities
 * @param relationships - Entity relationships
 * @returns Related entities
 */
export function findRelatedEntities(
  entity: ConsolidationEntity,
  entities: readonly ConsolidationEntity[],
  relationships: readonly EntityRelationship[]
): readonly ConsolidationEntity[] {
  const relatedIds = new Set<string>();

  // Find parent entities
  const parentRelationships = relationships.filter(
    rel => rel.childId === entity.id && rel.isActive
  );
  
  for (const rel of parentRelationships) {
    relatedIds.add(rel.parentId);
  }

  // Find child entities
  const childRelationships = relationships.filter(
    rel => rel.parentId === entity.id && rel.isActive
  );
  
  for (const rel of childRelationships) {
    relatedIds.add(rel.childId);
  }

  // Find sibling entities (entities with same parent)
  const siblingRelationships = relationships.filter(
    rel => rel.parentId === entity.parentId && rel.childId !== entity.id && rel.isActive
  );
  
  for (const rel of siblingRelationships) {
    relatedIds.add(rel.childId);
  }

  return entities.filter(e => relatedIds.has(e.id));
}

/**
 * Validate entity relationship
 * 
 * @param relationship - Relationship to validate
 * @param entities - All entities
 * @param existingRelationships - Existing relationships
 * @returns Validation result
 */
export function validateEntityRelationship(
  relationship: EntityRelationship,
  entities: readonly ConsolidationEntity[],
  existingRelationships: readonly EntityRelationship[]
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate entity IDs
  const parentEntity = entities.find(e => e.id === relationship.parentId);
  const childEntity = entities.find(e => e.id === relationship.childId);

  if (!parentEntity) {
    errors.push(`Parent entity not found: ${relationship.parentId}`);
  }

  if (!childEntity) {
    errors.push(`Child entity not found: ${relationship.childId}`);
  }

  // Validate ownership percentage
  if (relationship.ownershipPercentage < 0 || relationship.ownershipPercentage > 100) {
    errors.push('Ownership percentage must be between 0 and 100');
  }

  // Check for circular relationships
  if (parentEntity && childEntity) {
    if (wouldCreateCircularRelationship(relationship, existingRelationships)) {
      errors.push('Relationship would create circular dependency');
    }
  }

  // Check for duplicate relationships
  const duplicateRelationship = existingRelationships.find(
    rel => rel.parentId === relationship.parentId && 
           rel.childId === relationship.childId &&
           rel.id !== relationship.id
  );

  if (duplicateRelationship) {
    errors.push('Duplicate relationship already exists');
  }

  // Warnings
  if (relationship.ownershipPercentage < 20) {
    warnings.push('Low ownership percentage - may not qualify for consolidation');
  }

  if (relationship.ownershipPercentage > 50 && relationship.relationshipType !== 'subsidiary') {
    warnings.push('High ownership percentage should typically be subsidiary relationship');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check if relationship would create circular dependency
 * 
 * @param relationship - Relationship to check
 * @param existingRelationships - Existing relationships
 * @returns True if would create circular dependency
 */
function wouldCreateCircularRelationship(
  relationship: EntityRelationship,
  existingRelationships: readonly EntityRelationship[]
): boolean {
  // Check if child is already a parent of the parent (directly or indirectly)
  const visited = new Set<string>();
  const queue = [relationship.parentId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    if (currentId === relationship.childId) {
      return true; // Circular dependency found
    }

    // Add parents of current entity to queue
    const parents = existingRelationships
      .filter(rel => rel.childId === currentId && rel.isActive)
      .map(rel => rel.parentId);
    
    queue.push(...parents);
  }

  return false;
}

/**
 * Create entity relationship
 * 
 * @param parentId - Parent entity ID
 * @param childId - Child entity ID
 * @param ownershipPercentage - Ownership percentage
 * @param relationshipType - Type of relationship
 * @param options - Additional options
 * @returns Entity relationship
 */
export function createEntityRelationship(
  parentId: string,
  childId: string,
  ownershipPercentage: number,
  relationshipType: 'subsidiary' | 'associate' | 'joint_venture',
  options: {
    effectiveDate?: Date;
    expiryDate?: Date;
    metadata?: Record<string, unknown>;
  } = {}
): EntityRelationship {
  return {
    id: `rel-${parentId}-${childId}-${Date.now()}`,
    parentId,
    childId,
    ownershipPercentage,
    relationshipType,
    effectiveDate: options.effectiveDate || new Date(),
    ...(options.expiryDate && { expiryDate: options.expiryDate }),
    isActive: true,
    metadata: {
      createdBy: 'system',
      version: '1.0',
      ...options.metadata
    }
  };
}

/**
 * Record ownership change
 * 
 * @param entityId - Entity ID
 * @param parentId - Parent entity ID
 * @param oldOwnershipPercentage - Old ownership percentage
 * @param newOwnershipPercentage - New ownership percentage
 * @param changeType - Type of change
 * @param description - Description of change
 * @param options - Additional options
 * @returns Ownership change record
 */
export function recordOwnershipChange(
  entityId: string,
  parentId: string,
  oldOwnershipPercentage: number,
  newOwnershipPercentage: number,
  changeType: 'acquisition' | 'disposal' | 'adjustment',
  description: string,
  options: {
    changeDate?: Date;
    metadata?: Record<string, unknown>;
  } = {}
): OwnershipChange {
  return {
    id: `change-${entityId}-${parentId}-${Date.now()}`,
    entityId,
    parentId,
    oldOwnershipPercentage,
    newOwnershipPercentage,
    changeDate: options.changeDate || new Date(),
    changeType,
    description,
    metadata: {
      createdBy: 'system',
      version: '1.0',
      ...options.metadata
    }
  };
}

/**
 * Calculate effective consolidation method
 * 
 * @param entity - Entity
 * @param relationships - Entity relationships
 * @returns Effective consolidation method
 */
export function calculateEffectiveConsolidationMethod(
  entity: ConsolidationEntity,
  relationships: readonly EntityRelationship[]
): ConsolidationMethod {
  const ownershipPercentage = calculateEntityOwnership(entity, relationships);

  if (ownershipPercentage >= 50) {
    return 'full_consolidation';
  } else if (ownershipPercentage >= 20) {
    return 'equity_method';
  } else {
    return 'cost_method';
  }
}

/**
 * Get consolidation entities by type
 * 
 * @param entities - All entities
 * @param entityType - Entity type to filter by
 * @returns Entities of specified type
 */
export function getEntitiesByType(
  entities: readonly ConsolidationEntity[],
  entityType: EntityType
): readonly ConsolidationEntity[] {
  return entities.filter(entity => entity.type === entityType);
}

/**
 * Get active entities
 * 
 * @param entities - All entities
 * @returns Active entities
 */
export function getActiveEntities(
  entities: readonly ConsolidationEntity[]
): readonly ConsolidationEntity[] {
  return entities.filter(entity => entity.isActive);
}

/**
 * Validate consolidation entity
 * 
 * @param entity - Entity to validate
 * @returns Validation result
 */
export function validateConsolidationEntity(
  entity: ConsolidationEntity
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (!entity.id || entity.id.trim() === '') {
    errors.push('Entity ID is required');
  }

  if (!entity.name || entity.name.trim() === '') {
    errors.push('Entity name is required');
  }

  if (!entity.code || entity.code.trim() === '') {
    errors.push('Entity code is required');
  }

  // Validate ownership percentage
  if (entity.ownershipPercentage < 0 || entity.ownershipPercentage > 100) {
    errors.push('Ownership percentage must be between 0 and 100');
  }

  // Validate dates
  if (entity.effectiveDate > new Date()) {
    warnings.push('Effective date is in the future');
  }

  if (entity.expiryDate && entity.expiryDate <= entity.effectiveDate) {
    errors.push('Expiry date must be after effective date');
  }

  // Validate consolidation method
  const validMethods: ConsolidationMethod[] = [
    'full_consolidation', 'equity_method', 
    'proportional_consolidation', 'cost_method'
  ];
  
  if (!validMethods.includes(entity.consolidationMethod)) {
    errors.push(`Invalid consolidation method: ${entity.consolidationMethod}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

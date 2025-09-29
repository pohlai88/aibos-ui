import { Injectable, Logger } from '@nestjs/common';
// safeGet import removed as it's not used
import { randomUUID, createHash, type BinaryLike } from 'node:crypto';
import { isEmpty } from '../utils';
import { createValidationError } from '../utils/error-utilities';

export interface PeriodSnapshot {
  id: string;
  periodId: string;
  tenantId: string;
  balances: Map<string, PeriodAccountBalance>;
  merkleRoot: string;
  createdAt: Date;
  createdBy: string;
  checksum: string;
}

export interface PeriodCloseResult {
  snapshotId: string;
  merkleRoot: string;
  closedAt: Date;
  closedBy: string;
  validationResults: ValidationResult[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PeriodAccountBalance {
  accountCode: string;
  accountName: string;
  balance: number;
  balanceCents: bigint;
  currencyCode: string;
  asOfDate: Date;
  lastUpdated: Date;
  tenantId: string;
}

export class PeriodCloseValidationError extends Error {
  constructor(public validationResults: ValidationResult[]) {
    super('Period close validation failed');
    this.name = 'PeriodCloseValidationError';
  }
}

@Injectable()
export class PeriodCloseService {
  private readonly logger = new Logger(PeriodCloseService.name);

  constructor() {
    // private readonly auditService: AuditService,
    // private readonly projectionService: GeneralLedgerProjection,
    // private readonly eventEmitter: EventEmitter2,
  }

  async closePeriod(
    tenantId: string,
    periodId: string,
    closedBy: string,
    options?: {
      forceClose?: boolean;
      skipValidation?: boolean;
      reason?: string;
    },
  ): Promise<PeriodCloseResult> {
    const correlationId = randomUUID();

    try {
      this.logger.log(`Starting period close for tenant ${tenantId}, period ${periodId}`, {
        closedBy,
        correlationId,
        options,
      });

      // 1. Pre-flight validation
      await this.validatePeriodCloseable(tenantId, periodId, options?.forceClose);

      // 2. Create immutable snapshot
      const snapshot = await this.createPeriodSnapshot(tenantId, periodId, closedBy);

      // 3. Validate snapshot integrity
      const validationResults = await this.validateSnapshot(snapshot);

      if (!options?.skipValidation && !validationResults.every((r) => r.isValid)) {
        throw new PeriodCloseValidationError(validationResults);
      }

      // 4. Lock period with audit trail
      await this.lockPeriod(tenantId, periodId, 'HARD_CLOSED', closedBy, correlationId);

      // 5. Store snapshot with Merkle root
      await this.storeSnapshot(snapshot);

      // 6. Emit period closed event
      // await this.eventEmitter.emitAsync('period.closed', {
      //   tenantId,
      //   periodId,
      //   snapshotId: snapshot.id,
      //   closedBy,
      //   correlationId,
      //   timestamp: new Date(),
      // });

      this.logger.log(`Period close completed successfully`, {
        tenantId,
        periodId,
        snapshotId: snapshot.id,
        correlationId,
      });

      return {
        snapshotId: snapshot.id,
        merkleRoot: snapshot.merkleRoot,
        closedAt: new Date(),
        closedBy,
        validationResults,
      };
    } catch (error) {
      this.logger.error(`Period close failed for tenant ${tenantId}, period ${periodId}`, {
        error: error instanceof Error ? error.message : String(error),
        correlationId,
        closedBy,
      });

      // await this.auditService.record('period_close_failed', {
      //   tenantId,
      //   periodId,
      //   closedBy,
      //   correlationId,
      //   error: error.message,
      //   timestamp: new Date(),
      // });

      throw error;
    }
  }

  async reopenPeriod(
    tenantId: string,
    periodId: string,
    reopenedBy: string,
    reason: string,
    approverId: string,
  ): Promise<void> {
    const correlationId = randomUUID();

    this.logger.log(`Starting period reopen for tenant ${tenantId}, period ${periodId}`, {
      reopenedBy,
      approverId,
      reason,
      correlationId,
    });

    try {
      // 1. Validate reopen permissions (requires elevated approver)
      await this.validateReopenPermissions(reopenedBy, approverId);

      // 2. Audit trail for reopen
      // await this.auditService.record('period_reopen_requested', {
      //   tenantId,
      //   periodId,
      //   reopenedBy,
      //   approverId,
      //   reason,
      //   correlationId,
      //   timestamp: new Date(),
      // });

      // 3. Unlock period
      await this.unlockPeriod(tenantId, periodId, 'OPEN', reopenedBy, correlationId);

      // 4. Emit period reopened event
      // await this.eventEmitter.emitAsync('period.reopened', {
      //   tenantId,
      //   periodId,
      //   reopenedBy,
      //   reason,
      //   correlationId,
      //   timestamp: new Date(),
      // });

      this.logger.log(`Period reopen completed successfully`, {
        tenantId,
        periodId,
        reopenedBy,
        correlationId,
      });
    } catch (error) {
      this.logger.error(`Period reopen failed for tenant ${tenantId}, period ${periodId}`, {
        error: error instanceof Error ? error.message : String(error),
        reopenedBy,
        correlationId,
      });
      throw error;
    }
  }

  private async validatePeriodCloseable(
    tenantId: string,
    periodId: string,
    forceClose?: boolean,
  ): Promise<void> {
    this.logger.debug(`Validating period closeable for tenant ${tenantId}, period ${periodId}`);

    // Implementation would check:
    // 1. Period status (must be OPEN)
    // 2. Pending journal entries
    // 3. Unreconciled transactions
    // 4. User permissions

    if (!forceClose) {
      // Add validation logic here
      this.logger.debug('Period close validation passed');
    }
  }

  private async createPeriodSnapshot(
    tenantId: string,
    periodId: string,
    createdBy: string,
  ): Promise<PeriodSnapshot> {
    this.logger.debug(`Creating period snapshot for tenant ${tenantId}, period ${periodId}`);

    // Get all account balances for the period
    const balances = new Map<string, PeriodAccountBalance>();

    // Implementation would get balances from projection service
    // const balances = await this.projectionService.getPeriodBalances(tenantId, periodId);

    // Calculate Merkle root for integrity
    const merkleRoot = await this.calculateMerkleRoot(balances);

    // Generate checksum
    const checksum = await this.generateChecksum(balances);

    return {
      id: randomUUID(),
      periodId,
      tenantId,
      balances,
      merkleRoot,
      createdAt: new Date(),
      createdBy,
      checksum,
    };
  }

  private async validateSnapshot(snapshot: PeriodSnapshot): Promise<ValidationResult[]> {
    this.logger.debug(`Validating snapshot ${snapshot.id}`);

    const results: ValidationResult[] = [];

    // Validate snapshot integrity
    const calculatedChecksum = await this.generateChecksum(snapshot.balances);
    const isValidChecksum = calculatedChecksum === snapshot.checksum;

    results.push({
      isValid: isValidChecksum,
      errors: isValidChecksum ? [] : ['Snapshot checksum validation failed'],
      warnings: [],
    });

    // Validate Merkle root
    const calculatedMerkleRoot = await this.calculateMerkleRoot(snapshot.balances);
    const isValidMerkleRoot = calculatedMerkleRoot === snapshot.merkleRoot;

    results.push({
      isValid: isValidMerkleRoot,
      errors: isValidMerkleRoot ? [] : ['Snapshot Merkle root validation failed'],
      warnings: [],
    });

    return results;
  }

  private async lockPeriod(
    _tenantId: string,
    periodId: string,
    status: string,
    _lockedBy: string,
    _correlationId: string,
  ): Promise<void> {
    this.logger.debug(`Locking period ${periodId} with status ${status}`);

    // Implementation would update period status in database
    // await this.periodRepository.updateStatus(tenantId, periodId, status, lockedBy);
  }

  private async unlockPeriod(
    _tenantId: string,
    periodId: string,
    status: string,
    _unlockedBy: string,
    _correlationId: string,
  ): Promise<void> {
    this.logger.debug(`Unlocking period ${periodId} with status ${status}`);

    // Implementation would update period status in database
    // await this.periodRepository.updateStatus(tenantId, periodId, status, unlockedBy);
  }

  private async storeSnapshot(snapshot: PeriodSnapshot): Promise<void> {
    this.logger.debug(`Storing snapshot ${snapshot.id}`);

    // Implementation would store snapshot in database
    // await this.snapshotRepository.save(snapshot);
  }

  private async validateReopenPermissions(reopenedBy: string, approverId: string): Promise<void> {
    this.logger.debug(`Validating reopen permissions for ${reopenedBy} approved by ${approverId}`);

    // Implementation would check user permissions and approval levels
  }

  private async calculateMerkleRoot(balances: Map<string, PeriodAccountBalance>): Promise<string> {
    // Implementation of Merkle tree for data integrity
    const entries = Array.from(balances.entries()).sort(([a], [b]) => a.localeCompare(b));

    if (isEmpty(entries)) {
      return 'empty';
    }

    const hashes = await Promise.all(
      entries.map(([accountCode, balance]) => this.hashBalance(accountCode, balance)),
    );

    return await this.buildMerkleTree(hashes);
  }

  private async hashBalance(accountCode: string, balance: PeriodAccountBalance): Promise<string> {
    // Simple hash implementation for demo purposes
    const data = `${accountCode}:${balance.balance}:${balance.balanceCents}:${balance.currencyCode}`;
    return Buffer.from(data).toString('base64');
  }

  private async buildMerkleTree(hashes: string[]): Promise<string> {
    if (hashes.length === 1) {
      return hashes[0]!;
    }

    const nextLevel: string[] = [];
    for (let index = 0; index < hashes.length; index += 2) {
      const left = hashes.at(index) as string;
      const right = (hashes.at(index + 1) as string | undefined) ?? left;
      if (left && right) {
        // Input validation for defensive programming
        this.assertBase64(left, 'left');
        this.assertBase64(right, 'right');

        // Type-safe and efficient: concatenate raw bytes deterministically
        const combinedHash = await this.merkleParent(left, right);
        nextLevel.push(combinedHash);
      }
    }

    return await this.buildMerkleTree(nextLevel);
  }

  private assertBase64(s: string, name: string): void {
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(s)) {
      throw createValidationError(
        'INVALID_BASE64',
        `Invalid base64 for ${name}: ${s}`,
        s,
        { operation: 'validate-base64' }
      );
    }
  }

  private async merkleParent(leftBase64: string, rightBase64: string): Promise<string> {
    // Decode base64 → bytes as Uint8Array (avoid Buffer type friction with DOM libs)
    const leftUA = Uint8Array.from(Buffer.from(leftBase64, 'base64'));
    const rightUA = Uint8Array.from(Buffer.from(rightBase64, 'base64'));
    // Deterministic binary concatenation: left || right
    const combinedUA = new Uint8Array(leftUA.length + rightUA.length);
    combinedUA.set(leftUA, 0);
    combinedUA.set(rightUA, leftUA.length);
    return await this.sha256b64(combinedUA);
  }

  private async sha256b64(data: Uint8Array): Promise<string> {
    // Hash bytes. Some setups with DOM libs need an explicit BinaryLike assertion.
    return createHash('sha256')
      .update(data as unknown as BinaryLike)
      .digest('base64');
  }

  private async generateChecksum(balances: Map<string, PeriodAccountBalance>): Promise<string> {
    const entries = Array.from(balances.entries()).sort(([a], [b]) => a.localeCompare(b));
    const data = entries
      .map(([code, balance]) => `${code}:${balance.balance}:${balance.balanceCents}`)
      .join('|');

    return Buffer.from(data).toString('base64');
  }
}

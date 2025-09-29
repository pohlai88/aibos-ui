import { toPairs } from '../utils';

export enum JournalEntryStatus {
  DRAFT = 'Draft',
  APPROVED = 'Approved',
  POSTED = 'Posted',
  ADJUSTED = 'Adjusted',
  VOIDED = 'Voided',
  REVERSED = 'Reversed',
}

/** Machine-readable error codes for UI/API mapping */
export enum JournalEntryStatusErrorCode {
  INVALID_TRANSITION = 'INVALID_TRANSITION',
  PERIOD_CLOSED = 'PERIOD_CLOSED',
  NOT_BALANCED = 'NOT_BALANCED',
  ALREADY_REVERSED = 'ALREADY_REVERSED',
  INVALID_REVERSAL_DATE = 'INVALID_REVERSAL_DATE',
  NOT_APPROVED = 'NOT_APPROVED',
  ALREADY_VOIDED = 'ALREADY_VOIDED',
  INVALID_ADJUSTMENT = 'INVALID_ADJUSTMENT',
}

export class JournalEntryStatusError extends Error {
  public readonly code: JournalEntryStatusErrorCode;
  constructor(code: JournalEntryStatusErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Optional domain context to enforce additional business rules.
 * All flags default to permissive if omitted (backward-compatible).
 */
export interface JournalEntryStatusContext {
  /** True when the posting period for postingDate is open */
  isPostingPeriodOpen?: boolean;
  /** True when the period for reversalDate (or today) is open */
  isReversalPeriodOpen?: boolean;
  /** Journal is balanced (sum debits == sum credits) */
  isBalanced?: boolean;
  /** Entry was posted in the past (guards reversal) */
  isCurrentlyPosted?: boolean;
  /** This entry (or its origin) has already been reversed */
  isAlreadyReversed?: boolean;
  /** Entry has been approved for posting */
  isApproved?: boolean;
  /** Entry has been voided */
  isVoided?: boolean;
  /** Entry has been adjusted */
  isAdjusted?: boolean;
  /** ISO dates for additional domain checks (optional) */
  postingDate?: string; // e.g., '2025-09-23'
  reversalDate?: string; // e.g., '2025-09-24'
  adjustmentDate?: string; // e.g., '2025-09-25'
}

export class JournalEntryStatusValidator {
  /** Transition table = single source of truth */
  private static readonly TRANSITIONS: Readonly<
    Record<JournalEntryStatus, readonly JournalEntryStatus[]>
  > = Object.freeze({
    [JournalEntryStatus.DRAFT]: Object.freeze([
      JournalEntryStatus.DRAFT,
      JournalEntryStatus.APPROVED,
      JournalEntryStatus.VOIDED,
    ]),
    [JournalEntryStatus.APPROVED]: Object.freeze([
      JournalEntryStatus.APPROVED,
      JournalEntryStatus.POSTED,
      JournalEntryStatus.DRAFT,
      JournalEntryStatus.VOIDED,
    ]),
    [JournalEntryStatus.POSTED]: Object.freeze([
      JournalEntryStatus.ADJUSTED,
      JournalEntryStatus.REVERSED,
      JournalEntryStatus.VOIDED,
    ]),
    [JournalEntryStatus.ADJUSTED]: Object.freeze([
      JournalEntryStatus.ADJUSTED,
      JournalEntryStatus.REVERSED,
      JournalEntryStatus.VOIDED,
    ]),
    [JournalEntryStatus.VOIDED]: Object.freeze([]), // terminal
    [JournalEntryStatus.REVERSED]: Object.freeze([]), // terminal
  });

  public static nextStatuses(from: JournalEntryStatus): readonly JournalEntryStatus[] {
    const transitions = new Map(
      toPairs(this.TRANSITIONS) as Array<
        [JournalEntryStatus, readonly JournalEntryStatus[]]
      >,
    );
    return transitions.get(from) ?? [];
  }

  /**
   * Validate pure FSM transition + domain guards.
   * Idempotent no-op (from === to) is allowed only if table contains it (e.g., Draft -> Draft).
   */
  public static validateTransition(
    fromStatus: JournalEntryStatus,
    toStatus: JournalEntryStatus,
    context?: JournalEntryStatusContext,
  ): void {
    const transitions = new Map(
      toPairs(this.TRANSITIONS) as Array<
        [JournalEntryStatus, readonly JournalEntryStatus[]]
      >,
    );
    const allowed = transitions.get(fromStatus) ?? [];
    if (!allowed.includes(toStatus)) {
      throw new JournalEntryStatusError(
        JournalEntryStatusErrorCode.INVALID_TRANSITION,
        `Invalid status transition from ${fromStatus} to ${toStatus}`,
      );
    }

    // No extra checks needed if it's a no-op that the table explicitly allows (e.g., Draft->Draft).
    if (fromStatus === toStatus) return;

    // Domain guards (only applied when relevant)
    if (toStatus === JournalEntryStatus.APPROVED) {
      // Approval requires: balanced (if provided)
      if (context?.isBalanced === false) {
        throw new JournalEntryStatusError(
          JournalEntryStatusErrorCode.NOT_BALANCED,
          'Cannot approve an unbalanced journal entry.',
        );
      }
    }

    if (toStatus === JournalEntryStatus.POSTED) {
      // Posting requires: approved, balanced, and open period (if provided)
      if (context?.isApproved === false) {
        throw new JournalEntryStatusError(
          JournalEntryStatusErrorCode.NOT_APPROVED,
          'Only approved journal entries can be posted.',
        );
      }
      if (context?.isBalanced === false) {
        throw new JournalEntryStatusError(
          JournalEntryStatusErrorCode.NOT_BALANCED,
          'Cannot post an unbalanced journal entry.',
        );
      }
      if (context?.isPostingPeriodOpen === false) {
        throw new JournalEntryStatusError(
          JournalEntryStatusErrorCode.PERIOD_CLOSED,
          'Cannot post into a closed accounting period.',
        );
      }
    }

    if (toStatus === JournalEntryStatus.ADJUSTED) {
      // Adjustment requires: currently posted, not already voided (if provided)
      if (context?.isCurrentlyPosted === false) {
        throw new JournalEntryStatusError(
          JournalEntryStatusErrorCode.INVALID_ADJUSTMENT,
          'Only posted journal entries can be adjusted.',
        );
      }
      if (context?.isVoided === true) {
        throw new JournalEntryStatusError(
          JournalEntryStatusErrorCode.ALREADY_VOIDED,
          'Cannot adjust a voided journal entry.',
        );
      }
    }

    if (toStatus === JournalEntryStatus.VOIDED) {
      // Voiding requires: not already voided (if provided)
      if (context?.isVoided === true) {
        throw new JournalEntryStatusError(
          JournalEntryStatusErrorCode.ALREADY_VOIDED,
          'This journal entry has already been voided.',
        );
      }
    }

    if (toStatus === JournalEntryStatus.REVERSED) {
      // Reversing requires: currently posted or adjusted, not already reversed, and open reversal period (if provided)
      if (context?.isCurrentlyPosted === false && context?.isAdjusted === false) {
        throw new JournalEntryStatusError(
          JournalEntryStatusErrorCode.INVALID_TRANSITION,
          'Only posted or adjusted journal entries can be reversed.',
        );
      }
      if (context?.isAlreadyReversed === true) {
        throw new JournalEntryStatusError(
          JournalEntryStatusErrorCode.ALREADY_REVERSED,
          'This journal entry has already been reversed.',
        );
      }
      if (context?.isReversalPeriodOpen === false) {
        throw new JournalEntryStatusError(
          JournalEntryStatusErrorCode.PERIOD_CLOSED,
          'Cannot reverse into a closed accounting period.',
        );
      }
      // Optional date sanity: reversalDate >= postingDate
      if (context?.reversalDate && context?.postingDate) {
        const rev = new Date(context.reversalDate).getTime();
        const post = new Date(context.postingDate).getTime();
        if (!Number.isFinite(rev) || !Number.isFinite(post) || rev < post) {
          throw new JournalEntryStatusError(
            JournalEntryStatusErrorCode.INVALID_REVERSAL_DATE,
            'Reversal date must be the same as or after the posting date.',
          );
        }
      }
    }
  }

  /** Derived guard; context-aware if provided */
  public static canApprove(
    status: JournalEntryStatus,
    context?: JournalEntryStatusContext,
  ): boolean {
    if (!this.nextStatuses(status).includes(JournalEntryStatus.APPROVED)) return false;
    if (!context) return true;
    if (context.isBalanced === false) return false;
    return true;
  }

  /** Derived guard; context-aware if provided */
  public static canPost(status: JournalEntryStatus, context?: JournalEntryStatusContext): boolean {
    if (!this.nextStatuses(status).includes(JournalEntryStatus.POSTED)) return false;
    if (!context) return true;
    if (context.isApproved === false) return false;
    if (context.isBalanced === false) return false;
    if (context.isPostingPeriodOpen === false) return false;
    return true;
  }

  /** Derived guard; context-aware if provided */
  public static canAdjust(
    status: JournalEntryStatus,
    context?: JournalEntryStatusContext,
  ): boolean {
    if (!this.nextStatuses(status).includes(JournalEntryStatus.ADJUSTED)) return false;
    if (!context) return true;
    if (context.isCurrentlyPosted === false) return false;
    if (context.isVoided === true) return false;
    return true;
  }

  /** Derived guard; context-aware if provided */
  public static canVoid(status: JournalEntryStatus, context?: JournalEntryStatusContext): boolean {
    if (!this.nextStatuses(status).includes(JournalEntryStatus.VOIDED)) return false;
    if (!context) return true;
    if (context.isVoided === true) return false;
    return true;
  }

  /** Derived guard; context-aware if provided */
  public static canReverse(
    status: JournalEntryStatus,
    context?: JournalEntryStatusContext,
  ): boolean {
    if (!this.nextStatuses(status).includes(JournalEntryStatus.REVERSED)) return false;
    if (!context) return true;
    if (context.isCurrentlyPosted === false && context.isAdjusted === false) return false;
    if (context.isAlreadyReversed === true) return false;
    if (context.isReversalPeriodOpen === false) return false;
    if (context.reversalDate && context.postingDate) {
      const rev = new Date(context.reversalDate).getTime();
      const post = new Date(context.postingDate).getTime();
      if (!Number.isFinite(rev) || !Number.isFinite(post) || rev < post) return false;
    }
    return true;
  }

  public static isFinal(status: JournalEntryStatus): boolean {
    return status === JournalEntryStatus.REVERSED || status === JournalEntryStatus.VOIDED;
  }

  public static isActive(status: JournalEntryStatus): boolean {
    return status === JournalEntryStatus.POSTED || status === JournalEntryStatus.ADJUSTED;
  }

  public static isEditable(status: JournalEntryStatus): boolean {
    return status === JournalEntryStatus.DRAFT || status === JournalEntryStatus.APPROVED;
  }
}

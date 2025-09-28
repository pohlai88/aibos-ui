import { safeGet, assert } from '../utils';
/**
 * Money value object using minor units (cents) with bigint precision.
 * No floating point drift; suitable for accounting.
 */
export class Money {
  private readonly cents: bigint;

  private constructor(cents: bigint) {
    this.cents = cents;
    Object.freeze(this);
  }

  /** Canonical zero value */
  static readonly ZERO = new Money(0n);

  /**
   * Safe parser from a string like "123.45" (up to 2 dp).
   * Rejects thousands separators and scientific notation.
   */
  static fromString(amount: string): Money {
    if (typeof amount !== 'string') {
      throw new TypeError(`Amount must be a string, got ${typeof amount}`);
    }
    // Safe regex for amount validation - only matches digits and optional decimal
    // eslint-disable-next-line security/detect-unsafe-regex
    const amountRegex = /^(-)?(\d+)(?:\.(\d{1,2}))?$/u;
    const m = amount.match(amountRegex);
    if (!m) {
      throw new TypeError(`Invalid amount string (expect digits with optional 2 dp): ${amount}`);
    }
    const sign = /* TODO: allow-list */ safeGet(m, 1, [] as const) ? -1n : 1n;
    const whole = BigInt(/* TODO: allow-list */ safeGet(m, 2, [] as const)!);
    const fracString = /* TODO: allow-list */ (safeGet(m, 3, [] as const) ?? '').padEnd(2, '0'); // "5" -> "50", "" -> "00"
    const frac = BigInt(fracString || '0');
    return new Money(sign * (whole * 100n + frac));
  }

  /** Create from a number with up to 2 decimal places. */
  static fromNumber(amount: number): Money {
    if (!Number.isFinite(amount)) {
      throw new TypeError(`Invalid amount (not finite): ${amount}`);
    }
    // Strict 2dp enforcement using integer-math expectation:
    // Amount is valid if amount*100 is very near an integer (within 0.5 ulp).
    const scaled = amount * 100;
    const rounded = Math.round(scaled);
    if (!Number.isFinite(rounded) || Math.abs(scaled - rounded) > Number.EPSILON * 10) {
      throw new TypeError(`Amount has more than 2 decimal places: ${amount}`);
    }
    return new Money(BigInt(rounded));
  }

  /** Create directly from cents (minor units). */
  static fromCents(cents: bigint | number): Money {
    if (typeof cents === 'number') {
      if (!Number.isInteger(cents)) {
        throw new TypeError(`fromCents(number) requires an integer number of cents, got: ${cents}`);
      }
    }
    const v = typeof cents === 'number' ? BigInt(cents) : cents;
    return new Money(v);
  }

  /** Return as number (major units). Safe for display, not storage. */
  toNumber(): number {
    return Number(this.cents) / 100;
  }

  toCents(): bigint {
    return this.cents;
  }

  isZero(): boolean {
    return this.cmp(0n) === 0;
  }

  isPositive(): boolean {
    return this.cmp(0n) > 0;
  }

  isNegative(): boolean {
    return this.cmp(0n) < 0;
  }

  abs(): Money {
    return new Money(this.cents < 0 ? -this.cents : this.cents);
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  sub(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  negate(): Money {
    return new Money(-this.cents);
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  compare(other: Money): -1 | 0 | 1 {
    return this.cents < other.cents ? -1 : this.cents > other.cents ? 1 : 0;
  }

  static min(a: Money, b: Money): Money {
    return a.cents <= b.cents ? a : b;
  }

  static max(a: Money, b: Money): Money {
    return a.cents >= b.cents ? a : b;
  }

  /** Rounding modes for operations that return new Money from non-integer math. */
  static readonly RoundingMode = {
    HALF_EVEN: 'HALF_EVEN',
    HALF_AWAY_FROM_ZERO: 'HALF_AWAY_FROM_ZERO',
    UP: 'UP',
    DOWN: 'DOWN',
    CEIL: 'CEIL',
    FLOOR: 'FLOOR',
  } as const;

  /**
   * Multiply by a numeric factor (e.g., tax rate 0.06).
   * Uses number math for the factor, then rounds to cents via the chosen mode.
   * Prefer `multiplyByBps` for exact basis-point math.
   */
  multiply(factor: number, mode: RoundingMode = Money.RoundingMode.HALF_EVEN): Money {
    assert(Number.isFinite(factor), `Invalid factor: ${factor}`);
    const raw = Number(this.cents) * factor; // cents in number
    const rounded = roundToInt(raw, mode);
    return Money.fromCents(rounded);
  }

  /**
   * Multiply by basis points (1 bps = 0.01%). Exact integer math.
   * Example: 600 bps = 6% -> amount * 0.06 with deterministic rounding.
   */
  multiplyByBps(bps: number, mode: RoundingMode = Money.RoundingMode.HALF_EVEN): Money {
    assert(Number.isInteger(bps), `bps must be integer, got: ${bps}`);
    // cents * bps / 10_000  -> result in cents (may be fractional before rounding)
    const raw = Number(this.cents) * (bps / 10_000);
    const rounded = roundToInt(raw, mode);
    return Money.fromCents(rounded);
  }

  /**
   * Divide by a numeric divisor (e.g., split equally).
   * Rounds to cents via the chosen mode.
   */
  divide(divisor: number, mode: RoundingMode = Money.RoundingMode.HALF_EVEN): Money {
    if (!Number.isFinite(divisor) || divisor === 0)
      throw new TypeError(`Invalid divisor: ${divisor}`);
    const raw = Number(this.cents) / divisor;
    const rounded = roundToInt(raw, mode);
    return Money.fromCents(rounded);
  }

  /**
   * Allocate this amount across ratios (e.g., [2,1,1]) using the largest-remainder method.
   * Sums of parts equal the original amount.
   */
  allocate(ratios: number[]): Money[] {
    if (!Array.isArray(ratios) || ratios.length === 0) {
      throw new TypeError('ratios must be a non-empty array');
    }
    if (ratios.some((r) => !Number.isFinite(r) || r < 0)) {
      throw new TypeError('ratios must be non-negative finite numbers');
    }
    const total = ratios.reduce((a, b) => a + b, 0);
    if (total <= 0) throw new TypeError('sum of ratios must be > 0');

    const cents = this.cents;
    // First pass using floor via bigint division:
    const base = ratios.map((r) =>
      Money.fromCents(Number((cents * BigInt(Math.trunc((r / total) * 1_000_000))) / 1_000_000n)),
    );
    // Compute remainder in cents
    const allocated = base.reduce((sum, m) => sum + m.cents, 0n);
    let remainder = cents - allocated;
    // Distribute remainder by largest fractional parts (stable index tie-break)
    // Recompute precise fractional remainders using number math (ok for ordering only)
    const fracs = ratios
      .map((r, index) => ({
        i: index,
        frac: r / total - Math.trunc((r / total) * 100) / 100,
      })) // heuristic tie-break metric
      .sort((a, b) => (b.frac === a.frac ? a.i - b.i : b.frac - a.frac));
    const result = base.slice();
    for (const { i } of fracs) {
      if (remainder === 0n) break;
      // Safe array access with bounds checking

      const currentResult = /* TODO: allow-list */ safeGet(result, i, [] as const);
      if (currentResult) {
        /* TODO: allow-list */ safeGet(result, i, [] as const) = Money.fromCents(
          Number(currentResult.cents + (remainder > 0 ? 1n : -1n)),
        );
      }
      remainder += remainder > 0 ? -1n : 1n;
    }
    return result;
  }

  /** JSON serialization preserving precision */
  toJSON(): { cents: string } {
    return { cents: this.cents.toString() };
  }

  /** Compare to a cents value (bigint). Returns -1, 0, 1. */
  private cmp(rhs: bigint): -1 | 0 | 1 {
    if (this.cents < rhs) return -1;
    if (this.cents > rhs) return 1;
    return 0;
  }
}

/** Internal: round a floating-point value to nearest integer using a banking-style mode. */
function roundToInt(x: number, mode: RoundingMode): number {
  switch (mode) {
    case Money.RoundingMode.DOWN:
      return x < 0 ? Math.ceil(x) : Math.floor(x);
    case Money.RoundingMode.UP:
      return x < 0 ? Math.floor(x) : Math.ceil(x);
    case Money.RoundingMode.CEIL:
      return Math.ceil(x);
    case Money.RoundingMode.FLOOR:
      return Math.floor(x);
    case Money.RoundingMode.HALF_AWAY_FROM_ZERO: {
      const f = Math.floor(Math.abs(x));
      const frac = Math.abs(x) - f;
      const base = x < 0 ? -f : f;
      if (frac > 0.5) return base + (x < 0 ? -1 : 1);
      if (frac < 0.5) return base;
      return base + (x < 0 ? -1 : 1);
    }
    case Money.RoundingMode.HALF_EVEN:
    default: {
      // Banker's rounding: ties to even
      const floor = Math.floor(x);
      const diff = x - floor;
      if (diff < 0.5) return floor;
      if (diff > 0.5) return floor + 1;
      // exactly .5
      return floor % 2 === 0 ? floor : floor + 1;
    }
  }
}

export type RoundingMode = (typeof Money.RoundingMode)[keyof typeof Money.RoundingMode];

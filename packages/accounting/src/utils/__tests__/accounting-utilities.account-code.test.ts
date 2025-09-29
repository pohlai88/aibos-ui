import { describe, it, expect } from "vitest";
import { ACCOUNT_CODE_PATTERNS, validateAccountCode } from "../accounting-utilities";

describe("ACCOUNT_CODE_PATTERNS.HIERARCHICAL_MULTI (safe, bounded)", () => {
  const re = ACCOUNT_CODE_PATTERNS.HIERARCHICAL_MULTI;

  it("accepts valid 3–9 segment codes", () => {
    expect(re.test("1000.10.001")).toBe(true);
    expect(re.test("A1.B2.C3")).toBe(true);
    expect(re.test("ABCD.1234.Z9")).toBe(true);
    expect(re.test("A.B.C.D.E.F.G.H.I")).toBe(true); // 9 segments (1 + 8)
  });

  it("rejects too few segments", () => {
    expect(re.test("1000.10")).toBe(false); // only 2 segments
    expect(re.test("ABCD")).toBe(false);    // 1 segment
  });

  it("rejects too many segments (>=10)", () => {
    expect(re.test("A.B.C.D.E.F.G.H.I.J")).toBe(false); // 10 segments
  });

  it("rejects segments longer than 4 chars", () => {
    expect(re.test("ABCDE.1234.0001")).toBe(false);
  });
});

describe("validateAccountCode", () => {
  it("returns valid for well-formed codes", () => {
    expect(validateAccountCode("  a1.b2.c3  ")).toEqual({ valid: true });
  });

  it("flags invalid characters", () => {
    expect(validateAccountCode("A1-B2-C3")).toEqual({ valid: false, reason: "invalid_characters" });
  });

  it("flags structure issues", () => {
    expect(validateAccountCode("A1.B2")).toEqual({ valid: false, reason: "invalid_structure" });
  });

  it("bounds total length", () => {
    const long = Array.from({ length: 70 }).map(() => "A").join("");
    expect(validateAccountCode(long)).toEqual({ valid: false, reason: "length_out_of_bounds" });
  });
});

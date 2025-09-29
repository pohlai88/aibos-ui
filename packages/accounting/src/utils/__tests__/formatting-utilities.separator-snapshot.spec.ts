import { describe, it, expect } from 'vitest';
import { formatNumberWithSeparator, formatNumber } from '../formatting-utilities';

describe('formatNumberWithSeparator (snapshot)', () => {
  it('en-MY default comma separator', () => {
    expect(formatNumberWithSeparator(1234567.89, ',', 2, 'en-MY'))
      .toMatchInlineSnapshot('"1,234,567.89"');
  });

  it('en-MY custom space separator', () => {
    expect(formatNumberWithSeparator(1234567.89, ' ', 2, 'en-MY'))
      .toMatchInlineSnapshot('"1 234 567.89"');
  });

  it('en-MY group dot separator (ambiguous with decimal dot)', () => {
    // This test guards our intentional behavior: groups replaced with '.'
    // while decimal remains '.', resulting in repeated dots.
    expect(formatNumberWithSeparator(1234567.89, '.', 2, 'en-MY'))
      .toMatchInlineSnapshot('"1.234.567.89"');
  });

  it('de-DE locale with custom space separator (decimal comma)', () => {
    // Thousands groups replaced with spaces; decimal remains ',' for de-DE.
    expect(formatNumberWithSeparator(1234567.89, ' ', 2, 'de-DE'))
      .toMatchInlineSnapshot('"1 234 567,89"');
  });

  it('negative numbers respected', () => {
    expect(formatNumberWithSeparator(-1234567.5, ' ', 2, 'en-MY'))
      .toMatchInlineSnapshot('"-1 234 567.50"');
  });

  it('zero decimals rounds correctly', () => {
    // 1,234,567.5 -> 1,234,568 (with custom space grouping)
    expect(formatNumberWithSeparator(1234567.5, ' ', 0, 'en-MY'))
      .toMatchInlineSnapshot('"1 234 568"');
  });

  it('large numbers scale', () => {
    expect(formatNumberWithSeparator(9876543210.12, ',', 2, 'en-MY'))
      .toMatchInlineSnapshot('"9,876,543,210.12"');
  });

  it('small numbers with 3dp', () => {
    expect(formatNumberWithSeparator(12.3456, ' ', 3, 'en-MY'))
      .toMatchInlineSnapshot('"12.346"');
  });

  it('demonstrates Phase 2 utility usage vs manual Intl.NumberFormat', () => {
    const proto = Intl.NumberFormat.prototype as any;
    const original = proto.formatToParts;
    // Simulate legacy environment
    try {
      delete proto.formatToParts;
      const s = formatNumberWithSeparator(1234567.89, ',', 2, 'en-MY');
      // Use Phase 2 utility instead of manual Intl.NumberFormat
      const expected = formatNumber(1234567.89, 2, 'en-MY');
      // Should equal Phase 2 utility result, not manual Intl default
      expect(s).toBe(expected);
    } finally {
      // Always restore
      proto.formatToParts = original;
    }
  });

  it('demonstrates comprehensive Phase 2 number formatting utilities', () => {
    const testValue = 1234567.89;
    
    // Test different Phase 2 utilities
    const formattedNumber = formatNumber(testValue, 2, 'en-MY');
    const formattedWithSeparator = formatNumberWithSeparator(testValue, ' ', 2, 'en-MY');
    
    // Verify Phase 2 utilities work correctly
    expect(formattedNumber).toMatch(/1,234,567\.89/);
    expect(formattedWithSeparator).toMatch(/1 234 567\.89/);
    
    // Test different locales
    const formattedDE = formatNumber(testValue, 2, 'de-DE');
    expect(formattedDE).toMatch(/1\.234\.567,89/);
    
    // Test different decimal places
    const formatted3DP = formatNumber(testValue, 3, 'en-MY');
    expect(formatted3DP).toMatch(/1,234,567\.890/);
  });
});

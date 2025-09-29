import { describe, it, expect } from 'vitest';
import {
  recognizeGovernmentGrant,
  calculateAmortization,
  monitorGrantConditions,
  recognizeGovernmentGrantSafe,
  Schemas,
  setComplianceGuards,
  recognizeJournalEntry
} from '../government-grants-utilities';

const MYR = 'MYR' as any;

describe('Government Grants Utilities', () => {
  it('creates a 12-month amortization schedule with balanced journals', () => {
    const grant = recognizeGovernmentGrant(
      {
        grantType: 'revenue_grant',
        grantName: 'Productivity Boost',
        grantingAuthority: 'MIDA',
        grantAmount: 120_000,
        currency: MYR,
        grantDate: new Date('2025-01-15')
      },
      'deferred_method',
      []
    );
    expect(grant.amortizationSchedule.length).toBe(12);
    const first = grant.amortizationSchedule[0];
    expect(first.journalEntry.totalDebits).toBeCloseTo(first.journalEntry.totalCredits, 6);
  });

  it('respects custom amortization period and keeps journals balanced', () => {
    const base = recognizeGovernmentGrant(
      {
        grantType: 'revenue_grant',
        grantName: 'Ops Upgrade',
        grantingAuthority: 'MOF',
        grantAmount: 60_000,
        currency: MYR,
        grantDate: new Date('2025-02-01')
      },
      'income_method',
      []
    );
    const updated = calculateAmortization(base, 6);
    expect(updated.amortizationSchedule.length).toBe(6);
    for (const row of updated.amortizationSchedule) {
      expect(row.journalEntry.totalDebits).toBeCloseTo(row.journalEntry.totalCredits, 6);
      expect(row.grantId).toBe(base.grantId);
    }
  });

  it('monitoring returns a clean percentage (not currency formatting)', () => {
    const grant = recognizeGovernmentGrant(
      {
        grantType: 'training_grant',
        grantName: 'Workforce Skills',
        grantingAuthority: 'HRDF',
        grantAmount: 12_000,
        currency: MYR,
        grantDate: new Date('2025-03-01')
      },
      'deferred_method',
      [
        {
          conditionId: 'c1',
          grantId: 'g1',
          conditionType: 'reporting_condition',
          description: 'Submit Q1 report',
          complianceRequired: true,
          complianceDeadline: new Date('2025-04-15'),
          complianceStatus: 'compliant',
          monitoringFrequency: 'quarterly'
        }
      ]
    );
    const rep = monitorGrantConditions(grant, new Date('2025-04-20'));
    expect(typeof rep.compliancePercentage).toBe('number');
    expect(rep.compliancePercentage).toBeGreaterThanOrEqual(0);
    expect(rep.compliancePercentage).toBeLessThanOrEqual(100);
  });

  it('safe wrapper rejects invalid inputs', () => {
    expect(() =>
      recognizeGovernmentGrantSafe({
        // @ts-expect-error testing zod: negative amount invalid
        grantDetails: { grantType: 'revenue_grant', grantName: 'Bad', grantingAuthority: 'X', grantAmount: -5, currency: MYR, grantDate: '2025-01-01' },
        recognitionMethod: 'deferred_method',
        grantConditions: []
      })
    ).toThrow();
    // Schemas exported for external validation as well
    expect(Schemas.RecognizeGrantInputSchema.safeParse({
      grantDetails: { grantType: 'revenue_grant', grantName: 'OK', grantingAuthority: 'X', grantAmount: 1, currency: MYR, grantDate: '2025-01-01' },
      recognitionMethod: 'income_method',
      grantConditions: []
    }).success).toBe(true);
  });

  it('initial recognition journal aligns with method and balances', () => {
    const grant = recognizeGovernmentGrant(
      { grantType: 'revenue_grant', grantName: 'Init', grantingAuthority: 'MOF', grantAmount: 10_000, currency: MYR, grantDate: new Date('2025-01-10') },
      'deferred_method',
      []
    );
    const je = recognizeJournalEntry(grant);
    expect(je.totalDebits).toBe(je.totalCredits);
    const credit = je.lines.find(l => l.credit > 0)!;
    expect(credit.accountCode).toBe('DEFERRED-GOVERNMENT-GRANT');
  });

  it('period guard blocks postings in closed periods', () => {
    setComplianceGuards({
      periodGuard: (date) => ({ allowed: date >= new Date('2025-02-01'), reason: 'period closed' })
    });
    const grant = recognizeGovernmentGrant(
      { grantType: 'revenue_grant', grantName: 'Guarded', grantingAuthority: 'MOF', grantAmount: 12_000, currency: MYR, grantDate: new Date('2025-01-15') },
      'deferred_method',
      []
    );
    expect(() => recognizeJournalEntry(grant)).toThrow();
    // reset guard to avoid affecting other tests
    setComplianceGuards({ periodGuard: undefined });
  });
});

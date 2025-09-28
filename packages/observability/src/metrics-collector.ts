import type { BusinessMetrics, PerformanceMetrics } from './types';

import { createDict, safeSet } from '@aibos/utils';

export class MetricsCollector {
  private static metrics: Map<string, number> = new Map();

  static incrementCounter(metric: string, value = 1, labels?: Record<string, string>): void {
    const key = labels ? `${metric}:${JSON.stringify(labels)}` : metric;
    const current = this.metrics.get(key) ?? 0;
    this.metrics.set(key, current + value);
  }

  static setGauge(metric: string, value: number, labels?: Record<string, string>): void {
    const key = labels ? `${metric}:${JSON.stringify(labels)}` : metric;
    this.metrics.set(key, value);
  }

  static recordHistogram(metric: string, value: number, labels?: Record<string, string>): void {
    const key = labels ? `${metric}:${JSON.stringify(labels)}` : metric;
    // For histograms, we track the sum and count separately
    const sumKey = `${key}:sum`;
    const countKey = `${key}:count`;
    const currentSum = this.metrics.get(sumKey) ?? 0;
    const currentCount = this.metrics.get(countKey) ?? 0;
    this.metrics.set(sumKey, currentSum + value);
    this.metrics.set(countKey, currentCount + 1);
  }

  static trackBusinessMetrics(tenantId: string, metrics: BusinessMetrics): void {
    this.setGauge('period_close_time_days', metrics.periodCloseTime, { tenantId });
    this.setGauge('audit_prep_hours', metrics.auditPrepTime, { tenantId });
    this.setGauge('unmapped_accounts_count', metrics.unmappedAccounts, { tenantId });
    this.setGauge('fx_variance_percent', metrics.fxVariance, { tenantId });
    this.setGauge('journal_approval_sla_met_percent', metrics.approvalSLA, { tenantId });
    this.setGauge('bulk_processing_seconds_per_1000', metrics.bulkProcessingTime, { tenantId });
  }

  static trackPerformance(metrics: PerformanceMetrics): void {
    this.recordHistogram(
      `${metrics.operation}_duration_ms`,
      metrics.durationMs,
      metrics.metadata as Record<string, string>,
    );
  }

  static getMetrics(): Record<string, number> {
    const metricsObject = createDict<number>();
    for (const [key, value] of this.metrics) {
      safeSet(metricsObject, key, value);
    }
    return metricsObject;
  }

  static reset(): void {
    this.metrics.clear();
  }
}

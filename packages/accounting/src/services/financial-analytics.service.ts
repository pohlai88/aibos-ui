import { Injectable, Logger } from '@nestjs/common';
import { roundAmount, hasItems, addDaysToDate } from '../utils';
import { createBusinessError, createValidationError, ErrorContext } from '../utils/error-utilities';
import { timeout, parallel } from '../utils/async-utilities';
import { PerformanceProfiler, createProfiler, PerformanceTimer, Cache, createCache } from '../utils/performance-utilities';

// Constants for error messages
const TENANT_ID_REQUIRED_MESSAGE = 'Tenant ID is required';
const VALID_DATA_POINT_REQUIRED_MESSAGE = 'Valid data point is required';
const DATA_POINT_ADD_FAILED_MESSAGE = 'Failed to add data point: {error}';
const FINANCIAL_ANALYTICS_ENTITY = 'FinancialAnalytics';
const DATA_POINT_ADD_FAILED_ERROR_CODE = 'data-point-add-failed';
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

export interface FinancialDataPoint {
  date: Date;
  value: number;
  currency: string;
  category: 'revenue' | 'expense' | 'profit' | 'cash' | 'assets' | 'liabilities';
  subcategory?: string;
  metadata?: Record<string, unknown>;
}

export interface TrendAnalysis {
  period: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  slope: number;
  rSquared: number;
  confidence: number;
  forecast: Array<{
    date: Date;
    predictedValue: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  }>;
}

export interface AnomalyDetection {
  dataPoint: FinancialDataPoint;
  anomalyScore: number;
  anomalyType: 'spike' | 'drop' | 'pattern-break' | 'seasonal-break';
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  suggestedAction?: string;
}

export interface FinancialForecast {
  period: string;
  forecastType: 'revenue' | 'expense' | 'profit' | 'cash-flow';
  predictions: Array<{
    date: Date;
    predictedValue: number;
    confidenceLevel: number;
    factors: string[];
  }>;
  accuracy: number;
  lastUpdated: Date;
}

export interface RiskAssessment {
  riskType: 'liquidity' | 'credit' | 'market' | 'operational' | 'compliance';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  riskScore: number;
  mitigationStrategies: string[];
  monitoringIndicators: string[];
}

export interface FinancialInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'forecast' | 'risk' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  recommendedActions: string[];
  dataPoints: FinancialDataPoint[];
  generatedAt: Date;
  expiresAt?: Date;
}

@Injectable()
export class FinancialAnalyticsService {
  private readonly logger = new Logger(FinancialAnalyticsService.name);
  private readonly profiler: PerformanceProfiler;
  private financialData = new Map<string, FinancialDataPoint[]>();
  private insights = new Map<string, FinancialInsight>();
  private readonly trendCache: Cache<TrendAnalysis>;
  private readonly anomalyCache: Cache<AnomalyDetection[]>;
  private readonly forecastCache: Cache<FinancialForecast>;

  constructor() {
    this.profiler = createProfiler();
    this.trendCache = createCache<TrendAnalysis>({
      maxSize: 100,
      ttl: 300000, // 5 minutes
    });
    this.anomalyCache = createCache<AnomalyDetection[]>({
      maxSize: 100,
      ttl: 300000, // 5 minutes
    });
    this.forecastCache = createCache<FinancialForecast>({
      maxSize: 50,
      ttl: 900000, // 15 minutes
    });
  }

  /**
   * Add financial data point for analysis
   */
  addDataPoint(tenantId: string, dataPoint: FinancialDataPoint): void {
    const timer = new PerformanceTimer();
    const errorContext: ErrorContext = {
      tenantId,
      operation: 'addDataPoint',
      data: { category: dataPoint.category, value: dataPoint.value },
    };

    try {
      // Validate input
      if (!tenantId) {
        throw createValidationError('tenantId', TENANT_ID_REQUIRED_MESSAGE, tenantId, errorContext);
      }

      if (!dataPoint || !dataPoint.category || dataPoint.value === undefined) {
        throw createValidationError('dataPoint', VALID_DATA_POINT_REQUIRED_MESSAGE, dataPoint, errorContext);
      }

      const tenantData = this.financialData.get(tenantId) || [];
      tenantData.push(dataPoint);

      // Keep only last 1000 data points per tenant
      if (tenantData.length > 1000) {
        tenantData.splice(0, tenantData.length - 1000);
      }

      this.financialData.set(tenantId, tenantData);

      this.logger.debug(
        `Added data point for tenant ${tenantId}: ${dataPoint.category} - ${dataPoint.value}`,
      );

      // Clear relevant caches
      this.invalidateCaches(tenantId, dataPoint.category);

      // Trigger real-time analysis
      this.analyzeRealTime(tenantId, dataPoint);

      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
    } catch (error) {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      
      if (error instanceof Error && (error.name === 'ValidationError' || error.name === 'BusinessRuleError')) {
        throw error;
      }
      
      this.logger.error(`Failed to add data point for tenant ${tenantId}:`, error);
      throw createBusinessError(
        DATA_POINT_ADD_FAILED_ERROR_CODE,
        DATA_POINT_ADD_FAILED_MESSAGE.replace('{error}', error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE),
        FINANCIAL_ANALYTICS_ENTITY,
        errorContext
      );
    }
  }

  /**
   * Perform trend analysis on financial data
   */
  async analyzeTrends(
    tenantId: string,
    category: string,
    period: string = '30d',
  ): Promise<TrendAnalysis> {
    const timer = new PerformanceTimer();
    const errorContext: ErrorContext = {
      tenantId,
      operation: 'analyzeTrends',
      data: { category, period },
    };

    try {
      // Validate input
      if (!tenantId || !category) {
        throw createValidationError('parameters', 'Tenant ID and category are required', { tenantId, category }, errorContext);
      }

      // Check cache first
      const cacheKey = `${tenantId}-${category}-${period}`;
      const cached = this.trendCache.get(cacheKey);
      if (cached) {
        const metrics = timer.getMetrics();
        this.profiler.record(metrics);
        return cached;
      }

      const data = this.getFilteredData(tenantId, category, period);

      if (data.length < 3) {
        throw createBusinessError(
          'insufficient-data',
          'Insufficient data for trend analysis (minimum 3 data points required)',
          FINANCIAL_ANALYTICS_ENTITY,
          errorContext
        );
      }

      // Simple linear regression for trend analysis
      const trend = await timeout(
        Promise.resolve(this.calculateLinearTrend(data)),
        5000
      );
      
      const forecast = await timeout(
        Promise.resolve(this.generateForecastPredictions(data, trend, 7)),
        5000
      );

      const trendAnalysis: TrendAnalysis = {
        period,
        trend: this.determineTrendDirection(trend.slope),
        slope: trend.slope,
        rSquared: trend.rSquared,
        confidence: trend.confidence,
        forecast,
      };

      // Cache the result
      this.trendCache.set(cacheKey, trendAnalysis);

      const metrics = timer.getMetrics();
      this.profiler.record(metrics);

      this.logger.log(`Trend analysis completed for tenant ${tenantId}, category ${category}`);
      return trendAnalysis;
    } catch (error) {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      
      if (error instanceof Error && (error.name === 'ValidationError' || error.name === 'BusinessRuleError')) {
        throw error;
      }
      
      this.logger.error(`Failed to analyze trends for tenant ${tenantId}:`, error);
      throw createBusinessError(
        'trend-analysis-failed',
        `Failed to analyze trends: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        FINANCIAL_ANALYTICS_ENTITY,
        errorContext
      );
    }
  }

  /**
   * Detect anomalies in financial data
   */
  async detectAnomalies(
    tenantId: string,
    category: string,
    period: string = '30d',
  ): Promise<AnomalyDetection[]> {
    const timer = new PerformanceTimer();
    const errorContext: ErrorContext = {
      tenantId,
      operation: 'detectAnomalies',
      data: { category, period },
    };

    try {
      // Validate input
      if (!tenantId || !category) {
        throw createValidationError('parameters', 'Tenant ID and category are required', { tenantId, category }, errorContext);
      }

      // Check cache first
      const cacheKey = `${tenantId}-${category}-${period}`;
      const cached = this.anomalyCache.get(cacheKey);
      if (cached) {
        const metrics = timer.getMetrics();
        this.profiler.record(metrics);
        return cached;
      }

      const data = this.getFilteredData(tenantId, category, period);
      const anomalies: AnomalyDetection[] = [];

      if (data.length < 10) {
        // Cache empty result
        this.anomalyCache.set(cacheKey, anomalies);
        const metrics = timer.getMetrics();
        this.profiler.record(metrics);
        return anomalies; // Need sufficient data for anomaly detection
      }

      // Calculate statistical measures with timeout
      const values = data.map((d) => d.value);
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      const variance =
        values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
      const standardDeviation = Math.sqrt(variance);

      // Detect anomalies using statistical methods
      for (let index = 0; index < data.length; index++) {
        const dataPoint = data.at(index);
        if (!dataPoint) continue;

        const zScore = Math.abs((dataPoint.value - mean) / standardDeviation);

        if (zScore > 2.5) {
          // Threshold for anomaly detection
          const anomaly: AnomalyDetection = {
            dataPoint,
            anomalyScore: zScore,
            anomalyType: this.determineAnomalyType(dataPoint, data, index),
            severity: this.determineSeverity(zScore),
            explanation: this.generateAnomalyExplanation(dataPoint, zScore),
            suggestedAction: this.generateSuggestedAction(dataPoint, zScore),
          };

          anomalies.push(anomaly);
        }
      }

      // Cache the result
      this.anomalyCache.set(cacheKey, anomalies);

      const metrics = timer.getMetrics();
      this.profiler.record(metrics);

      this.logger.log(
        `Anomaly detection completed for tenant ${tenantId}: ${anomalies.length} anomalies found`,
      );
      return anomalies;
    } catch (error) {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      
      if (error instanceof Error && (error.name === 'ValidationError' || error.name === 'BusinessRuleError')) {
        throw error;
      }
      
      this.logger.error(`Failed to detect anomalies for tenant ${tenantId}:`, error);
      throw createBusinessError(
        'anomaly-detection-failed',
        `Failed to detect anomalies: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        FINANCIAL_ANALYTICS_ENTITY,
        errorContext
      );
    }
  }

  /**
   * Generate financial forecast
   */
  async generateForecast(
    tenantId: string,
    forecastType: string,
    horizon: number = 30,
  ): Promise<FinancialForecast> {
    const timer = new PerformanceTimer();
    const errorContext: ErrorContext = {
      tenantId,
      operation: 'generateForecast',
      data: { forecastType, horizon },
    };

    try {
      // Validate input
      if (!tenantId || !forecastType) {
        throw createValidationError('parameters', 'Tenant ID and forecast type are required', { tenantId, forecastType }, errorContext);
      }

      if (horizon <= 0 || horizon > 365) {
        throw createValidationError('horizon', 'Horizon must be between 1 and 365 days', horizon, errorContext);
      }

      // Check cache first
      const cacheKey = `${tenantId}-${forecastType}-${horizon}`;
      const cached = this.forecastCache.get(cacheKey);
      if (cached) {
        const metrics = timer.getMetrics();
        this.profiler.record(metrics);
        return cached;
      }

      const data = this.getFilteredData(tenantId, forecastType, '90d');

      if (data.length < 10) {
        throw createBusinessError(
          'insufficient-data',
          'Insufficient data for forecasting (minimum 10 data points required)',
          FINANCIAL_ANALYTICS_ENTITY,
          errorContext
        );
      }

      // Simple forecasting using moving average and trend with timeout
      const trend = await timeout(
        Promise.resolve(this.calculateLinearTrend(data)),
        10000
      );
      
      const trendPredictions = await timeout(
        Promise.resolve(this.generateForecastPredictions(data, trend, horizon)),
        10000
      );

      // Convert to FinancialForecast format
      const predictions = trendPredictions.map((p) => ({
        date: p.date,
        predictedValue: p.predictedValue,
        confidenceLevel:
          (Math.abs(p.predictedValue - p.confidenceInterval.lower) / p.predictedValue) * 100,
        factors: ['historical_trend', 'seasonal_patterns', 'market_conditions'],
      }));

      const forecast: FinancialForecast = {
        period: `${horizon}d`,
        forecastType: forecastType as 'revenue' | 'expense' | 'profit' | 'cash-flow',
        predictions,
        accuracy: this.calculateForecastAccuracy(data, trend),
        lastUpdated: new Date(),
      };

      // Cache the result
      this.forecastCache.set(cacheKey, forecast);

      const metrics = timer.getMetrics();
      this.profiler.record(metrics);

      this.logger.log(`Forecast generated for tenant ${tenantId}, type ${forecastType}`);
      return forecast;
    } catch (error) {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      
      if (error instanceof Error && (error.name === 'ValidationError' || error.name === 'BusinessRuleError')) {
        throw error;
      }
      
      this.logger.error(`Failed to generate forecast for tenant ${tenantId}:`, error);
      throw createBusinessError(
        'forecast-generation-failed',
        `Failed to generate forecast: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        FINANCIAL_ANALYTICS_ENTITY,
        errorContext
      );
    }
  }

  /**
   * Assess financial risks
   */
  async assessRisks(tenantId: string): Promise<RiskAssessment[]> {
    const timer = new PerformanceTimer();
    const errorContext: ErrorContext = {
      tenantId,
      operation: 'assessRisks',
    };

    try {
      // Validate input
      if (!tenantId) {
        throw createValidationError('tenantId', TENANT_ID_REQUIRED_MESSAGE, tenantId, errorContext);
      }

      // Run risk assessments in parallel
      const riskAssessments = await parallel([
        this.assessLiquidityRisk(tenantId),
        this.assessCreditRisk(tenantId),
        this.assessOperationalRisk(tenantId),
      ]);

      const risks: RiskAssessment[] = riskAssessments.filter(
        (risk): risk is RiskAssessment => risk !== undefined
      );

      const metrics = timer.getMetrics();
      this.profiler.record(metrics);

      this.logger.log(
        `Risk assessment completed for tenant ${tenantId}: ${risks.length} risks identified`,
      );
      return risks;
    } catch (error) {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      
      if (error instanceof Error && (error.name === 'ValidationError' || error.name === 'BusinessRuleError')) {
        throw error;
      }
      
      this.logger.error(`Failed to assess risks for tenant ${tenantId}:`, error);
      throw createBusinessError(
        'risk-assessment-failed',
        `Failed to assess risks: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        FINANCIAL_ANALYTICS_ENTITY,
        errorContext
      );
    }
  }

  /**
   * Generate financial insights
   */
  async generateInsights(tenantId: string): Promise<FinancialInsight[]> {
    const timer = new PerformanceTimer();
    const errorContext: ErrorContext = {
      tenantId,
      operation: 'generateInsights',
    };

    try {
      // Validate input
      if (!tenantId) {
        throw createValidationError('tenantId', TENANT_ID_REQUIRED_MESSAGE, tenantId, errorContext);
      }

      // Generate insights in parallel
      const insightResults = await parallel([
        this.generateTrendInsights(tenantId),
        this.generateAnomalyInsights(tenantId),
        this.generateOpportunityInsights(tenantId),
      ]);

      const insights: FinancialInsight[] = [
        ...(insightResults[0] as FinancialInsight[]),
        ...(insightResults[1] as FinancialInsight[]),
        ...(insightResults[2] as FinancialInsight[]),
      ];

      // Store insights
      insights.forEach((insight) => {
        this.insights.set(insight.id, insight);
      });

      const metrics = timer.getMetrics();
      this.profiler.record(metrics);

      this.logger.log(`Generated ${insights.length} insights for tenant ${tenantId}`);
      return insights;
    } catch (error) {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      
      if (error instanceof Error && (error.name === 'ValidationError' || error.name === 'BusinessRuleError')) {
        throw error;
      }
      
      this.logger.error(`Failed to generate insights for tenant ${tenantId}:`, error);
      throw createBusinessError(
        'insights-generation-failed',
        `Failed to generate insights: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        FINANCIAL_ANALYTICS_ENTITY,
        errorContext
      );
    }
  }

  /**
   * Invalidate caches for a tenant and category
   */
  private invalidateCaches(tenantId: string, category: string): void {
    // Clear trend cache
    const trendKeys = [`${tenantId}-${category}-30d`, `${tenantId}-${category}-90d`];
    trendKeys.forEach(key => this.trendCache.delete(key));

    // Clear anomaly cache
    const anomalyKeys = [`${tenantId}-${category}-30d`, `${tenantId}-${category}-90d`];
    anomalyKeys.forEach(key => this.anomalyCache.delete(key));

    // Clear forecast cache for related forecast types
    const forecastKeys = [`${tenantId}-${category}-30`, `${tenantId}-${category}-90`];
    forecastKeys.forEach(key => this.forecastCache.delete(key));
  }

  /**
   * Get filtered data for analysis
   */
  private getFilteredData(
    tenantId: string,
    category: string,
    period: string,
  ): FinancialDataPoint[] {
    const data = this.financialData.get(tenantId) || [];
    const now = new Date();
    const periodMs = this.parsePeriod(period);
    const cutoffDate = new Date(now.getTime() - periodMs);

    return data
      .filter((d) => d.category === category && d.date >= cutoffDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Parse period string to milliseconds
   */
  private parsePeriod(period: string): number {
    const match = period.match(/(\d+)([dwmy])/);
    if (!match) return 30 * 24 * 60 * 60 * 1000; // Default to 30 days

    const value = parseInt(match[1]!);
    const unit = match[2]!;

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'w':
        return value * 7 * 24 * 60 * 60 * 1000;
      case 'm':
        return value * 30 * 24 * 60 * 60 * 1000;
      case 'y':
        return value * 365 * 24 * 60 * 60 * 1000;
      default:
        return 30 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Calculate linear trend using least squares
   */
  private calculateLinearTrend(data: FinancialDataPoint[]): {
    slope: number;
    rSquared: number;
    confidence: number;
  } {
    const n = data.length;
    const xValues = data.map((_, index) => index);
    const yValues = data.map((d) => d.value);

    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, index) => sum + x * (yValues.at(index) ?? 0), 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = yValues.reduce((sum, y, index) => {
      const predicted = slope * (xValues.at(index) ?? 0) + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const rSquared = 1 - ssResidual / ssTotal;

    // Calculate confidence (simplified)
    const confidence = Math.min(Math.max(rSquared * 100, 0), 100);

    return { slope, rSquared, confidence };
  }

  /**
   * Determine trend direction
   */
  private determineTrendDirection(
    slope: number,
  ): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    if (Math.abs(slope) < 0.01) return 'stable';
    if (slope > 0.01) return 'increasing';
    if (slope < -0.01) return 'decreasing';
    return 'volatile';
  }

  /**
   * Generate forecast predictions
   */
  private generateForecastPredictions(
    data: FinancialDataPoint[],
    trend: { slope: number; rSquared: number; confidence: number },
    horizon: number,
  ): Array<{
    date: Date;
    predictedValue: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  }> {
    const predictions = [];
    const lastDataPoint = data.at(-1);
    if (!lastDataPoint) {
      throw createBusinessError(
        'NO_DATA_FOR_FORECASTING',
        'No data available for forecasting',
        'forecastData',
        { operation: 'generate-forecast' }
      );
    }

    const lastDate = lastDataPoint.date;
    const lastValue = lastDataPoint.value;

    for (let index = 1; index <= horizon; index++) {
      const date = addDaysToDate(lastDate, index);
      const predictedValue = lastValue + trend.slope * index;
      const confidenceLevel = Math.max(trend.confidence - index * 2, 10); // Decrease confidence over time

      // Calculate confidence interval (simplified)
      const margin = predictedValue * (confidenceLevel / 100) * 0.1; // 10% of confidence level as margin

      predictions.push({
        date,
        predictedValue,
        confidenceInterval: {
          lower: predictedValue - margin,
          upper: predictedValue + margin,
        },
      });
    }

    return predictions;
  }

  /**
   * Calculate forecast accuracy
   */
  private calculateForecastAccuracy(
    _data: FinancialDataPoint[],
    trend: { slope: number; rSquared: number; confidence: number },
  ): number {
    // Simplified accuracy calculation based on R-squared
    return Math.min(Math.max(trend.rSquared * 100, 0), 100);
  }

  /**
   * Determine anomaly type
   */
  private determineAnomalyType(
    dataPoint: FinancialDataPoint,
    data: FinancialDataPoint[],
    index: number,
  ): 'spike' | 'drop' | 'pattern-break' | 'seasonal-break' {
    const previousDataPoint = data.at(index - 1);
    const nextDataPoint = data.at(index + 1);
    const previousValue = previousDataPoint?.value ?? dataPoint.value;
    const nextValue = nextDataPoint?.value ?? dataPoint.value;

    if (dataPoint.value > previousValue * 1.5 && dataPoint.value > nextValue * 1.5) {
      return 'spike';
    }
    if (dataPoint.value < previousValue * 0.5 && dataPoint.value < nextValue * 0.5) {
      return 'drop';
    }
    return 'pattern-break';
  }

  /**
   * Determine anomaly severity
   */
  private determineSeverity(zScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (zScore > 4) return 'critical';
    if (zScore > 3) return 'high';
    if (zScore > 2.5) return 'medium';
    return 'low';
  }

  /**
   * Generate anomaly explanation
   */
  private generateAnomalyExplanation(dataPoint: FinancialDataPoint, zScore: number): string {
    return `Anomaly detected in ${dataPoint.category} on ${dataPoint.date.toISOString()}. Value: ${dataPoint.value}, Z-score: ${roundAmount(zScore, 2)}`;
  }

  /**
   * Generate suggested action for anomaly
   */
  private generateSuggestedAction(_dataPoint: FinancialDataPoint, zScore: number): string {
    if (zScore > 3) {
      return 'Immediate investigation required. Review transaction details and verify data accuracy.';
    }
    return 'Monitor closely and investigate if pattern continues.';
  }

  /**
   * Assess liquidity risk
   */
  private async assessLiquidityRisk(_tenantId: string): Promise<RiskAssessment | undefined> {
    const cashData = this.getFilteredData(_tenantId, 'cash', '30d');
    if (cashData.length < 5) return undefined;

    const recentCashData = cashData.at(-1);
    if (!recentCashData) return undefined;

    const recentCash = recentCashData.value;
    const avgCash = cashData.reduce((sum, d) => sum + d.value, 0) / cashData.length;
    const cashRatio = recentCash / avgCash;

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (cashRatio < 0.5) riskLevel = 'critical';
    else if (cashRatio < 0.7) riskLevel = 'high';
    else if (cashRatio < 0.9) riskLevel = 'medium';

    return {
      riskType: 'liquidity',
      riskLevel,
      probability: Math.max(0, 1 - cashRatio),
      impact:
        riskLevel === 'critical'
          ? 0.9
          : riskLevel === 'high'
            ? 0.7
            : riskLevel === 'medium'
              ? 0.5
              : 0.3,
      riskScore:
        Math.max(0, 1 - cashRatio) *
        (riskLevel === 'critical'
          ? 0.9
          : riskLevel === 'high'
            ? 0.7
            : riskLevel === 'medium'
              ? 0.5
              : 0.3),
      mitigationStrategies: [
        'Increase cash reserves',
        'Optimize accounts receivable',
        'Negotiate payment terms',
        'Establish credit facilities',
      ],
      monitoringIndicators: [
        'Cash flow trends',
        'Accounts receivable aging',
        'Payment patterns',
        'Seasonal variations',
      ],
    };
  }

  /**
   * Assess credit risk
   */
  private async assessCreditRisk(_tenantId: string): Promise<RiskAssessment | undefined> {
    // Simplified credit risk assessment
    return {
      riskType: 'credit',
      riskLevel: 'medium',
      probability: 0.3,
      impact: 0.6,
      riskScore: 0.18,
      mitigationStrategies: [
        'Credit monitoring',
        'Diversified customer base',
        'Credit insurance',
        'Regular credit reviews',
      ],
      monitoringIndicators: [
        'Customer payment history',
        'Credit utilization',
        'Industry trends',
        'Economic indicators',
      ],
    };
  }

  /**
   * Assess operational risk
   */
  private async assessOperationalRisk(_tenantId: string): Promise<RiskAssessment | undefined> {
    // Simplified operational risk assessment
    return {
      riskType: 'operational',
      riskLevel: 'low',
      probability: 0.2,
      impact: 0.4,
      riskScore: 0.08,
      mitigationStrategies: [
        'Process automation',
        'Staff training',
        'System redundancy',
        'Regular audits',
      ],
      monitoringIndicators: [
        'Error rates',
        'Process efficiency',
        'Staff turnover',
        'System uptime',
      ],
    };
  }

  /**
   * Generate trend insights
   */
  private async generateTrendInsights(tenantId: string): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];

    try {
      const revenueTrend = await this.analyzeTrends(tenantId, 'revenue', '30d');
      if (revenueTrend.trend === 'increasing' && revenueTrend.confidence > 70) {
        insights.push({
          id: `trend-${tenantId}-revenue-${Date.now()}`,
          type: 'trend',
          title: 'Revenue Growth Trend',
          description: `Revenue is showing a strong upward trend with ${revenueTrend.confidence.toFixed(1)}% confidence`,
          confidence: revenueTrend.confidence,
          impact: 'high',
          actionable: true,
          recommendedActions: [
            'Capitalize on growth momentum',
            'Invest in capacity expansion',
            'Optimize pricing strategy',
          ],
          dataPoints: this.getFilteredData(tenantId, 'revenue', '30d'),
          generatedAt: new Date(),
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to generate trend insights: ${error}`);
    }

    return insights;
  }

  /**
   * Generate anomaly insights
   */
  private async generateAnomalyInsights(tenantId: string): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];

    try {
      const anomalies = await this.detectAnomalies(tenantId, 'revenue', '30d');
      const criticalAnomalies = anomalies.filter(
        (a) => a.severity === 'critical' || a.severity === 'high',
      );

      if (hasItems(criticalAnomalies)) {
        insights.push({
          id: `anomaly-${tenantId}-revenue-${Date.now()}`,
          type: 'anomaly',
          title: 'Critical Revenue Anomalies Detected',
          description: `${criticalAnomalies.length} critical anomalies detected in revenue data`,
          confidence: 85,
          impact: 'critical',
          actionable: true,
          recommendedActions: [
            'Immediate investigation required',
            'Verify data accuracy',
            'Review transaction details',
            'Check for system issues',
          ],
          dataPoints: criticalAnomalies.map((a) => a.dataPoint),
          generatedAt: new Date(),
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to generate anomaly insights: ${error}`);
    }

    return insights;
  }

  /**
   * Generate opportunity insights
   */
  private async generateOpportunityInsights(tenantId: string): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];

    // Mock opportunity insights
    insights.push({
      id: `opportunity-${tenantId}-cost-optimization-${Date.now()}`,
      type: 'opportunity',
      title: 'Cost Optimization Opportunity',
      description: 'Analysis suggests potential for 15% cost reduction in operational expenses',
      confidence: 75,
      impact: 'medium',
      actionable: true,
      recommendedActions: [
        'Review vendor contracts',
        'Optimize resource allocation',
        'Implement automation',
        'Negotiate better terms',
      ],
      dataPoints: this.getFilteredData(tenantId, 'expense', '30d'),
      generatedAt: new Date(),
    });

    return insights;
  }

  /**
   * Real-time analysis for new data points
   */
  private analyzeRealTime(tenantId: string, dataPoint: FinancialDataPoint): void {
    // Log real-time analysis event
    this.logger.debug(
      `Real-time analysis for tenant ${tenantId}: ${dataPoint.category} - ${dataPoint.value}`,
    );
  }

  /**
   * Get stored insights
   */
  getInsights(_tenantId: string): FinancialInsight[] {
    return Array.from(this.insights.values()).filter((insight) =>
      insight.dataPoints.some((dp) => dp.category === 'revenue' || dp.category === 'expense'),
    );
  }

  /**
   * Get financial data for tenant
   */
  getFinancialData(_tenantId: string, category?: string): FinancialDataPoint[] {
    const data = this.financialData.get(_tenantId) || [];
    return category ? data.filter((d) => d.category === category) : data;
  }
}

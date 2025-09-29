import { ExchangeRateEntity } from '../infrastructure/exchange-rate.entity';
import { safeGet, omitUndefined, normalizeAccountCode } from '../utils';
import { createBusinessError, createValidationError, ErrorContext } from '../utils/error-utilities';
import { retry, timeout } from '../utils/async-utilities';
import { PerformanceProfiler, createProfiler, PerformanceTimer, Cache, createCache } from '../utils/performance-utilities';
import { type HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository, Between } from 'typeorm';

// Constants for error messages
const EXCHANGE_RATE_API_ERROR_MESSAGE = 'Unable to fetch exchange rate for {fromCurrency}/{toCurrency}: {error}';
const EXCHANGE_RATE_ENTITY = 'ExchangeRate';
const EXCHANGE_RATE_API_ERROR_CODE = 'exchange-rate-api-error';
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly profiler: PerformanceProfiler;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultBase: string;
  private readonly cache: Cache<{ rate: number; source: string }>;
  private readonly cacheTtlMs: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(ExchangeRateEntity)
    private readonly exchangeRateRepository: Repository<ExchangeRateEntity>,
  ) {
    this.profiler = createProfiler();
    this.apiKey = this.configService.get('EXCHANGE_RATE_API_KEY') || '';
    this.baseUrl = this.configService.get(
      'EXCHANGE_RATE_API_URL',
      'https://api.exchangerate-api.com/v4',
    );
    this.defaultBase = this.configService.get('BASE_CURRENCY', 'MYR');
    this.cacheTtlMs = Number(this.configService.get('EXCHANGE_RATE_CACHE_TTL_MS', '300000')); // 5m default
    this.cache = createCache<{ rate: number; source: string }>({
      maxSize: 1000,
      ttl: this.cacheTtlMs,
    });
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string, date?: Date): Promise<number> {
    const timer = new PerformanceTimer();
    const errorContext: ErrorContext = {
      tenantId: 'system',
      operation: 'getExchangeRate',
      fromCurrency,
      toCurrency,
      ...(date && { date: date.toISOString() }),
    };

    try {
      // Validate input currencies
      if (!fromCurrency || !toCurrency) {
        throw createValidationError('currency', 'Currency codes are required', { fromCurrency, toCurrency }, errorContext);
      }

      if (fromCurrency === toCurrency) {
        const metrics = timer.getMetrics();
        this.profiler.record(metrics);
        return 1.0;
      }

      const targetDate = date ?? new Date();
      const { dayStart, dayEnd, dayKey } = this.normalizeDate(targetDate);
      const cacheKey = `${fromCurrency}|${toCurrency}|${dayKey}`;

      // Check in-memory cache
      const cached = this.cache.get(cacheKey);
      if (cached) {
        const metrics = timer.getMetrics();
        this.profiler.record(metrics);
        return cached.rate;
      }

      // Try to get from database cache
      const cachedRate = await this.exchangeRateRepository.findOne({
        where: {
          fromCurrency,
          toCurrency,
          date: Between(dayStart, dayEnd),
        },
      });

      if (cachedRate) {
        const rateValue = Number(cachedRate.rate);
        this.cache.set(cacheKey, { rate: rateValue, source: 'database' });
        const metrics = timer.getMetrics();
        this.profiler.record(metrics);
        return rateValue;
      }

      // Fetch from external API with retry and timeout
      const rate = await retry(
        () => timeout(this.fetchExchangeRate(fromCurrency, toCurrency, dayStart), 10000),
        {
          maxRetries: 3,
          delay: 1000,
          backoffMultiplier: 2,
        }
      );

      // Cache the rate in database
      await this.exchangeRateRepository.save({
        fromCurrency,
        toCurrency,
        rate: String(rate),
        date: dayStart,
      });

      // Cache in memory
      this.cache.set(cacheKey, { rate, source: 'api' });

      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      return rate;
    } catch (error) {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      
      if (error instanceof Error) {
        throw createBusinessError(
          'exchange-rate-fetch',
          `Failed to get exchange rate for ${fromCurrency}/${toCurrency}: ${error.message}`,
          EXCHANGE_RATE_ENTITY,
          errorContext
        );
      }
      throw error;
    }
  }

  private async fetchExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    _date: Date,
  ): Promise<number> {
    const errorContext: ErrorContext = {
      tenantId: 'system',
      operation: 'fetchExchangeRate',
      fromCurrency,
      toCurrency,
    };

    try {
      // Strategy:
      // 1) Try provider endpoint with base = fromCurrency
      // 2) If unavailable, fetch with base = defaultBase and cross via triangle
      // 3) As last resort, invert (to->from) if only inverse exists
      const tryDirect = async () => {
        try {
          const res = await this.httpService.axiosRef.get(`${this.baseUrl}/latest/${fromCurrency}`, {
            params: this.apiKey ? { access_key: this.apiKey } : undefined,
          });
          const rates = res?.data?.rates ?? {};

          if (safeGet(rates, toCurrency, null) != null) return Number(safeGet(rates, toCurrency, 0));
          return null;
        } catch (error) {
          this.logger.warn(`Direct fetch failed for ${fromCurrency}/${toCurrency}:`, error);
          return null;
        }
      };

      const tryTriangulate = async () => {
        try {
          const res = await this.httpService.axiosRef.get(
            `${this.baseUrl}/latest/${this.defaultBase}`,
            {
              params: this.apiKey ? { access_key: this.apiKey } : undefined,
            },
          );
          const rates = res?.data?.rates ?? {};

          const rBaseTo = safeGet(rates, toCurrency, 0);
          const rBaseFrom = safeGet(rates, fromCurrency, 0);
          if (rBaseTo != null && rBaseFrom != null && Number(rBaseFrom) !== 0) {
            return Number(rBaseTo) / Number(rBaseFrom);
          }
          return null;
        } catch (error) {
          this.logger.warn(`Triangulation failed for ${fromCurrency}/${toCurrency}:`, error);
          return null;
        }
      };

      const tryInverse = async () => {
        try {
          const res = await this.httpService.axiosRef.get(`${this.baseUrl}/latest/${toCurrency}`, {
            params: this.apiKey ? { access_key: this.apiKey } : undefined,
          });
          const rates = res?.data?.rates ?? {};

          const r = safeGet(rates, fromCurrency, 0);
          if (r != null && Number(r) !== 0) return 1 / Number(r);
          return null;
        } catch (error) {
          this.logger.warn(`Inverse fetch failed for ${fromCurrency}/${toCurrency}:`, error);
          return null;
        }
      };

      const candidates = [tryDirect, tryTriangulate, tryInverse];
      for (const function_ of candidates) {
        const v = await function_();
        if (v != null && Number.isFinite(v)) return v;
      }
      
      throw createBusinessError(
        'exchange-rate-unavailable',
        `No rate path available for ${fromCurrency}->${toCurrency}`,
        EXCHANGE_RATE_ENTITY,
        errorContext
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'BusinessRuleError') {
        throw error;
      }
      
      this.logger.error(`Failed to fetch exchange rate for ${fromCurrency}/${toCurrency}:`, error);
      throw createBusinessError(
        EXCHANGE_RATE_API_ERROR_CODE,
        EXCHANGE_RATE_API_ERROR_MESSAGE.replace('{fromCurrency}', fromCurrency).replace('{toCurrency}', toCurrency).replace('{error}', error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE),
        EXCHANGE_RATE_ENTITY,
        errorContext
      );
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async updateExchangeRates(): Promise<void> {
    const timer = new PerformanceTimer();
    const errorContext: ErrorContext = {
      tenantId: 'system',
      operation: 'updateExchangeRates',
    };

    try {
      const currencies = this.configService
        .get<string>('SUPPORTED_CURRENCIES', 'MYR,USD,EUR,GBP,SGD,THB,IDR,VND,PHP')
        .split(',')
        .map((c) => normalizeAccountCode(c))
        .filter(Boolean);
      const baseCurrency = this.defaultBase;
      const { dayStart } = this.normalizeDate(new Date());

      this.logger.log(`Updating exchange rates for ${currencies.length} currencies...`);

      let successCount = 0;
      let errorCount = 0;

      for (const currency of currencies) {
        if (currency === baseCurrency) continue;

        try {
          const rate = await retry(
            () => timeout(this.fetchExchangeRate(baseCurrency, currency, dayStart), 15000),
            {
              maxRetries: 2,
              delay: 2000,
              backoffMultiplier: 2,
            }
          );

          await this.exchangeRateRepository.save(
            omitUndefined({
              fromCurrency: baseCurrency,
              toCurrency: currency,
              rate: String(rate),
              date: dayStart,
            }),
          );

          // Warm in-memory cache
          const key = `${baseCurrency}|${currency}|${this.formatDayKey(dayStart)}`;
          this.cache.set(key, { rate, source: 'scheduled-update' });
          
          successCount++;
          this.logger.debug(`Updated rate for ${baseCurrency}/${currency}: ${rate}`);
        } catch (error) {
          errorCount++;
          this.logger.error(`Failed to update rate for ${baseCurrency}/${currency}:`, error);
        }
      }

      const metrics = timer.getMetrics();
      this.profiler.record(metrics);

      this.logger.log(`Exchange rates update completed: ${successCount} successful, ${errorCount} failed`);
    } catch (error) {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      
      this.logger.error('Failed to update exchange rates:', error);
      throw createBusinessError(
        'exchange-rate-update-failed',
        `Exchange rates update failed: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        EXCHANGE_RATE_ENTITY,
        errorContext
      );
    }
  }

  private normalizeDate(d: Date): { dayStart: Date; dayEnd: Date; dayKey: string } {
    // Normalize to UTC midnight to avoid tz mismatches
    const dayStart = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0),
    );
    const dayEnd = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999),
    );
    return { dayStart, dayEnd, dayKey: this.formatDayKey(dayStart) };
  }

  private formatDayKey(dayStartUtc: Date): string {
    const y = dayStartUtc.getUTCFullYear();
    const m = String(dayStartUtc.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dayStartUtc.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Get exchange rate history for a currency pair
   */
  async getExchangeRateHistory(
    fromCurrency: string,
    toCurrency: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 30,
  ): Promise<Array<{ date: Date; rate: number; source: string }>> {
    const timer = new PerformanceTimer();
    const errorContext: ErrorContext = {
      tenantId: 'system',
      operation: 'getExchangeRateHistory',
      fromCurrency,
      toCurrency,
      ...(startDate && { startDate: startDate.toISOString() }),
      ...(endDate && { endDate: endDate.toISOString() }),
      limit: limit.toString(),
    };

    try {
      // Validate input currencies
      if (!fromCurrency || !toCurrency) {
        throw createValidationError('currency', 'Currency codes are required', { fromCurrency, toCurrency }, errorContext);
      }

      // Validate limit
      if (limit <= 0 || limit > 1000) {
        throw createValidationError('limit', 'Limit must be between 1 and 1000', limit, errorContext);
      }

      const queryBuilder = this.exchangeRateRepository
        .createQueryBuilder('rate')
        .where('rate.fromCurrency = :fromCurrency', { fromCurrency: fromCurrency.toUpperCase() })
        .andWhere('rate.toCurrency = :toCurrency', { toCurrency: toCurrency.toUpperCase() })
        .orderBy('rate.date', 'DESC')
        .limit(limit);

      if (startDate) {
        queryBuilder.andWhere('rate.date >= :startDate', { startDate });
      }
      if (endDate) {
        queryBuilder.andWhere('rate.date <= :endDate', { endDate });
      }

      const rates = await queryBuilder.getMany();

      const result = rates.map((rate) => ({
        date: rate.date,
        rate: Number(rate.rate),
        source: 'database',
      }));

      const metrics = timer.getMetrics();
      this.profiler.record(metrics);

      return result;
    } catch (error) {
      const metrics = timer.getMetrics();
      this.profiler.record(metrics);
      
      if (error instanceof Error && error.name === 'ValidationError') {
        throw error;
      }
      
      this.logger.error(`Failed to get exchange rate history for ${fromCurrency}/${toCurrency}:`, error);
      throw createBusinessError(
        'exchange-rate-history-fetch-failed',
        `Failed to get exchange rate history: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        EXCHANGE_RATE_ENTITY,
        errorContext
      );
    }
  }
}

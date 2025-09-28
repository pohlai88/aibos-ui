import { ExchangeRateEntity } from '../infrastructure/exchange-rate.entity';
import { safeGet } from '../utils';
import { omitUndefined } from '../utils';
import { type HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository, Between } from 'typeorm';

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultBase: string;
  /** simple in-memory cache: key = `${from}|${to}|${YYYY-MM-DD}` */
  private readonly cache = new Map<string, { rate: number; expiresAt: number }>();
  private readonly cacheTtlMs: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(ExchangeRateEntity)
    private readonly exchangeRateRepository: Repository<ExchangeRateEntity>,
  ) {
    this.apiKey = this.configService.get('EXCHANGE_RATE_API_KEY') || '';
    this.baseUrl = this.configService.get(
      'EXCHANGE_RATE_API_URL',
      'https://api.exchangerate-api.com/v4',
    );
    this.defaultBase = this.configService.get('BASE_CURRENCY', 'MYR');
    this.cacheTtlMs = Number(this.configService.get('EXCHANGE_RATE_CACHE_TTL_MS', '300000')); // 5m default
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string, date?: Date): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1.0;
    }

    const targetDate = date ?? new Date();
    const { dayStart, dayEnd, dayKey } = this.normalizeDate(targetDate);
    const cacheKey = `${fromCurrency}|${toCurrency}|${dayKey}`;

    // In-memory cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.rate;
    }

    // Try to get from cache first
    const cachedRate = await this.exchangeRateRepository.findOne({
      where: {
        fromCurrency,
        toCurrency,
        date: Between(dayStart, dayEnd),
      },
    });

    if (cachedRate) {
      const rateValue = Number(cachedRate.rate);
      this.cache.set(cacheKey, { rate: rateValue, expiresAt: Date.now() + this.cacheTtlMs });
      return rateValue;
    }

    // Fetch from external API
    const rate = await this.fetchExchangeRate(fromCurrency, toCurrency, dayStart);

    // Cache the rate
    await this.exchangeRateRepository.save({
      fromCurrency,
      toCurrency,
      rate: String(rate),
      date: dayStart,
    });
    this.cache.set(cacheKey, { rate, expiresAt: Date.now() + this.cacheTtlMs });

    return rate;
  }

  private async fetchExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    _date: Date,
  ): Promise<number> {
    try {
      // Strategy:
      // 1) Try provider endpoint with base = fromCurrency
      // 2) If unavailable, fetch with base = defaultBase and cross via triangle
      // 3) As last resort, invert (to->from) if only inverse exists
      const tryDirect = async () => {
        const res = await this.httpService.axiosRef.get(`${this.baseUrl}/latest/${fromCurrency}`, {
          params: this.apiKey ? { access_key: this.apiKey } : undefined,
        });
        const rates = res?.data?.rates ?? {};

        if (safeGet(rates, toCurrency, null) != null) return Number(safeGet(rates, toCurrency, 0));
        return null;
      };
      const tryTriangulate = async () => {
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
      };
      const tryInverse = async () => {
        const res = await this.httpService.axiosRef.get(`${this.baseUrl}/latest/${toCurrency}`, {
          params: this.apiKey ? { access_key: this.apiKey } : undefined,
        });
        const rates = res?.data?.rates ?? {};

        const r = safeGet(rates, fromCurrency, 0);
        if (r != null && Number(r) !== 0) return 1 / Number(r);
        return null;
      };

      const candidates = [tryDirect, tryTriangulate, tryInverse];
      for (const function_ of candidates) {
        const v = await function_();
        if (v != null && Number.isFinite(v)) return v;
      }
      throw new Error(`No rate path for ${fromCurrency}->${toCurrency}`);
    } catch (error) {
      this.logger.error(`Failed to fetch exchange rate for ${fromCurrency}/${toCurrency}:`, error);
      throw new Error(`Unable to fetch exchange rate for ${fromCurrency}/${toCurrency}`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async updateExchangeRates(): Promise<void> {
    const currencies = this.configService
      .get<string>('SUPPORTED_CURRENCIES', 'MYR,USD,EUR,GBP,SGD,THB,IDR,VND,PHP')
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    const baseCurrency = this.defaultBase;
    const { dayStart } = this.normalizeDate(new Date());

    this.logger.log('Updating exchange rates...');

    for (const currency of currencies) {
      if (currency === baseCurrency) continue;

      try {
        const rate = await this.fetchExchangeRate(baseCurrency, currency, dayStart);
        await this.exchangeRateRepository.save(
          omitUndefined({
            fromCurrency: baseCurrency,
            toCurrency: currency,
            rate: String(rate),
            date: dayStart,
          }),
        );
        // Warm in-memory cache for this hour
        const key = `${baseCurrency}|${currency}|${this.formatDayKey(dayStart)}`;
        this.cache.set(key, { rate, expiresAt: Date.now() + this.cacheTtlMs });
      } catch (error) {
        this.logger.error(`Failed to update rate for ${baseCurrency}/${currency}:`, error);
      }
    }

    this.logger.log('Exchange rates updated successfully');
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

    return rates.map((rate) => ({
      date: rate.date,
      rate: Number(rate.rate),
      source: 'database',
    }));
  }
}

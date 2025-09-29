import 'dotenv/config';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import type { DataSourceOptions } from 'typeorm';
import type { TlsOptions } from 'node:tls';

const ssl: TlsOptions | undefined =
  process.env.NODE_ENV === 'production' || process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : undefined;

// Use DataSourceOptions to avoid cross-module type mismatch
const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number.parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USERNAME ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'password',
  database: process.env.DATABASE_NAME ?? 'accounting',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: ['error'],
  namingStrategy: new SnakeNamingStrategy(),
  ...(ssl ? { ssl } : {}),
};

export default new DataSource(config);

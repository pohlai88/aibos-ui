import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get('NODE_ENV') === 'production';
        const sslEnabled = isProduction || config.get('DATABASE_SSL') === 'true';

        return {
          type: 'postgres',
          host: config.get<string>('DATABASE_HOST'),
          port: Number(config.get('DATABASE_PORT') ?? 5432),
          username: config.get<string>('DATABASE_USERNAME'),
          password: config.get<string>('DATABASE_PASSWORD'),
          database: config.get<string>('DATABASE_NAME'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          synchronize: false,
          logging:
            config.get('NODE_ENV') === 'development' ? ['warn', 'error', 'schema'] : ['error'],
          ssl: sslEnabled
            ? {
                rejectUnauthorized: config.get('DATABASE_SSL_REJECT_UNAUTHORIZED') !== 'false',
                ca: config.get<string>('DATABASE_SSL_CA') || undefined, // optional PEM
              }
            : undefined,
          extra: {
            max: Number(config.get('DB_POOL_MAX') ?? 20),
            idleTimeoutMillis: Number(config.get('DB_IDLE_TIMEOUT_MS') ?? 30_000),
            connectionTimeoutMillis: Number(config.get('DB_CONN_TIMEOUT_MS') ?? 2_000),
            statement_timeout: Number(config.get('DB_STATEMENT_TIMEOUT_MS') ?? 30_000),
            application_name: config.get('APP_NAME') ?? 'aibos-accounting',
          },
          keepConnectionAlive: true,
          namingStrategy: new SnakeNamingStrategy(),
        };
      },
    }),
  ],
})
export class DatabaseModule {}

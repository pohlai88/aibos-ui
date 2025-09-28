import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'exchange_rates' })
@Index('ux_exchangerates_from_to_date', ['fromCurrency', 'toCurrency', 'date'], { unique: true })
@Index('ix_exchangerates_date', ['date'])
export class ExchangeRateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'from_currency', type: 'text' })
  fromCurrency!: string; // e.g., 'MYR'

  @Column({ name: 'to_currency', type: 'text' })
  toCurrency!: string; // e.g., 'MYR'

  // Store normalized UTC midnight for the day (see service normalizeDate)
  @Column({ name: 'date', type: 'timestamptz' })
  date!: Date;

  @Column({ name: 'rate', type: 'numeric', precision: 18, scale: 9 })
  rate!: string; // numeric in DB; convert to number at the edges if needed

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('gl_entry')
@Index(['tenantId', 'accountCode', 'postingTs'])
@Index(['tenantId', 'journalId'])
export class GeneralLedgerEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'journal_id', type: 'uuid' })
  journalId!: string;

  @Column({ name: 'account_code', type: 'varchar', length: 50 })
  accountCode!: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, default: 0 })
  debitAmount!: number;

  @Column({ type: 'decimal', precision: 18, scale: 6, default: 0 })
  creditAmount!: number;

  @Column({ type: 'varchar', length: 3, default: 'MYR' })
  currency!: string;

  @Column({ name: 'posting_ts', type: 'timestamptz' })
  postingTs!: Date;

  @Column({ name: 'reference', type: 'varchar', length: 255, nullable: true })
  reference?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}

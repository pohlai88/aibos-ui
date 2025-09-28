import type { JournalEntry } from '@aibos/accounting/domain/accounting-entities';
import type { JournalEntryRepository } from '@aibos/accounting/domain/repositories.interface';

import { JournalEntryEntity } from './journal-entry.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';
import { omitUndefined } from '../utils';

@Injectable()
export class TypeormJournalEntryRepository implements JournalEntryRepository {
  constructor(
    @InjectRepository(JournalEntryEntity)
    private readonly repo: Repository<JournalEntryEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<JournalEntry | null> {
    const entity = await this.repo.findOne({
      where: { id, tenantId },
      relations: ['generalLedgerEntries'],
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByTenant(tenantId: string, limit?: number, offset?: number): Promise<JournalEntry[]> {
    const entities = await this.repo.find(
      omitUndefined({
        where: { tenantId },
        order: { postingDate: 'DESC', createdAt: 'DESC' },
        take: limit,
        skip: offset,
        relations: ['generalLedgerEntries'],
      }),
    );
    return entities.map(this.toDomain);
  }

  async save(journalEntry: JournalEntry): Promise<void> {
    const entity = this.toEntity(journalEntry);
    await this.repo.save(entity);
  }

  private toDomain = (entity: JournalEntryEntity): JournalEntry => ({
    id: entity.id,
    tenantId: entity.tenantId,
    reference: entity.reference,
    description: entity.description,
    postingDate: entity.postingDate,
    status: entity.status,
    entries:
      entity.generalLedgerEntries?.map((gle) => ({
        accountCode: gle.accountCode,
        debitAmount: Number(gle.debitAmount),
        creditAmount: Number(gle.creditAmount),
        currency: gle.currency,
        description: gle.description,
      })) || [],
  });

  private toEntity(journalEntry: JournalEntry): JournalEntryEntity {
    const entity = new JournalEntryEntity();
    entity.id = journalEntry.id;
    entity.tenantId = journalEntry.tenantId;
    entity.reference = journalEntry.reference;
    entity.description = journalEntry.description;
    entity.postingDate = journalEntry.postingDate;
    entity.status = journalEntry.status;
    return entity;
  }
}

import type { JournalEntry, JournalEntryRepository } from '@aibos/accounting';

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

  private toDomain = (entity: JournalEntryEntity): JournalEntry => {
    const journalEntry = new JournalEntry(
      entity.reference,
      entity.description,
      entity.postingDate,
      entity.tenantId,
      entity.userId || 'system'
    );
    // Set private properties using reflection or public methods if available
    (journalEntry as unknown).id = entity.id;
    (journalEntry as unknown).status = entity.status;
    (journalEntry as unknown).entries = entity.generalLedgerEntries?.map((gle) => ({
      accountCode: gle.accountCode,
      debitAmount: Number(gle.debitAmount),
      creditAmount: Number(gle.creditAmount),
      currency: gle.currency,
      description: gle.description,
    })) || [];
    return journalEntry;
  };

  private toEntity(journalEntry: JournalEntry): JournalEntryEntity {
    const entity = new JournalEntryEntity();
    entity.id = (journalEntry as unknown).id;
    entity.tenantId = (journalEntry as unknown).tenantId;
    entity.reference = (journalEntry as unknown).reference;
    entity.description = (journalEntry as unknown).description;
    entity.postingDate = (journalEntry as unknown).postingDate;
    entity.status = (journalEntry as unknown).status;
    return entity;
  }
}

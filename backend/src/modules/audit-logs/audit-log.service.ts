import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog, AuditResult } from "./entities/audit-log.entity";
import { AuditLogDto } from "./dtos/audit-log.dto";
import { FilterAuditLogDto } from "./dtos/filter-audit-log.dto";
import { AuditLogMapper } from "./mappers/audit-log.mapper";

export interface CreateAuditLogInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  result?: AuditResult;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  async findAll(params: FilterAuditLogDto = {}): Promise<AuditLogDto[]> {
    const page = Number(params.page);
    const limit = Number(params.limit);
    const query = this.repository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user');

    if (params.search) {
      query.andWhere(
        `(auditLog.action ILIKE :search OR auditLog.entity ILIKE :search OR auditLog.entityId ILIKE :search OR user.name ILIKE :search OR user.email ILIKE :search)`,
        { search: `%${params.search}%` },
      );
    }

    if (params.userId) {
      query.andWhere('auditLog.userId = :userId', { userId: params.userId });
    }

    if (params.action) {
      query.andWhere('auditLog.action = :action', { action: params.action });
    }

    if (params.entity) {
      query.andWhere('auditLog.entity = :entity', { entity: params.entity });
    }

    if (params.entityId) {
      query.andWhere('auditLog.entityId = :entityId', { entityId: params.entityId });
    }

    if (params.result) {
      query.andWhere('auditLog.result = :result', { result: params.result });
    }

    if (params.dateFrom) {
      query.andWhere('auditLog.createdAt >= :dateFrom', { dateFrom: params.dateFrom });
    }

    if (params.dateTo) {
      query.andWhere('auditLog.createdAt <= :dateTo', { dateTo: params.dateTo });
    }

    if (Number.isInteger(page) && Number.isInteger(limit) && page > 0 && limit > 0) {
      query.skip((page - 1) * limit).take(limit);
    }

    const auditLogs = await query
      .orderBy('auditLog.createdAt', 'DESC')
      .getMany();

    return auditLogs.map(AuditLogMapper.toDTO);
  }

  async findById(id: string): Promise<AuditLogDto> {
    const auditLog = await this.repository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!auditLog) {
      throw new NotFoundException('Audit log not found');
    }

    return AuditLogMapper.toDTO(auditLog);
  }

  async create(input: CreateAuditLogInput): Promise<AuditLogDto> {
    const auditLog = this.repository.create({
      ...input,
      userId: input.userId ?? null,
      entityId: input.entityId ?? null,
      before: input.before ?? null,
      after: input.after ?? null,
      result: input.result ?? AuditResult.SUCCESS,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });

    const savedAuditLog = await this.repository.save(auditLog);
    return this.findById(savedAuditLog.id);
  }
}

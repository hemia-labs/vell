import { AuditResult } from "../entities/audit-log.entity";

export class AuditLogUserDto {
  id: string;
  name: string;
  email: string;
}

export class AuditLogDto {
  id: string;
  userId: string | null;
  user: AuditLogUserDto | null;
  action: string;
  entity: string;
  entityId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  result: AuditResult;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

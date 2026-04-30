import { AuditLog } from "../entities/audit-log.entity";
import { AuditLogDto } from "../dtos/audit-log.dto";

export class AuditLogMapper {
  static toDTO(entity: AuditLog): AuditLogDto {
    return {
      id: entity.id,
      userId: entity.userId,
      user: entity.user
        ? {
            id: entity.user.id,
            name: entity.user.name,
            email: entity.user.email,
          }
        : null,
      action: entity.action,
      entity: entity.entity,
      entityId: entity.entityId,
      before: entity.before,
      after: entity.after,
      result: entity.result,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      createdAt: entity.createdAt,
    };
  }
}

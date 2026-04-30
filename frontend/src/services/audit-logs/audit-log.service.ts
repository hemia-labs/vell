import type { AuditLog, FilterAuditLogParams } from '@/domain/models/audit-log.model'
import BaseService from '@/services/base/base.services'

const AUDIT_LOG_ENDPOINT = '/api/v1/audit-logs'

class AuditLogService extends BaseService {
  async findAll(params?: FilterAuditLogParams): Promise<AuditLog[]> {
    const { data } = await this.client.get<AuditLog[]>(AUDIT_LOG_ENDPOINT, { params })
    return data
  }

  async findById(id: string): Promise<AuditLog> {
    const { data } = await this.client.get<AuditLog>(`${AUDIT_LOG_ENDPOINT}/${id}`)
    return data
  }
}

export default AuditLogService

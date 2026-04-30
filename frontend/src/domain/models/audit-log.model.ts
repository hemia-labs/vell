export type AuditResult = 'success' | 'failed'

export interface AuditLogUser {
  id: string
  name: string
  email: string
}

export interface AuditLog {
  id: string
  userId: string | null
  user: AuditLogUser | null
  action: string
  entity: string
  entityId: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  result: AuditResult
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export interface FilterAuditLogParams {
  search?: string
  userId?: string
  action?: string
  entity?: string
  entityId?: string
  result?: AuditResult
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

import { ref } from 'vue'
import type { AuditLog, FilterAuditLogParams } from '@/domain/models/audit-log.model'
import AuditLogService from '@/services/audit-logs/audit-log.service'

const auditLogService = new AuditLogService()

export function useAuditLogs() {
  const auditLogs = ref<AuditLog[]>([])
  const currentAuditLog = ref<AuditLog | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref('')

  async function runAction<T>(message: string, action: () => Promise<T>): Promise<T | null> {
    isLoading.value = true
    errorMessage.value = ''

    try {
      return await action()
    } catch {
      errorMessage.value = message
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function loadAuditLogs(params?: FilterAuditLogParams | Event) {
    return runAction('No se pudo cargar el audit log.', async () => {
      auditLogs.value = await auditLogService.findAll(params instanceof Event ? undefined : params)
      return auditLogs.value
    })
  }

  async function loadAuditLogById(id: string) {
    return runAction('No se pudo cargar el registro de auditoría.', async () => {
      currentAuditLog.value = await auditLogService.findById(id)
      return currentAuditLog.value
    })
  }

  function resetCurrentAuditLog() {
    currentAuditLog.value = null
    errorMessage.value = ''
  }

  return {
    auditLogs,
    currentAuditLog,
    isLoading,
    errorMessage,
    loadAuditLogs,
    loadAuditLogById,
    resetCurrentAuditLog
  }
}

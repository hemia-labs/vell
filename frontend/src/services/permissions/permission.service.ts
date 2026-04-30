import BaseService from '@/services/base/base.services'
import type { RolePermission } from '@/domain/models/role.model'

const PERMISSION_ENDPOINT = '/api/v1/permissions'

class PermissionService extends BaseService {
  async findAll(): Promise<RolePermission[]> {
    const { data } = await this.client.get<RolePermission[]>(PERMISSION_ENDPOINT)
    return data
  }
}

export default PermissionService

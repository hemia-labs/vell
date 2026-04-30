import type {
  FilterSettingParams,
  PublicSetting,
  Setting,
  UpdateSetting,
} from '@/domain/models/setting.model'
import BaseService from '@/services/base/base.services'

const SETTING_ENDPOINT = '/api/v1/settings'

class SettingService extends BaseService {
  async findAll(params?: FilterSettingParams): Promise<Setting[]> {
    const { data } = await this.client.get<Setting[]>(SETTING_ENDPOINT, { params })
    return data
  }

  async findPublic(): Promise<PublicSetting[]> {
    const { data } = await this.client.get<PublicSetting[]>(`${SETTING_ENDPOINT}/public`)
    return data
  }

  async findByKey(key: string): Promise<Setting> {
    const { data } = await this.client.get<Setting>(`${SETTING_ENDPOINT}/${key}`)
    return data
  }

  async update(key: string, payload: UpdateSetting): Promise<Setting> {
    const { data } = await this.client.patch<Setting>(`${SETTING_ENDPOINT}/${key}`, payload)
    return data
  }
}

export default SettingService

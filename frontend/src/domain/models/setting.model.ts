export type SettingType = 'text' | 'number' | 'boolean' | 'image' | 'array' | 'json'
export type SettingGroup = 'general' | 'content' | 'mail' | 'system' | 'seo'
export type SettingValue = string | number | boolean | string[] | Record<string, unknown> | null

export interface Setting {
  id: string
  key: string
  value: SettingValue
  type: SettingType
  group: SettingGroup
  description?: string | null
  isPublic: boolean
  isReadonly: boolean
  createdAt: string
  updatedAt: string
}

export interface PublicSetting {
  key: string
  value: SettingValue
  type: SettingType
  group: SettingGroup
}

export interface FilterSettingParams {
  group?: SettingGroup
  search?: string
}

export interface UpdateSetting {
  value: SettingValue
}

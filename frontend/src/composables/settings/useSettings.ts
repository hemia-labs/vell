import { computed, ref } from 'vue'
import type { FilterSettingParams, Setting, SettingValue } from '@/domain/models/setting.model'
import SettingService from '@/services/settings/setting.service'

const settingService = new SettingService()

export function useSettings() {
  const settings = ref<Setting[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref('')
  const savedMessage = ref('')

  const byGroup = computed(() => {
    return settings.value.reduce<Record<string, Setting[]>>((groups, setting) => {
      groups[setting.group] = groups[setting.group] ?? []
      groups[setting.group].push(setting)
      return groups
    }, {})
  })

  async function loadSettings(params?: FilterSettingParams) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      settings.value = await settingService.findAll(params)
      return settings.value
    } catch {
      errorMessage.value = 'No se pudieron cargar los ajustes.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function updateSetting(key: string, value: SettingValue) {
    isSaving.value = true
    errorMessage.value = ''
    savedMessage.value = ''

    try {
      const updated = await settingService.update(key, { value })
      settings.value = settings.value.map((setting) => setting.key === key ? updated : setting)
      savedMessage.value = 'Ajuste actualizado.'
      return updated
    } catch {
      errorMessage.value = 'No se pudo actualizar el ajuste.'
      return null
    } finally {
      isSaving.value = false
    }
  }

  function clearMessages() {
    errorMessage.value = ''
    savedMessage.value = ''
  }

  return {
    settings,
    byGroup,
    isLoading,
    isSaving,
    errorMessage,
    savedMessage,
    loadSettings,
    updateSetting,
    clearMessages
  }
}

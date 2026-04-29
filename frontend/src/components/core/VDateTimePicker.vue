<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DateValue } from 'reka-ui'
import { getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { CalendarIcon, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  id?: string
  modelValue?: string | null
  disabled?: boolean
  placeholder?: string
  includeTime?: boolean
}>(), {
  placeholder: 'Selecciona fecha',
  includeTime: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const open = ref(false)
const date = ref<DateValue>()
const time = ref('00:00')
const defaultPlaceholder = today(getLocalTimeZone())

const formattedValue = computed(() => {
  if (!date.value) {
    return ''
  }

  const localDate = toLocalDate(`${date.value.toString()}T${time.value || '00:00'}`)
  const dateLabel = localDate.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  if (!props.includeTime) {
    return dateLabel
  }

  return `${dateLabel} ${time.value || '00:00'}`
})

watch(
  () => props.modelValue,
  (value) => {
    const parsed = parseModelValue(value)
    date.value = parsed.date
    time.value = parsed.time
  },
  { immediate: true }
)

watch([date, time], () => {
  if (!date.value) {
    emit('update:modelValue', null)
    return
  }

  emit('update:modelValue', props.includeTime ? `${date.value.toString()}T${time.value || '00:00'}` : date.value.toString())
})

function parseModelValue(value?: string | null): { date?: DateValue; time: string } {
  if (!value) {
    return { date: undefined, time: '00:00' }
  }

  const [datePart, timePart = '00:00'] = value.split('T')

  try {
    return {
      date: parseDate(datePart),
      time: normalizeTime(timePart)
    }
  } catch {
    const fallback = toLocalDate(value)
    const year = fallback.getFullYear()
    const month = String(fallback.getMonth() + 1).padStart(2, '0')
    const day = String(fallback.getDate()).padStart(2, '0')
    const hours = String(fallback.getHours()).padStart(2, '0')
    const minutes = String(fallback.getMinutes()).padStart(2, '0')

    return {
      date: parseDate(`${year}-${month}-${day}`),
      time: `${hours}:${minutes}`
    }
  }
}

function normalizeTime(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : '00:00'
}

function toLocalDate(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function clearValue() {
  date.value = undefined
  time.value = '00:00'
  open.value = false
  emit('update:modelValue', null)
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        :id="id"
        type="button"
        variant="outline"
        :disabled="disabled"
        :class="cn(
          'h-9 w-full justify-start border-(--app-line) bg-(--app-surface) text-left font-normal',
          !date && 'text-(--app-muted)'
        )"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        <span class="truncate">{{ formattedValue || placeholder }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <div class="grid gap-3 p-3">
        <Calendar
          v-model="date"
          :initial-focus="true"
          :default-placeholder="defaultPlaceholder"
          layout="month-and-year"
        />
        <div v-if="includeTime" class="grid gap-1.5 border-t border-(--app-line) pt-3">
          <label class="text-[12px] font-medium text-(--app-muted)" :for="`${id ?? 'date'}-time`">Hora</label>
          <Input
            :id="`${id ?? 'date'}-time`"
            v-model="time"
            type="time"
            :disabled="disabled"
          />
        </div>
        <div class="flex justify-end gap-2 border-t border-(--app-line) pt-3">
          <Button type="button" variant="outline" size="sm" :disabled="disabled || !date" @click="clearValue">
            <X :size="14" />
            Limpiar
          </Button>
          <Button type="button" size="sm" @click="open = false">Aplicar</Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

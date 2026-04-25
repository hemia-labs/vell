<script setup lang="ts">
import { computed } from 'vue'
import { MoreHorizontal } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger
} from '@/components/ui/menubar'

export interface VActionMenuAction {
  key: string
  label: string
  disabled?: boolean
  danger?: boolean
}

const props = withDefaults(
  defineProps<{
    actions: VActionMenuAction[]
    label?: string
  }>(),
  {
    label: 'Más acciones'
  }
)

const selectedAction = defineModel<string | null>({ default: null })
const emit = defineEmits<{
  select: [action: VActionMenuAction]
}>()

const normalActions = computed(() => props.actions.filter((action) => !action.danger))
const dangerActions = computed(() => props.actions.filter((action) => action.danger))

function selectAction(action: VActionMenuAction) {
  if (action.disabled) {
    return
  }

  selectedAction.value = action.key
  emit('select', action)
}
</script>

<template>
  <Menubar class="h-auto justify-center border-0 bg-transparent p-0" @click.stop>
    <MenubarMenu>
      <MenubarTrigger as-child>
        <Button variant="outline" size="icon-sm" class="h-8 w-8 p-0" :aria-label="label">
          <MoreHorizontal :size="15" />
        </Button>
      </MenubarTrigger>

      <MenubarContent align="end" class="min-w-44">
        <MenubarItem
          v-for="action in normalActions"
          :key="action.key"
          :disabled="action.disabled"
          @select="selectAction(action)"
        >
          {{ action.label }}
        </MenubarItem>

        <MenubarSeparator v-if="normalActions.length && dangerActions.length" />

        <MenubarItem
          v-for="action in dangerActions"
          :key="action.key"
          :disabled="action.disabled"
          variant="destructive"
          @select="selectAction(action)"
        >
          {{ action.label }}
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
</template>

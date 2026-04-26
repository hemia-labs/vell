<script setup lang="ts">
import { computed } from 'vue'
import { useAuthorization } from '@/composables/auth/useAuthorization'
import type { PermissionRequirement } from '@/lib/authz'

const props = defineProps<{
  permission?: PermissionRequirement
  any?: string[]
  all?: string[]
}>()

const { can } = useAuthorization()
const isAllowed = computed(() => {
  if (props.permission) {
    return can(props.permission)
  }

  return can({
    any: props.any,
    all: props.all
  })
})
</script>

<template>
  <slot v-if="isAllowed" />
</template>

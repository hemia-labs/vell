<script setup lang="ts">
import { ImagePlus, Plus, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ContentMediaInput, ContentMediaRole } from '@/domain/models/content.model'

defineProps<{
  mediaItems: ContentMediaInput[]
  roles: ContentMediaRole[]
}>()

const emit = defineEmits<{
  add: []
  update: [index: number, payload: Partial<ContentMediaInput>]
  remove: [index: number]
}>()

const roleLabels: Record<ContentMediaRole, string> = {
  hero: 'Hero',
  gallery: 'Galería',
  attachment: 'Adjunto',
  inline: 'Inline',
  og_image: 'OG image'
}
</script>

<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 text-[13px] font-medium text-(--app-ink)">
        <ImagePlus :size="15" />
        Media del contenido
      </div>
      <Button type="button" variant="outline" size="sm" @click="emit('add')">
        <Plus :size="14" />
        Agregar media
      </Button>
    </div>

    <div v-if="!mediaItems.length" class="rounded-md border border-dashed border-(--app-line) bg-(--app-surface-2) p-4 text-[13px] text-(--app-muted)">
      Agrega media usando IDs existentes de la librería.
    </div>

    <div v-for="(item, index) in mediaItems" :key="`${item.mediaId}-${index}`" class="grid gap-3 rounded-md border border-(--app-line) bg-(--app-surface) p-3">
      <div class="grid grid-cols-[minmax(0,1fr)_150px_82px_auto] gap-3 max-[860px]:grid-cols-1">
        <Field>
          <FieldLabel :for="`content-media-id-${index}`">Media ID</FieldLabel>
          <FieldContent>
            <Input
              :id="`content-media-id-${index}`"
              :model-value="item.mediaId"
              placeholder="UUID del asset"
              @update:model-value="emit('update', index, { mediaId: String($event) })"
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>Rol</FieldLabel>
          <FieldContent>
            <Select :model-value="item.role ?? 'gallery'" @update:model-value="emit('update', index, { role: $event as ContentMediaRole })">
              <SelectTrigger class="h-9 w-full border-(--app-line) bg-(--app-surface)">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="role in roles" :key="role" :value="role">
                  {{ roleLabels[role] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel :for="`content-media-order-${index}`">Orden</FieldLabel>
          <FieldContent>
            <Input
              :id="`content-media-order-${index}`"
              type="number"
              :model-value="item.order ?? index"
              @update:model-value="emit('update', index, { order: Number($event) })"
            />
          </FieldContent>
        </Field>

        <div class="flex items-end">
          <Button type="button" variant="outline" size="icon" class="h-9 w-9 text-destructive" @click="emit('remove', index)">
            <Trash2 :size="14" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

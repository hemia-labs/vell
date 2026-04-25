<script setup lang="ts" generic="TRow extends object">
import { computed } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

export type VDataTableKey = string | number

export interface VDataTableColumn {
  key: string
  label?: string
  class?: string
  headClass?: string
  cellClass?: string
}

const props = withDefaults(
  defineProps<{
    rows: TRow[]
    columns: VDataTableColumn[]
    rowKey?: string | ((row: TRow, index: number) => VDataTableKey)
    selectedKeys?: VDataTableKey[]
    selectable?: boolean
    actions?: boolean
    pagination?: boolean
    page?: number
    itemsPerPage?: number
    totalItems?: number
    siblingCount?: number
    showEdges?: boolean
    minWidthClass?: string
    emptyMessage?: string
    perPageLabel?: string
    selectAllLabel?: string
    rowSelectLabel?: (row: TRow, index: number) => string
    rowClass?: string | ((row: TRow, index: number) => string)
  }>(),
  {
    rowKey: 'id',
    selectedKeys: () => [],
    selectable: false,
    actions: false,
    pagination: false,
    page: 1,
    itemsPerPage: 10,
    siblingCount: 1,
    showEdges: true,
    minWidthClass: 'min-w-[940px]',
    emptyMessage: 'No hay registros para mostrar.',
    perPageLabel: 'por página',
    selectAllLabel: 'Seleccionar todos los registros visibles'
  }
)

const emit = defineEmits<{
  'update:selectedKeys': [keys: VDataTableKey[]]
  'update:page': [page: number]
  'row-click': [row: TRow, index: number]
}>()

const visibleColumnCount = computed(() => props.columns.length + (props.selectable ? 1 : 0) + (props.actions ? 1 : 0))
const paginationTotal = computed(() => Math.max(props.totalItems ?? props.rows.length, props.rows.length))
const paginationStart = computed(() => (props.rows.length > 0 ? (props.page - 1) * props.itemsPerPage + 1 : 0))
const paginationEnd = computed(() => Math.min(paginationStart.value + props.rows.length - 1, paginationTotal.value))
const currentPage = computed({
  get: () => props.page,
  set: (page) => emit('update:page', page)
})

const allRowsSelected = computed({
  get: () => props.rows.length > 0 && props.rows.every((row, index) => props.selectedKeys.includes(getRowKey(row, index))),
  set: (checked) => {
    const rowKeys = props.rows.map((row, index) => getRowKey(row, index))

    emit(
      'update:selectedKeys',
      checked
        ? Array.from(new Set([...props.selectedKeys, ...rowKeys]))
        : props.selectedKeys.filter((key) => !rowKeys.includes(key))
    )
  }
})

function getRowKey(row: TRow, index: number) {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row, index)
  }

  return (row as Record<string, unknown>)[props.rowKey] as VDataTableKey
}

function getCellValue(row: TRow, key: string) {
  return (row as Record<string, unknown>)[key]
}

function isRowSelected(row: TRow, index: number) {
  return props.selectedKeys.includes(getRowKey(row, index))
}

function toggleRow(row: TRow, index: number, checked: boolean) {
  const key = getRowKey(row, index)
  const nextKeys = checked
    ? Array.from(new Set([...props.selectedKeys, key]))
    : props.selectedKeys.filter((selectedKey) => selectedKey !== key)

  emit('update:selectedKeys', nextKeys)
}

function resolveRowClass(row: TRow, index: number) {
  return typeof props.rowClass === 'function' ? props.rowClass(row, index) : props.rowClass
}
</script>

<template>
  <Table :class="minWidthClass">
    <TableHeader>
      <TableRow class="h-10 bg-(--app-surface-2) [&>th]:text-[10.5px] [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-[0.06em] [&>th]:text-(--app-muted)">
        <TableHead v-if="selectable" class="w-11">
          <Checkbox v-model:checked="allRowsSelected" :aria-label="selectAllLabel" />
        </TableHead>

        <TableHead
          v-for="column in columns"
          :key="column.key"
          :class="[column.class, column.headClass]"
        >
          <slot :name="`header-${column.key}`" :column="column">
            {{ column.label }}
          </slot>
        </TableHead>

        <TableHead v-if="actions" class="w-18 min-w-18 max-w-18 px-2 text-center">
          <slot name="actions-header" />
        </TableHead>
      </TableRow>
    </TableHeader>

    <TableBody>
      <TableRow
        v-for="(row, rowIndex) in rows"
        :key="getRowKey(row, rowIndex)"
        class="h-15.5 cursor-pointer border-(--app-line-2) hover:bg-(--app-surface-2) data-[state=selected]:bg-[color-mix(in_oklab,var(--app-accent)_40%,var(--app-surface))]"
        :class="resolveRowClass(row, rowIndex)"
        :data-state="isRowSelected(row, rowIndex) ? 'selected' : undefined"
        @click="emit('row-click', row, rowIndex)"
      >
        <TableCell v-if="selectable" class="w-11">
          <Checkbox
            :checked="isRowSelected(row, rowIndex)"
            :aria-label="rowSelectLabel?.(row, rowIndex)"
            @click.stop
            @update:checked="toggleRow(row, rowIndex, Boolean($event))"
          />
        </TableCell>

        <TableCell
          v-for="column in columns"
          :key="column.key"
          :class="[column.class, column.cellClass]"
        >
          <slot
            :name="`cell-${column.key}`"
            :row="row"
            :column="column"
            :value="getCellValue(row, column.key)"
            :index="rowIndex"
          >
            {{ getCellValue(row, column.key) }}
          </slot>
        </TableCell>

        <TableCell v-if="actions" class="w-18 min-w-18 max-w-18 px-2 text-center">
          <slot name="actions" :row="row" :index="rowIndex" />
        </TableCell>
      </TableRow>

      <TableRow v-if="rows.length === 0">
        <TableCell :colspan="visibleColumnCount" class="h-30 text-center text-(--app-muted)">
          <slot name="empty">
            {{ emptyMessage }}
          </slot>
        </TableCell>
      </TableRow>
    </TableBody>

    <TableFooter v-if="$slots.footer || pagination">
      <slot name="footer" :column-count="visibleColumnCount">
        <TableRow v-if="pagination" class="bg-(--app-surface-2) text-[12.5px] text-(--app-muted)">
          <TableCell :colspan="visibleColumnCount" class="[&_strong]:font-semibold [&_strong]:text-(--app-ink)">
            <div class="flex min-h-10 items-center justify-between gap-4.5 max-[760px]:flex-col max-[760px]:items-stretch">
              <p class="m-0">
                <slot
                  name="pagination-summary"
                  :rows="rows"
                  :start="paginationStart"
                  :end="paginationEnd"
                  :total-items="paginationTotal"
                >
                  Mostrando <strong>{{ paginationStart }}-{{ paginationEnd }}</strong> de <strong>{{ paginationTotal }}</strong>
                </slot>
              </p>

              <div class="flex items-center justify-end gap-4.5 max-[760px]:justify-between">
                <p class="m-0 shrink-0">{{ itemsPerPage }} {{ perPageLabel }}</p>
                <Pagination
                  v-model:page="currentPage"
                  :items-per-page="itemsPerPage"
                  :total="paginationTotal"
                  :sibling-count="siblingCount"
                  :show-edges="showEdges"
                  class="mx-0 w-auto justify-end"
                >
                  <PaginationContent v-slot="{ items }">
                    <PaginationPrevious size="icon-sm" aria-label="Página anterior">
                      ‹
                    </PaginationPrevious>
                    <template v-for="(item, index) in items" :key="index">
                      <PaginationItem
                        v-if="item.type === 'page'"
                        :value="item.value"
                        size="icon-sm"
                        :is-active="item.value === currentPage"
                        class="text-xs"
                      >
                        {{ item.value }}
                      </PaginationItem>
                      <PaginationEllipsis v-else :index="index" />
                    </template>
                    <PaginationNext size="icon-sm" aria-label="Página siguiente">
                      ›
                    </PaginationNext>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </TableCell>
        </TableRow>
      </slot>
    </TableFooter>
  </Table>
</template>

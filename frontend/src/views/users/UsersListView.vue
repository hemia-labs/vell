<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ChevronDown,
  Download,
  Filter,
  MoreHorizontal,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger
} from '@/components/ui/menubar'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type UserStatus = 'Activo' | 'Invitado' | 'Suspendido'
type UserPresence = 'online' | 'away' | 'offline' | 'pending'
type UserRole = 'Owner' | 'Admin' | 'Editor' | 'Developer' | 'Author' | 'Translator' | 'Viewer'

interface TeamUser {
  id: number
  name: string
  email: string
  initials: string
  role: UserRole
  scope: string
  scopeMeta?: string
  status: UserStatus
  lastSeen: string
  lastSeenMeta: string
  has2fa: boolean
  presence: UserPresence
  avatarClass: string
}

const search = ref('')
const selectedIds = ref<number[]>([1])
const selectedRoles = ref<UserRole[]>(['Owner', 'Admin'])
const selectedStatuses = ref<UserStatus[]>([])
const selectedGroups = ref<string[]>([])
const only2fa = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10

const users: TeamUser[] = [
  {
    id: 1,
    name: 'Lucía Ramírez',
    email: 'lucia@vell.dev',
    initials: 'LR',
    role: 'Owner',
    scope: 'Todo el espacio',
    status: 'Activo',
    lastSeen: 'En línea',
    lastSeenMeta: 'ahora',
    has2fa: true,
    presence: 'online',
    avatarClass: 'avatar-warm'
  },
  {
    id: 2,
    name: 'Mateo Cordero',
    email: 'mateo@vell.dev',
    initials: 'MC',
    role: 'Admin',
    scope: 'Todo el espacio',
    status: 'Activo',
    lastSeen: 'En línea',
    lastSeenMeta: 'hace 4 min',
    has2fa: true,
    presence: 'online',
    avatarClass: 'avatar-blue'
  },
  {
    id: 3,
    name: 'Sofía Araya',
    email: 'sofia@vell.dev',
    initials: 'SA',
    role: 'Editor',
    scope: 'Article, Landing',
    scopeMeta: '+1',
    status: 'Activo',
    lastSeen: 'Hoy',
    lastSeenMeta: '14:22',
    has2fa: true,
    presence: 'away',
    avatarClass: 'avatar-sand'
  },
  {
    id: 4,
    name: 'Javier Kwon',
    email: 'javier@vell.dev',
    initials: 'JK',
    role: 'Developer',
    scope: 'API + Modelos',
    status: 'Activo',
    lastSeen: 'Ayer',
    lastSeenMeta: '18:40',
    has2fa: true,
    presence: 'offline',
    avatarClass: 'avatar-graphite'
  },
  {
    id: 5,
    name: 'Inés Navarro',
    email: 'ines@vell.dev',
    initials: 'IN',
    role: 'Author',
    scope: 'Article',
    scopeMeta: 'ES · PT',
    status: 'Activo',
    lastSeen: 'Ayer',
    lastSeenMeta: '09:32',
    has2fa: false,
    presence: 'offline',
    avatarClass: 'avatar-gold'
  },
  {
    id: 6,
    name: 'Rafael Borges',
    email: 'rafael@vell.dev',
    initials: 'RB',
    role: 'Translator',
    scope: 'Locale PT-BR',
    status: 'Activo',
    lastSeen: 'Ayer',
    lastSeenMeta: '11:05',
    has2fa: true,
    presence: 'offline',
    avatarClass: 'avatar-moss'
  },
  {
    id: 7,
    name: 'Camila Prado',
    email: 'camila@vell.dev',
    initials: 'CP',
    role: 'Author',
    scope: 'Product',
    scopeMeta: 'ES',
    status: 'Activo',
    lastSeen: 'Hace 2 d',
    lastSeenMeta: '16:12',
    has2fa: false,
    presence: 'offline',
    avatarClass: 'avatar-brown'
  },
  {
    id: 8,
    name: 'Emilio Méndez',
    email: 'emilio@vell.dev',
    initials: 'EM',
    role: 'Viewer',
    scope: 'Solo lectura',
    status: 'Activo',
    lastSeen: 'Hace 3 d',
    lastSeenMeta: '10:40',
    has2fa: false,
    presence: 'offline',
    avatarClass: 'avatar-earth'
  },
  {
    id: 9,
    name: 'Diego Mora',
    email: 'diego@vell.dev',
    initials: 'DM',
    role: 'Editor',
    scope: 'Article',
    status: 'Invitado',
    lastSeen: 'Enviada',
    lastSeenMeta: 'hace 1 d',
    has2fa: false,
    presence: 'pending',
    avatarClass: 'avatar-pending'
  },
  {
    id: 10,
    name: 'Ana Herrera',
    email: 'ana@vell.dev',
    initials: 'AH',
    role: 'Viewer',
    scope: 'Analíticas',
    status: 'Suspendido',
    lastSeen: 'Hace 14 d',
    lastSeenMeta: '-',
    has2fa: false,
    presence: 'offline',
    avatarClass: 'avatar-slate'
  }
]

const roles: UserRole[] = ['Owner', 'Admin', 'Editor', 'Developer', 'Author', 'Translator', 'Viewer']
const statuses: UserStatus[] = ['Activo', 'Invitado', 'Suspendido']
const groups = ['Todo el espacio', 'Article', 'Product', 'API + Modelos', 'Analíticas']

const normalizedSearch = computed(() => search.value.trim().toLowerCase())
const activeFilterCount = computed(
  () => selectedRoles.value.length + selectedStatuses.value.length + selectedGroups.value.length + (only2fa.value ? 1 : 0)
)
const paginationTotal = computed(() => Math.max(users.length, filteredUsers.value.length))

const filteredUsers = computed(() => {
  return users.filter((user) => {
    const matchesSearch =
      !normalizedSearch.value ||
      user.name.toLowerCase().includes(normalizedSearch.value) ||
      user.email.toLowerCase().includes(normalizedSearch.value)
    const matchesRole = selectedRoles.value.length === 0 || selectedRoles.value.includes(user.role)
    const matchesStatus = selectedStatuses.value.length === 0 || selectedStatuses.value.includes(user.status)
    const matchesGroup = selectedGroups.value.length === 0 || selectedGroups.value.some((group) => user.scope.includes(group))
    const matches2fa = !only2fa.value || user.has2fa

    return matchesSearch && matchesRole && matchesStatus && matchesGroup && matches2fa
  })
})

const allFilteredSelected = computed({
  get: () => filteredUsers.value.length > 0 && filteredUsers.value.every((user) => selectedIds.value.includes(user.id)),
  set: (checked) => {
    const filteredIds = filteredUsers.value.map((user) => user.id)
    selectedIds.value = checked
      ? Array.from(new Set([...selectedIds.value, ...filteredIds]))
      : selectedIds.value.filter((id) => !filteredIds.includes(id))
  }
})

function toggleInArray<T>(collection: T[], value: T) {
  return collection.includes(value) ? collection.filter((item) => item !== value) : [...collection, value]
}

function toggleRole(role: UserRole) {
  selectedRoles.value = toggleInArray(selectedRoles.value, role)
}

function toggleStatus(status: UserStatus) {
  selectedStatuses.value = toggleInArray(selectedStatuses.value, status)
}

function toggleGroup(group: string) {
  selectedGroups.value = toggleInArray(selectedGroups.value, group)
}

function toggleUser(userId: number, checked: boolean) {
  selectedIds.value = checked
    ? Array.from(new Set([...selectedIds.value, userId]))
    : selectedIds.value.filter((id) => id !== userId)
}

function clearFilters() {
  search.value = ''
  selectedRoles.value = []
  selectedStatuses.value = []
  selectedGroups.value = []
  only2fa.value = false
}
</script>

<template>
  <div class="flex w-full flex-col gap-[22px]">
    <Tabs default-value="members" class="gap-0 border-b border-[var(--app-line)]">
      <TabsList class="h-auto w-fit rounded-none bg-transparent p-0 text-[var(--app-muted)]">
        <TabsTrigger
          value="members"
          class="h-[42px] rounded-none border-0 border-b-2 border-transparent bg-transparent px-3.5 text-[13px] shadow-none data-[state=active]:border-[var(--app-ink)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--app-ink)] data-[state=active]:shadow-none"
        >
          Miembros
          <span class="rounded-full border border-[var(--app-line)] bg-[var(--app-surface-2)] px-1.5 py-px text-[10.5px] text-[var(--app-muted)]">
            {{ users.length }}
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="audit"
          class="h-[42px] rounded-none border-0 border-b-2 border-transparent bg-transparent px-3.5 text-[13px] shadow-none data-[state=active]:border-[var(--app-ink)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--app-ink)] data-[state=active]:shadow-none"
        >
          Auditoría
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <section class="flex items-start justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch">
      <div>
        <div class="mb-1 text-3xl font-semibold leading-tight tracking-[-0.02em] text-[var(--app-ink)]">
          Usuarios
        </div>
        <p class="m-0 max-w-2xl text-[13.5px] text-[var(--app-muted)]">
          Administra los usuarios del sistema, su acceso, estado y actividad.
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2 max-[760px]:flex-wrap">
        <Button variant="outline" size="sm">
          <Download :size="14" />
          Exportar
        </Button>
        <Button size="sm">
          <UserPlus :size="14" />
          Nuevo usuario
        </Button>
      </div>
    </section>

    <section class="flex flex-wrap items-center gap-2" aria-label="Filtros de usuarios">
      <Field class="min-w-[min(100%,280px)] flex-[1_1_320px]">
        <FieldLabel class="sr-only" for="users-search">Buscar usuarios</FieldLabel>
        <FieldContent class="relative text-[var(--app-muted)]">
          <Search class="absolute left-3 top-1/2 z-[1] -translate-y-1/2" :size="14" />
          <Input
            id="users-search"
            v-model="search"
            class="h-[34px] border-[var(--app-line)] bg-[var(--app-surface)] pl-[34px] text-[13px] text-[var(--app-ink)]"
            placeholder="Buscar por nombre o correo..."
          />
        </FieldContent>
      </Field>

      <Menubar class="h-[34px] border-[var(--app-line)] bg-[var(--app-surface)] p-0.5 max-[760px]:w-full max-[760px]:justify-start max-[760px]:overflow-x-auto">
        <MenubarMenu>
          <MenubarTrigger class="h-7 gap-1.5 text-[12.5px] text-[var(--app-ink-2)]" :class="{ 'text-[var(--app-ink)]': selectedRoles.length }">
            <span>Rol</span>
            <b v-if="selectedRoles.length" class="rounded-full bg-[var(--app-ink)] px-1.5 py-px text-[10.5px] font-medium text-[var(--app-bg)]">{{ selectedRoles.length }}</b>
            <ChevronDown :size="12" />
          </MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem
              v-for="role in roles"
              :key="role"
              :checked="selectedRoles.includes(role)"
              @select.prevent="toggleRole(role)"
            >
              {{ role }}
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger class="h-7 gap-1.5 text-[12.5px] text-[var(--app-ink-2)]" :class="{ 'text-[var(--app-ink)]': selectedStatuses.length }">
            <span>Estado</span>
            <b v-if="selectedStatuses.length" class="rounded-full bg-[var(--app-ink)] px-1.5 py-px text-[10.5px] font-medium text-[var(--app-bg)]">{{ selectedStatuses.length }}</b>
            <ChevronDown :size="12" />
          </MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem
              v-for="status in statuses"
              :key="status"
              :checked="selectedStatuses.includes(status)"
              @select.prevent="toggleStatus(status)"
            >
              {{ status }}
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger class="h-7 gap-1.5 text-[12.5px] text-[var(--app-ink-2)]" :class="{ 'text-[var(--app-ink)]': selectedGroups.length }">
            <span>Grupo</span>
            <b v-if="selectedGroups.length" class="rounded-full bg-[var(--app-ink)] px-1.5 py-px text-[10.5px] font-medium text-[var(--app-bg)]">{{ selectedGroups.length }}</b>
            <ChevronDown :size="12" />
          </MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem
              v-for="group in groups"
              :key="group"
              :checked="selectedGroups.includes(group)"
              @select.prevent="toggleGroup(group)"
            >
              {{ group }}
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger class="h-7 gap-1.5 text-[12.5px] text-[var(--app-ink-2)]" :class="{ 'text-[var(--app-ink)]': only2fa }">
            <span>2FA</span>
            <ChevronDown :size="12" />
          </MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem :checked="only2fa" @select.prevent="only2fa = !only2fa">
              Solo con 2FA activo
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarCheckboxItem checked disabled>
              Mostrar indicador en tabla
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      <Button variant="outline" size="sm" class="h-[34px]">
        <SlidersHorizontal :size="14" />
        Columnas
      </Button>

      <Button v-if="activeFilterCount || search" variant="ghost" size="sm" class="h-[34px]" @click="clearFilters">
        <RotateCcw :size="14" />
        Limpiar
      </Button>
    </section>

    <section class="overflow-hidden rounded-[var(--app-radius-lg)] border border-[var(--app-line)] bg-[var(--app-surface)] shadow-[var(--app-shadow)]" aria-label="Lista de usuarios">
      <div class="flex min-h-[46px] items-center justify-between gap-4 border-b border-[var(--app-line)] bg-[var(--app-surface-2)] px-3.5 py-2 text-[12.5px] text-[var(--app-muted)] max-[760px]:flex-col max-[760px]:items-stretch">
        <div class="inline-flex items-center gap-[7px] font-medium text-[var(--app-ink-2)]">
          <ShieldCheck :size="15" />
          <span>{{ selectedIds.length }} seleccionados</span>
        </div>
        <div class="flex items-center gap-1.5 max-[760px]:flex-wrap">
          <Button variant="outline" size="sm">Cambiar rol</Button>
          <Button variant="outline" size="sm">Suspender</Button>
          <Button variant="ghost" size="icon-sm" aria-label="Más acciones">
            <MoreHorizontal :size="15" />
          </Button>
        </div>
      </div>

      <Table class="min-w-[940px]">
        <TableHeader>
          <TableRow class="h-10 bg-[var(--app-surface-2)] [&>th]:text-[10.5px] [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-[0.06em] [&>th]:text-[var(--app-muted)]">
            <TableHead class="w-11">
              <Checkbox v-model:checked="allFilteredSelected" aria-label="Seleccionar todos los usuarios visibles" />
            </TableHead>
            <TableHead>Miembro</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Alcance</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Última act.</TableHead>
            <TableHead class="w-[54px] text-right"></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <TableRow
            v-for="user in filteredUsers"
            :key="user.id"
            class="h-[62px] cursor-pointer border-[var(--app-line-2)] hover:bg-[var(--app-surface-2)] data-[state=selected]:bg-[color-mix(in_oklab,var(--app-accent)_40%,var(--app-surface))]"
            :data-state="selectedIds.includes(user.id) ? 'selected' : undefined"
          >
            <TableCell class="w-11">
              <Checkbox
                :checked="selectedIds.includes(user.id)"
                :aria-label="`Seleccionar a ${user.name}`"
                @update:checked="toggleUser(user.id, Boolean($event))"
              />
            </TableCell>
            <TableCell>
              <div class="flex min-w-[260px] items-center gap-[11px]">
                <span class="user-avatar" :class="[user.avatarClass, `presence-${user.presence}`]">{{ user.initials }}</span>
                <span class="flex min-w-0 flex-col">
                  <span class="overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[var(--app-ink)]">
                    {{ user.name }}
                    <span v-if="user.has2fa" class="twofa">2FA</span>
                  </span>
                  <span class="overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] text-[var(--app-muted)]">{{ user.email }}</span>
                </span>
              </div>
            </TableCell>
            <TableCell>
              <span class="role-chip" :class="`role-${user.role.toLowerCase()}`">
                <i></i>{{ user.role }}
              </span>
            </TableCell>
            <TableCell>
              <span class="scope-pill">
                {{ user.scope }}
                <span v-if="user.scopeMeta">{{ user.scopeMeta }}</span>
              </span>
            </TableCell>
            <TableCell>
              <span class="status-pill" :class="`status-${user.status.toLowerCase()}`">{{ user.status }}</span>
            </TableCell>
            <TableCell>
              <span class="flex min-w-0 flex-col text-xs text-[var(--app-ink-2)]">
                {{ user.lastSeen }}
                <small class="text-[11px] text-[var(--app-muted)]">{{ user.lastSeenMeta }}</small>
              </span>
            </TableCell>
            <TableCell class="w-[54px] text-right">
              <Button variant="ghost" size="icon-sm" :aria-label="`Acciones para ${user.name}`">
                <MoreHorizontal :size="15" />
              </Button>
            </TableCell>
          </TableRow>

          <TableRow v-if="filteredUsers.length === 0">
            <TableCell colspan="7" class="h-[120px] text-center text-[var(--app-muted)]">
              <Filter class="mx-auto mb-2" :size="18" />
              No hay usuarios que coincidan con los filtros.
            </TableCell>
          </TableRow>
        </TableBody>

        <TableFooter>
          <TableRow class="bg-[var(--app-surface-2)] text-[12.5px] text-[var(--app-muted)]">
            <TableCell colspan="3" class="[&_strong]:font-semibold [&_strong]:text-[var(--app-ink)]">
              Mostrando <strong>1-{{ filteredUsers.length }}</strong> de <strong>{{ users.length }}</strong>
            </TableCell>
            <TableCell colspan="4" class="flex items-center justify-end gap-[18px] max-[760px]:flex-col max-[760px]:items-stretch">
              <span>10 por página</span>
              <Pagination
                v-model:page="currentPage"
                :items-per-page="itemsPerPage"
                :total="paginationTotal"
                :sibling-count="1"
                show-edges
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
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </section>
  </div>
</template>

<style scoped>
.user-avatar {
  position: relative;
  display: grid;
  width: 34px;
  height: 34px;
  flex: none;
  place-items: center;
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
  font-weight: 650;
}

.user-avatar::after {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 10px;
  height: 10px;
  border: 2px solid var(--app-surface);
  border-radius: 999px;
  background: #3ba55c;
  content: '';
}

.presence-away::after {
  background: #d4b055;
}

.presence-offline::after {
  background: var(--app-muted-2);
}

.presence-pending::after {
  background: var(--app-accent-ink);
  opacity: 0.55;
}

.avatar-warm { background: linear-gradient(135deg, #c9bfa7, #7a6f5a); }
.avatar-blue { background: linear-gradient(135deg, #7a8da3, #3e5368); }
.avatar-sand { background: linear-gradient(135deg, #d6cfc2, #9a8b6b); }
.avatar-graphite { background: linear-gradient(135deg, #3e4650, #1f252e); }
.avatar-gold { background: linear-gradient(135deg, #b8a47a, #6f5e3a); }
.avatar-moss { background: linear-gradient(135deg, #a89b82, #635742); }
.avatar-brown { background: linear-gradient(135deg, #7a6f5a, #403828); }
.avatar-earth { background: linear-gradient(135deg, #9a8b6b, #4b4130); }
.avatar-pending {
  background: linear-gradient(135deg, #e7e3d9, #b8a47a);
  color: #5a5142;
}
.avatar-slate { background: linear-gradient(135deg, #6a6e78, #2b2e36); }

.twofa {
  display: inline-flex;
  margin-left: 6px;
  border-radius: 3px;
  background: #e8f2ec;
  color: #1f7a4c;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 1px 5px;
  vertical-align: 1px;
}

.role-chip,
.scope-pill,
.status-pill {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  white-space: nowrap;
}

.role-chip {
  gap: 6px;
  border: 1px solid var(--app-line);
  border-radius: 999px;
  background: var(--app-surface-2);
  color: var(--app-ink);
  font-size: 11.5px;
  font-weight: 550;
  padding: 3px 9px;
}

.role-chip i {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--app-muted-2);
}

.role-owner {
  border-color: var(--app-ink);
  background: var(--app-ink);
  color: var(--app-bg);
}

.role-owner i { background: var(--app-accent); }
.role-admin i { background: #8b2f2f; }
.role-editor i { background: #2b4b6b; }
.role-developer i { background: #3e4650; }
.role-author i { background: #9a8b6b; }
.role-translator i { background: #7a8da3; }
.role-viewer i { background: var(--app-muted-2); }

.scope-pill {
  gap: 6px;
  color: var(--app-ink-2);
  font-size: 12px;
}

.scope-pill span {
  border: 1px solid var(--app-line);
  border-radius: 999px;
  background: var(--app-bg);
  color: var(--app-muted);
  font-size: 10.5px;
  padding: 0 6px;
}

.status-pill {
  gap: 5px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  text-transform: uppercase;
}

.status-pill::before {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: currentColor;
  content: '';
}

.status-activo {
  background: #e8f2ec;
  color: #1f7a4c;
}

.status-invitado {
  background: #f6efdd;
  color: #8a6a1e;
}

.status-suspendido {
  background: #f4e5e5;
  color: #8b2f2f;
}
</style>

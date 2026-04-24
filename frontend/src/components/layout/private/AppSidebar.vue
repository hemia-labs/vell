<script setup lang="ts">
import {
  ChevronDown,
  ClipboardList,
  File,
  FileText,
  FolderTree,
  Images,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Settings,
  Tags,
  Tag,
  Users
} from 'lucide-vue-next'
import { computed } from 'vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator
} from '@/components/ui/sidebar'
import { useLogin } from '@/composables/auth/useLogin'
import { useDarkMode } from '@/composables/theme/useDarkMode'
import { useAuthStore } from '@/stores'
import { RouterLink } from 'vue-router'
import packageJson from '../../../../package.json'

const { isDarkMode } = useDarkMode()
const { logout } = useLogin()
const authStore = useAuthStore()
const appVersion = packageJson.version

const currentUserName = computed(() => authStore.currentUser?.user.name ?? 'Cristian Méndez')
const currentUserEmail = computed(() => authStore.currentUser?.user.email ?? 'admin@vell.dev')
const currentUserInitials = computed(() => {
  return currentUserName.value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
})

const sidebarStyle = computed(() => {
  if (!isDarkMode.value) {
    return undefined
  }

  return {
    '--sidebar': 'oklch(0.141 0.005 285.823)',
    '--sidebar-foreground': 'oklch(0.985 0 0)',
    '--sidebar-accent': 'oklch(0.274 0.006 286.033)',
    '--sidebar-accent-foreground': 'oklch(0.985 0 0)',
    '--sidebar-border': 'oklch(1 0 0 / 12%)',
    '--sidebar-primary': 'oklch(0.92 0.004 286.32)',
    '--sidebar-primary-foreground': 'oklch(0.21 0.006 285.885)',
    '--app-sidebar-bg': 'oklch(0.141 0.005 285.823)',
    '--app-sidebar-surface': 'oklch(0.21 0.006 285.885)',
    '--app-sidebar-surface-hover': 'oklch(0.274 0.006 286.033)',
    '--app-sidebar-ink': 'oklch(0.985 0 0)',
    '--app-sidebar-ink-muted': 'oklch(0.9 0.004 286)',
    '--app-sidebar-muted': 'oklch(0.705 0.015 286.067)',
    '--app-sidebar-muted-soft': 'oklch(0.58 0.014 286)',
    '--app-sidebar-line': 'oklch(1 0 0 / 12%)',
    '--app-sidebar-primary-bg': 'oklch(0.92 0.004 286.32)',
    '--app-sidebar-primary-fg': 'oklch(0.21 0.006 285.885)',
    '--app-sidebar-active-shadow': 'inset -1px 0 0 oklch(1 0 0 / 10%), 0 1px 2px oklch(0 0 0 / 22%)',
    boxShadow: '1px 0 0 oklch(1 0 0 / 12%), 12px 0 28px oklch(0 0 0 / 22%)'
  }
})

const homeNavigation = { label: 'Inicio', icon: LayoutDashboard, to: { name: 'home' } }
const navItemClass = 'nav-item text-sidebar-accent-foreground'

const navigationGroups = [
  {
    label: 'Contenido',
    items: [
      { label: 'Contenidos', icon: FileText, to: '/content' },
      { label: 'Páginas', icon: File, to: '/pages' },
      { label: 'Tipos de Contenido', icon: FolderTree, to: '/content-types' }
    ]
  },
  {
    label: 'Organización',
    items: [
      { label: 'Categorías', icon: Tags, to: '/categories' },
      { label: 'Etiquetas', icon: Tag, to: '/tags' }
    ]
  },
  {
    label: 'Assets',
    items: [
      { label: 'Media Library', icon: Images, to: '/media' }
    ]
  },
  {
    label: 'Administración',
    items: [
      { label: 'Usuarios', icon: Users, to: { name: 'users' } },
      { label: 'Roles y Permisos', icon: ShieldCheck, to: '/roles-and-permissions' },
      { label: 'Audit Log', icon: ClipboardList, to: '/audit-log' },
      { label: 'Ajustes', icon: Settings, to: '/settings' }
    ]
  }
]
</script>

<template>
  <Sidebar
    collapsible="icon"
    class="app-sidebar"
    :class="{ 'app-sidebar--dark': isDarkMode }"
    :style="sidebarStyle"
  >
    <SidebarHeader class="app-sidebar__header">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" class="workspace" tooltip="Vell CMS">
            <span class="workspace__logo">V</span>
            <span class="workspace__meta">
              <span class="workspace__name">Vell CMS</span>
              <span class="workspace__sub">Panel de administración</span>
            </span>
            <ChevronDown class="workspace__chevron" :size="12" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent class="app-sidebar__content">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <RouterLink v-slot="{ href, navigate, isActive }" :to="homeNavigation.to" custom>
              <SidebarMenuItem>
                <SidebarMenuButton
                  as="a"
                  :href="href"
                  :is-active="isActive"
                  :tooltip="homeNavigation.label"
                  :class="navItemClass"
                  @click="navigate"
                >
                  <component :is="homeNavigation.icon" />
                  <span>{{ homeNavigation.label }}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </RouterLink>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup v-for="group in navigationGroups" :key="group.label">
        <SidebarGroupLabel class="section-label">{{ group.label }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <RouterLink
              v-for="item in group.items"
              :key="item.label"
              v-slot="{ href, navigate, isActive }"
              :to="item.to"
              custom
            >
              <SidebarMenuItem>
                <SidebarMenuButton
                  as="a"
                  :href="href"
                  :is-active="isActive"
                  :tooltip="item.label"
                  :class="navItemClass"
                  @click="navigate"
                >
                  <component :is="item.icon" />
                  <span>{{ item.label }}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </RouterLink>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="app-sidebar__footer">
      <SidebarSeparator />

      <SidebarMenu>
        <SidebarMenuItem>
          <div class="user-row">
            <span class="avatar">{{ currentUserInitials }}</span>
            <span class="user-row__meta">
              <span class="user-row__name">{{ currentUserName }}</span>
              <span class="user-row__email">{{ currentUserEmail }}</span>
              <span class="version-row">v{{ appVersion }}</span>
            </span>
            <button class="logout-btn" type="button" aria-label="Cerrar sesión" title="Cerrar sesión" @click="logout">
              <LogOut :size="14" />
            </button>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>

<style scoped>
.app-sidebar {
  --sidebar-accent: #fff;
  --sidebar-accent-foreground: var(--app-ink);
  --app-sidebar-bg: var(--app-bg);
  --app-sidebar-surface: var(--app-surface);
  --app-sidebar-surface-hover: #fff;
  --app-sidebar-ink: var(--app-ink);
  --app-sidebar-ink-muted: var(--app-ink-2);
  --app-sidebar-muted: var(--app-muted);
  --app-sidebar-muted-soft: var(--app-muted-2);
  --app-sidebar-line: var(--app-line);
  --app-sidebar-primary-bg: var(--app-ink);
  --app-sidebar-primary-fg: var(--app-surface);
  --app-sidebar-active-shadow: var(--app-shadow);

  border-color: var(--app-sidebar-line);
}

.app-sidebar--dark {
  --sidebar: oklch(0.141 0.005 285.823);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 12%);
  --sidebar-primary: oklch(0.92 0.004 286.32);
  --sidebar-primary-foreground: oklch(0.21 0.006 285.885);

  --app-sidebar-bg: oklch(0.141 0.005 285.823);
  --app-sidebar-surface: oklch(0.21 0.006 285.885);
  --app-sidebar-surface-hover: oklch(0.274 0.006 286.033);
  --app-sidebar-ink: oklch(0.985 0 0);
  --app-sidebar-ink-muted: oklch(0.9 0.004 286);
  --app-sidebar-muted: oklch(0.705 0.015 286.067);
  --app-sidebar-muted-soft: oklch(0.58 0.014 286);
  --app-sidebar-line: oklch(1 0 0 / 12%);
  --app-sidebar-primary-bg: oklch(0.92 0.004 286.32);
  --app-sidebar-primary-fg: oklch(0.21 0.006 285.885);
  --app-sidebar-active-shadow: inset -1px 0 0 oklch(1 0 0 / 10%), 0 1px 2px oklch(0 0 0 / 22%);
}

.app-sidebar :global([data-sidebar='sidebar']) {
  background: var(--app-sidebar-bg);
}

.app-sidebar--dark {
  box-shadow: 1px 0 0 var(--app-sidebar-line), 12px 0 28px oklch(0 0 0 / 22%);
}

.app-sidebar__header {
  gap: 8px;
  padding: 14px 12px 8px;
}

.app-sidebar__content {
  gap: 8px;
  padding: 0 6px;
}

.app-sidebar__footer {
  gap: 8px;
  padding: 0 12px 12px;
}

.version-row {
  color: var(--app-sidebar-muted-soft);
  font-family: 'Geist Mono', ui-monospace, monospace;
  font-size: 10px;
  line-height: 1.2;
  opacity: 0.56;
}

.section-label {
  gap: 8px;
  color: var(--app-sidebar-muted-soft);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-label::after {
  display: block;
  height: 1px;
  min-width: 16px;
  flex: 1;
  background: var(--app-sidebar-line);
  content: '';
}

.workspace,
.env-switch,
.user-row,
.nav-item {
  border-radius: var(--app-radius-sm);
  color: var(--app-sidebar-ink-muted);
}

.workspace {
  height: 42px;
  gap: 10px;
}

.workspace__logo {
  display: grid;
  width: 26px;
  height: 26px;
  flex: none;
  place-items: center;
  border-radius: 7px;
  background: var(--app-sidebar-primary-bg);
  color: var(--app-sidebar-primary-fg);
  font-size: 13px;
  font-weight: 600;
}

.workspace__meta,
.user-row__meta {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  line-height: 1.15;
}

.workspace__name {
  color: var(--app-sidebar-ink);
  font-size: 13px;
  font-weight: 600;
}

.workspace__sub,
.user-row__email {
  overflow: hidden;
  color: var(--app-sidebar-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace__chevron {
  margin-left: auto;
  color: var(--app-sidebar-muted-soft);
}

.nav-item {
  height: 32px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 13px;
  font-weight: 450;
}

.app-sidebar:not(.app-sidebar--dark) .nav-item {
  border-color: var(--app-sidebar-line);
  background: transparent;
}

.nav-item[data-active='true'] {
  border: 1px solid var(--app-sidebar-line);
  background: var(--app-sidebar-surface);
  box-shadow: var(--app-sidebar-active-shadow);
  color: var(--app-sidebar-ink);
  font-weight: 550;
}

:global(.app-sidebar .nav-item:hover) {
  border-color: var(--app-sidebar-line) !important;
  background: var(--app-sidebar-surface-hover) !important;
  color: var(--app-sidebar-ink) !important;
}

:global(.app-sidebar:not(.app-sidebar--dark) [data-sidebar='menu-button']:hover) {
  border-color: var(--app-sidebar-line) !important;
  background: #fff !important;
  box-shadow: var(--app-sidebar-active-shadow) !important;
  color: var(--app-sidebar-ink) !important;
}

:global(.app-sidebar.app-sidebar--dark .nav-item) {
  border-color: var(--app-sidebar-line) !important;
  background: var(--app-sidebar-surface) !important;
  color: var(--app-sidebar-ink-muted) !important;
}

:global(.app-sidebar.app-sidebar--dark .nav-item:hover) {
  background: var(--app-sidebar-surface-hover) !important;
}

:global(.app-sidebar .nav-item[data-active='true']),
:global(.app-sidebar .nav-item[data-active='true']:hover) {
  border-color: var(--app-sidebar-line) !important;
  background: var(--app-sidebar-surface) !important;
  box-shadow: var(--app-sidebar-active-shadow) !important;
  color: var(--app-sidebar-ink) !important;
}

.env-switch,
.user-row {
  gap: 8px;
}

.user-row {
  display: flex;
  min-height: 44px;
  align-items: center;
  padding: 8px;
}

.env-switch__dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 999px;
  background: #3ba55c;
  box-shadow: 0 0 0 3px color-mix(in oklab, #3ba55c 25%, transparent);
}

.env-switch__name {
  font-size: 12.5px;
  font-weight: 500;
}

.env-switch__tag {
  margin-left: auto;
  color: var(--app-sidebar-muted);
  font-family: 'Geist Mono', ui-monospace, monospace;
  font-size: 10px;
}

.avatar {
  display: grid;
  width: 24px;
  height: 24px;
  flex: none;
  place-items: center;
  border-radius: 999px;
  background: linear-gradient(135deg, #c9bfa7, #7a6f5a);
  color: #fff;
  font-size: 10.5px;
  font-weight: 600;
}

.user-row__name {
  color: var(--app-sidebar-ink);
  font-size: 12.5px;
  font-weight: 500;
}

.logout-btn {
  display: grid;
  width: 28px;
  height: 28px;
  flex: none;
  place-items: center;
  border: 1px solid transparent;
  border-radius: var(--app-radius-sm);
  background: transparent;
  color: var(--app-sidebar-muted-soft);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.logout-btn:hover {
  border-color: var(--app-sidebar-line);
  background: var(--app-sidebar-surface);
  color: var(--app-sidebar-ink);
}

:global([data-collapsible='icon']) .workspace__meta,
:global([data-collapsible='icon']) .workspace__chevron,
:global([data-collapsible='icon']) .version-row,
:global([data-collapsible='icon']) .env-switch__name,
:global([data-collapsible='icon']) .env-switch__tag,
:global([data-collapsible='icon']) .user-row__meta {
  display: none;
}
</style>

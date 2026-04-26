import type { App, Directive, DirectiveBinding } from 'vue'
import { can, type PermissionRequirement } from '@/lib/authz'
import { useAuthStore } from '@/stores'

type CanBinding = PermissionRequirement | {
  permission?: PermissionRequirement
  fallback?: 'hide' | 'disable'
}

const originalDisplay = new WeakMap<HTMLElement, string>()

function getBindingOptions(binding: DirectiveBinding<CanBinding>) {
  const value = binding.value

  if (typeof value === 'object' && !Array.isArray(value) && ('permission' in value || 'fallback' in value)) {
    return {
      permission: value.permission,
      fallback: value.fallback ?? (binding.modifiers.disable ? 'disable' : 'hide')
    }
  }

  return {
    permission: value as PermissionRequirement,
    fallback: binding.modifiers.disable ? 'disable' : 'hide'
  }
}

function applyAuthorization(el: HTMLElement, binding: DirectiveBinding<CanBinding>) {
  const authStore = useAuthStore()
  const permissions = authStore.currentUser?.authorization.permissions ?? []
  const { permission, fallback } = getBindingOptions(binding)
  const isAllowed = can(permissions, permission)

  if (!originalDisplay.has(el)) {
    originalDisplay.set(el, el.style.display)
  }

  if (fallback === 'disable') {
    el.toggleAttribute('disabled', !isAllowed)
    el.setAttribute('aria-disabled', String(!isAllowed))
    return
  }

  el.style.display = isAllowed ? originalDisplay.get(el) ?? '' : 'none'
  el.setAttribute('aria-hidden', String(!isAllowed))
}

export const canDirective: Directive<HTMLElement, CanBinding> = {
  mounted: applyAuthorization,
  updated: applyAuthorization
}

export function installAuthorizationDirectives(app: App) {
  app.directive('can', canDirective)
}

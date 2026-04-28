import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from './auth'
import AuthService from '@/services/auth/auth.service'
import { can } from '@/lib/authz'
import { useAuthStore } from '@/stores'
import PrivateLayout from '@/layouts/private/PrivateLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: PrivateLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
          meta: {
            title: 'Inicio',
            requiresAuth: true
          }
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/users/UsersListView.vue'),
          meta: {
            title: 'Usuarios',
            requiresAuth: true,
            permissions: ['users:*']
          }
        },
        {
          path: 'roles',
          name: 'roles',
          component: () => import('@/views/roles/RolesListView.vue'),
          meta: {
            title: 'Roles',
            requiresAuth: true,
            permissions: ['roles:view']
          }
        },
        {
          path: 'contents',
          name: 'contents',
          component: () => import('@/views/contents/ContentsListView.vue'),
          meta: {
            title: 'Contenidos',
            requiresAuth: true,
            permissions: ['content:view']
          }
        },
        {
          path: 'contents/new',
          name: 'contents-create',
          component: () => import('@/views/contents/ContentFormView.vue'),
          meta: {
            title: 'Nuevo contenido',
            requiresAuth: true,
            permissions: ['content:create']
          }
        },
        {
          path: 'contents/:id/edit',
          name: 'contents-edit',
          component: () => import('@/views/contents/ContentFormView.vue'),
          meta: {
            title: 'Editar contenido',
            requiresAuth: true,
            permissions: ['content:edit']
          }
        },
        {
          path: 'categories',
          name: 'categories',
          component: () => import('@/views/categories/CategoriesListView.vue'),
          meta: {
            title: 'Categorías',
            requiresAuth: true,
            permissions: ['categories:view']
          }
        },
        {
          path: 'tags',
          name: 'tags',
          component: () => import('@/views/tags/TagsListView.vue'),
          meta: {
            title: 'Etiquetas',
            requiresAuth: true,
            permissions: ['tags:view']
          }
        },
        {
          path: 'content-types',
          name: 'content-types',
          component: () => import('@/views/content-types/ContentTypesListView.vue'),
          meta: {
            title: 'Tipos de contenido',
            requiresAuth: true,
            permissions: ['content-types:view']
          }
        },
        {
          path: 'content-types/new',
          name: 'content-types-create',
          component: () => import('@/views/content-types/ContentTypeFormView.vue'),
          meta: {
            title: 'Nuevo tipo de contenido',
            requiresAuth: true,
            permissions: ['content-types:create']
          }
        },
        {
          path: 'content-types/:id/edit',
          name: 'content-types-edit',
          component: () => import('@/views/content-types/ContentTypeFormView.vue'),
          meta: {
            title: 'Editar tipo de contenido',
            requiresAuth: true,
            permissions: ['content-types:edit']
          }
        },
        {
          path: 'content-types/:id',
          name: 'content-types-detail',
          component: () => import('@/views/content-types/ContentTypeDetailView.vue'),
          meta: {
            title: 'Detalle de tipo de contenido',
            requiresAuth: true,
            permissions: ['content-types:view']
          }
        },
        {
          path: 'forbidden',
          name: 'forbidden',
          component: () => import('@/views/ForbiddenView.vue'),
          meta: {
            title: 'Acceso restringido',
            requiresAuth: true
          }
        }
      ]
    },
    ...authRoutes
  ]
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const authService = new AuthService()
  const isLoginRoute = to.name === 'login'
  const hasRouteAccess = () => {
    const permissions = authStore.currentUser?.authorization.permissions ?? []

    return can(permissions, to.meta.permissions)
  }

  if (authStore.isAuthenticated) {
    if (isLoginRoute) {
      return next({ path: '/' })
    }

    if (!hasRouteAccess()) {
      return next({ name: 'forbidden' })
    }

    return next()
  }

  try {
    const user = await authService.me()
    authStore.setUser(user)
    if (isLoginRoute) {
      return next({ path: '/' })
    }

    if (!hasRouteAccess()) {
      return next({ name: 'forbidden' })
    }

    return next()
  } catch {
    authStore.clearUser()
  }

  if (!to.meta.requiresAuth) {
    return next()
  }

  return next({ name: 'login' })
})

export default router

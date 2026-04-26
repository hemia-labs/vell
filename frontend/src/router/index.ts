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

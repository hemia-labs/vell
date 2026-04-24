import PublicLayout from '@/layouts/public/PublicLayout.vue'

export const authRoutes = [
  {
    path: '/login',
    component: PublicLayout,
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('@/views/auth/login/LoginView.vue'),
        meta: {
          title: 'Iniciar sesión'
        }
      }
    ]
  }
]

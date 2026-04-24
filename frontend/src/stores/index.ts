import { createPinia } from 'pinia'

import { useAuthStore } from './auth.store'

const pinia = createPinia()

export { pinia, useAuthStore }

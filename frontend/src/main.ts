import './config/env';
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import { installAuthorizationDirectives } from './directives/can'
import './style.css'

const app = createApp(App)

app.use(pinia)
app.use(router)
installAuthorizationDirectives(app)

app.mount('#app')

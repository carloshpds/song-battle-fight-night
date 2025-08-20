import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Plugins
import vuetify from '@/core/plugins/vuetify'
import pinia from '@/core/stores'
import router from '@/core/router'

const app = createApp(App)

app.use(vuetify)
app.use(pinia)
app.use(router)

app.mount('#app')

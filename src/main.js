import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.min.css'
import './assets/main.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import { createHead } from '@unhead/vue/client'

const app = createApp(App)
const head = createHead()

app.use(createPinia())
app.use(router)
app.use(head)


app.mount('#app')

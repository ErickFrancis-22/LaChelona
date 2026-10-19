
import { createApp } from 'vue'
import LoginView from './LoginView.vue'
import router from './router'

const app = createApp(LoginView)

app.use(router)

app.mount('#app')

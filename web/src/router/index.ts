import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('../LoginView.vue'),
    },
    {
      path: '/clientes',
      name: 'admin-clientes',
      component: () => import('../ClientesView.vue'),
    },
  ],
})

export default router
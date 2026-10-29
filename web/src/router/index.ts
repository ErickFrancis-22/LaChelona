import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import DashboardView from '../views/admin/DashboardView.vue'
import LoginView from '../LoginView.vue'
import ClientesView from '../ClientesView.vue'

const PlaceholderView = {
  template: `
    <section class="placeholder-view">
      <h2>{{ title }}</h2>
      <p>La vista de este módulo se desarrollará en su ticket correspondiente.</p>
    </section>
  `,
  props: ['title'],
}

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: DashboardView,
        meta: { title: 'Panel administrativo' },
      },
      {
        path: 'clientes',
        name: 'admin-clientes',
        component: ClientesView,
        meta: { title: 'Clientes' },
      },
      {
        path: 'productos',
        name: 'admin-productos',
        component: PlaceholderView,
        props: { title: 'Productos' },
        meta: { title: 'Productos' },
      },
      {
        path: 'pedidos',
        name: 'admin-pedidos',
        component: PlaceholderView,
        props: { title: 'Pedidos' },
        meta: { title: 'Pedidos' },
      },
      {
        path: 'categorias',
        name: 'admin-categorias',
        component: PlaceholderView,
        props: { title: 'Categorías' },
        meta: { title: 'Categorías' },
      },
      {
        path: 'inventario',
        name: 'admin-inventario',
        component: PlaceholderView,
        props: { title: 'Inventario' },
        meta: { title: 'Inventario' },
      },
      {
        path: 'reportes',
        alias: 'informes',
        name: 'admin-reportes',
        component: PlaceholderView,
        props: { title: 'Reportes' },
        meta: { title: 'Reportes' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
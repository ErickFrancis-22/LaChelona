
import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import DashboardView from '../views/admin/DashboardView.vue'

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
    redirect: '/admin',
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
        component: PlaceholderView,
        props: { title: 'Clientes' },
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
        path: 'informes',
        name: 'admin-informes',
        component: PlaceholderView,
        props: { title: 'Informes' },
        meta: { title: 'Informes' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/admin',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/blog/new',
      name: 'blog-new',
      component: () => import('../views/BlogEditorView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/blog/:id/edit',
      name: 'blog-edit',
      component: () => import('../views/BlogEditorView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/pages',
      name: 'pages',
      component: () => import('../views/PagesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/pages/new',
      name: 'page-new',
      component: () => import('../views/PageEditorView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/pages/:id/edit',
      name: 'page-edit',
      component: () => import('../views/PageEditorView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Init session on first navigation
  if (authStore.loading) {
    await authStore.init()
  }

  if (to.meta.requiresAuth && !authStore.user) {
    return { name: 'login' }
  }

  // Redirect logged-in users away from login page
  if (to.name === 'login' && authStore.user) {
    return { name: 'dashboard' }
  }
})

export default router

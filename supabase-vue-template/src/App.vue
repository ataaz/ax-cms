<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isLoginPage = computed(() => route.name === 'login')

async function logout() {
  await authStore.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-shell">
    <header v-if="authStore.user && !isLoginPage" class="topbar">
      <div class="topbar-left">
        <RouterLink to="/" class="brand">
          <span class="brand-icon">✦</span>
          <span class="brand-name">AX CMS</span>
        </RouterLink>
        <span class="topbar-divider" />
        <span class="topbar-label">CMS</span>
        <span class="topbar-divider" />
        <nav class="topbar-nav">
          <RouterLink to="/" class="nav-link" :class="{ active: $route.name === 'dashboard' }">Posts</RouterLink>
          <RouterLink to="/pages" class="nav-link" :class="{ active: String($route.name).startsWith('page') }">Pages</RouterLink>
        </nav>
      </div>
      <div class="topbar-right">
        <span class="user-chip">
          <span class="user-dot" />
          {{ authStore.user.email }}
        </span>
        <button class="logout-btn" @click="logout">
          Sign out
        </button>
      </div>
    </header>

    <main class="app-main" :class="{ 'no-header': isLoginPage || !authStore.user }">
      <RouterView />
    </main>

    <footer v-if="authStore.user && !isLoginPage" class="app-footer">
      <span class="footer-text">
        Powered by
        <a href="https://www.axdigitalagency.com" target="_blank" rel="noopener">axdigitalagency.com</a>
        <span class="footer-sep">and</span>
        <a href="https://www.atashaekh.com" target="_blank" rel="noopener">atashaekh.com</a>
      </span>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 52px;
  padding: 0 2rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  animation: fadeIn 0.4s ease;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.brand-icon {
  color: var(--accent);
  font-size: 0.75rem;
  animation: spin 8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.brand-name {
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.02em;
}

.topbar-divider {
  width: 1px;
  height: 16px;
  background: var(--border-2);
}

.topbar-label {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--text-3);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.topbar-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.nav-link {
  font-size: 0.82rem;
  color: var(--text-2);
  text-decoration: none;
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius);
  transition: all 0.15s;
  font-family: var(--font-sans);
}

.nav-link:hover {
  color: var(--text);
  background: var(--surface-2);
}

.nav-link.active {
  color: var(--text);
  background: var(--surface-2);
  font-weight: 500;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-2);
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  font-family: var(--font-mono);
}

.user-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 6px var(--green);
  flex-shrink: 0;
}

.logout-btn {
  background: none;
  border: 1px solid var(--border-2);
  color: var(--text-2);
  font-size: 0.8rem;
  padding: 0.3rem 0.85rem;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-sans);
  letter-spacing: 0.02em;
}

.logout-btn:hover {
  border-color: var(--text-3);
  color: var(--text);
  background: var(--surface-2);
}

.app-main {
  flex: 1;
  padding-top: 0;
}

.app-main.no-header {
  padding-top: 0;
}

.app-footer {
  padding: 1rem 2rem;
  border-top: 1px solid var(--border);
  background: var(--surface);
  text-align: center;
}

.footer-text {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-3);
  letter-spacing: 0.04em;
}

.footer-text a {
  color: var(--text-2);
  text-decoration: none;
  transition: color 0.15s;
}

.footer-text a:hover {
  color: var(--accent);
}

.footer-sep {
  margin: 0 0.5rem;
  color: var(--border-2);
}
</style>

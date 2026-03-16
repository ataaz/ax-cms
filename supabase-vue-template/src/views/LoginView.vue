<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function handleSubmit() {
  error.value = null
  loading.value = true
  try {
    await authStore.signIn(email.value, password.value)
    router.push({ name: 'dashboard' })
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- Left panel -->
    <div class="login-left">
      <div class="left-inner">
        <div class="left-mark">✦</div>
        <h1 class="left-headline">
          Write.<br />
          <em>Edit.</em><br />
          Publish.
        </h1>
        <p class="left-sub">Your editorial command centre.</p>
        <div class="left-rule" />
        <ul class="left-features">
          <li><span class="feat-dot" />Draft &amp; publish blog posts</li>
          <li><span class="feat-dot" />Manage content in one place</li>
          <li><span class="feat-dot" />Powered by Supabase</li>
        </ul>
      </div>
      <div class="left-noise" />
    </div>

    <!-- Right panel -->
    <div class="login-right">
      <div class="form-wrap">
        <div class="form-eyebrow">
          <span class="form-mark">✦</span>
          <span>AX CMS</span>
        </div>

        <h2 class="form-title">Welcome back</h2>
        <p class="form-subtitle">Sign in to your CMS or if you don't have login credential please admin to create it.</p>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <form class="form" @submit.prevent="handleSubmit">
          <div class="field">
            <label for="email">Email address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="you@example.com"
              required
              autocomplete="email"
            />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
              minlength="6"
            />
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="loading" class="btn-spinner" />
            <span>{{ loading ? 'Please wait…' : 'Sign in' }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
}

/* ── Left panel ── */
.login-left {
  position: relative;
  flex: 1;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.left-noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  opacity: 0.5;
}

.left-inner {
  position: relative;
  z-index: 1;
  padding: 3rem;
  max-width: 400px;
  animation: fadeUp 0.8s ease both;
}

.left-mark {
  color: var(--accent);
  font-size: 1.2rem;
  margin-bottom: 2.5rem;
  animation: spin 10s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.left-headline {
  font-family: var(--font-serif);
  font-size: clamp(3.5rem, 6vw, 5rem);
  font-weight: 300;
  line-height: 1.05;
  color: var(--text);
  letter-spacing: -0.02em;
  margin-bottom: 1.5rem;
}

.left-headline em {
  font-style: italic;
  color: var(--accent);
}

.left-sub {
  font-size: 0.9rem;
  color: var(--text-2);
  margin-bottom: 2rem;
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
}

.left-rule {
  width: 40px;
  height: 1px;
  background: var(--border-2);
  margin-bottom: 2rem;
}

.left-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.left-features li {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.85rem;
  color: var(--text-2);
}

.feat-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

/* ── Right panel ── */
.login-right {
  width: 440px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 3rem 2.5rem;
}

.form-wrap {
  width: 100%;
  max-width: 360px;
  animation: fadeUp 0.6s ease both;
  animation-delay: 0.1s;
}

.form-eyebrow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-3);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 2.5rem;
}

.form-mark {
  color: var(--accent);
  font-size: 0.7rem;
}

.form-title {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: 400;
  color: var(--text);
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.form-subtitle {
  font-size: 0.83rem;
  color: var(--text-2);
  margin-bottom: 2rem;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: var(--radius);
  font-size: 0.82rem;
  margin-bottom: 1.25rem;
  line-height: 1.5;
}

.alert-success {
  background: var(--green-bg);
  border: 1px solid rgba(74, 155, 106, 0.3);
  color: #7cc49a;
}

.alert-error {
  background: var(--red-bg);
  border: 1px solid rgba(194, 80, 80, 0.3);
  color: #d98080;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-2);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-family: var(--font-mono);
}

.field input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  padding: 0.7rem 0.9rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
}

.field input::placeholder {
  color: var(--text-3);
}

.field input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(201, 120, 74, 0.12);
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  letter-spacing: 0.02em;
}

.submit-btn:hover:not(:disabled) {
  background: var(--accent-h);
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.99);
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin2 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin2 {
  to { transform: rotate(360deg); }
}

.toggle-line {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-2);
}

.toggle-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 500;
  margin-left: 0.3rem;
  text-decoration: underline;
  text-underline-offset: 3px;
  font-family: var(--font-sans);
}

.toggle-btn:hover {
  color: var(--accent-h);
}

@media (max-width: 768px) {
  .login-left { display: none; }
  .login-right { width: 100%; }
}
</style>

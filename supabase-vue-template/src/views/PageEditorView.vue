<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RichEditor from '@/components/RichEditor.vue'
import type { Page } from './PagesView.vue'

const route  = useRoute()
const router = useRouter()

const STORAGE_KEY = 'cms_pages'

const isEditing = computed(() => !!route.params.id)

const title   = ref('')
const slug    = ref('')
const content = ref('')
const status  = ref<'draft' | 'published'>('draft')

const loading    = ref(false)
const error      = ref<string | null>(null)
const saved      = ref(false)
const slugEdited = ref(false)

const wordCount = computed(() =>
  content.value.trim().split(/\s+/).filter(Boolean).length
)

function toSlug(text: string) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

watch(title, (val) => {
  if (!slugEdited.value) slug.value = toSlug(val)
})

function loadPages(): Page[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function savePages(pages: Page[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages))
}

function fetchPage() {
  if (!isEditing.value) return
  const pages = loadPages()
  const page = pages.find((p) => p.id === route.params.id)
  if (!page) { error.value = 'Page not found.'; return }
  title.value   = page.title
  slug.value    = page.slug
  content.value = page.content
  status.value  = page.status
  slugEdited.value = true
}

function save() {
  error.value = null
  if (!title.value.trim())   { error.value = 'Title is required.'; return }
  if (!content.value.trim()) { error.value = 'Content cannot be empty.'; return }
  if (!slug.value.trim())    { error.value = 'Slug is required.'; return }

  loading.value = true
  const pages = loadPages()
  const now = new Date().toISOString()

  if (isEditing.value) {
    const idx = pages.findIndex((p) => p.id === route.params.id)
    if (idx === -1) { error.value = 'Page not found.'; loading.value = false; return }
    pages[idx] = {
      ...pages[idx],
      title:      title.value.trim(),
      slug:       slug.value.trim(),
      content:    content.value.trim(),
      status:     status.value,
      updated_at: now,
    }
  } else {
    // Check slug uniqueness
    if (pages.some((p) => p.slug === slug.value.trim())) {
      error.value = 'A page with this slug already exists.'
      loading.value = false
      return
    }
    pages.push({
      id:         crypto.randomUUID(),
      title:      title.value.trim(),
      slug:       slug.value.trim(),
      content:    content.value.trim(),
      status:     status.value,
      created_at: now,
      updated_at: now,
    })
  }

  savePages(pages)
  saved.value = true
  loading.value = false
  setTimeout(() => router.push({ name: 'pages' }), 500)
}

onMounted(fetchPage)
</script>

<template>
  <div class="editor-page">

    <!-- Top bar -->
    <div class="editor-topbar">
      <RouterLink to="/pages" class="back-link">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back
      </RouterLink>

      <span class="editor-breadcrumb">
        Pages <span class="sep">/</span> {{ isEditing ? 'Edit page' : 'New page' }}
      </span>

      <div class="topbar-right">
        <span v-if="content" class="word-count">{{ wordCount }} words</span>

        <label class="pub-toggle">
          <input v-model="status" type="checkbox" true-value="published" false-value="draft" class="sr-only" />
          <span class="toggle-track" :class="{ active: status === 'published' }">
            <span class="toggle-thumb" />
          </span>
          <span class="toggle-label">{{ status === 'published' ? 'Published' : 'Draft' }}</span>
        </label>

        <button class="save-btn" :disabled="loading || saved" @click="save">
          <span v-if="loading" class="btn-spinner" />
          <span v-else-if="saved">✓ Saved</span>
          <span v-else>{{ isEditing ? 'Update' : 'Create page' }}</span>
        </button>
      </div>
    </div>

    <!-- Editor body -->
    <div class="editor-body">
      <div v-if="error" class="top-error">⚠ {{ error }}</div>

      <div class="editor-inner">
        <input
          v-model="title"
          class="title-input"
          type="text"
          placeholder="Page title…"
          maxlength="200"
        />

        <!-- Slug row -->
        <div class="slug-row">
          <span class="slug-prefix">/</span>
          <input
            v-model="slug"
            class="slug-input"
            type="text"
            placeholder="page-slug"
            @input="slugEdited = true"
          />
          <button class="slug-regen" title="Regenerate from title" @click="slug = toSlug(title); slugEdited = false">↺</button>
        </div>

        <div class="content-divider" />

        <RichEditor v-model="content" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.editor-topbar {
  position: sticky;
  top: 52px;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 1.75rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  gap: 1rem;
  animation: fadeIn 0.3s ease;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--text-2);
  text-decoration: none;
  transition: color 0.15s;
  flex-shrink: 0;
}
.back-link:hover { color: var(--text); }

.editor-breadcrumb {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-3);
  letter-spacing: 0.05em;
  flex: 1;
  text-align: center;
}
.sep { margin: 0 0.4rem; color: var(--border-2); }

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.word-count {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-3);
  white-space: nowrap;
}

.pub-toggle { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }

.toggle-track {
  position: relative;
  width: 32px; height: 18px;
  background: var(--border-2);
  border-radius: 999px;
  transition: background 0.2s;
  flex-shrink: 0;
}
.toggle-track.active { background: var(--green); }
.toggle-thumb {
  position: absolute;
  top: 2px; left: 2px;
  width: 14px; height: 14px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
.toggle-track.active .toggle-thumb { transform: translateX(14px); }
.toggle-label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-2);
  min-width: 54px;
}

.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 0.45rem 1.1rem;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  font-family: var(--font-sans);
  white-space: nowrap;
}
.save-btn:hover:not(:disabled) { background: var(--accent-h); }
.save-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-spinner {
  width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.editor-body {
  flex: 1;
  animation: fadeUp 0.4s ease both;
}

.top-error {
  max-width: 720px;
  margin: 1.5rem auto 0;
  padding: 0.7rem 1rem;
  background: var(--red-bg);
  border: 1px solid rgba(194,80,80,0.25);
  border-radius: var(--radius);
  color: #d98080;
  font-size: 0.82rem;
  width: calc(100% - 4rem);
}

.editor-inner {
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  padding: 3.5rem 2rem 5rem;
}

.title-input {
  display: block;
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--font-serif);
  font-size: clamp(1.8rem, 3.5vw, 2.5rem);
  font-weight: 400;
  color: var(--text);
  line-height: 1.2;
  caret-color: var(--accent);
  margin-bottom: 0.85rem;
}
.title-input::placeholder { color: var(--text-3); }

.slug-row {
  display: flex;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0 0.5rem;
  margin-bottom: 1.75rem;
  max-width: 480px;
  transition: border-color 0.2s;
}
.slug-row:focus-within { border-color: var(--accent); }

.slug-prefix {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-3);
  padding: 0.4rem 0.2rem 0.4rem 0.4rem;
  flex-shrink: 0;
}
.slug-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text);
  padding: 0.5rem 0.4rem;
}
.slug-input::placeholder { color: var(--text-3); }

.slug-regen {
  background: none;
  border: none;
  color: var(--text-3);
  cursor: pointer;
  font-size: 1rem;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
  line-height: 1;
}
.slug-regen:hover { color: var(--accent); background: rgba(201,120,74,0.08); }

.content-divider {
  height: 1px;
  background: var(--border);
  margin-bottom: 2rem;
  position: relative;
}
.content-divider::after {
  content: '';
  position: absolute;
  left: 0; bottom: 0;
  width: 36px; height: 2px;
  background: var(--accent);
}
</style>

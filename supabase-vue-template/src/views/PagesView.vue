<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export interface Page {
  id: string
  title: string
  slug: string
  content: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

const STORAGE_KEY = 'cms_pages'
const router = useRouter()

const pages = ref<Page[]>([])

function loadPages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    pages.value = raw ? JSON.parse(raw) : []
  } catch {
    pages.value = []
  }
}

function savePages() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages.value))
}

function deletePage(id: string) {
  if (!confirm('Delete this page?')) return
  pages.value = pages.value.filter((p) => p.id !== id)
  savePages()
}

function toggleStatus(page: Page) {
  page.status = page.status === 'published' ? 'draft' : 'published'
  page.updated_at = new Date().toISOString()
  savePages()
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const totalCount     = computed(() => pages.value.length)
const publishedCount = computed(() => pages.value.filter((p) => p.status === 'published').length)
const draftCount     = computed(() => pages.value.filter((p) => p.status === 'draft').length)

onMounted(loadPages)
</script>

<template>
  <div class="pages-wrap">
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">Content</span>
        <h1 class="page-title">Pages</h1>
      </div>
      <RouterLink to="/pages/new" class="new-btn">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        New page
      </RouterLink>
    </div>

    <!-- Notice -->
    <div class="notice">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.2"/>
        <path d="M6.5 5.5v4M6.5 4h.01" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      Pages are stored locally for now. Supabase integration will be added later.
    </div>

    <!-- Stats -->
    <div v-if="pages.length > 0" class="stats-strip">
      <div class="stat">
        <span class="stat-num">{{ totalCount }}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-divider" />
      <div class="stat">
        <span class="stat-num pub">{{ publishedCount }}</span>
        <span class="stat-label">Published</span>
      </div>
      <div class="stat-divider" />
      <div class="stat">
        <span class="stat-num">{{ draftCount }}</span>
        <span class="stat-label">Drafts</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="pages.length === 0" class="empty-state">
      <div class="empty-glyph">◻</div>
      <p class="empty-title">No pages yet</p>
      <p class="empty-sub">Create your first page — About, Contact, Services, etc.</p>
      <RouterLink to="/pages/new" class="new-btn">Create a page</RouterLink>
    </div>

    <!-- Pages list -->
    <div v-else class="pages-list">
      <div
        v-for="(page, index) in pages"
        :key="page.id"
        class="page-row"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <div class="page-left">
          <div class="page-title-row">
            <span :class="['status-dot', page.status === 'published' ? 'pub' : 'draft']" />
            <h2 class="page-name">{{ page.title }}</h2>
          </div>
          <div class="page-meta">
            <span :class="['badge', page.status === 'published' ? 'badge-pub' : 'badge-draft']">
              {{ page.status === 'published' ? 'Published' : 'Draft' }}
            </span>
            <span class="meta-sep">·</span>
            <span class="meta-slug">/{{ page.slug }}</span>
            <span class="meta-sep">·</span>
            <span class="meta-date">{{ formatDate(page.created_at) }}</span>
          </div>
        </div>

        <div class="page-actions">
          <button class="action-btn edit" @click="router.push({ name: 'page-edit', params: { id: page.id } })">
            Edit
          </button>
          <button class="action-btn toggle" @click="toggleStatus(page)">
            {{ page.status === 'published' ? 'Unpublish' : 'Publish' }}
          </button>
          <button class="action-btn delete" @click="deletePage(page.id)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pages-wrap {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.25rem;
  animation: fadeUp 0.5s ease both;
}

.page-eyebrow {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--text-3);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 0.3rem;
}

.page-title {
  font-family: var(--font-serif);
  font-size: 2.2rem;
  font-weight: 400;
  color: var(--text);
  line-height: 1;
}

.new-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--accent);
  color: #fff;
  padding: 0.55rem 1.1rem;
  border-radius: var(--radius);
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s;
}
.new-btn:hover { background: var(--accent-h); }

/* Notice */
.notice {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  background: var(--amber-bg);
  border: 1px solid rgba(184,150,42,0.25);
  border-radius: var(--radius);
  color: #c9a84c;
  font-size: 0.8rem;
  font-family: var(--font-mono);
  margin-bottom: 1.5rem;
  animation: fadeUp 0.5s ease both;
  animation-delay: 0.04s;
}

/* Stats */
.stats-strip {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 1.75rem;
  animation: fadeUp 0.5s ease both;
  animation-delay: 0.06s;
}

.stat { display: flex; flex-direction: column; gap: 0.1rem; }
.stat-num {
  font-family: var(--font-mono);
  font-size: 1.4rem;
  color: var(--text);
  line-height: 1;
}
.stat-num.pub { color: var(--green); }
.stat-label {
  font-size: 0.72rem;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: var(--font-mono);
}
.stat-divider { width: 1px; height: 32px; background: var(--border); }

/* Empty */
.empty-state {
  text-align: center;
  padding: 5rem 2rem;
  animation: fadeUp 0.5s ease both;
}
.empty-glyph { font-size: 2.5rem; color: var(--border-2); margin-bottom: 1rem; }
.empty-title {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  color: var(--text-2);
  margin-bottom: 0.4rem;
}
.empty-sub { font-size: 0.85rem; color: var(--text-3); margin-bottom: 1.75rem; }

/* List */
.pages-list { display: flex; flex-direction: column; gap: 0.5rem; }

.page-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.1rem 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border-color 0.2s, background 0.2s;
  animation: fadeUp 0.4s ease both;
}
.page-row:hover { border-color: var(--border-2); background: var(--surface-2); }

.page-left { flex: 1; min-width: 0; }

.page-title-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.4rem;
}

.status-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.pub { background: var(--green); box-shadow: 0 0 5px var(--green); }
.status-dot.draft { background: var(--text-3); }

.page-name {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  font-family: var(--font-mono);
  font-size: 0.67rem;
  font-weight: 500;
  padding: 0.15rem 0.55rem;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.badge-pub { background: var(--green-bg); color: #6cc496; border: 1px solid rgba(74,155,106,0.25); }
.badge-draft { background: var(--surface-2); color: var(--text-3); border: 1px solid var(--border); }

.meta-sep { color: var(--text-3); font-size: 0.75rem; }
.meta-slug { font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent); }
.meta-date { font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-3); }

/* Actions */
.page-actions { display: flex; flex-direction: column; gap: 0.35rem; flex-shrink: 0; }

.action-btn {
  padding: 0.3rem 0.85rem;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 80px;
  text-align: center;
  font-family: var(--font-sans);
}

.action-btn.edit { background: transparent; border-color: var(--border-2); color: var(--text-2); }
.action-btn.edit:hover { border-color: var(--accent); color: var(--accent); background: rgba(201,120,74,0.07); }

.action-btn.toggle { background: transparent; border-color: var(--border-2); color: var(--text-2); }
.action-btn.toggle:hover { border-color: var(--green); color: var(--green); background: var(--green-bg); }

.action-btn.delete { background: transparent; border-color: transparent; color: var(--text-3); }
.action-btn.delete:hover { border-color: rgba(194,80,80,0.3); color: var(--red); background: var(--red-bg); }
</style>

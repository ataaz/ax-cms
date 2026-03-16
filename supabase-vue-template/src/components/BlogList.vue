<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'

interface Blog {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  category: string | null
  tags: string[]
  published: boolean
  created_at: string
  updated_at: string
}

const router = useRouter()
const blogs = ref<Blog[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const togglingId = ref<string | null>(null)

const totalCount = computed(() => blogs.value.length)
const publishedCount = computed(() => blogs.value.filter((b) => b.published).length)
const draftCount = computed(() => blogs.value.filter((b) => !b.published).length)

const categories = computed(() => {
  const map = new Map<string, number>()
  for (const blog of blogs.value) {
    if (blog.category) map.set(blog.category, (map.get(blog.category) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const activeCategory = ref<string | null>(null)
const filteredBlogs = computed(() =>
  activeCategory.value
    ? blogs.value.filter((b) => b.category === activeCategory.value)
    : blogs.value
)

async function fetchBlogs() {
  try {
    loading.value = true
    const { data, error: fetchError } = await supabase
      .from('blogs')
      .select('id, title, slug, excerpt, content, category, tags, published, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError
    blogs.value = data ?? []
  } catch (err: any) {
    error.value = 'Failed to fetch posts: ' + err.message
  } finally {
    loading.value = false
  }
}

async function togglePublish(blog: Blog) {
  togglingId.value = blog.id
  const { error: updateError } = await supabase
    .from('blogs')
    .update({ published: !blog.published, updated_at: new Date().toISOString() })
    .eq('id', blog.id)

  if (updateError) {
    alert('Failed to update: ' + updateError.message)
  } else {
    blog.published = !blog.published
  }
  togglingId.value = null
}

async function deleteBlog(id: string) {
  if (!confirm('Permanently delete this post?')) return
  deletingId.value = id
  const { error: deleteError } = await supabase.from('blogs').delete().eq('id', id)
  if (deleteError) {
    alert('Failed to delete: ' + deleteError.message)
  } else {
    blogs.value = blogs.value.filter((b) => b.id !== id)
  }
  deletingId.value = null
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(fetchBlogs)
</script>

<template>
  <div class="dashboard">
    <!-- Page header -->
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">Content</span>
        <h1 class="page-title">All Posts</h1>
      </div>
      <RouterLink to="/blog/new" class="new-post-btn">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        New post
      </RouterLink>
    </div>

    <!-- Stats strip -->
    <div v-if="!loading && !error" class="stats-strip">
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

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="loading-rows">
        <div v-for="i in 4" :key="i" class="skeleton-row" :style="{ animationDelay: `${i * 0.07}s` }" />
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠</span>
      <p>{{ error }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && !error && blogs.length === 0" class="empty-state">
      <div class="empty-glyph">✦</div>
      <p class="empty-title">No posts yet</p>
      <p class="empty-sub">Create your first post to get started</p>
      <RouterLink to="/blog/new" class="new-post-btn">Write something</RouterLink>
    </div>

    <!-- Categories filter -->
    <div v-if="!loading && !error && categories.length" class="categories-bar">
      <button
        class="cat-pill"
        :class="{ active: activeCategory === null }"
        @click="activeCategory = null"
      >All <span class="cat-count">{{ totalCount }}</span></button>
      <button
        v-for="cat in categories"
        :key="cat.name"
        class="cat-pill"
        :class="{ active: activeCategory === cat.name }"
        @click="activeCategory = activeCategory === cat.name ? null : cat.name"
      >{{ cat.name }} <span class="cat-count">{{ cat.count }}</span></button>
    </div>

    <!-- Post list -->
    <div v-else-if="!loading && !error && blogs.length === 0" />
    <div v-if="!loading && !error && blogs.length > 0" class="post-list">
      <div
        v-for="(blog, index) in filteredBlogs"
        :key="blog.id"
        class="post-row"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <div class="post-left">
          <div class="post-title-row">
            <span :class="['status-dot', blog.published ? 'pub' : 'draft']" :title="blog.published ? 'Published' : 'Draft'" />
            <h2 class="post-title">{{ blog.title }}</h2>
          </div>
          <p class="post-preview">
            {{ blog.excerpt || blog.content.slice(0, 130) + (blog.content.length > 130 ? '…' : '') }}
          </p>
          <div class="post-meta">
            <span :class="['badge', blog.published ? 'badge-pub' : 'badge-draft']">
              {{ blog.published ? 'Published' : 'Draft' }}
            </span>
            <template v-if="blog.category">
              <span class="meta-sep">·</span>
              <span class="meta-category">{{ blog.category }}</span>
            </template>
            <span class="meta-sep">·</span>
            <span class="meta-date">{{ formatDate(blog.created_at) }}</span>
          </div>
          <div v-if="blog.tags?.length" class="post-tags">
            <span v-for="tag in blog.tags.slice(0, 4)" :key="tag" class="post-tag">{{ tag }}</span>
            <span v-if="blog.tags.length > 4" class="post-tag-more">+{{ blog.tags.length - 4 }}</span>
          </div>
        </div>

        <div class="post-actions">
          <button class="action-btn edit" @click="router.push({ name: 'blog-edit', params: { id: blog.id } })">
            Edit
          </button>
          <button
            class="action-btn toggle"
            :disabled="togglingId === blog.id"
            @click="togglePublish(blog)"
          >
            {{ togglingId === blog.id ? '…' : blog.published ? 'Unpublish' : 'Publish' }}
          </button>
          <button
            class="action-btn delete"
            :disabled="deletingId === blog.id"
            @click="deleteBlog(blog.id)"
          >
            {{ deletingId === blog.id ? '…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

/* ── Header ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
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

.new-post-btn {
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
  transition: background 0.2s, transform 0.1s;
  letter-spacing: 0.02em;
}

.new-post-btn:hover {
  background: var(--accent-h);
}

.new-post-btn:active {
  transform: scale(0.98);
}

/* ── Stats ── */
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
  animation-delay: 0.05s;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

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

.stat-divider {
  width: 1px;
  height: 32px;
  background: var(--border);
}

/* ── Categories bar ── */
.categories-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
  animation: fadeUp 0.4s ease both;
  animation-delay: 0.08s;
}

.cat-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.3rem 0.85rem;
  font-size: 0.78rem;
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--font-sans);
}

.cat-pill:hover {
  border-color: var(--border-2);
  color: var(--text);
}

.cat-pill.active {
  background: rgba(201,120,74,0.12);
  border-color: rgba(201,120,74,0.35);
  color: var(--accent-h);
}

.cat-count {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  background: var(--surface-2);
  border-radius: 999px;
  padding: 0.05rem 0.4rem;
  color: var(--text-3);
}

.cat-pill.active .cat-count {
  background: rgba(201,120,74,0.2);
  color: var(--accent);
}

/* ── Loading skeleton ── */
.loading-state { margin-top: 1rem; }

.loading-rows {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-row {
  height: 88px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  animation: pulse 1.6s ease-in-out infinite both;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* ── Error ── */
.error-state {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--red-bg);
  border: 1px solid rgba(194, 80, 80, 0.25);
  border-radius: var(--radius);
  color: #d98080;
  font-size: 0.875rem;
}

.error-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

/* ── Empty ── */
.empty-state {
  text-align: center;
  padding: 5rem 2rem;
  animation: fadeUp 0.5s ease both;
}

.empty-glyph {
  font-size: 2rem;
  color: var(--border-2);
  margin-bottom: 1rem;
}

.empty-title {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  color: var(--text-2);
  margin-bottom: 0.4rem;
}

.empty-sub {
  font-size: 0.85rem;
  color: var(--text-3);
  margin-bottom: 1.75rem;
}

/* ── Post list ── */
.post-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.post-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border-color 0.2s, background 0.2s;
  animation: fadeUp 0.4s ease both;
}

.post-row:hover {
  border-color: var(--border-2);
  background: var(--surface-2);
}

.post-left {
  flex: 1;
  min-width: 0;
}

.post-title-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.45rem;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.pub {
  background: var(--green);
  box-shadow: 0 0 5px var(--green);
}

.status-dot.draft {
  background: var(--text-3);
}

.post-title {
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.post-preview {
  font-size: 0.82rem;
  color: var(--text-2);
  line-height: 1.55;
  margin-bottom: 0.6rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
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

.badge-pub {
  background: var(--green-bg);
  color: #6cc496;
  border: 1px solid rgba(74, 155, 106, 0.25);
}

.badge-draft {
  background: var(--surface-2);
  color: var(--text-3);
  border: 1px solid var(--border);
}

.meta-sep {
  color: var(--text-3);
  font-size: 0.75rem;
}

.meta-date {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-3);
}

.meta-category {
  font-size: 0.75rem;
  color: var(--accent);
  font-family: var(--font-mono);
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.5rem;
}

.post-tag {
  font-family: var(--font-mono);
  font-size: 0.67rem;
  padding: 0.1rem 0.45rem;
  background: var(--surface-2);
  border: 1px solid var(--border-2);
  border-radius: 3px;
  color: var(--text-3);
}

.post-tag-more {
  font-family: var(--font-mono);
  font-size: 0.67rem;
  color: var(--text-3);
  padding: 0.1rem 0.3rem;
}

/* ── Actions ── */
.post-actions {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex-shrink: 0;
}

.action-btn {
  padding: 0.3rem 0.85rem;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.02em;
  min-width: 80px;
  text-align: center;
  font-family: var(--font-sans);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.edit {
  background: transparent;
  border-color: var(--border-2);
  color: var(--text-2);
}

.action-btn.edit:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(201, 120, 74, 0.07);
}

.action-btn.toggle {
  background: transparent;
  border-color: var(--border-2);
  color: var(--text-2);
}

.action-btn.toggle:hover:not(:disabled) {
  border-color: var(--green);
  color: var(--green);
  background: var(--green-bg);
}

.action-btn.delete {
  background: transparent;
  border-color: transparent;
  color: var(--text-3);
}

.action-btn.delete:hover:not(:disabled) {
  border-color: rgba(194, 80, 80, 0.3);
  color: var(--red);
  background: var(--red-bg);
}
</style>

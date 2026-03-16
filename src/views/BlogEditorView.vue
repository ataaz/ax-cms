<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import RichEditor from '@/components/RichEditor.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isEditing = computed(() => !!route.params.id)

// Core
const title    = ref('')
const slug     = ref('')
const content  = ref('')
const excerpt  = ref('')

// Media & taxonomy
const coverImageUrl = ref('')
const category      = ref('')
const tags          = ref<string[]>([])
const tagInput      = ref('')

// SEO
const metaTitle       = ref('')
const metaDescription = ref('')

// Publishing
const published  = ref(false)
const authorName = ref('')

// UI state
const loading        = ref(false)
const fetchLoading   = ref(false)
const error          = ref<string | null>(null)
const saved          = ref(false)
const seoOpen        = ref(false)
const slugEdited     = ref(false)
const imageUploading = ref(false)

// ── Derived ───────────────────────────────────────
const wordCount = computed(() =>
  content.value.trim().split(/\s+/).filter(Boolean).length
)
const readTime = computed(() => {
  const m = Math.ceil(wordCount.value / 200)
  return m < 1 ? '< 1 min' : `${m} min read`
})

// ── Slug generation ───────────────────────────────
function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

watch(title, (val) => {
  if (!slugEdited.value) slug.value = toSlug(val)
})

// ── Tag input ─────────────────────────────────────
function addTag() {
  const t = tagInput.value.trim().replace(/,+$/, '')
  if (t && !tags.value.includes(t)) tags.value.push(t)
  tagInput.value = ''
}
function onTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
  if (e.key === 'Backspace' && !tagInput.value) tags.value.pop()
}
function removeTag(i: number) { tags.value.splice(i, 1) }

// ── Fetch existing post ───────────────────────────
async function fetchBlog() {
  if (!isEditing.value) return
  fetchLoading.value = true
  const { data, error: err } = await supabase
    .from('blogs').select('*').eq('id', route.params.id).single()

  if (err || !data) {
    error.value = 'Post not found.'
  } else {
    title.value         = data.title
    slug.value          = data.slug ?? ''
    content.value       = data.content
    excerpt.value       = data.excerpt ?? ''
    coverImageUrl.value = data.cover_image_url ?? ''
    category.value      = data.category ?? ''
    tags.value          = data.tags ?? []
    metaTitle.value     = data.meta_title ?? ''
    metaDescription.value = data.meta_description ?? ''
    published.value     = data.published
    authorName.value    = data.author_name ?? ''
    slugEdited.value    = true
  }
  fetchLoading.value = false
}

// ── Image upload ─────────────────────────────────
async function uploadImage(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const ext = file.name.split('.').pop()
  const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  imageUploading.value = true
  const { data, error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(path, file, { upsert: true })

  if (uploadError) {
    error.value = 'Image upload failed: ' + uploadError.message
  } else {
    const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(data.path)
    coverImageUrl.value = urlData.publicUrl
  }
  imageUploading.value = false
  ;(e.target as HTMLInputElement).value = ''
}

// ── Save ─────────────────────────────────────────
async function save() {
  error.value = null
  if (!title.value.trim())   { error.value = 'Title is required.'; return }
  if (!content.value.trim()) { error.value = 'Content cannot be empty.'; return }
  if (!slug.value.trim())    { error.value = 'Slug is required.'; return }

  loading.value = true
  const payload = {
    title:           title.value.trim(),
    slug:            slug.value.trim(),
    content:         content.value.trim(),
    excerpt:         excerpt.value.trim() || null,
    cover_image_url: coverImageUrl.value.trim() || null,
    category:        category.value.trim() || null,
    tags:            tags.value,
    meta_title:      metaTitle.value.trim() || null,
    meta_description: metaDescription.value.trim() || null,
    published:       published.value,
    published_at:    published.value ? new Date().toISOString() : null,
    author_name:     authorName.value.trim() || null,
    updated_at:      new Date().toISOString(),
  }

  try {
    if (isEditing.value) {
      const { error: err } = await supabase.from('blogs').update(payload).eq('id', route.params.id)
      if (err) throw err
    } else {
      const { error: err } = await supabase.from('blogs').insert({
        ...payload,
        author_id: authStore.user?.id,
      })
      if (err) throw err
    }
    saved.value = true
    setTimeout(() => router.push({ name: 'dashboard' }), 600)
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(fetchBlog)
</script>

<template>
  <div class="editor-page">

    <!-- ── Top bar ── -->
    <div class="editor-topbar">
      <RouterLink to="/" class="back-link">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back
      </RouterLink>

      <span class="editor-breadcrumb">
        Posts <span class="sep">/</span> {{ isEditing ? 'Edit post' : 'New post' }}
      </span>

      <div class="topbar-right">
        <span v-if="content" class="word-count">{{ wordCount }} words · {{ readTime }}</span>

        <label class="pub-toggle">
          <input v-model="published" type="checkbox" class="sr-only" />
          <span class="toggle-track" :class="{ active: published }">
            <span class="toggle-thumb" />
          </span>
          <span class="toggle-label">{{ published ? 'Published' : 'Draft' }}</span>
        </label>

        <button class="save-btn" :disabled="loading || saved" @click="save">
          <span v-if="loading" class="btn-spinner" />
          <span v-else-if="saved">✓ Saved</span>
          <span v-else>{{ isEditing ? 'Update' : 'Publish post' }}</span>
        </button>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div v-if="fetchLoading" class="fetch-loading">
      <span class="fetch-spinner" /><span>Loading…</span>
    </div>

    <!-- ── Main layout ── -->
    <div v-else class="editor-layout">

      <!-- Left: writing area -->
      <div class="editor-main">
        <div v-if="error" class="field-error top-error">⚠ {{ error }}</div>

        <input
          v-model="title"
          class="title-input"
          type="text"
          placeholder="Post title…"
          maxlength="200"
        />

        <!-- Slug row -->
        <div class="slug-row">
          <span class="slug-prefix">/</span>
          <input
            v-model="slug"
            class="slug-input"
            type="text"
            placeholder="post-slug"
            @input="slugEdited = true"
          />
          <button class="slug-regen" title="Regenerate from title" @click="slug = toSlug(title); slugEdited = false">↺</button>
        </div>

        <div class="content-divider" />

        <RichEditor v-model="content" />

        <!-- SEO — below editor -->
        <div class="seo-section">
          <button class="seo-toggle" @click="seoOpen = !seoOpen">
            <span class="seo-toggle-label">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="1.3"/>
                <path d="M9 9l3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
              SEO settings
            </span>
            <span class="seo-chevron" :class="{ open: seoOpen }">›</span>
          </button>

          <div v-if="seoOpen" class="seo-body">
            <div class="seo-row">
              <div class="seo-field">
                <label class="seo-label">Meta title</label>
                <input
                  v-model="metaTitle"
                  class="seo-input"
                  type="text"
                  :placeholder="title || 'Page title for search engines'"
                  maxlength="60"
                />
                <span class="char-count" :class="{ warn: metaTitle.length > 55 }">{{ metaTitle.length }}/60</span>
              </div>
              <div class="seo-field">
                <label class="seo-label">Meta description</label>
                <input
                  v-model="metaDescription"
                  class="seo-input"
                  type="text"
                  :placeholder="excerpt || 'Description for search results…'"
                  maxlength="160"
                />
                <span class="char-count" :class="{ warn: metaDescription.length > 150 }">{{ metaDescription.length }}/160</span>
              </div>
            </div>

            <!-- Live Google preview -->
            <div v-if="metaTitle || title" class="seo-preview">
              <p class="seo-prev-eyebrow">Search result preview</p>
              <p class="seo-prev-title">{{ metaTitle || title }}</p>
              <p class="seo-prev-slug">yourdomain.com/blog/{{ slug || 'post-slug' }}</p>
              <p class="seo-prev-desc">{{ metaDescription || excerpt || 'No description set.' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: metadata sidebar -->
      <aside class="editor-sidebar">

        <!-- Cover image -->
        <section class="sidebar-section">
          <h3 class="section-label">Cover image</h3>

          <!-- Upload button -->
          <label class="upload-btn" :class="{ loading: imageUploading }">
            <span v-if="imageUploading" class="btn-spinner dark" />
            <span v-else>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 4l3-3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M1 10h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              Upload image
            </span>
            <input type="file" accept="image/*" class="sr-only" :disabled="imageUploading" @change="uploadImage" />
          </label>

          <!-- OR paste URL -->
          <div class="url-divider"><span>or paste URL</span></div>
          <input
            v-model="coverImageUrl"
            class="sidebar-input"
            type="url"
            placeholder="https://…"
          />

          <div v-if="coverImageUrl" class="cover-preview">
            <img :src="coverImageUrl" alt="Cover preview" @error="coverImageUrl = ''" />
            <button class="cover-remove" @click="coverImageUrl = ''">✕ Remove</button>
          </div>
        </section>

        <!-- Excerpt -->
        <section class="sidebar-section">
          <h3 class="section-label">Excerpt</h3>
          <textarea
            v-model="excerpt"
            class="sidebar-textarea"
            placeholder="Short summary shown in post listings…"
            rows="3"
            maxlength="300"
          />
          <span class="char-count">{{ excerpt.length }}/300</span>
        </section>

        <!-- Category -->
        <section class="sidebar-section">
          <h3 class="section-label">Category</h3>
          <input
            v-model="category"
            class="sidebar-input"
            type="text"
            placeholder="e.g. Technology"
          />
        </section>

        <!-- Tags -->
        <section class="sidebar-section">
          <h3 class="section-label">Tags</h3>
          <div class="tags-field" @click="($refs.tagInputEl as HTMLInputElement)?.focus()">
            <span
              v-for="(tag, i) in tags"
              :key="tag"
              class="tag-chip"
            >
              {{ tag }}
              <button class="tag-remove" @click.stop="removeTag(i)">×</button>
            </span>
            <input
              ref="tagInputEl"
              v-model="tagInput"
              class="tag-input"
              placeholder="Add tag…"
              @keydown="onTagKeydown"
              @blur="addTag"
            />
          </div>
          <span class="field-hint">Press Enter or comma to add</span>
        </section>

        <!-- Author name -->
        <section class="sidebar-section">
          <h3 class="section-label">Author name</h3>
          <input
            v-model="authorName"
            class="sidebar-input"
            type="text"
            placeholder="Display name"
          />
        </section>

      </aside>
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

/* ── Top bar ── */
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

/* publish toggle */
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

/* save button */
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

/* ── Fetch loading ── */
.fetch-loading {
  display: flex; align-items: center; justify-content: center;
  gap: 0.75rem; padding: 5rem;
  color: var(--text-2); font-size: 0.875rem;
}
.fetch-spinner {
  width: 18px; height: 18px;
  border: 2px solid var(--border-2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ── Layout ── */
.editor-layout {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 0;
  animation: fadeUp 0.4s ease both;
}

/* ── Writing area ── */
.editor-main {
  flex: 1;
  min-width: 0;
  padding: 3rem 3rem 5rem;
  border-right: 1px solid var(--border);
}

.top-error {
  margin-bottom: 1.5rem;
  padding: 0.7rem 1rem;
  background: var(--red-bg);
  border: 1px solid rgba(194,80,80,0.25);
  border-radius: var(--radius);
  color: #d98080;
  font-size: 0.82rem;
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

/* Slug row */
.slug-row {
  display: flex;
  align-items: center;
  gap: 0;
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

.content-textarea {
  width: 100%;
  min-height: 520px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: var(--font-sans);
  font-size: 1rem;
  color: var(--text);
  line-height: 1.85;
  caret-color: var(--accent);
}
.content-textarea::placeholder { color: var(--text-3); }

/* ── Sidebar ── */
.editor-sidebar {
  width: 280px;
  flex-shrink: 0;
  padding: 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: calc(100vh - 104px);
  background: var(--surface);
}

.sidebar-section {
  padding: 1.1rem 0;
  border-bottom: 1px solid var(--border);
}
.sidebar-section:first-child { padding-top: 0; }
.sidebar-section:last-child { border-bottom: none; }

.section-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.67rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-3);
  margin-bottom: 0.65rem;
}

.sidebar-input {
  width: 100%;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  padding: 0.55rem 0.75rem;
  font-size: 0.83rem;
  outline: none;
  transition: border-color 0.2s;
  font-family: var(--font-sans);
}
.sidebar-input::placeholder { color: var(--text-3); }
.sidebar-input:focus { border-color: var(--accent); }

.sidebar-textarea {
  width: 100%;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  padding: 0.55rem 0.75rem;
  font-size: 0.83rem;
  outline: none;
  resize: vertical;
  line-height: 1.55;
  transition: border-color 0.2s;
  font-family: var(--font-sans);
}
.sidebar-textarea::placeholder { color: var(--text-3); }
.sidebar-textarea:focus { border-color: var(--accent); }

.char-count {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--text-3);
  text-align: right;
  margin-top: 0.3rem;
}
.char-count.warn { color: var(--amber); }

/* Upload button */
.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.55rem;
  background: var(--surface-2);
  border: 1px dashed var(--border-2);
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-sans);
}
.upload-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(201,120,74,0.06);
}
.upload-btn.loading {
  opacity: 0.6;
  cursor: not-allowed;
}

.url-divider {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.6rem 0;
  color: var(--text-3);
  font-size: 0.7rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.url-divider::before, .url-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

/* Cover preview */
.cover-preview {
  position: relative;
  margin-top: 0.65rem;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
  aspect-ratio: 16/9;
  background: var(--surface-2);
}
.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.cover-remove {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  background: rgba(0,0,0,0.65);
  border: none;
  color: #fff;
  font-size: 0.72rem;
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}
.cover-preview:hover .cover-remove { opacity: 1; }

.btn-spinner.dark {
  border-color: rgba(0,0,0,0.2);
  border-top-color: var(--text-2);
}

/* Tags */
.tags-field {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.4rem 0.5rem;
  min-height: 38px;
  cursor: text;
  transition: border-color 0.2s;
}
.tags-field:focus-within { border-color: var(--accent); }

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(201,120,74,0.12);
  border: 1px solid rgba(201,120,74,0.25);
  color: var(--accent-h);
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem 0.1rem 0.55rem;
  border-radius: 3px;
  font-family: var(--font-mono);
  white-space: nowrap;
}
.tag-remove {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
  padding: 0;
  opacity: 0.6;
  transition: opacity 0.15s;
}
.tag-remove:hover { opacity: 1; }

.tag-input {
  flex: 1;
  min-width: 80px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 0.82rem;
  font-family: var(--font-sans);
  padding: 0.1rem 0.2rem;
}
.tag-input::placeholder { color: var(--text-3); }

.field-hint {
  display: block;
  font-size: 0.7rem;
  color: var(--text-3);
  margin-top: 0.35rem;
  font-family: var(--font-mono);
}

/* SEO section — below editor */
.seo-section {
  margin-top: 2rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.seo-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background: var(--surface);
  border: none;
  cursor: pointer;
  padding: 0.75rem 1rem;
  font-family: var(--font-sans);
  border-bottom: 1px solid transparent;
  transition: background 0.15s;
}
.seo-toggle:hover { background: var(--surface-2); }

.seo-toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-2);
}

.seo-chevron {
  color: var(--text-3);
  font-size: 1rem;
  transition: transform 0.2s;
  display: inline-block;
}
.seo-chevron.open { transform: rotate(90deg); }

.seo-body {
  padding: 1.25rem;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--bg);
}

.seo-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.seo-field { display: flex; flex-direction: column; gap: 0.35rem; }

.seo-label {
  font-family: var(--font-mono);
  font-size: 0.67rem;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.seo-input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s;
  font-family: var(--font-sans);
  width: 100%;
}
.seo-input::placeholder { color: var(--text-3); }
.seo-input:focus { border-color: var(--accent); }

/* Google preview */
.seo-preview {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem 1.1rem;
}
.seo-prev-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.6rem;
}
.seo-prev-title {
  font-size: 0.95rem;
  color: #8ab4f8;
  margin-bottom: 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.seo-prev-slug {
  font-size: 0.78rem;
  color: var(--green);
  margin-bottom: 0.3rem;
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.seo-prev-desc {
  font-size: 0.82rem;
  color: var(--text-2);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 640px) {
  .seo-row { grid-template-columns: 1fr; }
}

/* ── Field error ── */
.field-error { font-size: 0.82rem; }

/* Responsive */
@media (max-width: 900px) {
  .editor-layout { flex-direction: column; }
  .editor-sidebar {
    width: 100%;
    min-height: unset;
    border-top: 1px solid var(--border);
    border-right: none;
  }
  .editor-main { padding: 2rem 1.5rem 3rem; border-right: none; }
}
</style>

# AX CMS — Supabase + Vue 3 Blog CMS

A production-ready headless CMS for managing blog content. Built with Vue 3 + Supabase. Designed to be used alongside a **Next.js frontend** that reads from the same Supabase database.

Built by [axdigitalagency.com](https://www.axdigitalagency.com) and [atashaekh.com](https://www.atashaekh.com).

---

## What this is

This is the **admin/editor panel only** — not the public-facing site. It lets you:
- Log in securely with email + password
- Create, edit, delete blog posts
- Upload cover images to Supabase Storage
- Set categories, tags, excerpt, slug
- Write rich content (headings, bold, links, lists, code blocks, etc.)
- Control publish/draft status
- Set SEO meta title and description with a live Google preview

The **Next.js frontend** (separate project) reads published posts from the same Supabase database using the public anon key.

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Build tool | Vite |
| Language | TypeScript |
| State | Pinia |
| Routing | Vue Router |
| Database + Auth | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Rich editor | Tiptap |
| Styling | CSS custom properties (dark editorial theme) |

---

## Project structure

```
src/
├── lib/
│   └── supabaseClient.ts       # Supabase client init
├── stores/
│   └── auth.ts                 # Auth state (signIn, signUp, signOut)
├── router/
│   └── index.ts                # Routes + auth guard
├── views/
│   ├── LoginView.vue           # Login + signup page
│   ├── DashboardView.vue       # Main dashboard (lists all posts)
│   └── BlogEditorView.vue      # Create / edit post
├── components/
│   ├── BlogList.vue            # Post list with category filter + CRUD actions
│   └── RichEditor.vue          # Tiptap rich text editor with toolbar
└── App.vue                     # Shell: topbar + footer
```

---

## Supabase setup (do this first for every new project)

### 1. Create a new Supabase project

Go to [supabase.com](https://supabase.com) → New project.

### 2. Create the blogs table

Run this in **SQL Editor**:

```sql
CREATE TABLE blogs (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title            TEXT        NOT NULL,
  slug             TEXT        NOT NULL UNIQUE,
  excerpt          TEXT,
  content          TEXT        NOT NULL,
  cover_image_url  TEXT,
  category         TEXT,
  tags             TEXT[]      DEFAULT '{}',
  meta_title       TEXT,
  meta_description TEXT,
  author_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name      TEXT,
  published        BOOLEAN     DEFAULT false,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX blogs_slug_idx   ON blogs(slug);
CREATE INDEX blogs_published_idx     ON blogs(published, published_at DESC);
CREATE INDEX blogs_category_idx      ON blogs(category);
CREATE INDEX blogs_tags_idx          ON blogs USING GIN(tags);
CREATE INDEX blogs_fts_idx           ON blogs
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(excerpt,'') || ' ' || content));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published" ON blogs FOR SELECT            USING (published = true);
CREATE POLICY "Auth read all"         ON blogs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert"           ON blogs FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Auth update own"       ON blogs FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Auth delete own"       ON blogs FOR DELETE TO authenticated USING (auth.uid() = author_id);
```

### 3. Create the image storage bucket

- Go to **Storage → New bucket**
- Name: `blog-images`
- Toggle **Public bucket** ON → Create

Then run in **SQL Editor**:

```sql
CREATE POLICY "Auth upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

CREATE POLICY "Auth delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'blog-images');
```

### 4. Create your admin user

- Go to **Authentication → Users → Add user**
- Enter email + password → Create user

Or use the Sign Up form in the app (turn off email confirmation in **Authentication → Providers → Email** for development).

---

## CMS setup

### 1. Clone and install

```sh
npm install
```

### 2. Set environment variables

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these in **Supabase → Project Settings → API**.

### 3. Run

```sh
npm run dev
```

Open `http://localhost:5173` — you'll be redirected to `/login`.

### 4. Build for production

```sh
npm run build
```

---

## Blog post fields

| Field | Type | Description |
|---|---|---|
| `title` | Text | Post title |
| `slug` | Text (unique) | URL path — auto-generated from title, editable |
| `content` | HTML | Rich text body (from Tiptap editor) |
| `excerpt` | Text | Short summary shown in listings |
| `cover_image_url` | URL | Featured image — upload or paste URL |
| `category` | Text | Single category |
| `tags` | Text[] | Multiple tags (Enter or comma to add) |
| `author_name` | Text | Display name |
| `meta_title` | Text | SEO title (max 60 chars) |
| `meta_description` | Text | SEO description (max 160 chars) |
| `published` | Boolean | Draft vs published |
| `published_at` | Timestamp | Set automatically when published |

---

## Connecting a Next.js frontend

The Next.js site reads from the same Supabase project. Only published posts are visible to the public (RLS enforces this).

### Install in Next.js

```sh
npm install @supabase/supabase-js
```

### `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### `lib/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Fetch all published posts

```ts
const { data: posts } = await supabase
  .from('blogs')
  .select('id, title, slug, excerpt, cover_image_url, category, tags, published_at, author_name')
  .eq('published', true)
  .order('published_at', { ascending: false })
```

### Fetch a single post by slug

```ts
const { data: post } = await supabase
  .from('blogs')
  .select('*')
  .eq('slug', slug)
  .eq('published', true)
  .single()

// Render HTML content:
<div dangerouslySetInnerHTML={{ __html: post.content }} />
```

### Filter by category

```ts
const { data: posts } = await supabase
  .from('blogs')
  .select('id, title, slug, excerpt, cover_image_url, published_at')
  .eq('published', true)
  .eq('category', 'Technology')
  .order('published_at', { ascending: false })
```

### Generate static paths (for SSG)

```ts
export async function generateStaticParams() {
  const { data } = await supabase
    .from('blogs')
    .select('slug')
    .eq('published', true)

  return data?.map(post => ({ slug: post.slug })) ?? []
}
```

---

## Architecture

```
Supabase (PostgreSQL + Auth + Storage)
         ↑ write (CRUD)              ↓ read (published only)
  AX CMS — Vue 3 (this repo)     Next.js public site
  localhost:5173                  localhost:3000
  /login                          /blog
  /                               /blog/[slug]
  /blog/new                       /blog/category/[cat]
  /blog/:id/edit
```

---

## Reusing for a new project checklist

- [ ] Create new Supabase project
- [ ] Run the `blogs` table SQL
- [ ] Create `blog-images` storage bucket + policies
- [ ] Create admin user in Supabase Auth
- [ ] Update `.env` with new project URL and anon key
- [ ] Update branding in `App.vue` (`brand-name`) and `LoginView.vue` (`form-eyebrow`)
- [ ] Run `npm install && npm run dev`
- [ ] Set up Next.js frontend with same Supabase credentials

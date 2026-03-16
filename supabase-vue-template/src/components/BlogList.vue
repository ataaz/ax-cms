<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabaseClient';

interface Blog {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const blogs = ref<Blog[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

async function fetchBlogs() {
  try {
    loading.value = true;
    const { data, error: fetchError } = await supabase
      .from('blogs')
      .select('id, title, content, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    if (data) {
      blogs.value = data;
    }
  } catch (err: any) {
    console.error('Error fetching blogs:', err.message);
    error.value = 'Failed to fetch blogs: ' + err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchBlogs();
});
</script>

<template>
  <div class="blog-list">
    <h1>Blog Posts</h1>
    <p v-if="loading">Loading blogs...</p>
    <p v-if="error" class="error">{{ error }}</p>
    <div v-if="blogs.length > 0">
      <div v-for="blog in blogs" :key="blog.id" class="blog-item">
        <h2>{{ blog.title }}</h2>
        <p>{{ blog.content }}</p>
        <small>Published: {{ new Date(blog.created_at).toLocaleDateString() }}</small>
      </div>
    </div>
    <p v-else-if="!loading && !error">No blogs found. Start by adding one!</p>
  </div>
</template>

<style scoped>
.blog-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.blog-item {
  background-color: #f9f9f9;
  border: 1px solid #eee;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
}

.blog-item h2 {
  color: #333;
  margin-top: 0;
}

.blog-item p {
  color: #555;
  line-height: 1.6;
}

.blog-item small {
  color: #888;
  font-size: 0.8em;
}

.error {
  color: red;
  font-weight: bold;
}
</style>

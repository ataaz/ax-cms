<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { watch } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Link.configure({ openOnClick: false }),
    Placeholder.configure({ placeholder: 'Start writing your post…' }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  editorProps: {
    attributes: { class: 'rich-content' },
  },
})

// Sync external value changes (e.g. when loading a post)
watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val)
  }
})

function setLink() {
  const url = prompt('Enter URL:')
  if (!url) return
  if (url === '') {
    editor.value?.chain().focus().unsetLink().run()
  } else {
    editor.value?.chain().focus().setLink({ href: url }).run()
  }
}
</script>

<template>
  <div class="rich-editor">
    <!-- Toolbar -->
    <div v-if="editor" class="toolbar">
      <div class="toolbar-group">
        <button
          class="tb-btn"
          :class="{ active: editor.isActive('heading', { level: 1 }) }"
          title="Heading 1"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        >H1</button>
        <button
          class="tb-btn"
          :class="{ active: editor.isActive('heading', { level: 2 }) }"
          title="Heading 2"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        >H2</button>
        <button
          class="tb-btn"
          :class="{ active: editor.isActive('heading', { level: 3 }) }"
          title="Heading 3"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        >H3</button>
        <button
          class="tb-btn"
          :class="{ active: editor.isActive('paragraph') }"
          title="Paragraph"
          @click="editor.chain().focus().setParagraph().run()"
        >¶</button>
      </div>

      <div class="toolbar-sep" />

      <div class="toolbar-group">
        <button
          class="tb-btn"
          :class="{ active: editor.isActive('bold') }"
          title="Bold"
          @click="editor.chain().focus().toggleBold().run()"
        ><b>B</b></button>
        <button
          class="tb-btn"
          :class="{ active: editor.isActive('italic') }"
          title="Italic"
          @click="editor.chain().focus().toggleItalic().run()"
        ><i>I</i></button>
        <button
          class="tb-btn"
          :class="{ active: editor.isActive('strike') }"
          title="Strikethrough"
          @click="editor.chain().focus().toggleStrike().run()"
        ><s>S</s></button>
        <button
          class="tb-btn"
          :class="{ active: editor.isActive('code') }"
          title="Inline code"
          @click="editor.chain().focus().toggleCode().run()"
        >&lt;/&gt;</button>
      </div>

      <div class="toolbar-sep" />

      <div class="toolbar-group">
        <button
          class="tb-btn"
          :class="{ active: editor.isActive('bulletList') }"
          title="Bullet list"
          @click="editor.chain().focus().toggleBulletList().run()"
        >• —</button>
        <button
          class="tb-btn"
          :class="{ active: editor.isActive('orderedList') }"
          title="Ordered list"
          @click="editor.chain().focus().toggleOrderedList().run()"
        >1. —</button>
        <button
          class="tb-btn"
          :class="{ active: editor.isActive('blockquote') }"
          title="Blockquote"
          @click="editor.chain().focus().toggleBlockquote().run()"
        >"</button>
        <button
          class="tb-btn"
          title="Code block"
          :class="{ active: editor.isActive('codeBlock') }"
          @click="editor.chain().focus().toggleCodeBlock().run()"
        >{ }</button>
      </div>

      <div class="toolbar-sep" />

      <div class="toolbar-group">
        <button
          class="tb-btn"
          :class="{ active: editor.isActive('link') }"
          title="Add link"
          @click="setLink"
        >🔗</button>
        <button
          class="tb-btn"
          title="Remove link"
          :disabled="!editor.isActive('link')"
          @click="editor.chain().focus().unsetLink().run()"
        >✂</button>
        <button
          class="tb-btn"
          title="Horizontal rule"
          @click="editor.chain().focus().setHorizontalRule().run()"
        >—</button>
      </div>

      <div class="toolbar-sep" />

      <div class="toolbar-group">
        <button
          class="tb-btn"
          title="Undo"
          :disabled="!editor.can().undo()"
          @click="editor.chain().focus().undo().run()"
        >↩</button>
        <button
          class="tb-btn"
          title="Redo"
          :disabled="!editor.can().redo()"
          @click="editor.chain().focus().redo().run()"
        >↪</button>
      </div>
    </div>

    <!-- Editor area -->
    <EditorContent :editor="editor" class="editor-area" />
  </div>
</template>

<style scoped>
.rich-editor {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: border-color 0.2s;
}

.rich-editor:focus-within {
  border-color: var(--accent);
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.2rem;
  padding: 0.5rem 0.6rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.toolbar-sep {
  width: 1px;
  height: 18px;
  background: var(--border-2);
  margin: 0 0.2rem;
}

.tb-btn {
  background: none;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--text-2);
  cursor: pointer;
  font-size: 0.78rem;
  font-family: var(--font-mono);
  font-weight: 500;
  padding: 0.2rem 0.45rem;
  line-height: 1.4;
  transition: all 0.15s;
  min-width: 26px;
  text-align: center;
}

.tb-btn:hover:not(:disabled) {
  background: var(--surface-2);
  border-color: var(--border-2);
  color: var(--text);
}

.tb-btn.active {
  background: rgba(201, 120, 74, 0.15);
  border-color: rgba(201, 120, 74, 0.3);
  color: var(--accent-h);
}

.tb-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Editor content area */
.editor-area {
  background: transparent;
}
</style>

<!-- Global styles for Tiptap content (not scoped) -->
<style>
.rich-content {
  min-height: 420px;
  padding: 1.25rem 1.5rem;
  outline: none;
  font-family: var(--font-sans);
  font-size: 1rem;
  color: var(--text);
  line-height: 1.85;
  caret-color: var(--accent);
}

.rich-content p { margin-bottom: 1em; }
.rich-content p:last-child { margin-bottom: 0; }

.rich-content h1 {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: 400;
  color: var(--text);
  line-height: 1.2;
  margin: 1.5em 0 0.5em;
}
.rich-content h2 {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--text);
  line-height: 1.3;
  margin: 1.4em 0 0.4em;
}
.rich-content h3 {
  font-family: var(--font-serif);
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--text);
  line-height: 1.4;
  margin: 1.2em 0 0.35em;
}

.rich-content strong { font-weight: 600; color: var(--text); }
.rich-content em { font-style: italic; }
.rich-content s { text-decoration: line-through; color: var(--text-2); }

.rich-content a {
  color: var(--accent-h);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.rich-content a:hover { color: var(--accent); }

.rich-content code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: var(--surface-2);
  border: 1px solid var(--border-2);
  border-radius: 3px;
  padding: 0.1em 0.4em;
  color: var(--accent-h);
}

.rich-content pre {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
  margin: 1em 0;
  overflow-x: auto;
}
.rich-content pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.875rem;
  color: var(--text);
}

.rich-content blockquote {
  border-left: 3px solid var(--accent);
  margin: 1em 0;
  padding: 0.25em 0 0.25em 1.25em;
  color: var(--text-2);
  font-style: italic;
}

.rich-content ul {
  list-style: disc;
  padding-left: 1.5em;
  margin: 0.75em 0;
}
.rich-content ol {
  list-style: decimal;
  padding-left: 1.5em;
  margin: 0.75em 0;
}
.rich-content li { margin-bottom: 0.3em; }

.rich-content hr {
  border: none;
  border-top: 1px solid var(--border-2);
  margin: 2em 0;
}

/* Placeholder */
.rich-content p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: var(--text-3);
  pointer-events: none;
  float: left;
  height: 0;
}
</style>

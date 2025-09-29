<template>
  <div class="tiptap-editor">
    <!-- Toolbar -->
    <div class="editor-toolbar">
      <v-btn
        :class="{ 'is-active': editor?.isActive('bold') }"
        icon="mdi-format-bold"
        size="x-small"
        variant="text"
        @click="editor?.chain().focus().toggleBold().run()"
      />
      <v-btn
        :class="{ 'is-active': editor?.isActive('italic') }"
        icon="mdi-format-italic"
        size="x-small"
        variant="text"
        @click="editor?.chain().focus().toggleItalic().run()"
      />
      <v-btn
        :class="{ 'is-active': editor?.isActive('strike') }"
        icon="mdi-format-strikethrough"
        size="x-small"
        variant="text"
        @click="editor?.chain().focus().toggleStrike().run()"
      />
      <v-divider vertical />
      <v-btn
        :class="{ 'is-active': editor?.isActive('heading', { level: 1 }) }"
        icon="mdi-format-header-1"
        size="x-small"
        variant="text"
        @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
      />
      <v-btn
        :class="{ 'is-active': editor?.isActive('heading', { level: 2 }) }"
        icon="mdi-format-header-2"
        size="x-small"
        variant="text"
        @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
      />
      <v-btn
        :class="{ 'is-active': editor?.isActive('heading', { level: 3 }) }"
        icon="mdi-format-header-3"
        size="x-small"
        variant="text"
        @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
      />
      <v-divider vertical />
      <v-btn
        :class="{ 'is-active': editor?.isActive('bulletList') }"
        icon="mdi-format-list-bulleted"
        size="x-small"
        variant="text"
        @click="editor?.chain().focus().toggleBulletList().run()"
      />
      <v-btn
        :class="{ 'is-active': editor?.isActive('orderedList') }"
        icon="mdi-format-list-numbered"
        size="x-small"
        variant="text"
        @click="editor?.chain().focus().toggleOrderedList().run()"
      />
      <v-divider vertical />
      <v-btn
        icon="mdi-format-quote-close"
        size="x-small"
        variant="text"
        @click="editor?.chain().focus().toggleBlockquote().run()"
      />
    </div>

    <!-- Editor Content -->
    <div class="editor-content">
      <EditorContent :editor="editor" :model-value="modelValue" />
    </div>

    <!-- Link Dialog -->
    <v-dialog v-model="linkDialog" max-width="500">
      <v-card>
        <v-card-title>{{ linkDialogTitle }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="linkUrl"
            label="URL"
            placeholder="https://example.com"
            variant="outlined"
            @keydown.enter="confirmLink"
          />
          <v-text-field
            v-model="linkText"
            label="Link Text (optional)"
            placeholder="Display text"
            variant="outlined"
            @keydown.enter="confirmLink"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelLink">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!linkUrl.trim()"
            @click="confirmLink"
          >
            {{ isEditingLink ? 'Update' : 'Add' }} Link
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
  import StarterKit from '@tiptap/starter-kit'
  import { Editor, EditorContent } from '@tiptap/vue-3'

  export default {
    name: 'CreateText',
    components: {
      EditorContent,
    },
    props: {
      modelValue: {
        type: String,
        default: '',
      },
      autofocus: {
        type: String,
        default: 'end',
      },
    },
    emits: ['update:modelValue'],
    data() {
      return {
        editor: null,
        linkDialog: false,
        linkUrl: '',
        linkText: '',
        isEditingLink: false,
      }
    },
    computed: {
      linkDialogTitle() {
        return this.isEditingLink ? 'Edit Link' : 'Add Link'
      }
    },
    mounted() {
      this.editor = new Editor({
        content: this.modelValue,
        extensions: [
          StarterKit.configure({
            codeBlock: false,
            code: false,
            link: {
              openOnClick: false,
              HTMLAttributes: {
                class: 'text-link',
              },
            }
          })
        ],
        autofocus: this.autofocus,
        onUpdate: ({ editor }) => {
          const text = editor.getHTML()
          this.$emit('update:modelValue', text)
        },
      })
    },
    beforeUnmount() {
      this.editor.destroy()
    },
    methods: {
      handleUpdate(value: string) {
        this.$emit('update:modelValue', value)
      },
      setLink() {
        const { from, to } = this.editor.state.selection
        const linkAttributes = this.editor.getAttributes('link')

        this.isEditingLink = !!linkAttributes.href
        this.linkUrl = linkAttributes.href || ''
        this.linkText = this.editor.state.doc.textBetween(from, to)

        this.linkDialog = true
      },
      confirmLink() {
        if (!this.linkUrl.trim()) {
          return
        }

        if (this.isEditingLink) {
          // Update existing link
          this.editor.chain().focus().extendMarkRange('link').setLink({ href: this.linkUrl }).run()
        } else {
          // Create new link
          if (this.linkText.trim()) {
            // Replace selected text with link
            this.editor.chain().focus().insertContent(`<a href="${this.linkUrl}">${this.linkText}</a>`).run()
          } else {
            // Link the selected text
            this.editor.chain().focus().setLink({ href: this.linkUrl }).run()
          }
        }

        this.closeLinkDialog()
      },
      cancelLink() {
        this.closeLinkDialog()
      },
      closeLinkDialog() {
        this.linkDialog = false
        this.linkUrl = ''
        this.linkText = ''
        this.isEditingLink = false
        this.editor.commands.focus()
      },
    },
  }
</script>

<style scoped>
.tiptap-editor {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  flex-wrap: wrap;
}

.editor-toolbar .v-btn.is-active {
  background-color: #1976d2 !important;
  color: white !important;
}

.editor-toolbar .v-btn {
  min-width: 28px !important;
  height: 28px !important;
}

.editor-toolbar .v-divider {
  margin: 0 2px;
  height: 20px;
}

.editor-content {
  min-height: 200px;
}

:deep(.ProseMirror) {
  padding: 12px;
  min-height: 200px;
  outline: none;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.ProseMirror h1) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.5em 0;
}

:deep(.ProseMirror h2) {
  font-size: 1.3em;
  font-weight: bold;
  margin: 0.5em 0;
}

:deep(.ProseMirror h3) {
  font-size: 1.1em;
  font-weight: bold;
  margin: 0.5em 0;
}

:deep(.ProseMirror blockquote) {
  border-left: 3px solid #e0e0e0;
  padding-left: 12px;
  margin: 12px 0;
  font-style: italic;
}

:deep(.ProseMirror a) {
  color: #1976d2;
  text-decoration: underline;
  cursor: pointer;
}

:deep(.ProseMirror a:hover) {
  color: #1565c0;
}

:deep(.ProseMirror ul, .ProseMirror ol) {
  padding-left: 0;
  margin: 4px 0;
}

:deep(.ProseMirror ol) {
  counter-reset: list-counter;
}

:deep(.ProseMirror ol li) {
  counter-increment: list-counter;
  list-style: none;
  position: relative;
  padding-left: 16px;
  margin: 0;
  line-height: 1.4;
}

:deep(.ProseMirror ol li::before) {
  content: counter(list-counter) ". ";
  position: absolute;
  left: 0;
  top: 0;
  font-weight: normal;
  line-height: 1.4;
}

:deep(.ProseMirror ul li) {
  list-style: none;
  position: relative;
  padding-left: 16px;
  margin: 0;
  line-height: 1.4;
}

:deep(.ProseMirror ul li::before) {
  content: "• ";
  position: absolute;
  left: 0;
  top: 0;
  color: #666;
  line-height: 1.4;
}
</style>

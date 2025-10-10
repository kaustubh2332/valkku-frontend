<template>
  <div class="plan-part-item" v-bind="$attrs">
    <div
      v-if="item.type === 'text'"
      class="item-content"
      :class="[{ [`item-content-${item.id}`]: true }, { 'flash-border': flash }]"
      @dblclick="editing ? edit() : null"
    >
      <div class="d-flex align-center" style="width: 100%;">
        <div style="flex: 1;">
          <div v-html="item.item?.text || item.text" />
        </div>
      </div>
      <div v-if="editing" class="plan-part-item-actions">
        <v-btn
          class="plan-part-item-edit"
          size="x-small"
          variant="text"
          @click="edit()"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn
          class="plan-part-item-remove"
          size="x-small"
          variant="text"
          @click="remove()"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
    </div>

    <BottomSheetModal
      v-model="creatingText"
      :title="$t('events.create_text')"
    >
      <CreateText
        :initial="creatingTextText"
        @add="onTextEdited"
        @close="creatingText = false"
      />
    </BottomSheetModal>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'PlanPartItem',
    inheritAttrs: false,
    props: {
      item: {
        type: Object,
        required: true
      },
      flash: {
        type: Boolean,
        default: false
      },
      editing: {
        type: Boolean,
        default: true
      }
    },
    emits: ['edit', 'remove'],
    data() {
      return {
        creatingText: false,
        creatingTextText: ''
      }
    },
    methods: {
      edit() {
        if (this.item.type === 'text') {
          this.creatingTextText = this.item.item?.text || this.item.text
          this.creatingText = true
        }
      },
      onTextEdited(text: string) {
        this.$emit('edit', { ...this.item, item: { text } })
        this.creatingTextText = text
        this.creatingText = false
      },
      remove() {
        this.$emit('remove', this.item)
      }
    }
  }
</script>

<style scoped>
.plan-part-item {
  width: 100%;
  flex-grow: 1;
}

.item-content {
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 6px;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-content:hover {
  border-color: #1976d2;
  background-color: rgba(25, 118, 210, 0.04);
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.1);
}

.plan-part-item-actions {
  display: flex;
  gap: 4px;
}

.plan-part-item-edit,
.plan-part-item-remove {
  min-width: 24px;
  height: 24px;
}

.plan-part-item-remove {
  color: #f44336;
}

.plan-part-item-remove:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

/* Fix bullet point positioning for HTML content */
.item-content :deep(ul) {
  margin-left: 16px;
  padding-left: 8px;
}

.item-content :deep(ol) {
  margin-left: 16px;
  padding-left: 8px;
}

.item-content :deep(li) {
  margin-left: 0;
  padding-left: 4px;
}

.item-content :deep(p) {
  margin: 0 0 4px 0;
}

.item-content :deep(p:last-child) {
  margin-bottom: 0;
}

/* Support for blockquotes */
.item-content :deep(blockquote) {
  border-left: 4px solid #e0e0e0;
  margin: 8px 0;
  padding: 8px 16px;
  background-color: #f5f5f5;
  font-style: italic;
  color: #2e2e2e;
}

.item-content :deep(blockquote p) {
  margin: 0;
}

/* Support for links */
.item-content :deep(a) {
  color: #1976d2;
  text-decoration: underline;
  cursor: pointer;
}

.item-content :deep(a:hover) {
  color: #1565c0;
}

/* Support for headings */
.item-content :deep(h1) {
  font-size: 24px;
  font-weight: bold;
  margin: 12px 0 8px 0;
  color: #333;
}

.item-content :deep(h2) {
  font-size: 20px;
  font-weight: bold;
  margin: 10px 0 6px 0;
  color: #333;
}

.item-content :deep(h3) {
  font-size: 18px;
  font-weight: bold;
  margin: 8px 0 4px 0;
  color: #333;
}

/* Support for text formatting */
.item-content :deep(em) {
  font-style: italic;
}

.item-content :deep(s) {
  text-decoration: line-through;
}

.item-content :deep(strong) {
  font-weight: bold;
}

.flash-border {
  animation: flash-border 0.6s ease-in-out 1;
}
@keyframes flash-border {
  0% { box-shadow: 0 0 0 0 rgba(25,118,210,0.4); border: 1px solid rgba(25,118,210,0.6); }
  50% { box-shadow: 0 0 0 6px rgba(25,118,210,0.0); border: 1px solid rgba(25,118,210,1); }
  100% { box-shadow: 0 0 0 0 rgba(25,118,210,0.0); border: 1px solid transparent; }
}
</style>

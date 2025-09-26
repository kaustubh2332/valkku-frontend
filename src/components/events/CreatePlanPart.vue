<template>
  <div>
    <!-- TITLE BAR -->
    <div class="d-flex align-center">
      <div
        class="d-flex align-center px-2"
        :style="`height: 35px; width: 100%; border: 1px solid grey; border-left: 9px solid ${part.color}; border-radius: 5px;`"
        @dblclick="startEditTitle"
      >
        <template v-if="editingTitle">
          <v-text-field
            v-model="localTitle"
            autofocus
            class="mr-2"
            density="compact"
            hide-details
            variant="outlined"
            @blur="saveTitle"
            @keydown.enter.prevent="saveTitle"
            @keydown.esc.prevent="cancelEditTitle"
          />
          <v-btn size="x-small" variant="text" @click="saveTitle">
            <v-icon size="16">mdi-check</v-icon>
          </v-btn>
          <v-btn size="x-small" variant="text" @click="cancelEditTitle">
            <v-icon size="16">mdi-close</v-icon>
          </v-btn>
        </template>
        <template v-else>
          <div class="text-subtitle-2 text-truncate">{{ part.title }}</div>
          <v-spacer />
          <v-btn size="x-small" variant="text" @click.stop="startEditTitle">
            <v-icon size="16">mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            fab
            rounded
            size="x-small"
            variant="text"
            @click.stop="$emit('remove', part)"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </div>
      <div style="margin-left: 2px; cursor: grab;">
        <v-icon size="16">mdi-drag-vertical</v-icon>
      </div>
    </div>

    <div class="d-flex">
      <!-- SIDE LINE -->
      <div :style="`width: 4px; background-color: ${part.color}; margin-left: 5px;`" />
      <!-- CONTENT -->
      <div class="pa-2">
        <v-btn size="x-small" variant="text">
          <v-icon>mdi-plus</v-icon>
          {{ $t('events.add_text') }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'CreatePlanPart',
    props: {
      part: {
        type: Object,
        default: () => ({})
      },
      colors: {
        type: Array,
        default: () => []
      }
    },
    emits: ['update:part', 'remove'],
    data() {
      return {
        editingTitle: false,
        localTitle: this.part?.title || ''
      }
    },
    watch: {
      part: {
        deep: true,
        handler(newVal) {
          if (!this.editingTitle) {
            this.localTitle = newVal?.title || ''
          }
        }
      }
    },
    methods: {
      startEditTitle() {
        this.localTitle = this.part?.title || ''
        this.editingTitle = true
      },
      saveTitle() {
        const title = (this.localTitle || '').trim()
        const updated = { ...this.part, title }
        this.$emit('update:part', updated)
        this.editingTitle = false
      },
      cancelEditTitle() {
        this.localTitle = this.part?.title || ''
        this.editingTitle = false
      }
    }
  }
</script>

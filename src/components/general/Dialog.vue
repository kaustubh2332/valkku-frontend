<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="$vuetify.display.mobile"
    max-width="600"
  >
    <v-card>
      <div
        class="pa-2"
        style="position: absolute; top: 0; right: 0;"
      >
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
        />
      </div>

      <slot />
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
  export default {
    name: 'GeneralDialog',
    props: {
      modelValue: {
        type: Boolean,
        default: false
      }
    },
    emits: ['update:modelValue'],
    computed: {
      dialog: {
        get() {
          return this.modelValue
        },
        set(value) {
          this.$emit('update:modelValue', value)
        }
      }
    },
    methods: {
      closeDialog() {
        this.dialog = false
      }
    }
  }
</script>

<template>
  <BottomSheetModal
    v-model="isOpen"
    :title="resolvedTitle"
    :height="height"
    v-bind="$attrs"
  >
    <div class="confirm-container">
      <div class="confirm-text text-body-1 mb-6">
        {{ resolvedText }}
      </div>

      <div class="d-flex justify-end ga-2">
        <v-btn
          variant="tonal"
          @click="handleCancel"
        >
          {{ resolvedCancelText }}
        </v-btn>
        <v-spacer />
        <v-btn
          :color="acceptColor"
          :loading="loading"
          @click="handleAccept"
        >
          {{ resolvedAcceptText }}
        </v-btn>
      </div>
    </div>
  </BottomSheetModal>

</template>

<script lang="ts">
  import BottomSheetModal from '@/components/general/BottomSheetModal.vue'

  export default {
    name: 'Confirm',
    components: { BottomSheetModal },
    inheritAttrs: false,
    props: {
      modelValue: {
        type: Boolean,
        default: false
      },
      title: {
        type: String,
        default: ''
      },
      text: {
        type: String,
        default: ''
      },
      cancelText: {
        type: String,
        default: ''
      },
      acceptText: {
        type: String,
        default: ''
      },
      height: {
        type: String,
        default: '40vh'
      },
      acceptColor: {
        type: String,
        default: 'error'
      },
      loading: {
        type: Boolean,
        default: false
      }
    },
    emits: ['update:modelValue', 'cancel', 'accept'],
    computed: {
      isOpen: {
        get(): boolean {
          return this.modelValue
        },
        set(value: boolean) {
          this.$emit('update:modelValue', value)
        }
      },
      resolvedTitle(): string {
        return this.title || this.$t('app.title')
      },
      resolvedText(): string {
        return this.text || this.$t('areYouSure')
      },
      resolvedCancelText(): string {
        return this.cancelText || this.$t('cancel')
      },
      resolvedAcceptText(): string {
        return this.acceptText || this.$t('ok')
      }
    },
    methods: {
      handleCancel() {
        this.isOpen = false
        this.$emit('cancel')
      },
      handleAccept() {
        this.isOpen = false
        this.$emit('accept')
      }
    }
  }
</script>

<style scoped>
.confirm-container {
  max-width: 700px;
  margin: 0 auto;
}

.confirm-text {
  white-space: pre-line;
}
</style>

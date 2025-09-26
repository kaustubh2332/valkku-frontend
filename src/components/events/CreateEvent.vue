<template>
  <div class="pa-2">
    <v-form ref="form" v-model="formValid" @submit.prevent="save">
      <v-text-field
        v-model="title"
        autofocus
        class="mb-4"
        hide-details="auto"
        :label="$t('events.title')"
        :rules="titleRules"
        variant="outlined"
      />

      <CreatePlan />
      <div class="d-flex justify-end ga-2">
        <v-btn variant="text" @click="cancel">{{ $t('cancel') }}</v-btn>
        <v-spacer />
        <v-btn color="primary" :disabled="!formValid" @click="save">{{ $t('events.create_event') }}</v-btn>
      </div>
    </v-form>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'CreateEvent',
    emits: ['close', 'saved'],
    data() {
      return {
        formValid: false,
        title: ''
      }
    },
    computed: {
      titleRules() {
        return [
          (v: string) => !!(v && v.trim().length > 0) || this.$t('events.titleRequired')
        ]
      }
    },
    methods: {
      cancel() {
        this.$emit('close')
      },
      save() {
        if (!this.formValid) return
        const payload = { title: this.title.trim() }
        this.$emit('saved', payload)
        this.$emit('close')
      }
    }
  }
</script>

<style scoped>
</style>

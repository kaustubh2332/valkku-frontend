<template>
  <div>
    <div
      v-for="(part, index) in parts"
      :key="`plan-part-${index}`"
    >
      <CreatePlanPart
        :colors="colors"
        :part="part"
        @remove="handlePartRemove(index)"
        @update="handlePartChange($event, index)"
      />
    </div>
    <v-btn size="small" @click="addEmptyPart">
      <v-icon class="mr-2">mdi-plus</v-icon>
      {{ $t('events.add_plan_part') }}
    </v-btn>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'CreatePlan',
    data() {
      return {
        parts: [],
        colors: [
          '#6366F1', // Indigo - Modern and professional
          '#EC4899', // Pink - Vibrant and energetic
          '#10B981', // Emerald - Fresh and natural
          '#F59E0B', // Amber - Warm and inviting
          '#8B5CF6', // Violet - Creative and elegant
          '#EF4444', // Red - Bold and attention-grabbing
          '#06B6D4', // Cyan - Cool and refreshing
          '#84CC16', // Lime - Bright and lively
          '#F97316'  // Orange - Friendly and enthusiastic
        ]
      }
    },
    methods: {
      handlePartChange(part: any, index: number) {
        this.parts[index] = part
      },
      addEmptyPart() {
        this.parts.push({
          title: this.$t('events.new_part'),
          color: this.colors[0]
        })
      },
      handlePartRemove(index: number) {
        this.parts.splice(index, 1)
      }
    }
  }
</script>

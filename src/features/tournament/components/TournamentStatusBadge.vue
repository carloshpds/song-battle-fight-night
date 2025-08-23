<template>
  <v-chip
    :color="statusColor"
    :variant="statusVariant"
    size="small"
    class="tournament-status-badge"
  >
    <v-icon start :icon="statusIcon" />
    {{ statusText }}
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TournamentStatus } from '../types/tournament.types'

interface Props {
  status: TournamentStatus
}

const props = defineProps<Props>()

const statusConfig = computed(() => {
  switch (props.status) {
    case 'active':
      return {
        color: 'success',
        variant: 'tonal' as const,
        icon: 'mdi-sword-cross',
        text: 'Active'
      }
    case 'completed':
      return {
        color: 'primary',
        variant: 'elevated' as const,
        icon: 'mdi-trophy',
        text: 'Complete'
      }
    case 'paused':
      return {
        color: 'warning',
        variant: 'tonal' as const,
        icon: 'mdi-pause',
        text: 'Paused'
      }
    default:
      return {
        color: 'surface-variant',
        variant: 'tonal' as const,
        icon: 'mdi-help',
        text: 'Unknown'
      }
  }
})

const statusColor = computed(() => statusConfig.value.color)
const statusVariant = computed(() => statusConfig.value.variant)
const statusIcon = computed(() => statusConfig.value.icon)
const statusText = computed(() => statusConfig.value.text)
</script>

<style scoped>
.tournament-status-badge {
  font-weight: 500;
}
</style>

<template>
  <v-card>
    <v-card-title>
      <v-icon class="mr-2">mdi-tournament</v-icon>
      Tournament Mode
    </v-card-title>

    <v-card-text>
      <v-radio-group v-model="selectedMode" column>
        <v-radio
          v-for="mode in availableModes"
          :key="mode.mode"
          :value="mode.mode"
        >
          <template #label>
            <div>
              <div class="font-weight-medium">{{ mode.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ mode.description }}</div>
              <div class="text-caption text-success mt-1">
                Minimum tracks: {{ getModeConfig(mode.mode).requireMinimumTracks }}
              </div>
            </div>
          </template>
        </v-radio>
      </v-radio-group>

      <!-- Configurações específicas do modo -->
      <v-divider class="my-4" />

      <div v-if="selectedMode === 'deathmatch'" class="mt-4">
        <h4 class="text-subtitle-1 mb-3">Death Match Settings</h4>
        <v-text-field
          v-model.number="deathMatchConfig.targetScore"
          label="Target Score"
          hint="First track to reach this score wins"
          type="number"
          min="5"
          max="25"
          density="compact"
          variant="outlined"
        />
        <v-text-field
          v-model.number="deathMatchConfig.maxBattles"
          label="Maximum Battles"
          hint="Tournament ends after this many battles"
          type="number"
          min="20"
          max="100"
          density="compact"
          variant="outlined"
          class="mt-2"
        />
      </div>

      <div v-if="selectedMode === 'groups'" class="mt-4">
        <h4 class="text-subtitle-1 mb-3">Group Stage Settings</h4>
        <v-text-field
          v-model.number="groupsConfig.groupSize"
          label="Group Size"
          hint="Number of tracks per group"
          type="number"
          min="3"
          max="6"
          density="compact"
          variant="outlined"
        />
        <v-text-field
          v-model.number="groupsConfig.qualifiersPerGroup"
          label="Qualifiers per Group"
          hint="How many advance from each group to playoffs"
          type="number"
          min="1"
          :max="groupsConfig.groupSize - 1"
          density="compact"
          variant="outlined"
          class="mt-2"
        />
      </div>

      <div v-if="selectedMode === 'swiss'" class="mt-4">
        <h4 class="text-subtitle-1 mb-3">Swiss System Settings</h4>
        <v-text-field
          v-model.number="swissConfig.rounds"
          label="Number of Rounds"
          hint="How many rounds to play (recommended: log2 of tracks + 1)"
          type="number"
          min="3"
          max="10"
          density="compact"
          variant="outlined"
        />
      </div>

      <div v-if="selectedMode === 'roundrobin'" class="mt-4">
        <h4 class="text-subtitle-1 mb-3">Round Robin Settings</h4>
        <v-alert type="info" density="compact">
          Every track will face every other track exactly once.
          Total battles: {{ calculateRoundRobinBattles(trackCount) }}
        </v-alert>
      </div>

      <div v-if="selectedMode === 'elimination'" class="mt-4">
        <h4 class="text-subtitle-1 mb-3">Elimination Settings</h4>
        <v-alert type="info" density="compact">
          Classic single elimination tournament bracket.
          Total battles needed: {{ Math.max(0, trackCount - 1) }}
        </v-alert>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTournamentStore } from '../stores/tournamentStore'
import { TournamentStrategyFactory } from '../strategies/TournamentStrategyFactory'
import type { TournamentMode } from '../strategies/base/StrategyTypes'

interface Props {
  modelValue: TournamentMode
  trackCount: number
}

interface Emits {
  (e: 'update:modelValue', value: TournamentMode): void
  (e: 'update:config', value: Record<string, any>): void
}

const props = withDefaults(defineProps<Props>(), {
  trackCount: 0
})
const emit = defineEmits<Emits>()

const tournamentStore = useTournamentStore()

const selectedMode = ref<TournamentMode>(props.modelValue)
const deathMatchConfig = ref({
  targetScore: 10,
  maxBattles: Math.max(50, props.trackCount * 5)
})
const groupsConfig = ref({
  groupSize: 4,
  qualifiersPerGroup: 2
})
const swissConfig = ref({
  rounds: Math.max(3, Math.ceil(Math.log2(props.trackCount || 4)) + 1)
})

const availableModes = computed(() => tournamentStore.getAvailableModes())

const getModeConfig = (mode: TournamentMode) => {
  return TournamentStrategyFactory.getStrategy(mode).config
}

const calculateRoundRobinBattles = (trackCount: number): number => {
  return trackCount > 1 ? (trackCount * (trackCount - 1)) / 2 : 0
}

watch(selectedMode, (newMode) => {
  emit('update:modelValue', newMode)

  // Emit mode-specific config
  let config = {}
  if (newMode === 'deathmatch') {
    config = deathMatchConfig.value
  } else if (newMode === 'groups') {
    config = groupsConfig.value
  } else if (newMode === 'swiss') {
    config = swissConfig.value
  }

  emit('update:config', config)
})

watch([deathMatchConfig, groupsConfig, swissConfig], () => {
  let config = {}
  if (selectedMode.value === 'deathmatch') {
    config = deathMatchConfig.value
  } else if (selectedMode.value === 'groups') {
    config = groupsConfig.value
  } else if (selectedMode.value === 'swiss') {
    config = swissConfig.value
  }

  emit('update:config', config)
}, { deep: true })

// Update config when track count changes
watch(() => props.trackCount, (newCount) => {
  deathMatchConfig.value.maxBattles = Math.max(50, newCount * 5)
  swissConfig.value.rounds = Math.max(3, Math.ceil(Math.log2(newCount || 4)) + 1)
})
</script>

<style scoped>
.v-radio :deep(.v-label) {
  opacity: 1 !important;
}
</style>

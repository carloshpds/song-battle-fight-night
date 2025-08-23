<template>
  <v-container fluid>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 mb-2">Your Tournaments</h1>
        <p class="text-body-1 text-medium-emphasis">
          Manage your music battle tournaments and view results
        </p>
      </div>

      <v-btn
        color="primary"
        size="large"
        prepend-icon="mdi-plus"
        @click="$router.push('/spotify/import')"
      >
        New Tournament
      </v-btn>
    </div>

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="4">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h3 text-primary mb-2">{{ tournamentStore.tournamentsCount }}</div>
            <div class="text-body-2 text-medium-emphasis">Total Tournaments</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h3 text-success mb-2">{{ tournamentStore.activeTournaments.length }}</div>
            <div class="text-body-2 text-medium-emphasis">Active Tournaments</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h3 text-info mb-2">{{ tournamentStore.completedTournaments.length }}</div>
            <div class="text-body-2 text-medium-emphasis">Completed Tournaments</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              label="Search tournaments"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              label="Filter by status"
              :items="statusFilterItems"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="sortBy"
              label="Sort by"
              :items="sortByItems"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <div v-if="tournamentStore.isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="mt-4 text-h6">Loading tournaments...</p>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="tournamentStore.error" type="error" class="mb-6">
      {{ tournamentStore.error }}
      <template #append>
        <v-btn
          size="small"
          variant="text"
          @click="tournamentStore.clearError"
        >
          Dismiss
        </v-btn>
      </template>
    </v-alert>

    <!-- Empty State -->
    <v-card v-else-if="filteredTournaments.length === 0" class="text-center py-12">
      <v-card-text>
        <v-icon size="64" color="medium-emphasis" class="mb-4">
          mdi-tournament
        </v-icon>
        <h3 class="text-h6 mb-2">
          {{ tournamentStore.tournamentsCount === 0 ? 'No tournaments yet' : 'No tournaments match your filters' }}
        </h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ tournamentStore.tournamentsCount === 0
            ? 'Create your first tournament by importing a playlist from Spotify'
            : 'Try adjusting your search or filter criteria'
          }}
        </p>
        <v-btn
          v-if="tournamentStore.tournamentsCount === 0"
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          @click="$router.push('/spotify/import')"
        >
          Create Your First Tournament
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Tournament Grid -->
    <v-row v-else>
      <v-col
        v-for="tournament in paginatedTournaments"
        :key="tournament.id"
        cols="12"
        md="6"
      >
        <TournamentCard
          :tournament="tournament"
          @continue="continueTournament"
          @pause="pauseTournament"
          @resume="resumeTournament"
          @delete="showDeleteDialog"
        />
      </v-col>
    </v-row>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="text-center mt-6">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        :total-visible="7"
      />
    </div>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          <v-icon class="mr-2" color="error">mdi-delete</v-icon>
          Delete Tournament
        </v-card-title>

        <v-card-text>
          Are you sure you want to delete <strong>{{ deleteDialog.tournament?.name }}</strong>?
          This action cannot be undone and all battle history will be lost.
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog.show = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="isDeleting"
            @click="confirmDelete"
          >
            Delete Tournament
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <tournament-results-modal
      v-model="showTournamentResults"
      :tournament="activeTournamentInHistory"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTournamentStore } from '../stores/tournamentStore'
import { useBattleStore } from '@/features/battle/stores/battleStore'
import TournamentCard from '../components/TournamentCard.vue'
import type { Tournament } from '../types/tournament.types'
import TournamentResultsModal from '../components/TournamentResultsModal.vue'

const router = useRouter()
const tournamentStore = useTournamentStore()
const battleStore = useBattleStore()

// Reactive state
const searchQuery = ref('')
const statusFilter = ref('all')
const sortBy = ref('newest')
const currentPage = ref(1)
const itemsPerPage = 6
const isDeleting = ref(false)
const showTournamentResults = ref(false)
const activeTournamentInHistory = ref<Tournament | null>(null)

const deleteDialog = ref<{
  show: boolean
  tournament: Tournament | null
}>({
  show: false,
  tournament: null
})

// Filter and sort options
const statusFilterItems = [
  { title: 'All', value: 'all' },
  { title: 'Active', value: 'active' },
  { title: 'Completed', value: 'completed' },
  { title: 'Paused', value: 'paused' }
]

const sortByItems = [
  { title: 'Newest First', value: 'newest' },
  { title: 'Oldest First', value: 'oldest' },
  { title: 'Name A-Z', value: 'name-asc' },
  { title: 'Name Z-A', value: 'name-desc' },
  { title: 'Progress', value: 'progress' }
]

// Computed
const filteredTournaments = computed(() => {
  let filtered = [...tournamentStore.tournaments]

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(tournament =>
      tournament.name.toLowerCase().includes(query)
    )
  }

  // Filter by status
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(tournament => tournament.status === statusFilter.value)
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'name-asc':
        return a.name.localeCompare(b.name)
      case 'name-desc':
        return b.name.localeCompare(a.name)
      case 'progress':
        return b.progress.progressPercentage - a.progress.progressPercentage
      default:
        return 0
    }
  })

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredTournaments.value.length / itemsPerPage))

const paginatedTournaments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredTournaments.value.slice(start, end)
})

// Methods
const continueTournament = async (tournamentId: string) => {
  try {
    const tournament = tournamentStore.getTournamentById(tournamentId)
    if (tournament?.status === 'completed') {
      activeTournamentInHistory.value = tournament
      showTournamentResults.value = true
    } else {
      const continuedTournament = tournamentStore.continueTournament(tournamentId)
      // Get next matchup and start battle
      const nextMatchup = tournamentStore.getNextMatchup(continuedTournament)

      if (nextMatchup) {
        // Set up battle store with tournament tracks
        await battleStore.loadTracksFromPlaylist(continuedTournament.playlistId)
        router.push('/battle')
      } else {
        console.error('Cannot determine next matchup for tournament')
      }
    }
  } catch (error) {
    console.error('Failed to continue tournament:', error)
  }
}

const pauseTournament = async (tournamentId: string) => {
  try {
    await tournamentStore.pauseTournament(tournamentId)
  } catch (error) {
    console.error('Failed to pause tournament:', error)
  }
}

const resumeTournament = async (tournamentId: string) => {
  try {
    await tournamentStore.resumeTournament(tournamentId)
  } catch (error) {
    console.error('Failed to resume tournament:', error)
  }
}

const showDeleteDialog = (tournamentId: string) => {
  const tournament = tournamentStore.tournaments.find(t => t.id === tournamentId)
  if (tournament) {
    deleteDialog.value = {
      show: true,
      tournament
    }
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.value.tournament) return

  isDeleting.value = true

  try {
    await tournamentStore.deleteTournament(deleteDialog.value.tournament.id)
    deleteDialog.value.show = false
  } catch (error) {
    console.error('Failed to delete tournament:', error)
  } finally {
    isDeleting.value = false
  }
}

// Initialize
onMounted(() => {
  tournamentStore.initializeTournaments()
})
</script>

<style scoped>
.tournament-grid {
  min-height: 400px;
}
</style>

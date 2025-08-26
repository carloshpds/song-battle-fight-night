import { computed, ref } from 'vue'
import { useTournamentStore } from '../stores/tournamentStore'
import type { Tournament } from '../types/tournament.types'

export function useTournamentLogic(tournamentId?: string) {
  const tournamentStore = useTournamentStore()

  const selectedTournament = ref<Tournament | null>(null)

  const tournament = computed(() => {
    if (tournamentId) {
      return tournamentStore.tournaments.find(t => t.id === tournamentId) || null
    }
    return selectedTournament.value
  })

  const canContinue = computed(() => {
    if (!tournament.value) return false

    return tournament.value.status === 'active' &&
           tournament.value.progress.remainingTracks.length > 1
  })

  const isComplete = computed(() => {
    return tournament.value?.status === 'completed'
  })

  const nextMatchup = computed(() => {
    if (!tournament.value || !canContinue.value) return null

    return tournamentStore.getNextMatchup(tournament.value)
  })

  const progressText = computed(() => {
    if (!tournament.value) return ''

    const progress = tournament.value.progress
    return `${progress.battlesCompleted}/${progress.battlesCompleted + progress.battlesRemaining} battles`
  })

  const statusText = computed(() => {
    if (!tournament.value) return ''

    switch (tournament.value.status) {
      case 'active':
        return `${tournament.value.progress.remainingTracks.length} tracks remaining`
      case 'completed':
        return `Champion: ${tournament.value.champion?.name}`
      case 'paused':
        return 'Tournament paused'
      default:
        return ''
    }
  })

  const setSelectedTournament = (tournament: Tournament | null) => {
    selectedTournament.value = tournament
  }

  const formatDuration = (startDate: Date, endDate?: Date) => {
    const end = endDate || new Date()
    const diffMs = end.getTime() - startDate.getTime()

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  return {
    tournament,
    canContinue,
    isComplete,
    nextMatchup,
    progressText,
    statusText,
    setSelectedTournament,
    formatDuration,

    // Store actions
    createTournament: tournamentStore.createTournament,
    continueTournament: tournamentStore.continueTournament,
    pauseTournament: tournamentStore.pauseTournament,
    resumeTournament: tournamentStore.resumeTournament,
    deleteTournament: tournamentStore.deleteTournament,
  }
}

import type { Tournament, TournamentProgress } from '../types/tournament.types'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'
import type { Battle } from '@/features/battle/types/battle.types'

export class TournamentService {
  /**
   * Calculate the initial progress for a new tournament
   */
  static calculateInitialProgress(tracks: SpotifyTrack[]): TournamentProgress {
    const totalTracks = tracks.length
    const totalBattles = Math.max(0, totalTracks - 1) // Single elimination needs n-1 battles
    const totalRounds = totalTracks > 1 ? Math.ceil(Math.log2(totalTracks)) : 1

    return {
      totalTracks,
      battlesCompleted: 0,
      battlesRemaining: totalBattles,
      currentRound: 1,
      totalRounds,
      eliminatedTracks: [],
      remainingTracks: [...tracks],
      progressPercentage: 0
    }
  }

  /**
   * Update tournament progress after a battle completion
   */
  static updateTournamentProgress(tournament: Tournament, completedBattle: Battle): void {
    const progress = tournament.progress
    const winnerId = completedBattle.winner

    if (!winnerId) return

    const loserId = completedBattle.trackA.id === winnerId
      ? completedBattle.trackB.id
      : completedBattle.trackA.id

    // Move loser to eliminated tracks
    const loserTrack = progress.remainingTracks.find(t => t.id === loserId)
    if (loserTrack) {
      progress.eliminatedTracks.push(loserTrack)
      progress.remainingTracks = progress.remainingTracks.filter(t => t.id !== loserId)
    }

    // Update battle counts
    progress.battlesCompleted++
    progress.battlesRemaining = Math.max(0, progress.totalTracks - 1 - progress.battlesCompleted)
    progress.progressPercentage = progress.totalTracks > 1
      ? (progress.battlesCompleted / (progress.totalTracks - 1)) * 100
      : 100

    // Update current round
    if (progress.remainingTracks.length > 1) {
      const tracksInCurrentRound = Math.pow(2, Math.floor(Math.log2(progress.remainingTracks.length)))
      const expectedRound = progress.totalRounds - Math.floor(Math.log2(tracksInCurrentRound)) + 1
      progress.currentRound = Math.max(1, Math.min(expectedRound, progress.totalRounds))
    } else {
      progress.currentRound = progress.totalRounds
    }
  }

  /**
   * Check if tournament should be completed
   */
  static shouldCompleteTournament(tournament: Tournament): boolean {
    return tournament.progress.remainingTracks.length <= 1
  }

  /**
   * Complete a tournament and set the champion
   */
  static completeTournament(tournament: Tournament): void {
    tournament.status = 'completed'
    tournament.completedAt = new Date()

    if (tournament.progress.remainingTracks.length === 1) {
      tournament.champion = tournament.progress.remainingTracks[0]
    }

    // Ensure progress is at 100%
    tournament.progress.progressPercentage = 100
    tournament.progress.battlesRemaining = 0
  }

  /**
   * Get two tracks for the next battle
   */
  static getNextMatchup(tournament: Tournament): { trackA: SpotifyTrack; trackB: SpotifyTrack } | null {
    const remaining = tournament.progress.remainingTracks

    if (remaining.length < 2) {
      return null
    }

    // Simple random selection for now
    // TODO: Implement more sophisticated pairing (e.g., bracket system)
    const shuffled = [...remaining].sort(() => 0.5 - Math.random())

    return {
      trackA: shuffled[0],
      trackB: shuffled[1]
    }
  }

  /**
   * Validate tournament data
   */
  static validateTournament(tournament: Partial<Tournament>): string[] {
    const errors: string[] = []

    if (!tournament.name?.trim()) {
      errors.push('Tournament name is required')
    }

    if (!tournament.playlistId?.trim()) {
      errors.push('Playlist ID is required')
    }

    if (!tournament.tracks || tournament.tracks.length < 2) {
      errors.push('Tournament must have at least 2 tracks')
    }

    if (tournament.tracks) {
      const tracksWithoutPreview = tournament.tracks.filter(track => !track.preview_url)
      if (tracksWithoutPreview.length > 0) {
        errors.push(`${tracksWithoutPreview.length} tracks don't have preview available`)
      }
    }

    return errors
  }

  /**
   * Calculate tournament statistics
   */
  static calculateTournamentStats(tournament: Tournament) {
    const totalDuration = tournament.completedAt
      ? tournament.completedAt.getTime() - tournament.createdAt.getTime()
      : Date.now() - tournament.createdAt.getTime()

    const avgBattleTime = tournament.battles.length > 0
      ? totalDuration / tournament.battles.length
      : 0

    return {
      totalDuration,
      avgBattleTime,
      battlesPerDay: tournament.battles.length > 0
        ? tournament.battles.length / (totalDuration / (1000 * 60 * 60 * 24))
        : 0,
      completionPercentage: tournament.progress.progressPercentage,
      tracksEliminated: tournament.progress.eliminatedTracks.length,
      tracksRemaining: tournament.progress.remainingTracks.length
    }
  }

  /**
   * Generate tournament bracket (for future use)
   */
  static generateBracket(tracks: SpotifyTrack[]): SpotifyTrack[][] {
    // Simple implementation - can be enhanced later
    const rounds: SpotifyTrack[][] = []
    let currentRound = [...tracks]

    while (currentRound.length > 1) {
      rounds.push([...currentRound])
      const nextRound: SpotifyTrack[] = []

      // Pair tracks for battles
      for (let i = 0; i < currentRound.length; i += 2) {
        if (i + 1 < currentRound.length) {
          // In a real tournament, we'd determine winners from battles
          // For now, just take the first track as a placeholder
          nextRound.push(currentRound[i])
        } else {
          // Odd number of tracks, this one advances automatically
          nextRound.push(currentRound[i])
        }
      }

      currentRound = nextRound
    }

    if (currentRound.length === 1) {
      rounds.push(currentRound)
    }

    return rounds
  }
}

import type {
  TournamentStrategy,
  TournamentStrategyConfig,
  BattleMatchup
} from '../base/TournamentStrategy.interface'
import type { Tournament, TournamentProgress } from '../../types/tournament.types'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'
import type { Battle } from '@/features/battle/types/battle.types'

interface GroupStanding {
  trackId: string
  track: SpotifyTrack
  groupId: string
  played: number
  won: number
  lost: number
  points: number
}

interface Group {
  id: string
  name: string
  tracks: SpotifyTrack[]
  standings: GroupStanding[]
  fixtures: Array<{
    trackAId: string
    trackBId: string
    completed: boolean
    winnerId?: string
  }>
  completed: boolean
}

interface GroupsData {
  groups: Group[]
  currentGroupIndex: number
  currentFixtureIndex: number
  groupSize: number
  qualifiersPerGroup: number
  playoffPhase: boolean
  playoffTracks: SpotifyTrack[]
  // ✅ FIX: Add playoff bracket management properties
  playoffMatchups?: Array<{
    trackAId: string
    trackBId: string
    completed: boolean
    winnerId?: string
  }>
  currentPlayoffMatchupIndex?: number
}

export class GroupsTournamentStrategy implements TournamentStrategy {
  readonly name = 'Group Stage'
  readonly description = 'Tournament divided into groups where all tracks in each group face each other. Best from each group advance to playoffs.'

  readonly config: TournamentStrategyConfig = {
    requireMinimumTracks: 6, // Minimum for 2 groups of 3
    allowSkipping: false,
    supportsPausing: true,
    supportsResuming: true
  }

  private readonly DEFAULT_GROUP_SIZE = 4
  private readonly DEFAULT_QUALIFIERS_PER_GROUP = 2

  initializeTournament(tracks: SpotifyTrack[]): TournamentProgress {
    const data = this.initializeGroupsData(tracks)
    const totalBattles = this.calculateTotalBattles(data)

    return {
      totalTracks: tracks.length,
      battlesCompleted: 0,
      battlesRemaining: totalBattles,
      currentRound: 1,
      totalRounds: 2, // Group stage + Playoffs
      eliminatedTracks: [],
      remainingTracks: [...tracks],
      progressPercentage: 0
    }
  }

  updateProgress(tournament: Tournament, completedBattle: Battle): TournamentProgress {
    const progress = { ...tournament.progress }
    const data = this.getStrategyData(tournament) as GroupsData

    if (!completedBattle.winner) return progress

    if (data.playoffPhase) {
      // Handle playoff battle (elimination style)
      this.handlePlayoffBattle(data, completedBattle, progress)
    } else {
      // Handle group stage battle
      this.handleGroupBattle(data, completedBattle, progress)
    }

    progress.battlesCompleted++
    progress.progressPercentage = (progress.battlesCompleted / (progress.battlesCompleted + progress.battlesRemaining)) * 100

    this.updateStrategyData(tournament, data)
    return progress
  }

  getNextMatchup(tournament: Tournament): BattleMatchup | null {
    const data = this.getStrategyData(tournament) as GroupsData

    if (data.playoffPhase) {
      return this.getPlayoffMatchup(data)
    } else {
      return this.getGroupMatchup(data)
    }
  }

  isCompleted(tournament: Tournament): boolean {
    const data = this.getStrategyData(tournament) as GroupsData
    return data.playoffPhase && data.playoffTracks.length <= 1
  }

  completeTournament(tournament: Tournament): Tournament {
    const updatedTournament = { ...tournament }
    const data = this.getStrategyData(tournament) as GroupsData

    updatedTournament.status = 'completed'
    updatedTournament.completedAt = new Date()

    if (data.playoffTracks.length === 1) {
      updatedTournament.champion = data.playoffTracks[0]
    }

    updatedTournament.progress.progressPercentage = 100
    updatedTournament.progress.battlesRemaining = 0

    return updatedTournament
  }

  validateTracks(tracks: SpotifyTrack[]): boolean {
    return tracks.length >= this.config.requireMinimumTracks
  }

  canStartBattle(tournament: Tournament): boolean {
    return !this.isCompleted(tournament) && tournament.status === 'active'
  }

  getStrategyData(tournament: Tournament): Record<string, any> {
    if (!tournament.strategyData.groups) {
      tournament.strategyData.groups = this.initializeGroupsData(tournament.tracks)
    }
    return tournament.strategyData.groups
  }

  updateStrategyData(tournament: Tournament, data: Record<string, any>): void {
    tournament.strategyData.groups = data
  }

  private initializeGroupsData(tracks: SpotifyTrack[]): GroupsData {
    const groupSize = this.DEFAULT_GROUP_SIZE
    const numGroups = Math.ceil(tracks.length / groupSize)
    const groups: Group[] = []

    // Shuffle tracks for random group assignment
    const shuffledTracks = [...tracks].sort(() => 0.5 - Math.random())

    for (let i = 0; i < numGroups; i++) {
      const groupTracks = shuffledTracks.slice(i * groupSize, (i + 1) * groupSize)
      const groupId = `group-${i + 1}`

      const group: Group = {
        id: groupId,
        name: `Group ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
        tracks: groupTracks,
        standings: groupTracks.map(track => ({
          trackId: track.id,
          track,
          groupId,
          played: 0,
          won: 0,
          lost: 0,
          points: 0
        })),
        fixtures: this.generateGroupFixtures(groupTracks),
        completed: false
      }

      groups.push(group)
    }

    return {
      groups,
      currentGroupIndex: 0,
      currentFixtureIndex: 0,
      groupSize,
      qualifiersPerGroup: Math.min(this.DEFAULT_QUALIFIERS_PER_GROUP, groupSize - 1),
      playoffPhase: false,
      playoffTracks: []
    }
  }

  private generateGroupFixtures(tracks: SpotifyTrack[]) {
    const fixtures = []
    for (let i = 0; i < tracks.length; i++) {
      for (let j = i + 1; j < tracks.length; j++) {
        fixtures.push({
          trackAId: tracks[i].id,
          trackBId: tracks[j].id,
          completed: false
        })
      }
    }
    return fixtures.sort(() => 0.5 - Math.random())
  }

  private calculateTotalBattles(data: GroupsData): number {
    let groupBattles = 0
    for (const group of data.groups) {
      groupBattles += group.fixtures.length
    }

    // Estimate playoff battles (assuming single elimination)
    const totalQualifiers = data.groups.length * data.qualifiersPerGroup
    const playoffBattles = Math.max(0, totalQualifiers - 1)

    return groupBattles + playoffBattles
  }

  private handleGroupBattle(data: GroupsData, battle: Battle, progress: TournamentProgress): void {
    const currentGroup = data.groups[data.currentGroupIndex]
    const fixture = currentGroup.fixtures[data.currentFixtureIndex]

    if (fixture && battle.winner) {
      fixture.completed = true
      fixture.winnerId = battle.winner

      // Update group standings
      this.updateGroupStandings(currentGroup, battle)

      data.currentFixtureIndex++

      // Check if current group is completed
      if (data.currentFixtureIndex >= currentGroup.fixtures.length) {
        currentGroup.completed = true
        data.currentGroupIndex++
        data.currentFixtureIndex = 0

        // Check if all groups are completed
        if (data.currentGroupIndex >= data.groups.length) {
          this.startPlayoffPhase(data)
          progress.currentRound = 2
        }
      }

      progress.battlesRemaining = this.calculateRemainingBattles(data)
    }
  }

  private handlePlayoffBattle(data: GroupsData, battle: Battle, progress: TournamentProgress): void {
    const loserId = battle.trackA.id === battle.winner ? battle.trackB.id : battle.trackA.id
    const loserTrack = data.playoffTracks.find(t => t.id === loserId)

    if (loserTrack) {
      // ✅ FIX: More rigorous elimination in playoffs
      data.playoffTracks = data.playoffTracks.filter(t => t.id !== loserId)
      progress.eliminatedTracks.push(loserTrack)
      progress.remainingTracks = data.playoffTracks

      console.log(`🏆 Groups Playoff: Track "${loserTrack.name}" eliminated. Remaining: ${data.playoffTracks.length}`)
    }

    // ✅ FIX: Mark current matchup as completed and advance to next
    if (data.playoffMatchups && data.currentPlayoffMatchupIndex !== undefined) {
      const currentMatchup = data.playoffMatchups[data.currentPlayoffMatchupIndex]
      if (currentMatchup) {
        currentMatchup.completed = true
        currentMatchup.winnerId = battle.winner || undefined
      }
      data.currentPlayoffMatchupIndex++

      // If all current round matchups are completed, prepare for next round
      const remainingMatchups = data.playoffMatchups.filter(m => !m.completed)
      if (remainingMatchups.length === 0 && data.playoffTracks.length > 1) {
        // Generate new round of matchups
        data.playoffMatchups = this.generatePlayoffMatchups(data.playoffTracks)
        data.currentPlayoffMatchupIndex = 0
        console.log(`🏆 Groups Playoff: New round started with ${data.playoffMatchups.length} matchups`)
      }
    }

    progress.battlesRemaining = Math.max(0, data.playoffTracks.length - 1)
  }

  private updateGroupStandings(group: Group, battle: Battle): void {
    if (!battle.winner) return

    const winnerId = battle.winner
    const loserId = battle.trackA.id === winnerId ? battle.trackB.id : battle.trackA.id

    const winner = group.standings.find(s => s.trackId === winnerId)
    const loser = group.standings.find(s => s.trackId === loserId)

    if (winner) {
      winner.played++
      winner.won++
      winner.points += 3
    }

    if (loser) {
      loser.played++
      loser.lost++
    }

    // Sort standings by points, then by wins
    group.standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.won !== a.won) return b.won - a.won
      return a.lost - b.lost
    })
  }

  private startPlayoffPhase(data: GroupsData): void {
    data.playoffPhase = true
    data.playoffTracks = []

    // Get qualifiers from each group
    for (const group of data.groups) {
      const qualifiers = group.standings
        .slice(0, data.qualifiersPerGroup)
        .map(s => s.track)
      data.playoffTracks.push(...qualifiers)
    }

    // Shuffle playoff tracks for random bracket
    data.playoffTracks = data.playoffTracks.sort(() => 0.5 - Math.random())
  }

  private getGroupMatchup(data: GroupsData): BattleMatchup | null {
    if (data.currentGroupIndex >= data.groups.length) return null

    const currentGroup = data.groups[data.currentGroupIndex]
    if (data.currentFixtureIndex >= currentGroup.fixtures.length) return null

    const fixture = currentGroup.fixtures[data.currentFixtureIndex]
    const trackA = currentGroup.tracks.find(t => t.id === fixture.trackAId)
    const trackB = currentGroup.tracks.find(t => t.id === fixture.trackBId)

    if (!trackA || !trackB) return null

    return {
      trackA,
      trackB,
      round: 1,
      group: currentGroup.name,
      metadata: {
        battleType: 'group',
        groupName: currentGroup.name,
        fixtureIndex: data.currentFixtureIndex,
        totalFixtures: currentGroup.fixtures.length
      }
    }
  }

  private getPlayoffMatchup(data: GroupsData): BattleMatchup | null {
    if (data.playoffTracks.length < 2) return null

    // ✅ FIX: Implement proper bracket-style matchups for playoffs
    if (!data.playoffMatchups || data.playoffMatchups.length === 0) {
      // Initialize playoff matchups if not already done
      data.playoffMatchups = this.generatePlayoffMatchups(data.playoffTracks)
      data.currentPlayoffMatchupIndex = 0
    }

    // Ensure index exists
    if (data.currentPlayoffMatchupIndex === undefined) {
      data.currentPlayoffMatchupIndex = 0
    }

    // Get next matchup from playoff bracket
    if (data.currentPlayoffMatchupIndex >= data.playoffMatchups.length) {
      return null // All matchups completed
    }

    const matchup = data.playoffMatchups[data.currentPlayoffMatchupIndex]
    const trackA = data.playoffTracks.find(t => t.id === matchup.trackAId)
    const trackB = data.playoffTracks.find(t => t.id === matchup.trackBId)

    if (!trackA || !trackB) {
      // Tracks not found (might have been eliminated), move to next matchup
      data.currentPlayoffMatchupIndex++
      return this.getPlayoffMatchup(data)
    }

    return {
      trackA,
      trackB,
      round: 2,
      metadata: {
        battleType: 'playoff',
        remainingTracks: data.playoffTracks.length,
        matchupIndex: data.currentPlayoffMatchupIndex,
        totalMatchups: data.playoffMatchups.length
      }
    }
  }

  /**
   * Generate bracket-style matchups for playoff phase
   */
  private generatePlayoffMatchups(tracks: SpotifyTrack[]): Array<{trackAId: string, trackBId: string, completed: boolean}> {
    const matchups = []
    const availableTracks = [...tracks]

    // Handle bye if odd number of tracks
    if (availableTracks.length % 2 === 1) {
      const byeTrack = availableTracks.pop()
      console.log(`🏆 Groups Playoff: Track "${byeTrack?.name}" advances with bye`)
    }

    // Create pairs for bracket
    for (let i = 0; i < availableTracks.length; i += 2) {
      if (i + 1 < availableTracks.length) {
        matchups.push({
          trackAId: availableTracks[i].id,
          trackBId: availableTracks[i + 1].id,
          completed: false
        })
      }
    }

    console.log(`🏆 Groups Playoff: ${matchups.length} matchups generated`)
    return matchups
  }

  private calculateRemainingBattles(data: GroupsData): number {
    let remaining = 0

    if (!data.playoffPhase) {
      // Count remaining group battles
      for (let i = data.currentGroupIndex; i < data.groups.length; i++) {
        const group = data.groups[i]
        if (i === data.currentGroupIndex) {
          remaining += group.fixtures.length - data.currentFixtureIndex
        } else {
          remaining += group.fixtures.length
        }
      }

      // Add playoff battles
      const totalQualifiers = data.groups.length * data.qualifiersPerGroup
      remaining += Math.max(0, totalQualifiers - 1)
    } else {
      // Only playoff battles remaining
      remaining = Math.max(0, data.playoffTracks.length - 1)
    }

    return remaining
  }
}

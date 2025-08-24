import type { TournamentStrategy } from './base/TournamentStrategy.interface'
import type { TournamentMode } from './base/StrategyTypes'
import { EliminationTournamentStrategy } from './elimination/EliminationTournamentStrategy'
import { DeathMatchTournamentStrategy } from './deathmatch/DeathMatchTournamentStrategy'
import { GroupsTournamentStrategy } from './groups/GroupsTournamentStrategy'
import { RoundRobinTournamentStrategy } from './roundrobin/RoundRobinTournamentStrategy'
import { SwissTournamentStrategy } from './swiss/SwissTournamentStrategy'

export class TournamentStrategyFactory {
  private static strategies = new Map<TournamentMode, () => TournamentStrategy>([
    ['elimination', () => new EliminationTournamentStrategy()],
    ['deathmatch', () => new DeathMatchTournamentStrategy()],
    ['groups', () => new GroupsTournamentStrategy()],
    ['roundrobin', () => new RoundRobinTournamentStrategy()],
    ['swiss', () => new SwissTournamentStrategy()]
  ])

  static getStrategy(mode: TournamentMode): TournamentStrategy {
    const strategyFactory = this.strategies.get(mode)
    
    if (!strategyFactory) {
      console.warn(`Tournament mode '${mode}' not found, using elimination strategy`)
      return new EliminationTournamentStrategy()
    }

    return strategyFactory()
  }

  static getAvailableModes(): TournamentMode[] {
    return Array.from(this.strategies.keys())
  }

  static getModeInfo(mode: TournamentMode): { name: string; description: string } | null {
    const strategy = this.getStrategy(mode)
    return {
      name: strategy.name,
      description: strategy.description
    }
  }
}

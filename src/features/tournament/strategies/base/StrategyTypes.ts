export type TournamentMode = 'elimination' | 'deathmatch' | 'groups' | 'roundrobin' | 'swiss'

export interface TournamentModeConfig {
  mode: TournamentMode
  parameters: Record<string, any>
}

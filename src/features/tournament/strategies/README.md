# Tournament Strategies System

This document describes the tournament strategies system implemented in the Music Battle Fight Night application.

## Overview

The tournament system uses the Strategy Pattern to support different tournament formats. Each strategy implements a common interface but provides unique behavior for tournament progression, matchmaking, and completion criteria.

## Architecture

```
src/features/tournament/strategies/
├── base/
│   ├── TournamentStrategy.interface.ts  # Core interface
│   └── StrategyTypes.ts                 # Type definitions
├── elimination/                         # Single elimination
├── deathmatch/                         # Score-based battles
├── roundrobin/                         # All vs all format
├── groups/                             # Group stage + playoffs
├── swiss/                              # Swiss system pairing
└── TournamentStrategyFactory.ts        # Strategy factory
```

## Available Tournament Modes

### 1. Single Elimination (`elimination`)
- **Description**: Classic tournament bracket where losing eliminates a track
- **Requirements**: Minimum 2 tracks
- **Duration**: n-1 battles (where n = number of tracks)
- **Best for**: Quick tournaments with clear progression

### 2. Death Match (`deathmatch`)
- **Description**: Continuous battles where tracks accumulate points
- **Requirements**: Minimum 2 tracks
- **Duration**: Until target score or maximum battles reached
- **Best for**: Extended play sessions, discovering strong performers
- **Configuration**:
  - Target score (default: 10)
  - Maximum battles (default: 50)

### 3. Round Robin (`roundrobin`)
- **Description**: Every track faces every other track exactly once
- **Requirements**: Minimum 3 tracks
- **Duration**: n(n-1)/2 battles
- **Best for**: Comprehensive comparison, fair results
- **Note**: Can become long with many tracks

### 4. Group Stage (`groups`)
- **Description**: Tracks divided into groups, then playoffs with qualifiers
- **Requirements**: Minimum 6 tracks
- **Duration**: Group matches + playoff elimination
- **Best for**: Large tournaments, World Cup style format
- **Configuration**:
  - Group size (default: 4)
  - Qualifiers per group (default: 2)

### 5. Swiss System (`swiss`)
- **Description**: Tracks paired based on similar performance, no elimination
- **Requirements**: Minimum 4 tracks
- **Duration**: Fixed number of rounds (typically log₂(n) + 1)
- **Best for**: Competitive balance, chess-tournament style

## Implementation Details

### Strategy Interface

All strategies implement the `TournamentStrategy` interface:

```typescript
interface TournamentStrategy {
  readonly name: string
  readonly description: string
  readonly config: TournamentStrategyConfig

  // Core lifecycle
  initializeTournament(tracks: SpotifyTrack[]): TournamentProgress
  updateProgress(tournament: Tournament, battle: Battle): TournamentProgress
  getNextMatchup(tournament: Tournament): BattleMatchup | null
  isCompleted(tournament: Tournament): boolean
  completeTournament(tournament: Tournament): Tournament

  // Validation
  validateTracks(tracks: SpotifyTrack[]): boolean
  canStartBattle(tournament: Tournament): boolean

  // Strategy-specific data
  getStrategyData(tournament: Tournament): Record<string, any>
  updateStrategyData(tournament: Tournament, data: Record<string, any>): void
}
```

### Strategy Factory

The `TournamentStrategyFactory` manages strategy instantiation:

```typescript
// Get strategy instance
const strategy = TournamentStrategyFactory.getStrategy('deathmatch')

// Get available modes
const modes = TournamentStrategyFactory.getAvailableModes()

// Get mode information
const info = TournamentStrategyFactory.getModeInfo('swiss')
```

### Data Storage

Each strategy can store custom data in `tournament.strategyData`:

```typescript
interface Tournament {
  // ... other fields
  mode: TournamentMode
  modeConfig: TournamentModeConfig
  strategyData: Record<string, any>  // Strategy-specific data
}
```

## Usage Examples

### Creating a Tournament

```typescript
import { useTournamentStore } from '../stores/tournamentStore'

const tournamentStore = useTournamentStore()

// Create death match tournament
await tournamentStore.createTournament({
  playlistId: 'playlist-123',
  playlistName: 'My Awesome Playlist',
  tracks: spotifyTracks,
  mode: 'deathmatch',
  modeConfig: {
    mode: 'deathmatch',
    parameters: {
      targetScore: 15,
      maxBattles: 75
    }
  }
})
```

### Getting Next Battle

```typescript
const tournament = tournamentStore.activeTournament
const matchup = tournamentStore.getNextMatchup(tournament)

if (matchup) {
  console.log(`Battle: ${matchup.trackA.name} vs ${matchup.trackB.name}`)
  console.log(`Round: ${matchup.round}`)
  console.log(`Metadata:`, matchup.metadata)
}
```

### Battle Completion

The system automatically handles battle completion through the strategy:

```typescript
// Battle result is processed by the active strategy
const battle = { /* completed battle */ }
await tournamentStore.onBattleCompleted(battle)

// Strategy updates progress, determines next matchup, checks completion
```

## UI Integration

### Mode Selection Component

The `TournamentModeSelector` component provides an interface for selecting tournament modes and configuring their parameters.

```vue
<TournamentModeSelector
  v-model="selectedMode"
  :track-count="trackCount"
  @update:config="handleConfigUpdate"
/>
```

### Battle View Updates

The `BattleView` automatically adapts to different tournament modes:

- Shows tournament progress for active tournaments
- Displays mode-specific information (groups, rounds, scores)
- Handles completion ceremonies for different modes

## Testing

Each strategy includes comprehensive unit tests covering:

- Tournament initialization
- Progress updates after battles
- Matchup generation
- Completion detection
- Edge cases and error conditions

Run strategy tests:
```bash
pnpm test -- --run src/features/tournament/strategies/
```

## Migration

The system automatically migrates existing tournaments:

- Legacy tournaments default to `elimination` mode
- Missing `strategyData` is initialized as empty object
- No data loss during migration

## Performance Considerations

- **Lazy Loading**: Strategies are instantiated on-demand
- **Efficient Pairing**: Swiss and group strategies optimize matchup calculation
- **Memory Management**: Large tournaments use efficient data structures
- **Caching**: Strategy data is cached in tournament object

## Extending the System

### Adding a New Strategy

1. Create strategy directory: `src/features/tournament/strategies/newmode/`
2. Implement `TournamentStrategy` interface
3. Add comprehensive tests
4. Update `TournamentStrategyFactory`
5. Update `StrategyTypes.ts` with new mode
6. Add UI configuration if needed

### Example: Adding Custom Strategy

```typescript
export class CustomTournamentStrategy implements TournamentStrategy {
  readonly name = 'Custom Tournament'
  readonly description = 'My custom tournament format'

  readonly config: TournamentStrategyConfig = {
    requireMinimumTracks: 4,
    allowSkipping: true,
    supportsPausing: true,
    supportsResuming: true
  }

  // Implement all interface methods...
}
```

## Future Enhancements

Planned improvements include:

- **Double Elimination**: Loser's bracket system
- **Seasonal Leagues**: Multi-tournament campaigns
- **Custom Scoring**: Configurable point systems
- **Team Tournaments**: Artist vs artist battles
- **Time-based Modes**: Speed tournaments with time limits

## Troubleshooting

### Common Issues

1. **"Insufficient tracks" error**: Check minimum track requirements per mode
2. **Strategy not found**: Ensure mode is registered in factory
3. **Migration issues**: Check browser console for storage errors
4. **Progress calculation**: Verify battle completion logic

### Debug Mode

Enable debug logging:
```typescript
// Add to tournament strategy
console.log('🎵 Tournament:', tournament.name)
console.log('🏆 Progress:', tournament.progress)
console.log('📊 Strategy Data:', tournament.strategyData)
```

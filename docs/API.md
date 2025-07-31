# API Documentation

## Core Game Systems

### Game Store (`/src/stores/gameStore.ts`)

The central state management for the game using Zustand.

#### State Properties
```typescript
interface GameState {
  // Resources
  money: number;
  reputation: number;
  fans: number;
  stress: number;
  connections: number;
  
  // Game progression
  currentRound: number;
  currentPhase: GamePhase;
  
  // Entities
  venues: Venue[];
  allBands: Band[];
  rosterBandIds: string[];
  scheduledShows: Show[];
  
  // History
  showHistory: ShowResult[];
  discoveredSynergies: string[];
}
```

#### Key Actions
- `addMoney(amount: number)`: Modify money (can be negative)
- `addReputation(amount: number)`: Modify reputation  
- `addFans(amount: number)`: Modify fan count
- `addStress(amount: number)`: Modify stress level
- `scheduleShow(show: Show)`: Add show to schedule
- `completeShow(showId: string, result: ShowResult)`: Mark show as complete
- `discoverSynergy(synergyId: string)`: Track synergy discovery
- `saveGame()`: Persist game state
- `loadGame()`: Restore game state

### Turn Processor (`/src/game/mechanics/TurnProcessor.ts`)

Handles end-of-turn calculations and show execution.

```typescript
class TurnProcessor {
  processNextTurn(): {
    showResults: ShowResult[];
    totalVenueRent: number;
    dayJobResult?: DayJobResult;
    difficultyEvent?: DifficultyEvent;
  }
}
```

### Synergy System (`/src/game/mechanics/SynergySystemV2.ts`)

Discovers and calculates synergy bonuses.

```typescript
interface Synergy {
  id: string;
  name: string;
  description: string;
  requirements: SynergyRequirement;
  effects: SynergyEffect[];
  multiplier: number;
}

class SynergySystemV2 {
  checkSynergies(bands: Band[], venue: Venue, context: SynergyContext): Synergy[]
  calculateTotalMultiplier(synergies: Synergy[]): number
  discoverSynergy(synergyId: string): void
}
```

### Difficulty System (`/src/game/mechanics/DifficultySystem.ts`)

Manages game difficulty scaling.

```typescript
interface DifficultyFactors {
  rentMultiplier: number;
  bandCostMultiplier: number;
  ticketPriceResistance: number;
  fanExpectations: number;
  reputationDecay: number;
}

class DifficultySystem {
  getCurrentDifficulty(): DifficultyFactors
  applyPassiveDifficulty(): { reputationLost: number; message?: string }
  getScaledVenueCost(baseRent: number): number
}
```

## UI Components

### Accessible Components

All UI components follow WCAG 2.1 AA standards.

#### AccessibleButton
```tsx
<AccessibleButton
  variant="primary" // primary | secondary | danger | ghost
  size="md"         // sm | md | lg
  loading={false}
  disabled={false}
  haptic="light"    // light | medium | success | error
  onClick={() => {}}
>
  Click Me
</AccessibleButton>
```

#### AccessibleModal
```tsx
<AccessibleModal
  isOpen={true}
  onClose={() => {}}
  title="Modal Title"
  size="md"              // sm | md | lg | xl
  closeOnOverlayClick
  announceOnOpen="Modal opened"
>
  <ModalContent />
</AccessibleModal>
```

#### AccessibleCard
```tsx
<AccessibleCard
  title="Band Name"
  description="Genre: Punk"
  ariaDescription="Band Name, Punk band with 80 popularity"
  selected={false}
  disabled={false}
  onClick={() => {}}
  icon="🎸"
  badge={<Badge />}
>
  <CardContent />
</AccessibleCard>
```

### Mobile Components

#### BottomSheet
```tsx
<BottomSheet
  isOpen={true}
  onClose={() => {}}
  title="Sheet Title"
  snapPoints={[25, 75]}    // Percentages of screen height
  defaultSnapPoint={0}
  showHandle={true}
>
  <SheetContent />
</BottomSheet>
```

#### SwipeableTabs
```tsx
<SwipeableTabs
  tabs={[
    { id: 'tab1', label: 'Tab 1', icon: '🎸', content: <Tab1 /> },
    { id: 'tab2', label: 'Tab 2', icon: '🎵', content: <Tab2 /> }
  ]}
  defaultTab="tab1"
  onTabChange={(tabId) => {}}
  showIndicator={true}
/>
```

#### PullToRefresh
```tsx
<PullToRefresh
  onRefresh={async () => {
    await fetchNewData();
  }}
  threshold={80}
  disabled={false}
>
  <ScrollableContent />
</PullToRefresh>
```

## Hooks

### Touch & Gesture Hooks

#### useTouch
```typescript
const touchHandlers = useTouch({
  onTap: (position) => {},
  onDoubleTap: (position) => {},
  onLongPress: (position) => {},
  onSwipe: (direction, distance) => {},
  onDragStart: (position) => {},
  onDragMove: (position, delta) => {},
  onDragEnd: (position) => {},
  enableHaptics: true,
  longPressDelay: 500,
  swipeThreshold: 50
});

<div {...touchHandlers}>Touch Me</div>
```

#### usePinchZoom
```typescript
const { scale, pinchZoomHandlers, reset, setScale } = usePinchZoom({
  minScale: 1,
  maxScale: 3,
  onZoomStart: (scale) => {},
  onZoomChange: (scale) => {},
  onZoomEnd: (scale) => {}
});

<div {...pinchZoomHandlers}>
  <ZoomableContent style={{ transform: `scale(${scale})` }} />
</div>
```

### Accessibility Hooks

#### useFocusTrap
```typescript
const containerRef = useFocusTrap(isActive);

<div ref={containerRef}>
  <FocusableContent />
</div>
```

#### useEscapeKey
```typescript
useEscapeKey(() => {
  closeModal();
}, isModalOpen);
```

#### useAnnouncement
```typescript
const announce = useAnnouncement();

// Announce to screen readers
announce('Show booked successfully', 'polite');
```

## Utilities

### Balance Configuration (`/src/game/config/balanceConfig.ts`)

Central configuration for all game balance values.

```typescript
BALANCE_CONFIG = {
  STARTING: { MONEY: 500, REPUTATION: 10, ... },
  ECONOMY: { VENUE_RENT: {...}, BAND_FEES: {...} },
  PROGRESSION: { REPUTATION: {...}, FANS: {...} },
  SHOWS: { ATTENDANCE: {...}, SYNERGIES: {...} },
  DIFFICULTY: { ROUNDS: {...}, MULTIPLIERS: {...} }
}
```

### Mobile Utilities (`/src/utils/mobile.ts`)

Platform detection and haptic feedback.

```typescript
// Check platform
isNative: boolean
getPlatform(): 'ios' | 'android' | 'web'

// Haptic feedback
haptics.light()
haptics.medium()
haptics.heavy()
haptics.success()
haptics.warning()
haptics.error()
```

### Storage Utilities (`/src/utils/safeStorage.ts`)

Safe localStorage wrapper with fallbacks.

```typescript
safeStorage.getItem(key: string): any
safeStorage.setItem(key: string, value: any): void
safeStorage.removeItem(key: string): void
safeStorage.clear(): void
```

### Performance Metrics (`/src/utils/performanceMetrics.ts`)

Track performance of operations.

```typescript
performanceMetrics.startMeasure('operation-name');
// ... do work ...
const duration = performanceMetrics.endMeasure('operation-name');

// Track lazy loading
await performanceMetrics.trackLazyLoad('module-name', async () => {
  return await import('./module');
});
```
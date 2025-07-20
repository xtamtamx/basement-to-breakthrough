# Basement to Breakthrough - Quick Reference Guide

## Current Implementation Status

### ✅ Completed Features
- Pixel art UI with glassmorphism effects
- Drag-and-drop band booking
- Basic game loop (book → execute → results)
- Turn-based progression
- Resource management (money, reputation, fans)
- Victory/defeat conditions
- Tutorial system
- Sound effects (Web Audio API)

### 🚧 In Progress
- Phase 1: Scene Politics & Faction System

### 📋 Upcoming Phases
1. Scene Politics & Factions
2. Infrastructure & Equipment
3. Advanced Synergies & Roguelike
4. Districts & Dynamic World
5. Polish & Content

## Key Files Reference

### Core Game Logic
- `/src/game/types/core.ts` - All type definitions ("Game Bible")
- `/src/game/mechanics/ShowExecutor.ts` - Show execution logic
- `/src/game/mechanics/BookingSystem.ts` - Booking validation
- `/src/game/mechanics/BandGenerator.ts` - Band generation
- `/src/stores/gameStore.ts` - Main game state

### UI Components
- `/src/components/game/UnifiedGameView.tsx` - Main game screen
- `/src/components/game/DraggablePixelBandCard.tsx` - Band cards
- `/src/components/game/PixelVenueCard.tsx` - Venue cards
- `/src/components/game/AnimatedShowResults.tsx` - Show results

### Styling
- `/src/styles/pixel-art.css` - Pixel art theme
- `/src/styles/glassmorphism.css` - Glass effects
- `/src/index.css` - Global styles

## Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Production build
npm run lint            # Run linter

# Mobile
npm run build:mobile    # Build for mobile
npm run cap:sync        # Sync with native
npm run cap:open:ios    # Open in Xcode
npm run cap:open:android # Open Android Studio
```

## Implementation Checklist

### When Adding New Features
- [ ] Update types in `/src/game/types/core.ts`
- [ ] Create mechanics in `/src/game/mechanics/`
- [ ] Update game store if needed
- [ ] Create UI components with pixel-art styling
- [ ] Add mobile touch support
- [ ] Test on mobile viewport (375x667)
- [ ] Update save/load system
- [ ] Add sound effects
- [ ] Update tutorial if needed

### Performance Checklist
- [ ] Components use React.memo where appropriate
- [ ] Large lists use virtualization
- [ ] Images are optimized and lazy loaded
- [ ] Animations use CSS transforms
- [ ] Touch targets are minimum 44px
- [ ] No blocking operations in render

### Style Guidelines
- Use pixel-art classes from `/src/styles/pixel-art.css`
- Maintain 8px grid system
- Use CSS variables for colors
- Keep mobile-first responsive design
- Test with system font size scaling

## Common Patterns

### Adding a New Game System
```typescript
// 1. Define types in core.ts
export interface NewSystem {
  id: string;
  // ... properties
}

// 2. Create mechanic class
class NewSystemManager {
  // Implementation
}
export const newSystemManager = new NewSystemManager();

// 3. Update game store
interface GameStore {
  newSystemData: NewSystem[];
  updateNewSystem: (data: NewSystem) => void;
}

// 4. Create UI component
export const NewSystemDisplay: React.FC = () => {
  // Component with pixel-art styling
};
```

### Adding Touch Interactions
```typescript
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

const handleInteraction = () => {
  haptics.light(); // or .medium(), .heavy()
  audio.play('click'); // or other sound effects
  // Handle interaction
};
```

## Phase 1 Implementation Guide

### Current Task: Faction System

1. **Create Faction Types** (in core.ts)
   - Define Faction interface
   - Create FactionType enum
   - Add faction relationships

2. **Build FactionSystem.ts**
   - Faction reputation tracking
   - Faction modifiers calculation
   - Faction event generation

3. **Update ShowExecutor.ts**
   - Apply faction modifiers to shows
   - Calculate faction reputation changes
   - Trigger faction events

4. **Create FactionDisplay.tsx**
   - Show current faction standings
   - Display faction effects
   - Animate reputation changes

5. **Integrate with GameStore**
   - Add faction state
   - Create faction actions
   - Persist faction data

## Testing Guidelines

### Manual Testing Flow
1. Start new game
2. Book variety of shows
3. Check resource changes
4. Verify faction effects (Phase 1)
5. Test save/load
6. Check mobile responsiveness
7. Verify touch interactions
8. Test game over conditions

### Key Test Scenarios
- Bankruptcy (run out of money)
- Victory (reach 100 reputation)
- Faction conflicts (Phase 1)
- Equipment failures (Phase 2)
- Synergy discoveries (Phase 3)
- District changes (Phase 4)

## Debugging Tips

### Common Issues
1. **Drag-drop not working**: Check React.StrictMode is removed
2. **Styles not loading**: Ensure CSS imports in main.tsx
3. **State not persisting**: Check IndexedDB in dev tools
4. **Touch not responsive**: Verify 44px minimum targets
5. **Performance issues**: Check React DevTools Profiler

### Useful Console Commands
```javascript
// Get current game state
useGameStore.getState()

// Force save game
saveSystem.saveGame(useGameStore.getState())

// Reset game
useGameStore.getState().resetGame()

// Check faction standings (Phase 1)
factionSystem.getAllFactions()
```

## Resources

- [Original Vision (CLAUDE.md)](/CLAUDE.md)
- [Development Plan](/docs/DEVELOPMENT_PLAN.md)
- [Type Definitions](/src/game/types/core.ts)
- [Figma Designs](#) - TODO: Add when available
- [Sound Assets](/public/sounds/)

---

Remember: We're building a premium roguelike that authentically represents underground music culture. Every feature should enhance strategic depth while maintaining mobile-first performance.
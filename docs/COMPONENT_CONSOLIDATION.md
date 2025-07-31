# Component Consolidation Guide

## Overview
We've consolidated multiple duplicate band and venue card components into unified components with variant support. This reduces code duplication and bundle size while maintaining all existing functionality.

## Migration Guide

### Band Cards

#### Old Components → New Unified Component
- `BandCard` → `UnifiedBandCard` with `variant="default"`
- `PixelBandCard` → `UnifiedBandCard` with `variant="pixel"`
- `GlassPixelBandCard` → `UnifiedBandCard` with `variant="glass"`
- `CompactBandCard` → `UnifiedBandCard` with `variant="compact"`
- `PremiumBandCard` → `UnifiedBandCard` with `variant="premium"`
- `DraggableBandCard` → `UnifiedBandCard` with `variant="draggable"`
- `DraggablePixelBandCard` → `UnifiedBandCard` with `variant="draggable"`

#### Convenience Exports
For backward compatibility, we still export named components:
```tsx
import { BandCard, PixelBandCard, CompactBandCard } from '@components/unified';
```

#### Direct Usage
```tsx
import { UnifiedBandCard } from '@components/unified';

// Use any variant
<UnifiedBandCard band={band} variant="pixel" onSelect={handleSelect} />
<UnifiedBandCard band={band} variant="glass" showStats={false} />
```

### Venue Cards

#### Old Components → New Unified Component
- `VenueCard` → `UnifiedVenueCard` with `variant="default"`
- `PixelVenueCard` → `UnifiedVenueCard` with `variant="pixel"`
- `GlassVenueCard` → `UnifiedVenueCard` with `variant="glass"`
- `CompactVenueCard` → `UnifiedVenueCard` with `variant="compact"`
- `PremiumVenueCard` → `UnifiedVenueCard` with `variant="premium"`
- `VenueNode` → `UnifiedVenueCard` with `variant="node"`
- `PremiumVenueNode` → `UnifiedVenueCard` with `variant="node"`

## Benefits

1. **Reduced Bundle Size**: Eliminated ~20 duplicate component files
2. **Consistent API**: All variants share the same props interface
3. **Easier Maintenance**: Single source of truth for card components
4. **Better Type Safety**: Unified TypeScript types across all variants
5. **Performance**: Reused logic and optimizations across all variants

## Customization

The unified components support all previous functionality plus:
- Custom className for additional styling
- Variant-specific optimizations (motion, gestures, etc.)
- Conditional rendering based on variant
- Shared utility functions

## Files to Remove

After migrating, these files can be safely deleted:
- `/src/components/game/BandCard.tsx`
- `/src/components/game/PixelBandCard.tsx`
- `/src/components/game/GlassPixelBandCard.tsx`
- `/src/components/game/CompactBandCard.tsx`
- `/src/components/game/PremiumBandCard.tsx`
- `/src/components/game/DraggableBandCard.tsx`
- `/src/components/game/DraggablePixelBandCard.tsx`
- `/src/components/ui/BandCard.tsx`
- `/src/components/game/VenueCard.tsx`
- `/src/components/game/PixelVenueCard.tsx`
- `/src/components/ui/VenueCard.tsx`
- `/src/components/game/VenueNode.tsx`
- `/src/components/game/PremiumVenueNode.tsx`

## Next Steps

1. Update imports in existing code to use unified components
2. Test all card variants to ensure functionality is preserved
3. Remove old component files
4. Update any component-specific styles if needed
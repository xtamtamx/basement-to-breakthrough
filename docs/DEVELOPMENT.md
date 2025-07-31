# Development Guide

## Getting Started

### Prerequisites

- Node.js 18+ (use nvm for version management)
- npm 9+
- Git
- VS Code (recommended) or your preferred editor
- Chrome/Firefox with React DevTools

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/diy-indie-empire.git
cd diy-indie-empire

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### VS Code Extensions

Recommended extensions for optimal development experience:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "mikestead.dotenv",
    "yoavbls.pretty-ts-errors",
    "usernamehw.errorlens"
  ]
}
```

## Project Structure

```
src/
├── components/          # React components
│   ├── game/           # Game-specific components
│   │   ├── views/      # Main game views
│   │   └── modals/     # Game modals
│   ├── ui/             # Reusable UI components
│   ├── dev/            # Development tools
│   └── ErrorBoundary/  # Error handling components
│
├── game/               # Game logic
│   ├── mechanics/      # Core game systems
│   ├── types/          # TypeScript definitions
│   ├── config/         # Game configuration
│   └── utils/          # Game utilities
│
├── stores/             # Zustand state management
├── hooks/              # Custom React hooks
├── utils/              # General utilities
├── contexts/           # React contexts
└── styles/             # Global styles
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/band-trading-system

# Make changes and test
npm run dev

# Run tests
npm test

# Check types
npm run type-check

# Lint code
npm run lint

# Commit with conventional commits
git commit -m "feat: add band trading system"
```

### 2. Testing Strategy

#### Unit Tests
```typescript
// Band.test.ts
import { describe, it, expect } from 'vitest';
import { calculateBandPopularity } from '@game/mechanics/BandSystem';

describe('BandSystem', () => {
  it('should calculate band popularity correctly', () => {
    const band = { basePopularity: 50, skill: 80 };
    const result = calculateBandPopularity(band);
    expect(result).toBe(65); // (50 + 80) / 2
  });
});
```

#### Component Tests
```typescript
// BandCard.test.tsx
import { render, screen } from '@testing-library/react';
import { BandCard } from '@components/game/BandCard';

test('renders band information', () => {
  const band = { name: 'Test Band', genre: 'Punk' };
  render(<BandCard band={band} />);
  
  expect(screen.getByText('Test Band')).toBeInTheDocument();
  expect(screen.getByText('Punk')).toBeInTheDocument();
});
```

### 3. Code Style

#### TypeScript
```typescript
// Use explicit types
interface ShowBookingProps {
  band: Band;
  venue: Venue;
  date: Date;
  onBook: (show: Show) => void;
}

// Prefer const assertions
const GENRES = ['Punk', 'Metal', 'Hardcore'] as const;
type Genre = typeof GENRES[number];

// Use proper error handling
try {
  const result = await bookShow(show);
  return { success: true, result };
} catch (error) {
  devLog.error('Failed to book show:', error);
  return { success: false, error: error.message };
}
```

#### React Components
```tsx
// Use function components with TypeScript
export const VenueCard: React.FC<VenueCardProps> = ({ 
  venue, 
  selected, 
  onSelect 
}) => {
  // Use hooks at the top
  const [isHovered, setIsHovered] = useState(false);
  const haptics = useHaptics();
  
  // Event handlers with proper typing
  const handleClick = useCallback(() => {
    haptics.light();
    onSelect(venue.id);
  }, [venue.id, onSelect, haptics]);
  
  // Conditional rendering
  return (
    <div onClick={handleClick}>
      {venue.capacity > 100 && <Badge>Large Venue</Badge>}
      <h3>{venue.name}</h3>
    </div>
  );
};
```

### 4. State Management

#### Zustand Store Pattern
```typescript
// gameStore.ts
interface GameState {
  // State
  money: number;
  bands: Band[];
  
  // Actions
  addMoney: (amount: number) => void;
  hireBand: (band: Band) => void;
  
  // Computed
  get totalBandCost(): number;
}

export const useGameStore = create<GameState>((set, get) => ({
  // State
  money: 500,
  bands: [],
  
  // Actions
  addMoney: (amount) => set((state) => ({ 
    money: Math.max(0, state.money + amount) 
  })),
  
  hireBand: (band) => set((state) => ({
    bands: [...state.bands, band],
    money: state.money - band.cost
  })),
  
  // Computed
  get totalBandCost() {
    return get().bands.reduce((sum, band) => sum + band.cost, 0);
  }
}));
```

## Performance Optimization

### 1. Code Splitting
```typescript
// Lazy load heavy components
const CityMap = lazy(() => import('@components/game/CityMap'));

// Use Suspense
<Suspense fallback={<LoadingSpinner />}>
  <CityMap />
</Suspense>
```

### 2. Memoization
```typescript
// Memoize expensive calculations
const sortedBands = useMemo(() => 
  bands.sort((a, b) => b.popularity - a.popularity),
  [bands]
);

// Memoize components
const BandList = memo(({ bands }: { bands: Band[] }) => {
  return bands.map(band => <BandCard key={band.id} band={band} />);
});
```

### 3. Performance Monitoring
```typescript
// Use the performance metrics utility
const loadBands = async () => {
  const measure = performanceMetrics.startMeasure('load-bands');
  try {
    const bands = await fetchBands();
    return bands;
  } finally {
    performanceMetrics.endMeasure('load-bands');
  }
};
```

## Mobile Development

### Touch Handling
```typescript
// Use the touch hook for gestures
const touchHandlers = useTouch({
  onSwipe: (direction) => {
    if (direction === SwipeDirection.LEFT) {
      nextPage();
    }
  },
  onLongPress: () => {
    showContextMenu();
  }
});
```

### Responsive Design
```tsx
// Mobile-first approach
<div className="p-4 md:p-8 lg:p-12">
  <h1 className="text-xl md:text-2xl lg:text-3xl">
    {title}
  </h1>
</div>
```

## Debugging

### Development Tools

1. **React DevTools**: Inspect component tree and props
2. **Redux DevTools**: Monitor state changes (for Zustand)
3. **Network Tab**: Monitor API calls and asset loading
4. **Performance Tab**: Profile rendering performance

### Debug Utilities
```typescript
// Enable debug logging
localStorage.setItem('debug', 'true');

// Use dev logger
import { devLog } from '@utils/devLogger';
devLog.log('Show booked:', show);
devLog.error('Failed to save:', error);
```

### Common Issues

1. **State not updating**
   - Check if using immer for immutable updates
   - Verify selector is returning new reference

2. **Performance issues**
   - Profile with React DevTools Profiler
   - Check for unnecessary re-renders
   - Optimize large lists with virtualization

3. **Build errors**
   - Clear node_modules and reinstall
   - Check for circular dependencies
   - Verify all imports are correct

## Git Workflow

### Branch Naming
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/fixes

### Commit Messages
Follow conventional commits:
```
feat: add band contract negotiation
fix: resolve venue capacity calculation
refactor: simplify synergy system logic
docs: update API documentation
test: add show booking integration tests
```

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] No console errors

## Screenshots
(if applicable)
```

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Vite Guide](https://vitejs.dev/guide/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
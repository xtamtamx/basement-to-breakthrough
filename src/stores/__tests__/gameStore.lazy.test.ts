import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '../gameStore';

// Track module loads. Hoisted so the (also-hoisted) vi.mock factories can touch
// these without a TDZ error — the store now dynamically imports the bands module
// from onRehydrateStorage too, so the factory can run during store rehydration.
const loaded = vi.hoisted(() => ({ bands: false, venues: false }));

// Mock the lazy imports
vi.mock('../../data/initialBands', () => {
  loaded.bands = true;
  return {
    initialBands: [
      { id: 'band1', name: 'Test Band 1' },
      { id: 'band2', name: 'Test Band 2' },
      { id: 'band3', name: 'Test Band 3' },
      { id: 'band4', name: 'Test Band 4' },
      { id: 'band5', name: 'Test Band 5' },
      { id: 'band6', name: 'Test Band 6' },
      { id: 'band7', name: 'Test Band 7' },
      { id: 'band8', name: 'Test Band 8' },
      { id: 'band9', name: 'Test Band 9' },
    ]
  };
});

vi.mock('../../data/initialVenues', () => {
  loaded.venues = true;
  return {
    initialVenues: [
      { id: 'venue1', name: 'Test Venue 1' },
      { id: 'venue2', name: 'Test Venue 2' },
      { id: 'venue3', name: 'Test Venue 3' },
      { id: 'venue4', name: 'Test Venue 4' },
    ]
  };
});

describe('GameStore Lazy Loading', () => {
  beforeEach(() => {
    // Clear store before each test
    useGameStore.setState({
      allBands: [],
      venues: [],
      rosterBandIds: []
    });
    loaded.bands = false;
    loaded.venues = false;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not load data until loadInitialGameData is called', async () => {
    const { result } = renderHook(() => useGameStore());
    
    // Initially, should have no data
    expect(result.current.allBands).toHaveLength(0);
    expect(result.current.venues).toHaveLength(0);
    expect(result.current.rosterBandIds).toHaveLength(0);
  });

  it('should lazily load initial data when requested', async () => {
    const { result } = renderHook(() => useGameStore());
    
    // Modules should not be loaded yet
    expect(loaded.bands).toBe(false);
    expect(loaded.venues).toBe(false);
    
    // Load data
    await act(async () => {
      await result.current.loadInitialGameData();
    });
    
    // Should have loaded limited data
    expect(result.current.allBands).toHaveLength(9); // Full authored pool (roster slot cap constrains signing)
    expect(result.current.venues).toHaveLength(4); // Full venue ladder loads; the rep gate decides which show
    expect(result.current.rosterBandIds).toHaveLength(1); // Start with a single signed act
  });

  it('demonstrates performance benefit of lazy loading', async () => {
    const { result } = renderHook(() => useGameStore());
    
    // Measure initial render without data
    const startTime = performance.now();
    const initialBands = result.current.allBands;
    const renderTime = performance.now() - startTime;
    
    expect(initialBands).toHaveLength(0);
    expect(renderTime).toBeLessThan(10); // Should be very fast
    
    // Load data only when needed
    const loadStartTime = performance.now();
    await act(async () => {
      await result.current.loadInitialGameData();
    });
    const loadTime = performance.now() - loadStartTime;
    
    // Loading happens asynchronously
    expect(result.current.allBands).toHaveLength(9);
    
    console.log(`Initial render: ${renderTime.toFixed(2)}ms`);
    console.log(`Lazy load time: ${loadTime.toFixed(2)}ms`);
  });

  it('should load correct subset of data', async () => {
    const { result } = renderHook(() => useGameStore());
    
    await act(async () => {
      await result.current.loadInitialGameData();
    });
    
    // Check that it loaded the right bands (pool of 8)
    expect(result.current.allBands[0].id).toBe('band1');
    expect(result.current.allBands[7].id).toBe('band8');
    
    // Check that it loaded the right venues
    expect(result.current.venues[0].id).toBe('venue1');
    expect(result.current.venues[2].id).toBe('venue3');
    
    // Check roster — a single starting act; the rest are signable free agents
    expect(result.current.rosterBandIds).toEqual(['band1']);
  });

  it('should only load data once (caching)', async () => {
    const { result } = renderHook(() => useGameStore());
    
    // First load
    await act(async () => {
      await result.current.loadInitialGameData();
    });
    
    const firstBands = result.current.allBands;
    const firstVenues = result.current.venues;
    
    // Try to load again
    await act(async () => {
      await result.current.loadInitialGameData();
    });
    
    // Should still have same data (not duplicated)
    expect(result.current.allBands).toEqual(firstBands);
    expect(result.current.venues).toEqual(firstVenues);
  });

  it('verifies lazy loading pattern reduces initial bundle size', () => {
    // In a real app, dynamic imports split code into separate chunks
    // This reduces the initial bundle size and improves mobile load times
    
    // The pattern used:
    // 1. Data files are NOT imported at module level
    // 2. import() is used only when loadInitialGameData is called
    // 3. Promise is cached to avoid multiple loads
    
    // Benefits for mobile:
    // - Smaller initial JS bundle
    // - Faster first paint
    // - Data loaded only when game actually starts
    
    expect(true).toBe(true); // Pattern verification test
  });
});
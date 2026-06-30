import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initialBands } from '@/data/initialBands';

// allBands is persisted in the save, so loadGame/onRehydrate must refresh each
// band's AUTHORED content (name/bio/genre…) from the current data file by id —
// otherwise a content patch (e.g. renaming the roster) never reaches an
// in-progress save. Run-mutated stats (event-card deltas, run-start quality
// shift) must survive the refresh, and bands added to the data file since the
// save was written must surface as free agents.

let savedState: Record<string, unknown> = {};
vi.mock('@game/persistence/SaveGameManager', () => ({
  saveGameManager: { loadGame: vi.fn(async () => savedState) },
}));
vi.mock('@game/persistence/runtimeSnapshot', () => ({
  restoreRuntimeSnapshot: vi.fn(),
}));

import { useGameStore } from '../gameStore';

describe('gameStore.loadGame — band reconcile against data file', () => {
  beforeEach(() => {
    savedState = {};
  });

  it('refreshes stale band names/bios from the data file but keeps run-mutated stats', async () => {
    const real = initialBands[0]; // a genuine authored band, by id
    savedState = {
      // The save carries an OLD name + bio and a mid-run-mutated stat for this id.
      allBands: [{ ...real, name: 'Stale Pun Name', bio: 'old bio', popularity: 7 }],
      venues: [],
      rosterBandIds: [real.id],
      scheduledShows: [],
      runtimeSnapshot: { run: null, scheduledShows: [], difficultyBlocks: { raided: [], unavailable: [] } },
    };

    const ok = await useGameStore.getState().loadGame('any');
    expect(ok).toBe(true);

    const s = useGameStore.getState();
    const refreshed = s.allBands.find((b) => b.id === real.id)!;
    expect(refreshed.name).toBe(real.name); // content refreshed from data file
    expect(refreshed.bio).toBe(real.bio);
    expect(refreshed.popularity).toBe(7); // run-mutated stat preserved
    // The roster reference still resolves...
    expect(s.rosterBandIds).toEqual([real.id]);
    // ...and every other authored band now shows up as a free agent.
    expect(s.allBands).toHaveLength(initialBands.length);
  });

  it('DROPS a save-only band not in the data file (authored roster is authoritative)', async () => {
    // A stale save (e.g. the parked touring roster after the Long Island swap)
    // must not resurrect bands the data file no longer ships.
    savedState = {
      allBands: [{ ...initialBands[0], id: 'ghost-band', name: 'Ghost', popularity: 42 }],
      venues: [],
      rosterBandIds: ['ghost-band'],
      scheduledShows: [],
      runtimeSnapshot: { run: null, scheduledShows: [], difficultyBlocks: { raided: [], unavailable: [] } },
    };

    await useGameStore.getState().loadGame('any');

    const s = useGameStore.getState();
    expect(s.allBands.find((b) => b.id === 'ghost-band')).toBeUndefined(); // dropped
    expect(s.allBands).toHaveLength(initialBands.length); // exactly the authored roster
    expect(s.rosterBandIds).not.toContain('ghost-band'); // pruneDangling cleared the orphaned ref
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';
import { Genre } from '@game/types';

// addBandToRoster is the only sign path; it must refuse a LOCKED band even if a
// non-UI caller asks (the UI already hides the Sign button for locked bands).
// Uses the real metaProgressionManager with a clean (empty) localStorage, so a
// starter id is unlocked and a known locked id is not.

const band = (id: string) => ({
  id, name: id, genre: Genre.PUNK, isRealArtist: false, subgenres: [], traits: [],
  popularity: 50, authenticity: 50, energy: 50, technicalSkill: 50, technicalRequirements: [],
});

describe('addBandToRoster — lock gate', () => {
  beforeEach(() => {
    useGameStore.setState({
      allBands: [band('automedication'), band('tell-all-frenemies')],
      rosterBandIds: [],
      maxRosterSize: 4,
    });
  });

  it('refuses to sign a LOCKED band', () => {
    useGameStore.getState().addBandToRoster('tell-all-frenemies'); // locked (win a No Future run)
    expect(useGameStore.getState().rosterBandIds).toEqual([]);
  });

  it('signs a STARTER (unlocked) band', () => {
    useGameStore.getState().addBandToRoster('automedication'); // starter — always unlocked
    expect(useGameStore.getState().rosterBandIds).toEqual(['automedication']);
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Genre } from '@/game/types';
import {
  showPromotionSystem,
  PromotionType,
  SerializedScheduledShow,
} from '@game/mechanics/ShowPromotionSystem';

// OQ-1 end-to-end: gameStore.loadGame must prune dangling band/venue refs from
// scheduledShows, rosterBandIds, AND the in-memory ShowPromotionSystem Map
// after the runtime snapshot is restored.

// The save blob loadGame restores into the store (set by each test).
let savedState: Record<string, unknown> = {};

vi.mock('@game/persistence/SaveGameManager', () => ({
  saveGameManager: {
    loadGame: vi.fn(async () => savedState),
  },
}));

// restoreRuntimeSnapshot is what repopulates the promotion Map on load. Stub it
// to inject the dangling shows into the live Map (as a real load would), so we
// can assert the prune drops them from the Map too.
let snapshotShows: SerializedScheduledShow[] = [];
vi.mock('@game/persistence/runtimeSnapshot', () => ({
  restoreRuntimeSnapshot: vi.fn(() => {
    showPromotionSystem.restore(snapshotShows);
  }),
}));

import { useGameStore } from '../gameStore';

const band = (id: string) => ({
  id,
  name: id,
  genre: Genre.PUNK,
  isRealArtist: false,
  subgenres: [],
  traits: [],
  popularity: 50,
  authenticity: 50,
  energy: 50,
  technicalSkill: 50,
  technicalRequirements: [],
});

const venue = (id: string) => ({
  id,
  name: id,
  type: 'DIVE_BAR',
  capacity: 100,
  atmosphere: 50,
  authenticity: 50,
  location: { id: 'd1', name: 'd', sceneStrength: 50, gentrificationLevel: 0, policePresence: 0, rentMultiplier: 1, bounds: { x: 0, y: 0, width: 1, height: 1 }, color: '#000', type: 'WAREHOUSE' },
  rent: 50,
  equipment: [],
  allowsAllAges: true,
  hasBar: false,
  hasSecurity: false,
  isPermanent: true,
  bookingDifficulty: 1,
  traits: [],
});

const show = (
  id: string,
  bandId: string,
  venueId: string,
): SerializedScheduledShow => ({
  id,
  bandId,
  venueId,
  date: new Date(),
  ticketPrice: 10,
  status: 'SCHEDULED',
  lineup: [bandId],
  turnsUntilShow: 2,
  promotionInvestment: [[PromotionType.FLYERS, 1]],
  totalPromotionEffectiveness: 1.1,
  expectedAttendance: 20,
  hype: 15,
});

describe('gameStore.loadGame — dangling-reference prune', () => {
  beforeEach(() => {
    showPromotionSystem.reset();
    snapshotShows = [];
    savedState = {};
  });

  it('drops dangling scheduledShows, rosterBandIds, and promotion-Map entries', async () => {
    // Loaded save knows only b1/v1. References to b2 (removed band) and v2
    // (removed venue) are dangling.
    savedState = {
      allBands: [band('b1')],
      venues: [venue('v1')],
      rosterBandIds: ['b1', 'b2'], // b2 no longer exists
      scheduledShows: [
        show('s-ok', 'b1', 'v1'),
        show('s-deadband', 'b2', 'v1'),
        show('s-deadvenue', 'b1', 'v2'),
      ],
      runtimeSnapshot: { run: null, scheduledShows: [], difficultyBlocks: { raided: [], unavailable: [] } },
    };
    snapshotShows = savedState.scheduledShows as SerializedScheduledShow[];

    const ok = await useGameStore.getState().loadGame('any');
    expect(ok).toBe(true);

    const s = useGameStore.getState();
    expect(s.scheduledShows.map((x) => x.id)).toEqual(['s-ok']);
    expect(s.rosterBandIds).toEqual(['b1']);
    // The live promotion Map was pruned too.
    expect(showPromotionSystem.getScheduledShows().map((x) => x.id)).toEqual([
      's-ok',
    ]);
  });

  it('is a no-op when everything resolves', async () => {
    savedState = {
      allBands: [band('b1'), band('b2')],
      venues: [venue('v1'), venue('v2')],
      rosterBandIds: ['b1', 'b2'],
      scheduledShows: [show('s1', 'b1', 'v1'), show('s2', 'b2', 'v2')],
      runtimeSnapshot: { run: null, scheduledShows: [], difficultyBlocks: { raided: [], unavailable: [] } },
    };
    snapshotShows = savedState.scheduledShows as SerializedScheduledShow[];

    await useGameStore.getState().loadGame('any');

    const s = useGameStore.getState();
    expect(s.scheduledShows).toHaveLength(2);
    expect(s.rosterBandIds).toEqual(['b1', 'b2']);
    expect(showPromotionSystem.getScheduledShows()).toHaveLength(2);
  });
});

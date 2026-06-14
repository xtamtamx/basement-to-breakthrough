import { describe, it, expect, beforeEach } from 'vitest';
import {
  showPromotionSystem,
  SerializedScheduledShow,
  PromotionType,
} from '../ShowPromotionSystem';

// OQ-1: after a data-file patch (a band/venue removed or renamed), a persisted
// save can reference ids that no longer exist. Those dangling shows must be
// dropped on restore instead of resolving as unfair "failed shows" (-rep).

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

describe('ShowPromotionSystem.pruneDangling', () => {
  beforeEach(() => {
    showPromotionSystem.reset();
  });

  it('drops shows whose band no longer exists', () => {
    showPromotionSystem.restore([
      show('s-ok', 'b1', 'v1'),
      show('s-deadband', 'GONE', 'v1'),
    ]);

    const pruned = showPromotionSystem.pruneDangling(
      new Set(['b1']),
      new Set(['v1']),
    );

    expect(pruned).toEqual(['s-deadband']);
    const ids = showPromotionSystem.getScheduledShows().map((s) => s.id);
    expect(ids).toEqual(['s-ok']);
  });

  it('drops shows whose venue no longer exists', () => {
    showPromotionSystem.restore([
      show('s-ok', 'b1', 'v1'),
      show('s-deadvenue', 'b1', 'GONE'),
    ]);

    const pruned = showPromotionSystem.pruneDangling(
      new Set(['b1']),
      new Set(['v1']),
    );

    expect(pruned).toEqual(['s-deadvenue']);
    expect(showPromotionSystem.getScheduledShows()).toHaveLength(1);
  });

  it('is a no-op when every show resolves', () => {
    showPromotionSystem.restore([
      show('s1', 'b1', 'v1'),
      show('s2', 'b2', 'v2'),
    ]);

    const pruned = showPromotionSystem.pruneDangling(
      new Set(['b1', 'b2']),
      new Set(['v1', 'v2']),
    );

    expect(pruned).toEqual([]);
    expect(showPromotionSystem.getScheduledShows()).toHaveLength(2);
  });

  it('is defensive on an empty schedule', () => {
    expect(() =>
      showPromotionSystem.pruneDangling(new Set(), new Set()),
    ).not.toThrow();
    expect(showPromotionSystem.getScheduledShows()).toHaveLength(0);
  });
});

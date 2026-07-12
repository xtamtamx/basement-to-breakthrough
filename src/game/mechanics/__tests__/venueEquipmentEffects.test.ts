import { describe, it, expect } from 'vitest';
import { computeEquipmentEffects } from '../venueEquipmentEffects';
import { projectBaseAttendance } from '../attendanceProjection';
import { Band, Venue } from '@game/types';

// The helper is the SINGLE source both executeShow and projectBaseAttendance use,
// so these assert the summation math (which the resolver relies on too) plus that
// the projection actually folds it in — closing the preview<resolution gap where a
// kitted-out room drew a bigger crowd than the booking screen promised.

const gear = (over: Partial<Venue['equipment'][number]>): Venue['equipment'][number] =>
  ({ id: 'g', name: 'g', owned: true, condition: 100, effects: {}, ...over } as Venue['equipment'][number]);

const baseVenue = (equipment: Venue['equipment']): Venue =>
  ({ id: 'v1', name: 'V', capacity: 100, atmosphere: 50, hasBar: false,
     location: { id: 'd1' }, equipment } as unknown as Venue);

const band = (): Band =>
  ({ id: 'b1', name: 'B', genre: 'PUNK', popularity: 60, authenticity: 50,
     energy: 50, technicalSkill: 50, traits: [] } as unknown as Band);

describe('computeEquipmentEffects', () => {
  it('sums capacity + quality across pieces, scaled by condition, capped at 1.4x', () => {
    const v = baseVenue([
      gear({ condition: 100, effects: { capacityBonus: 20, acousticsBonus: 10 } }),
      gear({ condition: 50, effects: { capacityBonus: 20, atmosphereBonus: 8 } }),
    ]);
    const e = computeEquipmentEffects(v);
    // capacity: 1 + 0.20*1.0 + 0.20*0.5 = 1.30 ; quality: 10*1.0 + 8*0.5 = 14
    expect(e.capacityMult).toBeCloseTo(1.3, 5);
    expect(e.qualityBonus).toBeCloseTo(14, 5);

    const capped = computeEquipmentEffects(baseVenue([
      gear({ effects: { capacityBonus: 60 } }),
      gear({ effects: { capacityBonus: 60 } }),
    ]));
    expect(capped.capacityMult).toBe(1.4); // 1 + 0.6 + 0.6 = 2.2 → capped
  });

  it('ignores broken (<=20% condition) and un-owned/un-rented gear', () => {
    const e = computeEquipmentEffects(baseVenue([
      gear({ condition: 15, effects: { capacityBonus: 40 } }),         // broken
      gear({ owned: false, rentedForShow: false, effects: { capacityBonus: 40 } }), // not present
    ]));
    expect(e.capacityMult).toBe(1);
    expect(e.qualityBonus).toBe(0);
  });
});

describe('projectBaseAttendance folds in owned equipment', () => {
  it('projects a bigger crowd for a gear-kitted room than a bare one', () => {
    const opts = (equipment: Venue['equipment']) => ({
      bands: [band()], venue: baseVenue(equipment), currentCityId: 'c1',
      factionStandings: {}, eventCapacityPenalty: 0, ticketPrice: 10,
    });
    const bare = projectBaseAttendance(opts([]));
    const kitted = projectBaseAttendance(opts([
      gear({ effects: { capacityBonus: 30, acousticsBonus: 20 } }),
    ]));
    expect(kitted).toBeGreaterThan(bare);
  });
});

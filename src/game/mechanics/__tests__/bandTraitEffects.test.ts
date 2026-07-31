import { describe, it, expect } from 'vitest';
import { computeTraitEffects, traitFeeMult, traitFires } from '../bandTraitEffects';
import { synergyEngine } from '../SynergyEngine';
import { BAND_TRAIT_CATALOG } from '@game/data/bandTraits';
import { Band, BandTrait, Venue, VenueType } from '@game/types';

// computeTraitEffects is the ONE summation behind both the resolver and the
// booking preview, so these lock the CONDITION BOUNDARIES (a band that fires at
// cap 90 must not fire at 91) and the clamps. Anything that drifts here shows up
// as a preview that lied about the night.

// Fixtures carry `traits: []` by default on purpose — engine code elsewhere calls
// band.traits.some(...) unguarded, so an omitted array hides real crashes.
const trait = (id: string): BandTrait =>
  ({ id, name: id, description: '', type: 'PERFORMANCE' } as unknown as BandTrait);

const band = (over: Partial<Band> = {}): Band =>
  ({ id: 'b1', name: 'Band', genre: 'PUNK', subgenres: [], traits: [],
     popularity: 50, authenticity: 50, energy: 50, technicalSkill: 50,
     ...over } as unknown as Band);

const withTraits = (name: string, ...ids: string[]): Band =>
  band({ name, traits: ids.map(trait) });

const venue = (over: Partial<Venue> = {}): Venue =>
  ({ id: 'v1', name: 'V', type: VenueType.DIY_SPACE, capacity: 150, allowsAllAges: false,
     hasBar: false, hasSecurity: false, equipment: [], traits: [], modifiers: [],
     location: { id: 'd1', name: 'District', sceneStrength: 60 },
     ...over } as unknown as Venue);

const finite = (n: number) => Number.isFinite(n);

describe('traitFires — condition boundaries', () => {
  it('smallRoom is cap <= 90: fires at 90, not at 91', () => {
    expect(traitFires('smallRoom', venue({ capacity: 90 }), 1)).toBe(true);
    expect(traitFires('smallRoom', venue({ capacity: 91 }), 1)).toBe(false);
  });

  it('bigRoom is cap >= 300: fires at 300, not at 299', () => {
    expect(traitFires('bigRoom', venue({ capacity: 300 }), 1)).toBe(true);
    expect(traitFires('bigRoom', venue({ capacity: 299 }), 1)).toBe(false);
  });

  it('allAges and bar read the venue flags', () => {
    expect(traitFires('allAges', venue({ allowsAllAges: true }), 1)).toBe(true);
    expect(traitFires('allAges', venue({ allowsAllAges: false }), 1)).toBe(false);
    expect(traitFires('bar', venue({ hasBar: true }), 1)).toBe(true);
    expect(traitFires('bar', venue({ hasBar: false }), 1)).toBe(false);
  });

  it('soloBill is one act, fullBill is two or more', () => {
    expect(traitFires('soloBill', venue(), 1)).toBe(true);
    expect(traitFires('soloBill', venue(), 2)).toBe(false);
    expect(traitFires('fullBill', venue(), 1)).toBe(false);
    expect(traitFires('fullBill', venue(), 2)).toBe(true);
    expect(traitFires('fullBill', venue(), 3)).toBe(true);
  });

  it('always fires anywhere, and a garbage venue/bill never throws', () => {
    expect(traitFires('always', venue(), 0)).toBe(true);
    const broken = { capacity: NaN } as unknown as Venue;
    expect(traitFires('smallRoom', broken, NaN)).toBe(true); // NaN capacity reads as 0
    expect(traitFires('bigRoom', broken, NaN)).toBe(false);
    expect(traitFires('soloBill', broken, NaN)).toBe(true);
  });
});

describe('computeTraitEffects — firing and not firing', () => {
  it('applies a small-room trait in a 90-cap room and drops it at 91', () => {
    const pit = withTraits('Pit Igniter Band', 'pit-igniter');
    const hitMult = BAND_TRAIT_CATALOG['pit-igniter'].effect.attendanceMult!;
    const missMult = BAND_TRAIT_CATALOG['pit-igniter'].otherwise!.attendanceMult!;
    expect(computeTraitEffects([pit], venue({ capacity: 90 }), 1).attendanceMult).toBeCloseTo(hitMult, 5);

    // Traits are TWO-SIDED: at 91 the condition misses and the act is worse in
    // the room, not merely un-boosted. That miss-case is what stops a roster-wide
    // trait pass from being a flat power-up.
    const missed = computeTraitEffects([pit], venue({ capacity: 91 }), 1);
    expect(missed.attendanceMult).toBeCloseTo(missMult, 5);
    expect(missed.attendanceMult).toBeLessThan(1);
    expect(missed.firing).toHaveLength(0);
  });

  it('lists only the traits whose condition is MET, with band + blurb for the preview', () => {
    const b = withTraits('Two Trait Band', 'festival-ready', 'bar-band');
    const fx = computeTraitEffects([b], venue({ capacity: 400, hasBar: false }), 1);
    expect(fx.firing.map(f => f.traitName)).toEqual(['Festival Ready']);
    expect(fx.firing[0].bandName).toBe('Two Trait Band');
    expect(fx.firing[0].blurb).toBe(BAND_TRAIT_CATALOG['festival-ready'].blurb);
    // bar-band missed (no bar), so it applies its miss-case, not nothing.
    expect(fx.moneyMult).toBeCloseTo(BAND_TRAIT_CATALOG['bar-band'].otherwise!.moneyMult!, 5);
  });

  it('routes each multiplier to its own channel', () => {
    const room = venue({ capacity: 60, allowsAllAges: true, hasBar: true });
    const bill = [
      withTraits('A', 'scene-revered'),   // repMult 1.25 at all-ages
      withTraits('B', 'bar-band'),        // moneyMult 1.2 at a bar
      withTraits('C', 'hometown-heroes'), // fanMult 1.2 in a small room
    ];
    const fx = computeTraitEffects(bill, room, bill.length);
    expect(fx.repMult).toBeCloseTo(BAND_TRAIT_CATALOG['scene-revered'].effect.repMult!, 5);
    expect(fx.moneyMult).toBeCloseTo(BAND_TRAIT_CATALOG['bar-band'].effect.moneyMult!, 5);
    expect(fx.fanMult).toBeCloseTo(BAND_TRAIT_CATALOG['hometown-heroes'].effect.fanMult!, 5);
    expect(fx.attendanceMult).toBe(1); // no attendance trait on this bill
  });
});

describe('computeTraitEffects — stacking and clamps', () => {
  it('multiplies the same trait across bands on the bill', () => {
    // Money has the loosest ceiling, so it shows the raw stacking cleanly; the
    // crowd cap is tight enough that two acts already reach it (asserted below).
    const barRoom = venue({ capacity: 200, hasBar: true });
    const two = [withTraits('A', 'bar-band'), withTraits('B', 'bar-band')];
    const one = BAND_TRAIT_CATALOG['bar-band'].effect.moneyMult!;
    expect(computeTraitEffects(two, barRoom, two.length).moneyMult).toBeCloseTo(one * one, 5);
  });

  it('clamps a stacked attendance multiplier at 1.5', () => {
    const room = venue({ capacity: 60 });
    const many = ['A','B','C','D','E','F','G','H'].map(n => withTraits(n, 'pit-igniter'));
    // Crowd is the master stat (it feeds fans AND rep AND money), so it carries a
    // tighter ceiling than the single-currency multipliers.
    const capped = computeTraitEffects(many, room, many.length).attendanceMult;
    expect(capped).toBeGreaterThan(1);
    expect(capped).toBeLessThanOrEqual(1.15);
  });

  it('clamps rep, money and fan multipliers at 1.5 too', () => {
    const room = venue({ capacity: 60, allowsAllAges: true, hasBar: true });
    const bill = ['A', 'B', 'C', 'D'].map(n =>
      withTraits(n, 'scene-revered', 'bar-band', 'all-ages-lifer', 'hometown-heroes'));
    const fx = computeTraitEffects(bill, room, bill.length);
    // Fans and reputation ARE the win conditions, so they cap hardest; money —
    // which does not win the run — keeps the looser ceiling.
    expect(fx.repMult).toBeLessThanOrEqual(1.18);
    expect(fx.fanMult).toBeLessThanOrEqual(1.18);
    expect(fx.moneyMult).toBeLessThanOrEqual(1.5);
    expect(fx.repMult).toBeGreaterThan(1);
  });

  it('sums stressDelta across the bill, in both directions', () => {
    const room = venue();
    const bill = [withTraits('A', 'volatile'), withTraits('B', 'volatile'), withTraits('C', 'road-dogs')];
    // +4 +4 -3
    expect(computeTraitEffects(bill, room, bill.length).stressDelta).toBe(5);
  });

  it('clamps stressDelta to [-6, 12]', () => {
    const room = venue();
    const chaos = ['A', 'B', 'C', 'D'].map(n => withTraits(n, 'volatile')); // +16
    expect(computeTraitEffects(chaos, room, chaos.length).stressDelta).toBe(12);

    const calm = ['A', 'B', 'C', 'D'].map(n => withTraits(n, 'road-dogs')); // -12
    expect(computeTraitEffects(calm, room, calm.length).stressDelta).toBe(-6);
  });

  it('leaves the show multipliers alone for a fee-only trait', () => {
    // gas-money is an 'always' trait that only discounts the booking fee, so it
    // must not touch the night's crowd/rep/money/fans at all.
    const fx = computeTraitEffects([withTraits('A', 'gas-money')], venue(), 1);
    expect(fx.attendanceMult).toBe(1);
    expect(fx.repMult).toBe(1);
    expect(fx.moneyMult).toBe(1);
    expect(fx.fanMult).toBe(1);
  });

  it('floors a stacked miss-case rather than letting it spiral to zero', () => {
    // Eight big-stage acts crammed into a basement: every one misses, but the
    // penalty bottoms out so a bad booking is a setback, not a wipe.
    const basement = venue({ capacity: 40 });
    const wrongRoom = ['A','B','C','D','E','F','G','H'].map(n => withTraits(n, 'festival-ready'));
    const fx = computeTraitEffects(wrongRoom, basement, wrongRoom.length);
    expect(fx.attendanceMult).toBeLessThan(1);
    expect(fx.attendanceMult).toBeGreaterThanOrEqual(0.75);
    expect(fx.firing).toHaveLength(0);
  });
});

describe('computeTraitEffects — hostile input never throws or NaNs', () => {
  const allFinite = (fx: ReturnType<typeof computeTraitEffects>) => {
    expect(finite(fx.attendanceMult)).toBe(true);
    expect(finite(fx.repMult)).toBe(true);
    expect(finite(fx.moneyMult)).toBe(true);
    expect(finite(fx.fanMult)).toBe(true);
    expect(finite(fx.stressDelta)).toBe(true);
  };

  it('ignores unknown trait ids without throwing', () => {
    const fx = computeTraitEffects(
      [withTraits('Mystery', 'not-a-real-trait', 'youth-crew')],
      venue({ capacity: 60, hasBar: true, allowsAllAges: true }),
      1,
    );
    expect(fx.attendanceMult).toBe(1);
    expect(fx.firing).toHaveLength(0);
    allFinite(fx);
  });

  it('survives a band with no traits array at all', () => {
    const naked = { id: 'x', name: 'Naked' } as unknown as Band;
    const fx = computeTraitEffects([naked], venue(), 1);
    expect(fx.firing).toHaveLength(0);
    allFinite(fx);
  });

  it('survives missing/garbage trait entries, an empty bill and a missing venue', () => {
    const ragged = { id: 'r', name: 'Ragged', traits: [undefined, null, {}, { id: null }] } as unknown as Band;
    allFinite(computeTraitEffects([ragged], venue(), 1));
    allFinite(computeTraitEffects([], venue(), 0));
    allFinite(computeTraitEffects([undefined as unknown as Band], venue(), 1));
    allFinite(computeTraitEffects([withTraits('A', 'pit-igniter')], undefined as unknown as Venue, 1));
    allFinite(computeTraitEffects(undefined as unknown as Band[], venue(), 1));
  });

  it('every catalogue entry computes to finite numbers in every room', () => {
    const rooms = [
      venue({ capacity: 40, allowsAllAges: true, hasBar: false }),
      venue({ capacity: 300, allowsAllAges: false, hasBar: true }),
    ];
    Object.keys(BAND_TRAIT_CATALOG).forEach(id => {
      rooms.forEach(room => {
        [1, 3].forEach(billSize => allFinite(computeTraitEffects([withTraits('A', id)], room, billSize)));
      });
      expect(finite(traitFeeMult(withTraits('A', id)))).toBe(true);
    });
  });
});

describe('traitFeeMult', () => {
  it('discounts a gas-money act and leaves everyone else at full price', () => {
    expect(traitFeeMult(withTraits('Cheap', 'gas-money'))).toBeCloseTo(0.7, 5);
    expect(traitFeeMult(withTraits('Normal', 'pit-igniter'))).toBe(1);
    expect(traitFeeMult(band())).toBe(1);
  });

  it('multiplies stacked fee traits and clamps to [0.5, 1.5]', () => {
    // 0.7 * 0.7 = 0.49, past the floor.
    expect(traitFeeMult(withTraits('Broke', 'gas-money', 'gas-money'))).toBe(0.5);

    // No shipped trait raises a fee, so the ceiling is only reachable with a
    // temporary entry — the clamp still has to hold if one is ever added.
    const pricey = 'test-pricey';
    BAND_TRAIT_CATALOG[pricey] = {
      trait: trait(pricey),
      effect: { when: 'always', feeMult: 1.4 },
      blurb: 'test only',
    };
    try {
      expect(traitFeeMult(withTraits('Pricey', pricey))).toBeCloseTo(1.4, 5);
      expect(traitFeeMult(withTraits('Pricier', pricey, pricey))).toBe(1.5); // 1.96 → capped
      expect(traitFeeMult(withTraits('Mixed', pricey, 'gas-money'))).toBeCloseTo(0.98, 5);
    } finally {
      delete BAND_TRAIT_CATALOG[pricey];
    }
  });

  it('ignores conditional traits — the fee is quoted per band, not per room', () => {
    // Only `always` effects can price a band before a room is chosen.
    expect(traitFeeMult(withTraits('Small room hero', 'pit-igniter', 'hometown-heroes'))).toBe(1);
  });

  it('does not throw on unknown ids or a missing traits array', () => {
    expect(traitFeeMult(withTraits('Mystery', 'nope'))).toBe(1);
    expect(traitFeeMult({ id: 'x', name: 'Naked' } as unknown as Band)).toBe(1);
    expect(traitFeeMult(undefined as unknown as Band)).toBe(1);
  });
});

// DEAD-CODE FIX: bar-boost used to exclude a trait NAMED 'Youth Crew', which no
// band carries (it is a SUBGENRE string), so the exclusion was permanently true.
describe('SynergyEngine bar-boost dry-crowd exclusion', () => {
  const barRoom = venue({ type: VenueType.DIVE_BAR, hasBar: true, capacity: 150 });
  const barBoost = (b: Band) =>
    synergyEngine.calculateSynergies([b], barRoom).find(s => s.id === 'bar-boost');

  it('still fires for an ordinary draw at a bar', () => {
    expect(barBoost(band({ popularity: 60 }))).toBeDefined();
  });

  it('excludes a youth-crew / straight-edge bill, whatever the roster spelling', () => {
    expect(barBoost(band({ popularity: 60, subgenres: ['Youth Crew', 'Moshcore'] }))).toBeUndefined();
    expect(barBoost(band({ popularity: 60, subgenres: ['straight-edge'] }))).toBeUndefined();
  });

  it('excludes an All-Ages Lifer headliner via the catalogue trait id', () => {
    expect(BAND_TRAIT_CATALOG['all-ages-lifer']).toBeDefined();
    expect(barBoost(band({ popularity: 60, traits: [trait('all-ages-lifer')] }))).toBeUndefined();
  });

  it('still requires a real draw and a bar', () => {
    expect(barBoost(band({ popularity: 30 }))).toBeUndefined();
    const dryRoom = venue({ hasBar: false });
    expect(
      synergyEngine.calculateSynergies([band()], dryRoom).find(s => s.id === 'bar-boost'),
    ).toBeUndefined();
  });
});

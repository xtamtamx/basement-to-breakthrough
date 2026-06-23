import { describe, it, expect, beforeEach } from 'vitest';
import { bandRelationships } from '../BandRelationships';
import { eventCardSystem, EventCard } from '../EventCardSystem';

describe('bandRelationships persistence (durable resume)', () => {
  beforeEach(() => bandRelationships.clearRelationships());

  it('serialize/restore round-trips the co-billing drift', () => {
    bandRelationships.updateRelationshipsFromShow(['a', 'b'], true, 1);
    bandRelationships.updateRelationshipsFromShow(['a', 'b'], true, 2);
    const before = bandRelationships.getRelationship('a', 'b');
    expect(before).toBeGreaterThan(0);

    const snap = bandRelationships.serialize();
    bandRelationships.clearRelationships();
    expect(bandRelationships.getRelationship('a', 'b')).toBe(0); // wiped (the bug)

    bandRelationships.restore(snap);
    expect(bandRelationships.getRelationship('a', 'b')).toBe(before); // survives now
  });
});

describe('faction_change event effect', () => {
  it('applyEventChoice collects faction_change deltas into factionChanges', () => {
    const card: EventCard = {
      id: 'test_faction', name: 't', description: '', icon: '',
      type: 'crisis', rarity: 'common', duration: 'instant',
      effects: [],
      choices: [{
        id: 'c', text: '',
        effects: [{ type: 'faction_change', target: 'player', value: { 'diy-purists': 12, 'new-wave': -8 }, description: '' }],
      }],
    };
    const res = eventCardSystem.applyEventChoice(card, 'c', { turn: 1 });
    expect(res.factionChanges['diy-purists']).toBe(12);
    expect(res.factionChanges['new-wave']).toBe(-8);
  });

  it('the authored faction cards are in the pool with valid faction ids', () => {
    const validFactions = new Set(['diy-purists', 'metal-elite', 'indie-crowd', 'old-guard', 'new-wave']);
    const ids = ['faction_purity_test', 'faction_shred_wars', 'faction_generational_clash'];
    for (const id of ids) {
      const card = eventCardSystem.getCardById(id);
      expect(card, `${id} should exist in the pool`).toBeTruthy();
      for (const choice of card!.choices ?? []) {
        for (const eff of choice.effects) {
          if (eff.type === 'faction_change') {
            for (const fid of Object.keys(eff.value)) expect(validFactions.has(fid)).toBe(true);
          }
        }
      }
    }
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { synergyManager, STARTER_SYNERGIES, Synergy } from '../SynergyManager';

const ctx = { currentTurn: 1, money: 0, reputation: 0, fans: 0, stress: 0 };

describe('SynergyManager', () => {
  beforeEach(() => synergyManager.reset());

  it('rolls a starter from the pool and equips it', () => {
    const s = synergyManager.getRandomAvailableSynergy();
    expect(s).not.toBeNull();
    expect(STARTER_SYNERGIES.some((x) => x.id === s!.id)).toBe(true);
    synergyManager.acquireSynergy(s!, 1);
    expect(synergyManager.getEquippedSynergies()).toHaveLength(1);
  });

  it('refuses duplicates and forces a replacement decision when slots are full', () => {
    const [a, b, c, d] = STARTER_SYNERGIES;
    synergyManager.acquireSynergy(a, 1);
    // duplicate id is rejected
    expect(synergyManager.acquireSynergy(a, 1)).toEqual({
      success: false,
      requiresReplacement: false,
    });
    synergyManager.acquireSynergy(b, 1);
    synergyManager.acquireSynergy(c, 1);
    expect(synergyManager.isFull()).toBe(true); // BASE_MAX_SYNERGIES = 3
    expect(synergyManager.acquireSynergy(d, 1).requiresReplacement).toBe(true);
  });

  it('calculateEffectTotal sums only TRIGGERED results — passives are NOT re-added', () => {
    // A SHOW_END money joker (fires) + a PASSIVE money joker (does NOT fire on
    // SHOW_END). The old bug rolled passives into every calculateEffectTotal call,
    // so this returned 50 instead of 20.
    const showEndMoney: Synergy = {
      id: 't_showend', name: 'ShowEnd', description: '', rarity: 'COMMON', trigger: 'SHOW_END',
      effects: [{ type: 'MONEY_PERCENT', value: 20, description: '' }], icon: '',
    };
    const passiveMoney: Synergy = {
      id: 't_passive', name: 'Passive', description: '', rarity: 'COMMON', trigger: 'PASSIVE',
      effects: [{ type: 'MONEY_PERCENT', value: 30, description: '' }], icon: '',
    };
    synergyManager.acquireSynergy(showEndMoney, 1);
    synergyManager.acquireSynergy(passiveMoney, 1);

    const results = synergyManager.triggerSynergies('SHOW_END', ctx);
    expect(synergyManager.calculateEffectTotal('MONEY_PERCENT', results)).toBe(20);
  });

  it('exposes passive effects separately via getPassiveEffects', () => {
    const passive: Synergy = {
      id: 't_pass2', name: 'P', description: '', rarity: 'COMMON', trigger: 'PASSIVE',
      effects: [{ type: 'COST_REDUCTION_PERCENT', value: 10, description: '' }], icon: '',
    };
    synergyManager.acquireSynergy(passive, 1);
    const passives = synergyManager.getPassiveEffects();
    expect(passives.find((e) => e.type === 'COST_REDUCTION_PERCENT')?.value).toBe(10);
  });
});

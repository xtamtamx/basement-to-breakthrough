import { describe, it, expect } from 'vitest';
import { eventCardSystem, type EventCard } from '../EventCardSystem';

/**
 * Guards the resolver fix: applyEventChoice must MERGE resource_change legs
 * additively (the original bug overwrote, silently dropping all but the last)
 * and surface trigger_synergy / scene_change as real result fields.
 */
describe('EventCardSystem.applyEventChoice', () => {
  const makeCard = (effects: NonNullable<EventCard['choices']>[number]['effects']): EventCard =>
    ({
      id: 'test-event',
      name: 'Test Event',
      description: 'A test',
      icon: '🧪',
      type: 'wildcard',
      rarity: 'common',
      duration: 'instant',
      effects: [],
      choices: [{ id: 'go', text: 'Go', effects }],
    } as unknown as EventCard);

  it('merges multiple resource_change legs instead of overwriting', () => {
    const card = makeCard([
      { type: 'resource_change', value: { money: -200 } },
      { type: 'resource_change', value: { money: 50 } }, // same key → accumulates
      { type: 'resource_change', value: { reputation: 15 } },
    ] as unknown as NonNullable<EventCard['choices']>[number]['effects']);

    const r = eventCardSystem.applyEventChoice(card, 'go', { turn: 1 });

    expect(r.resourceChanges.money).toBe(-150); // -200 + 50, not 50
    expect(r.resourceChanges.reputation).toBe(15);
  });

  it('surfaces trigger_synergy and scene_change as result fields', () => {
    const card = makeCard([
      { type: 'trigger_synergy', value: 'basement-magic' },
      { type: 'scene_change', value: { exposure: 'underground' } },
    ] as unknown as NonNullable<EventCard['choices']>[number]['effects']);

    const r = eventCardSystem.applyEventChoice(card, 'go', { turn: 1 });

    expect(r.triggeredSynergies).toContain('basement-magic');
    expect(r.sceneChanges.length).toBe(1);
  });

  it('falls back to card-level effects when no choice is given', () => {
    const card = {
      ...makeCard([]),
      effects: [{ type: 'resource_change', value: { fans: 30 } }],
      choices: undefined,
    } as unknown as EventCard;

    const r = eventCardSystem.applyEventChoice(card, null, { turn: 1 });
    expect(r.resourceChanges.fans).toBe(30);
  });
});

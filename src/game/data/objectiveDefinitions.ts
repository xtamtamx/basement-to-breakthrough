import { ObjectiveDefinition } from '@game/types';

/**
 * Optional run challenges. Each grants META FAME ONLY on completion (cross-run
 * currency banked at run end) — never in-run resources — so they add a
 * replayability layer without touching the tuned 4-mode balance.
 *
 * `current` is evaluated from ObjectiveRunStats in ObjectiveManager.currentValue.
 */
export const OBJECTIVE_DEFINITIONS: Record<string, ObjectiveDefinition> = {
  bank_thousand: {
    id: 'bank_thousand',
    title: 'Go Big or Go Home',
    description: 'Take in $1,000 of show revenue in a single turn',
    fameReward: 75,
    modes: ['classic', 'festival'],
    target: 1000,
  },
  sellout_three: {
    id: 'sellout_three',
    title: 'Packed Houses',
    description: 'Sell out 3 shows (fill a room to 90%+)',
    fameReward: 100,
    modes: [],
    target: 3,
  },
  eight_combos: {
    id: 'eight_combos',
    title: 'Synergy Master',
    description: 'Trigger 8 band+venue combos in one run',
    fameReward: 125,
    modes: ['classic', 'festival'],
    target: 8,
  },
  theater_tier: {
    id: 'theater_tier',
    title: 'Theater Dreams',
    description: 'Headline a 500-capacity room',
    fameReward: 120,
    modes: ['classic', 'festival', 'hardcore'],
    target: 500,
  },
  survive_escalation: {
    id: 'survive_escalation',
    title: 'Escalation Conqueror',
    description: 'Reach turn 31 without going under',
    fameReward: 140,
    modes: ['classic', 'hardcore'],
    target: 31,
  },
  never_worked: {
    id: 'never_worked',
    title: 'Pure DIY',
    description: 'Finish the run having never worked a day job',
    fameReward: 150,
    modes: ['classic', 'speed'],
    target: 1,
    finalizeOnly: true,
  },
  zero_disasters: {
    id: 'zero_disasters',
    title: 'Flawless Run',
    description: 'Play 10+ shows with zero incidents all run',
    fameReward: 150,
    modes: ['classic', 'speed'],
    target: 10,
    finalizeOnly: true,
  },
};

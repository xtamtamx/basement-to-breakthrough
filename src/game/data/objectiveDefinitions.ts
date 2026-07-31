import { ObjectiveDefinition } from '@game/types';

/**
 * Optional run challenges. Each grants META FAME ONLY on completion (cross-run
 * currency banked at run end) — never in-run resources — so they add a
 * replayability layer without touching the tuned 4-mode balance.
 *
 * `current` is evaluated from ObjectiveRunStats in ObjectiveManager.currentValue;
 * avoidance ones ("never…", "zero…") set `finalizeOnly` and resolve in
 * finalizeComplete at run end.
 *
 * POOL SIZE IS THE POINT. selectForRun rolls 3 per run, so a mode whose eligible
 * pool is only 3 hands out the SAME three every single time — which is exactly
 * what Speed and Hardcore used to do. Keep every mode's pool comfortably above 3,
 * and keep the targets reachable inside that mode's clock: Speed wins around turn
 * 12, so a Speed-eligible goal asking for 10 shows is really asking for nothing.
 */
export const OBJECTIVE_DEFINITIONS: Record<string, ObjectiveDefinition> = {
  // ---- reachable inside a short run (Speed's own pool) ----
  sellout_one: {
    id: 'sellout_one',
    title: 'Turned Some Away',
    description: 'Sell out a show (fill a room to 90%+)',
    fameReward: 60,
    modes: ['speed'],
    target: 1,
  },
  combos_three: {
    id: 'combos_three',
    title: 'Something Clicked',
    description: 'Trigger 3 band+venue combos',
    fameReward: 70,
    modes: ['speed'],
    target: 3,
  },
  no_incidents_five: {
    id: 'no_incidents_five',
    title: 'Nobody Called The Cops',
    description: 'Play 5+ shows with zero incidents all run',
    fameReward: 110,
    modes: ['speed'],
    target: 5,
    finalizeOnly: true,
  },
  small_room_four: {
    id: 'small_room_four',
    title: 'Low Ceiling, High Standards',
    description: 'Play 4 shows in rooms of 90 capacity or under',
    fameReward: 90,
    modes: ['speed', 'classic'],
    target: 4,
  },
  all_ages_three: {
    id: 'all_ages_three',
    title: 'X’s On Every Hand',
    description: 'Play 3 all-ages shows',
    fameReward: 90,
    modes: ['speed', 'festival'],
    target: 3,
  },

  // ---- any mode ----
  full_bill: {
    id: 'full_bill',
    title: 'Somebody’s Gotta Open',
    description: 'Put 3 acts on one bill',
    fameReward: 80,
    modes: [],
    target: 3,
  },
  never_gouged: {
    id: 'never_gouged',
    title: 'Five Bucks At The Door',
    description: 'Finish the run having never charged over $15 at the door',
    fameReward: 130,
    modes: [],
    target: 1,
    finalizeOnly: true,
  },
  never_worked: {
    id: 'never_worked',
    title: 'Never Took The Shift',
    description: 'Finish the run having never worked a day job',
    fameReward: 150,
    modes: ['speed', 'classic'],
    target: 1,
    finalizeOnly: true,
  },
  sellout_three: {
    id: 'sellout_three',
    title: 'Packed Houses',
    description: 'Sell out 3 shows (fill a room to 90%+)',
    fameReward: 100,
    modes: ['classic', 'festival', 'hardcore'],
    target: 3,
  },

  // ---- the long haul (Classic / Festival / Hardcore) ----
  bank_thousand: {
    id: 'bank_thousand',
    title: 'A Grand At The Door',
    description: 'Take in $1,000 of show revenue in a single turn',
    fameReward: 75,
    modes: ['classic', 'festival', 'hardcore'],
    target: 1000,
  },
  eight_combos: {
    id: 'eight_combos',
    title: 'It All Fit Together',
    description: 'Trigger 8 band+venue combos in one run',
    fameReward: 125,
    modes: ['classic', 'festival', 'hardcore'],
    target: 8,
  },
  theater_tier: {
    id: 'theater_tier',
    title: 'A Room With A Dressing Room',
    description: 'Headline a 500-capacity room',
    fameReward: 120,
    modes: ['classic', 'festival', 'hardcore'],
    target: 500,
  },
  workhorse: {
    // Replaces survive_escalation (which targeted turn 31 — unreachable, since
    // every mode WINS and ends well before then). Total shows is reachable + real.
    id: 'workhorse',
    title: 'Twelve Nights, One Van',
    description: 'Play 12 shows in a single run',
    fameReward: 110,
    modes: ['classic', 'hardcore', 'festival'],
    target: 12,
  },
  bills_six: {
    id: 'bills_six',
    title: 'Never A Solo Night',
    description: 'Play 6 shows with 2+ acts on the bill',
    fameReward: 115,
    modes: ['classic', 'festival', 'hardcore'],
    target: 6,
  },
  all_ages_eight: {
    id: 'all_ages_eight',
    title: 'The Kids Were Always There',
    description: 'Play 8 all-ages shows',
    fameReward: 135,
    modes: ['classic', 'festival', 'hardcore'],
    target: 8,
  },
  zero_disasters: {
    id: 'zero_disasters',
    title: 'Nothing Caught Fire',
    description: 'Play 10+ shows with zero incidents all run',
    fameReward: 150,
    modes: ['classic'],
    target: 10,
    finalizeOnly: true,
  },
};

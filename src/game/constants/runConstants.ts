/**
 * Phase A Run Constants
 * These values are LOCKED per PRD.md
 */

// Run Structure
export const MAX_TURNS = 35;
export const ESCALATION_START_TURN = 31;

// Synergy Slots
export const BASE_MAX_SYNERGIES = 3;
export const HARD_CAP_EFFECTIVE_SYNERGIES = 5;

// Roster Slots (Balatro-joker-style band cap) — how many acts you can have
// signed at once. Modifiers (per-mode deltas, the Scene Expansion meta upgrade,
// and city unlocks) push the effective cap up or down at run start. The floor
// equals the per-show bill cap (3) so you can always field a full lineup.
export const BASE_ROSTER_SLOTS = 4;
export const ROSTER_SLOT_FLOOR = 3;

// In-run "Booking Manager" hire: spend cash to expand the roster cap by 1,
// applied immediately. Each successive hire costs more (escalating cash sink),
// and you can't hire past having a slot for every band in town.
export const BOOKING_MANAGER_BASE_COST = 250;
export const BOOKING_MANAGER_COST_STEP = 250;
export const nextBookingManagerCost = (hired: number): number =>
  BOOKING_MANAGER_BASE_COST + hired * BOOKING_MANAGER_COST_STEP;

// Endgame Escalation (turns 31-35)
export const ESCALATION_COST_MULTIPLIER = 1.5;
export const ESCALATION_INCIDENT_MULTIPLIER = 2.0;
export const ESCALATION_RECOVERY_PENALTY = 0.5;

// Win/Loss Thresholds
export const BREAKTHROUGH_REPUTATION_THRESHOLD = 80;
export const BREAKTHROUGH_FANS_THRESHOLD = 500;
export const BURNOUT_STRESS_CAP = 100;
export const EVICTION_TURNS_BROKE = 3;

// Turn Economy
// Flat per-turn burn ("rent, ramen, and regret"). Venue rent is paid per
// show at booking/resolution time — NOT per turn for every city venue.
export const LIVING_COSTS_PER_TURN = 20;

// Base stress each show adds before the run's stressMultiplier. Touring is
// tiring — this is what makes the Burnout loss reachable through play (not
// just day jobs) and gives Speed mode's stress modifier teeth.
export const SHOW_STRESS_BASE = 4;

// Stress shed each turn from simply resting (the scene breathes between shows).
// Without this, stress only ever climbs and Burnout was a near-certainty in
// longer runs; with it, stress is a resource you pace rather than a death timer.
export const STRESS_RECOVERY_PER_TURN = 5;

// Run End Reasons
export type RunEndReason =
  | 'BREAKTHROUGH_WIN'
  | 'BURNOUT_LOSS'
  | 'EVICTION_LOSS'
  | 'FADE_OUT_LOSS';

export interface RunEndState {
  reason: RunEndReason;
  turn: number;
  finalStats: {
    money: number;
    reputation: number;
    fans: number;
    stress: number;
    showsPlayed: number;
  };
}

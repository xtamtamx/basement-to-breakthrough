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
export const LIVING_COSTS_PER_TURN = 30;

// Base stress each show adds before the run's stressMultiplier. Touring is
// tiring — this is what makes the Burnout loss reachable through play (not
// just day jobs) and gives Speed mode's stress modifier teeth.
export const SHOW_STRESS_BASE = 4;

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

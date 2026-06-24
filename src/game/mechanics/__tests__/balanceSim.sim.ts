/**
 * Balance simulation harness (NOT a unit test — run explicitly):
 *   npx vitest run src/game/mechanics/__tests__/balanceSim.sim.ts
 *
 * Drives the REAL store + engine through full runs with a competent-greedy
 * player strategy, across every run mode, many iterations, and prints an
 * aggregate report: outcome distribution, win rate, end turn, final stats,
 * attendance, shows played, peak economy. Uses real Math.random (real
 * incidents). Meta-upgrade bonuses stay 0 (the AI never shops), so runs are
 * comparable.
 */
import { describe, it } from 'vitest';
import { useGameStore } from '@stores/gameStore';
import { turnResolutionEngine } from '../TurnResolutionEngine';
import { startNewRun } from '../runLifecycle';
import { difficultySystem } from '../DifficultySystem';
import { runManager } from '../RunManager';
import { dayJobSystem } from '../DayJobSystem';
import { synergyManager } from '../SynergyManager';
import { rollTravelOffer } from '@game/world/travelModes';

// Greedy "keep the best instinct" rank for milestone replacement.
const RARITY_RANK: Record<string, number> = { COMMON: 0, UNCOMMON: 1, RARE: 2, LEGENDARY: 3 };

// Accept a milestone synergy offer the way a player would: equip it, replacing
// the weakest-rarity slot when full. Keeps the sim on-model with production.
function acceptSynergyOffer(turn: number): void {
  const s = useGameStore.getState();
  const offer = s.pendingSynergyOffer;
  if (!offer) return;
  if (synergyManager.isFull()) {
    const weakest = [...synergyManager.getEquippedSynergies()].sort(
      (a, b) => RARITY_RANK[a.synergy.rarity] - RARITY_RANK[b.synergy.rarity],
    )[0];
    synergyManager.acquireSynergy(offer, turn); // stages as pending
    if (weakest) synergyManager.replaceSynergy(weakest.slotIndex, turn);
  } else {
    synergyManager.acquireSynergy(offer, turn);
  }
  s.setPendingSynergyOffer(null);
}
import { isVenueUnlocked } from '@game/world/venueProgression';
import { isCityUnlocked } from '@game/world/cityUnlocks';
import { Show } from '@game/types';

interface RunOutcome {
  mode: string;
  reason: string;
  endTurn: number;
  rep: number;
  fans: number;
  money: number;
  stress: number;
  shows: number;
  peakAttendance: number;
  totalRevenue: number;
  cities: number; // distinct cities played in
  travels: number; // times hit the road
}

let showSeq = 0;

// A new run now seeds only ONE signed act; signing the (free) available bands
// is the player's job. A competent player grabs a few to have bill options —
// signing up to 3 reproduces the roster depth the economy was tuned around.
function signRoster(target = 3): void {
  const s = useGameStore.getState();
  if (s.rosterBandIds.length >= target) return;
  for (const b of s.allBands) {
    if (useGameStore.getState().rosterBandIds.length >= target) break;
    if (!useGameStore.getState().rosterBandIds.includes(b.id)) {
      s.addBandToRoster(b.id);
    }
  }
}

// Competent strategy: book the strongest show that keeps a cash buffer.
// A prudent player doesn't blow the bank on the biggest venue every turn —
// they pick an affordable room and scale the bill to their budget.
function bookBestShow(): void {
  const s = useGameStore.getState();
  const roster = s.allBands.filter(
    (b) =>
      s.rosterBandIds.includes(b.id) && !difficultySystem.isBandUnavailable(b.id),
  );
  if (roster.length === 0) return;
  // More bands when flush, fewer when tight (each band costs a fee).
  const bandCount = s.money > 400 ? 3 : s.money > 200 ? 2 : 1;
  const bands = [...roster]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, bandCount);

  // Only spend up to ~40% of cash on rent, keeping a buffer for living costs.
  const rentCeiling = Math.max(0, s.money * 0.4);
  const venues = s.venues.filter(
    (v) =>
      isVenueUnlocked(v, s.peakReputation) &&
      !difficultySystem.isVenueRaided(v.id) &&
      v.rent <= rentCeiling,
  );
  if (venues.length === 0) return;
  // Pick the best profit margin (capacity is the draw proxy, rent the cost) —
  // a competent player banks money, not just chases the biggest room.
  const venue = [...venues].sort(
    (a, b) => b.capacity * 4 - b.rent - (a.capacity * 4 - a.rent),
  )[0];

  const show: Show = {
    id: `sim-${showSeq++}`,
    bandId: bands[0].id,
    venueId: venue.id,
    lineup: bands.map((b) => b.id),
    ticketPrice: 12,
    date: new Date(),
    status: 'SCHEDULED',
  };
  s.scheduleShow(show, 1);
}

// A competent player works a day job to survive a cash crunch, then quits to
// focus on the music once flush (jobs cost reputation/stress).
function manageDayJob(): void {
  const s = useGameStore.getState();
  const current = dayJobSystem.getCurrentJob();
  // Emergency net only: work near eviction, picking the job with the best
  // pay-per-reputation-damage, and quit the moment cash recovers (jobs bleed
  // reputation, so a skilled player doesn't grind them).
  if (s.money < 90 && !current) {
    const best = [...dayJobSystem.getAvailableJobs()].sort(
      (a, b) =>
        b.moneyPerTurn / (1 + Math.abs(b.reputationChange)) -
        a.moneyPerTurn / (1 + Math.abs(a.reputationChange)),
    )[0];
    if (best) dayJobSystem.setJob(best);
  } else if (s.money > 250 && current) {
    dayJobSystem.setJob(null);
  }
}

// Take the scene on the road: roughly every 7 turns, hop to a different
// unlocked city (rotating through them so every city's signature + scene-fit
// gets exercised). Picks the most cash-favorable travel offer — a thrifty
// touring band — and mirrors the UI by clearing any booked show first.
// Returns true if it travelled this turn.
function maybeTravel(turn: number): boolean {
  const s = useGameStore.getState();
  if (turn === 0 || turn % 7 !== 0) return false;
  const dests = s.cities.filter((c) => c.id !== s.currentCityId && isCityUnlocked(c));
  if (dests.length === 0) return false;
  const dest = dests[Math.floor(turn / 7) % dests.length];

  s.cancelAllScheduledShows();
  const offer = [...rollTravelOffer({ reputation: s.reputation }, 3)].sort(
    (a, b) => b.effects.money - a.effects.money,
  )[0];
  if (offer) {
    const e = offer.effects;
    if (e.money) s.addMoney(e.money);
    if (e.stress) s.addStress(e.stress);
    if (e.fans) s.addFans(e.fans);
    if (e.diyPoints) s.makePathChoice('sim_travel', e.diyPoints);
  }
  s.switchCity(dest.id);
  return true;
}

async function playOneRun(mode: string): Promise<RunOutcome> {
  await startNewRun(mode);
  dayJobSystem.setJob(null); // clean slate each run
  const cap = (runManager.getCurrentRun()?.config.maxTurns ?? 35) + 20;
  let peakAttendance = 0;
  let totalRevenue = 0;
  const citiesVisited = new Set<string>();
  let travels = 0;

  for (let i = 0; i < cap; i++) {
    if (maybeTravel(i)) travels++;
    citiesVisited.add(useGameStore.getState().currentCityId);
    signRoster();
    manageDayJob();
    bookBestShow();
    const result = await turnResolutionEngine.executeFullTurn();
    acceptSynergyOffer(i);
    // Resolve any drawn event card like a player would (take the first choice).
    const ev = useGameStore.getState().pendingEventCard;
    if (ev) useGameStore.getState().applyEventCardChoice(ev.choices?.[0]?.id ?? null);
    result.showResults.forEach((r) => {
      peakAttendance = Math.max(peakAttendance, r.attendance);
      totalRevenue += r.revenue;
    });
    if (result.runEnd) {
      const s = useGameStore.getState();
      return {
        mode,
        reason: result.runEnd.reason,
        endTurn: result.runEnd.turn,
        rep: s.reputation,
        fans: s.fans,
        money: s.money,
        stress: s.stress,
        shows: s.showHistory.length,
        peakAttendance,
        totalRevenue,
        cities: citiesVisited.size,
        travels,
      };
    }
  }
  const s = useGameStore.getState();
  return {
    mode,
    reason: 'NO_END(cap)',
    endTurn: s.currentRound,
    rep: s.reputation,
    fans: s.fans,
    money: s.money,
    stress: s.stress,
    shows: s.showHistory.length,
    peakAttendance,
    totalRevenue,
    cities: citiesVisited.size,
    travels,
  };
}

function avg(ns: number[]): number {
  return ns.length ? Math.round((ns.reduce((a, b) => a + b, 0) / ns.length) * 10) / 10 : 0;
}

describe('balance simulation', () => {
  it('plays full runs across modes and reports aggregates', async () => {
    const modes = ['classic', 'speed', 'hardcore', 'festival'];
    const N = 12;
    const report: string[] = ['', '===== BALANCE SIM (' + N + ' runs/mode) ====='];

    for (const mode of modes) {
      const outcomes: RunOutcome[] = [];
      for (let i = 0; i < N; i++) outcomes.push(await playOneRun(mode));

      const dist: Record<string, number> = {};
      outcomes.forEach((o) => (dist[o.reason] = (dist[o.reason] || 0) + 1));
      const wins = outcomes.filter((o) => o.reason === 'BREAKTHROUGH_WIN').length;

      report.push(
        '\n--- ' + mode.toUpperCase() + ' ---',
        'win rate: ' + Math.round((wins / N) * 100) + '%   outcomes: ' + JSON.stringify(dist),
        'end turn:  avg ' + avg(outcomes.map((o) => o.endTurn)),
        'rep:       avg ' + avg(outcomes.map((o) => o.rep)) + '  (max ' + Math.max(...outcomes.map((o) => o.rep)) + ')',
        'fans:      avg ' + avg(outcomes.map((o) => o.fans)) + '  (max ' + Math.max(...outcomes.map((o) => o.fans)) + ')',
        'money:     avg ' + avg(outcomes.map((o) => o.money)),
        'stress:    avg ' + avg(outcomes.map((o) => o.stress)),
        'shows:     avg ' + avg(outcomes.map((o) => o.shows)),
        'peak att:  avg ' + avg(outcomes.map((o) => o.peakAttendance)),
        'revenue:   avg ' + avg(outcomes.map((o) => o.totalRevenue)),
        'cities:    avg ' + avg(outcomes.map((o) => o.cities)) + '  (max ' + Math.max(...outcomes.map((o) => o.cities)) + ')',
        'travels:   avg ' + avg(outcomes.map((o) => o.travels)),
      );
    }
    console.log(report.join('\n'));
  }, 120000);
});

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';

// Roster slot cap: addBandToRoster is the safety net for
// any non-UI caller — it must honor maxRosterSize and never double-sign.
describe('gameStore roster slot cap', () => {
  beforeEach(() => {
    useGameStore.setState({ rosterBandIds: [], maxRosterSize: 4 });
  });

  it('signs a band when under the cap', () => {
    useGameStore.getState().addBandToRoster('b1');
    expect(useGameStore.getState().rosterBandIds).toEqual(['b1']);
  });

  it('is a no-op once the roster is full', () => {
    useGameStore.setState({ rosterBandIds: ['a', 'b', 'c', 'd'], maxRosterSize: 4 });
    useGameStore.getState().addBandToRoster('e');
    expect(useGameStore.getState().rosterBandIds).toEqual(['a', 'b', 'c', 'd']);
  });

  it('does not double-sign a band already on the roster', () => {
    useGameStore.setState({ rosterBandIds: ['a'], maxRosterSize: 4 });
    useGameStore.getState().addBandToRoster('a');
    expect(useGameStore.getState().rosterBandIds).toEqual(['a']);
  });

  it('respects a tighter cap (e.g. Hardcore = 3)', () => {
    useGameStore.setState({ rosterBandIds: ['a', 'b', 'c'], maxRosterSize: 3 });
    useGameStore.getState().addBandToRoster('d');
    expect(useGameStore.getState().rosterBandIds).toEqual(['a', 'b', 'c']);
  });
});

// Booking Manager: a mid-run cash sink that grants +1 roster slot immediately.
describe('gameStore Booking Manager hire', () => {
  const eightBands = Array.from({ length: 8 }, (_, i) => ({ id: `b${i}` })) as never;

  beforeEach(() => {
    useGameStore.setState({
      allBands: eightBands,
      maxRosterSize: 4,
      hiredManagers: 0,
      money: 1000,
    });
  });

  it('spends cash and bumps the cap + hire count immediately', () => {
    useGameStore.getState().hireBookingManager();
    const s = useGameStore.getState();
    expect(s.maxRosterSize).toBe(5);
    expect(s.hiredManagers).toBe(1);
    expect(s.money).toBe(750); // 1000 − 250 base cost
  });

  it('escalates the cost each hire', () => {
    useGameStore.getState().hireBookingManager(); // $250 → 750
    useGameStore.getState().hireBookingManager(); // $500 → 250
    const s = useGameStore.getState();
    expect(s.maxRosterSize).toBe(6);
    expect(s.hiredManagers).toBe(2);
    expect(s.money).toBe(250);
  });

  it('is a no-op when you cannot afford the fee', () => {
    useGameStore.setState({ money: 100 });
    useGameStore.getState().hireBookingManager();
    const s = useGameStore.getState();
    expect(s.maxRosterSize).toBe(4);
    expect(s.money).toBe(100);
  });

  it('is a no-op once there is a slot for every band in town', () => {
    useGameStore.setState({ maxRosterSize: 8, money: 5000 }); // 8 slots, 8 bands
    useGameStore.getState().hireBookingManager();
    const s = useGameStore.getState();
    expect(s.maxRosterSize).toBe(8);
    expect(s.money).toBe(5000);
  });
});

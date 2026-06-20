import { describe, it, expect, beforeEach } from 'vitest';
import { TutorialManager } from '../TutorialManager';

const slice = (over: Partial<{ rosterBandIds: string[]; scheduledShows: unknown[] }> = {}) => ({
  rosterBandIds: [],
  scheduledShows: [],
  ...over,
});

describe('TutorialManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('is inactive until started, then opens on the welcome step', () => {
    const tm = new TutorialManager();
    expect(tm.getCurrentStep()).toBeNull();

    tm.startTutorial();
    expect(tm.isActive()).toBe(true);
    expect(tm.getCurrentStep()?.id).toBe('welcome');
    expect(tm.getCurrentProgress()).toEqual({ current: 1, total: 10 });
  });

  it("'button' steps advance only via advance()", () => {
    const tm = new TutorialManager();
    tm.startTutorial();
    tm.advance(); // welcome -> resources
    expect(tm.getCurrentStep()?.id).toBe('resources');
  });

  it("'tap' steps advance only on tapAdvance(), not advance()", () => {
    const tm = new TutorialManager();
    tm.startTutorial();
    tm.advance(); // -> resources (button)
    tm.advance(); // -> jokers (button)
    tm.advance(); // -> challenges (button)
    tm.advance(); // -> go-bands (tap)
    expect(tm.getCurrentStep()?.id).toBe('go-bands');

    tm.evaluateState(slice({ scheduledShows: [{}] })); // wrong gate kind — no-op
    expect(tm.getCurrentStep()?.id).toBe('go-bands');

    tm.tapAdvance(); // -> sign-band
    expect(tm.getCurrentStep()?.id).toBe('sign-band');
  });

  it("the sign-band 'state' gate advances only once a second band is signed", () => {
    const tm = new TutorialManager();
    tm.startTutorial();
    tm.advance(); // resources
    tm.advance(); // jokers
    tm.advance(); // challenges
    tm.advance(); // go-bands
    tm.tapAdvance(); // sign-band
    expect(tm.getCurrentStep()?.id).toBe('sign-band');

    tm.evaluateState(slice({ rosterBandIds: ['only-one'] })); // still 1 — stays
    expect(tm.getCurrentStep()?.id).toBe('sign-band');

    tm.evaluateState(slice({ rosterBandIds: ['a', 'b'] })); // signed a 2nd — advances
    expect(tm.getCurrentStep()?.id).toBe('go-shows');
  });

  it("the build-show 'state' gate advances only once a show is booked", () => {
    const tm = new TutorialManager();
    tm.startTutorial();
    // welcome, resources, jokers, challenges, go-bands, sign-band, go-shows, build-show
    tm.advance(); // resources
    tm.advance(); // jokers
    tm.advance(); // challenges
    tm.advance(); // go-bands
    tm.tapAdvance(); // sign-band
    tm.evaluateState(slice({ rosterBandIds: ['a', 'b'] })); // go-shows
    tm.tapAdvance(); // build-show
    expect(tm.getCurrentStep()?.id).toBe('build-show');

    tm.evaluateState(slice({ scheduledShows: [] })); // no shows yet — stays
    expect(tm.getCurrentStep()?.id).toBe('build-show');

    tm.evaluateState(slice({ scheduledShows: [{ id: 's1' }] })); // booked — advances
    expect(tm.getCurrentStep()?.id).toBe('next-turn');
  });

  it('completing the last step ends the tutorial and records it done', () => {
    const tm = new TutorialManager();
    tm.startTutorial();
    // walk to the final 'results' step
    tm.advance(); // resources
    tm.advance(); // jokers
    tm.advance(); // challenges
    tm.advance(); // go-bands
    tm.tapAdvance(); // sign-band
    tm.evaluateState(slice({ rosterBandIds: ['a', 'b'] })); // go-shows
    tm.tapAdvance(); // build-show
    tm.evaluateState(slice({ scheduledShows: [{}] })); // next-turn
    tm.tapAdvance(); // results
    expect(tm.getCurrentStep()?.id).toBe('results');

    tm.advance(); // Finish
    expect(tm.isActive()).toBe(false);
    expect(tm.getCurrentStep()).toBeNull();
  });

  it('does not auto-start once finished, but a manual restart still works', () => {
    const first = new TutorialManager();
    first.startTutorial();
    first.skipTutorial();

    // A fresh instance reads persisted 'done' and refuses to auto-start.
    const next = new TutorialManager();
    next.maybeStartForNewGame();
    expect(next.isActive()).toBe(false);

    // The Settings "Restart Tutorial" path ignores 'done'.
    next.startTutorial();
    expect(next.isActive()).toBe(true);
    expect(next.getCurrentStep()?.id).toBe('welcome');
  });

  it('auto-starts for a brand-new player who has never seen it', () => {
    const tm = new TutorialManager();
    tm.maybeStartForNewGame();
    expect(tm.isActive()).toBe(true);
    expect(tm.getCurrentStep()?.id).toBe('welcome');
  });

  it('resetProgress clears the done flag so it can auto-start again', () => {
    const tm = new TutorialManager();
    tm.startTutorial();
    tm.skipTutorial();
    tm.resetProgress();

    const next = new TutorialManager();
    next.maybeStartForNewGame();
    expect(next.isActive()).toBe(true);
  });
});

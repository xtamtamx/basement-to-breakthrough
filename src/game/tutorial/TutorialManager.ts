/** The narrow slice of live game state the action-gated steps actually read. */
export interface TutorialGameSlice {
  rosterBandIds: string[];
  scheduledShows: unknown[];
}

/**
 * Where a step's tooltip sits. Target-relative ('above'/'below') anchors to the
 * highlighted element; screen-anchored ones float regardless of any target so
 * the tip stays put while the underlying view animates / scrolls / re-lays-out.
 */
export type TutorialPlacement = 'center' | 'above' | 'below' | 'screen-top' | 'screen-bottom';

/**
 * How a step advances:
 *  - button: an explicit Next/Got it/Finish tap (informational steps)
 *  - tap:    the player taps the highlighted target itself (navigation steps)
 *  - state:  a real change to game state satisfies `when` (the hands-on steps —
 *            sign a band, book a show — gated on the genuine outcome, not on
 *            poking a specific pixel)
 */
export type TutorialGate =
  | { kind: 'button'; label: string }
  | { kind: 'tap' }
  | { kind: 'state'; when: (s: TutorialGameSlice) => boolean };

export interface TutorialStep {
  id: string;
  title: string;
  body: string;
  /** `[data-tut="…"]` selector to spotlight / anchor the tooltip to. */
  target?: string;
  placement: TutorialPlacement;
  gate: TutorialGate;
  /** Sub-text under the body for tap/state steps ("👆 Tap Bands"). */
  hint?: string;
}

/**
 * The first-show walkthrough: a short welcome, then a hands-on guided night —
 * sign a band, book it, play the turn, read the report. Each step targets a
 * stable `[data-tut]` hook so a restyle can't silently break it, and the
 * hands-on steps gate on real game state so the player learns by doing.
 */
const STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to the scene 🎸',
    body:
      "You run a DIY music empire — from basement shows to sold-out festivals. " +
      "Let's book your very first night. Takes about a minute.",
    placement: 'center',
    gate: { kind: 'button', label: "Let's go" },
  },
  {
    id: 'resources',
    title: 'Keep an eye up here',
    body:
      '$ is cash for rent and bookings. ★ is reputation — it draws bigger crowds. ' +
      '♦ is your fanbase. Watch these as your scene grows.',
    target: '[data-tut="resources"]',
    placement: 'below',
    gate: { kind: 'button', label: 'Got it' },
  },
  {
    id: 'go-bands',
    title: 'Sign an act',
    body: 'Every show needs a band. Open the Bands tab to scout the local talent.',
    target: '[data-tut="nav-bands"]',
    placement: 'above',
    gate: { kind: 'tap' },
    hint: '👆 Tap Bands',
  },
  {
    id: 'sign-band',
    title: 'Sign your first act',
    body:
      "You're starting light — just one band signed. Your roster is who you can put on a bill. " +
      'Open the "Available" tab, TAP a band to expand it, then hit "Sign to Roster".',
    placement: 'screen-top',
    // New runs seed exactly one signed act (gameStore loadInitialGameData), so
    // signing one more takes the roster to 2 and advances the step.
    gate: { kind: 'state', when: (s) => s.rosterBandIds.length >= 2 },
    hint: 'Sign a band to continue',
  },
  {
    id: 'go-shows',
    title: 'Book the night',
    body: "You've got a band — now find them a stage. Head to the Shows tab.",
    target: '[data-tut="nav-shows"]',
    placement: 'above',
    gate: { kind: 'tap' },
    hint: '👆 Tap Shows',
  },
  {
    id: 'build-show',
    title: 'Put the show together',
    body:
      'Pick your lineup, choose a venue, and set the door price. ' +
      'The preview shows your expected crowd and profit. When it looks good, tap "Book This Show".',
    placement: 'screen-top',
    gate: { kind: 'state', when: (s) => s.scheduledShows.length > 0 },
    hint: 'Book a show to continue',
  },
  {
    id: 'next-turn',
    title: 'Play the night',
    body: 'Shows happen when time passes. Hit the Next Turn button to run the night and see how it went.',
    target: '[data-tut="next-turn"]',
    placement: 'above',
    gate: { kind: 'tap' },
    hint: '👆 Tap Next Turn',
  },
  {
    id: 'results',
    title: "That's the loop! 🤘",
    body:
      'Your damage report: crowd, cash, cred and new fans. ' +
      'Keep booking smarter shows to grow the scene — and when you can, hit the road on the Tour tab. ' +
      "Have fun out there.",
    placement: 'screen-top',
    gate: { kind: 'button', label: 'Finish' },
  },
];

const STORAGE_KEY = 'btb-tutorial-v2';

export class TutorialManager {
  private steps: TutorialStep[] = STEPS;
  private index = -1; // -1 = inactive
  private active = false;
  private done = false; // completed OR skipped — never auto-show again
  private onUpdateCallbacks: Array<() => void> = [];

  constructor() {
    this.load();
  }

  // ── Queries ────────────────────────────────────────────────────────────
  isActive(): boolean {
    return this.active;
  }

  getCurrentStep(): TutorialStep | null {
    if (!this.active || this.index < 0 || this.index >= this.steps.length) return null;
    return this.steps[this.index];
  }

  getCurrentProgress(): { current: number; total: number } {
    return { current: this.index + 1, total: this.steps.length };
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────
  /** Start (or restart) from the top. Used by the Settings "replay" button. */
  startTutorial(): void {
    this.done = false;
    this.active = true;
    this.index = 0;
    this.notifyUpdate();
    this.save();
  }

  /** Auto-start only for a genuinely new player who hasn't seen/skipped it. */
  maybeStartForNewGame(): void {
    if (this.done || this.active) return;
    this.startTutorial();
  }

  /** Advance from a 'button' step. */
  advance(): void {
    if (!this.active) return;
    this.go(this.index + 1);
  }

  /** Advance from a 'tap' step when the highlighted target is tapped. */
  tapAdvance(): void {
    const step = this.getCurrentStep();
    if (step?.gate.kind === 'tap') this.go(this.index + 1);
  }

  /** Advance from a 'state' step when its predicate is satisfied. */
  evaluateState(state: TutorialGameSlice): void {
    const step = this.getCurrentStep();
    if (step?.gate.kind === 'state' && step.gate.when(state)) {
      this.go(this.index + 1);
    }
  }

  private go(next: number): void {
    if (next >= this.steps.length) {
      this.finish();
      return;
    }
    this.index = next;
    this.notifyUpdate();
    this.save();
  }

  private finish(): void {
    this.done = true;
    this.active = false;
    this.index = -1;
    this.notifyUpdate();
    this.save();
  }

  /** Bail out — resumable later from Settings. */
  skipTutorial(): void {
    this.finish();
  }

  /** Wipe progress so the walkthrough can be replayed. */
  resetProgress(): void {
    this.done = false;
    this.active = false;
    this.index = -1;
    this.save();
    this.notifyUpdate();
  }

  // ── Subscriptions ──────────────────────────────────────────────────────
  onUpdate(callback: () => void): () => void {
    this.onUpdateCallbacks.push(callback);
    return () => {
      this.onUpdateCallbacks = this.onUpdateCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyUpdate(): void {
    this.onUpdateCallbacks.forEach((cb) => cb());
  }

  // ── Persistence ────────────────────────────────────────────────────────
  // Only the "have they finished/skipped it" bit survives a reload; an
  // in-flight walkthrough is in-memory (mid-flow resume across reloads would
  // race against a changed board). It only ever auto-starts on a fresh run.
  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ done: this.done }));
    } catch {
      /* storage unavailable — non-fatal */
    }
  }

  private load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      this.done = Boolean(parsed?.done);
    } catch {
      /* ignore corrupt state */
    }
  }
}

// Singleton instance
export const tutorialManager = new TutorialManager();

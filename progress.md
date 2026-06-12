# Progress - Phase A

## Status
**IN PROGRESS** — Core systems implemented. The "preexisting build issues" that
blocked validation were fixed by the June 2026 reel-in (1842 tsc errors → 0,
187/187 tests, 0 lint problems; merged to `main` 2026-06-12). The remaining work
is the actual migration: wire `TurnResolutionEngine` into the live game loop in
place of the deprecated `TurnProcessor` (decided 2026-06-12).

## What Changed

### Iteration 1 (2026-01-27)

**Created Files:**
- `src/game/constants/runConstants.ts` - Phase A constants (MAX_TURNS=35, BASE_MAX_SYNERGIES=3, HARD_CAP=5, escalation config)
- `src/game/mechanics/SynergyManager.ts` - THE authoritative synergy system with:
  - Player-equipped synergy slots (3 base, modifiable, 5 hard cap)
  - TURN_START/TURN_END/SHOW_START/SHOW_END/PASSIVE triggers
  - 12 starter synergies (6 common, 4 uncommon, 2 rare)
  - Replacement flow when slots full
  - Visible, explainable effects
- `src/game/mechanics/TurnResolutionEngine.ts` - Single deterministic turn resolution entrypoint with:
  - Turn start triggers
  - Show resolution with synergy effects
  - Turn end triggers
  - Endgame checks (Breakthrough win, Burnout/Eviction/Fade Out loss)
  - Escalation at turns 31-35
- `src/components/game/SynergyBar.tsx` - Always-visible synergy slot display
- `src/components/game/SynergyAcquireModal.tsx` - Modal for acquiring/replacing synergies
- `src/components/game/SynergyTriggerFeedback.tsx` - Visual feedback when synergies trigger
- `src/components/game/RunEndScreen.tsx` - End-of-run results screen

**Modified Files:**
- `src/game/mechanics/TurnProcessor.ts` - Added deprecation notice, updated to use new synergy system
- `src/game/mechanics/SynergySystemV2.ts` - Added deprecation notice
- `src/index.css` - Added synergy animation keyframes
- `src/hooks/useAccessibility.ts` -> `.tsx` - Fixed JSX in .ts file
- `src/components/game/views/ProgressionView.tsx` - Fixed corrupted file (was preexisting issue)

**Commands Run:**
```bash
npm run build  # Preexisting errors found (300+ unrelated to Phase A)
npx tsc --noEmit | grep [Phase A files]  # Phase A files: 0 type errors
npx eslint [Phase A files]  # Phase A files: 0 lint errors (after fixes)
```

## Preexisting Issues Found
The codebase has 300+ TypeScript errors predating Phase A:
- ErrorBoundary override modifiers
- Undefined checks on array accesses
- Unused imports
- Type mismatches in sprite utilities
- process.env.NODE_ENV access patterns

These are NOT Phase A blockers - they existed before this work began.

### Iteration 2 (2026-06-12) — migration completed

`TurnResolutionEngine` is now THE live turn engine. It absorbed TurnProcessor's
full pipeline (promotion/hype, multi-band bills, equipment condition, difficulty
scaling, day jobs, venue rent/upkeep/degradation, walkers) and kept the Phase A
run structure (TURN_START/SHOW_END/TURN_END synergy phases, escalation costs,
endgame checks). `MainGameViewImproved` calls `executeFullTurn()`; `RunEndScreen`
is wired and shows after the final turn's results modal. `TurnProcessor` deleted;
15 engine tests replace its 7 (195 total green). Verified live: eviction ends a
showless run at turn 5 with warnings on the two turns before.

## What's Next
1. Retire `SynergySystemV2` / `SynergyEngine` with the variant cleanup
2. Run-start consistency: route in-game "Try Again" through the same
   run-config/meta-bonus path as the main menu
3. Balance pass now that losing is possible (rent on all venues vs eviction)

## Tasks Checklist
- [x] MAX_TURNS = 35, force run end at turn 35
- [x] Escalation at turn 31
- [x] Authoritative Synergy system created
- [x] BASE_MAX_SYNERGIES = 3
- [x] Slot modifiers implemented
- [x] Hard-cap at 5
- [x] Replacement on overflow
- [x] Synergy bar UI
- [x] Acquire/replace modal
- [x] Trigger feedback
- [x] Deprecated old synergy systems
- [ ] Full 35-turn run playable (needs UI wiring)

## Blocked
Not blocked. (The separate cleanup effort happened: branch `cleanup/reel-it-in`,
merged to `main` 2026-06-12 — build fully green.)

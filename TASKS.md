# Phase A Tasks

## Run Structure
- [x] Set MAX_TURNS = 35
- [x] Force run end at turn 35
- [x] Add escalation at turn 31

## Synergies
- [x] Create authoritative Synergy system
- [x] BASE_MAX_SYNERGIES = 3
- [x] Implement slot modifiers
- [x] Hard-cap effective slots at 5
- [x] Enforce replacement on overflow

## UX
- [x] Always-visible synergy bar
- [x] Acquire / replace modal
- [x] Trigger feedback

## Cleanup
- [x] Remove duplicate synergy logic (deprecated with notices)

## Completion
- [x] Wire `TurnResolutionEngine` into the live loop (2026-06-12: absorbed
      TurnProcessor's full show pipeline — promotion/hype, bills, equipment,
      difficulty, day jobs, venue economy — and kept the Phase A run structure)
- [x] Retire `TurnProcessor` (deleted; engine test suite covers the contract)
- [ ] Retire `SynergySystemV2` / `SynergyEngine` (still imported by
      SynergyViewFixed, BandUpgradeModal, ShowExecutor + tests — variant-cleanup
      task)
- [x] Full run playable with real endings (verified live: eviction at turn 5;
      breakthrough/burnout/fade-out covered by engine tests)
- [ ] ALL TASKS COMPLETE

---

## Notes
- 2026-06-12: build is green (0 tsc errors / 0 lint / 187 tests) — the old
  "300+ preexisting errors" note is resolved (June reel-in, merged to main)
- Direction decided 2026-06-12: cutesy pixel satire is canon; real artists are
  post-launch; TurnResolutionEngine is the authoritative engine going forward
- UI components created but need to be wired into main game flow

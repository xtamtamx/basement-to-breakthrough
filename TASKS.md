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
- [ ] Wire `TurnResolutionEngine` into the live loop (replace deprecated
      `turnProcessor` in `MainGameViewImproved`), reconciled with `RunManager`
      run configs
- [ ] Retire `TurnProcessor`, `SynergySystemV2`, `SynergyEngine` after parity
- [ ] Full 35-turn run playable
- [ ] ALL TASKS COMPLETE

---

## Notes
- 2026-06-12: build is green (0 tsc errors / 0 lint / 187 tests) — the old
  "300+ preexisting errors" note is resolved (June reel-in, merged to main)
- Direction decided 2026-06-12: cutesy pixel satire is canon; real artists are
  post-launch; TurnResolutionEngine is the authoritative engine going forward
- UI components created but need to be wired into main game flow

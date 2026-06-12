# Basement to Breakthrough - Current Status

*Last full audit: 2026-06-12. Supersedes the earlier version of this file, which
predated the June 2026 cleanup and described some stubs as working features.*

## Health

- `npx tsc -b` — 0 errors · `npx eslint .` — 0 problems · 187/187 tests pass
- `main` is current and pushed; `cleanup/reel-it-in` (the June reel-in) is merged

## Direction (decided 2026-06-12)

1. **Tone:** cutesy pixel satire is canon (SNES pixel art + self-aware scene humor)
2. **Real artist integration:** post-launch goal; v1 ships the fictional roster
3. **Engine:** finish the Phase A migration — `TurnResolutionEngine` becomes the
   authoritative turn engine, `TurnProcessor` retires

## What actually works today

- **Core loop:** select 1–3 bands + venue + ticket price → synergy/attendance
  preview → book → Next Turn → results modal. Real validation (rent, all-ages,
  tech requirements, authenticity clash).
- **Resources:** money, reputation, fans, stress, connections.
- **Runs:** `RunManager` with 4 configs (Classic/Speed/Hardcore/Festival) and real
  win/loss conditions; `MetaProgressionManager` tracks history (bonuses calculated
  but not yet visible to the player).
- **Content:** 26 fictional bands, 11 venues, 14 equipment items, 9 day jobs,
  ~11 band↔venue synergies + 12 equippable synergies (SynergyManager).
- **UX:** tutorial system, IndexedDB save + 5-min autosave, swipe tabs, haptics.

## Known gaps (audited 2026-06-12)

- **Two turn engines:** live path uses deprecated `TurnProcessor`; Phase A
  `TurnResolutionEngine` is written but unwired. → Task: finish the migration.
- **Roguelike not felt:** meta-progression invisible, soft losses, no run-end
  ceremony beyond `RunEndScreen` scaffolding.
- **Stubs that lie:** venue raids don't block shows, bands never go unavailable,
  recording-studio upgrades do nothing, Festival mode is a stat reskin,
  gentrification affects nothing, walker promotion effects are TODO.
- **Residual duplication:** `MainGameView→Fixed→Improved` shim chain, 6 orphaned
  city/district view variants, V1/V2 manager pairs, 3 overlapping persistence
  layers (`SaveGameManager` is primary).

## Build-out roadmap

1. Finish Phase A migration (TurnResolutionEngine authoritative, all tests green)
2. Delete orphaned variants, collapse view shims, consolidate persistence
3. Make the roguelike felt: visible meta-progression, win/loss ceremony, unlocks
4. Give stubbed systems teeth or cut them explicitly
5. Content & tone pass leaning into the cutesy-satirical voice

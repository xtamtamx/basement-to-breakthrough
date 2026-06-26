# Basement to Breakthrough - Development Context

> **This directory is the project root.** The git repo, source, and all tooling
> live here. (Cleanup 2026-06-04: an abandoned 1.9 GB Unity template and a
> duplicate stub project that previously sat one level up were removed. Do not
> recreate `package.json`/`src` in the parent directory — that is not the project.)

## Project Overview
Premium mobile-first PWA roguelike music-promotion game: a cutesy pixel-art satire
of the underground scene. Think Balatro's synergy discovery + booking shows from
basements to festivals.

**Tone (decided 2026-06-12): cutesy pixel satire is canon.** SNES-style pixel art,
neon palette, self-aware scene humor ("mandatory fun meeting during band practice").
Punk attitude lives in the writing, not in grimdark visuals.

**Key Differentiators:**
- Premium app model ($6.99, no ads/tracking/IAP)
- Mobile-first design (iOS/Android primary targets)
- Affectionate, self-aware take on underground music culture
- Real artist integration with permission system — **post-launch goal**; v1 ships
  with the fictional roster (keep the `isRealArtist` scaffolding)

## Tech Stack
- **Frontend:** React 19 + TypeScript + Vite 7
- **Styling:** `src/styles/snes.css` is the CANONICAL design system (neon-punk SNES
  tokens + `.snes-*` classes). Tailwind was removed 2026-06-26 (it was silently inert:
  v3 `@tailwind` directives on the v4 engine emitted nothing). gameUI.css holds the
  utility/keyframe layer; pixel-art.css the sprite styles. Prefer `var(--snes-*)` tokens
  + `.snes-*` classes over inline hex/magic-number spacing.
- **State:** Zustand 5
- **Storage:** IndexedDB (via idb)
- **Rendering:** PixiJS 8 (`@pixi/react`)
- **PWA:** vite-plugin-pwa
- **Native:** Capacitor 7 (iOS/Android)

## Development Principles
1. **Mobile-First:** 44px minimum touch targets, 60fps on low-end Android
2. **Premium Quality:** Polished UI/UX befitting paid app
3. **Authentic:** Real artist partnerships, accurate scene representation
4. **Offline-First:** Complete gameplay without connection
5. **Performance:** < 3s load on 3G, < 100MB initial download
6. **One implementation per concern:** When replacing a system or component, DELETE
   the old one. Do not leave `*Fixed`/`*V2`/`*Improved`/`*Simple` variants behind —
   that is what previously sent this project off the rails.

## Core Game Loop
1. **Book Shows:** Match bands to venues considering authenticity, capacity, scene politics
2. **Build Scene:** Progress from basement shows to festivals
3. **Manage Politics:** Navigate faction relationships, band drama
4. **Discover Synergies:** Find powerful band/venue combinations
5. **Unlock Content:** New bands, venues, equipment through progression

## Artist Integration (post-launch — not in the v1 roadmap)
- Real bands integrated with permission
- Attribution and links to artist profiles
- Music samples via Web Audio API
- Potential revenue sharing for contributors

## Commands to Run
- `npm run dev` - Start development server
- `npm run build` - Build for production (`tsc -b && vite build`)
- `npm run type-check` - NOTE: runs `tsc --noEmit` which checks nothing here
  (root tsconfig is references-only). Use `npx tsc -b` for the real type check.
- `npm run lint` - Run ESLint
- `npm test` - Run Vitest
- `npm run build:mobile` - Build and sync for mobile
- `npm run cap:open:ios` / `cap:open:android` - Open native projects

## Key Files
- `src/game/types/core.ts` - Core type definitions ("Game Bible")
- `src/App.tsx` - Live app entry; renders `MainGameView` (the one canonical view)
- `src/stores/gameStore.ts` - Zustand game state
- `src/styles/snes.css` - Canonical design system (tokens + `.snes-*` components)
- `src/hooks/useTouch.ts` - Touch gesture detection
- `src/utils/mobile.ts` - Mobile platform utilities
- `capacitor.config.ts` - Native app configuration

## Current State (2026-06-12)
- **Build is GREEN:** `npx tsc -b` 0 errors, `npx eslint .` 0 problems, 187/187
  tests pass. The `cleanup/reel-it-in` work is merged to `main` and pushed.
- Live render path: `main.tsx` → `App.tsx` → `MainGameView`.
- **Active work: finish the Phase A migration.** `TurnResolutionEngine` +
  `SynergyManager` become the authoritative turn/synergy systems, replacing the
  deprecated `turnProcessor`. See `TASKS.md` / `progress.md`.
- Older docs in `docs/` (TOWN_*, DEVELOPMENT_PLAN phases) partially describe
  systems removed in the June 2026 cleanup — treat them as historical.

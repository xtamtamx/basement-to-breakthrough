/**
 * featureFlags — coarse on/off switches for shipping a focused build.
 *
 * TOURING_ENABLED: the full game has 8 travel cities; for the first tester DEMO
 * we lock everything to the home city (Strong Island) and ship a tight single-city
 * playthrough. Flip this to `true` to restore the Tour tab, travel, and the
 * multi-city flavor (band home-city bonuses, "tour there" hints, etc.). Nothing is
 * deleted — just gated — so re-enabling is a one-line change.
 */
// Annotated `boolean` (not the literal `false`) so flag-gated branches don't read
// as constant/unreachable to the type-checker + linter.
export const TOURING_ENABLED: boolean = false;

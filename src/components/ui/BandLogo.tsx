import React, { useMemo } from 'react';
import { Band } from '@game/types/core';
import { logoStyleFor } from '@game/data/bandLogoStyles';

/**
 * BandLogo — each band's wordmark as a nod to its source act's iconic logo,
 * with FIDELITY tracking the DIY↔sellout meter:
 *
 *   pure-diy          THE logo: archetype font + full structure
 *   diy-leaning       cut-&-paste version of the logo
 *   balanced          hand-drawn version: same structure, marker hand
 *   corporate-leaning uniform handwriting (every band the same neat script)
 *   full-sellout      uniform ticket print (identical Helvetica caps)
 *
 * Mechanics: the component renders TWO children — a plain `__flat` span and a
 * per-letter `__fancy` span (arch/jitter/stretched ends). CSS under
 * [data-skin] decides which one shows: DIY-side skins reveal the fancy lockup
 * (hero only), corporate skins show the flat span and typeset it uniformly.
 * Casing and fonts are pure CSS (per-archetype classes in skins.css), so the
 * sellout tiers can homogenize everything without JS knowing the skin.
 * Per-letter values are seeded off band.id — same band, same logo, always.
 */

// FNV-1a 32-bit — deterministic per band.id.
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
// mulberry32 PRNG stepped off the seed for stable per-letter values.
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type BandLogoVariant = 'hero' | 'card' | 'row' | 'inline';

interface BandLogoProps {
  band: Pick<Band, 'id' | 'name' | 'genre'>;
  variant?: BandLogoVariant;
  className?: string;
  style?: React.CSSProperties;
}

/** Jitter feel per archetype — scrawls wobble, print archetypes sit still. */
const ARCHETYPE_JITTER: Record<string, number> = {
  'hand-marker': 1.4, 'thrash-jagged': 1.6, 'ransom': 1.2,
  'metal-cut': 0.5, 'horror-serif': 0.5, 'heavy-condensed': 0.6,
  'collegiate': 0.3, 'geometric': 0.2, 'elegant-serif': 0.3,
  'script': 0.4, 'typewriter': 0.5, 'rounded-pop': 0.8,
  'grunge-serif': 0.3, 'italic-sans': 0.6,
};

export const BandLogo: React.FC<BandLogoProps> = ({
  band,
  variant = 'card',
  className,
  style,
}) => {
  const logo = useMemo(() => logoStyleFor(band), [band]);
  // Only the hero builds the per-letter lockup; card/row/inline stay flat so
  // line-clamp/ellipsis keep working (they still carry the archetype class).
  const perLetter = variant === 'hero';

  const letters = useMemo(() => {
    if (!perLetter) return null;
    const rng = mulberry32(hashStr(band.id));
    const jit = ARCHETYPE_JITTER[logo.archetype] ?? 0.8;
    const chars = [...band.name];
    const n = Math.max(1, chars.length - 1);
    // Indices of the first/last non-space glyphs for the stretch gesture.
    const first = chars.findIndex((c) => c !== ' ');
    let last = chars.length - 1;
    while (last > 0 && chars[last] === ' ') last--;
    const archAmp = (logo.arch ?? 0) * 6;
    // 'mixed' casing is per-letter (ransom-note style) — CSS text-transform
    // can't do it, so the fancy lockup bakes it in (flat spans stay as-typed).
    const caseRng = mulberry32(hashStr(band.id) ^ 0x5f356495);
    return chars.map((ch, i) => {
      if (ch === ' ') return { ch, style: undefined as React.CSSProperties | undefined };
      if (logo.casing === 'mixed') ch = caseRng() < 0.5 ? ch.toUpperCase() : ch.toLowerCase();
      const rot = (rng() * 2 - 1) * 4 * jit;
      const dy = (rng() * 2 - 1) * 1.6 * jit - archAmp * Math.sin((i / n) * Math.PI);
      const stretch =
        logo.stretchEnds && (i === first || i === last)
          ? ` scale(1.25, 1.5) skewX(${i === first ? -8 : 8}deg)`
          : '';
      return {
        ch,
        style: {
          display: 'inline-block',
          transform: `rotate(${rot.toFixed(2)}deg) translateY(${dy.toFixed(2)}px)${stretch}`,
          transformOrigin: 'bottom center',
        } as React.CSSProperties,
      };
    });
  }, [perLetter, band.id, band.name, logo]);

  const cls =
    `band-logo band-logo--${variant} band-logo--a-${logo.archetype} band-logo--case-${logo.casing}` +
    (logo.deco && logo.deco !== 'none' && perLetter ? ` band-logo--deco-${logo.deco}` : '') +
    (className ? ' ' + className : '');

  // The lean rides an inline transform; sellout skins flatten it with
  // `transform: none !important` (CSS !important beats inline styles).
  const lean =
    logo.slant && (perLetter || variant === 'card')
      ? `skewX(${logo.slant.toFixed(2)}deg)`
      : undefined;
  const mergedStyle: React.CSSProperties = lean ? { transform: lean, ...style } : { ...style };

  return (
    <span className={cls} style={mergedStyle} aria-label={band.name} data-genre={band.genre}>
      <span className="band-logo__flat" aria-hidden>
        {band.name}
      </span>
      {perLetter && letters && (
        <span className="band-logo__fancy" aria-hidden>
          {letters.map((l, i) =>
            l.ch === ' ' ? (
              <span key={i}> </span>
            ) : (
              <span key={i} className="band-logo__ch" style={l.style}>
                {l.ch}
              </span>
            )
          )}
        </span>
      )}
    </span>
  );
};

export default BandLogo;

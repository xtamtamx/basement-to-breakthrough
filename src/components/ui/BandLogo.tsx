import React, { useMemo } from 'react';
import { Band, Genre } from '@game/types/core';

/**
 * BandLogo — renders a band's name as a procedural LOGO, not just styled text.
 *
 * Every band gets a deterministic logo TREATMENT seeded off `band.id` and
 * flavored by genre — the knobs a real logo designer would turn:
 *   · casing   — ALL-CAPS (heavy/punk) / lowercase (emo/indie) / MiXeD (weird)
 *   · arch     — letters ride a curve (classic metal arch / punk sag)
 *   · slant    — the whole lockup leans like a hand-cut sticker
 *   · deco     — a marker underline / rough box / double rules (hero only)
 * plus the existing per-letter scrawl jitter. Same band = same logo, always.
 *
 * Per-skin rendering stays CSS-first ([data-skin] rules in skins.css):
 * Sharpie draws the treatments in marker; zine overrides with its ransom-note
 * cut-outs; corporate FLATTENS everything (transform:none, no deco) — selling
 * out literally prints every band's logo in the same Helvetica.
 *
 * hero splits into per-letter spans (arch/jitter); card/row/inline stay plain
 * text so line-clamp / ellipsis keep working (they still get casing + lean).
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

const HEAVY = new Set<Genre>([Genre.METAL, Genre.DOOM, Genre.SLUDGE]);
const ROWDY = new Set<Genre>([Genre.PUNK, Genre.HARDCORE, Genre.POWERVIOLENCE, Genre.GRUNGE]);
const SOFT = new Set<Genre>([Genre.EMO, Genre.INDIE, Genre.ALTERNATIVE]);
const WEIRD = new Set<Genre>([Genre.NOISE, Genre.EXPERIMENTAL, Genre.ELECTRONIC]);

type Deco = 'none' | 'underline' | 'box' | 'rules';
interface Treatment {
  casing: 'upper' | 'lower' | 'title' | 'mixed';
  /** Arch amplitude in px at hero size; sign = arch up (+) or sag down (−). */
  arch: number;
  /** Whole-lockup lean, degrees. */
  slant: number;
  deco: Deco;
  /** Scrawl jitter multiplier. */
  jitter: number;
}

/** The band's designer: rolls a stable logo treatment from id + genre. */
function treatmentFor(band: Pick<Band, 'id' | 'genre'>): Treatment {
  // Separate stream from the letter jitter so treatments don't shift it.
  const rng = mulberry32(hashStr(band.id) ^ 0x9e3779b9);
  const g = band.genre;
  if (HEAVY.has(g)) {
    return {
      casing: 'upper',
      arch: 3.5 + rng() * 3.5, // the classic metal arch
      slant: 0,
      deco: rng() < 0.35 ? 'rules' : 'none',
      jitter: 1.1,
    };
  }
  if (ROWDY.has(g)) {
    const r = rng();
    return {
      casing: 'upper',
      arch: rng() < 0.3 ? -(2 + rng() * 3) : 0, // some punk logos sag
      slant: rng() < 0.45 ? (rng() * 2 - 1) * 5 : 0,
      deco: r < 0.3 ? 'underline' : r < 0.5 ? 'box' : 'none',
      jitter: 1.35,
    };
  }
  if (SOFT.has(g)) {
    return {
      casing: rng() < 0.55 ? 'lower' : 'title',
      arch: 0,
      slant: rng() < 0.25 ? (rng() * 2 - 1) * 3 : 0,
      deco: rng() < 0.2 ? 'underline' : 'none',
      jitter: 0.6,
    };
  }
  if (WEIRD.has(g)) {
    return {
      casing: rng() < 0.5 ? 'mixed' : 'lower',
      arch: 0,
      slant: rng() < 0.35 ? (rng() * 2 - 1) * 7 : 0,
      deco: 'none',
      jitter: 1.0,
    };
  }
  return { casing: 'title', arch: 0, slant: 0, deco: 'none', jitter: 1.0 };
}

function applyCasing(name: string, casing: Treatment['casing'], seed: number): string {
  switch (casing) {
    case 'upper': return name.toUpperCase();
    case 'lower': return name.toLowerCase();
    case 'mixed': {
      const rng = mulberry32(seed ^ 0x5f356495);
      return [...name].map((ch) => (rng() < 0.5 ? ch.toUpperCase() : ch.toLowerCase())).join('');
    }
    default: return name;
  }
}

export type BandLogoVariant = 'hero' | 'card' | 'row' | 'inline';

const AMP: Record<BandLogoVariant, { rot: number; y: number }> = {
  hero: { rot: 4, y: 2 },
  card: { rot: 3, y: 1.2 },
  row: { rot: 0, y: 0 },
  inline: { rot: 0, y: 0 },
};

interface BandLogoProps {
  band: Pick<Band, 'id' | 'name' | 'genre'>;
  variant?: BandLogoVariant;
  className?: string;
  style?: React.CSSProperties;
}

export const BandLogo: React.FC<BandLogoProps> = ({
  band,
  variant = 'card',
  className,
  style,
}) => {
  // Only the hero (showcase) splits into per-letter spans — card/row/inline stay
  // plain text so line-clamp / ellipsis keep working.
  const perLetter = variant === 'hero';
  const treat = useMemo(() => treatmentFor(band), [band]);
  const display = useMemo(
    () => applyCasing(band.name, treat.casing, hashStr(band.id)),
    [band.name, band.id, treat.casing],
  );

  const letters = useMemo(() => {
    if (!perLetter) return null;
    const rng = mulberry32(hashStr(band.id));
    const amp = AMP[variant];
    const chars = [...display];
    const n = Math.max(1, chars.length - 1);
    return chars.map((ch, i) => {
      if (ch === ' ') return { ch, style: undefined as React.CSSProperties | undefined };
      const rot = (rng() * 2 - 1) * amp.rot * treat.jitter;
      const dy =
        (rng() * 2 - 1) * amp.y * treat.jitter -
        // Arch: middle letters rise (arch>0) or sink (arch<0) along a sine bow.
        treat.arch * Math.sin((i / n) * Math.PI);
      return {
        ch,
        style: {
          display: 'inline-block',
          transform: `rotate(${rot.toFixed(2)}deg) translateY(${dy.toFixed(2)}px)`,
        } as React.CSSProperties,
      };
    });
  }, [perLetter, display, band.id, variant, treat]);

  const cls =
    `band-logo band-logo--${variant}` +
    (treat.deco !== 'none' && perLetter ? ` band-logo--deco-${treat.deco}` : '') +
    (className ? ' ' + className : '');

  // The lean lives on an inline transform; corporate skins flatten it with a
  // `transform: none !important` rule (CSS !important beats inline styles).
  const lean =
    treat.slant !== 0 && (perLetter || variant === 'card')
      ? `skewX(${treat.slant.toFixed(2)}deg)`
      : undefined;
  const mergedStyle: React.CSSProperties = lean
    ? { transform: lean, ...style }
    : { ...style };

  if (!perLetter || !letters) {
    return (
      <span className={cls} style={mergedStyle} data-genre={band.genre}>
        {display}
      </span>
    );
  }

  return (
    <span className={cls} style={mergedStyle} data-genre={band.genre}>
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
  );
};

export default BandLogo;

import React, { useMemo } from 'react';
import { Band, Genre } from '@game/types/core';

/**
 * BandLogo — renders a band's name as a procedural "logo" that restyles per skin
 * (Sharpie marker scrawl / cut-&-paste zine ransom-note / uniform corporate print).
 *
 * CSS-first: the per-skin appearance is driven entirely by ancestor
 * `[data-skin="…"] .band-logo` rules in skins.css (the skin lives on <html>), so
 * this component only supplies the DOM + a deterministic per-letter jitter seeded
 * off `band.id` (same band always looks the same). Genre modulates the jitter
 * amplitude (punk/metal rowdier, emo/indie softer). Corporate skins neutralize the
 * jitter via CSS so the print reads uniform.
 *
 * hero/card variants split the name into <span> letters (so skins can transform
 * each glyph); row/inline stay plain text so single-line ellipsis still works.
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

const ROWDY = new Set<Genre>([
  Genre.PUNK, Genre.HARDCORE, Genre.POWERVIOLENCE, Genre.METAL,
  Genre.DOOM, Genre.SLUDGE, Genre.NOISE, Genre.GRUNGE,
]);
const SOFT = new Set<Genre>([Genre.EMO, Genre.INDIE, Genre.ALTERNATIVE]);

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

  const letters = useMemo(() => {
    if (!perLetter) return null;
    const rng = mulberry32(hashStr(band.id));
    const amp = AMP[variant];
    const gAmp = ROWDY.has(band.genre) ? 1.3 : SOFT.has(band.genre) ? 0.7 : 1.0;
    return [...band.name].map((ch) => {
      if (ch === ' ') return { ch, style: undefined as React.CSSProperties | undefined };
      const rot = (rng() * 2 - 1) * amp.rot * gAmp;
      const dy = (rng() * 2 - 1) * amp.y * gAmp;
      return {
        ch,
        style: {
          display: 'inline-block',
          transform: `rotate(${rot.toFixed(2)}deg) translateY(${dy.toFixed(2)}px)`,
        } as React.CSSProperties,
      };
    });
  }, [perLetter, band.id, band.name, band.genre, variant]);

  const cls = `band-logo band-logo--${variant}${className ? ' ' + className : ''}`;

  if (!perLetter || !letters) {
    return (
      <span className={cls} style={style} data-genre={band.genre}>
        {band.name}
      </span>
    );
  }

  return (
    <span className={cls} style={style} data-genre={band.genre}>
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

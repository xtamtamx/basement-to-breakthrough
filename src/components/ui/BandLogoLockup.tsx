import React from 'react';
import { LOGO_SIGIL_PATHS } from './logoSigilPaths';
import type { BandLogoStyle, LockupRecipe } from '@game/data/bandLogoStyles';

/**
 * BandLogoLockup — the band's ACTUAL logo: a composed SVG lockup, not a line
 * of styled text. Words stack at different scales and stretch to fill the
 * block (textLength justification — the classic band-logo move), kickers stay
 * small, arcs bow, and the band's mark sits INSIDE the composition (crowning
 * it, ghosted behind it, sealing it) rather than beside it.
 *
 * The recipe lives in bandLogoStyles.ts (`lockup`). Rendering is skin-aware
 * via CSS only: DIY tiers show the lockup (pure-diy = the logo, diy-leaning =
 * xeroxed copy, balanced = marker-drawn copy via a font override); the
 * sellout tiers hide it entirely and typeset the plain name instead.
 */

const BLOCK_W = 400; // viewBox width; lines with fill=true justify to ~360
const MARGIN = 20;

interface Props {
  recipe: LockupRecipe;
  style?: BandLogoStyle; // archetype/device inform stroke/extrude presentation
  className?: string;
}

/** Font stacks per archetype — mirrors skins.css so the SVG lockup matches. */
const ARCHETYPE_FONT: Record<string, string> = {
  'metal-cut': '"Bebas Neue","Oswald",sans-serif',
  'horror-serif': '"Didot","Bodoni 72","Times New Roman",serif',
  'thrash-jagged': '"Bebas Neue","Oswald",sans-serif',
  'script': '"Snell Roundhand","Savoye LET","Bradley Hand",cursive',
  'typewriter': '"American Typewriter","Courier New",monospace',
  'collegiate': '"Copperplate","Trebuchet MS",serif',
  'heavy-condensed': '"Oswald","Arial Narrow",sans-serif',
  'rounded-pop': '"Arial Rounded MT Bold","Avenir",sans-serif',
  'geometric': '"Futura","Avenir Next",sans-serif',
  'grunge-serif': '"Bodoni 72","Didot",serif',
  'italic-sans': '"Helvetica Neue",Arial,sans-serif',
  'elegant-serif': '"Didot","Baskerville",serif',
  'hand-marker': '"Marker Felt","Comic Sans MS","Bradley Hand",cursive',
  'ransom': '"Bebas Neue","Oswald",sans-serif',
};

let uid = 0;

export const BandLogoLockup: React.FC<Props> = ({ recipe, style, className }) => {
  const idRef = React.useRef(`blk${++uid}`);
  const font = ARCHETYPE_FONT[style?.archetype ?? 'hand-marker'];
  const italic = style?.archetype === 'italic-sans';
  const casing = style?.casing ?? 'title';
  const applyCase = (s: string) =>
    casing === 'upper' ? s.toUpperCase() : casing === 'lower' ? s.toLowerCase() : s;

  // Vertical layout: stack line boxes with a small gap.
  const GAP = 6;
  const lineHeights = recipe.lines.map((l) => l.size * 1.04 + (l.arc ? Math.abs(l.arc) : 0));
  const textH = lineHeights.reduce((a, b) => a + b, 0) + GAP * (recipe.lines.length - 1);
  const crownH = recipe.mark === 'crown' ? 46 : 0;
  const totalH = Math.max(64, textH + crownH + MARGIN * 1.2);
  const sealMode = recipe.mark === 'seal';
  const blockX0 = sealMode ? 108 : MARGIN; // seal reserves the left column
  const blockW = BLOCK_W - blockX0 - MARGIN;
  const cx = blockX0 + blockW / 2;

  const sigilPath = recipe.sigil ? LOGO_SIGIL_PATHS[recipe.sigil] : undefined;
  const dev = style?.device;

  // Build text lines top-down.
  let y = MARGIN * 0.6 + crownH;
  const rendered = recipe.lines.map((l, i) => {
    const h = lineHeights[i];
    const baseline = y + l.size * 0.86 + (l.arc && l.arc > 0 ? Math.abs(l.arc) : 0);
    y += h + GAP;
    const common: React.SVGProps<SVGTextElement> = {
      fontFamily: l.script ? ARCHETYPE_FONT['script'] : font,
      fontSize: l.size,
      fontWeight: l.script ? 700 : 800,
      fontStyle: italic ? 'italic' : undefined,
      letterSpacing: l.tracking ?? 0,
      fill: 'currentColor',
    };
    const deviceProps: React.SVGProps<SVGTextElement> =
      dev === 'outline' && l.fill
        ? { stroke: 'currentColor', strokeWidth: 1.5, fill: 'none' as const }
        : {};
    const text = applyCase(l.text);
    if (l.arc) {
      // Arched line via textPath over a quadratic bow.
      const rise = l.arc;
      const pid = `${idRef.current}-arc${i}`;
      return (
        <g key={i}>
          <path
            id={pid}
            d={`M ${blockX0} ${baseline} Q ${cx} ${baseline - rise * 2} ${blockX0 + blockW} ${baseline}`}
            fill="none"
          />
          <text {...common} {...deviceProps}>
            <textPath
              href={`#${pid}`}
              startOffset="50%"
              textAnchor="middle"
              textLength={l.fill ? blockW * 0.94 : undefined}
              lengthAdjust="spacingAndGlyphs"
            >
              {text}
            </textPath>
          </text>
        </g>
      );
    }
    return (
      <g key={i}>
        {dev === 'extrude' && l.fill && (
          <text
            {...common}
            x={cx + 3}
            y={baseline + 3}
            textAnchor="middle"
            textLength={blockW * 0.94}
            lengthAdjust="spacingAndGlyphs"
            fill="var(--snes-magenta)"
          >
            {text}
          </text>
        )}
        <text
          {...common}
          {...deviceProps}
          x={cx}
          y={baseline}
          textAnchor="middle"
          textLength={l.fill ? blockW * 0.94 : undefined}
          lengthAdjust="spacingAndGlyphs"
          textDecoration={dev === 'stripes' && l.fill ? 'line-through' : undefined}
        >
          {text}
        </text>
      </g>
    );
  });

  return (
    <svg
      viewBox={`0 0 ${BLOCK_W} ${totalH}`}
      className={`band-lockup${className ? ' ' + className : ''}`}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      {/* the mark, integrated */}
      {sigilPath && recipe.mark === 'behind' && (
        <path
          d={sigilPath}
          fill="currentColor"
          fillRule="evenodd"
          opacity={0.18}
          transform={`translate(${cx - totalH * 0.42}, ${totalH * 0.06}) scale(${(totalH * 0.85) / 24})`}
        />
      )}
      {sigilPath && recipe.mark === 'crown' && (
        <path
          d={sigilPath}
          fill="currentColor"
          fillRule="evenodd"
          transform={`translate(${cx - 21}, 2) scale(1.75)`}
        />
      )}
      {sigilPath && recipe.mark === 'left' && (
        <path
          d={sigilPath}
          fill="currentColor"
          fillRule="evenodd"
          transform={`translate(6, ${totalH / 2 - 26}) scale(2.2)`}
        />
      )}
      {sigilPath && sealMode && (
        <g>
          <circle cx={54} cy={totalH / 2} r={Math.min(44, totalH / 2 - 4)} fill="none" stroke="currentColor" strokeWidth={5} />
          <path
            d={sigilPath}
            fill="currentColor"
            fillRule="evenodd"
            transform={`translate(${54 - 24}, ${totalH / 2 - 24}) scale(2)`}
          />
        </g>
      )}
      {rendered}
      {sigilPath && recipe.mark === 'tail' && (
        <path
          d={sigilPath}
          fill="currentColor"
          fillRule="evenodd"
          transform={`translate(${BLOCK_W - MARGIN - 34}, ${totalH - 40}) scale(1.5)`}
        />
      )}
      {recipe.frame === 'box' && (
        <rect x={4} y={4} width={BLOCK_W - 8} height={totalH - 8} fill="none" stroke="currentColor" strokeWidth={6} />
      )}
      {recipe.frame === 'rules' && (
        <g stroke="currentColor" strokeWidth={4}>
          <line x1={blockX0} y1={6} x2={blockX0 + blockW} y2={6} />
          <line x1={blockX0} y1={totalH - 6} x2={blockX0 + blockW} y2={totalH - 6} />
        </g>
      )}
    </svg>
  );
};

export default BandLogoLockup;

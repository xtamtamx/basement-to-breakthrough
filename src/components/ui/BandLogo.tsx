import React, { useMemo } from 'react';
import { Band } from '@game/types/core';
import { logoStyleFor, lockupFor } from '@game/data/bandLogoStyles';
import { BandLogoLockup } from './BandLogoLockup';

/**
 * BandLogo — the band's ACTUAL logo, with fidelity tracking the DIY↔sellout
 * meter:
 *
 *   pure-diy          THE logo (BandLogoLockup: composed SVG wordmark + mark)
 *   diy-leaning       xeroxed cut/paste copy of the logo (CSS filter + scrap)
 *   balanced          hand-drawn copy (same lockup, marker face via CSS)
 *   corporate-leaning handwritten NAME — uniform script, logo gone
 *   full-sellout      ticket-print NAME — uniform Helvetica caps
 *
 * The component renders the plain name (`__flat`) plus, for hero/card, the
 * composed lockup. [data-skin] CSS decides which one shows — the sellout
 * tiers never see the lockup, only the homogenized name. row/inline variants
 * always stay plain text (ellipsis-safe).
 */

export type BandLogoVariant = 'hero' | 'card' | 'row' | 'inline';

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
  const logo = useMemo(() => logoStyleFor(band), [band]);
  const recipe = useMemo(() => lockupFor(band), [band]);
  const composed = variant === 'hero' || variant === 'card';

  const cls =
    `band-logo band-logo--${variant} band-logo--a-${logo.archetype} band-logo--case-${logo.casing}` +
    (className ? ' ' + className : '');

  return (
    <span className={cls} style={style} aria-label={band.name} data-genre={band.genre}>
      <span className="band-logo__flat" aria-hidden>
        {band.name}
      </span>
      {composed && <BandLogoLockup recipe={recipe} style={logo} seedKey={band.id} />}
    </span>
  );
};

export default BandLogo;

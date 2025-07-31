import React from 'react';
import { BaseSprite, AnimatedSprite } from '../components/graphics/PixelArtSprites';
import { SPRITE_SHEET } from '../data/spriteData';

// Utility function to get sprite from sheet
export const getSpriteFromSheet = (
  spriteName: string,
  pixelSize: number = 4,
  className: string = ''
): JSX.Element | null => {
  const sprite = SPRITE_SHEET[spriteName];
  if (!sprite) return null;

  if (sprite.animated && sprite.frames) {
    return (
      <AnimatedSprite
        frames={sprite.frames}
        pixelSize={pixelSize}
        colorMap={sprite.colorMap}
        className={className}
      />
    );
  }

  return (
    <BaseSprite
      data={sprite.data}
      pixelSize={pixelSize}
      colorMap={sprite.colorMap}
      className={className}
    />
  );
};
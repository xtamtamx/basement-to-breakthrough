/**
 * Genre → PixelIcon glyph name. Families share a glyph so genres stay legible at
 * ~16px (metal/doom/sludge → skull, punk/grunge → guitar, indie/emo → flower…).
 * Kept in its own module so PixelIcon.tsx only exports a component (Fast Refresh).
 */
const GENRE_ICON: Record<string, string> = {
  PUNK: 'guitar', GRUNGE: 'guitar', ALTERNATIVE: 'guitar',
  METAL: 'skull', HARDCORE: 'skull', DOOM: 'skull', SLUDGE: 'skull', POWERVIOLENCE: 'skull',
  INDIE: 'flower', EMO: 'flower',
  EXPERIMENTAL: 'flask',
  NOISE: 'energy', ELECTRONIC: 'energy',
};

export function genreIcon(genre: string): string {
  return GENRE_ICON[genre] ?? 'note';
}

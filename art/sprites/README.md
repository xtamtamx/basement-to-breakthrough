# art/sprites — sprite source folder

Drop **individual sprite PNGs** here (one sprite per file, transparent
background). Subfolders are allowed and become a key prefix.

Then run:

```bash
npm run pack:sprites
```

This packs everything under `art/sprites/` into a single atlas and a typed
coordinate map — no more measuring rects by hand (cf. the hand-authored
`src/components/map/townAtlas.ts`):

| Output | What |
| --- | --- |
| `public/assets/sprites/generated/atlas.png` | the packed sheet (served from `/public`) |
| `src/components/map/generatedAtlas.ts` | `GENERATED_SPRITES = { name: {x,y,w,h} }` + `GENERATED_ATLAS_SRC` |

### Naming → key

`art/sprites/town/amp.png` → `GENERATED_SPRITES.town_amp`
(slashes/dashes/dots collapse to `_`).

### Using a sprite

```ts
import { GENERATED_ATLAS_SRC, GENERATED_SPRITES } from '@components/map/generatedAtlas';
const r = GENERATED_SPRITES.town_amp; // { x, y, w, h }
ctx.drawImage(atlasImg, r.x, r.y, r.w, r.h, dx, dy, r.w, r.h);
```

### Bringing in external / AI-generated art

Run it through the palette-snap first so it matches the neon-punk look exactly:

```ts
import { snapImageToCanvas } from '@utils/pixelPalette';
const snapped = snapImageToCanvas(sourceImg, w, h, { pixelScale: 4 });
// → export snapped.toDataURL() to a PNG, drop it in art/sprites/, re-pack.
```

### The live-music prop set

`npm run sprites:town` regenerates the hand-authored neon prop sprites
(`scripts/makeTownProps.mjs` → `town/*.png`: PA stacks, amps, mic stands, flyer
poles, string lights, road cases, sandwich boards, cable coils). They're drawn
procedurally with the shared raster toolkit in `scripts/lib/png.mjs`, so tweak
that script and re-run `sprites:town` + `pack:sprites` to iterate. PixelCityMap
scatters them as venue-adjacent dressing.

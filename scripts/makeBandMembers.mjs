/**
 * makeBandMembers.mjs — bake title-screen band members into single sprites that
 * actually look like they're PLAYING: an ELV chibi character + a downscaled real
 * instrument (matched to the chibi pixel density) + hand-drawn sleeved arms that
 * reach from the shoulders to the grip points (sleeve behind the instrument, skin
 * hand on top). Output → public/title/band/members/{guitar,bass,sing,drum}.png
 *
 * Run: node scripts/makeBandMembers.mjs   (needs ImageMagick `magick` for raster
 * decode/transform; png.mjs for the final encode + the pixel draw primitives).
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { encodePng, hex, makeSprite } from './lib/png.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const BAND = join(__dir, '..', 'public', 'title', 'band');
const CHARS = join(__dir, '..', 'public', 'assets', 'sprites', 'characters');
const OUT = join(BAND, 'members');
mkdirSync(OUT, { recursive: true });
const TMP = '/tmp/_bandraw.raw';

/** Run a magick pipeline → {buf,w,h} RGBA. `cmd` is the part before output. */
function load(cmd) {
  const wh = execSync(`magick ${cmd} -format '%wx%h' info:`).toString().trim();
  const [w, h] = wh.split('x').map(Number);
  execSync(`magick ${cmd} -depth 8 RGBA:${TMP}`);
  return { buf: readFileSync(TMP), w, h };
}
const charFrame = (id) =>
  load(`'${join(CHARS, `FD_Character_${id}_Idle.png`)}' -crop 24x24+0+0 +repage`);
const instr = (file, resize, rot) =>
  load(`'${join(BAND, file)}' -filter point -resize ${resize} -background none -rotate ${rot} +repage`);

/** alpha-over blit a loaded {buf,w,h} onto a sprite at (dx,dy). */
function blit(sp, src, dx, dy) {
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const i = (y * src.w + x) * 4;
      const a = src.buf[i + 3];
      if (a === 0) continue;
      sp.px(dx + x, dy + y, [src.buf[i], src.buf[i + 1], src.buf[i + 2]], a);
    }
}
/** chunky 2px arm segment from->to in sleeve colour. */
function armLine(sp, [x0, y0], [x1, y1], col) {
  sp.line(x0, y0, x1, y1, col);
  sp.line(x0 + 1, y0, x1 + 1, y1, col);
  sp.line(x0, y0 + 1, x1, y1 + 1, col);
}
const hand = (sp, [x, y], skin) => sp.rect(x, y, 2, 2, skin);
/** thin 1px drumstick from->to. */
function stick(sp, [x0, y0], [x1, y1], col) {
  sp.line(x0, y0, x1, y1, col);
}

function build(name, cfg) {
  const [W, H] = cfg.canvas;
  const sp = makeSprite(W, H);
  const skin = hex(cfg.skin);
  const sleeve = hex(cfg.sleeve);
  const char = charFrame(cfg.charId);
  const ins = cfg.instr ? instr(cfg.instr.file, cfg.instr.resize, cfg.instr.rotate) : null;

  // 1. character
  blit(sp, char, cfg.charAt[0], cfg.charAt[1]);
  // 2. sleeves first so they tuck UNDER the instrument
  (cfg.arms || []).forEach((a) => armLine(sp, a.from, a.to, sleeve));
  // 3. instrument over body + sleeves
  if (ins) blit(sp, ins, cfg.instr.at[0], cfg.instr.at[1]);
  // 4. drumsticks reach down onto the kit, then hands grip ON TOP
  (cfg.sticks || []).forEach((s) => stick(sp, s.from, s.to, hex(s.col || '#caa477')));
  (cfg.arms || []).forEach((a) => a.hand && hand(sp, a.hand, skin));

  writeFileSync(join(OUT, `${name}.png`), encodePng(W, H, sp.buf));
  return { W, H };
}

/**
 * The drummer can't bob as one block (the kit is furniture). Emit THREE aligned
 * layers on the same canvas so the title can plant the kit and animate only the
 * player + sticks in time with the music:
 *   drum_kit.png    — the kit alone (stationary)
 *   drum_body.png   — the player: character + arms + gripping hands (no kit/sticks)
 *   drum_sticks.png — just the two sticks (front layer, taps on the beat)
 */
function buildDrummerLayers(cfg) {
  const [W, H] = cfg.canvas;
  const skin = hex(cfg.skin), sleeve = hex(cfg.sleeve);
  const char = charFrame(cfg.charId);
  const ins = instr(cfg.instr.file, cfg.instr.resize, cfg.instr.rotate);

  const kit = makeSprite(W, H);
  blit(kit, ins, cfg.instr.at[0], cfg.instr.at[1]);
  writeFileSync(join(OUT, 'drum_kit.png'), encodePng(W, H, kit.buf));

  const body = makeSprite(W, H);
  blit(body, char, cfg.charAt[0], cfg.charAt[1]);
  (cfg.arms || []).forEach((a) => armLine(body, a.from, a.to, sleeve));
  (cfg.sticks || []).forEach((s) => hand(body, s.from, skin)); // gripping hand at each stick top
  writeFileSync(join(OUT, 'drum_body.png'), encodePng(W, H, body.buf));

  const sticks = makeSprite(W, H);
  (cfg.sticks || []).forEach((s) => stick(sticks, s.from, s.to, hex(s.col || '#caa477')));
  writeFileSync(join(OUT, 'drum_sticks.png'), encodePng(W, H, sticks.buf));
  console.log(`drum layers (kit/body/sticks): ${W}x${H}`);
}

const MEMBERS = {
  guitar: {
    charId: '010', skin: '#ffbd99', sleeve: '#0b2242',
    canvas: [42, 36], charAt: [9, 10],
    instr: { file: 'guitar.png', resize: '7x22', rotate: 65, at: [11, 16] },
    arms: [
      { from: [16, 26], to: [16, 29], hand: [15, 29] }, // strum (our left) -> body
      { from: [26, 26], to: [30, 22], hand: [30, 21] }, // fret  (our right) -> neck
    ],
  },
  bass: {
    charId: '008', skin: '#cc8a66', sleeve: '#252423',
    canvas: [42, 36], charAt: [9, 10],
    instr: { file: 'bass.png', resize: '7x24', rotate: -63, at: [6, 16] },
    arms: [
      { from: [26, 26], to: [26, 29], hand: [26, 29] }, // strum (our right) -> body
      { from: [16, 26], to: [12, 22], hand: [11, 21] }, // fret  (our left)  -> neck
    ],
  },
  sing: {
    charId: '004', skin: '#cc8a66', sleeve: '#4c4a4a',
    canvas: [34, 36], charAt: [5, 10],
    instr: { file: 'mic_hand.png', resize: '8x9', rotate: 0, at: [15, 20] },
    arms: [
      { from: [22, 26], to: [20, 26], hand: [20, 25] }, // raised hand grips the mic handle
    ],
  },
  drum: {
    charId: '015', skin: '#ffbd99', sleeve: '#0e3920',
    canvas: [46, 38], charAt: [11, 4],
    instr: { file: 'drumkit.png', resize: '32x29', rotate: 0, at: [7, 12] },
    arms: [
      { from: [18, 18], to: [21, 22] }, // left arm forward to stick
      { from: [28, 18], to: [25, 22] }, // right arm forward to stick
    ],
    sticks: [
      { from: [21, 22], to: [16, 25] }, // stick -> left drum
      { from: [25, 22], to: [30, 25] }, // stick -> right drum
    ],
  },
};

const built = {};
for (const [name, cfg] of Object.entries(MEMBERS)) {
  built[name] = build(name, cfg);
  console.log(`${name}: ${built[name].W}x${built[name].H}`);
}
buildDrummerLayers(MEMBERS.drum);

// optional bottom-aligned review montage (best-effort; ignore if magick/tmp absent)
try {
  const tiles = Object.keys(MEMBERS)
    .map((n) => `'${join(OUT, n + '.png')}' -filter point -resize 460% -background none -gravity south -extent 220x210`)
    .map((t) => `\\( ${t} \\)`)
    .join(' ');
  execSync(`magick montage ${tiles} -tile ${Object.keys(MEMBERS).length}x1 -geometry +0+0 -background '#241b30' /tmp/band_members_preview.png 2>/dev/null`);
  console.log('review montage -> /tmp/band_members_preview.png');
} catch {
  /* review-only */
}

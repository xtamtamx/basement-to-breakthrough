#!/usr/bin/env node
/**
 * makeTownProps — author the live-music PROP sprites for the town map as
 * palette-correct neon pixel art (dependency-free PNGs). Output → art/sprites/town/.
 * Then `npm run pack:sprites` bakes them into the generated atlas.
 *
 * Every sprite is FOOT-ANCHORED (bottom-center = contact point) with a soft
 * ground shadow in its bottom rows, matching how PixelCityMap blits sprites.
 */
import { writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePng, makeSprite, hex } from './lib/png.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'art/sprites/town');

const P = {
  ink: hex('#0a0814'), ink2: hex('#0f0b1e'), panel: hex('#171327'), panel2: hex('#2a2440'),
  panel3: hex('#3a3450'), silver: hex('#c0bec8'), silver2: hex('#88868f'),
  wood: hex('#5a4a36'), wood2: hex('#3a2e1e'), wood3: hex('#7a6a4a'),
  magenta: hex('#f72585'), cyan: hex('#4cc9f0'), gold: hex('#ffd23f'),
  green: hex('#3ad17e'), purple: hex('#c77dff'), red: hex('#ff5c57'), white: hex('#ffffff'),
};
const NEON = [P.magenta, P.cyan, P.gold, P.green, P.purple, P.red];

const ovalOutline = (s, cx, cy, rx, ry, col, a = 255) => {
  for (let d = 0; d < 360; d += 5) s.px(cx + Math.cos((d * Math.PI) / 180) * rx, cy + Math.sin((d * Math.PI) / 180) * ry, col, a);
};

// --- PA speaker stack (16x26) ------------------------------------------------
function paSpeakerStack() {
  const s = makeSprite(16, 26);
  s.shadow(8, 24, 6, 2);
  // tripod
  s.line(8, 20, 5, 23, P.silver2); s.line(8, 20, 11, 23, P.silver2); s.vline(8, 18, 22, P.silver2);
  const cab = (x, y, w, h) => {
    s.rect(x, y, w, h, P.panel);
    s.hline(x, x + w - 1, y, P.white, 150);          // top lip
    s.hline(x, x + w - 1, y + h - 1, P.ink, 200);     // under shadow
    s.vline(x, y, y + h - 1, P.ink2, 160);
    s.rect(x + 1, y + 1, w - 2, h - 2, P.panel2);      // baffle
  };
  const woofer = (cx, cy, r) => {
    s.fillEllipse(cx, cy, r, r, P.cyan);
    ovalOutline(s, cx, cy, r, r, P.ink2, 220);
    s.px(cx, cy - 1, P.white); s.px(cx - 1, cy - 1, P.white);
  };
  // bottom cab
  cab(2, 12, 12, 9); woofer(8, 17, 3);
  s.px(4, 13, P.purple); s.px(11, 13, P.purple);
  // top cab (narrower)
  cab(3, 2, 10, 8); woofer(8, 6, 2);
  s.px(8, 3, P.purple);
  return s;
}

// --- Floor guitar cab (16x14) ------------------------------------------------
function floorAmp() {
  const s = makeSprite(16, 14);
  s.shadow(8, 12, 7, 1.6);
  s.rect(2, 11, 2, 2, P.ink2); s.rect(12, 11, 2, 2, P.ink2);   // feet
  s.rect(1, 2, 14, 10, P.panel);
  s.hline(1, 14, 2, P.white, 150);                              // top lip
  s.hline(1, 14, 11, P.ink, 220);                               // under shadow
  s.rect(2, 4, 12, 6, P.panel3);                                // grille
  for (let d = -6; d < 16; d += 3) s.line(d, 9, d + 5, 4, P.gold, 70);   // cloth weave
  s.rect(3, 1, 10, 2, P.panel2);                                // control strip
  s.px(4, 1, P.red); s.px(6, 1, P.white); s.px(8, 1, P.red); s.px(10, 1, P.white);
  s.px(12, 1, P.gold); s.fillEllipse(12, 1, 1.4, 1.4, P.gold, 90); // power LED glow
  return s;
}

// --- Mic stand (12x24) -------------------------------------------------------
function micStand() {
  const s = makeSprite(12, 24);
  s.shadow(6, 22, 4, 1.5);
  s.fillEllipse(6, 21, 3.4, 1.4, P.ink2);          // weighted base
  s.vline(6, 6, 21, P.silver);                       // pole
  for (let y = 8; y < 20; y += 4) s.px(6, y, P.white); // specular
  s.rect(5, 10, 3, 2, P.silver2);                    // clamp knuckle
  s.line(6, 10, 2, 5, P.silver);                     // boom arm
  s.fillEllipse(2, 4, 2, 2, P.magenta);              // windscreen ball
  s.px(3, 5, P.silver); s.px(2, 3, P.white, 180);
  s.line(2, 6, 4, 13, P.ink2, 170); s.line(4, 13, 6, 19, P.ink2, 170); // cable
  return s;
}

// --- Flyer pole (14x26) ------------------------------------------------------
function flyerPole(seed = 0) {
  const s = makeSprite(14, 26);
  s.shadow(7, 24, 4, 1.5);
  s.vline(7, 4, 23, P.wood); s.vline(8, 5, 23, P.wood2, 170);     // pole + shade
  const poster = (x, y, w, h, col) => {
    s.rect(x, y, w, h, col);
    s.hline(x, x + w - 1, y, P.ink2, 150); s.vline(x, y, y + h - 1, P.ink2, 150);
    s.px(x + w - 1, y, P.white, 200);                              // torn corner
    s.hline(x + 1, x + w - 2, y + 2, P.ink2, 170);                 // text scribble
    s.hline(x + 1, x + w - 3, y + 4, P.ink2, 130);
  };
  const cs = (i) => NEON[(i + seed) % NEON.length];
  poster(2, 7, 6, 6, cs(0)); poster(7, 6, 5, 5, cs(1));
  poster(3, 12, 6, 6, cs(2)); poster(8, 12, 5, 6, cs(3));
  poster(2, 16, 5, 5, cs(4));
  return s;
}

// --- Road case (18x14) -------------------------------------------------------
function roadCase() {
  const s = makeSprite(18, 14);
  s.shadow(9, 12, 8, 1.6);
  for (const cx of [3, 7, 11, 15]) s.rect(cx, 12, 2, 2, P.ink2);  // casters
  s.rect(2, 2, 14, 10, P.panel);
  s.vline(6, 3, 10, P.panel3); s.vline(11, 3, 10, P.panel3); s.hline(2, 16, 7, P.panel3); // grid
  for (const [cx, cy] of [[2, 2], [15, 2], [2, 11], [15, 11]]) { s.px(cx, cy, P.silver); s.px(cx === 2 ? 3 : 14, cy, P.silver, 180); s.px(cx, cy === 2 ? 3 : 10, P.silver, 180); }
  s.rect(7, 5, 4, 3, P.silver2); s.px(8, 6, P.ink); s.px(9, 6, P.ink); // latch plate
  s.rect(4, 8, 2, 2, P.cyan);                                     // sticker
  s.hline(2, 16, 2, P.white, 140); s.hline(2, 16, 11, P.ink, 220);
  return s;
}

// --- A-frame sandwich board (16x18) -----------------------------------------
function sandwichBoard() {
  const s = makeSprite(16, 18);
  s.shadow(8, 16, 6, 1.6);
  s.line(8, 4, 4, 16, P.wood); s.line(8, 4, 12, 16, P.wood);      // front legs (A)
  s.line(9, 5, 13, 16, P.wood2, 150);                            // back leg hint
  s.rect(4, 4, 9, 9, P.ink2);                                    // slate
  s.hline(4, 12, 3, P.wood, 220); s.hline(4, 12, 13, P.wood, 220); // frame
  s.vline(4, 4, 12, P.wood, 200); s.vline(12, 4, 12, P.wood, 200);
  for (let x = 5; x <= 11; x++) s.px(x, 6 + (x % 2), P.magenta);  // 'TONITE' scrawl
  for (let x = 5; x <= 11; x++) s.px(x, 8 + ((x + 1) % 2), P.magenta, 200);
  s.px(10, 11, P.gold); s.px(9, 11, P.gold, 160); s.px(11, 11, P.gold, 160); // star
  s.px(6, 11, P.white, 200);
  return s;
}

// --- String lights swag (28x14) ---------------------------------------------
function stringLights() {
  const s = makeSprite(28, 14);
  s.vline(1, 2, 11, P.ink); s.vline(26, 2, 11, P.ink);           // hook posts
  const wy = (x) => 3 + Math.round(3 * Math.sin(((x - 1) / 25) * Math.PI));
  for (let x = 1; x <= 26; x++) s.px(x, wy(x), P.panel2);        // catenary wire
  const bulbs = [4, 8, 12, 16, 20, 24];
  bulbs.forEach((x, i) => {
    const col = NEON[i % NEON.length];
    const by = wy(x) + 2;
    s.fillEllipse(x, by, 2.4, 2.4, col, 70);                     // glow halo
    s.rect(x - 1, by - 1, 2, 2, col);                            // bulb
    s.px(x, by - 1, P.white);                                    // hot center
    s.px(x, wy(x) + 1, P.panel2, 200);                           // tiny stem
  });
  return s;
}

// --- Cable coil (14x8) -------------------------------------------------------
function cableCoil() {
  const s = makeSprite(14, 8);
  s.shadow(7, 7, 6, 1.3);
  ovalOutline(s, 7, 4, 5, 2.4, P.panel);
  ovalOutline(s, 7, 4, 3.4, 1.7, P.panel2);
  ovalOutline(s, 7, 4, 1.8, 1, P.panel);
  s.line(11, 4, 13, 2, P.panel2);                                // tail
  s.rect(7, 2, 1, 3, P.green);                                   // velcro tie
  s.px(4, 3, P.white, 200);                                      // highlight
  return s;
}

export const SPRITES = {
  pa_speaker_stack: paSpeakerStack(),
  floor_amp: floorAmp(),
  mic_stand: micStand(),
  flyer_pole: flyerPole(0),
  flyer_pole_b: flyerPole(2),
  road_case: roadCase(),
  sandwich_board: sandwichBoard(),
  string_lights: stringLights(),
  cable_coil: cableCoil(),
};

// Only write PNGs when run directly (not when imported for previewing).
if (import.meta.url === `file://${process.argv[1]}`) {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  for (const [name, cv] of Object.entries(SPRITES)) {
    await writeFile(path.join(OUT, `${name}.png`), encodePng(cv.w, cv.h, cv.buf));
  }
  console.log(`[town-props] wrote ${Object.keys(SPRITES).length} sprites → art/sprites/town/`);
}

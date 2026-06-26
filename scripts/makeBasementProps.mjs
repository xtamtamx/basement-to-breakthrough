/**
 * makeBasementProps.mjs — author the pixel props that make the title room read as a
 * real unfinished BASEMENT: exposed ceiling pipes, an HVAC duct, a barred egress
 * window, a water heater, a steel support column. Integer-coord pixel art via the
 * shared png toolkit. Output → public/title/props/.
 *
 * Run: node scripts/makeBasementProps.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { encodePng, hex, makeSprite } from './lib/png.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'title', 'props');
const save = (name, w, h, draw) => {
  const s = makeSprite(w, h);
  draw(s);
  writeFileSync(join(OUT, `${name}.png`), encodePng(w, h, s.buf));
  console.log(`${name}: ${w}x${h}`);
};

// ---- exposed copper pipe run (horizontal), two bracket clamps ----
save('pipe_run', 34, 9, (s) => {
  const lit = hex('#b58a52'), body = hex('#8a6238'), shade = hex('#5e3f20');
  s.hline(2, 31, 3, lit);            // top highlight
  s.rect(2, 4, 30, 2, body);         // pipe body
  s.hline(2, 31, 6, shade);          // bottom shadow
  // elbow caps
  s.rect(1, 3, 2, 4, shade); s.rect(31, 3, 2, 4, shade);
  // two ceiling brackets
  [7, 26].forEach((x) => { s.rect(x, 0, 2, 3, hex('#4a4a52')); s.rect(x, 2, 2, 1, hex('#2e2e34')); });
  // a small valve wheel
  s.fillEllipse(20, 5, 2, 2, hex('#7a5230')); s.px(20, 5, hex('#caa060'));
});

// ---- galvanized HVAC duct (boxy elbow) with louvers + rivets ----
save('duct_vent', 22, 14, (s) => {
  const lit = hex('#a9a9b2'), body = hex('#84848e'), shade = hex('#54545c');
  s.rect(2, 2, 18, 11, body);
  s.hline(2, 19, 2, lit);            // top lip
  s.vline(2, 2, 12, lit);            // left lip
  s.hline(2, 19, 12, shade);         // bottom shadow
  s.vline(19, 2, 12, shade);         // right shadow
  for (let x = 5; x <= 17; x += 4) s.vline(x, 4, 11, shade); // louver seams
  // corner rivets
  [[4, 4], [17, 4], [4, 11], [17, 11]].forEach(([x, y]) => s.px(x, y, lit));
});

// ---- barred basement egress window: concrete well, cool night glow, security bars ----
save('basement_window', 28, 18, (s) => {
  const frame = hex('#3a3340'), sill = hex('#4a4450');
  const glass = hex('#5e6f82'), glassLo = hex('#3f4c5c'), bar = hex('#24242a');
  s.rect(0, 0, 28, 18, frame);          // recessed concrete frame
  s.rect(3, 3, 22, 12, glassLo);        // glass back
  // faint streetlight glow gradient (lighter toward top-left)
  for (let y = 3; y < 15; y++) for (let x = 3; x < 25; x++) {
    const t = 1 - (y - 3) / 12;
    if ((x + y) % 2 === 0 || t > 0.5) s.px(x, y, glass, Math.round(70 + t * 120));
  }
  s.hline(0, 27, 16, sill); s.hline(0, 27, 17, hex('#2a2630')); // sill + shadow
  // muntins (window cross) + vertical security bars
  s.hline(3, 24, 9, frame); s.vline(14, 3, 14, frame);
  [7, 11, 18, 22].forEach((x) => s.vline(x, 3, 14, bar));
});

// ---- water heater: beige cylinder, dome top, pipe stub, pilot dial ----
save('water_heater', 16, 28, (s) => {
  const lit = hex('#cdb888'), body = hex('#b09866'), shade = hex('#7e6a42'), cap = hex('#8a7850');
  s.rect(3, 4, 10, 23, body);
  s.vline(3, 4, 26, lit); s.vline(4, 4, 26, lit);     // left highlight
  s.vline(11, 4, 26, shade); s.vline(12, 4, 26, shade); // right shadow
  s.fillEllipse(8, 4, 5, 2, cap);                      // dome top
  s.vline(8, 0, 3, hex('#6a6a72')); s.px(7, 0, hex('#6a6a72')); s.px(9, 1, hex('#6a6a72')); // flue pipe
  s.rect(6, 16, 4, 3, hex('#5a4a30'));                 // control box
  s.px(7, 17, hex('#ff7a3a')); s.px(9, 17, hex('#caa060')); // pilot + dial
  s.shadow(8, 27, 6, 2, 70);
});

// ---- steel Lally support column (vertical), top + base plates ----
save('support_post', 9, 70, (s) => {
  const lit = hex('#7a7a84'), body = hex('#565660'), shade = hex('#34343c');
  s.rect(3, 3, 3, 64, body);
  s.vline(3, 3, 66, lit); s.vline(5, 3, 66, shade);
  s.rect(1, 0, 7, 3, hex('#4a4a54')); s.rect(1, 66, 7, 4, hex('#4a4a54')); // cap + base plates
  s.hline(1, 7, 0, lit); s.hline(1, 7, 69, shade);
});

console.log('basement props -> public/title/props/');

// Builds the music section from _music/*.md into music/*.html.
//
// A recipe is Markdown with frontmatter (title, summary, mood, order) and sections. A section whose body holds a
// ```settings fence becomes a settings card: one row per control, drawn as the real control is set.
//
//   ```settings
//   DELAY LVL :: 1 o'clock :: Why it's there.
//   TEXTURE :: [sparse|dense|*diffuse*] :: Why.
//   PITCH :: step 7/12 :: perfect 5th :: Why.        (a stepped knob: label after the step)
//   SECONDARY MODE :: Hold PING PONG ~2 s, until the PITCH LED blinks :: Why.
//   ```
//
// Knob values: min, max, noon, or "N o'clock" (7 o'clock = min, 5 o'clock = max). They're drawn as a knob.
// Run: node scripts/build-music.js [--check]

const fs = require('fs');
const path = require('path');
const L = require('./build-learning');

const SRC = path.join(L.ROOT, '_music');
const OUT = path.join(L.ROOT, 'music');

// 7 o'clock (fully counter-clockwise) → 0, 5 o'clock (fully clockwise) → 1.
function knobFraction(v) {
  const s = v.trim().toLowerCase();
  if (s === 'min' || s === 'minimum' || s === 'fully left') return 0;
  if (s === 'max' || s === 'maximum' || s === 'fully right') return 1;
  if (s === 'noon' || s === "12 o'clock") return 0.5;
  const m = s.match(/^(\d{1,2})(?::(\d{2}))? o'clock$/);
  if (!m) return null;
  let h = Number(m[1]) + (m[2] ? Number(m[2]) / 60 : 0);
  if (h < 7) h += 12; // 1 o'clock → 13
  const f = (h - 7) / 10;
  return f >= 0 && f <= 1 ? f : null;
}

const { pen } = require('./sketch');
const DEV = require('./devices');

// A knob, sketched: a wobbly ring with scale ticks, and the setting drawn in heavy pencil with a red dot.
function knobSvg(f, label) {
  const p = pen(`knob:${label}`);
  const P = (deg, r) => [24 + r * Math.sin(deg * Math.PI / 180), 24 - r * Math.cos(deg * Math.PI / 180)];
  const ticks = Array.from({ length: 11 }, (_, k) => { const d = -150 + 30 * k; const [a, b] = P(d, 19), [c, e] = P(d, k % 5 === 0 ? 23 : 21.5); return p.line(a, b, c, e, false); }).join(' ');
  const d = -150 + 300 * f;
  const [x1, y1] = P(d, 2), [x2, y2] = P(d, 14);
  return `<svg class="knob" viewBox="0 0 48 48" role="img" aria-label="${L.esc(label)}"><path class="wash" d="${p.blob(25.5, 25.5, 14, 14, 0.12)}"/><path class="sk thin" d="${ticks}"/><path class="sk" d="${p.ellipse(24, 24, 15, 15)}"/><path class="sk ptr" d="${p.line(x1, y1, x2, y2)}"/><circle class="k-dot" cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="2.3"/></svg>`;
}

// A device's panel, sketched, with this recipe's knobs and switches drawn where they're set.
const shortName = s => s.replace(/\s*\(.*?\)\s*/g, ' ').replace(/^(Ch|Channel) \d+ /, '').replace(/^Oscillator /, 'OSC ').replace(/^Filter /, 'VCF ').replace(/ \(all\)$/, '').replace(/^LFO SPEED\/PHASE$/, 'LFO SPEED').trim();
function deviceSketch(dev, title, block) {
  const rows = block.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.split('::').map(s => s.trim()));
  const items = rows.map(([c, v, x]) => {
    const step = (v || '').match(/^step (\d+)\/(\d+)$/);
    if (step) return { c: shortName(c), kind: 'knob', f: (step[1] - 1) / (step[2] - 1), v: x || `step ${step[1]}` };
    const fr = knobFraction(v || '');
    if (fr !== null) return { c: shortName(c), kind: 'knob', f: fr, v };
    const ch = (v || '').match(/^\[(.+)\]$/);
    if (ch) { const on = ch[1].split('|').find(o => /^\*.*\*$/.test(o.trim())); if (on) return { c: shortName(c), kind: 'switch', v: on.trim().slice(1, -1) }; }
    return null;
  }).filter(Boolean);
  if (items.length < 2) return '';
  const p = pen(`dev:${title}`);
  const pedal = dev === 'dev-gc' || dev === 'dev-ns';
  const cols = Math.min(pedal ? 4 : 5, items.length), cw = 118, chh = 104;
  const W = cols * cw + 40, top = 54, bodyRows = Math.ceil(items.length / cols), H = top + bodyRows * chh + (pedal ? 92 : 24);
  const name = { 'dev-gc': 'GRAND CANYON', 'dev-ns': 'NIGHTSKY', 'dev-pf': 'PERfourMER MKII', 'dev-oxi': 'OXI ONE' }[dev] || '';
  let svg = `<path class="wash soft" d="${p.blob(W / 2 + 10, H / 2 + 8, W / 2 - 4, H / 2 - 6, 0.08)}"/><path class="sk heavy" d="${p.rect(6, 8, W - 12, H - 16)}"/>`;
  svg += `<text class="sk-type" x="22" y="38">${L.esc(name)}</text><path class="sk thin" d="${p.line(20, 46, W - 20, 46, false)}"/>`;
  if (!pedal) for (const [x, y] of [[16, 18], [W - 16, 18], [16, H - 18], [W - 16, H - 18]]) svg += `<path class="sk thin" d="${p.ellipse(x, y, 3.2, 3.2, false)}"/>`;
  items.forEach((it, k) => {
    const cx = 20 + (k % cols) * cw + cw / 2, cy = top + Math.floor(k / cols) * chh + 36;
    const label = L.esc(it.c.length > 16 ? it.c.slice(0, 15) + '…' : it.c);
    if (it.kind === 'knob') {
      const P = (deg, r) => [cx + r * Math.sin(deg * Math.PI / 180), cy - r * Math.cos(deg * Math.PI / 180)];
      const ticks = Array.from({ length: 11 }, (_, q) => { const d = -150 + 30 * q; const [a, b] = P(d, 23), [c, e] = P(d, q % 5 === 0 ? 28 : 26); return p.line(a, b, c, e, false); }).join(' ');
      const d = -150 + 300 * it.f, [x1, y1] = P(d, 3), [x2, y2] = P(d, 17);
      svg += `<path class="wash" d="${p.blob(cx + 3, cy + 3, 18, 18, 0.14)}"/><path class="sk thin" d="${ticks}"/><path class="sk" d="${p.ellipse(cx, cy, 19, 19)}"/><path class="sk ptr" d="${p.line(x1, y1, x2, y2)}"/><circle class="k-dot" cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="2.6"/>`;
    } else {
      const w = Math.max(44, Math.min(cw - 14, it.v.length * 8.5 + 18));
      svg += `<path class="wash hi" d="${p.blob(cx, cy, w / 2 + 4, 16, 0.12)}"/><path class="sk" d="${p.rect(cx - w / 2, cy - 14, w, 28)}"/><text class="sk-hand" x="${cx}" y="${cy + 6}" text-anchor="middle">${L.esc(it.v)}</text><path class="sk red" d="${p.ellipse(cx, cy, w / 2 + 7, 20, false)}"/>`;
    }
    svg += `<text class="sk-label" x="${cx}" y="${cy + 50}" text-anchor="middle">${label}</text>`;
  });
  if (pedal) {
    const fy = H - 56;
    for (const fx of [W * 0.3, W * 0.7]) svg += `<path class="sk" d="${p.ellipse(fx, fy, 17, 17)}"/><path class="sk thin" d="${p.ellipse(fx, fy, 9, 9, false)}"/>`;
    svg += `<path class="sk red" d="${p.ellipse(W / 2, fy, 4, 4, false)}"/>`;
  }
  return `<figure class="panel-sketch"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sketch of the ${L.esc(name)} panel with this recipe's settings">${svg}</svg><figcaption>The panel as it should look. Details below.</figcaption></figure>`;
}

// The whole rig, sketched for the index: four boxes and their cables.
function rigSketch() {
  const p = pen('rig');
  const W = 760, H = 300;
  let s = '';
  s += `<g class="dev-oxi"><path class="wash" d="${p.blob(104, 134, 92, 66)}"/></g><g class="dev-pf"><path class="wash" d="${p.blob(326, 134, 104, 76)}"/></g><g class="dev-gc"><path class="wash" d="${p.blob(526, 134, 66, 86)}"/></g><g class="dev-ns"><path class="wash" d="${p.blob(688, 134, 66, 86)}"/></g>`;
  // OXI One: a pad grid
  s += `<path class="sk heavy" d="${p.rect(14, 70, 170, 120)}"/><path class="sk thin" d="${p.rect(28, 84, 60, 22)}"/>`;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) s += `<path class="sk thin" d="${p.rect(28 + c * 18, 116 + r * 16, 11, 10, false)}"/>`;
  s += `<text class="sk-hand big" x="99" y="222" text-anchor="middle">OXI One</text><text class="sk-label" x="99" y="242" text-anchor="middle">plays the notes</text>`;
  // PERfourMER: four channel strips of knobs
  s += `<path class="sk heavy" d="${p.rect(222, 62, 196, 136)}"/>`;
  for (let c = 0; c < 4; c++) { s += `<path class="sk thin" d="${p.line(222 + 49 * (c + 1), 70, 222 + 49 * (c + 1), 190, false)}"/>`; for (let r = 0; r < 4; r++) s += `<path class="sk" d="${p.ellipse(246 + c * 49, 86 + r * 30, 8, 8, r % 2 === 0)}"/>`; }
  s += `<text class="sk-hand big" x="320" y="230" text-anchor="middle">PERfourMER</text><text class="sk-label" x="320" y="250" text-anchor="middle">four analog voices</text>`;
  // Two pedals
  const pedalAt = (x, name, sub, n) => {
    let o = `<path class="sk heavy" d="${p.rect(x, 52, 118, 158)}"/>`;
    for (let k = 0; k < n; k++) o += `<path class="sk" d="${p.ellipse(x + 26 + (k % 3) * 33, 80 + Math.floor(k / 3) * 34, 10, 10)}"/>`;
    o += `<path class="sk" d="${p.ellipse(x + 34, 182, 13, 13)}"/><path class="sk" d="${p.ellipse(x + 84, 182, 13, 13)}"/>`;
    return o + `<text class="sk-hand big" x="${x + 59}" y="240" text-anchor="middle">${name}</text><text class="sk-label" x="${x + 59}" y="260" text-anchor="middle">${sub}</text>`;
  };
  s += pedalAt(462, 'Grand Canyon', 'delay', 6) + pedalAt(624, 'NightSky', 'reverb', 9);
  // Cables
  s += `<path class="sk red" d="${p.cable(184, 100, 222, 100, 22)}"/><text class="sk-label" x="203" y="60" text-anchor="middle">MIDI</text>`;
  s += `<path class="sk" d="${p.cable(418, 120, 462, 120, 26)}"/><text class="sk-label" x="440" y="60" text-anchor="middle">audio</text>`;
  s += `<path class="sk" d="${p.cable(580, 110, 624, 110, 20)}"/><path class="sk" d="${p.cable(580, 122, 624, 122, 26)}"/>`;
  s += `<path class="sk" d="${p.line(742, 160, 756, 160)}"/><text class="sk-label" x="742" y="36" text-anchor="end">to your mixer</text><path class="sk thin" d="${p.line(736, 42, 748, 156, false)}"/>`;
  s += `<path class="sk" d="${p.cable(404, 198, 440, 290, -30)}"/><text class="sk-label" x="448" y="292">dry bass, straight to the mixer</text>`;
  return `<figure class="rig-sketch"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sketch of the rig: the OXI One sends MIDI to the PERfourMER, whose audio goes through the Grand Canyon and the NightSky; the bass leaves the PERfourMER dry">${s}</svg></figure>`;
}

// "What it sounds like": one drawing per recipe, chosen by the recipe's `sound` field.
function soundSketch(kind, seed) {
  const p = pen(`sound:${seed}`);
  const W = 300, H = 230;
  let s = '';
  const T = (x, y, txt, cls = 'sk-hand', a = 'middle') => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${a}">${txt}</text>`;
  if (kind === 'stairs') {
    const notes = ['A', 'E', 'B', 'F♯', 'C♯'];
    notes.forEach((n, k) => { const x = 22 + k * 52, y = 186 - k * 32; s += `<path class="sk${k ? '' : ' heavy'}" d="${p.rect(x, y, 44, 22)}"/>` + T(x + 22, y + 17, n); if (k) s += `<path class="sk thin" d="${p.line(x - 8, y + 30, x + 4, y + 22, false)}"/>`; });
    s += `<path class="sk red" d="${p.cable(40, 170, 250, 50, -40)}"/>` + `<path class="sk red" d="${p.line(246, 54, 236, 52)} ${p.line(246, 54, 242, 64)}"/>`;
    s += `<path class="sk thin" d="${p.ellipse(240, 40, 46, 22)} ${p.ellipse(214, 30, 22, 14, false)} ${p.ellipse(268, 34, 20, 13, false)}"/>` + T(240, 46, 'cloud', 'sk-label');
    s += T(24, 222, 'one note → a fifth up, again and again', 'sk-label', 'start');
  } else if (kind === 'cloud') {
    s += `<path class="sk" d="${p.ellipse(150, 90, 110, 52)} ${p.ellipse(90, 74, 46, 32, false)} ${p.ellipse(205, 72, 50, 34, false)}"/>`;
    s += `<path class="sk red" d="${p.line(150, 62, 150, 118)} ${p.line(126, 76, 174, 104)} ${p.line(126, 104, 174, 76)}"/>` + T(150, 138, 'INFINITE', 'sk-type');
    s += `<path class="sk" d="${p.line(266, 70, 266, 30)} ${p.line(266, 30, 258, 40)} ${p.line(266, 30, 274, 40)} ${p.line(266, 110, 266, 150)} ${p.line(266, 150, 258, 140)} ${p.line(266, 150, 274, 140)}"/>` + T(266, 168, '± semitones', 'sk-label');
    for (let k = 0; k < 3; k++) s += `<path class="sk thin" d="${p.rect(40 + k * 22, 172 - k * 10, 14, 30 + k * 10)}"/>`;
    s += T(30, 222, 'a chord, frozen, then moved', 'sk-label', 'start');
  } else if (kind === 'tape') {
    const vox = ['1', '3', '4', '1', '3', '4', '1'];
    vox.forEach((v, k) => { const x = 26 + k * 38; s += `<path class="sk${v === '1' ? '' : v === '3' ? ' red' : ' thin'}" d="${p.ellipse(x, 70 + (k % 3) * 18, 12, 12)}"/>` + T(x, 76 + (k % 3) * 18, v, 'sk-label'); });
    let wave = ''; for (let x = 20; x < 280; x += 20) wave += p.line(x, 160 + Math.sin(x / 18) * 10, x + 20, 160 + Math.sin((x + 20) / 18) * 10, false) + ' ';
    s += `<path class="sk" d="${wave}"/>` + T(150, 196, 'wow & flutter', 'sk-label') + T(26, 34, 'each note, the next voice', 'sk-label', 'start');
  } else if (kind === 'reverse') {
    s += `<path class="sk" d="${p.line(20, 110, 40, 30)} ${p.line(40, 30, 130, 110)}"/>` + T(75, 140, 'played', 'sk-label');
    s += `<path class="sk red" d="${p.line(170, 110, 260, 30)} ${p.line(260, 30, 280, 110)}"/>` + T(225, 140, 'echoed', 'sk-label');
    s += `<path class="sk" d="${p.line(138, 70, 162, 70)} ${p.line(162, 70, 154, 64)} ${p.line(162, 70, 154, 76)}"/>`;
    s += `<path class="sk thin" d="${p.line(14, 110, 290, 110, false)}"/>` + T(150, 200, 'the echo swells in, backwards', 'sk-label');
  } else if (kind === 'sing') {
    s += `<path class="sk heavy" d="${p.line(14, 180, 290, 180)}"/>` + T(150, 210, 'the drone never moves', 'sk-label');
    const ys = [110, 80, 96, 60, 90];
    ys.forEach((y, k) => { const x = 20 + k * 54; s += `<path class="sk red" d="${p.line(x, y, x + 34, y)}"/>`; if (k < ys.length - 1) s += `<path class="sk red" d="${p.line(x + 34, y, x + 54, ys[k + 1], false)}"/>`; s += T(x + 17, y - 10, String(k + 1), 'sk-label'); });
    s += T(150, 30, 'the reverb sings, gliding', 'sk-label');
  } else if (kind === 'poly') {
    const cx = 150, cy = 110, R = 78;
    s += `<path class="sk" d="${p.ellipse(cx, cy, R, R)}"/>`;
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; s += `<path class="sk heavy" d="${p.line(cx + Math.sin(a) * (R - 12), cy - Math.cos(a) * (R - 12), cx + Math.sin(a) * (R + 12), cy - Math.cos(a) * (R + 12))}"/>`; }
    for (let k = 0; k < 3; k++) { const a = k * 2 * Math.PI / 3; s += `<path class="sk red" d="${p.ellipse(cx + Math.sin(a) * R, cy - Math.cos(a) * R, 8, 8)}"/>`; }
    s += T(cx, cy - 4, 'one bar', 'sk-label') + T(cx, cy + 16, '| bass ×4   ● echo ×3', 'sk-label') + T(cx, 222, 'they meet on beat 1', 'sk-label');
  } else if (kind === 'fm') {
    let w1 = '', w2 = '';
    for (let x = 20; x < 130; x += 6) w1 += p.line(x, 60 + Math.sin(x / 9) * 16, x + 6, 60 + Math.sin((x + 6) / 9) * 16, false) + ' ';
    for (let x = 170; x < 282; x += 3) { const ph = (u => u / 5 + 2.2 * Math.sin(u / 9))(x); const ph2 = (u => u / 5 + 2.2 * Math.sin(u / 9))(x + 3); w2 += p.line(x, 60 + Math.sin(ph) * 16, x + 3, 60 + Math.sin(ph2) * 16, false) + ' '; }
    s += `<path class="sk" d="${w1}"/>` + T(75, 102, 'one sine…', 'sk-label');
    s += `<path class="sk red" d="${p.line(136, 60, 160, 60)} ${p.line(160, 60, 152, 54)} ${p.line(160, 60, 152, 66)}"/>` + T(148, 40, 'shake it', 'sk-label');
    s += `<path class="sk" d="${w2}"/>` + T(226, 102, '…a new colour', 'sk-label');
    s += `<path class="sk thin" d="${p.line(20, 196, 284, 196, false)}"/>`;
    [[60, .35], [100, .6], [140, 1], [180, .6], [220, .35], [260, .15]].forEach(([x, a]) => { s += `<path class="sk${x === 140 ? ' heavy' : ''}" d="${p.line(x, 196, x, 196 - a * 72)}"/><circle class="k-dot" cx="${x}" cy="${196 - a * 72}" r="3.2"/>`; });
    s += T(150, 222, 'the spikes it makes', 'sk-label');
  } else return '';
  s = `<path class="wash hi" d="${p.blob(150, 110, 130, 90, 0.1)}"/>` + s;
  return `<figure class="sound-sketch"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sketch of what the recipe sounds like">${s}</svg><figcaption>What it sounds like</figcaption></figure>`;
}

// The OXI's 16 steps, sketched. Each line: "Label :: pattern", x = note, = tie, . empty.
function stepsSketch(block, seed) {
  const p = pen(`steps:${seed}`);
  const rows = block.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.split('::').map(s => s.trim()));
  const cw = 34, lw = 150, rh = 56, W = lw + 16 * cw + 16, H = 40 + rows.length * rh;
  let s = '';
  for (let k = 0; k < 16; k++) s += `<text class="sk-label" x="${lw + k * cw + cw / 2}" y="24" text-anchor="middle">${k % 4 === 0 ? k + 1 : '·'}</text>`;
  rows.forEach(([label, pat], r) => {
    const y = 36 + r * rh;
    s += `<text class="sk-hand" x="8" y="${y + 28}">${L.esc(label)}</text>`;
    [...(pat || '')].slice(0, 16).forEach((c, k) => {
      const x = lw + k * cw;
      s += `<path class="sk${k % 4 === 0 ? '' : ' thin'}" d="${p.rect(x + 3, y + 6, cw - 6, rh - 16, k % 4 === 0)}"/>`;
      if (c === 'x') s += `<path class="wash" d="${p.blob(x + cw / 2 + 2, y + rh / 2, 13, 13, 0.15)}"/><circle class="k-dot" cx="${x + cw / 2}" cy="${y + rh / 2 - 2}" r="7"/>`;
      if (c === '=') s += `<path class="sk red" d="${p.line(x - 4, y + rh / 2 - 2, x + cw + 2, y + rh / 2 - 2)}"/>`;
    });
  });
  return `<figure class="steps-sketch"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sketch of the OXI One's 16 steps for this recipe">${s}</svg><figcaption>● a note · red line: tied on</figcaption></figure>`;
}

// A cassette, sketched, for the index shelf.
function cassetteSketch(seed) {
  const p = pen(`tape:${seed}`);
  let s = `<path class="wash soft" d="${p.blob(162, 108, 150, 96, 0.06)}"/><path class="wash" d="${p.blob(160, 50, 128, 30, 0.1)}"/><path class="sk heavy" d="${p.rect(6, 6, 308, 196)}"/><path class="sk" d="${p.rect(26, 22, 268, 104)}"/>`;
  s += `<path class="sk thin" d="${p.line(36, 70, 284, 70, false)} ${p.line(36, 92, 284, 92, false)} ${p.line(36, 114, 284, 114, false)}"/>`;
  s += `<path class="sk" d="${p.rect(80, 138, 160, 40)}"/>`;
  for (const x of [114, 206]) { s += `<path class="sk" d="${p.ellipse(x, 158, 14, 14)}"/><path class="sk thin" d="${p.ellipse(x, 158, 5, 5, false)}"/>`; }
  s += `<path class="sk thin" d="${p.hatch(132, 148, 56, 20, 5)}"/>`;
  s += `<path class="sk thin" d="${p.line(60, 202, 90, 186, false)} ${p.line(260, 202, 230, 186, false)} ${p.line(90, 186, 230, 186, false)}"/>`;
  return `<svg class="c-sk" viewBox="0 0 320 210" aria-hidden="true">${s}</svg>`;
}

function valueHtml(control, v, extra) {
  const ctx = { file: 'music', cards: new Map(), links: new Set() };
  const choice = v.match(/^\[(.+)\]$/);
  if (choice) {
    const opts = choice[1].split('|').map(o => o.trim());
    return `<span class="choices">${opts.map(o => { const on = /^\*.*\*$/.test(o); return `<span class="choice${on ? ' on' : ''}">${L.esc(on ? o.slice(1, -1) : o)}</span>`; }).join('')}</span>`;
  }
  const step = v.match(/^step (\d+)\/(\d+)$/);
  if (step) {
    const [k, n] = [Number(step[1]), Number(step[2])];
    return `${knobSvg((k - 1) / (n - 1), `${control}: step ${k} of ${n}`)}<span class="v">Step ${k} of ${n}${extra ? `: ${L.inline(extra, ctx)}` : ''}</span>`;
  }
  const f = knobFraction(v);
  if (f !== null) return `${knobSvg(f, `${control} at ${v}`)}<span class="v">${L.esc(v)}</span>`;
  return `<span class="v text">${L.inline(v, ctx)}</span>`;
}

function settings(block, nums = []) {
  const ctx = { file: 'music', cards: new Map(), links: new Set() };
  const rows = block.split('\n').map(l => l.trim()).filter(Boolean).map((line, k) => {
    const parts = line.split('::').map(s => s.trim());
    const [control, value] = parts;
    const stepped = /^step \d+\/\d+$/.test(value);
    const extra = stepped ? parts[2] : '';
    const why = stepped ? parts[3] : parts[2];
    return `<li class="setting" tabindex="0"><span class="control">${nums[k] ? `<span class="num" aria-hidden="true">${nums[k]}</span>` : ''}${L.esc(control)}</span><span class="value">${valueHtml(control, value, extra)}</span>${why ? `<span class="why">${L.inline(why, ctx)}</span>` : ''}</li>`;
  });
  return `<ul class="settings">${rows.join('')}</ul>`;
}

// A Digitone II parameter page, drawn like its screen: the knobs' parameters in their places, the ones this step
// changes inverted. Each line: "PARAM :: value :: why". *value* marks a change; ≈ marks my starting point.
//   ```digitone SYN 1 · FM TONE
//   ALGO :: *1* :: Why.
//   ```
function digitone(head, block) {
  const ctx = { file: 'music', cards: new Map(), links: new Set() };
  const rows = block.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.split('::').map(x => x.trim()));
  const cell = ([c, v]) => {
    const on = /^\*.*\*$/.test(v || '');
    const val = on ? v.slice(1, -1) : (v || '');
    return `<div class="dn-cell${on ? ' on' : ''}"><span class="dn-v">${L.esc(val)}</span><span class="dn-p">${L.esc(c)}</span></div>`;
  };
  const screen = `<figure class="dn-screen"><figcaption class="dn-head"><span>${L.esc(head || '')}</span></figcaption><div class="dn-grid${rows.length === 8 ? ' eight' : ''}">${rows.map(cell).join('')}</div></figure>`;
  const whys = rows.filter(([, v, why]) => /^\*.*\*$/.test(v || '') && why).map(([c, v, why]) => `<li class="setting" tabindex="0"><span class="control">${L.esc(c)}</span><span class="value"><span class="v text">${L.esc(v.slice(1, -1))}</span></span><span class="why">${L.inline(why, ctx)}</span></li>`);
  return screen + (whys.length ? `<ul class="settings">${whys.join('')}</ul>` : '');
}

// A question to answer in your head, then open: "Question::Answer".
function check(block) {
  const ctx = { file: 'music', cards: new Map(), links: new Set() };
  return block.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [q, a] = l.split('::'); return `<details class="check"><summary><span class="check-tag">Check</span> ${L.inline(q.trim(), ctx)}</summary><p>${L.inline((a || '').trim(), ctx)}</p></details>`; }).join('');
}

// "Play it here": the spikes are drawn at build time (so they show without JavaScript), and music.js adds the
// sound and the controls. Lines: "key: value" (title, mode rate|pluck|match, ratio, depth, rate, choices, lock, targets).
const FM = require('../music/fm-core.js');
function fmToy(block) {
  const cfg = {};
  for (const l of block.split('\n')) { const m = l.match(/^\s*(\w+)\s*:\s*(.+?)\s*$/); if (m) cfg[m[1]] = m[2]; }
  const list = v => (v || '').split(',').map(x => x.trim()).filter(Boolean);
  const data = { title: cfg.title || 'Play it here', mode: cfg.mode || 'ratio', ratio: Number(cfg.ratio || 1), depth: Number(cfg.depth || 0), rate: Number(cfg.rate || 4), lock: list(cfg.lock), choices: list(cfg.choices).map(Number), targets: list(cfg.targets) };
  if (data.mode === 'match') { data.ratio = 1; data.depth = 0; }
  const fm = data.mode === 'rate' ? data.rate : 220 * data.ratio;
  const d = FM.svg(220, fm, data.depth, { rungs: 12 });
  const note = { rate: 'Slide the speed up slowly and listen for the moment the wobble becomes a colour.', pluck: 'Each note starts with this many spikes and falls back to one: that fall is the A envelope.', match: 'Play the target, set ratio and depth, then check.' }[data.mode] || 'The faint lines are the note’s harmonics: 1, 2, 3… times the note.';
  return `<figure class="fm-toy" data-cfg="${L.esc(JSON.stringify(data))}"><div class="fm-head"><span class="fm-tag">Play it here</span> <b>${L.esc(data.title)}</b></div><div class="fm-spec-wrap">${d.svg}</div><p class="fm-read" aria-live="polite">${L.esc(d.label)}</p><div class="fm-controls" hidden></div><figcaption>${L.esc(note)}</figcaption></figure>`;
}

// An FM algorithm, sketched like the Digitone's own drawing. Lines: "OP col row [fb]" places an operator,
// "A>C" draws a modulation line, "C>X" or "B1>Y dotted" an output.
function algoSketch(block, seed) {
  const p = pen(`algo:${seed}`);
  const ops = {}, edges = [];
  for (const l of block.split('\n').map(x => x.trim()).filter(Boolean)) {
    const m = l.match(/^(\w+)\s+(-?\d+)\s+(-?\d+)(\s+fb)?$/);
    if (m) ops[m[1]] = { c: Number(m[2]), r: Number(m[3]), fb: !!m[4] };
    else { const e = l.match(/^(\w+)>(\w+)(\s+dotted)?$/); if (e) edges.push({ a: e[1], b: e[2], dot: !!e[3] }); }
  }
  const cs = Object.values(ops).map(o => o.c), rs = Object.values(ops).map(o => o.r);
  const c0 = Math.min(...cs), r0 = Math.min(...rs), cw = 96, rh = 84, bw = 54, x0 = 60, y0 = 34;
  const at = o => [x0 + (o.c - c0) * cw, y0 + (o.r - r0) * rh];
  const bottom = y0 + (Math.max(...rs) - r0) * rh + bw + 46;
  const W = x0 + (Math.max(...cs) - c0) * cw + bw + 60, H = bottom + 40;
  const outX = { X: x0 + bw / 2, Y: x0 + (Math.max(...cs) - c0) * cw + bw / 2 };
  let s = '';
  for (const e of edges) {
    const A = ops[e.a]; if (!A) continue;
    const [ax, ay] = at(A);
    if (e.b === 'X' || e.b === 'Y') {
      const tx = outX[e.b];
      const d = Math.abs(tx - (ax + bw / 2)) < 2 ? p.line(ax + bw / 2, ay + bw, tx, bottom - 18) : p.line(ax + bw / 2, ay + bw, ax + bw / 2, bottom - 30) + ' ' + p.line(ax + bw / 2, bottom - 30, tx, bottom - 18);
      s += `<path class="sk${e.dot ? ' dotted' : ''}" d="${d}"/>`;
    } else {
      const B = ops[e.b]; if (!B) continue;
      const [bx, by] = at(B);
      s += `<path class="sk red" d="${p.line(ax + bw / 2, ay + bw, bx + bw / 2, by)}"/><circle class="k-dot" cx="${bx + bw / 2}" cy="${by}" r="3.4"/>`;
    }
  }
  for (const [name, o] of Object.entries(ops)) {
    const [x, y] = at(o);
    s += `<path class="wash" d="${p.blob(x + bw / 2 + 3, y + bw / 2 + 3, bw / 2, bw / 2, 0.12)}"/><path class="sk heavy" d="${p.rect(x, y, bw, bw)}"/><text class="sk-hand big" x="${x + bw / 2}" y="${y + bw / 2 + 8}" text-anchor="middle">${L.esc(name)}</text>`;
    if (o.fb) s += `<path class="sk" d="${p.line(x - 10, y + 16, x - 10, y - 10)} ${p.line(x - 10, y - 10, x + 16, y - 10)} ${p.line(x + 16, y - 10, x + 16, y)}"/><text class="sk-label" x="${x - 14}" y="${y - 16}" text-anchor="middle">FDBK</text>`;
  }
  for (const [k, x] of Object.entries(outX)) s += `<text class="sk-hand big" x="${x}" y="${bottom + 4}" text-anchor="middle">${k}</text>`;
  return `<figure class="algo-sketch"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sketch of the algorithm: ${L.esc(edges.map(e => `${e.a} to ${e.b}`).join(', '))}">${s}</svg><figcaption>Red: shakes (modulates). Black: goes out to X or Y; dotted: not shaped by the operator envelope.</figcaption></figure>`;
}

// The real panel of a device, with this card's controls set and numbered like the rows under it.
// PERfourMER cards show only the channel strips they touch (named by "Ch N" rows, or the section's text).
function panelFor(dev, title, text, block) {
  const rows = block.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.split('::').map(x => x.trim()));
  const chm = (title + ' ' + text).match(/channels?\s*\**\s*(\d)/i);
  const ctx = { channel: chm ? Number(chm[1]) : 1 };
  const set = {}, numbers = {}, nums = [], chans = new Set();
  let n = 0;
  rows.forEach(([c, v], k) => {
    const r = DEV.resolve(dev, c, v || '', ctx);
    if (!r) return;
    if (!numbers[r.id]) numbers[r.id] = ++n;
    nums[k] = numbers[r.id];
    if (!r.state.off) set[r.id] = r.state;
    if (dev === 'pf' && r.id.startsWith('c')) chans.add(r.channel);
  });
  if (n < 2) return { html: '', nums: [] };
  let view = ['all'];
  let inset = '';
  if (dev === 'pf') {
    view = [...chans].sort().map(c => `ch${c}`);
    if (!view.length) view = ['ch1'];
    const g = ['playmode', 'master'].filter(r => set[r === 'master' ? 'master_volume' : 'playmode']);
    if (g.length) inset = DEV.render('pf', { set, view: g, numbers, seed: title + ':g' }).replace('class="dev-sketch', 'class="dev-sketch inset');
  }
  if (dev === 'ns') view = ['panel'];
  if (dev === 'gc') view = ['top'];
  const name = { pf: 'PERfourMER', gc: 'Grand Canyon', ns: 'NightSky' }[dev];
  const cap = dev === 'pf' && chans.size ? `The ${name}${view.filter(v => v.startsWith('ch')).length > 1 ? `, channels ${[...chans].sort().join(' and ')}` : `, channel ${[...chans][0] || ctx.channel}`}: the numbers match the list below.` : `The ${name}: the numbers match the list below.`;
  const main = DEV.render(dev, { set, view, numbers, caption: cap, seed: title, fitX: dev === 'pf' ? 70 : 0 });
  return { html: inset ? `<div class="dev-row">${main}${inset}</div>` : main, nums };
}

// Any device of the rig, from a lesson: "```device dn" then "control :: on | 0.3 | option" lines, "caption: …",
// and optionally "view: region, region". Ids are the models' ids in scripts/devices.js.
function deviceBlock(id, block, seed) {
  const set = {}, numbers = {};
  let caption = '', view = ['all'], n = 0;
  for (const l of block.split('\n').map(x => x.trim()).filter(Boolean)) {
    if (/^caption:/.test(l)) { caption = l.replace(/^caption:\s*/, ''); continue; }
    if (/^view:/.test(l)) { view = l.replace(/^view:\s*/, '').split(',').map(x => x.trim()); continue; }
    const [c, v] = l.split('::').map(x => x.trim());
    set[c] = v === 'on' ? { on: true } : /^[\d.]+$/.test(v) ? { f: Number(v) } : { opt: v };
    numbers[c] = ++n;
  }
  return DEV.render(id, { set, view, numbers, caption, seed });
}

// One section: Markdown, with any ```settings fences drawn as cards.
function section(title, text) {
  const ctx = { file: 'music', cards: new Map(), links: new Set() };
  text = text.replace(/```steps\n([\s\S]*?)```/g, (_, b) => `\n\n@@STEPS${Buffer.from(b).toString('base64')}@@\n\n`);
  const blocks = [];
  const stash = html => { blocks.push(html); return `\n\n@@BLOCK${blocks.length - 1}@@\n\n`; };
  text = text.replace(/```digitone ?([^\n]*)\n([\s\S]*?)```/g, (_, h, b) => stash(digitone(h.trim(), b)))
    .replace(/```check\n([\s\S]*?)```/g, (_, b) => stash(check(b)))
    .replace(/```fm\n([\s\S]*?)```/g, (_, b) => stash(fmToy(b)))
    .replace(/```algo\n([\s\S]*?)```/g, (_, b) => stash(algoSketch(b, title)))
    .replace(/```device (\w+)\n([\s\S]*?)```/g, (_, id, b) => stash(deviceBlock(id, b, title)))
    .replace(/^> (.+)$/gm, (_, q) => stash(`<blockquote class="idea"><p>${L.inline(q, ctx)}</p></blockquote>`));
  const parts = text.split(/```settings\n([\s\S]*?)```/);
  const dev0 = /perfourmer|^the bass/i.test(title) ? 'dev-pf' : /grand canyon/i.test(title) ? 'dev-gc' : /nightsky/i.test(title) ? 'dev-ns' : '';
  let html = '';
  parts.forEach((part, i) => {
    if (i % 2) {
      const devId = { 'dev-pf': 'pf', 'dev-gc': 'gc', 'dev-ns': 'ns' }[dev0];
      const panel = devId && /^\d+\.|bass/i.test(title) ? panelFor(devId, title, text, part) : { html: '', nums: [] };
      html += panel.html + settings(part, panel.nums);
    }
    else if (part.trim()) part.split(/@@STEPS([A-Za-z0-9+/=]+)@@/).forEach((q, k) => {
      if (k % 2) html += stepsSketch(Buffer.from(q, 'base64').toString('utf8'), title);
      else if (q.trim()) q.split(/@@BLOCK(\d+)@@/).forEach((r, j) => {
        if (j % 2) html += blocks[Number(r)];
        else if (r.trim()) html += L.renderBlocks(L.parseBody(`## x\n\n${r.trim()}\n`, ctx)[0].blocks, ctx);
      });
    });
  });
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const dev = /perfourmer/i.test(title) ? 'dev-pf' : /grand canyon/i.test(title) ? 'dev-gc' : /nightsky/i.test(title) ? 'dev-ns' : /oxi/i.test(title) ? 'dev-oxi' : '';
  return `      <section id="${id}"${dev ? ` class="device ${dev}"` : ''}><h2>${L.inline(title, ctx)}</h2>\n${html}</section>`;
}

// A pencil wobble for anything "drawn by hand", defined once per page.
const DEFS = '<svg class="defs" width="0" height="0" aria-hidden="true" focusable="false"><filter id="pencil"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.8"/></filter><filter id="watercolor" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="8" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="14" result="d"/><feGaussianBlur in="d" stdDeviation="0.8"/></filter></svg>';

// The signal chain, drawn as four boxes and a cable: the same on every page.
const CHAIN = [['dev-oxi', 'OXI One MK2', 'sequencer'], ['dev-pf', 'PERfourMER MKII', 'synth'], ['dev-gc', 'Grand Canyon', 'delay'], ['dev-ns', 'NightSky', 'reverb']];
const chain = () => `<ol class="chain" aria-label="Signal chain">${CHAIN.map(([c, n, k]) => `<li class="${c}"><b>${n}</b><span>${k}</span></li>`).join('')}</ol>`;

function load() {
  if (!fs.existsSync(SRC)) return [];
  return fs.readdirSync(SRC).filter(f => f.endsWith('.md') && !f.startsWith('_')).map(f => {
    const raw = fs.readFileSync(path.join(SRC, f), 'utf8');
    const { meta, body } = L.parseFrontmatter(raw, f);
    return { slug: f.replace(/\.md$/, ''), meta, body, lesson: meta.kind === 'lesson' };
  }).sort((a, b) => Number(a.meta.order || 99) - Number(b.meta.order || 99));
}

function sections(body) {
  return body.split(/^## /m).slice(1).map(p => { const nl = p.indexOf('\n'); return { title: p.slice(0, nl).trim(), text: p.slice(nl + 1).trim() }; });
}

const footer = `      <p class="small">Settings are my starting points, to tune by ear; what each control does is checked against the manuals linked on each page.</p>
      <p class="small"><a href="./">All recipes</a> · <a href="../course/">Courses</a> · <a href="../">pachulski.dev</a></p>`;

function renderRecipe(r, everything) {
  if (r.lesson) return renderLesson(r, everything);
  const all = everything.filter(x => !x.lesson);
  const i = all.indexOf(r);
  const next = all[i + 1], prev = all[i - 1];
  const html = sections(r.body).map(s => section(s.title, s.text)).join('\n');
  return L.page({
    title: `${r.meta.title}: a recipe for OXI One, PERfourMER, Grand Canyon and NightSky – Mateusz Pachulski`,
    description: r.meta.summary,
    canonical: `${L.SITE}/music/${r.slug}`,
    base: '../', current: 'music', feed: false, footer, script: 'music.js',
    body: `    <article class="music recipe course-top wrap" data-recipe="${r.slug}">
      ${DEFS}
      <p class="eyebrow"><a href="./">← The tape shelf</a></p>
      <div class="recipe-grid">
      <aside class="margin" aria-label="At a glance">
        ${soundSketch(r.meta.sound, r.slug)}
        ${chain()}
        <p class="margin-note">Tap a row below to tick it off as you set it.</p>
      </aside>
      <div class="recipe-main">
      <header class="jcard">
        <p class="side">Side A · Recipe ${String(i + 1).padStart(2, '0')}</p>
        <h1>${L.esc(r.meta.title)}</h1>
        <p class="mood">${L.esc(r.meta.mood || '')}</p>
        <p class="lede">${L.esc(r.meta.summary)}</p>
        <dl class="jfields">${[['Level', r.meta.level], ['Setup', r.meta.time], ['Key', r.meta.key]].filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${L.esc(v)}</dd></div>`).join('')}</dl>
      </header>
      <div class="tools" hidden><button type="button" class="button" data-compact>Hide the whys</button> <button type="button" class="button" data-untick>Clear my ticks</button> <span class="tick-count small" aria-live="polite"></span></div>
      <nav class="recipe-toc" aria-label="On this page"><ol>${sections(r.body).map(s => `<li><a href="#${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}">${L.esc(s.title)}</a></li>`).join('')}</ol></nav>
${html}
      </div>
      </div>
      <nav class="pager" aria-label="More recipes">${prev ? `<a class="button" href="${prev.slug}.html">← ${L.esc(prev.meta.title)}</a>` : ''}${next ? `<a class="button primary" href="${next.slug}.html">${L.esc(next.meta.title)} →</a>` : `<a class="button" href="./">All recipes</a>`}</nav>
    </article>`,
  });
}

// A lesson: the same sketchbook page, but it teaches one idea step by step instead of building one sound.
const MAP = [['LEV', 'how many overtones'], ['RATIO', 'which overtones'], ['A envelope', 'overtones over time'], ['FDBK', 'grit']];
function renderLesson(r, everything) {
  const lessons = everything.filter(x => x.lesson);
  const i = lessons.indexOf(r);
  const html = sections(r.body).map(s => section(s.title, s.text)).join('\n');
  const first = everything.find(x => !x.lesson);
  return L.page({
    title: `${r.meta.title}: an FM synthesis lesson for the Elektron Digitone II – Mateusz Pachulski`,
    description: r.meta.summary,
    canonical: `${L.SITE}/music/${r.slug}`,
    base: '../', current: 'music', feed: false, footer, script: ['fm-core.js', 'music.js'],
    body: `    <article class="music recipe lesson course-top wrap" data-recipe="${r.slug}">
      ${DEFS}
      <p class="eyebrow"><a href="./">← The tape shelf</a></p>
      <div class="recipe-grid">
      <aside class="margin" aria-label="At a glance">
        ${soundSketch(r.meta.sound, r.slug)}
        <dl class="fm-map">${MAP.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
        <p class="margin-note">Each “Play it here” box makes sound in your browser. Tap a setting row to tick it off.</p>
      </aside>
      <div class="recipe-main">
      <header class="jcard">
        <p class="side">Side B · Lesson ${String(i + 1).padStart(2, '0')}</p>
        <h1>${L.esc(r.meta.title)}</h1>
        <p class="mood">${L.esc(r.meta.mood || '')}</p>
        <p class="lede">${L.esc(r.meta.summary)}</p>
        <dl class="jfields">${[['Level', r.meta.level], ['Time', r.meta.time], ['On', r.meta.device]].filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${L.esc(v)}</dd></div>`).join('')}</dl>
      </header>
      <div class="tools" hidden><button type="button" class="button" data-compact>Hide the whys</button> <button type="button" class="button" data-untick>Clear my ticks</button> <span class="tick-count small" aria-live="polite"></span></div>
      <nav class="recipe-toc" aria-label="On this page"><ol>${sections(r.body).map(s => `<li><a href="#${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}">${L.esc(s.title)}</a></li>`).join('')}</ol></nav>
${html}
      </div>
      </div>
      <nav class="pager" aria-label="More">${first ? `<a class="button primary" href="${first.slug}.html">Now play a recipe: ${L.esc(first.meta.title)} →</a>` : ''}<a class="button" href="./">All recipes</a></nav>
    </article>`,
  });
}

function renderIndex(everything) {
  const all = everything.filter(x => !x.lesson), lessons = everything.filter(x => x.lesson);
  const intro = fs.existsSync(path.join(SRC, '_index.md')) ? L.parseFrontmatter(fs.readFileSync(path.join(SRC, '_index.md'), 'utf8'), '_index.md') : { meta: {}, body: '' };
  // The setup sections fold away: they're reference, read once.
  const html = sections(intro.body).map(s => section(s.title, s.text).replace(/<section id="([^"]+)"[^>]*><h2>([\s\S]*?)<\/h2>/, '<details class="setup" id="$1"><summary>$2</summary>').replace(/<\/section>$/, '</details>')).join('\n');
  const cards = all.map((r, i) => `<li class="cassette c-${i % 6}"><a href="${r.slug}.html">${cassetteSketch(r.slug)}<span class="c-side">A${i + 1}</span><span class="c-title">${L.esc(r.meta.title)}</span><span class="c-mood">${L.esc(r.meta.mood || '')}</span><span class="c-foot">${L.esc(r.meta.level || '')} · ${L.esc(r.meta.time || '')}</span></a><p class="c-note">${L.esc(r.meta.summary)}</p></li>`).join('\n');
  return L.page({
    title: 'Music: sound recipes for OXI One, PERfourMER, Grand Canyon and NightSky – Mateusz Pachulski',
    description: intro.meta.summary || 'Sound recipes with exact settings.',
    canonical: `${L.SITE}/music/`,
    base: '../', current: 'music', feed: false, footer, script: 'music.js',
    body: `    <article class="music music-index course-top wrap">
      ${DEFS}
      <div class="music-hero">
        <div>
          <p class="eyebrow">Music, my hobby</p>
          <h1 class="marker">${L.esc(intro.meta.title || 'Music')}</h1>
          <p class="lede">${L.esc(intro.meta.summary || '')}</p>
          <p class="hero-links"><a class="button primary" href="#side-a">Pick a recipe ↓</a> <a class="button" href="#setup">Set up the rig</a> ${lessons.length ? `<a class="button" href="${lessons[0].slug}.html">Learn FM on the Digitone</a>` : ''}</p>
        </div>
        ${rigSketch()}
      </div>
      <h2 id="side-a">Side A: recipes for the rig</h2>
      <ul class="shelf">
${cards}
      </ul>
      ${lessons.length ? `<h2 id="side-b">Side B: lessons</h2>
      <ul class="shelf lessons">
${lessons.map((r, i) => `<li class="cassette lesson-tape c-${(i + 3) % 6}"><a href="${r.slug}.html">${cassetteSketch(r.slug)}<span class="c-side">B${i + 1}</span><span class="c-title">${L.esc(r.meta.shelf || r.meta.title)}</span><span class="c-mood">${L.esc(r.meta.mood || '')}</span><span class="c-foot">${L.esc(r.meta.device || '')} · ${L.esc(r.meta.time || '')}</span></a><p class="c-note">${L.esc(r.meta.summary)}</p></li>`).join('\n')}
      </ul>` : ''}
      <h2 id="setup">Before your first recipe</h2>
      <p>Wire the rig once and learn how to read a recipe. Open each part when you need it.</p>
      <details class="rig-drawn setup"><summary>The four devices, drawn from their real panels</summary>
        <div class="rig-grid">${['pf', 'gc', 'ns', 'oxi'].map(id => DEV.render(id, { caption: { pf: 'Vermona PERfourMER MKII: four synth channels, one strip each.', gc: 'Electro-Harmonix Grand Canyon: delay and looper.', ns: 'Strymon NightSky: reverb.', oxi: 'OXI One MKII: the sequencer.' }[id], seed: 'index' })).join('')}</div>
      </details>
${html}
    </article>`,
  });
}

function musicUrls() {
  return load().length ? [`${L.SITE}/music/`, ...load().map(r => `${L.SITE}/music/${r.slug}`)] : [];
}

function build() {
  const all = load();
  const out = new Map();
  if (!all.length) return out;
  for (const r of all) out.set(path.join(OUT, `${r.slug}.html`), renderRecipe(r, all));
  out.set(path.join(OUT, 'index.html'), renderIndex(all));
  return out;
}

function main() {
  const check = process.argv.includes('--check');
  const out = build();
  const existing = fs.existsSync(OUT) ? fs.readdirSync(OUT).filter(f => f.endsWith('.html')).map(f => path.join(OUT, f)) : [];
  const stale = existing.filter(f => !out.has(f));
  const changed = [...out].filter(([f, h]) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== h).map(([f]) => f);
  if (check) {
    if (changed.length || stale.length) {
      console.error('music/ is out of date. Run: npm run build:music');
      [...changed, ...stale].forEach(f => console.error(`  ${path.relative(L.ROOT, f)}`));
      process.exit(1);
    }
    console.log(`music/ is up to date (${out.size} pages).`);
    return;
  }
  fs.mkdirSync(OUT, { recursive: true });
  for (const [f, h] of out) fs.writeFileSync(f, h);
  for (const f of stale) fs.unlinkSync(f);
  console.log(`Built ${out.size} music pages.`);
}

module.exports = { build, musicUrls, knobFraction };
if (require.main === module) main();

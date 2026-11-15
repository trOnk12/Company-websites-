'use strict';

// The course's picture world, drawn the same way in every diagram.
// A diagram writes <x-house x="20" y="120" w="240" h="160" label="Notes"/> and the build expands it to SVG,
// so the town hall always has columns, Binder is always the post office, the kernel is always the ground.
//
//   <x-ground y label sub>                 the kernel: the ground every house stands on
//   <x-house x y w h label door>           an app's process (roof + walls)
//   <x-townhall x y w h label>             system_server: pediment, name band, columns, steps
//   <x-postoffice x y w h label>           Binder: flat roof, letter slot, flag (sits in the ground)
//   <x-person x y label tone desk>         a thread; desk="1" makes it the clerk (main thread)
//   <x-letter x y w h label tone>          a message
//   <x-chip x y w h label>                 a CPU
//   <x-sheet x y w h lines label>          a list / register / notebook
//   <x-arrow d tone>                       a path with an arrowhead (tone: ink, acc, red, path)
//   <x-moon x y>  <x-sun x y>
//
// Any class / data-* / id attribute is kept on the wrapping <g> (so step classes, data-move and data-pulse work).

const n = (a, k, d) => (a[k] === undefined || a[k] === '' ? d : Number(a[k]));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const txt = (cls, x, y, s, anchor) => (s ? `<text class="${cls}" x="${x}" y="${y}"${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(s)}</text>` : '');

const SHAPES = {
  ground(a) {
    const y = n(a, 'y', 300);
    const pebbles = [[210, 0.55], [250, 0.85], [300, 0.45], [380, 0.75], [470, 0.5], [560, 0.7], [610, 0.35]]
      .map(([x, f]) => `<ellipse class="d-pebble" cx="${x}" cy="${Math.round(y + f * (380 - y))}" rx="7" ry="4"/>`).join('');
    return `<rect class="d-soil" x="0" y="${y}" width="640" height="${380 - y}"/>${pebbles}<line class="d-grass" x1="0" y1="${y}" x2="640" y2="${y}"/>` +
      txt('d-b', 16, y + 30, a.label) + txt('d-m', 16, y + 54, a.sub);
  },
  house(a) {
    const x = n(a, 'x', 0), y = n(a, 'y', 0), w = n(a, 'w', 220), h = n(a, 'h', 140);
    const r = n(a, 'roof', Math.min(44, Math.round(w * 0.22)));
    const door = a.door === '1' ? `<rect class="d-wood" x="${x + w - 46}" y="${y + h - 50}" width="30" height="50" rx="3"/><circle class="d-ink" cx="${x + w - 22}" cy="${y + h - 24}" r="3"/>` : '';
    return `<polygon class="d-roof" points="${x - 10},${y} ${x + w / 2},${y - r} ${x + w + 10},${y}"/><rect class="d-paper" x="${x}" y="${y}" width="${w}" height="${h}"/>${door}` +
      txt('d-b', x + 14, y + 30, a.label);
  },
  townhall(a) {
    const x = n(a, 'x', 0), y = n(a, 'y', 0), w = n(a, 'w', 220), h = n(a, 'h', 140);
    const cols = [14, 34, w - 46, w - 26].map(c => `<rect class="d-col" x="${x + c}" y="${y + 30}" width="12" height="${h - 44}"/>`).join('');
    return `<polygon class="d-stone" points="${x - 8},${y} ${x + w / 2},${y - 36} ${x + w + 8},${y}"/>` +
      `<rect class="d-paper" x="${x + 6}" y="${y + 30}" width="${w - 12}" height="${h - 44}"/>${cols}` +
      `<rect class="d-stone" x="${x}" y="${y}" width="${w}" height="30"/>` +
      `<rect class="d-stone" x="${x - 6}" y="${y + h - 14}" width="${w + 12}" height="7"/><rect class="d-stone" x="${x - 12}" y="${y + h - 7}" width="${w + 24}" height="7"/>` +
      txt('d-hall', x + w / 2, y + 22, a.label === undefined ? 'system_server' : a.label, 'middle');
  },
  postoffice(a) {
    const x = n(a, 'x', 0), y = n(a, 'y', 0), w = n(a, 'w', 150), h = n(a, 'h', 76);
    const flag = a.flag === '0' ? '' : `<line class="d-line" x1="${x + w - 14}" y1="${y - 14}" x2="${x + w - 14}" y2="${y - 44}"/><polygon class="d-flag" points="${x + w - 14},${y - 44} ${x + w + 12},${y - 37} ${x + w - 14},${y - 30}"/>`;
    return flag +
      `<rect class="d-paper" x="${x}" y="${y}" width="${w}" height="${h}"/><rect class="d-po" x="${x - 8}" y="${y - 14}" width="${w + 16}" height="16" rx="3"/>` +
      `<rect class="d-ink" x="${x + w / 2 - 26}" y="${y + 14}" width="52" height="8" rx="3"/>` +
      txt('d-sign', x + w / 2, y - 1, a.label === undefined ? 'Binder' : a.label, 'middle');
  },
  person(a) {
    const x = n(a, 'x', 0), y = n(a, 'y', 0);
    const body = { hl: 'd-hl', bad: 'd-bad' }[a.tone] || 'd-roof';
    const desk = a.desk === '1' ? `<rect class="d-wood" x="${x - 56}" y="${y + 50}" width="150" height="12" rx="3"/>` : '';
    return `<circle class="d-skin" cx="${x}" cy="${y}" r="15"/><rect class="${body}" x="${x - 22}" y="${y + 17}" width="44" height="32" rx="12"/>${desk}` +
      txt('d-tiny', x, y + (a.desk === '1' ? 84 : 70), a.label, 'middle');
  },
  letter(a) {
    const x = n(a, 'x', 0), y = n(a, 'y', 0), w = n(a, 'w', 74), h = n(a, 'h', 44);
    const fill = { hl: 'd-hl', bad: 'd-bad' }[a.tone] || 'd-paper';
    const cls = a.tone === 'bad' ? 'd-rt' : 'd-tiny';
    return `<rect class="${fill}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/><polyline class="d-line" points="${x},${y} ${x + w / 2},${y + h / 2 - 4} ${x + w},${y}"/>` +
      txt(cls, x + w / 2, y + h - 6, a.label, 'middle');
  },
  chip(a) {
    const x = n(a, 'x', 0), y = n(a, 'y', 0), w = n(a, 'w', 64), h = n(a, 'h', 44);
    const pins = [0.25, 0.5, 0.75].map(f => `<line class="d-line" x1="${x + f * w}" y1="${y - 6}" x2="${x + f * w}" y2="${y + h + 6}"/>`).join('');
    return `${pins}<rect class="d-ink" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>` + txt('d-inv', x + w / 2, y + h / 2 + 5, a.label, 'middle');
  },
  sheet(a) {
    const x = n(a, 'x', 0), y = n(a, 'y', 0), w = n(a, 'w', 54), h = n(a, 'h', 64), k = n(a, 'lines', 3);
    const lines = Array.from({ length: k }, (_, i) => `<line class="d-line" x1="${x + 8}" y1="${y + 14 + i * 13}" x2="${x + w - (i % 2 ? 16 : 8)}" y2="${y + 14 + i * 13}"/>`).join('');
    return `<rect class="d-paper" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>${lines}` + txt('d-tiny', x + w / 2, y + h + 18, a.label, 'middle');
  },
  machine(a) {
    const x = n(a, 'x', 0), y = n(a, 'y', 0), w = n(a, 'w', 70), h = n(a, 'h', 54);
    const cx = x + 18, cy = y + h / 2;
    const teeth = Array.from({ length: 8 }, (_, i) => { const t = i * Math.PI / 4; return `<line class="d-line" x1="${(cx + 7 * Math.cos(t)).toFixed(1)}" y1="${(cy + 7 * Math.sin(t)).toFixed(1)}" x2="${(cx + 12 * Math.cos(t)).toFixed(1)}" y2="${(cy + 12 * Math.sin(t)).toFixed(1)}"/>`; }).join('');
    return `<rect class="d-wood" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>${teeth}<circle class="d-paper" cx="${cx}" cy="${cy}" r="8"/>` + txt('d-tiny', x + 34 + (w - 34) / 2, cy + 5, a.label, 'middle');
  },
  moon(a) {
    const x = n(a, 'x', 0), y = n(a, 'y', 0);
    return `<path class="d-moon" d="M${x},${y - 26} a26,26 0 1,0 0,52 a20,20 0 1,1 0,-52 Z"/>`;
  },
  sun(a) {
    const x = n(a, 'x', 0), y = n(a, 'y', 0);
    const rays = Array.from({ length: 8 }, (_, i) => { const t = i * Math.PI / 4; return `<line class="d-ray" x1="${(x + 26 * Math.cos(t)).toFixed(1)}" y1="${(y + 26 * Math.sin(t)).toFixed(1)}" x2="${(x + 36 * Math.cos(t)).toFixed(1)}" y2="${(y + 36 * Math.sin(t)).toFixed(1)}"/>`; }).join('');
    return `${rays}<circle class="d-sun" cx="${x}" cy="${y}" r="20"/>`;
  },
};

const TONES = ['ink', 'acc', 'red', 'path'];

function attrs(s) {
  const a = {};
  for (const m of s.matchAll(/([\w-]+)="([^"]*)"/g)) a[m[1]] = m[2];
  return a;
}
const keep = a => Object.entries(a).filter(([k]) => k === 'class' || k === 'id' || k.startsWith('data-')).map(([k, v]) => ` ${k}="${v}"`).join('');

// Expand <x-*> shapes inside one diagram's source. `name` keeps marker ids unique per page.
function expand(src, name = 'd') {
  let arrows = false;
  let out = src.replace(/<x-([a-z]+)\b([^>]*?)\/>/g, (m, shape, rest) => {
    const a = attrs(rest);
    if (shape === 'arrow') {
      arrows = true;
      const tone = TONES.includes(a.tone) ? a.tone : 'ink';
      return `<path class="${a.class ? a.class + ' ' : ''}d-arr-${tone}" d="${a.d}" marker-end="url(#ah-${name}-${tone})"${keep(Object.fromEntries(Object.entries(a).filter(([k]) => k !== 'class')))}/>`;
    }
    if (!SHAPES[shape]) throw new Error(`unknown shape <x-${shape}> in diagram ${name}`);
    return `<g${keep(a)}>${SHAPES[shape](a)}</g>`;
  });
  if (arrows) {
    const defs = '<defs>' + TONES.map(t => `<marker id="ah-${name}-${t}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path class="d-ah-${t}" d="M0,0 L10,5 L0,10 Z"/></marker>`).join('') + '</defs>';
    out = out.replace(/(<svg\b[^>]*>(?:\s*<title[^>]*>[\s\S]*?<\/title>)?)/, `$1${defs}`);
  }
  return out;
}

module.exports = { expand, SHAPES };

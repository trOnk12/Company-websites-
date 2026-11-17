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

// A knob as a printed patch-sheet template (ring + scale ticks), with the setting drawn on it by hand.
function knobSvg(f, label) {
  const P = (deg, r) => [(24 + r * Math.sin(deg * Math.PI / 180)).toFixed(1), (24 - r * Math.cos(deg * Math.PI / 180)).toFixed(1)];
  const ticks = Array.from({ length: 11 }, (_, k) => { const d = -150 + 30 * k; const [a, b] = P(d, 19), [c, e] = P(d, k % 5 === 0 ? 23 : 21.5); return `M${a},${b}L${c},${e}`; }).join('');
  const d = -150 + 300 * f;
  const [x1, y1] = P(d, 2), [x2, y2] = P(d, 15);
  return `<svg class="knob" viewBox="0 0 48 48" role="img" aria-label="${L.esc(label)}"><path class="k-ticks" d="${ticks}"/><circle class="k-ring" cx="24" cy="24" r="15"/><g class="k-hand"><line class="k-ptr" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><circle class="k-dot" cx="${x2}" cy="${y2}" r="2.2"/></g></svg>`;
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

function settings(block) {
  const ctx = { file: 'music', cards: new Map(), links: new Set() };
  const rows = block.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const parts = line.split('::').map(s => s.trim());
    const [control, value] = parts;
    const stepped = /^step \d+\/\d+$/.test(value);
    const extra = stepped ? parts[2] : '';
    const why = stepped ? parts[3] : parts[2];
    return `<li class="setting" tabindex="0"><span class="control">${L.esc(control)}</span><span class="value">${valueHtml(control, value, extra)}</span>${why ? `<span class="why">${L.inline(why, ctx)}</span>` : ''}</li>`;
  });
  return `<ul class="settings">${rows.join('')}</ul>`;
}

// One section: Markdown, with any ```settings fences drawn as cards.
function section(title, text) {
  const ctx = { file: 'music', cards: new Map(), links: new Set() };
  const parts = text.split(/```settings\n([\s\S]*?)```/);
  let html = '';
  parts.forEach((part, i) => {
    if (i % 2) html += settings(part);
    else if (part.trim()) html += L.renderBlocks(L.parseBody(`## x\n\n${part.trim()}\n`, ctx)[0].blocks, ctx);
  });
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const dev = /perfourmer/i.test(title) ? 'dev-pf' : /grand canyon/i.test(title) ? 'dev-gc' : /nightsky/i.test(title) ? 'dev-ns' : /oxi/i.test(title) ? 'dev-oxi' : '';
  return `      <section id="${id}"${dev ? ` class="device ${dev}"` : ''}><h2>${L.inline(title, ctx)}</h2>\n${html}</section>`;
}

// A pencil wobble for anything "drawn by hand", defined once per page.
const DEFS = '<svg class="defs" width="0" height="0" aria-hidden="true" focusable="false"><filter id="pencil"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.8"/></filter></svg>';

// The signal chain, drawn as four boxes and a cable: the same on every page.
const CHAIN = [['dev-oxi', 'OXI One MK2', 'sequencer'], ['dev-pf', 'PERfourMER MKII', 'synth'], ['dev-gc', 'Grand Canyon', 'delay'], ['dev-ns', 'NightSky', 'reverb']];
const chain = () => `<ol class="chain" aria-label="Signal chain">${CHAIN.map(([c, n, k]) => `<li class="${c}"><b>${n}</b><span>${k}</span></li>`).join('')}</ol>`;

function load() {
  if (!fs.existsSync(SRC)) return [];
  return fs.readdirSync(SRC).filter(f => f.endsWith('.md') && !f.startsWith('_')).map(f => {
    const raw = fs.readFileSync(path.join(SRC, f), 'utf8');
    const { meta, body } = L.parseFrontmatter(raw, f);
    return { slug: f.replace(/\.md$/, ''), meta, body };
  }).sort((a, b) => Number(a.meta.order || 99) - Number(b.meta.order || 99));
}

function sections(body) {
  return body.split(/^## /m).slice(1).map(p => { const nl = p.indexOf('\n'); return { title: p.slice(0, nl).trim(), text: p.slice(nl + 1).trim() }; });
}

const footer = `      <p class="small">Settings are my starting points, to tune by ear; what each control does is checked against the manuals linked on each page.</p>
      <p class="small"><a href="./">All recipes</a> · <a href="../course/">Courses</a> · <a href="../">pachulski.dev</a></p>`;

function renderRecipe(r, all) {
  const i = all.indexOf(r);
  const next = all[i + 1], prev = all[i - 1];
  const html = sections(r.body).map(s => section(s.title, s.text)).join('\n');
  return L.page({
    title: `${r.meta.title}: a recipe for OXI One, PERfourMER, Grand Canyon and NightSky – Mateusz Pachulski`,
    description: r.meta.summary,
    canonical: `${L.SITE}/music/${r.slug}`,
    base: '../', current: 'music', feed: false, footer, script: 'music.js',
    body: `    <article class="music recipe course-top wrap narrow" data-recipe="${r.slug}">
      ${DEFS}
      <p class="eyebrow"><a href="./">← The tape shelf</a></p>
      <header class="jcard">
        <p class="side">Side A · Recipe ${String(i + 1).padStart(2, '0')}</p>
        <h1>${L.esc(r.meta.title)}</h1>
        <p class="mood">${L.esc(r.meta.mood || '')}</p>
        <p class="lede">${L.esc(r.meta.summary)}</p>
        <dl class="jfields">${[['Level', r.meta.level], ['Setup', r.meta.time], ['Key', r.meta.key]].filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${L.esc(v)}</dd></div>`).join('')}</dl>
      </header>
      ${chain()}
      <div class="tools" hidden><button type="button" class="button" data-compact>Hide the whys</button> <button type="button" class="button" data-untick>Clear my ticks</button> <span class="tick-count small" aria-live="polite"></span></div>
      <nav class="recipe-toc" aria-label="On this page"><ol>${sections(r.body).map(s => `<li><a href="#${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}">${L.esc(s.title)}</a></li>`).join('')}</ol></nav>
${html}
      <nav class="pager" aria-label="More recipes">${prev ? `<a class="button" href="${prev.slug}.html">← ${L.esc(prev.meta.title)}</a>` : ''}${next ? `<a class="button primary" href="${next.slug}.html">${L.esc(next.meta.title)} →</a>` : `<a class="button" href="./">All recipes</a>`}</nav>
    </article>`,
  });
}

function renderIndex(all) {
  const intro = fs.existsSync(path.join(SRC, '_index.md')) ? L.parseFrontmatter(fs.readFileSync(path.join(SRC, '_index.md'), 'utf8'), '_index.md') : { meta: {}, body: '' };
  const html = sections(intro.body).map(s => section(s.title, s.text)).join('\n');
  const cards = all.map((r, i) => `<li class="cassette c-${i % 6}"><a href="${r.slug}.html"><span class="c-label"><span class="c-side">A${i + 1}</span><span class="c-title">${L.esc(r.meta.title)}</span><span class="c-mood">${L.esc(r.meta.mood || '')}</span></span><span class="c-window" aria-hidden="true"><span class="reel"></span><span class="c-tape"></span><span class="reel"></span></span><span class="c-foot" aria-hidden="true">${L.esc(r.meta.level || '')} · ${L.esc(r.meta.time || '')}</span></a><p class="c-note">${L.esc(r.meta.summary)}</p></li>`).join('\n');
  return L.page({
    title: 'Music: sound recipes for OXI One, PERfourMER, Grand Canyon and NightSky – Mateusz Pachulski',
    description: intro.meta.summary || 'Sound recipes with exact settings.',
    canonical: `${L.SITE}/music/`,
    base: '../', current: 'music', feed: false, footer,
    body: `    <article class="music course-top wrap narrow">
      ${DEFS}
      <p class="eyebrow">Music, my hobby</p>
      <h1 class="marker">${L.esc(intro.meta.title || 'Music')}</h1>
      <p class="lede">${L.esc(intro.meta.summary || '')}</p>
      ${chain()}
      <h2>The tape shelf</h2>
      <ul class="shelf">
${cards}
      </ul>
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

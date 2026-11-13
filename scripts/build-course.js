#!/usr/bin/env node
'use strict';

// Builds the course from _course/<course>/ into course/.
//
//   _course/android/course.json      title, intro, modules (puzzle file names), upcoming modules
//   _course/android/NN-slug.md        one puzzle: frontmatter + ## sections (same Markdown as the learning cards)
//   _course/android/diagrams/X.html   a step-through diagram: one <svg> plus <ol class="caps"> with one <li> per step
//
// In a puzzle, a fenced block ```diagram X``` inserts diagram X. SVG parts with class "step sN" appear from
// step N on; "step only-N" shows only at step N. Steps are hidden radio buttons, so it works without JavaScript.
//
//   node scripts/build-course.js           write the pages
//   node scripts/build-course.js --check   exit 1 if the pages are out of date (used by the tests)

const fs = require('fs');
const path = require('path');
const L = require('./build-learning');

const SRC = path.join(L.ROOT, '_course');
const OUT = path.join(L.ROOT, 'course');
const REQUIRED = ['The problem', 'Check yourself', 'Sources'];

function fail(file, msg) { console.error(`${path.relative(L.ROOT, file)}: ${msg}`); process.exitCode = 1; }

function loadCourse(id) {
  const dir = path.join(SRC, id);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'course.json'), 'utf8'));
  const files = meta.modules.flatMap(m => m.puzzles);
  const puzzles = files.map((f, i) => {
    const file = path.join(dir, f);
    const raw = fs.readFileSync(file, 'utf8');
    const { meta: fm, body } = L.parseFrontmatter(raw, f);
    return { id, n: i, slug: f.replace(/\.md$/, ''), file, raw, meta: fm, body };
  });
  return { id, dir, meta, puzzles };
}

function courses() {
  if (!fs.existsSync(SRC)) return [];
  return fs.readdirSync(SRC).filter(d => fs.existsSync(path.join(SRC, d, 'course.json'))).sort().map(loadCourse);
}

function courseUrls() {
  return courses().flatMap(c => [`${L.SITE}/course/`, ...c.puzzles.map(p => `${L.SITE}/course/${c.id}/${p.slug}`)])
    .filter((u, i, a) => a.indexOf(u) === i);
}

// Inline code that names a real source location ("Looper.loop()") becomes a popover with the
// excerpt and a link pinned to a commit. Works on hover, keyboard focus and tap, without JavaScript.
function linkRefs(course, html) {
  const f = path.join(course.dir, 'refs.json');
  if (!fs.existsSync(f)) return html;
  const { refs } = JSON.parse(fs.readFileSync(f, 'utf8'));
  let n = 0;
  return html.replace(/(<pre>)?<code>([^<]+)<\/code>/g, (m, pre, text) => {
    const r = refs[text.replace(/&amp;/g, '&')];
    if (pre || !r) return m;
    const id = `ref-${++n}`;
    return `<span class="ref" tabindex="0" aria-describedby="${id}"><code>${text}</code><span class="pop" role="tooltip" id="${id}"><span class="pop-what">${L.esc(r.what)}</span><span class="pop-code">${L.esc(r.code)}</span><a href="${r.url}">${L.esc(r.where)} · ${L.esc(r.repo)} ↗</a></span></span>`;
  });
}

function gifSize(id, name) {
  const b = fs.readFileSync(path.join(OUT, id, 'gifs', `${name}.gif`));
  return [b.readUInt16LE(6), b.readUInt16LE(8)];
}

function gifLink(course, name) {
  return fs.existsSync(path.join(OUT, course.id, 'gifs', `${name}.gif`))
    ? `<p class="gif-link"><a href="gifs/${name}.gif" download>Save this diagram as a GIF</a></p>` : '';
}

function diagram(course, name, file) {
  const f = path.join(course.dir, 'diagrams', `${name}.html`);
  if (!fs.existsSync(f)) { fail(file, `unknown diagram ${name}`); return ''; }
  const src = fs.readFileSync(f, 'utf8');
  const svg = src.match(/<svg[\s\S]*<\/svg>/);
  const caps = [...src.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1].trim());
  const label = (src.match(/<!--\s*label:\s*(.*?)\s*-->/) || [])[1] || name;
  if (!svg || !caps.length || caps.length > 8) { fail(f, 'needs one <svg> and 1–8 <li> captions'); return ''; }
  const id = `st-${name}`;
  const n = caps.length;
  const radios = caps.map((_, i) => `<input type="radio" name="${id}" id="${id}-${i + 1}"${i === 0 ? ' checked' : ''} aria-label="Step ${i + 1} of ${n}">`).join('');
  const items = caps.map((c, i) => `<li>${c}<div class="stepnav">${i > 0 ? `<label for="${id}-${i}">← Back</label>` : '<span class="spacer"></span>'}<span class="count">Step ${i + 1} of ${n}</span>${i < n - 1 ? `<label class="next" for="${id}-${i + 2}">Next →</label>` : `<label for="${id}-1">↺ Again</label>`}</div></li>`).join('\n');
  const dots = caps.map((_, i) => `<label for="${id}-${i + 1}" title="Step ${i + 1}"></label>`).join('');
  return `<figure class="stepper" aria-label="${L.esc(label)}">${radios}
<div class="stage">${svg[0]}</div>
<ol class="caps">
${items}
</ol>
<div class="dots" aria-hidden="true">${dots}</div>
</figure>`;
}

// "Question::*Right||Wrong||Wrong::Why" → a quiz that grades itself with CSS (and JS, when present).
function quiz(p, items, ctx) {
  return items.map((it, qi) => {
    const parts = it.split('::');
    const opts = (parts[1] || '').split('||').map(o => o.trim());
    if (parts.length !== 3 || opts.length < 2 || opts.filter(o => o.startsWith('*')).length !== 1) {
      fail(p.file, `question needs "Question::*Right||Wrong::Why": ${it}`); return '';
    }
    // Stable shuffle, so the right answer isn't always first but the page doesn't change between builds.
    let h = 0; for (const ch of parts[0]) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const order = opts.map((o, i) => ({ o, k: (h + i * 2654435761) >>> 0 })).sort((a, b) => a.k - b.k).map(x => x.o);
    const name = `q-${p.slug}-${qi + 1}`;
    const inputs = order.map((o, i) => {
      const ok = o.startsWith('*');
      return `<input type="radio" name="${name}" id="${name}-${i + 1}"${ok ? ' data-ok' : ''}><label for="${name}-${i + 1}">${L.inline(ok ? o.slice(1).trim() : o, ctx)}</label>`;
    }).join('\n');
    return `<fieldset class="quiz">
<legend>${L.inline(parts[0].trim(), ctx)}</legend>
${inputs}
<p class="fb ok"><b>Right.</b> ${L.inline(parts[2].trim(), ctx)}</p>
<p class="fb no"><b>Not quite.</b> Step back through the diagram above, then try again.</p>
</fieldset>`;
  }).join('\n');
}

// Support link: shown only once course.json has a real support.url.
function support(course, where) {
  const sp = course.meta.support || {};
  if (!sp.url) return '';
  return `<p class="support support-${where}">${L.esc(sp.line)} <a class="button" href="${sp.url}" rel="noopener">☕ ${L.esc(sp.label)}</a></p>`;
}

function renderPuzzle(course, p, terms) {
  const ctx = { file: p.file, cards: new Map(course.puzzles.map(q => [q.slug, q])), links: new Set() };
  const sections = L.parseBody(p.body, ctx);
  const titles = sections.map(s => s.title);
  for (const r of REQUIRED) if (!titles.includes(r)) fail(p.file, `missing section "## ${r}"`);
  for (const k of ['title', 'summary', 'takeaway']) if (!p.meta[k]) fail(p.file, `frontmatter needs ${k}`);
  for (const m of p.raw.matchAll(L.TICKET_KEY)) if (!L.NOT_TICKETS.has(m[0].split('-')[0])) fail(p.file, `looks like a ticket key: ${m[0]}`);
  for (const t of terms) if (p.raw.toLowerCase().includes(t.toLowerCase())) fail(p.file, `contains a private term: ${t}`);

  const body = sections.map(s => {
    const sid = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const html = s.title === 'Check yourself'
      ? s.blocks.map(b => b.type === 'ul' ? quiz(p, b.items, ctx) : L.renderBlocks([b], ctx)).join('\n')
      : s.blocks.map(b => b.type === 'code' && b.lang.startsWith('diagram')
      ? diagram(course, b.text.trim() || b.lang.split(/\s+/)[1], p.file) + gifLink(course, b.text.trim() || b.lang.split(/\s+/)[1])
      : L.renderBlocks([b], ctx, { recall: s.title === 'Check yourself' })).join('\n');
    return `      <section aria-labelledby="${sid}">
        <h2 id="${sid}">${L.inline(s.title, ctx)}</h2>
${html}
      </section>`;
  }).join('\n');

  const all = course.puzzles;
  const linked = linkRefs(course, body);
  const prev = all[p.n - 1], next = all[p.n + 1];
  const progress = all.map(q => `<li><a href="${q.slug}.html"${q === p ? ' aria-current="page"' : q.n < p.n ? ' class="done"' : ''} title="${L.esc(q.meta.title)}">${q.n}</a></li>`).join('');
  const label = p.n === 0 ? 'Start here' : `Puzzle ${p.n} of ${all.length - 1}`;
  return L.page({
    title: `${p.meta.title} – ${course.meta.title} – Mateusz Pachulski`,
    description: p.meta.summary,
    canonical: `${L.SITE}/course/${course.id}/${p.slug}`,
    base: '../../', current: 'course', feed: false, script: '../course.js',
    footer: `      <p class="small">Written with AI from my own learning sessions, and checked against the sources on each page.</p>
      <p class="small"><a href="../">Course overview</a> · <a href="../../learning/">Learning log</a> · <a href="../../">pachulski.dev</a></p>`,
    body: `    <article class="puzzle course-top wrap narrow" data-support="${L.esc((course.meta.support || {}).url || '')}" data-course="${course.id}" data-n="${p.n}" data-prev="${prev ? `${prev.slug}.html` : ''}" data-prev-title="${prev ? L.esc(prev.meta.title) : ''}">
      <nav aria-label="Puzzles"><ol class="progress">${progress}</ol></nav>
      <p class="eyebrow">${L.esc(course.meta.title)} · ${label}</p>
      <h1>${L.esc(p.meta.title)}</h1>
      <p class="lede">${L.inline(p.meta.summary, ctx)}</p>
${linked}
      <section aria-labelledby="takeaway"><h2 id="takeaway">What you now know</h2><div class="takeaway"><p>${L.inline(p.meta.takeaway, ctx)}</p></div></section>
      ${support(course, 'puzzle')}
      <p class="gate-msg" hidden>Answer every question above correctly to unlock the next puzzle.</p>
      <nav class="pager" aria-label="Previous and next puzzle">
        ${prev ? `<a class="button" href="${prev.slug}.html">← ${prev.n === 0 ? 'Start' : `Puzzle ${prev.n}`}</a>` : '<a class="button" href="../">← Overview</a>'}
        ${next ? `<a class="button primary" href="${next.slug}.html">Puzzle ${next.n}: ${L.esc(next.meta.short || next.meta.title)} →</a>` : '<a class="button primary" href="../">Back to the overview →</a>'}
      </nav>
    </article>`,
  });
}

function renderIndex(cs) {
  const blocks = cs.map(c => {
    let i = 0;
    const modules = c.meta.modules.map(m => {
      const items = m.puzzles.map(() => c.puzzles[i++]).map(p => `<li data-course="${c.id}" data-n="${p.n}"><a href="${c.id}/${p.slug}.html">${p.n === 0 ? 'Start here: ' : ''}${L.esc(p.meta.title)}</a> <span class="small">${L.esc(p.meta.summary)}</span></li>`).join('');
      return `<li><h3>${L.esc(m.title)}</h3><p class="small">${L.esc(m.blurb || '')}</p><ol start="0">${items}</ol></li>`;
    }).join('\n');
    const soon = (c.meta.upcoming || []).map(m => `<li class="soon"><h3>${L.esc(m.title)} <span class="small">(coming next)</span></h3><p class="small">${L.esc(m.topics)}</p></li>`).join('\n');
    return `    <section class="hero" aria-labelledby="course-heading">
      <div class="wrap narrow">
        <p class="eyebrow">Free course · ${c.puzzles.length - 1} puzzles so far · about ${c.meta.minutes} minutes</p>
        <h1 id="course-heading">${L.esc(c.meta.title)}</h1>
        <p class="lede">${L.esc(c.meta.intro)}</p>
        <p class="actions"><a class="button primary" href="${c.id}/${c.puzzles[0].slug}.html" data-resume="${c.id}">Start the first puzzle →</a></p>
        ${fs.existsSync(path.join(OUT, c.id, 'gifs', 'chain.gif')) ? `<img class="hero-gif" src="${c.id}/gifs/chain.gif" width="${gifSize(c.id, 'chain')[0]}" height="${gifSize(c.id, 'chain')[1]}" alt="Animated diagram: system_server decides, Binder carries the message, the main thread receives it, and your callback runs.">` : ''}
      </div>
    </section>
    <section class="section" aria-labelledby="how-heading">
      <div class="wrap narrow">
        <h2 id="how-heading">How it works</h2>
        <p>${L.esc(c.meta.how)}</p>
        ${support(c, 'overview')}
      </div>
    </section>
    <section class="section" aria-labelledby="modules-heading">
      <div class="wrap narrow">
        <h2 id="modules-heading">Modules</h2>
        <ul class="modules">
${modules}
${soon}
        </ul>
      </div>
    </section>`;
  }).join('\n');
  return L.page({
    title: `Course: ${cs[0].meta.title} – Mateusz Pachulski`,
    description: cs[0].meta.intro,
    canonical: `${L.SITE}/course/`,
    base: '../', current: 'course', feed: false, script: 'course.js',
    footer: `      <p class="small">Written with AI from my own learning sessions, and checked against the sources on each page. Your progress is saved only in this browser.</p>
      <p class="small"><a href="../learning/">Learning log</a> · <a href="../">pachulski.dev</a></p>`,
    body: blocks,
  });
}

function build() {
  const out = new Map();
  const terms = L.privateTerms();
  const cs = courses();
  for (const c of cs) for (const p of c.puzzles) out.set(path.join(OUT, c.id, `${p.slug}.html`), renderPuzzle(c, p, terms));
  if (cs.length) out.set(path.join(OUT, 'index.html'), renderIndex(cs));
  return out;
}

function main() {
  const check = process.argv.includes('--check');
  const out = build();
  if (process.exitCode) process.exit(1);
  const existing = fs.existsSync(OUT) ? fs.readdirSync(OUT, { recursive: true }).map(f => path.join(OUT, f)).filter(f => f.endsWith('.html')) : [];
  const stale = existing.filter(f => !out.has(f));
  const changed = [...out].filter(([f, h]) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== h).map(([f]) => f);
  if (check) {
    if (changed.length || stale.length) {
      console.error('course/ is out of date. Run: npm run build:course');
      [...changed, ...stale].forEach(f => console.error(`  ${path.relative(L.ROOT, f)}`));
      process.exit(1);
    }
    console.log(`course/ is up to date (${out.size} pages).`);
    return;
  }
  for (const [f, h] of out) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, h); }
  for (const f of stale) fs.unlinkSync(f);
  console.log(`Built ${out.size} course pages.`);
}

module.exports = { courseUrls, build };
if (require.main === module) main();

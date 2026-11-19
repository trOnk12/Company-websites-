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
const CONTACT = 'm.pachulski94@gmail.com'; // the address already shown on the home page
const LINKEDIN = 'https://www.linkedin.com/in/mateusz-pachulski';
const OUT = path.join(L.ROOT, 'course');
const X = require('./export-course');
const REQUIRED = ['The problem', 'Check yourself', 'Sources'];

function fail(file, msg) { console.error(`${path.relative(L.ROOT, file)}: ${msg}`); process.exitCode = 1; }

const blocksOf = {};
const blocks = id => blocksOf[id] || (blocksOf[id] = require('./lint-course').blocks(id));

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
  const gf = path.join(dir, 'glossary.json');
  const glossary = fs.existsSync(gf) ? JSON.parse(fs.readFileSync(gf, 'utf8')) : { terms: {} };
  return { id, dir, meta, puzzles, glossary };
}

function courses() {
  if (!fs.existsSync(SRC)) return [];
  return fs.readdirSync(SRC).filter(d => fs.existsSync(path.join(SRC, d, 'course.json'))).sort().map(loadCourse);
}

function courseUrls() {
  return courses().flatMap(c => [`${L.SITE}/course/`, `${L.SITE}/course/how-its-made`, `${L.SITE}/course/me`, `${L.SITE}/course/${c.id}/`, ...c.meta.modules.map((_, k) => `${L.SITE}/course/${c.id}/check-${k + 1}`), ...c.puzzles.map(p => `${L.SITE}/course/${c.id}/${p.slug}`)])
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

function gifLink(course, name) {
  return fs.existsSync(path.join(OUT, course.id, 'gifs', `${name}.gif`))
    ? `<p class="gif-link"><a href="gifs/${name}.gif" download>Save this diagram as a GIF</a></p>` : '';
}

function diagram(course, name, file) {
  const f = path.join(course.dir, 'diagrams', `${name}.html`);
  if (!fs.existsSync(f)) { fail(file, `unknown diagram ${name}`); return ''; }
  const src = require('./course-shapes').expand(fs.readFileSync(f, 'utf8'), name);
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
<div class="stage" tabindex="0" aria-label="Diagram">${svg[0]}</div>
<p class="diagram-scroll-hint small">Scroll sideways to see the full diagram.</p>
<ol class="caps">
${items}
</ol>
<div class="dots" aria-hidden="true">${dots}</div>
</figure>`;
}

// "Question::*Right||Wrong >> the mismatch behind it >> s3||…::Why the right one is right"
// Each wrong option names its own misconception and points back to the diagram step (sN) or section
// that fixes it. Grades itself with CSS; course.js adds the unlock.
function quiz(p, items, ctx, diagramName, learnAt) {
  const { parseQuestion } = require('./lint-course');
  return items.map((it, qi) => {
    const q = parseQuestion(it);
    if (q.parts !== 3 || q.opts.length < 2 || q.opts.filter(o => o.ok).length !== 1) {
      fail(p.file, `question needs "Question::*Right||Wrong >> mismatch >> pointer::Why": ${it}`); return '';
    }
    // Stable shuffle, so the right answer isn't always first but the page doesn't change between builds.
    let h = 0; for (const ch of q.q) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const order = q.opts.map((o, i) => ({ o, k: (h + i * 2654435761) >>> 0 })).sort((a, b) => a.k - b.k).map(x => x.o);
    const name = `q-${p.slug}-${qi + 1}`;
    const inputs = order.map((o, i) => `<input type="radio" name="${name}" id="${name}-${i + 1}"${o.ok ? ' data-ok' : ''}><label for="${name}-${i + 1}">${L.inline(o.text, ctx)}</label>`).join('\n');
    const pointer = ptr => {
      const step = (ptr || '').match(/^s(\d)$/);
      if (step && diagramName && !learnAt) return `<label class="show-me" for="st-${diagramName}-${step[1]}" data-goto="st-${diagramName}">Show me step ${step[1]} again ↑</label>`;
      if (learnAt) return `<a class="show-me" href="${learnAt.href}">Learn it in puzzle ${learnAt.n} →</a>`;
      return ptr ? `<a class="show-me" href="#${ptr}">Re-read that part ↑</a>` : '';
    };
    const fbs = order.map((o, i) => o.ok
      ? `<p class="fb ok opt-${i + 1}"><b>Right.</b> ${L.inline(q.why, ctx)}</p>`
      : `<p class="fb no opt-${i + 1}"><b>Not quite.</b> ${L.inline(o.mismatch || 'Step back through the diagram above, then try again.', ctx)} ${pointer(o.pointer)}</p>`).join('\n');
    return `<fieldset class="quiz"${learnAt ? ` data-n="${learnAt.n}"` : ''}>
<legend>${L.inline(q.q, ctx)}</legend>
${inputs}
${fbs}
</fieldset>`;
  }).join('\n');
}

// Support link: shown only once course.json has a real support.url.
function support(course, where) {
  const sp = course.meta.support || {};
  if (!sp.url) return '';
  return `<p class="support support-${where}">${L.esc(sp.line)} <a class="button" href="${sp.url}" rel="noopener">☕ ${L.esc(sp.label)}</a></p>`;
}

function diagramOf(p) {
  const m = p.body.match(/```diagram\s*(\S*)\s*\n\s*(\S*)/);
  return m ? (m[1] || m[2]) : '';
}

// "Builds on": the puzzles this one stands on, each with what it gives you, and the shortest path from zero.
// Terms this puzzle borrows from other courses (glossary "from"), linked to the puzzle that teaches each.
function fromOther(course, p) {
  const from = (course.glossary && course.glossary.from) || {};
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const used = Object.entries(from).filter(([t, v]) => [t, ...(v.aliases || [])].some(nm => new RegExp(`(?<![\\w-])${esc(nm)}s?(?![\\w-])`, /[A-Z]/.test(nm) ? '' : 'i').test(p.body)));
  if (!used.length) return '';
  const items = used.map(([t, v]) => {
    let href = `../${v.course}/`, title = v.course;
    try { const oc = loadCourse(v.course); const op = oc.puzzles[Number(v.in)]; href = `../${v.course}/${op.slug}.html`; title = `${oc.meta.title}, puzzle ${v.in}: ${op.meta.title}`; } catch {}
    return `<li><a href="${href}"><b>${L.esc(t)}</b></a> <span class="small">${L.esc(title)}</span></li>`;
  }).join('');
  return `      <aside class="builds-on from-other" aria-label="From other courses"><p><b>New to these?</b> This puzzle uses ideas another course teaches:</p><ul>${items}</ul></aside>`;
}

function buildsOn(course, p) {
  return buildsOnHere(course, p) + fromOther(course, p);
}

function buildsOnHere(course, p) {
  const b = blocks(course.id);
  const need = b[p.n] || [];
  const assumes = course.meta.assumes;
  if (!need.length) return assumes && p.n > 0 ? `      <aside class="builds-on" aria-label="Building blocks"><p><b>Builds on</b> what you already know from <a href="${assumes.href}">${L.esc(assumes.title)}</a>, not on an earlier puzzle here: you can start with this one.</p></aside>` : '';
  const path = new Set();
  const walk = n => { for (const d of b[n] || []) if (!path.has(d)) { path.add(d); walk(d); } };
  walk(p.n);
  const ordered = [...path].sort((x, y) => x - y);
  const q = n => course.puzzles[n];
  const items = need.map(n => `<li data-block="${n}"><details><summary><a href="${q(n).slug}.html">Puzzle ${n}: ${L.esc(q(n).meta.title)}</a></summary><p>${L.esc(q(n).meta.takeaway)}</p></details></li>`).join('');
  return `      <aside class="builds-on" aria-labelledby="builds-on-${p.n}">
        <p id="builds-on-${p.n}"><b>Builds on</b>: open one to see the idea this puzzle uses.</p>
        <ul>${items}</ul>
        <p class="small">Starting from zero? The blocks under this puzzle are ${ordered.length} puzzle${ordered.length === 1 ? '' : 's'}: ${ordered.map(n => `<a href="${q(n).slug}.html">${n}</a>`).join(' → ')}. Know them already? Start here.</p>
      </aside>`;
}

const sectionId = title => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function renderPuzzle(course, p, terms) {
  const ctx = { file: p.file, cards: new Map(course.puzzles.map(q => [q.slug, q])), links: new Set() };
  const sections = L.parseBody(p.body, ctx);
  const titles = sections.map(s => s.title);
  for (const r of REQUIRED) if (!titles.includes(r)) fail(p.file, `missing section "## ${r}"`);
  for (const k of ['title', 'summary', 'takeaway']) if (!p.meta[k]) fail(p.file, `frontmatter needs ${k}`);
  for (const m of p.raw.matchAll(L.TICKET_KEY)) if (!L.NOT_TICKETS.has(m[0].split('-')[0])) fail(p.file, `looks like a ticket key: ${m[0]}`);
  for (const t of terms) if (p.raw.toLowerCase().includes(t.toLowerCase())) fail(p.file, `contains a private term: ${t}`);

  const depth = sections.filter(s => s.title.startsWith('Go deeper: '));
  const body = sections.map(s => {
    const sid = sectionId(s.title);
    const html = s.title === 'Check yourself'
      ? s.blocks.map(b => b.type === 'ul' ? quiz(p, b.items, ctx, diagramOf(p)) : L.renderBlocks([b], ctx)).join('\n')
      : s.blocks.map(b => b.type === 'code' && b.lang.startsWith('diagram')
      ? diagram(course, b.text.trim() || b.lang.split(/\s+/)[1], p.file) + gifLink(course, b.text.trim() || b.lang.split(/\s+/)[1])
      : L.renderBlocks([b], ctx, { recall: depth.includes(s) && b.type === 'ul' })).join('\n');
    if (depth.includes(s)) {
      return `      <details class="depth-puzzle" id="${sid}">
        <summary><span class="depth-label">Go deeper</span>${L.inline(s.title.slice('Go deeper: '.length), ctx)}</summary>
        <div class="depth-content">
${html}
          <p class="small"><a href="#the-building-block">Back to the main puzzle</a></p>
        </div>
      </details>`;
    }
    if (s.title === 'Sources') {
      return `      <details class="puzzle-sources" id="${sid}"><summary>Sources</summary>${html}</details>`;
    }
    return `      <section aria-labelledby="${sid}">
        <h2 id="${sid}">${L.inline(s.title, ctx)}</h2>
${html}
      </section>`;
  }).join('\n');

  const all = course.puzzles;
  const linked = linkRefs(course, body);
  const prev = all[p.n - 1], next = all[p.n + 1];
  const progress = all.map(q => `<li><a href="${q.slug}.html"${q === p ? ' aria-current="page"' : ''} title="${L.esc(q.meta.title)}">${q.n}</a></li>`).join('');
  const label = `Puzzle ${p.n} · ${p.n + 1} of ${all.length}`;
  const nextUp = (course.meta.upcoming || [])[0];
  const fix = `mailto:${CONTACT}?subject=${encodeURIComponent(`Course: ${p.meta.title}`)}&body=${encodeURIComponent('Which part, and what was wrong or unclear?\n\n')}`;
  return L.page({
    title: `${p.meta.title} – ${course.meta.title} – Mateusz Pachulski`,
    description: p.meta.summary,
    canonical: `${L.SITE}/course/${course.id}/${p.slug}`,
    base: '../../', current: 'course', feed: false, script: ['../progress-index.js', '../course.js'],
    footer: `      <p class="small">Written with AI from my own learning sessions, and checked against the sources on each page.</p>
      <p class="small"><a href="./">Course overview</a> · <a href="../">All courses</a> · <a href="../../learning/">Learning log</a> · <a href="../../">pachulski.dev</a></p>`,
    body: `    <article class="puzzle course-top wrap narrow" data-support="${L.esc((course.meta.support || {}).url || '')}" data-course="${course.id}" data-n="${p.n}">
      <p class="lesson-context"><a href="../">Courses</a><span aria-hidden="true">/</span><a href="./">${L.esc(course.meta.title)}</a></p>
      <div class="lesson-header">
        <p class="eyebrow">${label}</p>
        <h1>${L.esc(p.meta.title)}</h1>
        <p class="lede">${L.inline(p.meta.summary, ctx)}</p>
      </div>
      <details class="lesson-outline">
        <summary>All puzzles in this course</summary>
        <nav aria-label="Puzzles"><ol class="progress">${progress}</ol></nav>
      </details>
      <nav class="lesson-jumps" aria-label="In this puzzle">
        ${titles.includes('See it') ? '<a href="#see-it">Diagram</a>' : ''}
        ${titles.includes('The building block') ? '<a href="#the-building-block">Mechanism</a>' : ''}
${depth.length ? `        <a href="#${sectionId(depth[0].title)}">Go deeper</a>\n` : ''}        <a href="#check-yourself">Check your understanding</a>
      </nav>
${buildsOn(course, p)}
${linked}
      <section aria-labelledby="takeaway"><h2 id="takeaway">What you now know</h2><div class="takeaway"><p>${L.inline(p.meta.takeaway, ctx)}</p></div></section>
${support(course, 'puzzle')}      <p class="gate-msg" hidden>Answer every question above correctly to unlock the next puzzle.</p>
      <nav class="pager" aria-label="Previous and next puzzle">
        ${prev ? `<a class="button" href="${prev.slug}.html">← ${prev.n === 0 ? 'Start' : `Puzzle ${prev.n}`}</a>` : '<a class="button" href="./">← Overview</a>'}
        ${next ? `<a class="button primary" href="${next.slug}.html">Puzzle ${next.n}: ${L.esc(next.meta.short || next.meta.title)} →</a>` : '<a class="button" href="./">Back to the overview →</a>'}
      </nav>
${next ? '' : `      <section class="finish" aria-labelledby="finish-heading">
        <h2 id="finish-heading">That's everything published so far</h2>
        <p>You've reached the last puzzle of <b>${L.esc(course.meta.title)}</b>.${nextUp ? ` Next: ${L.esc(nextUp.title)}, about ${L.esc(nextUp.topics.charAt(0).toLowerCase() + nextUp.topics.slice(1))}` : ''}</p>
        <p>New puzzles are announced on <a href="${LINKEDIN}">LinkedIn</a> and in the <a href="../../learning/feed.xml">learning log feed</a>.</p>
        <p class="actions"><a class="button primary" href="../">All courses →</a></p>
      </section>`}
      <p class="small fix-link">Something wrong or unclear on this page? <a href="${fix}">Tell me</a>: a puzzle that didn't click is a bug in the puzzle.</p>
    </article>`,
  });
}

const minutes = c => Math.round(c.puzzles.length * 5 / 10) * 10;

// "Know this already?": one question per puzzle of a module. A right answer marks that puzzle passed;
// a wrong one points to the puzzle that teaches it. course/<id>/check-<k>.html.
function renderCheck(c, k) {
  const m = c.meta.modules[k];
  const first = c.meta.modules.slice(0, k).reduce((a, x) => a + x.puzzles.length, 0);
  const ps = m.puzzles.map((_, j) => c.puzzles[first + j]);
  const qs = ps.map(p => {
    const ctx = { file: p.file, cards: new Map(), links: new Set() };
    const check = L.parseBody(p.body, ctx).find(s => s.title === 'Check yourself');
    const item = check.blocks.find(b => b.type === 'ul').items[0];
    return `<section aria-label="Puzzle ${p.n}"><p class="eyebrow">Puzzle ${p.n}: ${L.esc(p.meta.title)}</p>\n${quiz(p, [item], ctx, null, { n: p.n, href: `${p.slug}.html` })}</section>`;
  }).join('\n');
  return L.page({
    title: `Check: ${m.title} – ${c.meta.title} – Mateusz Pachulski`,
    description: `Already know ${m.title}? Answer one question per puzzle; each right answer marks that puzzle as passed.`,
    canonical: `${L.SITE}/course/${c.id}/check-${k + 1}`,
    base: '../../', current: 'course', feed: false, script: ['../progress-index.js', '../course.js'],
    footer: `      <p class="small"><a href="./">Course overview</a> · <a href="../">All courses</a> · <a href="../../">pachulski.dev</a></p>`,
    body: `    <article class="module-check course-top wrap narrow" data-course="${c.id}">
      <p class="eyebrow"><a href="./">${L.esc(c.meta.title)}</a> · check</p>
      <h1>Know ${L.esc(m.title.replace(/^Module \d+:\s*/, ''))} already?</h1>
      <p class="lede">One question for each of the ${ps.length} puzzles in this module. A right answer marks that puzzle as passed, so you can jump ahead. A wrong one tells you which puzzle to start with. Nothing is sent anywhere: it's saved in this browser.</p>
${qs}
      <p class="check-result" aria-live="polite"></p>
      <p class="actions"><a class="button" href="./">Back to the overview →</a></p>
    </article>`,
  });
}

// One course's overview: course/<id>/index.html.
function renderOverview(c) {
  let i = 0;
  const modules = c.meta.modules.map((m, k) => {
    const first = i;
    const items = m.puzzles.map(() => c.puzzles[i++]).map(p =>
      `<li data-course="${c.id}" data-n="${p.n}"><a href="${p.slug}.html">${L.esc(p.meta.title)}</a> <span class="puzzle-state"></span><span class="small puzzle-summary">${L.esc(p.meta.summary)}</span></li>`).join('');
    return `<li><details class="course-module"${k === 0 ? ' open' : ''}>
      <summary><span class="module-title">${L.esc(m.title)}</span><span class="module-count small">${m.puzzles.length} puzzles</span></summary>
      <div class="module-body"><p>${L.esc(m.blurb || '')}</p><ol start="${first}">${items}</ol>
      <a class="module-check-link" href="check-${k + 1}.html">Check what you already know</a></div>
    </details></li>`;
  }).join('\n');
  const soon = (c.meta.upcoming || []).map((m, k) => `<li class="soon"><h3>${L.esc(m.title)} <span class="small">(${k === 0 ? 'next' : 'later'})</span></h3><p class="small">${L.esc(m.topics)}</p></li>`).join('\n');
  const related = (c.meta.relatedCourses || []).map(id => {
    const target = loadCourse(id);
    return `          <li><a href="../${target.id}/">${L.esc(target.meta.title)}</a></li>`;
  }).join('\n');
  const body = `    <section class="hero course-intro" aria-labelledby="course-heading">
      <div class="wrap narrow">
        <p class="eyebrow"><a href="../">Free courses</a> · ${c.puzzles.length} puzzles so far · about ${minutes(c)} minutes</p>
        <h1 id="course-heading">${L.esc(c.meta.title)}</h1>
        <p class="lede">${L.esc(c.meta.intro)}</p>
${c.meta.assumes ? `        <p class="small">Builds on <a href="${L.esc(c.meta.assumes.href)}">${L.esc(c.meta.assumes.title)}</a>.</p>\n` : ''}
        <p class="actions"><a class="button primary" href="${c.puzzles[0].slug}.html" data-resume="${c.id}">Start learning</a> <a class="button" href="#modules-heading">Browse modules</a></p>
      </div>
    </section>
    <section class="section curriculum" aria-labelledby="modules-heading">
      <div class="wrap narrow">
        <h2 id="modules-heading">Course outline</h2>
        <ul class="modules">
${modules}
        </ul>
${soon ? `        <details class="course-extras"><summary>Planned modules</summary><ul class="modules">${soon}</ul></details>\n` : ''}${related ? `        <nav aria-label="Related courses"><h3>Continue with</h3><ul>\n${related}\n        </ul></nav>\n` : ''}
        <details class="course-extras"><summary>How the course works</summary>
          <p>Every puzzle is open from this outline. The check at the end of a puzzle unlocks its next button and saves your progress in this browser.</p>
          <p><a href="../how-its-made.html">How lessons are written and checked</a> · <a href="../me.html">Your learning</a></p>
${support(c, 'overview')}        </details>
      </div>
    </section>
    <section class="section take-it" aria-labelledby="take-heading">
      <div class="wrap narrow">
        <h2 id="take-heading">Take it with you</h2>
        <div class="take-grid">
          <div>
            <h3>Continue with Claude</h3>
            <p class="small">Copies a prompt that turns Claude into your tutor for this course: what you've passed, the words you know, the questions you slipped on, and how to teach you, one small block at a time. Paste it into Claude, or any AI assistant. Built in your browser from your progress; nothing is sent anywhere.</p>
            <p><button type="button" class="button primary" data-tutor="${c.id}">Copy my tutor prompt</button> <a class="button" href="https://claude.ai/new" rel="noopener">Open Claude →</a></p>
            <p class="tutor-status small" aria-live="polite"></p>
            <textarea class="tutor-prompt" readonly hidden aria-label="Your tutor prompt" rows="10"></textarea>
          </div>
          <div>
            <h3>Download for Obsidian</h3>
            <p class="small">The whole course as an Obsidian vault: a note per puzzle linked to the puzzles it builds on (open the graph view to see the building blocks), a glossary, and every question as a flashcard for the Spaced Repetition plugin.</p>
            <p><a class="button" href="${c.id}-obsidian.zip" download>Download the vault (.zip) ↓</a></p>
          </div>
        </div>
        <script type="application/json" id="tutor-data">${JSON.stringify(X.tutor(c)).replace(/</g, '\\u003c')}</script>
      </div>
    </section>`;
  return L.page({
    title: `${c.meta.title}: a free course – Mateusz Pachulski`,
    description: c.meta.intro,
    canonical: `${L.SITE}/course/${c.id}/`,
    base: '../../', current: 'course', feed: false, script: ['../progress-index.js', '../course.js'],
    footer: `      <p class="small">Written with AI from my own learning sessions, and checked against the sources on each page. Your progress is saved only in this browser.</p>
      <p class="small"><a href="../">All courses</a> · <a href="../../learning/">Learning log</a> · <a href="../../">pachulski.dev</a></p>`,
    body,
  });
}

// How the courses are made: _course/how-its-made.md → course/how-its-made.html.
function renderMethod(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const { meta, body } = L.parseFrontmatter(raw, file);
  const ctx = { file, cards: new Map(), links: new Set() };
  const html = L.parseBody(body, ctx).map(s => `      <section><h2>${L.inline(s.title, ctx)}</h2>\n${L.renderBlocks(s.blocks, ctx)}</section>`).join('\n');
  return L.page({
    title: `${meta.title} – Mateusz Pachulski`, description: meta.summary, canonical: `${L.SITE}/course/how-its-made`,
    base: '../', current: 'course', feed: false,
    footer: `      <p class="small"><a href="./">All courses</a> · <a href="../learning/">Learning log</a> · <a href="../">pachulski.dev</a></p>`,
    body: `    <article class="course-top wrap narrow">\n      <p class="eyebrow"><a href="./">Free courses</a></p>\n      <h1>${L.esc(meta.title)}</h1>\n      <p class="lede">${L.esc(meta.summary)}</p>\n${html}\n    </article>`,
  });
}

// The catalog: course/index.html. Live courses as cards, then the ones on the way.
// "Your learning": progress across every course, what to learn next (from the building-block graph), weak spots,
// and export/import of progress. Everything comes from this browser's storage; nothing is sent anywhere.
function renderMe(cs) {
  const data = cs.map(c => ({
    id: c.id, title: c.meta.title, assumes: c.meta.assumes ? (c.meta.assumes.href.match(/\.\.\/([a-z0-9-]+)\//) || [])[1] : null,
    puzzles: c.puzzles.map(p => ({ n: p.n, slug: p.slug, title: p.meta.title, short: p.meta.short || '', blocks: blocks(c.id)[p.n] || [] })),
  }));
  return L.page({
    title: 'Your learning – Mateusz Pachulski',
    description: 'Your progress across every course, what to learn next, and the questions you slipped on. Saved only in your browser.',
    canonical: `${L.SITE}/course/me`,
    base: '../', current: 'course', feed: false, script: ['progress-index.js', 'course.js'],
    footer: `      <p class="small"><a href="./">All courses</a> · <a href="../">pachulski.dev</a></p>`,
    body: `    <article class="me course-top wrap narrow">
      <p class="eyebrow"><a href="./">Free courses</a> · your learning</p>
      <h1>Your learning</h1>
      <p class="lede">Where you are in every course, what to learn next, and what to go back to. It's built from your progress in this browser: no account, nothing sent anywhere.</p>
      <section aria-labelledby="next-heading"><h2 id="next-heading">Learn next</h2><ol class="me-next"><li class="small">Loading…</li></ol></section>
      <section aria-labelledby="where-heading"><h2 id="where-heading">Where you are</h2><ul class="me-courses"></ul></section>
      <section aria-labelledby="weak-heading"><h2 id="weak-heading">Go back to</h2><p class="small">Questions you got wrong at first. Re-read the puzzle; it's the fastest way to make it stick.</p><ul class="me-weak"></ul></section>
      <section aria-labelledby="move-heading"><h2 id="move-heading">Take your progress to another device</h2>
        <p class="small">Your progress lives in this browser. Save it as a file, then load it on your other phone or laptop.</p>
        <p class="actions"><button type="button" class="button" data-export>Save my progress</button> <label class="button"><input type="file" accept="application/json" data-import hidden>Load a progress file</label> <span class="me-status small" aria-live="polite"></span></p>
      </section>
      <script type="application/json" id="me-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
    </article>`,
  });
}

function renderIndex(cs) {
  const cat = fs.existsSync(path.join(SRC, 'catalog.json')) ? JSON.parse(fs.readFileSync(path.join(SRC, 'catalog.json'), 'utf8')) : null;
  const live = new Set(cs.map(c => c.id));
  const byId = Object.fromEntries(cs.map(c => [c.id, c]));
  const groups = cat?.groups || [];
  const grouped = new Set(groups.flatMap(g => g.courses));
  const others = cs.filter(c => !grouped.has(c.id)).map(c => c.id);
  const card = c => `<li class="course-card" data-progress="${c.id}" data-total="${c.puzzles.length}">
          <h3><a href="${c.id}/">${L.esc(c.meta.title)}</a></h3>
          <p>${L.esc(cat?.descriptions?.[c.id] || c.meta.intro)}</p>
          <p class="small card-status"><span>${c.puzzles.length} puzzles · ~${minutes(c)} min</span><span class="mine">Not started</span></p>
          <progress class="card-progress" value="0" max="${c.puzzles.length}" aria-label="${L.esc(c.meta.title)} progress"></progress>
          <a class="button primary" href="${c.id}/" data-puzzles="${c.puzzles.map(p => p.slug).join(' ')}">Open course</a>
        </li>`;
  const sections = [...groups, ...(others.length ? [{ title: 'More courses', courses: others }] : [])]
    .map((g, i) => {
      const cards = g.courses.filter(id => byId[id]).map(id => card(byId[id])).join('\n');
      return cards ? `<section class="catalog-group" aria-labelledby="catalog-group-${i}">
        <h2 id="catalog-group-${i}">${L.esc(g.title)}</h2>
        <ul class="courses">${cards}</ul>
      </section>` : '';
    }).join('\n');
  const soon = cat ? cat.upcoming.filter(m => !live.has(m.id)).map(m => `<li class="soon"><h3>${L.esc(m.title)}</h3><p class="small">${L.esc(m.topics)}</p></li>`).join('\n') : '';
  const body = `    <section class="catalog-hero" aria-labelledby="courses-heading">
      <div class="wrap">
        <p class="eyebrow">Free courses · no sign-up</p>
        <h1 id="courses-heading">Understand how it works</h1>
        <p class="lede">Build an explanation one puzzle at a time. Follow the mechanism, predict what happens next, and go deeper when a step raises another question.</p>
        <p class="actions"><a class="button primary" href="#browse-courses">Browse courses</a> <a class="button" href="me.html">Your learning</a></p>
      </div>
    </section>
    <div class="wrap catalog-body" id="browse-courses">
      ${sections}
${soon ? `      <details class="course-extras"><summary>${L.esc(cat.title)}</summary><ul class="modules">${soon}</ul></details>\n` : ''}      <p class="catalog-method"><a href="how-its-made.html">How the puzzles are written and checked</a></p>
    </div>`;
  return L.page({
    title: 'Free courses – Mateusz Pachulski',
    description: 'Free courses on Android, Bluetooth Low Energy and more: small puzzles from the foundation up, with moving diagrams and a check after each one.',
    canonical: `${L.SITE}/course/`,
    base: '../', current: 'course', feed: false, script: ['progress-index.js', 'course.js'],
    footer: `      <p class="small">Written with AI from my own learning sessions, and checked against primary sources. Your progress is saved only in this browser.</p>
      <p class="small"><a href="../learning/">Learning log</a> · <a href="../">pachulski.dev</a></p>`,
    body,
  });
}

function build() {
  const out = new Map();
  const terms = L.privateTerms();
  const cs = courses();
  for (const c of cs) for (const p of c.puzzles) out.set(path.join(OUT, c.id, `${p.slug}.html`), renderPuzzle(c, p, terms));
  for (const c of cs) out.set(path.join(OUT, c.id, 'index.html'), renderOverview(c));
  for (const c of cs) out.set(path.join(OUT, c.id, `${c.id}-obsidian.zip`), X.zip(X.vault(c, blocks(c.id))));
  for (const c of cs) c.meta.modules.forEach((_, k) => out.set(path.join(OUT, c.id, `check-${k + 1}.html`), renderCheck(c, k)));
  const made = path.join(SRC, 'how-its-made.md');
  if (fs.existsSync(made)) out.set(path.join(OUT, 'how-its-made.html'), renderMethod(made));
  if (cs.length) out.set(path.join(OUT, 'index.html'), renderIndex(cs));
  if (cs.length) out.set(path.join(OUT, 'me.html'), renderMe(cs));
  // Every course page loads this first: each course's puzzle slugs in order, so progress is saved by slug and
  // survives puzzles being inserted; plus the old orders, to migrate progress saved by number.
  const legacyFile = path.join(L.ROOT, '_course', 'progress-legacy.json');
  const legacy = fs.existsSync(legacyFile) ? JSON.parse(fs.readFileSync(legacyFile, 'utf8')).courses : {};
  if (cs.length) out.set(path.join(OUT, 'progress-index.js'), `// Generated by scripts/build-course.js.\nwindow.COURSE_INDEX = ${JSON.stringify({ cur: Object.fromEntries(cs.map(c => [c.id, c.puzzles.map(p => p.slug.replace(/^\d+-/, ''))])), legacy })};\n`);
  return out;
}

function main() {
  const check = process.argv.includes('--check');
  const out = build();
  if (process.exitCode) process.exit(1);
  const existing = fs.existsSync(OUT) ? fs.readdirSync(OUT, { recursive: true }).map(f => path.join(OUT, f)).filter(f => f.endsWith('.html')) : [];
  const stale = existing.filter(f => !out.has(f));
  const changed = [...out].filter(([f, h]) => !fs.existsSync(f) || !fs.readFileSync(f).equals(Buffer.isBuffer(h) ? h : Buffer.from(h))).map(([f]) => f);
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
  console.log(`Built ${[...out.keys()].filter(f => f.endsWith('.html')).length} course pages and ${[...out.keys()].filter(f => f.endsWith('.zip')).length} Obsidian vaults.`);
}

module.exports = { courseUrls, build };
if (require.main === module) main();

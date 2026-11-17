#!/usr/bin/env node
'use strict';

// Clarity lint for the course (pass 1 of the course-clarity skill).
//
//   node scripts/lint-course.js                  lint every course; exit 1 on any problem
//   node scripts/lint-course.js --text android   print the course as a beginner would read it (for pass 2)

const fs = require('fs');
const path = require('path');
const L = require('./build-learning');

const SRC = path.join(L.ROOT, '_course');
const MAX_CAPTION_WORDS = 45;
const MAX_SVG_WORDS_PER_STEP = 12;
const MAX_NEW_BOLD_TERMS = 6;

const words = s => (s.replace(/<[^>]+>/g, ' ').match(/[\p{L}\p{N}_().'’-]+/gu) || []).length;
const plain = s => s.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

// "Q::*Right||Wrong >> why that's wrong >> s3::Why the right one is right"
function parseQuestion(line) {
  const parts = line.split('::');
  const opts = (parts[1] || '').split('||').map(o => {
    const [text, mismatch, pointer] = o.split('>>').map(x => (x || '').trim());
    const ok = text.startsWith('*');
    return { ok, text: ok ? text.slice(1).trim() : text, mismatch, pointer };
  });
  return { q: (parts[0] || '').trim(), opts, why: (parts[2] || '').trim(), parts: parts.length };
}

function loadCourse(id) {
  const dir = path.join(SRC, id);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'course.json'), 'utf8'));
  return meta.modules.flatMap(m => m.puzzles).filter(f => fs.existsSync(path.join(dir, f))).map((f, n) => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const { meta: fm, body } = L.parseFrontmatter(raw, f);
    const ctx = { file: f, cards: new Map(), links: new Set() };
    const sections = L.parseBody(body, ctx);
    const diagrams = sections.flatMap(s => s.blocks).filter(b => b.type === 'code' && b.lang.startsWith('diagram'))
      .map(b => {
        const name = b.text.trim() || b.lang.split(/\s+/)[1];
        const file = path.join(dir, 'diagrams', `${name}.html`);
        const src = fs.existsSync(file) ? require('./course-shapes').expand(fs.readFileSync(file, 'utf8'), name) : '';
        return { name, src, caps: [...src.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1]) };
      });
    return { n, f, raw, fm, sections, diagrams };
  });
}

// Words of SVG text each step adds: text inside a <g>/<text> whose class says when it appears (sN, only-N),
// nesting-aware (shapes from course-shapes.js put their labels in nested groups).
function stepWords(svg) {
  const per = {};
  const stack = [];
  let inText = 0;
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)\b([^>]*?)(\/?)>|([^<]+)/g)) {
    if (m[5] !== undefined) {
      const k = inText && stack.filter(Boolean).pop();
      if (k) per[k] = (per[k] || 0) + words(m[5]);
      continue;
    }
    const [, close, tag, attrs, self] = m;
    if (tag !== 'g' && tag !== 'text') continue;
    if (close) { stack.pop(); if (tag === 'text') inText--; continue; }
    if (self) continue;
    const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || '';
    stack.push((cls.match(/\b(?:s|only-)(\d)\b/) || [])[1] || null);
    if (tag === 'text') inText++;
  }
  return per;
}

function lint(id) {
  const problems = [];
  const puzzles = loadCourse(id);
  let taught = '';
  for (const p of puzzles) {
    const at = msg => problems.push(`${id}/${p.f}: ${msg}`);
    // Everything the learner has seen up to (and including) this puzzle's teaching sections.
    for (const s of p.sections) if (s.title !== 'Check yourself' && s.title !== 'Sources') taught += ' ' + JSON.stringify(s.blocks);
    for (const d of p.diagrams) taught += ' ' + d.caps.join(' ') + ' ' + d.src;

    // Diagrams: short captions, little text in the picture, something that moves.
    for (const d of p.diagrams) {
      if (!d.src) { at(`diagram ${d.name} not found`); continue; }
      d.caps.forEach((c, i) => { if (words(c) > MAX_CAPTION_WORDS) at(`diagram ${d.name} step ${i + 1}: caption has ${words(c)} words (max ${MAX_CAPTION_WORDS})`); });
      const perStep = stepWords(d.src);
      for (const [k, w] of Object.entries(perStep)) if (w > MAX_SVG_WORDS_PER_STEP) at(`diagram ${d.name} step ${k}: ${w} words of text in the picture (max ${MAX_SVG_WORDS_PER_STEP}): show it, don't write it`);
      if (!/data-move|class="[^"]*\bmoving\b/.test(d.src)) at(`diagram ${d.name}: nothing moves; show the mechanism in motion`);
    }

    // New terms: one per step.
    const teach = p.sections.filter(s => !['Check yourself', 'Sources'].includes(s.title));
    const bold = new Set(teach.flatMap(s => JSON.stringify(s.blocks).match(/\*\*([^*]+)\*\*/g) || []).map(b => b.toLowerCase()));
    if (bold.size > MAX_NEW_BOLD_TERMS) at(`${bold.size} bold terms (max ${MAX_NEW_BOLD_TERMS}): ${[...bold].join(', ')}`);

    // Questions.
    const check = p.sections.find(s => s.title === 'Check yourself');
    const items = check ? check.blocks.filter(b => b.type === 'ul').flatMap(b => b.items) : [];
    // A right answer that's much longer than every wrong one is guessable ("pick the longest").
    for (const it of items) {
      const q = parseQuestion(it);
      const ok = q.opts.find(o => o.ok);
      const wrong = q.opts.filter(o => !o.ok).map(o => o.text.length);
      const others = q.opts.filter(o => !o.ok);
      if (ok && others.length && others.every(o => /^Because\b/.test(o.text)) && !/^Because\b/.test(ok.text)) at(`question "${q.q.slice(0, 50)}…": every wrong answer starts with "Because" and the right one doesn't, so it can be guessed`);
      if (ok && others.length && /;/.test(ok.text) && others.every(o => !/;/.test(o.text))) at(`question "${q.q.slice(0, 50)}…": only the right answer has the two-part "X; Y" shape, so it can be guessed`);
      if (ok && wrong.length && ok.text.length > Math.max(...wrong) * 1.25 + 8) at(`question "${q.q.slice(0, 50)}…": the right answer is much longer than every wrong one, so it can be guessed; make the wrong answers as specific, or the right one shorter`);
    }
    if (!items.length) at('no questions');
    const steps = p.diagrams[0] ? p.diagrams[0].caps.length : 0;
    const sectionIds = p.sections.map(s => s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    items.forEach((it, qi) => {
      const q = parseQuestion(it);
      const tag = `question ${qi + 1}`;
      if (q.parts !== 3) at(`${tag}: needs "Question::*Right||Wrong >> mismatch >> pointer::Why"`);
      if (q.opts.filter(o => o.ok).length !== 1) at(`${tag}: needs exactly one right answer`);
      if (q.opts.length < 2 || q.opts.length > 4) at(`${tag}: needs 2–4 options`);
      for (const o of q.opts.filter(o => !o.ok)) {
        if (!o.mismatch) at(`${tag}: wrong option "${o.text}" has no mismatch feedback`);
        const ptr = o.pointer || '';
        const step = ptr.match(/^s(\d)$/);
        if (!ptr) at(`${tag}: wrong option "${o.text}" has no pointer (s1… or a section id)`);
        else if (step ? Number(step[1]) > steps || Number(step[1]) < 1 : !sectionIds.includes(ptr)) at(`${tag}: pointer "${ptr}" doesn't exist on this page`);
      }
      // Pre-check the check: code names in the question must have been taught.
      for (const c of (q.q + ' ' + q.opts.map(o => o.text).join(' ')).match(/`[^`]+`/g) || []) {
        const name = c.slice(1, -1).replace(/\s*\{.*$/, '').replace(/\(.*$/, '');
        if (!taught.includes(name)) at(`${tag}: uses ${c}, which isn't taught before this question`);
      }
    });
  }
  return problems;
}

// ── Vocabulary: no term before its puzzle; one concept per step ─────────────────
// Page order as the learner reads it: title, subtitle, sections (diagram captions in place), questions.
function segments(p) {
  const segs = [{ where: 'title', text: p.fm.title || '' }, { where: 'subtitle', text: p.fm.summary || '' }];
  for (const s of p.sections) {
    if (s.title === 'Sources') continue;
    segs.push({ where: 'heading', text: s.title });
    for (const b of s.blocks) {
      if (b.type === 'code' && b.lang.startsWith('diagram')) {
        const d = p.diagrams.find(x => x.name === (b.text.trim() || b.lang.split(/\s+/)[1]));
        if (!d) continue;
        // Labels appear with their step, next to that step's caption.
        const labels = {};
        for (const m of d.src.matchAll(/<(g|text)\b[^>]*class="[^"]*\b(?:s|only-|upto-)(\d)\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g)) {
          const words = m[1] === 'text' ? m[3] : [...m[3].matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(t => t[1]).join(' · ');
          labels[m[2]] = (labels[m[2]] || '') + ' · ' + words;
        }
        d.caps.forEach((c, i) => segs.push({ where: `step ${i + 1}`, text: c.replace(/<\/?b>/g, '**').replace(/<\/?code>/g, '`').replace(/<[^>]+>/g, '') + (labels[i + 1] || '') }));
      } else if (b.type === 'code') segs.push({ where: 'code', text: b.text, code: true });
      else if (s.title === 'Check yourself' && b.type === 'ul') b.items.forEach((it, i) => {
        const q = parseQuestion(it);
        segs.push({ where: `question ${i + 1}`, text: [q.q, ...q.opts.flatMap(o => [o.text, o.mismatch || '']), q.why].join(' · ') });
      });
      else if (b.type === 'table') segs.push({ where: `${s.title} (table)`, text: [b.head, ...b.rows].map(r => r.join(' · ')).join(' · ') });
      else segs.push({ where: s.title, text: b.items ? b.items.join(' · ') : (b.text || '') });
    }
  }
  return segs;
}

function vocabulary(id, puzzles) {
  const problems = [];
  const gf = path.join(SRC, id, 'glossary.json');
  if (!fs.existsSync(gf)) return [`${id}: missing glossary.json`];
  const g = JSON.parse(fs.readFileSync(gf, 'utf8'));
  const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const terms = Object.entries(g.terms).map(([t, v]) => {
    const names = [t, ...(v.aliases || [])];
    const rx = names.map(n => {
      const cs = /[A-Z]/.test(n) || /[(_.]/.test(n); // capitalised and code names match exactly
      return new RegExp(`(?<![\\w-])${esc(n)}${/\w$/.test(n) ? 's?' : ''}(?![\\w-])`, cs ? '' : 'i');
    });
    return { t, in: Number(v.in), kind: v.kind || 'concept', rx, names };
  });
  // Terms another course teaches: listed under "from" with the course and puzzle, so the dependency is explicit
  // (the puzzle page links to it). A baseline word that another course teaches is a hidden gap: an error.
  const taughtElsewhere = {};
  // The course this one declares it builds on (course.json "assumes") is fair game: its overview links it.
  const meta = JSON.parse(fs.readFileSync(path.join(SRC, id, 'course.json'), 'utf8'));
  const assumed = meta.assumes ? (meta.assumes.href.match(/\.\.\/([a-z0-9-]+)\//) || [])[1] : null;
  const key = nm => /[A-Z]/.test(nm) ? nm : nm.toLowerCase();
  const assumedWords = [];
  for (const other of fs.readdirSync(SRC).filter(d => d !== id && d !== assumed && fs.existsSync(path.join(SRC, d, 'glossary.json')))) {
    const og = JSON.parse(fs.readFileSync(path.join(SRC, other, 'glossary.json'), 'utf8'));
    for (const [ot, ov] of Object.entries(og.terms)) for (const nm of [ot, ...(ov.aliases || [])]) taughtElsewhere[key(nm)] = taughtElsewhere[key(nm)] || { course: other, in: Number(ov.in), term: ot };
  }
  if (assumed && fs.existsSync(path.join(SRC, assumed, 'glossary.json'))) {
    const ag = JSON.parse(fs.readFileSync(path.join(SRC, assumed, 'glossary.json'), 'utf8'));
    for (const [at2, av] of Object.entries(ag.terms)) for (const nm of [at2, ...(av.aliases || [])]) assumedWords.push(nm);
  }
  const from = g.from || {};
  for (const [ft, fv] of Object.entries(from)) {
    const og = path.join(SRC, fv.course || '', 'glossary.json');
    const ok = fs.existsSync(og) && Object.entries(JSON.parse(fs.readFileSync(og, 'utf8')).terms).some(([ot, ov]) => [ot, ...(ov.aliases || [])].some(x => x.toLowerCase() === ft.toLowerCase()) && Number(ov.in) === Number(fv.in));
    if (!ok) problems.push(`${id}: "from" says ${fv.course} puzzle ${fv.in} teaches "${ft}", but that course's glossary doesn't`);
  }
  // baseline.homonyms: everyday words that another course uses in a narrower sense (a BLE "server", an Objective-C
  // "header"). Listing one says: here it means the everyday thing.
  const homonyms = new Set((g.baseline.homonyms || []).map(w => w.toLowerCase()));
  for (const w of g.baseline.words) {
    if (homonyms.has(w.toLowerCase())) continue;
    const hit = taughtElsewhere[key(w)];
    if (hit && !from[w] && !g.terms[w]) problems.push(`${id}: baseline word "${w}" is a concept the ${hit.course} course teaches (puzzle ${hit.in}): list it under "from" so the page links it, or teach it here`);
  }
  // Jargon that always needs teaching, whatever the course: never allowed in the baseline.
  const jf = path.join(SRC, 'jargon.json');
  const jargon = fs.existsSync(jf) ? JSON.parse(fs.readFileSync(jf, 'utf8')).words : [];
  for (const w of g.baseline.words) if (!homonyms.has(w.toLowerCase()) && !assumedWords.some(a => a.toLowerCase() === w.toLowerCase()) && jargon.some(j => j.toLowerCase() === w.toLowerCase())) problems.push(`${id}: baseline word "${w}" is jargon: teach it in a puzzle (glossary "terms") or link it (glossary "from")`);
  const known = new Set([...g.baseline.words, ...assumedWords, ...terms.flatMap(t => t.names), ...Object.keys(from), ...Object.values(from).flatMap(v => v.aliases || [])].map(w => w.toLowerCase()));
  const norm = c => c.replace(/\(.*?\)/g, '()').replace(/\s*\{.*$/, '').trim();
  const isKnown = c => { const n = norm(c).toLowerCase(); return [n, n.replace(/\(\)$/, ''), n + '()', n.replace(/s$/, '')].some(x => known.has(x)); };

  for (const p of puzzles) {
    const n = Number(p.f.slice(0, 2));
    const at = msg => problems.push(`${id}/${p.f}: ${msg}`);
    const segs = segments(p);
    // A: no term before the puzzle that teaches it.
    for (const t of terms) if (t.in > n) {
      const hit = segs.find(s => t.rx.some(r => r.test(s.text)));
      if (hit) at(`uses "${t.t}" (${hit.where}) before puzzle ${t.in} teaches it`);
    }
    // B: a term taught here is first met in the body, bold, not in the subtitle or a question.
    const here = terms.filter(t => t.in === n);
    for (const t of here) {
      const first = segs.find(s => s.where !== 'title' && t.rx.some(r => r.test(s.text)));
      if (!first) { at(`glossary says "${t.t}" is taught here, but it never appears`); continue; }
      if (first.where === 'subtitle' || first.where.startsWith('question')) at(`"${t.t}" first appears in the ${first.where}, before it's explained`);
      else if (t.kind === 'concept' && !t.names.some(nm => new RegExp(`\\*\\*[^*]*${esc(nm)}[^*]*\\*\\*`, 'i').test(first.text))) at(`"${t.t}" is new here: its first mention (${first.where}) must be its bold definition`);
    }
    // C: at most 6 new concepts per puzzle.
    const concepts = here.filter(t => t.kind === 'concept');
    if (concepts.length > 6) at(`teaches ${concepts.length} new concepts (max 6): ${concepts.map(t => t.t).join(', ')}. Split the puzzle.`);
    // D: no jargon outside the glossary (code names, acronyms, CamelCase, snake_case).
    const unknown = new Set();
    for (const s of segs.filter(s => !s.code)) {
      for (const m of s.text.matchAll(/`([^`]+)`|\b([A-Z][a-z]+[A-Z]\w*)\b|\b([A-Z]{2,}s?)\b|\b([a-z0-9]+_[a-z0-9_]+)\b/g)) {
        const c = m[1] || m[2] || m[3] || m[4];
        if (c && !isKnown(c)) unknown.add(`${c} (${s.where})`);
      }
    }
    for (const u of unknown) at(`unknown term ${u}: add it to glossary.json with the puzzle that teaches it, or say it in plain words`);
    // E: jargon in plain words ("heap", "roots", "closure") still needs teaching or a link.
    for (const j of jargon) {
      if (known.has(j.toLowerCase())) continue;
      const rx = new RegExp(`(?<![\\w-])${esc(j)}s?(?![\\w-])`, 'i');
      const hit = segs.find(s => rx.test(s.text));
      if (hit) at(`uses "${j}" (${hit.where}) but never teaches it: add it to glossary "terms" (taught here or earlier) or "from" (another course's puzzle)`);
    }
    // E: words a beginner misreads or that hide who acts (glossary.json → avoid).
    for (const [phrase, fix] of Object.entries((g.avoid || {}).phrases || {})) {
      const rx = new RegExp(`(?<![\\w-])${esc(phrase)}(?![\\w-])`, 'i');
      const hit = segs.find(s => !s.code && rx.test(s.text));
      if (hit) at(`avoid "${phrase}" (${hit.where}): ${fix}`);
    }
  }
  return problems;
}

function text(id) {
  for (const p of loadCourse(id)) {
    console.log(`\n========== Puzzle ${p.n}: ${p.fm.title} ==========\n${p.fm.summary}\n`);
    for (const s of p.sections) {
      if (s.title === 'Sources') continue;
      console.log(`## ${s.title}`);
      for (const b of s.blocks) {
        if (b.type === 'code' && b.lang.startsWith('diagram')) {
          const d = p.diagrams.find(x => x.name === (b.text.trim() || b.lang.split(/\s+/)[1]));
          const svgText = [...(d?.src || '').matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(t => t[1]).join(' | ');
          console.log(`[DIAGRAM ${d?.name}] labels in the picture: ${svgText}`);
          d?.caps.forEach((c, i) => console.log(`  step ${i + 1}: ${plain(c)}`));
        } else if (s.title === 'Check yourself' && b.type === 'ul') {
          b.items.forEach((it, i) => { const q = parseQuestion(it); console.log(`  Q${i + 1}. ${q.q}`); const k = (p.n + i) % q.opts.length; [...q.opts.slice(k), ...q.opts.slice(0, k)].forEach((o, j) => console.log(`     ${'ABCD'[j]}) ${o.text}`)); });
        } else if (b.type === 'table') { console.log([b.head, ...b.rows].map(r => `| ${r.join(' | ')} |`).join('\n'));
        } else console.log(b.items ? b.items.map(x => `  - ${x}`).join('\n') : b.text);
      }
    }
  }
}

if (require.main === module) {
  const i = process.argv.indexOf('--text');
  if (i > 0) { text(process.argv[i + 1] || 'android'); return; }
  const problems = fs.readdirSync(SRC).filter(d => fs.existsSync(path.join(SRC, d, 'course.json'))).flatMap(id => [...lint(id), ...vocabulary(id, loadCourse(id))]);
  if (problems.length) { problems.forEach(p => console.error(p)); console.error(`\n${problems.length} clarity problem(s).`); process.exit(1); }
  console.log('Course clarity lint: clean.');
}

// The building blocks each puzzle stands on: the earlier puzzles whose terms it uses, reduced to the
// direct ones (if 13 uses 4 and 4 already uses 1, 13 lists 4, not 1). Computed from the glossary, so it
// can't go stale. Returns { n: [earlier n, …] }.
function blocks(id) {
  const g = JSON.parse(fs.readFileSync(path.join(SRC, id, 'glossary.json'), 'utf8'));
  const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const terms = Object.entries(g.terms).map(([t, v]) => ({ in: Number(v.in), rx: [t, ...(v.aliases || [])].map(nm => new RegExp(`(?<![\\w-])${esc(nm)}${/\w$/.test(nm) ? 's?' : ''}(?![\\w-])`, /[A-Z]/.test(nm) || /[(_.]/.test(nm) ? '' : 'i')) }));
  const puzzles = loadCourse(id);
  const direct = {};
  for (const p of puzzles) {
    const n = Number(p.f.slice(0, 2));
    const text = segments(p).filter(s => s.where !== 'title' && !s.where.startsWith('question')).map(s => s.text).join(' ');
    direct[n] = [...new Set(terms.filter(t => t.in < n && t.rx.some(r => r.test(text))).map(t => t.in))].sort((a, b) => a - b);
  }
  const closure = {};
  const reach = n => closure[n] || (closure[n] = new Set(direct[n].flatMap(d => [d, ...reach(d)])));
  const out = {};
  for (const n of Object.keys(direct).map(Number)) out[n] = direct[n].filter(d => !direct[n].some(e => e !== d && reach(e).has(d)));
  return out;
}

module.exports = { parseQuestion, lint, blocks };

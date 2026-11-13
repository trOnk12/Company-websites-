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
  return meta.modules.flatMap(m => m.puzzles).map((f, n) => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const { meta: fm, body } = L.parseFrontmatter(raw, f);
    const ctx = { file: f, cards: new Map(), links: new Set() };
    const sections = L.parseBody(body, ctx);
    const diagrams = sections.flatMap(s => s.blocks).filter(b => b.type === 'code' && b.lang.startsWith('diagram'))
      .map(b => {
        const name = b.text.trim() || b.lang.split(/\s+/)[1];
        const file = path.join(dir, 'diagrams', `${name}.html`);
        const src = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
        return { name, src, caps: [...src.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1]) };
      });
    return { n, f, raw, fm, sections, diagrams };
  });
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
      const perStep = {};
      for (const m of d.src.matchAll(/<(g|text)\b[^>]*class="[^"]*\b(?:s|only-)(\d)\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g)) {
        perStep[m[2]] = (perStep[m[2]] || 0) + words([...m[3].matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(t => t[1]).join(' ') || (m[1] === 'text' ? m[3] : ''));
      }
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
        } else console.log(b.items ? b.items.map(x => `  - ${x}`).join('\n') : b.text);
      }
    }
  }
}

if (require.main === module) {
  const i = process.argv.indexOf('--text');
  if (i > 0) { text(process.argv[i + 1] || 'android'); return; }
  const problems = fs.readdirSync(SRC).filter(d => fs.existsSync(path.join(SRC, d, 'course.json'))).flatMap(lint);
  if (problems.length) { problems.forEach(p => console.error(p)); console.error(`\n${problems.length} clarity problem(s).`); process.exit(1); }
  console.log('Course clarity lint: clean.');
}

module.exports = { parseQuestion, lint };

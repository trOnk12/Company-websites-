#!/usr/bin/env node
'use strict';

// Builds the learning log from _learning/*.md into learning/*.html and updates sitemap.xml.
// No dependencies: it supports only the small Markdown subset the cards use, and fails
// loudly on anything it would get wrong.
//
//   node scripts/build-learning.js           write the pages
//   node scripts/build-learning.js --check   exit 1 if the pages are out of date (used by the tests)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, '_learning');
const OUT = path.join(ROOT, 'learning');
const SITE = 'https://pachulski.dev';
// Anonymous, cookie-free visit counts (goatcounter.com). The no-JS pages load a 1×1 image; course.js sends its own.
const GOATCOUNTER = 'https://pachulski.goatcounter.com';
const STATUSES = ['seedling', 'budding', 'evergreen'];
const REQUIRED = ['The gap', 'The click', 'How I checked it', 'Check yourself', 'Sources'];

// The site is public, the notes it comes from are not. Anything that looks like a ticket key
// stops the build. Add your own terms, one per line, to _learning/.private-terms (git-ignored).
const TICKET_KEY = /\b[A-Z][A-Z0-9]{1,9}-\d{1,6}\b/g;
const NOT_TICKETS = new Set(['UTF', 'SHA', 'ISO', 'RFC', 'WCAG', 'ES', 'JSR', 'JEP', 'KT', 'CVE', 'MD', 'HTTP']);

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function fail(file, msg) {
  console.error(`${path.relative(ROOT, file)}: ${msg}`);
  process.exitCode = 1;
}

// ─── Parsing ──────────────────────────────────────────────────────────────

function parseFrontmatter(text, file) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error(`${file}: missing --- frontmatter ---`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    if (!line.trim()) continue;
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) throw new Error(`${file}: cannot read frontmatter line "${line}"`);
    let v = kv[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    meta[kv[1]] = v;
  }
  return { meta, body: text.slice(m[0].length) };
}

function inline(s, ctx) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s);
  s = s.replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (_, slug, label) => {
    const target = ctx.cards.get(slug);
    if (!target) { fail(ctx.file, `links to unknown card [[${slug}]]`); return label || slug; }
    ctx.links.add(slug);
    return `<a href="${slug}.html">${label || esc(target.meta.title)}</a>`;
  });
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[i])}</code>`);
}

// Splits the body into ## sections, each a list of blocks.
function parseBody(body, ctx) {
  const sections = [];
  let cur = null;
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^#\s/.test(line) || /^#{4,}\s/.test(line)) throw new Error(`${ctx.file}: only ## and ### headings are supported`);
    if (/^\|/.test(line)) throw new Error(`${ctx.file}: tables are not supported`);
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) { cur = { title: h2[1].trim(), blocks: [] }; sections.push(cur); continue; }
    if (!line.trim()) continue;
    if (!cur) throw new Error(`${ctx.file}: text before the first ## heading`);
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const code = [];
      while (++i < lines.length && !lines[i].startsWith('```')) code.push(lines[i]);
      if (i >= lines.length) throw new Error(`${ctx.file}: unclosed code fence`);
      cur.blocks.push({ type: 'code', lang, text: code.join('\n') });
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) { cur.blocks.push({ type: 'h3', text: h3[1] }); continue; }
    const li = line.match(/^(-|\d+\.)\s+(.*)$/);
    if (li) {
      const ordered = li[1] !== '-';
      const items = [li[2]];
      while (i + 1 < lines.length && /^(-|\d+\.)\s+/.test(lines[i + 1])) items.push(lines[++i].replace(/^(-|\d+\.)\s+/, ''));
      cur.blocks.push({ type: ordered ? 'ol' : 'ul', items });
      continue;
    }
    if (/^\s+\S/.test(line)) throw new Error(`${ctx.file}: nested lists and indented blocks are not supported`);
    const para = [line];
    while (i + 1 < lines.length && lines[i + 1].trim() && !/^(#|```|-\s|\d+\.\s|\|)/.test(lines[i + 1])) para.push(lines[++i]);
    cur.blocks.push({ type: 'p', text: para.join(' ') });
  }
  return sections;
}

function renderBlocks(blocks, ctx, { recall = false } = {}) {
  return blocks.map(b => {
    if (b.type === 'p') return `<p>${inline(b.text, ctx)}</p>`;
    if (b.type === 'h3') return `<h3>${inline(b.text, ctx)}</h3>`;
    if (b.type === 'code') return `<pre><code${b.lang ? ` class="language-${esc(b.lang)}"` : ''}>${esc(b.text)}</code></pre>`;
    if (recall) {
      // "Question::Answer" — the same syntax Obsidian's Spaced Repetition plugin reads.
      return b.items.map(it => {
        const [q, a] = it.split('::');
        if (!a) { fail(ctx.file, `"Check yourself" item needs Question::Answer: ${it}`); return ''; }
        return `<details class="recall"><summary>${inline(q.trim(), ctx)}</summary><p>${inline(a.trim(), ctx)}</p></details>`;
      }).join('\n');
    }
    return `<${b.type}>${b.items.map(it => `<li>${inline(it, ctx)}</li>`).join('')}</${b.type}>`;
  }).join('\n');
}

// ─── Checks ───────────────────────────────────────────────────────────────

function privateTerms() {
  const f = path.join(SRC, '.private-terms');
  if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
}

function checkCard(card, terms) {
  const { meta, sections, file, raw } = card;
  for (const k of ['title', 'date', 'status', 'summary']) if (!meta[k]) fail(file, `frontmatter needs ${k}`);
  if (meta.date && !/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) fail(file, 'date must be YYYY-MM-DD');
  if (meta.status && !STATUSES.includes(meta.status)) fail(file, `status must be one of ${STATUSES.join(', ')}`);
  if (!Array.isArray(meta.tags) || !meta.tags.length) fail(file, 'frontmatter needs tags: [a, b]');
  const titles = sections.map(s => s.title);
  for (const r of REQUIRED) if (!titles.includes(r)) fail(file, `missing section "## ${r}"`);
  const sources = sections.find(s => s.title === 'Sources');
  if (sources && !sources.blocks.some(b => b.items && b.items.some(i => /\]\(https:\/\//.test(i)))) {
    fail(file, 'Sources needs at least one https link');
  }
  for (const m of raw.matchAll(TICKET_KEY)) {
    if (!NOT_TICKETS.has(m[0].split('-')[0])) fail(file, `looks like a ticket key, keep it out of public notes: ${m[0]}`);
  }
  for (const t of terms) if (raw.toLowerCase().includes(t.toLowerCase())) fail(file, `contains a private term from .private-terms: ${t}`);
}

// ─── Pages ────────────────────────────────────────────────────────────────

const FAVICON = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='4' fill='%231B1F24'/><text x='16' y='21.5' font-family='Georgia,serif' font-size='14' font-weight='700' fill='%23F6F3EC' text-anchor='middle'>MP</text></svg>`;

function page({ title, description, canonical, body, image = `${SITE}/og-image.png`, imageAlt = 'Mateusz Pachulski – Senior Android &amp; KMP Engineer', base = '../', current = 'learning', feed = true, footer, script }) {
  const nav = [['Work', `${base}#work`], ['AI', `${base}#ai`], ['Course', `${base}course/`], ['Learning', `${base}learning/`], ['Contact', `${base}#contact`]]
    .map(([n, h]) => `<li><a href="${h}"${n.toLowerCase() === current ? ' aria-current="page"' : ''}>${n}</a></li>`).join('\n          ');
  return `<!DOCTYPE html>
<!-- Generated by scripts/build-learning.js from _learning/. Edit the Markdown, not this file. -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${esc(description)}">
  <meta name="author" content="Mateusz Pachulski">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="Mateusz Pachulski">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${imageAlt}">
  <meta name="twitter:card" content="summary_large_image">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src ${script ? "'self'" : "'none'"}; style-src 'self'; font-src 'self'; img-src 'self' data: ${GOATCOUNTER}; connect-src 'none'; base-uri 'self'; object-src 'none'; form-action 'none'">
  <title>${esc(title)}</title>
  <link rel="canonical" href="${canonical}">
${feed ? `  <link rel="alternate" type="application/atom+xml" title="Mateusz Pachulski – Learning" href="${base}learning/feed.xml">\n` : ''}  <link rel="icon" href="${FAVICON}">
  <link rel="preload" as="font" type="font/woff2" href="${base}fonts/atkinson-hyperlegible-next-var.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="${base}fonts/literata-600.woff2" crossorigin>
  <link rel="stylesheet" href="${base}style.css">${script ? `\n  <script src="${script}" defer></script>` : ''}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="${base}">Mateusz Pachulski</a>
      <nav aria-label="Sections">
        <ul class="nav-links">
          ${nav}
        </ul>
      </nav>
    </div>
  </header>

  <main id="main">
${body}
  </main>
  ${script ? '<noscript>' : ''}<img class="gc" src="${GOATCOUNTER}/count?p=${encodeURIComponent(new URL(canonical).pathname)}" alt="" width="1" height="1">${script ? '</noscript>' : ''}

  <footer class="site-footer">
    <div class="wrap footer-inner">
${footer || `      <p class="small">Drafted with AI from my own learning sessions. Each card says what I checked myself.</p>
      <p class="small"><a href="./">All learning cards</a> · <a href="feed.xml">Feed</a> · <a href="../">pachulski.dev</a></p>`}
    </div>
  </footer>
</body>
</html>
`;
}

function cardPage(card, ctx, backlinks) {
  const { meta, sections } = card;
  const body = sections.map(s => {
    const id = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `      <section aria-labelledby="${id}">
        <h2 id="${id}">${inline(s.title, ctx)}</h2>
${renderBlocks(s.blocks, ctx, { recall: s.title === 'Check yourself' })}
      </section>`;
  }).join('\n');
  const back = backlinks.length
    ? `      <section aria-labelledby="linked">
        <h2 id="linked">Linked from</h2>
        <ul>${backlinks.map(c => `<li><a href="${c.slug}.html">${esc(c.meta.title)}</a></li>`).join('')}</ul>
      </section>\n` : '';
  return page({
    title: `${meta.title} – Learning – Mateusz Pachulski`,
    description: meta.summary,
    canonical: `${SITE}/learning/${card.slug}`,
    image: `${SITE}/learning/og/${card.slug}.png`,
    imageAlt: esc(meta.title),
    body: `    <article class="card wrap narrow">
      <p class="eyebrow"><time datetime="${meta.date}">${meta.date}</time> · <span class="status status-${meta.status}">${meta.status}</span> · ${meta.tags.map(esc).join(', ')}</p>
      <h1>${esc(meta.title)}</h1>
      <p class="lede">${inline(meta.summary, ctx)}</p>
${body}
${back}    </article>`,
  });
}

function indexPage(cards) {
  const items = cards.map(c => `        <li class="log-entry">
          <p class="log-date"><time datetime="${c.meta.date}">${c.meta.date}</time></p>
          <div class="log-body">
            <h3><a href="${c.slug}.html">${esc(c.meta.title)}</a></h3>
            <p>${esc(c.meta.summary)}</p>
            <p class="small"><span class="status status-${c.meta.status}">${c.meta.status}</span> · ${c.meta.tags.map(esc).join(', ')}</p>
          </div>
        </li>`).join('\n');
  return page({
    title: 'Learning – Mateusz Pachulski',
    description: 'Short cards on things I learned as an Android engineer: the gap I had, what made it click, and how I checked it.',
    canonical: `${SITE}/learning/`,
    body: `    <section class="hero" aria-labelledby="learning-heading">
      <div class="wrap narrow">
        <p class="eyebrow">Learning log</p>
        <h1 id="learning-heading">Things I didn’t understand, until I did</h1>
        <p class="lede">I learn by finding the piece I’m missing and fitting it into what I already know. Each card is one of those pieces: the gap, what made it click, and how I checked it. They start as seedlings and grow when I come back to them.</p>
      </div>
    </section>
    <section class="section" aria-labelledby="cards-heading">
      <div class="wrap">
        <h2 id="cards-heading">Cards, newest first</h2>
        <ol class="log">
${items}
        </ol>
      </div>
    </section>`,
  });
}

function sitemap(cards) {
  const urls = [
    { loc: `${SITE}/`, freq: 'monthly', prio: '1.0' },
    { loc: `${SITE}/learning/`, freq: 'weekly', prio: '0.8' },
    ...cards.map(c => ({ loc: `${SITE}/learning/${c.slug}`, freq: 'monthly', prio: '0.6', mod: c.meta.date })),
    ...require('./build-course').courseUrls().map(loc => ({ loc, freq: 'monthly', prio: '0.7' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.mod ? `\n    <lastmod>${u.mod}</lastmod>` : ''}
    <changefreq>${u.freq}</changefreq>
    <priority>${u.prio}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

function feed(cards) {
  const updated = cards.length ? cards[0].meta.date : '2026-01-01';
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Mateusz Pachulski – Learning</title>
  <subtitle>Short cards on things I learned: the gap, what made it click, and how I checked it.</subtitle>
  <link href="${SITE}/learning/feed.xml" rel="self"/>
  <link href="${SITE}/learning/"/>
  <id>${SITE}/learning/</id>
  <updated>${updated}T00:00:00Z</updated>
  <author><name>Mateusz Pachulski</name></author>
${cards.map(c => `  <entry>
    <title>${esc(c.meta.title)}</title>
    <link href="${SITE}/learning/${c.slug}"/>
    <id>${SITE}/learning/${c.slug}</id>
    <updated>${c.meta.date}T00:00:00Z</updated>
    <summary>${esc(c.meta.summary)}</summary>
${c.meta.tags.map(t => `    <category term="${esc(t)}"/>`).join('\n')}
  </entry>`).join('\n')}
</feed>
`;
}

// ─── Main ─────────────────────────────────────────────────────────────────

function build() {
  const files = fs.readdirSync(SRC).filter(f => f.endsWith('.md') && f !== 'README.md').sort();
  const cards = new Map();
  for (const f of files) {
    const file = path.join(SRC, f);
    const raw = fs.readFileSync(file, 'utf8');
    const slug = f.replace(/\.md$/, '');
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`${f}: file name must be lowercase-with-dashes`);
    const { meta, body } = parseFrontmatter(raw, f);
    cards.set(slug, { slug, file, raw, meta, body });
  }
  const terms = privateTerms();
  const out = new Map();
  const linksFrom = new Map();
  const ctxs = new Map();
  for (const card of cards.values()) {
    const ctx = { file: card.file, cards, links: new Set() };
    card.sections = parseBody(card.body, ctx);
    checkCard(card, terms);
    ctxs.set(card.slug, ctx);
  }
  // Render once to collect [[links]], then again with backlinks known.
  for (const card of cards.values()) cardPage(card, ctxs.get(card.slug), []);
  for (const [slug, ctx] of ctxs) for (const to of ctx.links) {
    if (!linksFrom.has(to)) linksFrom.set(to, []);
    linksFrom.get(to).push(cards.get(slug));
  }
  const sorted = [...cards.values()].sort((a, b) => b.meta.date.localeCompare(a.meta.date) || a.slug.localeCompare(b.slug));
  for (const card of sorted) {
    const ctx = { file: card.file, cards, links: new Set() };
    out.set(path.join(OUT, `${card.slug}.html`), cardPage(card, ctx, linksFrom.get(card.slug) || []));
  }
  out.set(path.join(OUT, 'index.html'), indexPage(sorted));
  out.set(path.join(OUT, 'feed.xml'), feed(sorted));
  out.set(path.join(ROOT, 'sitemap.xml'), sitemap(sorted));
  return out;
}

function main() {
  const check = process.argv.includes('--check');
  let out;
  try { out = build(); } catch (e) { console.error(e.message); process.exit(1); }
  if (process.exitCode) process.exit(1);

  const stale = fs.existsSync(OUT)
    ? fs.readdirSync(OUT).map(f => path.join(OUT, f)).filter(f => /\.(html|xml)$/.test(f) && !out.has(f))
    : [];
  const changed = [...out].filter(([f, html]) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== html).map(([f]) => f);

  if (check) {
    if (changed.length || stale.length) {
      console.error('learning/ is out of date. Run: npm run build:learning');
      [...changed, ...stale].forEach(f => console.error(`  ${path.relative(ROOT, f)}`));
      process.exit(1);
    }
    console.log(`learning/ is up to date (${out.size - 3} cards).`);
    return;
  }
  fs.mkdirSync(OUT, { recursive: true });
  for (const [f, html] of out) fs.writeFileSync(f, html);
  for (const f of stale) fs.unlinkSync(f);
  console.log(`Built ${out.size - 3} cards into learning/.`);
}

module.exports = { build, SRC, ROOT, SITE, GOATCOUNTER, parseFrontmatter, parseBody, renderBlocks, inline, esc, page, privateTerms, TICKET_KEY, NOT_TICKETS };

if (require.main === module) main();

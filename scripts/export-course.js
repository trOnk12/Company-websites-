// Take a course with you.
//
// vault(course)  → an Obsidian vault as files: a course map, one note per puzzle with [[links]] to the
//                  puzzles it builds on (Obsidian's graph view becomes the course's map), flashcards in the
//                  Spaced Repetition plugin's "Question::Answer" format, and a glossary.
// zip(files)     → those files as a .zip (stored, not compressed, with a fixed date so builds are stable).
// tutor(course)  → what the "Continue with Claude" button needs to write a tutor prompt in the browser.

const L = require('./build-learning');
const { parseQuestion } = require('./lint-course');

const noteName = p => `${String(p.n).padStart(2, '0')} ${p.meta.title.replace(/[*"\\/<>:|?#^[\]]/g, '').trim().replace(/\.+$/, '')}`;
const url = (c, p) => `${L.SITE}/course/${c.id}/${p ? p.slug : ''}`;

function sections(body) {
  const out = [];
  for (const part of body.split(/^## /m).slice(1)) {
    const nl = part.indexOf('\n');
    out.push({ title: part.slice(0, nl).trim(), text: part.slice(nl + 1).trim() });
  }
  return out;
}

const plain = s => s.replace(/^\*/, '').trim();

function puzzleNote(c, p, blocks) {
  const on = (blocks[p.n] || []).map(n => c.puzzles[n]);
  const diagram = (p.body.match(/```diagram\s*(\S+)/) || [])[1];
  const lines = [
    '---',
    `course: "${c.meta.title}"`,
    `puzzle: ${p.n}`,
    `source: ${url(c, p)}`,
    `tags: [course/${c.id}]`,
    '---',
    '',
    `# ${p.meta.title}`,
    '',
    `> [!summary] The idea to keep`,
    `> ${p.meta.takeaway}`,
    '',
  ];
  if (on.length) lines.push(`**Builds on:** ${on.map(q => `[[${noteName(q)}]]`).join(' · ')}`, '');
  else if (p.n > 0 && c.meta.assumes) lines.push(`**Builds on:** what you know from [${c.meta.assumes.title}](${L.SITE}/${c.meta.assumes.href.replace(/^(\.\.\/)+/, '')})`, '');
  for (const s of sections(p.body)) {
    if (s.title === 'See it') {
      if (diagram) lines.push('## See it', '', `![${p.meta.title}](${L.SITE}/course/${c.id}/gifs/${diagram}.gif)`, '', `Step through it: ${url(c, p)}`, '');
    } else if (s.title === 'Check yourself') {
      lines.push('## Check yourself', '', `#flashcards/${c.id}`, '');
      for (const item of s.text.split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2))) {
        const q = parseQuestion(item);
        const right = q.opts.find(o => o.ok);
        if (right) lines.push(`${q.q}::${plain(right.text)}. ${q.why}`, '');
      }
    } else lines.push(`## ${s.title}`, '', s.text.replace(/^```sql run$/gm, '```sql'), '');
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

function vault(c, blocks) {
  const dir = c.meta.title.replace(/[*"\\/<>:|?#^[\]]/g, '').trim();
  const files = new Map();
  const g = c.glossary || { terms: {} };
  let i = 0;
  const modules = c.meta.modules.map(m => [`## ${m.title}`, '', m.blurb || '', '', ...m.puzzles.map(() => c.puzzles[i++]).map(p => `- [[${noteName(p)}]]: ${p.meta.summary}`), ''].join('\n'));
  const soon = (c.meta.upcoming || []).map(m => `- ${m.title} (coming): ${m.topics}`).join('\n');
  const chapters = c.chapters || [];
  const chapterLinks = chapters.map((ch, i) => `[[Practice chapter ${i + 1}|${ch.title}]]`);
  chapters.forEach((ch, i) => {
    const lessons = ch.lessons.flatMap(lesson => [
      `## ${lesson.title}`, lesson.explanation, '### Worked example', lesson.example,
      '### Try it', lesson.exercise, '### Compare your answer', lesson.answer,
      `[Source · ${lesson.sourceTitle}](${lesson.source})`
    ]);
    files.set(`${dir}/Practice chapter ${i + 1}.md`, [
      `# ${ch.title}`, ...lessons, chapterLinks[i + 1] || '[[Final project]]', '[[Course map]]'
    ].join('\n\n'));
  });
  files.set(`${dir}/Course map.md`, [
    '---', `source: ${url(c)}`, `tags: [course/${c.id}]`, '---', '',
    `# ${c.meta.title}`, '', c.meta.intro, '',
    `From [pachulski.dev](${url(c)}), free. Each note builds on the ones it links to: open the graph view to see the building blocks. The "Check yourself" lines are flashcards for the Spaced Repetition plugin.`, '',
    ...modules, ...(chapterLinks.length ? ['## Practice chapters', '', ...chapterLinks.map(l => '- ' + l), ''] : []), '[[Final project]]', '', soon ? `## Coming next\n\n${soon}\n` : '', '[[Glossary]]', '',
  ].join('\n'));
  const project = c.project;
  files.set(`${dir}/Final project.md`, [
    `# ${project.title}`, project.brief, '## Before you start', project.prerequisites, project.setup,
    '## Run the investigation', project.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
    '## Evidence to keep', project.evidence.map(s => `- ${s}`).join('\n'),
    '## Worked review', ...project.worked, '## Change one assumption', project.variation,
    '## Check your reasoning', project.solution, '[[Course map]]'
  ].join('\n\n'));
  for (const p of c.puzzles) files.set(`${dir}/${noteName(p)}.md`, puzzleNote(c, p, blocks));
  const terms = Object.entries(g.terms).sort((a, b) => Number(a[1].in) - Number(b[1].in) || a[0].localeCompare(b[0]));
  files.set(`${dir}/Glossary.md`, [
    `# Glossary: ${c.meta.title}`, '', `Every word the course teaches, in the order it does. #flashcards/${c.id}/words`, '',
    ...terms.map(([t, v]) => { const p = c.puzzles[Number(v.in)]; return `${t}::${v.def}${p ? ` (taught in [[${noteName(p)}]])` : ''}`; }).flatMap(l => [l, '']),
  ].join('\n'));
  return files;
}

// CRC-32, for the zip format.
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = buf => { let c = 0xFFFFFFFF; for (const b of buf) c = CRC[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

function zip(files) {
  const time = 0, date = ((2026 - 1980) << 9) | (1 << 5) | 1; // 2026-01-01 00:00, so the bytes don't change between builds
  const local = [], central = [];
  let offset = 0;
  for (const [name, text] of files) {
    const nm = Buffer.from(name, 'utf8');
    const data = Buffer.from(text, 'utf8');
    const crc = crc32(data);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(0, 8);
    h.writeUInt16LE(time, 10); h.writeUInt16LE(date, 12); h.writeUInt32LE(crc, 14);
    h.writeUInt32LE(data.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(nm.length, 26); h.writeUInt16LE(0, 28);
    local.push(h, nm, data);
    const e = Buffer.alloc(46);
    e.writeUInt32LE(0x02014b50, 0); e.writeUInt16LE(20, 4); e.writeUInt16LE(20, 6); e.writeUInt16LE(0x0800, 8); e.writeUInt16LE(0, 10);
    e.writeUInt16LE(time, 12); e.writeUInt16LE(date, 14); e.writeUInt32LE(crc, 16);
    e.writeUInt32LE(data.length, 20); e.writeUInt32LE(data.length, 24); e.writeUInt16LE(nm.length, 28);
    e.writeUInt32LE(offset, 42);
    central.push(e, nm);
    offset += 30 + nm.length + data.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.size, 8); end.writeUInt16LE(files.size, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, cd, end]);
}

function tutor(c) {
  const g = c.glossary || { terms: {} };
  return {
    title: c.meta.title,
    url: url(c),
    puzzles: c.puzzles.map(p => ({ n: p.n, title: p.meta.title, takeaway: p.meta.takeaway, url: url(c, p) })),
    chapters: (c.chapters || []).map(ch => ({
      title: ch.title, url: `${url(c)}${ch.slug}.html`, lessons: ch.lessons.map(lesson => lesson.title)
    })),
    project: { title: c.project.title, url: `${url(c)}final-project.html` },
    terms: Object.entries(g.terms).map(([t, v]) => ({ t, in: Number(v.in), def: v.def })),
    upcoming: (c.meta.upcoming || []).map(m => `${m.title}: ${m.topics}`),
    assumes: c.meta.assumes ? c.meta.assumes.title : '',
  };
}

module.exports = { vault, zip, tutor, noteName };

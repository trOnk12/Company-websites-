'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { teach, passages } = require('./server');

const rows = passages(readFileSync(path.resolve(__dirname, '../../_course/system-design/03-conditional-write.md'), 'utf8'));
const mock = pick => async (url, request) => {
  assert.equal(url, 'https://api.openai.com/v1/responses');
  const body = JSON.parse(request.body);
  assert.equal(body.store, false);
  assert.equal(body.text.format.strict, true);
  return { ok: true, json: async () => ({ output: [{ content: [{ type: 'output_text', text: JSON.stringify(pick) }] }] }) };
};

test('a grounded turn returns course-owned text and a published question', async () => {
  const idx = rows.findIndex(row => row.text.startsWith('PostgreSQL'));
  const q = rows.findIndex(row => row.question);
  assert.ok(idx >= 0 && q >= 0);
  const answer = await teach(rows, 'What does the second writer see?', '', mock({ passage: idx, followup: q, invented: 'ignore me' }));
  assert.deepEqual(answer, { text: rows[idx].text, anchor: 'the-building-block', followup: rows[q].question });
});

test('missing evidence and invalid selections cannot supply prose', async () => {
  for (const passage of [-1, 900, '1', null]) {
    assert.equal((await teach(rows, 'Uncovered question', '', mock({ passage, followup: 0 }))).anchor, 'sources');
  }
});

test('private server isolates the key and validates the session before a provider call', async t => {
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'synthetic-test-only';
  t.after(() => {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });
  let resolveReady;
  const address = new Promise(resolve => { resolveReady = resolve; });
  let calls = 0;
  const server = require('./server').start({ port: 0, provider: async (...args) => {
    calls++;
    return mock({ passage: 0, followup: -1 })(...args);
  }, ready: (port, code) => resolveReady({ base: 'http://127.0.0.1:' + port, code }) });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const { base, code } = await address;
  const page = await (await fetch(base + '/course/system-design/03-conditional-write.html')).text();
  assert.ok(page.includes('data-personal-tutor'));
  assert.ok(!page.includes(code) && !page.includes(process.env.OPENAI_API_KEY));
  const body = JSON.stringify({ course: 'system-design', slug: '03-conditional-write', question: 'Why?', previous: '' });
  const post = token => fetch(base + '/api/lesson-turn', { method: 'POST', headers: { 'X-Tutor-Session': token }, body });
  assert.equal((await post('invalid')).status, 403);
  assert.equal(calls, 0);
  const result = await post(code);
  assert.equal(result.status, 200);
  assert.equal((await result.json()).text, rows[0].text);
  assert.equal(calls, 1);
});

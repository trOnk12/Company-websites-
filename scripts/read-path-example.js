'use strict';

const examples = require('../labs/read-path/experiments');
const { esc } = require('./build-learning');

function getExample(key) {
  if (!Object.hasOwn(examples, key)) throw new Error('Unknown read-path example: ' + key);
  return examples[key];
}

function note(key) {
  const { run, variants } = getExample(key);
  const calls = variants.map(([label, args]) => {
    const parameters = args.map(a => JSON.stringify(a)).join(', ');
    return '// ' + label + '\nPromise.resolve(' + run.name + '(' + parameters + ')).then(console.table);';
  });
  return ['```javascript', run.toString(), '', ...calls, '```'].join('\n');
}

function render(key) {
  const { run, focus, variants } = getExample(key);
  const lines = run.toString().split('\n');
  const start = lines.findIndex(line => line.trimStart().startsWith(focus[0]));
  const end = lines.findIndex((line, i) => i >= start && line.trimStart().startsWith(focus[1]));
  if (start < 0 || end < start) throw new Error('Missing code excerpt in ' + key);
  const excerpt = lines.slice(start, end + 1);
  const indent = Math.min(...excerpt.filter(line => line.trim()).map(line => line.length - line.trimStart().length));
  return `<div class="read-path-example" data-read-path="${esc(key)}">
<pre><code class="language-javascript">${esc(excerpt.map(line => line.slice(indent)).join('\n'))}</code></pre>
<div data-controls hidden><div class="actions"><label>Scenario <select>${variants.map(([name], i) => `<option value="${i}">${esc(name)}</option>`).join('')}</select></label>
<button type="button" class="button">Run scenario</button></div>
<pre><code data-call></code></pre></div>
<p role="status" class="small"></p><div class="table-wrap" data-output></div>
<details class="course-extras"><summary>Read the complete runnable code</summary><pre><code class="language-javascript">${esc(run.toString())}</code></pre></details></div>`;
}

module.exports = { render, note };

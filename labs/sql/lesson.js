// The original code stays readable when JavaScript is disabled.
for (const exercise of document.querySelectorAll('[data-sql-exercise]')) {
  const original = exercise.querySelector('code').textContent;
  const editor = exercise.querySelector('textarea');
  const controls = exercise.querySelector('[data-sql-controls]');
  const run = controls.querySelector('[data-run]');
  const edit = controls.querySelector('[data-edit]');
  const reset = controls.querySelector('[data-reset]');
  const output = exercise.querySelector('[data-output]');
  const status = exercise.querySelector('[role="status"]');

  controls.hidden = false;
  editor.value = original;
  edit.onclick = () => {
    exercise.querySelector('pre').hidden = true;
    editor.parentElement.hidden = false;
    edit.hidden = true;
    reset.hidden = false;
    editor.focus();
  };
  reset.onclick = () => {
    editor.value = original;
    output.replaceChildren();
    status.textContent = 'Original SQL restored.';
    editor.focus();
  };
  run.onclick = () => {
    run.disabled = true;
    edit.disabled = true;
    reset.disabled = true;
    editor.readOnly = true;
    output.replaceChildren();
    status.textContent = 'Running in a fresh SQLite database…';
    let worker;
    let timer;
    function finish(message) {
      clearTimeout(timer);
      if (worker) worker.terminate();
      run.disabled = false;
      edit.disabled = false;
      reset.disabled = false;
      editor.readOnly = false;
      status.textContent = message;
    }
    try {
      worker = new Worker('/labs/sql/worker.js');
      timer = setTimeout(() => finish('Stopped after 15 seconds. Shorten the query and run again.'), 15000);
      worker.onerror = () => finish('SQLite could not start. Run again to retry.');
      worker.onmessage = ({ data }) => {
        if (data.error) return finish('SQLite: ' + data.error);
        for (const [index, result] of data.results.entries()) {
          const table = document.createElement('table');
          const count = result.rows.length;
          const amount = result.truncated ? 'first ' + count + ' rows' : count + (count === 1 ? ' row' : ' rows');
          table.createCaption().textContent = 'Result ' + (index + 1) + ' · ' + amount;
          const head = table.createTHead().insertRow();
          for (const name of result.columns) {
            const cell = document.createElement('th');
            cell.scope = 'col';
            cell.textContent = name;
            head.append(cell);
          }
          const body = table.createTBody();
          for (const values of result.rows) {
            const row = body.insertRow();
            for (const value of values) row.insertCell().textContent = value;
          }
          const box = document.createElement('div');
          box.className = 'table-wrap';
          box.append(table);
          if (!result.rows.length) box.append('No rows matched.');
          output.append(box);
        }
        finish(data.results.length ? 'Finished. Query results follow.' : 'Finished. Add a SELECT to inspect the rows.');
      };
      worker.postMessage(editor.value);
    } catch {
      finish('SQLite could not start. Run again to retry.');
    }
  };
}

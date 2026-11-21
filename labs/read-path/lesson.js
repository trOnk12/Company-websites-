'use strict';

for (const box of document.querySelectorAll('[data-read-path]')) {
  const example = readPathExamples[box.dataset.readPath];
  const select = box.querySelector('select');
  const run = box.querySelector('button');
  const output = box.querySelector('[data-output]');
  const status = box.querySelector('[role="status"]');
  const call = box.querySelector('[data-call]');
  const args = () => example.variants[Number(select.value)][1];
  function updateCall() {
    call.textContent = example.run.name + '(' + args().map(a => JSON.stringify(a)).join(', ') + ')';
    output.replaceChildren();
    status.textContent = '';
  }
  updateCall();
  box.querySelector('[data-controls]').hidden = false;
  select.addEventListener('change', updateCall);
  run.addEventListener('click', async () => {
    run.disabled = true;
    select.disabled = true;
    try {
      const rows = await example.run(...args());
      const table = document.createElement('table');
      const head = table.createTHead().insertRow();
      for (const key of Object.keys(rows[0])) {
        const cell = document.createElement('th');
        cell.scope = 'col';
        cell.textContent = key;
        head.append(cell);
      }
      const body = table.createTBody();
      for (const values of rows) {
        const row = body.insertRow();
        for (const value of Object.values(values)) row.insertCell().textContent = value;
      }
      output.replaceChildren(table);
      status.textContent = select.selectedOptions[0].textContent + ' completed.';
    } finally {
      run.disabled = false;
      select.disabled = false;
    }
  });
}

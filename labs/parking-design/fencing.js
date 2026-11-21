(() => {
  const section = document.getElementById('a-paused-worker-publishes-an-old-parking-count');
  if (!section) return;

  const form = document.createElement('form');
  form.innerHTML = `
    <label>Write rule <select name="rule">
      <option value="ordinary">Ordinary update</option>
      <option value="guarded">Require the active generation</option>
    </select></label>
    <label>First write after handoff <select name="first">
      <option value="B">B, the current owner</option>
      <option value="A">A, the previous owner</option>
    </select></label>
    <button class="button primary" type="submit">Replay the handoff</button>`;
  const output = document.createElement('output');
  output.setAttribute('aria-live', 'polite');
  output.hidden = true;
  section.querySelector('details').before(form, output);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const activeGeneration = 2;
    const writes = [
      {worker: 'A', generation: 1, value: 'open'},
      {worker: 'B', generation: 2, value: 'full'},
    ];
    if (form.elements.first.value === 'B') writes.reverse();
    let display = 'unknown';
    const trace = ['Ownership transferred to generation 2.'];
    for (const write of writes) {
      const accepted = form.elements.rule.value === 'ordinary' || write.generation === activeGeneration;
      if (accepted) display = write.value;
      trace.push(write.worker + ' (generation ' + write.generation + '): ' +
        (accepted ? '1 row changed' : '0 rows changed') + ', display = ' + display);
    }
    output.textContent = trace.join('\n');
    output.hidden = false;
  });
})();
